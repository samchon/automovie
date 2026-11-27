import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanForceSite } from "./AutoMovieHumanForceSite";

/**
 * A world force in newtons acting on a performer over a film-time interval in
 * seconds. The force may be constant or a deterministic callback of film time.
 */
export interface IAutoMovieMotionHumanSustainedForce {
  /** The discriminator. */
  kind: "sustained";

  /** The person it acts on. */
  subject: string;

  /** Where it acts. */
  at: AutoMovieHumanForceSite;

  /** Film seconds, start. */
  from: number;

  /** Film seconds, end. */
  to: number;

  /** World newtons on the body, constant or a pure function of film seconds. */
  force: IAutoMovieVector3 | ((seconds: number) => IAutoMovieVector3);
}
