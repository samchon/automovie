import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * The refusal of a goal whose continued arm lost every swivel connected to its
 * seed that takes the hand's asked turn (`IAutoMovieSwivelSeed.vanished`),
 * told apart from every other refusal by its class, so a plan-time query of the
 * arc continuation (`HumanLimbFit.continues`) reads it as no fit and throws
 * every other.
 */
export class HumanLimbVanishedRefusal extends AutoMovieMotionHumanRefusal {
  public constructor(limb: "leftArm" | "rightArm") {
    super({
      kind: "reach",
      axis: "rotation",
      value: limb,
      reason: `the ${limb}'s hand turn leaves every swivel its continued elbow can reach: the arc of swivels where the wrist's range and the forearm's twist admit the turn vanished, and the next lies on another elbow path`,
      fix: "ease the hand's asked turn or move its site so one elbow path keeps it, or plan the span so the elbow changes path between frames",
    });
  }

  /*
   * Carry the reported arm through one mirror. Other errors pass unchanged.
   */
  public static reflected(error: unknown): unknown {
    return error instanceof HumanLimbVanishedRefusal
      ? new HumanLimbVanishedRefusal(
          error.value === "leftArm" ? "rightArm" : "leftArm",
        )
      : error;
  }
}
