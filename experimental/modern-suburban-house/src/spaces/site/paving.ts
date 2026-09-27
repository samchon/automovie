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
 * @evidenceReview spaces/site/01-paving-support.md #beb4a05 01-paving-support.md:27 T-walk union and three side-walk bands union; pavingFreeEdge serves both. v-144 m2 closed.
 * @evidence spaces/site/01-paving-support.md#paving-depth-reservation The T-walk and three side-walk bands have no vertical side inside their union.
 * @evidenceReview spaces/site/01-paving-support.md#paving-depth-reservation #70f28d6 01-paving-support.md:27 (#paving-depth-reservation) T자 보행길과 관리길 세 띠의 합집합 내부 ... 가짜 옆면을 생성하지 않는다; measured union-internal vertical triangles 0 (354 at b280).
 * @evidence principles/core/source-units.md#source-scope-preservation The caller's X/Z bounds and joined-edge predicate decide the perimeter; this helper assigns no new paving area.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 pavingFreeEdge(x, z, joined) only classifies perimeter edges of caller bounds.
 * @evidence principles/core/source-units.md#source-substantive-completion The returned predicate closes outer slab edges while rejecting cell seams and joined flat-band sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Perimeter & !joined -> side; diagonal/cell seams are not perimeter; joined predicates in front-walk.ts:110-113,128 and side-walk.ts:70-71,148-150,162.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-depth-reservation forbids fake union-internal side faces; pavingFreeEdge classifies only the caller's rectangle perimeter and removes its declared same-union contact.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Same H2 sentence; mechanism as 887.
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
 * @evidenceReview spaces/site/01-paving-support.md #beb4a05 v-141 paving.ts:23 0.12; 01-paving-support.md:25 front-walk, side-walk, garden-lower-landing reserve 0.12 m; consumers front-walk.ts:95,103, side-walk.ts:61,137, terrace.ts:23.
 * @evidence spaces/site/01-paving-support.md#paving-depth-reservation Its 0.12 m depth differs from the driveway base while remaining shared by walk and terrace builders.
 * @evidenceReview spaces/site/01-paving-support.md#paving-depth-reservation #70f28d6 v-141 0.12 vs DRIVE_DEPTH 0.15 (01-paving-support.md:25); imported by front-walk.ts:19, side-walk.ts:19, terrace.ts:18.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a support depth, not a visible walking level or terrain foundation.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Used only as a subtraction below tops (front-walk.ts:95, side-walk.ts:61, terrace.ts:23) and as prism depth; never a top or terrain value.
 * @evidence principles/core/source-units.md#source-substantive-completion The numeric value gives each walking slab a definite lower face.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 bottom = top - WALK_DEPTH in every walk slab/prism (front-walk.ts:95,103; side-walk.ts:61,137; terrace BOTTOM :23).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The paving parent fixes the pedestrian 0.12 m band; no new support thickness was added.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 v-141 01-paving-support.md:25 fixes 0.12 m; file unchanged since before 2d75a76d (last body commit 11b48163 pre-source).
 */
export const WALK_DEPTH = 0.12;
/** Base depth below the driveway surface, metres. */
/**
 * @evidence spaces/site/01-paving-support.md DRIVE_DEPTH reserves a thicker base below the sloping driveway.
 * @evidenceReview spaces/site/01-paving-support.md #beb4a05 v-141 paving.ts:31 0.15 > 0.12; 01-paving-support.md:25 driveway 0.15 m.
 * @evidence principles/core/source-units.md#source-scope-preservation This 0.15 m offset changes only the driveway underside, leaving pedestrian paving at WALK_DEPTH.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 grep: DRIVE_DEPTH used only driveway.ts:15,74; walk owners use WALK_DEPTH.
 * @evidence principles/core/source-units.md#source-substantive-completion buildDriveway receives a concrete vertical slab thickness at every ramp point.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 driveway.ts:74 thickness -> solids.ts:543-546 bottom y = top y - thickness at each vertex (vertical), matching 01-paving-support.md:27.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-depth-reservation gives the driveway a 0.15 m base below its sloped top, separately from the pedestrian 0.12 m base; DRIVE_DEPTH carries that authored depth.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 01-paving-support.md:25 three walks 0.12 m, "driveway는 0.15 m"; :27 underside = top minus own thickness vertically; paving.ts:33 DRIVE_DEPTH=0.15 consumed by driveway.ts:84.
 */
export const DRIVE_DEPTH = 0.15;

/** Add the connector's four segment endpoints to a neighbouring slab edge. */
/**
 * @evidence spaces/site/01-paving-support.md#paving-depth-reservation A connector end line and the adjacent flat paving carry identical split vertices.
 * @evidenceReview spaces/site/01-paving-support.md#paving-depth-reservation #70f28d6 seamRect stations a+((b-a)·i)/CONNECTOR_CELLS (paving.ts:49-52) equal blendedRun zs (:109-112) exactly; applied to front-walk east edge (front-walk.ts:105), side-walk-long west edge (side-walk.ts:134) and both driveway edges (driveway.ts:77-82, site.ts:30); 01-paving-support.md:33. Row mentions only flat paving; the sloped driveway also uses it.
 * @evidence spaces/site/01-paving-support.md The shared paving support design transfers connector segmentation to neighbouring slabs.
 * @evidenceReview spaces/site/01-paving-support.md #beb4a05 01-paving-support.md:33 "연결로 끝선의 분할은 차도와 평탄 길의 공유 경계에도 전달"; seamRect puts connector stations on all four shared edges: driveway west (FRONT_WALK.connectorZ) and east (SIDE_WALK.frontBand), front-walk east, side-walk-long west.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper only subdivides caller supplied bounds; it changes neither grade nor paving ownership.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 paving.ts:43-57 returns only IPlanPoint[] from caller x/z/runs; no height, owner or part; callers keep their own top and thickness.
 * @evidence principles/core/source-units.md#source-substantive-completion Collinear edge stations prevent a connector triangle from ending halfway along an unsplit slab edge.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Stations are collinear on the x[0]/x[1] edges (paving.ts:53-56) at the connector cell-corner Z values, so each connector end-triangle edge ends at a slab vertex (driveway.ts:77-82 with front-walk.ts:106-114; side-walk.ts:134 with :136-144).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The paving-depth-reservation parent requires shared edge subdivision and specifies at least four connector cells.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Names paving-depth-reservation: body :33 transfers the connector end-line split to driveway/flat-path shared edges; :31 "X/Z 각각 최소 네 구간"; CONNECTOR_CELLS=4 (paving.ts:15). :33 phrase dates from 64059f25 (2026-09-22), before source work: no HIST.
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
 * @evidenceReview spaces/site/01-paving-support.md #beb4a05 Both callers pass the same connectorHeight to pavingHeightfield and blendedRun (front-walk.ts:96-100,112; side-walk.ts:120-124,142); 01-paving-support.md:33 walkable height and body consume one formula.
 * @evidence principles/core/source-units.md#source-scope-preservation The rule records the caller's paving height without a second level decision.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 paving.ts:65-83 only samples the caller's height at four corners; no level constant of its own.
 * @evidence principles/core/source-units.md#source-substantive-completion Four samples reproduce the bilinear connector at every surface query.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f 2×2 heightfield of connectorHeight corners (paving.ts:70-82); connectorHeight is bilinear (linear in X; driveTop linear in Z), so four corners determine it. Delta is reformatting only.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-depth-reservation requires each connector's standable surface to sample the same bilinear X/Z height used by its visible triangles; this rule records that function's four corners.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 01-paving-support.md:27 (원래 보간식을 위아래에 적용, no four-corner arbitrary plane) and :33 (보행 가능 높이와 실제 불투명 바탕은 동일한 원래 높이식); pavingHeightfield samples the same callback blendedRun uses.
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
 * @evidenceReview spaces/site/01-paving-support.md #beb4a05 blendedRun (paving.ts:95-134) emits triangular prisms, planar by construction (:120-122), between the caller's differing edge heights.
 * @evidence principles/core/source-units.md#source-scope-preservation It receives its bounds and height callback from the calling walk owner and emits no independent path.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 paving.ts:95-103 bounds, height, depth, id and owner all come from the caller; it returns parts only for those bounds.
 * @evidence principles/core/source-units.md#source-substantive-completion The four-by-four default grid yields paired triangular prisms with shared sampled corners and stable ids.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The 4×4 grid, two triangles per cell, shared xs/zs corners and ids `${id}-${i}-${j}-${k}` hold (paving.ts:104-131). But "default" is stale: the `cells?` option was removed in this delta and n = CONNECTOR_CELLS is fixed; the JSDoc at :86-87 still says "cells × cells". | r3: cells now emit sides only on the connector perimeter (pavingFreeEdge), so "paired triangular prisms" is further loose; stays MINOR.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-depth-reservation requires at least four divisions on each connector axis and two triangles per cell; blendedRun applies the caller's X/Z bounds and height at those shared corners.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 01-paving-support.md:31 X/Z 각각 최소 네 구간, :29 each quad split by one diagonal into two planes; paving.ts:104-131 n=CONNECTOR_CELLS=4 on both axes, two triangles per cell, caller bounds and height at shared corners.
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
