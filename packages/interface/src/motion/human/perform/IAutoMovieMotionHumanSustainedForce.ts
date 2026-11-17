import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanForceSite } from "./AutoMovieHumanForceSite";

/**
 * A world force in newtons acting on a performer over a film-time interval in seconds. The force may be constant or a deterministic callback of film time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A world force in newtons acting on a performer over a film-time interval in seconds. The force may be constant or a deterministic callback of film time.
 * @evidence contracts/development/design.md#principled-representation from: Film seconds, start. to: Film seconds, end. force: World newtons on the body, constant or a pure function of film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanForceExchange publishes sustained pulls and HumanLoad/HumanForceResponse consume them through the common force union.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The interval and callback use film seconds; the vector is world newtons. Runtime force filtering and the receiving law own interval admission and physical response.
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
