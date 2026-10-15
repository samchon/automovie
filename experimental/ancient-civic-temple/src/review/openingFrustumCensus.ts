import { Quaternion } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import type { TempleObservation } from "../spaces/TempleObservation";
import { inViewerFrustum } from "./inViewerFrustum";
import { OpeningFrustumRow } from "./OpeningFrustumRow";

/**
 * Perspective/frustum audit for the complete compiled opening population.
 */
export const openingFrustumCensus = (environment: IAutoMovieBuiltEnvironment, observations: readonly TempleObservation[]): OpeningFrustumRow[] => environment.openings.map((opening) => {
  const boundary = environment.boundaries.find((entry) => entry.id === opening.boundary);
  if (boundary?.face === undefined || opening.profile === undefined) throw new Error(`frustum: ${opening.id} lacks host/profile`);
  const corners = opening.profile.outline.map((point) => {
    const delta = Quaternion.rotateVector(boundary.face!.rotation, { x: point.x, y: point.y, z: 0 });
    return { x: boundary.face!.origin.x + delta.x, y: boundary.face!.origin.y + delta.y, z: boundary.face!.origin.z + delta.z };
  });
  const center = corners.reduce((sum, corner) => ({ x: sum.x + corner.x / corners.length, y: sum.y + corner.y / corners.length, z: sum.z + corner.z / corners.length }), { x: 0, y: 0, z: 0 });
  const room = observations.find((entry) => entry.role === "opening-facing" && entry.id.endsWith(`.${opening.id}`));
  if (room?.position === undefined || room?.position === null || room.target === null) throw new Error(`frustum: ${opening.id} lacks room-facing pose`);
  const exterior = observations.find((entry) => entry.id === `exterior.opening.${opening.id}`);
  const arrival = opening.kind === "window" ? observations.find((entry) => entry.id === `sanctuary.threshold-${opening.id}`) : undefined;
  const count = (view: TempleObservation): number => view.position === null || view.target === null ? 0
    : corners.filter((point) => inViewerFrustum(view.position!, view.target!, point)).length;
  const roomCornersVisible = count(room);
  const exteriorCornersVisible = exterior === undefined ? null : count(exterior);
  return {
    id: opening.id, kind: opening.kind, roomView: room.id, roomPosition: room.position, roomTarget: room.target,
    roomCenterVisible: inViewerFrustum(room.position, room.target, center),
    roomCornersVisible, exteriorCornersVisible, completeProfileFramed: Math.max(roomCornersVisible, exteriorCornersVisible ?? 0) === corners.length,
    arrivalCenterVisible: arrival === undefined || arrival.position === null || arrival.target === null
      ? null : inViewerFrustum(arrival.position, arrival.target, center),
  };
});
