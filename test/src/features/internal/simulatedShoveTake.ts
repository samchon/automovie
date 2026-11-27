import type {
  AutoMovieHumanForceSite,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerturb,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSimulationWindow,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanChain, AutoMovieMotionHumanPerformance } from "@automovie/motions";

/**
 * One performer standing, then struck at a site and answering the impulse
 * with the named outcome (`perturb`): the take the simulated-window spec
 * and the cross-platform digest bake.
 *
 * @param body The performer's body.
 * @param at Where the impulse lands.
 * @param impulse World newton seconds.
 * @param outcome The perturbation's outcome, refused when the impulse cannot give it.
 * @param props The scene's props.
 * @returns The performance.
 */
export function simulatedShoveTake(
  body: IAutoMovieMotionHumanBody,
  at: AutoMovieHumanForceSite,
  impulse: IAutoMovieVector3,
  outcome: IAutoMovieMotionHumanPerturb.IParams["outcome"],
  props: IAutoMovieMotionHumanProp[],
): AutoMovieMotionHumanPerformance {
  return new AutoMovieMotionHumanPerformance({
    seed: "simulated-window",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props,
    forces: [
      {
        kind: "impulse",
        subject: "a",
        at,
        seconds: simulatedShoveTake.STRUCK,
        impulse,
      },
    ],
    composition: AutoMovieMotionHumanChain.subject("a")
      .stand({ hold: simulatedShoveTake.STRUCK, sway: 0 })
      .perturb({ outcome }).node,
  });
}

/** Companion constants and the shove of {@link simulatedShoveTake}. */
export namespace simulatedShoveTake {
  /** When the impulse lands and the reaction starts, film seconds. */
  export const STRUCK: number = 0.3;

  /** The shove's one-second window from the blow. */
  export const WINDOW: IAutoMovieMotionHumanSimulationWindow = {
    from: STRUCK,
    to: STRUCK + 1,
  };

  /**
   * A shove the body absorbs: an impulse on the head, from the front, that
   * changes the whole body's speed by 0.05 m/s.
   *
   * @param body The performer's body.
   * @returns The performance.
   */
  export function shove(body: IAutoMovieMotionHumanBody): AutoMovieMotionHumanPerformance {
    return simulatedShoveTake(
      body,
      { bone: "head", point: { x: 0, y: 0.1, z: 0 } },
      { x: 0, y: 0, z: -0.05 * body.profile.mass },
      "absorb",
      [],
    );
  }
}
