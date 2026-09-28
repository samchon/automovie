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
 * @evidenceReview spaces/03-surface-owners.md # `block` returns only a mesh from caller corners; the porch, left chimney, entry, and stair guard builders wrap it as parts under their assigned owners.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff A caller may use this closed body for exterior details under its own owner id.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #51ba773 `buildPorch` uses closed blocks for its beam, `buildLeft` for the chimney cap, and the fence builder for posts; each caller sets the part owner after this mesh helper returns.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper chooses no house location; callers supply both world corners.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The `min` and `max` world corners are both caller arguments; `block` calculates their differences and midpoint without choosing a location or material.
 * @evidence principles/core/source-units.md#source-substantive-completion It rejects nonpositive extents and returns a transformed closed box mesh.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `block` rejects any width, height, or depth that is not positive, tessellates a closed box of those extents, and translates it to the corners' midpoint.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns chimney and porch parts to their respective builders; block extrudes their supplied world corners without allocating another face owner.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `exterior-surface-handoff` assigns chimney parts to `left.ts` and porch parts to `porch.ts`; this primitive only meshes their supplied corners and leaves the source owner on each caller's `part` record.
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
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 `wallPanel` converts one owner-supplied wall outline and its rectangular hole rings into an extruded mesh, retaining a matching face record for the shared boundary.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership A partition remains one body on its assigned run.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-ownership #6a03f13 `straightWall` calls `wallPanel` once for a partition's notched outline and remaining interior holes, preserving one physical wall body for that assigned run.
 * @evidence spaces/07-boundary-assembly.md#exterior-boundary-junctions Orientation and thickness preserve the single exterior wall body.
 * @evidenceReview spaces/07-boundary-assembly.md#exterior-boundary-junctions #11dbbb5 The caller's `axis` and `across` transform the one extruded panel into its X- or Z-running wall thickness, so a corner body is not generated again by this helper.
 * @evidence principles/core/source-units.md#source-scope-preservation Axis, outline and cuts are supplied by the caller; this helper owns no wall run.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `wallPanel` takes axis, thickness range, outline, and holes from `props`; it contributes the mesh and face representation but no independent wall location.
 * @evidence principles/core/source-units.md#source-substantive-completion Region extrusion produces a mesh and its matching face record.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `extrudeAutoMovieRegion` cuts the supplied hole rings, then the function returns the transformed mesh alongside a face with the same axis, range, outline, and holes.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership gives each partition one body and its door void, while external-opening-interface cuts a rough opening through its host wall; wallPanel emits that body and matching face record.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `interior-boundary-ownership` assigns one cut partition body and `external-opening-interface` assigns through-wall rough voids; this helper returns each caller's meshed body and matching face without a new boundary decision.
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
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 Room partition and stair-wall callers use `straightWall` for their assigned runs; it returns one meshed body and one complete boundary face that records every opening.
 * @evidence spaces/06-openings.md#external-opening-interface A floor-reaching door becomes a bottom notch in the extruded wall outline rather than an interior hole ring.
 * @evidenceReview spaces/06-openings.md#external-opening-interface #457149c `straightWall` moves holes touching `props.bottom` into the outer outline as open notches and passes only fully enclosed holes to `wallPanel`, matching the opening-interface extrusion rule.
 * @evidence principles/core/source-units.md#source-scope-preservation Callers set wall axis, span and holes; this helper changes no room allocation.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The caller supplies the wall axis, across and along intervals, bottom/top, and hole records; the helper decides the mesh cut representation without reallocating the room boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion It validates hole bounds, forms notches, and returns the wall mesh plus full boundary.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The helper rejects out-of-run holes, builds notches for floor-touching ones, and returns the meshed wall with a full rectangular face listing all holes for downstream boundary checks.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `interior-boundary-ownership` assigns one common partition body, `interior-boundary-junctions` keeps its cut and finishes aligned, and `external-opening-interface` states the open-notch extrusion rule that straightWall applies.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `straightWall` produces one notched partition mesh with a complete face and hole list; the three named parents separately supply single-body ownership, shared cut alignment, and the bottom-notch representation, so no new wall rule is needed.
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
 * @evidenceReview spaces/08-floor-assembly.md # `slab` extrudes a caller's horizontal outline between its bottom and top, allowing the assigned floor or ceiling owner to provide its own vertical layer interval.
 * @evidence spaces/08-floor-assembly.md#interstorey-floor-boundary The interstorey structural caller supplies its front-reaching stair notch, while room finish callers supply their individual outlines.
 * @evidenceReview spaces/08-floor-assembly.md#interstorey-floor-boundary #58ff097 `buildInterstorey` sends its recessed ten-corner ring to `slab`, while `roomFloor` sends the caller's circulation or shallow-storage outline at the assigned finish level; the primitive chooses neither boundary.
 * @evidence spaces/08-floor-assembly.md#interstorey-edge-junctions The interstorey caller recedes its structural stair edge by the 0.015 m finish reservation before slab extrusion.
 * @evidenceReview spaces/08-floor-assembly.md#interstorey-edge-junctions # `buildInterstorey` offsets the stair-opening turns by `OPENING_EDGE`, then passes that receded plan ring to `slab`; the stair owner can finish the exposed edge without this helper choosing the inset.
 * @evidence principles/core/source-units.md#source-scope-preservation The caller owns the polygon, cutouts and layer interval.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The outline, optional plan holes, and two heights all come from `props`; `slab` does not choose the stair cutout or claim the layer owner.
 * @evidence principles/core/source-units.md#source-substantive-completion Region extrusion creates a horizontal closed mesh with real plan holes.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `extrudeAutoMovieRegion` receives the outer ring and any optional hole rings, then the mesh is rotated into the world X/Z plan and translated to the supplied height interval; current stair geometry uses an outer notch.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `interstorey-floor-boundary` assigns structure and room finishes plus the front-reaching stair notch; `interstorey-edge-junctions` assigns its 0.015 m structural recession, and the callers pass those plans to slab.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `buildInterstorey` supplies the notched outer ring and its inset, while room finish callers supply their own outlines and intervals; `slab` extrudes these reviewed choices without assigning a second floor boundary.
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
 * @evidenceReview spaces/site/00-access.md #a8ac95c `rect` orders world X/Z intervals supplied by building, floor, porch, and site-zone callers, so their plan outlines remain in the same site frame without a local origin shift.
 * @evidence spaces/site/00-access.md#site-access-interface This helper preserves the caller's X/Z frame while forming a four-corner ring.
 * @evidenceReview spaces/site/00-access.md#site-access-interface #0ee9bff The helper returns four corners in the supplied X/Z frame, consistent with the parent's house-site extent and ground-storey exterior zones.
 * @evidence principles/core/source-units.md#source-scope-preservation It adds no width or location beyond the caller's values.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `rect` reads only the two input X values and two input Z values; no site width, offset, or placement is declared inside the helper.
 * @evidence principles/core/source-units.md#source-substantive-completion Four ordered corners form a reusable rectangular plan outline.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The returned plan ring orders `(x0,z0)`, `(x1,z0)`, `(x1,z1)`, `(x0,z1)`, giving callers a reusable rectangular outline.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface assembles main house, garage, and exterior zones in the common X/Z frame from coordinate-units; rect only orders the two intervals supplied by each actual owner.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `site-access-interface` keeps building and exterior zones in the common world frame; `rect` merely orders intervals supplied by those owners, so it exposes no missing site placement decision.
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
 * @evidenceReview spaces/roof/00-junctions.md #6b8a777 `slopedSlab` receives a planar top function and caller-supplied vertical thickness or lower face; roof builders use their profile functions while `wallHead` uses the same mesh primitive across wall thickness.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums A caller-supplied vertical thickness closes each sloped roof face below its weather plane.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums #dd15c02 Main and garage roof callers pass `ROOF_THICKNESS` with their profile top functions; `slopedSlab` subtracts that thickness in world Y for the underside specified by the roof datum.
 * @evidence spaces/roof/00-junctions.md#roof-wall-head-junctions A caller can close a wall-head wedge against its own level floor.
 * @evidenceReview spaces/roof/00-junctions.md#roof-wall-head-junctions #0de3b07 `wallHead` passes the roof underside as `top` across its Z range and the outer wall-line underside as level `floor`; the resulting wedge fills the higher inner contact.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper receives the plan, slope and underside; it creates no new roof mass.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The plan, top function, and thickness or floor all come from the caller; the helper contains no ridge, eave, or roof-mass coordinate of its own.
 * @evidence principles/core/source-units.md#source-substantive-completion It validates the input and emits outward top, bottom and side faces.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The function rejects fewer than three corners or absent positive thickness/floor, orients the top upward, reverses the lower face, and closes selected free edges with side faces.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums fixes a vertical 0.24 m reservation for main and garage planes, porch-roof-columns fixes its own roof underside, and roof-wall-head-junctions consumes the slope across wall thickness; slopedSlab applies only the caller's assigned plan and height.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `roof-profile-datums` fixes main/garage vertical underside depth, `porch-roof-columns` fixes its separate depth, and `roof-wall-head-junctions` fixes the wall-thickness slope contact; their callers provide each plan, top, and lower face to this helper.
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
 * @evidenceReview spaces/roof/main-front.md #e6bfeed `buildMainFrontRoof` passes four convex remainder tiles to one `slopedPlate`; the caller's `freeEdge` excludes shared tile seams so the concave roof remains one visible part.
 * @evidence spaces/roof/main-front.md#main-front-roof This keeps the cut main front weather face and underside in one part.
 * @evidenceReview spaces/roof/main-front.md#main-front-roof #c436e55 `slopedPlate` collects top and reversed underside faces from every tile and makes one polyhedron, adding thickness sides only on the caller-marked free perimeter.
 * @evidence principles/core/source-units.md#source-scope-preservation Roof owners identify their free outline; this helper never selects a roof junction.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The caller supplies the tile plans, top function, vertical thickness, and `freeEdge` predicate; this primitive does not choose a valley or chimney notch.
 * @evidence principles/core/source-units.md#source-substantive-completion Each planar tile has an underside and only selected free sides close its thickness.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Each tile contributes its weather face and vertical-offset underside; sides are added only when `freeEdge` returns true, and all faces form one returned mesh.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `roof-shared-edges` fixes coincident valley/ridge boundaries, while `main-front-roof` forbids internal closing faces; `slopedPlate` closes only caller-marked free perimeter edges of its roof tiles.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `buildMainFrontRoof` gives this helper its gable/chimney-cut tiles and a `freeEdge` predicate that rejects coincident tile seams and shared roof edges; the cited parents already define those boundaries and the one-part closure.
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
 * @evidenceReview spaces/02-stair.md # `buildStair` calls `buildStairGuards`, which uses `bar` for its upper guard top rail and two sloped handrails under the stair owner, alongside separate block posts.
 * @evidence spaces/02-stair.md#stair-clearance The member follows caller-supplied endpoints and width beside the route.
 * @evidenceReview spaces/02-stair.md#stair-clearance #8753e6a `buildStairGuards` sets each `bar` size from the 0.075 m `guardReserve` and centres lower/upper rails within their reserved side strips beside the stair route.
 * @evidence spaces/02-stair.md#stair-boundary-heights Its sloped endpoints can track a flight without losing a closed guard body.
 * @evidenceReview spaces/02-stair.md#stair-boundary-heights # `railTop` places bar centres at nosing plus 0.90 m minus half their section, while the upper hall top rail centres at upper floor plus 1.05 m minus half its section.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper adds no rail location; the stair author supplies both ends and size.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `bar` receives both world endpoints and its square width from its caller; it constructs no stair station or guard height itself.
 * @evidence principles/core/source-units.md#source-substantive-completion It builds outward square-section faces and handles a vertical segment.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f A vertical segment delegates to `block`; a sloped one forms two square caps and four long faces, reversing any face whose normal points toward the bar midpoint.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stair-boundary-heights assigns open lower-flight guard and handrail rises, while stair-clearance keeps the route beside them; bar connects only the two supplied rail endpoints at their supplied section size.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `stair-boundary-heights` supplies the 0.90 m sloped and 1.05 m fall-edge rail tops, while `stair-clearance` supplies the side reserve; `buildStairGuards` passes those derived endpoints and section width to this primitive.
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
