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

/**
 * What a part is, so the viewer and later reviews can group it.
 * @evidence spaces/03-surface-owners.md Surface families are allocated to their emitting spaces owners.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior roles distinguish envelope, roof, porch, site and chimney parts.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Interior roles distinguish room finishes, partitions, stair and guards.
 * @evidence principles/core/source-units.md#source-scope-preservation This role labels an assigned part without claiming its surface for the helper.
 * @evidence principles/core/source-units.md#source-substantive-completion The viewer can group every emitted structural or finish family.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The parent already allocates these surface families; the label revises none.
 */
export type HousePartRole =
  | "wall"
  | "partition"
  | "floor"
  | "ceiling"
  | "roof"
  | "stair"
  | "guard"
  | "porch"
  | "chimney"
  | "paving"
  | "fence";

/**
 * One emitted solid: a stable id, the source owner that authors it, its role,
 * its base colour, and its world-space mesh.
 * @evidence spaces/03-surface-owners.md Every surface part keeps the identity of its assigned emitting owner.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior parts preserve one author for each emitted body.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room parts keep their own floor, ceiling and partition ownership.
 * @evidence principles/core/source-units.md#source-scope-preservation The record carries an owner's geometry without making this helper the surface owner.
 * @evidence principles/core/source-units.md#source-substantive-completion Identity, owner, role, colour, mesh and optional wall face reach consumers together.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The surface allocation already exists in the design documents.
 */
export interface IHousePart {
  /**
   * @evidence spaces/03-surface-owners.md Each part has a stable address for inspection.
   * @evidence principles/core/source-units.md#source-scope-preservation The id names an emitted part rather than a second owner.
   * @evidence principles/core/source-units.md#source-substantive-completion A unique id supports mesh and boundary census.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stable part addresses implement existing verification needs.
   */
  id: string;
  /**
   * @evidence spaces/03-surface-owners.md The source path identifies the part's assigned surface author.
   * @evidence principles/core/source-units.md#source-scope-preservation The helper retains the caller's ownership rather than assigning itself.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can trace every part to a source owner.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Owner allocation was settled in the design; this field records it.
   */
  owner: string;
  /**
   * @evidence spaces/03-surface-owners.md The role groups a surface part by its spatial function.
   * @evidence principles/core/source-units.md#source-scope-preservation Classification does not transfer ownership between room and envelope authors.
   * @evidence principles/core/source-units.md#source-substantive-completion Viewer and review census can separate walls, floors, roof and site parts.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The role set reflects the existing surface allocation.
   */
  role: HousePartRole;
  /**
   * @evidence spaces/03-surface-owners.md The surface owner supplies a blocking base colour with its part.
   * @evidence principles/core/source-units.md#source-scope-preservation The field is a flat source colour, leaving texture and optics to materials.
   * @evidence principles/core/source-units.md#source-substantive-completion The mesh has a reproducible visible colour for inspection.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Base-colour handoff follows the existing material boundary.
   */
  color: number;
  /**
   * @evidence spaces/03-surface-owners.md The assigned owner emits a world-space body for its surface.
   * @evidence principles/core/source-units.md#source-scope-preservation This field carries the caller's mesh rather than synthesizing another surface owner.
   * @evidence principles/core/source-units.md#source-substantive-completion Triangles, normals and indices reach the deterministic viewer.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The design already requires realized space bodies.
   */
  mesh: IAutoMovieMesh;
  /**
   * @evidence spaces/03-surface-owners.md A wall part may expose its opening-bearing boundary alongside the mesh.
   * @evidence principles/core/source-units.md#source-scope-preservation Only an emitted wall or partition supplies this face.
   * @evidence principles/core/source-units.md#source-substantive-completion Openings can be hosted on the same wall body that was cut.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Wall-face handoff implements the existing opening ownership split.
   */
  wall?: IWallFace;
  /**
   * @evidence spaces/roof/00-junctions.md A roof part may leave its shared ridge and valley perimeter open while keeping its free eave sides.
   * @evidence spaces/roof/00-junctions.md#roof-shared-edges Shared roof edges have no internal vertical closure face.
   * @evidence principles/core/source-units.md#source-scope-preservation The flag records a roof owner's junction choice and does not open other solids.
   * @evidence principles/core/source-units.md#source-substantive-completion Geometry audit can distinguish an intentional shared roof seam from a missing wall face.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The roof junction design already disallows side faces on shared edges.
   */
  openSharedEdges?: boolean;
  /**
   * @evidence spaces/10-ground-floor.md Exposed wall closure and fence display may await actual map ground.
   * @evidence spaces/10-ground-floor.md#ground-support-handoff The marker distinguishes a temporary wall display bottom from structural support.
   * @evidence principles/core/source-units.md#source-scope-preservation This is a review status on an emitted part, never a terrain datum.
   * @evidence principles/core/source-units.md#source-substantive-completion Downstream inspection can identify provisional ground contacts by part id.
   * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The source exposed the absent wall bottom rule; the reviewed design now declares this marker.
   */
  pendingMapGround?: "map-ground-pending";
}

/**
 * The face of one wall panel before its voids are cut: the boundary record a
 * built environment hosts openings on. `outline` is the panel outline in the
 * panel's (u, y); `holes` are its voids, each a door, window or open passage.
 * @evidence spaces/07-boundary-assembly.md One wall body retains the boundary record used at room and envelope junctions.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership A partition's face and openings belong to its single wall body.
 * @evidence spaces/07-boundary-assembly.md#exterior-boundary-junctions Exterior junctions reuse the cut wall's face rather than a duplicate corner body.
 * @evidence principles/core/source-units.md#source-scope-preservation This record describes the caller's wall and does not own the room or facade.
 * @evidence principles/core/source-units.md#source-substantive-completion Axis, thickness, outline and void list define the inspection boundary.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Single-body boundary ownership was already specified by the parent design.
 */
export interface IWallFace {
  /**
   * @evidence spaces/07-boundary-assembly.md A wall boundary runs along one world horizontal axis.
   * @evidence principles/core/source-units.md#source-scope-preservation The axis describes the assigned wall's local frame only.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can orient holes and boundary checks in that frame.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Axis convention follows the existing wall plan.
   */
  axis: "x" | "z";
  /**
   * @evidence spaces/07-boundary-assembly.md The wall records its thickness across the running axis.
   * @evidence principles/core/source-units.md#source-scope-preservation This range is the caller's wall thickness, not a second boundary.
   * @evidence principles/core/source-units.md#source-substantive-completion It locates both faces of the one emitted wall body.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Wall thickness is already assigned in the boundary design.
   */
  across: readonly [number, number];
  /**
   * @evidence spaces/07-boundary-assembly.md The outer panel trace remains available after cutting openings.
   * @evidence principles/core/source-units.md#source-scope-preservation The trace belongs to the existing emitted wall.
   * @evidence principles/core/source-units.md#source-substantive-completion It allows void and junction validation against full wall bounds.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The full wall boundary was already required for the planned openings.
   */
  outline: readonly IWallPoint[];
  /**
   * @evidence spaces/07-boundary-assembly.md Door and window voids remain hosted by their cut wall.
   * @evidence principles/core/source-units.md#source-scope-preservation The list records cuts without creating door or window fills.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can verify every actual opening against the wall mesh.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Opening host ownership is settled by the existing boundary contract.
   */
  holes: readonly IWallHole[];
}

/**
 * A wall panel's mesh together with the face it was cut from.
 * @evidence spaces/07-boundary-assembly.md A boundary has one body and one associated cut-face record.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership Room partitions pair their physical body with the opening host.
 * @evidence principles/core/source-units.md#source-scope-preservation The pair stays under the caller's assigned wall owner.
 * @evidence principles/core/source-units.md#source-substantive-completion Geometry and opening-bearing face travel together.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The parent already requires a single wall body at shared boundaries.
 */
export interface IWallSolid {
  /**
   * @evidence spaces/07-boundary-assembly.md The wall's emitted body realizes the assigned boundary.
   * @evidence principles/core/source-units.md#source-scope-preservation The mesh belongs to the caller's wall owner.
   * @evidence principles/core/source-units.md#source-substantive-completion The boundary is actual geometry rather than a plan-only line.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The body follows the existing wall allocation.
   */
  mesh: IAutoMovieMesh;
  /**
   * @evidence spaces/07-boundary-assembly.md The same emitted wall carries the face and its voids.
   * @evidence principles/core/source-units.md#source-scope-preservation The face does not assign a second wall author.
   * @evidence principles/core/source-units.md#source-substantive-completion Openings and junction checks can inspect the cut body's source face.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The host relationship was already specified for space boundaries.
   */
  face: IWallFace;
}

/**
 * A point of a plan polygon in world X/Z metres.
 * @evidence spaces/00-building.md The house design uses one world plan frame for its extents.
 * @evidence spaces/00-building.md#main-building-extent Main-body outlines use fixed X/Z coordinates.
 * @evidence principles/core/source-units.md#source-scope-preservation The point is supplied by a design owner, not chosen by this helper.
 * @evidence principles/core/source-units.md#source-substantive-completion Both plan axes are present for closed surface rings.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The coordinate frame was settled in settings and building design.
 */
export interface IPlanPoint {
  /**
   * @evidence spaces/00-building.md World X places a plan point across the site.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the caller's authored X value.
   * @evidence principles/core/source-units.md#source-substantive-completion A horizontal coordinate is available to polygon builders.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The X frame follows the existing building design.
   */
  x: number;
  /**
   * @evidence spaces/00-building.md World Z places a plan point toward or away from the street.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the caller's authored Z value.
   * @evidence principles/core/source-units.md#source-substantive-completion A depth coordinate is available to polygon builders.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The Z frame follows the existing building design.
   */
  z: number;
}

/**
 * A point of a wall outline: u along the wall axis, y the world height.
 * @evidence spaces/07-boundary-assembly.md Cut wall panels retain their planar boundary trace.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions The trace supports continuous room corners and door heads.
 * @evidence principles/core/source-units.md#source-scope-preservation Coordinates describe the caller's wall only.
 * @evidence principles/core/source-units.md#source-substantive-completion Both running distance and height locate each outline vertex.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The wall outline realizes existing boundary geometry.
 */
export interface IWallPoint {
  /**
   * @evidence spaces/07-boundary-assembly.md This point locates a vertex along the wall run.
   * @evidence principles/core/source-units.md#source-scope-preservation The value uses the assigned wall's local running axis.
   * @evidence principles/core/source-units.md#source-substantive-completion The outline can order corners and door notches.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The wall run is already fixed in the parent plan.
   */
  u: number;
  /**
   * @evidence spaces/07-boundary-assembly.md This point locates a vertex at world height.
   * @evidence principles/core/source-units.md#source-scope-preservation The height follows the assigned wall datum.
   * @evidence principles/core/source-units.md#source-substantive-completion Head, sill and top vertices are explicit.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey and opening heights are already in the design.
   */
  y: number;
}

/**
 * A rectangular void cut through a wall panel, in the panel's (u, y).
 * @evidence spaces/06-openings.md Door and window sites are actual wall voids before model fills.
 * @evidence spaces/06-openings.md#external-opening-interface Exterior openings keep their structural host distinct from door/window models.
 * @evidence principles/core/source-units.md#source-scope-preservation This record cuts the assigned wall only and does not supply a model leaf.
 * @evidence principles/core/source-units.md#source-substantive-completion Id and four bounds locate a real rectangular cut.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The design already allocates opening voids to spaces sources.
 */
export interface IWallHole {
  /**
   * @evidence spaces/06-openings.md The opening retains a stable host-relative id.
   * @evidence principles/core/source-units.md#source-scope-preservation This names a void, not its later model fill.
   * @evidence principles/core/source-units.md#source-substantive-completion The environment can connect a compiled opening to its cut.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stable opening names serve the existing design.
   */
  id: string;
  /**
   * @evidence spaces/06-openings.md The void starts at a position along its host wall.
   * @evidence principles/core/source-units.md#source-scope-preservation The start lies in the existing wall coordinate frame.
   * @evidence principles/core/source-units.md#source-substantive-completion The left edge participates in a measurable opening width.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The planned opening width and location already have a host.
   */
  from: number;
  /**
   * @evidence spaces/06-openings.md The void ends at a position along its host wall.
   * @evidence principles/core/source-units.md#source-scope-preservation The end remains within the assigned wall run.
   * @evidence principles/core/source-units.md#source-substantive-completion Together with from, it fixes the cut width.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The planned opening span already exists in the design.
   */
  to: number;
  /**
   * @evidence spaces/06-openings.md The opening has a sill or threshold height.
   * @evidence principles/core/source-units.md#source-scope-preservation The lower edge describes a wall cut, not a separate threshold object.
   * @evidence principles/core/source-units.md#source-substantive-completion A floor-reaching opening can become a true bottom notch.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The threshold/sill relation was already specified for openings.
   */
  bottom: number;
  /**
   * @evidence spaces/06-openings.md The opening has an explicit head height.
   * @evidence principles/core/source-units.md#source-scope-preservation The top edge belongs to the host wall cut.
   * @evidence principles/core/source-units.md#source-substantive-completion Header clearance can be checked against the wall top.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Head height follows the existing opening design.
   */
  top: number;
}

/**
 * Axis-aligned box between two world corners.
 * @evidence spaces/03-surface-owners.md Assigned owners use box solids for their own structural or finish details.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff A caller may use this closed body for exterior details under its own owner id.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper chooses no house location; callers supply both world corners.
 * @evidence principles/core/source-units.md#source-substantive-completion It rejects nonpositive extents and returns a transformed closed box mesh.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Geometry conversion adds no new surface allocation to the parent.
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
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership A partition remains one body on its assigned run.
 * @evidence spaces/07-boundary-assembly.md#exterior-boundary-junctions Orientation and thickness preserve the single exterior wall body.
 * @evidence principles/core/source-units.md#source-scope-preservation Axis, outline and cuts are supplied by the caller; this helper owns no wall run.
 * @evidence principles/core/source-units.md#source-substantive-completion Region extrusion produces a mesh and its matching face record.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The one-body and opening-host rules already belong to boundary design.
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
 * @evidence spaces/07-boundary-assembly.md Straight partitions and envelope runs retain their full face despite cut door voids.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions A floor-reaching door becomes a bottom notch while its face lists the same void.
 * @evidence principles/core/source-units.md#source-scope-preservation Callers set wall axis, span and holes; this helper changes no room allocation.
 * @evidence principles/core/source-units.md#source-substantive-completion It validates hole bounds, forms notches, and returns the wall mesh plus full boundary.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The construction implements already planned partitions and doors.
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
 * @evidence spaces/08-floor-assembly.md#interstorey-floor-boundary Structural and finish slabs share a plan but have distinct vertical intervals.
 * @evidence spaces/08-floor-assembly.md#interstorey-edge-junctions Optional holes leave the stair opening out of the same floor body.
 * @evidence principles/core/source-units.md#source-scope-preservation The caller owns the polygon, cutouts and layer interval.
 * @evidence principles/core/source-units.md#source-substantive-completion Region extrusion creates a horizontal closed mesh with real plan holes.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Existing floor design assigns these layers and openings.
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
 * @evidence spaces/00-building.md Building and garage owners express plan extents in one world frame.
 * @evidence spaces/00-building.md#main-building-extent This helper turns a given extent into a four-corner ring.
 * @evidence principles/core/source-units.md#source-scope-preservation It adds no width or location beyond the caller's values.
 * @evidence principles/core/source-units.md#source-substantive-completion Four ordered corners form a reusable rectangular plan outline.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The parent building extent is unchanged by ring construction.
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
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums A vertical thickness or level underside closes each sloped roof face.
 * @evidence spaces/roof/00-junctions.md#roof-wall-head-junctions A caller can close a wall-head wedge against its own level floor.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper receives the plan, slope and underside; it creates no new roof mass.
 * @evidence principles/core/source-units.md#source-substantive-completion It validates the input and emits outward top, bottom and side faces.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof planes and wall-head ownership are already set by the roof design.
 */
export const slopedSlab = (props: {
  plan: readonly IPlanPoint[];
  top: (x: number, z: number) => number;
  /** Constant vertical thickness under the top; ignored when `floor` is given. */
  thickness?: number;
  /** An underside instead: a level (a beam packer) or a planar height function (a wall-head wedge). */
  floor?: number | ((x: number, z: number) => number);
  /** Free outline edges alone receive visible vertical thickness. */
  freeEdge?: (a: IPlanPoint, b: IPlanPoint) => boolean;
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
 * @evidence spaces/roof/main-front.md#main-front-roof This keeps the cut main front weather face and underside in one part.
 * @evidence principles/core/source-units.md#source-scope-preservation Roof owners identify their free outline; this helper never selects a roof junction.
 * @evidence principles/core/source-units.md#source-substantive-completion Each planar tile has an underside and only selected free sides close its thickness.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The roof design already distinguishes free perimeter from shared valley and ridge.
 */
export const slopedPlate = (props: {
  plans: readonly (readonly IPlanPoint[])[];
  top: (x: number, z: number) => number;
  thickness: number;
  freeEdge: (a: IPlanPoint, b: IPlanPoint) => boolean;
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
 * @evidence spaces/02-stair.md#stair-clearance The member follows caller-supplied endpoints and width beside the route.
 * @evidence spaces/02-stair.md#stair-boundary-heights Its sloped endpoints can track a flight without losing a closed guard body.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper adds no rail location; the stair author supplies both ends and size.
 * @evidence principles/core/source-units.md#source-substantive-completion It builds outward square-section faces and handles a vertical segment.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Existing stair design assigns the guard path and height.
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

/**
 * Build one part record.
 * @evidence spaces/03-surface-owners.md Each emitting source keeps its own owner id and surface role.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior wall parts retain their cut face without assigning a second owner.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room finish and partition parts keep the room's owner id.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper preserves caller identity, colour and geometry rather than selecting them.
 * @evidence principles/core/source-units.md#source-substantive-completion It returns a complete part and carries a wall face when the solid has one.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Source-owner allocation is already defined in the design.
 */
export const part = (id: string, owner: string, role: HousePartRole, color: number, solid: IAutoMovieMesh | IWallSolid, openSharedEdges = false): IHousePart =>
  "face" in solid
    ? {
        id,
        owner,
        role,
        color,
        mesh: solid.mesh,
        wall: solid.face,
        openSharedEdges,
      }
    : { id, owner, role, color, mesh: solid, openSharedEdges };
