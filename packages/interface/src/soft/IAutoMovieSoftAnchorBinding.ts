import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/** Moving subject-local point that drives one soft anchor. */
export type IAutoMovieSoftAnchorBinding =
  | {
      /** Bind to a production scene node. */
      kind: "node";

      /** Stable scene-node identity. */
      node: string;

      /** Node-local anchor offset in meters. */
      offset: IAutoMovieVector3;
    }
  | {
      /** Bind to a humanoid bone on an actor. */
      kind: "actor-bone";

      /** Stable actor participant identity. */
      actor: string;

      /** Humanoid bone that owns the local point. */
      bone: AutoMovieHumanoidBone;

      /** Bone-local anchor offset in meters. */
      offset: IAutoMovieVector3;
    };
