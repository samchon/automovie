import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairEnvelope } from "./humanFaceHairEnvelope";
import { humanFaceHairPartOccupancy } from "./humanFaceHairPartOccupancy";
import { humanFaceHairlineCoverage } from "./humanFaceHairlineCoverage";

/**
 * Compile the shared scalp tint rule: under a hair population the scalp
 * takes the colour of the hair that grows from it, so skin does not show
 * between ribbons that stand for a hundred fibres each. The rule reads only
 * what the document already declares for its hair.
 *
 * For every layer with roots, each vertex of the layer's growth domain gets
 * a coverage in [0, 1]: one well inside the hairline, rising smoothly across
 * the transition zone at the hairline (its depth converted to a polar angle
 * at the vertex's distance from the domain origin), times the layer's root
 * region envelope, so a fringe tints only where its roots grow, times what the
 * layer's parting leaves bare (`humanFaceHairPartOccupancy`), so the scalp keeps
 * its own colour along a parting where the combing has taken the fibres away.
 * Where layers overlap the greatest coverage weight wins, retaining the earlier
 * layer at a tie; a greying layer contributes
 * the mixture its proportion of unpigmented fibres makes, since that is what
 * stands over the scalp. The tint is a multiplier
 * on the skin's own finish at that vertex, `1 + (hair / skin - 1) * coverage`
 * per channel, clamped to [0, 1] like every pigmentation gain, so a
 * document's material override of the skin or the hair is respected and a
 * hair lighter than the skin leaves the skin as it is. Coverage is read on
 * the neutral, like the roots, and follows the face through shape and
 * expression by vertex identity.
 *
 * The returned function yields, per surface id, one RGB gain triple per
 * vertex, or nothing for a document without hair.
 *
 * @evidence contracts/common.md#principled-implementation Under a layer the
 *   skin gain is 1 + (hair / skin - 1) * coverage per channel, clamped to [0,
 *   1], with coverage the hairline ramp times the root-region envelope times one
 *   minus the parting's bare share, so it is a per-vertex coverage proxy rather
 *   than sampled root occupancy or sampled ribbons, and a hair
 *   lighter than the skin leaves the skin alone. A greying layer contributes
 *   hair + (1 - hair) * grey, the mixture of unpigmented and pigmented fibres.
 *   The greatest coverage weight wins where layers overlap, retaining the
 *   earlier layer at a tie. It assumes hair colour and the
 *   skin's base colour are in the same linear RGB, as the finish is documented.
 * @evidence contracts/common.md#clear-and-simple-design One compiled rule
 *   reading only what the document declares, returning per-vertex gains that the
 *   builder multiplies into the skin finish, so no second colour path exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject: the tint follows the layer's hairline, region and colour
 *   by the same formula.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the coverage, the gain formula, overlap and grey handling, and that the
 *   neutral coverage follows the face by vertex identity.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It returns one gain
 *   triple per growth-domain vertex and emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Positions are neutral
 *   head-frame metres, the domain origin is the same frame, coverage is
 *   dimensionless, and gains are dimensionless multipliers of linear RGB;
 *   nothing is converted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function returns
 *   colour gains on an existing surface and constructs no geometric join.
 *   The sampler's hard polar boundary and the tint's smooth coverage ramp both
 *   read humanFaceHairlineBoundary, but that does not make their sampled visual
 *   boundaries identical or certify a seam-free assembled hairstyle.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries
 *   no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function createHumanFaceScalpTint(
  basis: IAutoMovieHumanFaceBasis,
): (
  hair: IAutoMovieHumanFaceHair | null | undefined,
  materials: readonly IAutoMovieMaterial[],
) => Map<string, number[]> {
  const domains = new Map(
    basis.surfaces.map((surface) => {
      const byId = new Map(
        (surface.hairDomains ?? []).map((domain) => {
          const vertices = new Set<number>();
          for (const triangle of domain.triangles)
            for (let corner = 0; corner < 3; corner++)
              vertices.add(surface.indices[3 * triangle + corner]);
          return [
            domain.id,
            { origin: domain.origin, vertices: [...vertices] },
          ];
        }),
      );
      const material = new Map<number, string>();
      for (const region of [...surface.regions].reverse())
        for (const vertex of region.indices)
          material.set(vertex, region.material);
      return [surface.id, { surface, byId, material }] as const;
    }),
  );
  return (hair, materials) => {
    const tints = new Map<string, number[]>();
    if (hair === undefined || hair === null) return tints;
    const finishes = new Map(
      materials.map((material) => [material.id, material.baseColor]),
    );
    const best = new Map<
      string,
      { weight: Float64Array; colour: number[][] }
    >();
    for (const layer of hair.layers) {
      if (layer.count === 0) continue;
      const source = domains.get(layer.surface);
      const domain = source?.byId.get(layer.domain);
      if (source === undefined || domain === undefined) continue;
      const positions = source.surface.positions;
      let entry = best.get(layer.surface);
      if (entry === undefined) {
        entry = {
          weight: new Float64Array(positions.length / 3),
          colour: [],
        };
        best.set(layer.surface, entry);
      }
      const origin = Vector3.create(...domain.origin);
      for (const vertex of domain.vertices) {
        const point = Vector3.create(
          positions[3 * vertex],
          positions[3 * vertex + 1],
          positions[3 * vertex + 2],
        );
        const direction = Vector3.subtract(point, origin);
        if (!(Vector3.length(direction) > 0)) continue;
        // A parting is the one place the document itself takes fibres away.
        const bare =
          layer.part === undefined
            ? 0
            : humanFaceHairPartOccupancy(point, layer.part);
        const coverage =
          humanFaceHairlineCoverage(direction, layer.hairline) *
          humanFaceHairEnvelope(point, layer.rootRegion) *
          (1 - bare);
        if (coverage <= 0) continue;
        if (coverage <= entry.weight[vertex]) continue;
        entry.weight[vertex] = coverage;
        // The scalp under a greying head sees the mixture, not the pigment:
        // that proportion of the fibres over it is unpigmented.
        const grey = layer.finish.grey ?? 0;
        entry.colour[vertex] =
          grey === 0
            ? layer.finish.color
            : layer.finish.color.map((value) => value + (1 - value) * grey);
      }
    }
    for (const [surfaceId, entry] of best) {
      const source = domains.get(surfaceId)!;
      const gains: number[] = [];
      for (let vertex = 0; vertex < entry.weight.length; vertex++) {
        const coverage = entry.weight[vertex];
        const skin = finishes.get(source.material.get(vertex) ?? "");
        if (coverage === 0 || skin === undefined) {
          gains.push(1, 1, 1);
          continue;
        }
        const hairColour = entry.colour[vertex];
        const base = [skin.r, skin.g, skin.b];
        for (let channel = 0; channel < 3; channel++) {
          const ratio =
            base[channel] > 0 ? hairColour[channel] / base[channel] : 1;
          gains.push(Math.min(1, Math.max(0, 1 + (ratio - 1) * coverage)));
        }
      }
      tints.set(surfaceId, gains);
    }
    return tints;
  };
}
