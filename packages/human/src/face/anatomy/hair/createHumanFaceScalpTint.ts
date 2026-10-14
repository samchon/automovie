import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface,
  IAutoMovieHumanFaceHairDomain as ImportedIAutoMovieHumanFaceHairDomain,
} from "@automovie/human";
import type {
  IAutoMovieMaterial,
  IAutoMovieColor as ImportedIAutoMovieColor,
  IAutoMovieVector3 as ImportedIAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairEnvelope } from "./humanFaceHairEnvelope";
import { humanFaceHairPartOccupancy } from "./humanFaceHairPartOccupancy";
import { humanFaceHairlineCoverage } from "./humanFaceHairlineCoverage";

/**
 * Compile the shared scalp tint rule: under a hair population the scalp takes the colour of the hair that grows from it, so skin does not show between ribbons that stand for a hundred fibres each. The rule reads only what the document already declares for its hair.
 *
 * For every layer with roots, each vertex of the layer's growth domain gets a coverage in [0, 1]: one well inside the hairline, rising smoothly across the transition zone at the hairline (its depth converted to a polar angle at the vertex's distance from the domain origin), times the layer's root region envelope, so a fringe tints only where its roots grow, times what the layer's parting leaves bare (`humanFaceHairPartOccupancy`), so the scalp keeps its own colour along a parting where the combing has taken the fibres away. Where layers overlap the greatest coverage weight wins, retaining the earlier layer at a tie; a greying layer contributes the mixture its proportion of unpigmented fibres makes, since that is what stands over the scalp. The tint is a multiplier on the skin's own finish at that vertex, `1 + (hair / skin - 1) * coverage` per channel, clamped to [0, 1] like every pigmentation gain, so a document's material override of the skin or the hair is respected and a hair lighter than the skin leaves the skin as it is. Coverage is read on the neutral, like the roots, and follows the face through shape and expression by vertex identity.
 *
 * The returned function yields, per surface id, one RGB gain triple per vertex, or nothing for a document without hair.
 *
 * @evidence contracts/common.md#principled-implementation Neutral domain coverage, root envelopes and part occupancy select each vertex's strongest layer colour multiplier.
 * @evidence contracts/common.md#clear-and-simple-design Vertex identity transfers the static tint through face deformation while resident skin material determines the gain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing domains or skin finishes currently leave vertices untinted; this visual coverage proxy is not measured follicle density.
 * @evidence contracts/common.md#meaningful-documentation Earlier layers win equal coverage and gains are clamped to the pigmentation convention rather than recolouring lighter hair over darker skin.
 * @evidence contracts/performance.md#efficient-algorithms Compilation scans domain triangles and regions; evaluation scans relevant layer vertices and resulting surface vertices.
 * @evidence contracts/performance.md#reuse-equivalent-work Domain vertex sets and material assignments are compiled once; per-evaluation finish maps avoid repeated palette searches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure borrows basis surface data, while best-weight arrays and returned gain buffers belong to each evaluation.
 */
export function createHumanFaceScalpTint(
  basis: IAutoMovieHumanFaceBasis,
): (
  hair: IAutoMovieHumanFaceHair | null | undefined,
  materials: readonly IAutoMovieMaterial[],
) => Map<string, number[]> {
  const domains: Map<
    string,
    {
      readonly surface: ImportedIAutoMovieHumanFaceBasisSurface;
      readonly byId: Map<
        string,
        { origin: [number, number, number]; vertices: number[] }
      >;
      readonly material: Map<number, string>;
    }
  > = new Map(
    basis.surfaces.map(
      (
        surface: ImportedIAutoMovieHumanFaceBasisSurface,
      ): readonly [
        string,
        {
          readonly surface: ImportedIAutoMovieHumanFaceBasisSurface;
          readonly byId: Map<
            string,
            { origin: [number, number, number]; vertices: number[] }
          >;
          readonly material: Map<number, string>;
        },
      ] => {
        const byId: Map<
          string,
          { origin: [number, number, number]; vertices: number[] }
        > = new Map(
          (surface.hairDomains ?? []).map(
            (
              domain: ImportedIAutoMovieHumanFaceHairDomain,
            ): [
              string,
              { origin: [number, number, number]; vertices: number[] },
            ] => {
              const vertices: Set<number> = new Set<number>();
              for (const triangle of domain.triangles)
                for (let corner: number = 0; corner < 3; corner++)
                  vertices.add(surface.indices[3 * triangle + corner]);
              return [
                domain.id,
                { origin: domain.origin, vertices: [...vertices] },
              ];
            },
          ),
        );
        const material: Map<number, string> = new Map<number, string>();
        for (const region of [...surface.regions].reverse())
          for (const vertex of region.indices)
            material.set(vertex, region.material);
        return [surface.id, { surface, byId, material }] as const;
      },
    ),
  );
  return (
    hair: IAutoMovieHumanFaceHair | null | undefined,
    materials: readonly IAutoMovieMaterial[],
  ): Map<string, number[]> => {
    const tints: Map<string, number[]> = new Map<string, number[]>();
    if (hair === undefined || hair === null) return tints;
    const finishes: Map<string, ImportedIAutoMovieColor> = new Map(
      materials.map(
        (material: IAutoMovieMaterial): [string, ImportedIAutoMovieColor] => [
          material.id,
          material.baseColor,
        ],
      ),
    );
    const best: Map<string, { weight: Float64Array; colour: number[][] }> =
      new Map<string, { weight: Float64Array; colour: number[][] }>();
    for (const layer of hair.layers) {
      if (layer.count === 0) continue;
      const source:
        | {
            readonly surface: ImportedIAutoMovieHumanFaceBasisSurface;
            readonly byId: Map<
              string,
              { origin: [number, number, number]; vertices: number[] }
            >;
            readonly material: Map<number, string>;
          }
        | undefined = domains.get(layer.surface);
      const domain:
        | { origin: [number, number, number]; vertices: number[] }
        | undefined = source?.byId.get(layer.domain);
      if (source === undefined || domain === undefined) continue;
      const positions: number[] = source.surface.positions;
      let entry: { weight: Float64Array; colour: number[][] } | undefined =
        best.get(layer.surface);
      if (entry === undefined) {
        entry = {
          weight: new Float64Array(positions.length / 3),
          colour: [],
        };
        best.set(layer.surface, entry);
      }
      const origin: ImportedIAutoMovieVector3 = Vector3.create(
        ...domain.origin,
      );
      for (const vertex of domain.vertices) {
        const point: ImportedIAutoMovieVector3 = Vector3.create(
          positions[3 * vertex],
          positions[3 * vertex + 1],
          positions[3 * vertex + 2],
        );
        const direction: ImportedIAutoMovieVector3 = Vector3.subtract(
          point,
          origin,
        );
        if (!(Vector3.length(direction) > 0)) continue;
        // A parting is the one place the document itself takes fibres away.
        const bare: number =
          layer.part === undefined
            ? 0
            : humanFaceHairPartOccupancy(point, layer.part);
        const coverage: number =
          humanFaceHairlineCoverage(direction, layer.hairline) *
          humanFaceHairEnvelope(point, layer.rootRegion) *
          (1 - bare);
        if (coverage <= 0) continue;
        if (coverage <= entry.weight[vertex]) continue;
        entry.weight[vertex] = coverage;
        // The scalp under a greying head sees the mixture, not the pigment:
        // that proportion of the fibres over it is unpigmented.
        const grey: number = layer.finish.grey ?? 0;
        entry.colour[vertex] =
          grey === 0
            ? layer.finish.color
            : layer.finish.color.map(
                (value: number): number => value + (1 - value) * grey,
              );
      }
    }
    for (const [surfaceId, entry] of best) {
      const source: {
        readonly surface: ImportedIAutoMovieHumanFaceBasisSurface;
        readonly byId: Map<
          string,
          { origin: [number, number, number]; vertices: number[] }
        >;
        readonly material: Map<number, string>;
      } = domains.get(surfaceId)!;
      const gains: number[] = [];
      for (let vertex: number = 0; vertex < entry.weight.length; vertex++) {
        const coverage: number = entry.weight[vertex];
        const skin: ImportedIAutoMovieColor | undefined = finishes.get(
          source.material.get(vertex) ?? "",
        );
        if (coverage === 0 || skin === undefined) {
          gains.push(1, 1, 1);
          continue;
        }
        const hairColour: number[] = entry.colour[vertex];
        const base: number[] = [skin.r, skin.g, skin.b];
        for (let channel: number = 0; channel < 3; channel++) {
          const ratio: number =
            base[channel] > 0 ? hairColour[channel] / base[channel] : 1;
          gains.push(Math.min(1, Math.max(0, 1 + (ratio - 1) * coverage)));
        }
      }
      tints.set(surfaceId, gains);
    }
    return tints;
  };
}
