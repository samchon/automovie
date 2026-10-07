import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { AutoMovieHumanBodySourceAxis } from "./AutoMovieHumanBodySourceAxis";

/** A named anatomical articulation request consumed by the compiled source graph. */
export interface IAutoMovieHumanBodySourceJointGoal {
  /** Child bone whose source articulation owns this coordinate. */
  bone: AutoMovieHumanBodyBoneId;

  /** Named supported motion; the source determines applicability and direction. */
  axis: AutoMovieHumanBodySourceAxis;

  /** Absolute requested source coordinate, distinct from observed clinical capacity. */
  value: number;

  /** Explicit unit, matched to the source coordinate rather than silently converted. */
  unit: "degrees" | "metres";
}
