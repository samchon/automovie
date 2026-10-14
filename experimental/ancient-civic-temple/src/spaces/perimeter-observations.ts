/** Perimeter observations derived from current boundary and opening hosts. */
import { builtEnvironmentBuildingCensus, builtSpaceContainsPoint, builtSpaceObservationStations, builtSpaceVolumeBounds, Quaternion } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";
import { templeExteriorSettingView, templeObservationEye as eye, templeViewerLens } from "../geometry/observation-datum";
import { templePlan as p } from "./building";
import { templeDoorPassages } from "./openings";
import { templeRoofRules } from "./roofs/assembly";
import type { TempleObservation } from "./observations";


/**
 * Follow the opening's actual host normal toward the compiled room centre, then stand back from its far wall.
 * @evidence spaces/observations.md The opening-facing camera position is compiled from the current host and room geometry.
 * @evidence spaces/observations.md#geometry-observations The room-facing observation is derived from the compiled host and room volume instead of copying a door coordinate.
 * @evidence principles/core/source-units.md#source-scope-preservation This function locates a camera only; it does not create another opening, room, or building surface.
 * @evidence principles/core/source-units.md#source-substantive-completion The room-side point is tested against the room's own compiled volume and returns null when the host direction cannot supply one.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The corrected observation rule was paid at observations.md#geometry-observations before this helper realized it.
 */
export const openingFacingEye = (
  space: IAutoMovieBuiltSpace, mouth: IAutoMovieVector3, normal: IAutoMovieVector3, anchor: IAutoMovieVector3,
  eyeHeight: number, desiredDistance: number,
): IAutoMovieVector3 | null => {
  const bounds = builtSpaceVolumeBounds(space);
  if (bounds === null) return null;
  const length = Math.hypot(normal.x, normal.z);
  if (length < 1e-9) return null;
  const reach = Math.hypot(bounds.max.x - bounds.min.x, bounds.max.z - bounds.min.z) + 1;
  const at = (sign: number, distance: number): IAutoMovieVector3 => ({
    x: mouth.x + sign * normal.x / length * distance,
    y: eyeHeight,
    z: mouth.z + sign * normal.z / length * distance,
  });
  const direction = (anchor.x - mouth.x) * normal.x + (anchor.z - mouth.z) * normal.z;
  if (Math.abs(direction) < 1e-9) return null;
  const side = Math.sign(direction);
  let farthest = 0;
  for (let index = 1; index / 10 <= reach; index++) {
    if (builtSpaceContainsPoint(space, at(side, index / 10))) farthest = index / 10;
  }
  const setback = Math.min(0.3, farthest / 2);
  const position = at(side, Math.min(farthest - setback, desiredDistance));
  return builtSpaceContainsPoint(space, position) ? position : null;
};

/**
 * Interior views bound to opening IDs and actual host profiles. Engine threshold
 * arrival directions are not mistaken for views facing the windows.
 * @evidence spaces/observations.md Adds room-side views to the actual opening observation population.
 * @evidence spaces/observations.md#geometry-observations Gives each of sixteen openings a separate interior pose facing its profile.
 * @evidence principles/core/source-units.md#source-scope-preservation Derives views from spaces, boundaries and openings without adding geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns an interior eye-height pose targeting the actual profile center for every opening ID, rejecting positions outside the space.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work clerestories excludes arrival thresholds from window inspection and requires ID-facing poses; geometry-observations first established separate room-side views for all sixteen doors and windows.
 */
export const openingFacingObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  return environment.openings.map((opening) => {
    const boundary = environment.boundaries.find((entry) => entry.id === opening.boundary);
    if (boundary?.face === undefined || opening.profile === undefined) {
      throw new Error(`temple/observations: ${opening.id} host/profile missing`);
    }
    const room = opening.kind === "window" ? "sanctuary" : templeDoorPassages.find((door) => door.id === opening.id)?.room;
    const space = environment.spaces.find((entry) => entry.id === room);
    const outline = opening.profile.outline;
    const u = (Math.min(...outline.map((corner) => corner.x)) + Math.max(...outline.map((corner) => corner.x))) / 2;
    const v = (Math.min(...outline.map((corner) => corner.y)) + Math.max(...outline.map((corner) => corner.y))) / 2;
    const delta = Quaternion.rotateVector(boundary.face.rotation, { x: u, y: v, z: 0 });
    const target = { x: boundary.face.origin.x + delta.x, y: boundary.face.origin.y + delta.y, z: boundary.face.origin.z + delta.z };
    const normal = Quaternion.rotateVector(boundary.face.rotation, { x: 0, y: 0, z: 1 });
    const anchor = room === undefined ? undefined : builtSpaceObservationStations(environment, room).find((station) => station.id === "center-x-minus")?.pose?.position;
    // Interior inspection stays level with the opening; the required centre/corner views remain at floor + 1.6 m.
    const eyeHeight = target.y;
    const profileHeight = Math.max(...outline.map((corner) => corner.y)) - Math.min(...outline.map((corner) => corner.y));
    // Fit the physical profile within 70% of the shared vertical view; keep at least 2 m of wall context.
    const desiredDistance = Math.max(profileHeight / (0.7 * 2 * Math.tan(templeViewerLens.halfVerticalRadians)), 2);
    const position = space === undefined || anchor === undefined ? null
      : openingFacingEye(space, target, normal, anchor, eyeHeight, desiredDistance);
    if (position === null) throw new Error(`temple/observations: ${opening.id} room-facing eye outside ${room ?? "?"}`);
    return {
      id: `${room}.opening-facing.${opening.id}`, group: "space", space: room!, role: "opening-facing",
      label: `${room} · ${opening.id} room side`, position, target,
      note: opening.kind === "window" ? "Faces this high window's host profile from inside the sanctuary" : "Faces this door ID's host profile",
    };
  });
};

/** Distance in meters at which width fills about 78% of the shared comparison frame. */
const fitDistance = (width: number): number => (width / 0.78) / 2 / (Math.tan(templeViewerLens.halfVerticalRadians) * templeViewerLens.aspect);

/**
 * @evidence spaces/observations.md Derives exterior setting, boundary and opening observations from the current environment.
 * @evidence spaces/observations.md#geometry-observations Uses exposed census facades and actual opening profiles for exterior views.
 * @evidence principles/core/source-units.md#source-scope-preservation Reads current boundaries and openings to create views without reauthoring facades or windows.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns stable IDs for setting, facades, four corners, roofs, undersides and exterior openings.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work geometry-observations first corrected four low recessed-wall poses facing the wrong wall side and specified new views for anta ends and both porch gables; this implements those rules.
 */
export const exteriorObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const census = builtEnvironmentBuildingCensus(environment)[0];
  const center = { x: 0, y: 2.2, z: 0 };
  const out: TempleObservation[] = [{
    id: "exterior.setting", group: "exterior", space: null, role: "setting", label: "Exterior setting · front-left overhead",
    position: templeExteriorSettingView.position, target: templeExteriorSettingView.target, note: null,
  }];
  for (const face of census?.facades ?? []) {
    const width = Math.max(...face.vertices.map((v) => Math.hypot(v.x - face.centroid.x, v.z - face.centroid.z))) * 2;
    const outward = outwardNormal(environment, face.space, face.centroid, face.normal);
    // View raised exterior-facing boundaries above roofs or yards from above the face at the same fit distance.
    const elevated = face.centroid.y > templeRoofRules.courtEave;
    const distance = Math.max(4, fitDistance(Math.max(width, 3)));
    // The free front ends of the two porch returns face the open porch. Their opposite
    // sides meet the south-wing wall, so an outward offset would bury the camera there.
    const porchFront = face.boundary.startsWith("boundary-entrance-return-") && face.boundary.endsWith(".front");
    const returnOuterUpper = face.boundary.startsWith("boundary-entrance-return-") && face.boundary.endsWith(".outer-upper");
    const entryEndUpper = /^boundary-entry\.(west|east)-end\.upper$/.test(face.boundary);
    const entrySideUpper = /^boundary-entry\.(west|east)-side\.upper$/.test(face.boundary);
    const entryEndLower = /^boundary-entry\.(west|east)-end$/.test(face.boundary);
    const entrySideLower = /^boundary-entry\.(west|east)-side$/.test(face.boundary);
    const streetEnd = /^boundary-entrance-return-(west|east)\.street-end$/.test(face.boundary);
    const pedimentFront = face.boundary === "boundary-porch-pediment.front";
    const pedimentBack = face.boundary === "boundary-porch-pediment.back";
    const returnSide = face.boundary.includes("west") ? -1 : 1;
    out.push({
      id: `exterior.facade.${face.boundary}`, group: "exterior", space: null, role: "facade",
      label: `Facade · ${face.boundary}`,
      position: porchFront ? {
        x: (p.westPorchInner + p.eastPorchInner) / 2, y: 3.0, z: p.southOuter + 4,
      } : returnOuterUpper ? {
        x: returnSide * 5.0, y: 6.0, z: face.centroid.z,
      } : entryEndUpper ? {
        x: face.centroid.x, y: 5.7, z: p.entranceBack - 4,
      } : entrySideUpper ? {
        x: returnSide * 5.0, y: 5.8, z: p.entranceBack - 2,
      } : entryEndLower ? {
        x: face.centroid.x, y: eye, z: (p.courtBack + p.courtFront) / 2,
      } : entrySideLower ? {
        x: returnSide * 4.2, y: 1.4, z: (p.entranceBack + p.entranceFront) / 2,
      } : streetEnd ? {
        x: face.centroid.x, y: 2.6, z: p.southOuter + 4,
      } : pedimentFront ? {
        x: 0, y: 4.8, z: p.southOuter + 4,
      } : pedimentBack ? {
        x: 0, y: 3.3, z: p.southInner - templeRoofRules.overhang,
      } : {
        x: face.centroid.x + outward.x * distance, y: elevated ? face.centroid.y + 0.8 : eye + 0.6,
        z: face.centroid.z + outward.z * distance,
      },
      target: { ...face.centroid, y: Math.max(1.2, face.centroid.y) }, note: null,
    });
  }
  for (const [id, x, z, text] of [
    ["northwest", p.westOuter, p.northOuter, "northwest"], ["northeast", p.eastOuter, p.northOuter, "northeast"],
    ["southwest", p.westOuter, p.southOuter, "southwest"], ["southeast", p.eastOuter, p.southOuter, "southeast"],
  ] as const) {
    const d = Math.hypot(x, z);
    out.push({
      id: `exterior.corner.${id}`, group: "exterior", space: null, role: "corner", label: `Exterior corner · ${text}`,
      position: { x: x + x / d * 15, y: 3, z: z + z / d * 15 }, target: { x, y: 2, z }, note: null,
    });
  }
  for (const [id, x, z, text] of [
    ["north", 0, -1, "north"], ["east", 1, 0, "east"], ["south", 0, 1, "south"], ["west", -1, 0, "west"],
  ] as const) {
    out.push({
      id: `exterior.roof.${id}`, group: "exterior", space: null, role: "roof", label: `Roof · ${text} overhead`,
      position: { x: x * 24, y: 17, z: z * 24 }, target: center, note: null,
    });
    const edge = id === "north" ? p.northOuter : id === "south" ? p.southOuter : id === "east" ? p.eastOuter : p.westOuter;
    const along = Math.abs(x) > 0 ? { x: edge + x * 3.2, z: 0 } : { x: 0, z: edge + z * 3.2 };
    out.push({
      id: `exterior.underside.${id}`, group: "exterior", space: null, role: "underside", label: `Eave underside · ${text}`,
      position: { x: along.x + (Math.abs(x) > 0 ? 0 : -6), y: eye, z: along.z + (Math.abs(z) > 0 ? 0 : 6) },
      target: { x: Math.abs(x) > 0 ? edge : 2, y: 3.3, z: Math.abs(z) > 0 ? edge : -2 }, note: null,
    });
  }
  for (const opening of environment.openings) {
    const boundary = environment.boundaries.find((b) => b.id === opening.boundary);
    const face = boundary?.face;
    if (boundary === undefined || face === undefined || boundary.spaces.length !== 1) continue;
    const xs = opening.profile?.outline.map((q) => q.x) ?? [0];
    const ys = opening.profile?.outline.map((q) => q.y) ?? [0];
    const u = (Math.min(...xs) + Math.max(...xs)) / 2;
    const v = (Math.min(...ys) + Math.max(...ys)) / 2;
    const alongZ = Math.abs(face.rotation.y) > 1e-6;
    const mouth = alongZ ? { x: face.origin.x, y: v, z: u } : { x: u, y: v, z: face.origin.z };
    const outward = outwardNormal(environment, boundary.spaces[0]!, mouth, alongZ ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 });
    out.push({
      id: `exterior.opening.${opening.id}`, group: "exterior", space: null, role: "opening", label: `Exterior opening · ${opening.id}`,
      // View high windows above roofs or yards from nearby outside, slightly above the window.
      position: v > templeRoofRules.courtEave
        ? { x: mouth.x + outward.x * 2.5, y: v + 0.6, z: mouth.z + outward.z * 2.5 }
        : { x: mouth.x + outward.x * 7, y: Math.max(eye, v - 0.8), z: mouth.z + outward.z * 7 },
      target: mouth, note: null,
    });
  }
  const entry = environment.openings.find((o) => o.id === "door-entry");
  if (entry !== undefined) {
    out.push({
      id: "exterior.opening.door-entry", group: "exterior", space: null, role: "opening", label: "Exterior opening · door-entry (entry axis)",
      position: { x: 0, y: eye, z: p.southOuter + 7 }, target: { x: 0, y: 1.4, z: p.entranceBack }, note: null,
    });
  }
  return out;
};

/** Orient the face normal outward, flipping it if the point 0.5 m ahead is inside the space. */
const outwardNormal = (
  environment: IAutoMovieBuiltEnvironment, space: string, at: IAutoMovieVector3, normal: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const probe = { x: at.x + normal.x * 0.5, y: 1.2, z: at.z + normal.z * 0.5 };
  const inside = environment.spaces.find((s) => s.id === space)?.cells.some((cell) =>
    cell.planes.every((plane) => plane.normal.x * probe.x + plane.normal.y * probe.y + plane.normal.z * probe.z <= plane.offset)) ?? false;
  const length = Math.hypot(normal.x, normal.z) || 1;
  const sign = inside ? -1 : 1;
  return { x: sign * normal.x / length, y: 0, z: sign * normal.z / length };
};
