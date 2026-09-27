/**
 * Deterministic solids shared by every spaces source owner.
 *
 * Responsibility: turn the coordinates the reviewed `docs/spaces` owners wrote
 * into closed triangle meshes through the public engine geometry exports, so
 * each owner file states only its own numbers. This module owns no surface; it
 * is a helper under the spaces source root and the calling owner answers for
 * every part it emits.
 *
 * Frames and units: world metres, right-handed and Y-up, +X to the right seen
 * from the street, +Z toward the street (settings `coordinate-units`). A wall
 * panel is authored in (u, y), where u runs along world X or world Z and y is
 * the world height; its thickness spans an explicit world range across the
 * wall. A slab is authored as a plan polygon in (x, z) between two heights.
 *
 * Operations and their postconditions (engine JSDoc):
 * - `extrudeAutoMovieRegion` extrudes an outer ring with holes along local Z,
 *   centred on it, and keeps openings as real holes;
 * - `buildAutoMoviePolyhedron` builds one solid from convex planar faces whose
 *   corner order gives the outward normal;
 * - `tessellateToMesh` gives a box centred on its origin;
 * - `transformAutoMovieMesh` rotates and translates positions and normals.
 * Nothing here merges intersecting solids or pretends to be a Boolean.
 *
 * Consumers: every `src/spaces/**` owner, then `house.ts`, which the viewer
 * server reads. Changing a helper changes every owner's mesh, so the viewer's
 * source digest, which covers `src`, marks any open page stale.
 */
import {
  buildAutoMoviePolyhedron,
  extrudeAutoMovieRegion,
  tessellateToMesh,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import type {
  IPlanPoint,
  IWallFace,
  IWallHole,
  IWallPoint,
  IWallSolid,
} from "./solid-records";

/**
 * Axis-aligned box between two world corners.
 * @evidence spaces/03-surface-owners.md Assigned owners use box solids for their own structural or finish details.
 * @evidenceReview spaces/03-surface-owners.md #9596716 block remains a geometry primitive used under caller owners: stair.ts calls stair-guards.ts for guard posts, while porch.ts, left.ts and entry.ts build their own assigned parts.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff A caller may use this closed body for exterior details under its own owner id.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #9f3db3c v-141 Exterior details via block under own owner (porch beam, chimney cap, thresholds front.ts:168, fence posts).
 * @evidence principles/core/source-units.md#source-scope-preservation The helper chooses no house location; callers supply both world corners.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 min/max from caller (L300-303); no constants.
 * @evidence principles/core/source-units.md#source-substantive-completion It rejects nonpositive extents and returns a transformed closed box mesh.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 L309-312 throws on nonpositive/NaN extents; L313-322 tessellated closed box translated.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns chimney and porch parts to their respective builders; block extrudes their supplied world corners without allocating another face owner.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03:33 left elevation owns the chimney interface (left.ts:116-170 role 'chimney'); 03:44 porch.ts owns porch roof/columns/beam (porch.ts:88-147). block returns only a closed box mesh between two caller corners (solids.ts:293-316); the caller's part() sets owner.
 */
export const block = (
  min: readonly [number, number, number],
  max: readonly [number, number, number],
): IAutoMovieMesh => {
  const [width, height, depth] = [
    max[0] - min[0],
    max[1] - min[1],
    max[2] - min[2],
  ];
  if (!(width > 0 && height > 0 && depth > 0))
    throw new Error(
      `block needs positive extents, got ${width} × ${height} × ${depth}`,
    );
  return transformAutoMovieMesh(
    tessellateToMesh({ type: "box", width, height, depth }),
    {
      translation: {
        x: (min[0] + max[0]) / 2,
        y: (min[1] + max[1]) / 2,
        z: (min[2] + max[2]) / 2,
      },
    },
  );
};

/** Quarter turn about world Y: local +X becomes world +Z, local +Z becomes world -X. */
const TO_Z_AXIS = { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
/** Quarter turn about world X: local +Y becomes world +Z, local +Z becomes world -Y. */
const TO_PLAN = { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };

/**
 * A wall panel of any outline with rectangular holes.
 *
 * `axis` names the world axis u runs along; `across` is the world range of the
 * wall thickness on the other horizontal axis. Holes are real voids through
 * the whole thickness. The outline must enclose every hole.
 * @evidence spaces/07-boundary-assembly.md A wall owner can emit one outlined panel with actual cut voids.
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 outline + holes -> extrudeAutoMovieRegion (L351-358); 07-boundary-assembly.md:27.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership A partition remains one body on its assigned run.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-ownership #6a03f13 v-141 straightWall (partitions) builds one wallPanel (L426-431).
 * @evidence spaces/07-boundary-assembly.md#exterior-boundary-junctions Orientation and thickness preserve the single exterior wall body.
 * @evidenceReview spaces/07-boundary-assembly.md#exterior-boundary-junctions #11dbbb5 v-141 axis/across place one extruded body (L365-379); 07-boundary-assembly.md:115-121 single wall body per zone.
 * @evidence principles/core/source-units.md#source-scope-preservation Axis, outline and cuts are supplied by the caller; this helper owns no wall run.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 All geometry from props; helper holds no run.
 * @evidence principles/core/source-units.md#source-substantive-completion Region extrusion produces a mesh and its matching face record.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 L358 extrusion, L359-364 face, returned together L366-379.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership gives each partition one body and its door void, while external-opening-interface cuts a rough opening through its host wall; wallPanel emits that body and matching face record.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 07:27 partition body and opening cut generated once; 06:27 rough opening passes through its elevation wall. wallPanel extrudes outline with holes and returns mesh + matching face (solids.ts:336-373); used by envelope/garage walls and, via straightWall (solids.ts:419), partitions.
 */
export const wallPanel = (props: {
  axis: "x" | "z";
  across: readonly [number, number];
  outline: readonly IWallPoint[];
  holes?: readonly IWallHole[];
}): IWallSolid => {
  const depth = props.across[1] - props.across[0];
  const center = (props.across[0] + props.across[1]) / 2;
  const outer = props.outline.map((p) => ({ x: p.u, y: p.y }));
  const holes = (props.holes ?? []).map((h) => [
    { x: h.from, y: h.bottom },
    { x: h.to, y: h.bottom },
    { x: h.to, y: h.top },
    { x: h.from, y: h.top },
  ]);
  const local = extrudeAutoMovieRegion({ outer, holes, depth });
  const face: IWallFace = {
    axis: props.axis,
    across: props.across,
    outline: props.outline,
    holes: props.holes ?? [],
  };
  // Along X the region already lies in world X/Y; only its depth moves to Z.
  if (props.axis === "x") return {
    mesh: transformAutoMovieMesh(local, {
      translation: { x: 0, y: 0, z: center },
    }),
    face,
  };
  // Along Z: local X turns into world +Z and the depth axis into world -X.
  return {
    mesh: transformAutoMovieMesh(local, {
      rotation: TO_Z_AXIS,
      translation: { x: center, y: 0, z: 0 },
    }),
    face,
  };
};

/**
 * A straight wall panel between two heights: the common rectangular case.
 *
 * A void whose bottom reaches the panel bottom (a door in a partition that
 * stands on the finished floor) cannot be a hole: it is cut as a notch of the
 * outline, so the panel stays one closed body on each side of the door. A void
 * that leaves the panel's length range or sits below its bottom is refused.
 * @evidence spaces/07-boundary-assembly.md Straight interior partitions retain their full face despite cut door voids.
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 rooms/shared.ts partition and stair.ts wall call straightWall with partition roles; no envelope run calls it. Its face keeps the rectangle with voids including notched doors, preserving the boundary design's single body and opening cut.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions A floor-reaching door becomes a bottom notch while its face lists the same void.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-junctions #78b06b5 v-141 A true (notch L410-420; face lists every hole L444). The notch rule is 06-openings.md:31 ('벽 바닥까지 닿는 문은 외곽선의 열린 패임'); 07-boundary-assembly.md:79 supplies only the same-cut-boundary half.
 * @evidence principles/core/source-units.md#source-scope-preservation Callers set wall axis, span and holes; this helper changes no room allocation.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 axis/along/holes from caller (L395-402).
 * @evidence principles/core/source-units.md#source-substantive-completion It validates hole bounds, forms notches, and returns the wall mesh plus full boundary.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 L405-409 refuse, L410-420 notches, L433-446 mesh + full rectangle face.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-junctions requires floor-reaching partition doors to be real bottom notches and interior-boundary-ownership keeps one wall body; straightWall produces that cut body.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 07:27 one common body per partition true; straightWall builds one notched outline (solids.ts:403-418). But the bottom-notch rule is stated at 06-openings.md:31 ('벽 바닥까지 닿는 문은 외곽선의 열린 패임'); interior-boundary-junctions only implies it through the floor finish meeting at the partition centre plane under doors (07:83).
 */
export const straightWall = (props: {
  axis: "x" | "z";
  across: readonly [number, number];
  along: readonly [number, number];
  bottom: number;
  top: number;
  holes?: readonly IWallHole[];
}): IWallSolid => {
  const eps = 1e-9;
  const holes = props.holes ?? [];
  for (const h of holes)
    if (h.from <= props.along[0] + eps || h.to >= props.along[1] - eps || h.bottom < props.bottom - eps || h.top >= props.top - eps)
      throw new Error(
        `void "${h.id}" [${h.from}, ${h.to}] × [${h.bottom}, ${h.top}] leaves wall [${props.along[0]}, ${props.along[1]}] × [${props.bottom}, ${props.top}]`,
      );
  const notches = holes.filter((h) => h.bottom <= props.bottom + eps).sort(
    (x, y) => x.from - y.from,
  );
  const outline: IWallPoint[] = [{ u: props.along[0], y: props.bottom }];
  for (const n of notches)
    outline.push(
      { u: n.from, y: props.bottom },
      { u: n.from, y: n.top },
      { u: n.to, y: n.top },
      { u: n.to, y: props.bottom },
    );
  outline.push(
    { u: props.along[1], y: props.bottom },
    { u: props.along[1], y: props.top },
    { u: props.along[0], y: props.top },
  );
  const solid = wallPanel({
    axis: props.axis,
    across: props.across,
    outline,
    holes: holes.filter((h) => h.bottom > props.bottom + eps),
  });
  // The face is the full rectangle with every void, notches included.
  return {
    mesh: solid.mesh,
    face: {
      axis: props.axis,
      across: props.across,
      outline: [
        { u: props.along[0], y: props.bottom },
        { u: props.along[1], y: props.bottom },
        { u: props.along[1], y: props.top },
        { u: props.along[0], y: props.top },
      ],
      holes,
    },
  };
};

/**
 * A horizontal slab: a plan polygon with optional plan holes between two heights.
 * @evidence spaces/08-floor-assembly.md Floor layers are extruded from owner-supplied plan outlines and heights.
 * @evidenceReview spaces/08-floor-assembly.md #3fa5b4f v-141 slab extrudes caller outline between bottom/top (L466-476); 08-floor-assembly.md:27 layer intervals.
 * @evidence spaces/08-floor-assembly.md#interstorey-floor-boundary Structural slabs use the notched MAIN.inner outline while finish slabs consume each room outline at their own vertical interval.
 * @evidenceReview spaces/08-floor-assembly.md#interstorey-floor-boundary #b98a250 Upper-floor structural base uses MAIN.inner with a stair notch, while shared.ts roomFloor and roomCeiling consume individual room outlines. The evidence sentence's plural scope is too broad: ground and upper ceiling bases remain un-notched as the design requires.
 * @evidence spaces/08-floor-assembly.md#interstorey-edge-junctions The stair opening reaches the front boundary and is cut as an outer-ring notch, not a closed interior hole.
 * @evidenceReview spaces/08-floor-assembly.md#interstorey-edge-junctions #5618479 A holds: no slab caller passes holes; upper.ts:53-66 supplies the notched outer ring. But 'not a closed interior hole, one notched outer ring' is 08-floor-assembly.md:31 in #interstorey-floor-boundary (same-file sibling); #interstorey-edge-junctions (08:65) only recedes the structure 0.015 m and shares the front-wall end.
 * @evidence principles/core/source-units.md#source-scope-preservation The caller owns the polygon, cutouts and layer interval.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Outline, holes and interval all from props (L458-463); the stair cutout is the caller's notch.
 * @evidence principles/core/source-units.md#source-substantive-completion Region extrusion creates a horizontal closed mesh with real plan holes.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Hole path exists (L468-470) but no production caller passes holes; every emitted slab is hole-free (stair opening is a notch, upper.ts:43-56).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interstorey-floor-boundary assigns structural thickness below the upper floor and room finish to each room outline; interstorey-edge-junctions cuts the stair as an outer notch in the structural caller plan.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 08:25-29 structure between the two finish layers and room finish per room outline true. The outer-notch/not-hole decision is 08:31 (#interstorey-floor-boundary), not edge-junctions (08:65 gives the 0.015 m recession). Code upper.ts:53-66.
 */
export const slab = (props: {
  outline: readonly IPlanPoint[];
  holes?: readonly (readonly IPlanPoint[])[];
  bottom: number;
  top: number;
}): IAutoMovieMesh => {
  // Local (x, y) = world (x, z); after the quarter turn local +Z points to
  // world -Y, so the centred extrusion is moved to the slab's mid height.
  const local = extrudeAutoMovieRegion({
    outer: props.outline.map((p) => ({ x: p.x, y: p.z })),
    holes: (props.holes ?? []).map((ring) =>
      ring.map((p) => ({ x: p.x, y: p.z })),
    ),
    depth: props.top - props.bottom,
  });
  return transformAutoMovieMesh(local, {
    rotation: TO_PLAN,
    translation: { x: 0, y: (props.bottom + props.top) / 2, z: 0 },
  });
};

/**
 * Plan rectangle helper for caller-supplied X and Z extents.
 * @evidence spaces/site/00-access.md Building and exterior-zone owners express plan extents in one world frame.
 * @evidenceReview spaces/site/00-access.md #a8ac95c 00-access.md:29,101 building and zones in one common frame; rect callers: building ground.ts:41, garage.ts:113, upper.ts:99; exterior side-walk.ts:62, driveway.ts:57, terrace.ts:106, porch.ts:155,166.
 * @evidence spaces/site/00-access.md#site-access-interface This helper preserves the caller's X/Z frame while forming a four-corner ring.
 * @evidenceReview spaces/site/00-access.md#site-access-interface #0ee9bff 00-access.md:29 common frame. rect returns four ordered corners from the caller's x and z intervals only (solids.ts:480-485).
 * @evidence principles/core/source-units.md#source-scope-preservation It adds no width or location beyond the caller's values.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Only x[0..1], z[0..1] used.
 * @evidence principles/core/source-units.md#source-substantive-completion Four ordered corners form a reusable rectangular plan outline.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 (x0,z0)->(x1,z0)->(x1,z1)->(x0,z1) L488-491.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface assembles main house, garage, and exterior zones in the common X/Z frame from coordinate-units; rect only orders the two intervals supplied by each actual owner.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-access.md:29 house-site contains main, garage, porch and exterior zones; coordinates use coordinate-units. rect only orders the two supplied intervals (solids.ts:480-485); callers are building and site owners.
 */
export const rect = (x: readonly [number, number], z: readonly [number, number]): IPlanPoint[] => [
  { x: x[0], z: z[0] },
  { x: x[1], z: z[0] },
  { x: x[1], z: z[1] },
  { x: x[0], z: z[1] },
];

const sub = (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
const cross = (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

/**
 * A sloped slab: a convex plan polygon whose top follows a planar height
 * function and whose underside lies `thickness` lower in world Y (the roof
 * owners' vertical reservation, not a thickness normal to the slope).
 *
 * The plan ring is reordered so the top face's normal points up; the bottom
 * face reverses it and each side is the vertical quad under one plan edge.
 * @evidence spaces/roof/00-junctions.md Roof and wall-head owners supply a planar top and assigned underside.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 Roof owners pass top=mFront/mBack/... and ROOF_THICKNESS (main-back.ts:34-39); wallHead passes underside top + level floor (wall-head.ts:42-45); roof/00-junctions.md:62-64,128.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums A vertical thickness or level underside closes each sloped roof face.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums #dd15c02 v-141 roof/00-junctions.md:64 fixes only a vertical 0.24 m underside for sloped roof faces; no level underside. All roof callers use thickness (roof/*.ts, porch roof porch.ts:147-151); the level floor is used only by porch-beam-packer and wallHead (porch.ts:136-139, wall-head.ts:44).
 * @evidence spaces/roof/00-junctions.md#roof-wall-head-junctions A caller can close a wall-head wedge against its own level floor.
 * @evidenceReview spaces/roof/00-junctions.md#roof-wall-head-junctions #0de3b07 v-141 wall-head.ts:42-45 floor = roof(outerZ)-thickness (level) with top = underside function; roof/00-junctions.md:128 inner/outer top lines follow the underside.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper receives the plan, slope and underside; it creates no new roof mass.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 plan/top/thickness|floor from caller (L519-528); no roof constant.
 * @evidence principles/core/source-units.md#source-substantive-completion It validates the input and emits outward top, bottom and side faces.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 L529-534 validation; top ordered by normal.y (L540-541), bottom reversed (L552), sides (top_i,bottom_i,bottom_j,top_j) outward (L560-563).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums fixes a vertical 0.24 m reservation for main and garage planes, porch-roof-columns fixes its own roof underside, and roof-wall-head-junctions consumes the slope across wall thickness; slopedSlab applies only the caller's assigned plan and height.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 roof/00-junctions.md:57-60,64 0.24 m vertical underside for main, gable, low and garage roofs; porch.md:57 porch underside 0.22 m below P; 00-junctions.md:128 inner head higher by slope x wall thickness. slopedSlab uses caller plan, top function and thickness/floor only (solids.ts:512-559); callers roofs, porch.ts:154,165, wall-head.ts:42.
 */
export const slopedSlab = (props: {
  plan: readonly IPlanPoint[];
  top: (x: number, z: number) => number;
  /** Constant vertical thickness under the top; ignored when `floor` is given. */
  thickness?: number;
  /** An underside instead: a level (a beam packer) or a planar height function (a wall-head wedge). */
  floor?: number | ((x: number, z: number) => number);
  /** Free outline edges alone receive visible vertical thickness. */
  freeEdge?: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean;
}): IAutoMovieMesh => {
  if (props.plan.length < 3) throw new Error(
    "sloped slab needs at least three plan corners",
  );
  if (props.floor === undefined && !(props.thickness! > 0)) throw new Error(
    "sloped slab needs a positive thickness or a floor",
  );
  const up = props.plan.map((p) => ({
    x: p.x,
    y: props.top(p.x, p.z),
    z: p.z,
  }));
  const normal = cross(sub(up[1]!, up[0]!), sub(up[2]!, up[0]!));
  const top = normal.y > 0 ? up : [...up].reverse();
  const floor = props.floor;
  const bottom = top.map((p) => ({
    x: p.x,
    y: floor === undefined
      ? p.y - props.thickness!
      : typeof floor === "number"
        ? floor
        : floor(p.x, p.z),
    z: p.z,
  }));
  const faces: IAutoMovieVector3[][] = [top, [...bottom].reverse()];
  const same = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9 && Math.abs(a.z - b.z) < 1e-9;
  for (let i = 0; i < top.length; ++i) {
    const j = (i + 1) % top.length;
    if (props.freeEdge !== undefined && !props.freeEdge(top[i]!, top[j]!)) continue;
    // A wedge meets its floor along an edge: drop the coincident corners so the
    // side under that edge is a triangle, and skip a side with no height at all.
    const side = [top[i]!, bottom[i]!, bottom[j]!, top[j]!].filter(
      (p, k, all) => !same(p, all[(k + all.length - 1) % all.length]!),
    );
    if (side.length >= 3) faces.push(side);
  }
  return buildAutoMoviePolyhedron(faces);
};

/**
 * One pitched roof part with a concave plan decomposed only on its weather
 * and underside faces. The caller supplies convex coplanar tiles and a free
 * outline predicate; shared tile seams receive no vertical face.
 * @evidence spaces/roof/main-front.md A single roof part retains the concave weather face without internal vertical seams.
 * @evidenceReview spaces/roof/main-front.md #f3c7135 v-141 main-front.ts:49-95 four convex tiles in one slopedPlate; tile seams skip sides (coincidentTiles===1, main-front.ts:86); roof/main-front.md:27.
 * @evidence spaces/roof/main-front.md#main-front-roof This keeps the cut main front weather face and underside in one part.
 * @evidenceReview spaces/roof/main-front.md#main-front-roof #5f2d1fd v-141 One buildAutoMoviePolyhedron with all tiles' top and underside (L587-606); roof/main-front.md:27.
 * @evidence principles/core/source-units.md#source-scope-preservation Roof owners identify their free outline; this helper never selects a roof junction.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 freeEdge supplied by caller (L582, L603).
 * @evidence principles/core/source-units.md#source-substantive-completion Each planar tile has an underside and only selected free sides close its thickness.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Each tile pushes top and reversed bottom; sides only where freeEdge (L595-604).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-shared-edges requires one coincident valley/ridge seam without internal closing faces; slopedPlate closes only caller-marked free perimeter edges of its roof tiles.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-junctions.md:96,98 one coincident valley boundary consumed from junctions.ts, no overlapped plates, true. 'No internal closing faces' at valley/ridge is roof/main-front.md:27 ('내부 막음판을 남기지 않는다'), other file (author moved this cite there in df38963f). A holds: slopedPlate adds sides only where freeEdge is true (solids.ts:594-597); caller main-front.ts:98.
 */
export const slopedPlate = (props: {
  plans: readonly (readonly IPlanPoint[])[];
  top: (x: number, z: number) => number;
  thickness: number;
  freeEdge: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean;
}): IAutoMovieMesh => {
  if (props.plans.length === 0 || !(props.thickness > 0)) throw new Error(
    "sloped plate needs tiles and positive thickness",
  );
  const faces: IAutoMovieVector3[][] = [];
  for (const plan of props.plans) {
    if (plan.length < 3) throw new Error(
      "sloped plate tile needs three corners",
    );
    const up = plan.map((p) => ({ x: p.x, y: props.top(p.x, p.z), z: p.z }));
    const normal = cross(sub(up[1]!, up[0]!), sub(up[2]!, up[0]!));
    const top = normal.y > 0 ? up : [...up].reverse();
    const bottom = top.map((p) => ({
      x: p.x,
      y: p.y - props.thickness,
      z: p.z,
    }));
    faces.push(top, [...bottom].reverse());
    for (let i = 0; i < top.length; i++) {
      const j = (i + 1) % top.length;
      if (props.freeEdge(top[i]!, top[j]!)) faces.push([top[i]!, bottom[i]!, bottom[j]!, top[j]!]);
    }
  }
  return buildAutoMoviePolyhedron(faces);
};

/**
 * A straight bar of square section between two world points, for rails and
 * sloped handrails. Its four long faces follow the bar direction; the section
 * is `size` wide and stays level across the bar.
 * @evidence spaces/02-stair.md The stair owner uses square-section members for its guard and handrail.
 * @evidenceReview spaces/02-stair.md #d17bdfd stair.ts calls stair-guards.ts, where bar forms the upper top rail and both sloped handrails while block forms square posts under the same stair owner; the stair design assigns those guard roles.
 * @evidence spaces/02-stair.md#stair-clearance The member follows caller-supplied endpoints and width beside the route.
 * @evidenceReview spaces/02-stair.md#stair-clearance #8753e6a The called stair-guards.ts helper centres handrails at turnX minus half RESERVE with RESERVE=opening.guardReserve=0.075 m; bar receives that section width from the stair design.
 * @evidence spaces/02-stair.md#stair-boundary-heights Its sloped endpoints can track a flight without losing a closed guard body.
 * @evidenceReview spaces/02-stair.md#stair-boundary-heights #3da4d8f The stair-guards.ts railTop formula uses nosing + 0.90 m minus half the square rail section; bar then constructs one closed member between its passed endpoints.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper adds no rail location; the stair author supplies both ends and size.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 from/to/size all from caller (L620).
 * @evidence principles/core/source-units.md#source-substantive-completion It builds outward square-section faces and handles a vertical segment.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Vertical -> block (L623-626); faces flipped outward by centroid test (L658-677).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stair-boundary-heights assigns open lower-flight guard and handrail rises, while stair-clearance keeps the route beside them; bar connects only the two supplied rail endpoints at their supplied section size.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The reviewed stair design already assigns the open lower-flight guard, 0.90 m handrail rise and 0.075 m side reservation; this bar primitive supplies a square-section member to the buildStair-called stair-guards.ts helper without revising those parents.
 */
export const bar = (from: IAutoMovieVector3, to: IAutoMovieVector3, size: number): IAutoMovieMesh => {
  const dir = sub(to, from);
  const horizontal = Math.hypot(dir.x, dir.z);
  if (horizontal === 0) return block(
    [from.x - size / 2, Math.min(from.y, to.y), from.z - size / 2],
    [from.x + size / 2, Math.max(from.y, to.y), from.z + size / 2],
  );
  const side = {
    x: (-dir.z / horizontal) * (size / 2),
    y: 0,
    z: (dir.x / horizontal) * (size / 2),
  };
  const lift = { x: 0, y: size / 2, z: 0 };
  const corner = (p: IAutoMovieVector3, s: number, l: number): IAutoMovieVector3 => ({
    x: p.x + side.x * s + lift.x * l,
    y: p.y + side.y * s + lift.y * l,
    z: p.z + side.z * s + lift.z * l,
  });
  const a = [
    corner(from, -1, -1),
    corner(from, 1, -1),
    corner(from, 1, 1),
    corner(from, -1, 1),
  ];
  const b = [
    corner(to, -1, -1),
    corner(to, 1, -1),
    corner(to, 1, 1),
    corner(to, -1, 1),
  ];
  const faces: IAutoMovieVector3[][] = [
    [a[0]!, a[3]!, a[2]!, a[1]!],
    [b[0]!, b[1]!, b[2]!, b[3]!],
  ];
  for (let i = 0; i < 4; ++i) {
    const j = (i + 1) % 4;
    faces.push([a[i]!, a[j]!, b[j]!, b[i]!]);
  }
  // Keep every face outward: a face whose normal points toward the bar axis is reversed.
  const mid = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
    z: (from.z + to.z) / 2,
  };
  return buildAutoMoviePolyhedron(
    faces.map((f) => {
      const n = cross(sub(f[1]!, f[0]!), sub(f[2]!, f[0]!));
      const c = f.reduce(
        (s, p) => ({
          x: s.x + p.x / f.length,
          y: s.y + p.y / f.length,
          z: s.z + p.z / f.length,
        }),
        { x: 0, y: 0, z: 0 },
      );
      const out = sub(c, mid);
      return n.x * out.x + n.y * out.y + n.z * out.z >= 0 ? f : [...f].reverse();
    }),
  );
};
