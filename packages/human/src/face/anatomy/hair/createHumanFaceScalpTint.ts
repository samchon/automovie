import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairEnvelope } from "./humanFaceHairEnvelope";
import { humanFaceHairlineBoundary } from "./humanFaceHairlineBoundary";

/**
 * The depth of the hairline's transition zone, over which hair density rises
 * from the first sparse single hairs to the full scalp density: 2 to 3 cm in
 * the hair restoration literature recorded in the project's hair research
 * note; the shallow end is used, so a hairline reads crisp rather than
 * receding.
 */
const HAIRLINE_TRANSITION_METRES = 0.02;

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
 * region envelope, so a fringe tints only where its roots grow. Where
 * layers overlap the densest layer's colour wins. The tint is a multiplier
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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Derives the scalp colour under hair from the hair parameters every document already carries, with no per-person paint.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Ramps coverage across the hairline transition, weights it by the root region and multiplies the skin finish toward the hair colour.
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
        const distance = Vector3.length(direction);
        if (!(distance > 0)) continue;
        const polar = Math.acos(
          Math.max(-1, Math.min(1, direction.y / distance)),
        );
        const inside =
          (humanFaceHairlineBoundary(direction, layer.hairline) - polar) /
          (HAIRLINE_TRANSITION_METRES / distance);
        if (inside <= 0) continue;
        const ramp = Math.min(1, inside);
        const coverage =
          ramp *
          ramp *
          (3 - 2 * ramp) *
          humanFaceHairEnvelope(point, layer.rootRegion);
        if (coverage <= entry.weight[vertex]) continue;
        entry.weight[vertex] = coverage;
        entry.colour[vertex] = layer.finish.color;
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
