/**
 * Paving depths and the sloped-connector surface used by the site paving owners.
 *
 * Design owner: `docs/spaces/site/01-paving-support.md`
 * (`paving-depth-reservation`): the three walking surfaces reserve 0.12 m of
 * base below their top, the driveway 0.15 m. A connector whose top blends two
 * different edge heights is a bilinear surface; the owner splits each sloped
 * run into at least four parts along X and Z so the two-triangle difference
 * stays under about 0.00083 m, and every cell is two triangles whose corners
 * are shared with their neighbours. This helper emits no surface of its own.
 */
import { part, slopedSlab, type IHousePart } from "../solids";
import type { IAutoMovieHeightRule } from "@automovie/interface";

/** Base depth below a walking surface, metres. */
/**
 * @evidence spaces/site/01-paving-support.md WALK_DEPTH is the reserved base under the three pedestrian paving surfaces.
 * @evidence spaces/site/01-paving-support.md#paving-depth-reservation Its 0.12 m depth differs from the driveway base while remaining shared by walk and terrace builders.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a support depth, not a visible walking level or terrain foundation.
 * @evidence principles/core/source-units.md#source-substantive-completion The numeric value gives each walking slab a definite lower face.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The paving parent fixes the pedestrian 0.12 m band; no new support thickness was added.
 */
export const WALK_DEPTH = 0.12;
/** Base depth below the driveway surface, metres. */
/**
 * @evidence spaces/site/01-paving-support.md DRIVE_DEPTH reserves a thicker base below the sloping driveway.
 * @evidence principles/core/source-units.md#source-scope-preservation This 0.15 m offset changes only the driveway underside, leaving pedestrian paving at WALK_DEPTH.
 * @evidence principles/core/source-units.md#source-substantive-completion buildDriveway receives a concrete vertical slab thickness at every ramp point.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The paving parent distinguishes drive depth from walk depth; this constant reflects that allocation.
 */
export const DRIVE_DEPTH = 0.15;

/** The bilinear rule sampled from the same height callback as the paving mesh.
 * @evidence spaces/site/01-paving-support.md The connector's standable rule samples the same X/Z function as its opaque paving.
 * @evidence principles/core/source-units.md#source-scope-preservation The rule records the caller's paving height without a second level decision.
 * @evidence principles/core/source-units.md#source-substantive-completion Four samples reproduce the bilinear connector at every surface query.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The paving support design already requires one shared height formula.
 */
export const pavingHeightfield = (
  x: readonly [number, number],
  z: readonly [number, number],
  height: (x: number, z: number) => number,
): IAutoMovieHeightRule => ({
  kind: "heightfield",
  originX: x[0],
  originZ: z[0],
  spacingX: x[1] - x[0],
  spacingZ: z[1] - z[0],
  columns: 2,
  rows: 2,
  samples: [height(x[0], z[0]), height(x[1], z[0]), height(x[0], z[1]), height(x[1], z[1])],
});

/**
 * A sloped run over X = `x`, Z = `z` whose top is `height(x, z)`, emitted as
 * `cells × cells` quads split into triangles, each a prism of `depth`.
 */
/**
 * @evidence spaces/site/01-paving-support.md blendedRun constructs sloped paving between different edge heights without a nonplanar quad.
 * @evidence principles/core/source-units.md#source-scope-preservation It receives its bounds and height callback from the calling walk owner and emits no independent path.
 * @evidence principles/core/source-units.md#source-substantive-completion The four-by-four default grid yields paired triangular prisms with shared sampled corners and stable ids.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The paving parent requires a subdivided bilinear connector; this helper needed no new surface endpoint.
 */
export const blendedRun = (props: {
  id: string;
  owner: string;
  color: number;
  x: readonly [number, number];
  z: readonly [number, number];
  height: (x: number, z: number) => number;
  depth: number;
  cells?: number;
}): IHousePart[] => {
  const n = props.cells ?? 4;
  const xs = Array.from(
    { length: n + 1 },
    (_, i) => props.x[0] + ((props.x[1] - props.x[0]) * i) / n,
  );
  const zs = Array.from(
    { length: n + 1 },
    (_, i) => props.z[0] + ((props.z[1] - props.z[0]) * i) / n,
  );
  const parts: IHousePart[] = [];
  for (let i = 0; i < n; ++i)
    for (let j = 0; j < n; ++j) {
      const p00 = { x: xs[i]!, z: zs[j]! };
      const p10 = { x: xs[i + 1]!, z: zs[j]! };
      const p11 = { x: xs[i + 1]!, z: zs[j + 1]! };
      const p01 = { x: xs[i]!, z: zs[j + 1]! };
      // Each triangle's three corners are planar by construction, so the
      // bilinear height sampled at them defines its top exactly.
      for (const [k, tri] of [[p00, p10, p11], [p00, p11, p01]].entries())
        parts.push(
          part(
            `${props.id}-${i}-${j}-${k}`,
            props.owner,
            "paving",
            props.color,
            slopedSlab({ plan: tri, top: props.height, thickness: props.depth }),
          ),
        );
    }
  return parts;
};
