import type { IAutoMovieVector3 } from "@automovie/interface";


/**
 * One review camera station derived from the built cells, connectors and faces; a failed placement
 * keeps its station with a null pose.
 */
export type Observation = {
  /** Station identity within its space. */
  id: string;
  /** Space the station looks at. */
  space: string;
  /** Kind of question the station answers, such as `center` or `reference`. */
  role: string;
  /**
   * Space holding the camera when it differs from `space`, as for a reference view from an
   * adjoining room.
   */
  cameraSpace?: string;
  /** World eye position and target, or null when no clear position exists. */
  pose: { position: IAutoMovieVector3; target: IAutoMovieVector3; } | null;
  /** Why the pose is missing or how it was chosen; empty when nothing needs saying. */
  reason: string;
  /** Horizontal section to apply: the cut height and which side of it to remove. */
  section?: { height: number; remove: "above" | "below"; };
  /** Vertical field of view in degrees. */
  fov: number;
};
