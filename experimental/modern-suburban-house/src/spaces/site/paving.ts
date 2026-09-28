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
import { slopedSlab } from "../solids";
import { part, type IHousePart, type IPlanPoint } from "../solid-records";
import type {
  IAutoMovieHeightRule,
  IAutoMovieVector3,
} from "@automovie/interface";

const CONNECTOR_CELLS = 4;
const edgeAt = (a: number, b: number, value: number): boolean =>
  Math.abs(a - value) < 1e-8 && Math.abs(b - value) < 1e-8;

/** Keep only the outside sides of a paving rectangle; omit a caller-owned joined edge.
 * @evidence spaces/site/01-paving-support.md This helper keeps the T-walk and three side-walk bands free of sides inside each union.
 * @evidenceReview spaces/site/01-paving-support.md #bcad46a pavingFreeEdge classifies the caller's rectangle perimeter while allowing its joined predicate to omit internal sides in both the T-shaped front walk and three-band side walk.
 * @evidence spaces/site/01-paving-support.md#paving-depth-reservation The T-walk and three side-walk bands have no vertical side inside their union.
 * @evidenceReview spaces/site/01-paving-support.md#paving-depth-reservation #08ee5c7 The paving-depth target forbids side faces inside joined walk bands; pavingFreeEdge returns false where the calling owner's joined predicate identifies such an internal contact.
 * @evidence principles/core/source-units.md#source-scope-preservation The caller's X/Z bounds and joined-edge predicate decide the perimeter; this helper assigns no new paving area.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 pavingFreeEdge receives its rectangle bounds and joined predicate from the walk owner; it chooses side closure without setting a new X/Z footprint or paving grade.
 * @evidence principles/core/source-units.md#source-substantive-completion The returned predicate closes outer slab edges while rejecting cell seams and joined flat-band sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Its returned predicate accepts outer straight boundary edges and rejects both nonperimeter cell seams and caller-marked joined segments, giving slopedSlab a determinate side-face rule.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-depth-reservation forbids fake union-internal side faces; pavingFreeEdge classifies only the caller's rectangle perimeter and removes its declared same-union contact.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Paving-depth-reservation requires no fake vertical sides within the two walk unions; pavingFreeEdge tests the caller's perimeter and joined contact directly, so that requirement needs no new parent boundary.
 */
export const pavingFreeEdge = (
  x: readonly [number, number],
  z: readonly [number, number],
  joined: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean = () => false,
): ((a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean) =>
  (a, b) => (
    edgeAt(a.x, b.x, x[0]) || edgeAt(a.x, b.x, x[1]) ||
    edgeAt(a.z, b.z, z[0]) || edgeAt(a.z, b.z, z[1])
  ) && !joined(a, b);

/** Base depth below a walking surface, metres. */
/**
 * @evidence spaces/site/01-paving-support.md WALK_DEPTH is the reserved base under the three pedestrian paving surfaces.
 * @evidenceReview spaces/site/01-paving-support.md #bcad46a WALK_DEPTH supplies the 0.12 m vertical base reservation used by the front walk, side walk and terrace lower landing beneath their walking tops.
 * @evidence spaces/site/01-paving-support.md#paving-depth-reservation Its 0.12 m depth differs from the driveway base while remaining shared by walk and terrace builders.
 * @evidenceReview spaces/site/01-paving-support.md#paving-depth-reservation #08ee5c7 The pedestrian surfaces in the target reserve 0.12 m while the driveway reserves 0.15 m; WALK_DEPTH exports the pedestrian value to those walk and landing builders.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a support depth, not a visible walking level or terrain foundation.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 WALK_DEPTH is applied as a slab thickness or subtracted for the terrace support bottom; it does not replace any walk's top height or specify map ground.
 * @evidence principles/core/source-units.md#source-substantive-completion The numeric value gives each walking slab a definite lower face.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f front-walk and side-walk pass WALK_DEPTH to their paving solids, while terrace computes BOTTOM from LOW minus WALK_DEPTH, giving these walking bodies a definite underside.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The paving parent fixes the pedestrian 0.12 m band; no new support thickness was added.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Paving-depth-reservation fixes the pedestrian base at 0.12 m; WALK_DEPTH carries that authored depth without exposing a missing support dimension.
 */
export const WALK_DEPTH = 0.12;
/** Base depth below the driveway surface, metres. */
/**
 * @evidence spaces/site/01-paving-support.md DRIVE_DEPTH reserves a thicker base below the sloping driveway.
 * @evidenceReview spaces/site/01-paving-support.md #bcad46a DRIVE_DEPTH exports the 0.15 m driveway base reservation, deeper than WALK_DEPTH under the three pedestrian walking surfaces.
 * @evidence principles/core/source-units.md#source-scope-preservation This 0.15 m offset changes only the driveway underside, leaving pedestrian paving at WALK_DEPTH.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildDriveway uses DRIVE_DEPTH for its slab; the pedestrian walk builders use WALK_DEPTH, so this value changes no walking top or adjacent path thickness.
 * @evidence principles/core/source-units.md#source-substantive-completion buildDriveway receives a concrete vertical slab thickness at every ramp point.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildDriveway passes DRIVE_DEPTH into slopedSlab, which lowers the underside from each sampled ramp top by that fixed vertical amount.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-depth-reservation gives the driveway a 0.15 m base below its sloped top, separately from the pedestrian 0.12 m base; DRIVE_DEPTH carries that authored depth.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Paving-depth-reservation assigns the driveway a 0.15 m vertical base separate from the 0.12 m walks; DRIVE_DEPTH gives its builder exactly that value without revising the parent.
 */
export const DRIVE_DEPTH = 0.15;

/** Add the connector's four segment endpoints to a neighbouring slab edge. */
/**
 * @evidence spaces/site/01-paving-support.md#paving-depth-reservation A connector end line and its neighbouring flat walk or sloped driveway edge carry identical split vertices.
 * @evidenceReview spaces/site/01-paving-support.md#paving-depth-reservation #08ee5c7 seamRect uses CONNECTOR_CELLS to place the same four subdivisions as blendedRun on a shared Z run; front-walk, side-walk and both driveway sides pass their connector intervals to it.
 * @evidence spaces/site/01-paving-support.md The shared paving support design transfers connector segmentation to neighbouring slabs.
 * @evidenceReview spaces/site/01-paving-support.md #bcad46a The paving support target transfers connector end splits to adjacent paving; seamRect inserts those Z stations on the west and east edges supplied by the front walk, driveway and side walk.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper only subdivides caller supplied bounds; it changes neither grade nor paving ownership.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 seamRect accepts caller X/Z bounds and west/east runs and returns IPlanPoint coordinates only; the caller still owns its top function, thickness and paving part.
 * @evidence principles/core/source-units.md#source-substantive-completion Collinear edge stations prevent a connector triangle from ending halfway along an unsplit slab edge.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f seamRect sorts unique connector stations and returns them along the two X edge lines; the adjacent slabs therefore have vertices at each four-cell connector end point.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The paving-depth-reservation parent requires shared edge subdivision and specifies at least four connector cells.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Paving-depth-reservation requires shared connector-edge subdivision at four or more cells; seamRect uses CONNECTOR_CELLS = 4 for each passed end run without needing a new parent seam rule.
 */
export const seamRect = (
  x: readonly [number, number],
  z: readonly [number, number],
  west: readonly (readonly [number, number])[] = [],
  east: readonly (readonly [number, number])[] = [],
): IPlanPoint[] => {
  const stations = (runs: readonly (readonly [number, number])[]): number[] =>
    [...new Set([z[0], z[1], ...runs.flatMap(([a, b]) =>
      Array.from({ length: CONNECTOR_CELLS + 1 }, (_, i) => a + ((b - a) * i) / CONNECTOR_CELLS),
    )])].sort((a, b) => a - b);
  return [
    ...stations(east).map((value) => ({ x: x[1], z: value })),
    ...stations(west).reverse().map((value) => ({ x: x[0], z: value })),
  ];
};

/** The bilinear rule sampled from the same height callback as the paving mesh.
 * @evidence spaces/site/01-paving-support.md The connector's standable rule samples the same X/Z function as its opaque paving.
 * @evidenceReview spaces/site/01-paving-support.md #bcad46a front-walk and side-walk each pass their connectorHeight callback to both pavingHeightfield for the standable patch and blendedRun for its opaque triangles, keeping the two heights aligned.
 * @evidence principles/core/source-units.md#source-scope-preservation The rule records the caller's paving height without a second level decision.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 pavingHeightfield takes the caller's X/Z bounds and height callback and samples its four corners; it introduces no independent walking level or paving owner.
 * @evidence principles/core/source-units.md#source-substantive-completion Four samples reproduce the current bilinear front- and side-connector profiles at every surface query.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The 2×2 heightfield stores the callback at all four X/Z corners; the current front and side connectorHeight functions are bilinear, so those samples determine their interior standing height.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-depth-reservation requires each connector's standable surface to sample the same bilinear X/Z height used by its visible triangles; this rule records that function's four corners.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Paving-depth-reservation requires standable connector height and opaque paving to consume the same original X/Z formula; pavingHeightfield samples the callbacks used by blendedRun, so no alternate parent grade is needed.
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
  samples: [
    height(x[0], z[0]),
    height(x[1], z[0]),
    height(x[0], z[1]),
    height(x[1], z[1]),
  ],
});

/**
 * A sloped run over X = `x`, Z = `z` whose top is `height(x, z)`, emitted as
 * `cells × cells` quads split into triangles, each a prism of `depth`.
 */
/**
 * @evidence spaces/site/01-paving-support.md blendedRun constructs sloped paving between different edge heights without a nonplanar quad.
 * @evidenceReview spaces/site/01-paving-support.md #bcad46a blendedRun divides the caller's graded connector into cells and emits two planar slopedSlab triangles per cell from the height callback, avoiding a single twisted quad.
 * @evidence principles/core/source-units.md#source-scope-preservation It receives its bounds and height callback from the calling walk owner and emits no independent path.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 blendedRun takes id, owner, color, X/Z bounds, height, depth and joined-edge rule from the calling walk; it adds no independent route or surface extent.
 * @evidence principles/core/source-units.md#source-substantive-completion The fixed four-by-four grid yields paired triangular top and bottom patches with shared sampled corners, stable ids and sides only at the connector perimeter.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f blendedRun fixes n = CONNECTOR_CELLS, samples a shared five-by-five X/Z grid, emits two named triangles per cell and passes pavingFreeEdge to close only the joined-aware outer boundary.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-depth-reservation requires at least four divisions on each connector axis and two triangles per cell; blendedRun applies the caller's X/Z bounds and height at those shared corners.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Paving-depth-reservation requires at least four cells per axis and two triangles per cell to bound bilinear approximation; blendedRun uses four in both axes with the caller's original height at shared corners.
 */
export const blendedRun = (props: {
  id: string;
  owner: string;
  color: number;
  x: readonly [number, number];
  z: readonly [number, number];
  height: (x: number, z: number) => number;
  depth: number;
  /** Edge joined to another part of the same paving union. */
  joined?: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean;
}): IHousePart[] => {
  const n = CONNECTOR_CELLS;
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
            slopedSlab({
              plan: tri,
              top: props.height,
              thickness: props.depth,
              freeEdge: pavingFreeEdge(props.x, props.z, props.joined),
            }),
          ),
        );
    }
  return parts;
};
