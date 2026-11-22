import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanSignature,
  IAutoMovieResolvedBone,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGrapple,
  AutoMovieMotionHumanStageFight,
  AutoMovieMotionHumanStrike,
  AutoMovieMotionHumanThrowCatch,
  HumanFoot,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";

/**
 * The combat-style specs' shared staging: two performers facing at a
 * distance with the strike, stage-fight, sport-throw and grapple laws, the
 * placed action by its anchor, and a named point of a displayed foot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three helpers.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory performances, with no host or capture.
 */
export namespace motionCombatPair {
  /** The two canonical bodies. */
  export type Name = "f-small" | "m-average";

  /** A named point of the sole. */
  export type FootPoint = "heel" | "ball" | "sole";

  /**
   * A pair facing at a distance, the first acting.
   *
   * @param body The body both performers take.
   * @param distance Metres between their marks.
   * @param composition What they perform.
   * @param seed The performance's seed.
   * @returns The placed performance.
   */
  export function pair(
    body: IAutoMovieMotionHumanBody,
    distance: number,
    composition: Pick<IAutoMovieMotionHumanChainCore, "node">,
    seed: string,
  ): HumanPerformance {
    return new HumanPerformance({
      seed,
      laws: [
        ...Object.values(AutoMovieMotionHumanStrike.HumanStrike),
        AutoMovieMotionHumanStageFight.stageBladeFootwork,
        ...Object.values(AutoMovieMotionHumanThrowCatch.HumanSportThrow),
        AutoMovieMotionHumanGrapple.grapple,
      ],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body,
          at: { x: 0, y: 0, z: distance },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: composition.node,
    });
  }

  /**
   * The placed action by anchor.
   *
   * @param film The performance.
   * @param anchor The anchor.
   * @returns The schedule entry.
   * @throws {Error} When nothing carries the anchor.
   */
  export function placed(
    film: HumanPerformance,
    anchor: string,
  ): IAutoMovieScheduleEntry {
    const entry: IAutoMovieScheduleEntry | undefined =
      film.schedule.entries.find(
        (row: IAutoMovieScheduleEntry): boolean => row.intent.anchor === anchor,
      );
    if (entry === undefined) throw new Error(`${anchor} was not placed`);
    return entry;
  }

  /**
   * A foot's named point on the displayed foot.
   *
   * @param body The body.
   * @param reader The performer's signature reader.
   * @param side The foot.
   * @param name The point.
   * @param seconds Film seconds.
   * @returns World metres.
   */
  export function foot(
    body: IAutoMovieMotionHumanBody,
    reader: IAutoMovieMotionHumanSignature.IReader,
    side: AutoMovieHumanSide,
    name: FootPoint,
    seconds: number,
  ): IAutoMovieVector3 {
    const bone: IAutoMovieResolvedBone = HumanSignature.bones(
      reader,
      seconds,
    ).get(`${side}Foot`)!;
    return HumanFoot.point(body, side, name, {
      ankle: bone.worldPosition,
      rotation: bone.worldRotation,
    });
  }
}
