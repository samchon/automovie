import type { IAutoMovieHumanBodySourceAxesJoint } from "./IAutoMovieHumanBodySourceAxesJoint";
import type { IAutoMovieHumanBodySourceFixedJoint } from "./IAutoMovieHumanBodySourceFixedJoint";
import type { IAutoMovieHumanBodySourcePublicPoseJoint } from "./IAutoMovieHumanBodySourcePublicPoseJoint";
import type { IAutoMovieHumanBodySourceToeRayJoint } from "./IAutoMovieHumanBodySourceToeRayJoint";
import type { IAutoMovieHumanBodySourceHumerothoracicJoint } from "./IAutoMovieHumanBodySourceHumerothoracicJoint";

/** Anatomical source kinematics; an axial/sliding axis remains independent of a fixed carrier. */
export type AutoMovieHumanBodySourceJoint =
  | IAutoMovieHumanBodySourceFixedJoint
  | IAutoMovieHumanBodySourcePublicPoseJoint
  | IAutoMovieHumanBodySourceToeRayJoint
  | IAutoMovieHumanBodySourceAxesJoint
  | IAutoMovieHumanBodySourceHumerothoracicJoint;
