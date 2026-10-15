/** Perimeter observations derived from current boundary and opening hosts. */
import { builtSpaceObservationStations, Quaternion } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { templeViewerLens } from "../geometry/templeViewerLens";
import { templeDoorPassages } from "./templeDoorPassages";
import type { TempleObservation } from "./TempleObservation";
import { openingFacingEye } from "./openingFacingEye";


/**
 * Interior views bound to opening IDs and actual host profiles. Engine threshold
 * arrival directions are not mistaken for views facing the windows.
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

