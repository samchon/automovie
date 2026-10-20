import type { IAutoMovieMesh } from "@automovie/interface";
import type { HousePartRole } from "./HousePartRole";
import type { IWallFace } from "./IWallFace";

/**
 * An emitting space owner's solid record, transported to house assembly, material binding, measurements and the viewer. Geometry uses right-handed Y-up world metres; the record preserves the caller's identity, source ownership, surface role, colour and mesh rather than assigning or producing a second surface.
 *
 * Room owners supply their floor and ceiling finishes; envelope, roof, porch, site and chimney owners supply their own bodies. Optional wall data carries that body's rough openings, while pendingMapGround records a provisional displayed bottom rather than resolving terrain contact. This erased helper represents supplied geometry and allocates no runtime resource.
 */
export interface IHousePart {
  /** Emitted part address used by the mesh and boundary census. */
  id: string;

  /** Assigned emitting source path, including the separate lower garage wall and upper siding owners. */
  owner: string;

  /** Structural or finish family used by viewer and inspection grouping. */
  role: HousePartRole;

  /** Flat blocking colour; texture and optical material authoring remain with the material owner. */
  color: number;

  /** Caller-authored world-space geometry transported to the deterministic viewer and environment adapter. */
  mesh: IAutoMovieMesh;

  /** Pre-cut wall face and rough openings supplied only by an emitted wall or partition. */
  wall?: IWallFace;

  /** Exterior wall or fence displayed bottom still awaiting the map-ground handoff; this is a status, not a ground datum. */
  pendingMapGround?: "map-ground-pending";
}
