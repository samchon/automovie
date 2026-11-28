import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPopulation,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanEnsemble,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions";

import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

const { HumanPopulation } = AutoMovieMotionHumanEnsemble;

/** A take's placed action. */
type ISegment = AutoMovieMotionHumanEnsemble.HumanPopulation.ISegment;

/** A take's performance. */
type IPerformance = AutoMovieMotionHumanEnsemble.HumanPopulation.IPerformance;

/** Rounding of a quarter turn taken out, metres and quaternion units. */
const ROUNDING: number = 1e-12;

/**
 * Check normalized standing and cycling templates sampled from a performed
 * track.
 *
 * Scenarios:
 *
 * 1. Hold the placed stand's settled pose at every phase. Normalize its
 *    heading and horizontal position, keep its 0.9 m root height, and report
 *    a two-second period with no stride.
 * 2. Admit settled at the terminal stand endpoint. Refuse invalid phase
 *    count, a missing active stand, walking, prop support and a successor
 *    occupying the settled instant.
 * 3. Use left heel strikes at 0.2 and 1.2 s for a one-second, one-metre
 *    cycle. Remove progression from each sampled pose and refuse a window
 *    without a whole stride.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify which settled endpoint and repeated foot strike qualify and how normalized poses read.
 * @evidence contracts/development/testing.md#behavioral-verification The public templates consume a typed schedule with deterministic displayed poses and explicit phase and support controls.
 * @evidence contracts/development/testing.md#independent-expectations The event times and the prescribed one-metre-per-second +X route give the stride, period and normalized root analytically.
 */
export async function test_motions_ensemble_human_population(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context: IAutoMovieMotionHumanActionContext<object> =
    motionActionContext(body, {});
  const entry: IAutoMovieMotionHumanEntryState = {
    ...context.entry,
    feet: {
      left: { ...context.entry.feet.left, planted: false },
      right: { ...context.entry.feet.right, planted: false },
    },
  };
  const east = AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const asked: number[] = [];
  const pose = (_subject: string, seconds: number): IAutoMoviePose => {
    asked.push(seconds);
    return {
      skeleton: body.skeleton.id,
      root: {
        translation: { x: seconds, y: 0.9, z: 0 },
        rotation: east,
        scale: { x: 1, y: 1, z: 1 },
      },
      joints: [],
    };
  };
  const segment = (
    props: Partial<ISegment> & Pick<ISegment, "start" | "end">,
    events: ISegment["plan"]["events"],
    duration: number,
    support: "ground" | "prop" = "ground",
  ): ISegment => ({
    index: 0,
    name: "stand",
    entryTime: props.start,
    ...props,
    plan: {
      events,
      duration,
      contacts: [
        {
          part: "leftFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support:
            support === "ground"
              ? { kind: "ground" }
              : { kind: "prop", subject: "box" },
        },
      ],
    },
    context: { body, entry },
  });
  const performance = (segments: readonly ISegment[]): IPerformance => ({
    segments: () => segments,
    pose,
  });
  const settled = [{ name: "settled", share: 0.25 }];
  const stand: IPerformance = performance([
    segment({ start: 1, end: 3 }, settled, 2),
  ]);
  const held: IAutoMovieMotionHumanPopulation.ICycle = HumanPopulation.standing(
    stand,
    "t",
    1.2,
    3,
  );
  TestValidator.predicate(
    "a held stand",
    asked.at(-1) === 1.5 &&
      held.gait === "stand" &&
      held.periodSeconds === 2 &&
      held.strideMeters === 0 &&
      held.poses.length === 3 &&
      held.poses.every(
        (p: IAutoMoviePose): boolean =>
          vclose(p.root!.translation, { x: 0, y: 0.9, z: 0 }, ROUNDING) &&
          qclose(p.root!.rotation, { x: 0, y: 0, z: 0, w: 1 }, ROUNDING),
      ),
  );
  TestValidator.equals(
    "settled at a short final stand's end",
    HumanPopulation.standing(
      performance([
        segment({ start: 0, end: 0.25 }, [{ name: "settled", share: 1 }], 0.25),
      ]),
      "t",
      0,
      1,
    ).periodSeconds,
    0.25,
  );
  const refused = (
    of: IPerformance,
    from: number,
    samples: number,
    take: "standing" | "cycle" = "standing",
  ): string | undefined => {
    try {
      HumanPopulation[take](of, "t", from, samples);
    } catch (error: unknown) {
      if (error instanceof AutoMovieMotionHumanRefusal) return error.axis;
    }
    return undefined;
  };
  TestValidator.equals(
    "standing refusals",
    [
      refused(stand, 1.2, 0),
      refused(stand, 3.5, 3),
      refused(
        performance([segment({ start: 1, end: 3, name: "walk" }, settled, 2)]),
        1.2,
        3,
      ),
      refused(
        performance([segment({ start: 1, end: 3 }, settled, 2, "prop")]),
        1.2,
        3,
      ),
      refused(
        performance([
          segment({ start: 1, end: 3 }, settled, 2),
          segment({ start: 1.5, end: 3, index: 1 }, settled, 1.5),
        ]),
        1.2,
        3,
      ),
    ],
    ["samples", "standing", "standing", "standing", "standing"],
  );
  const walk: IPerformance = performance([
    segment(
      { start: 0, end: 2, name: "walk" },
      [
        { name: "leftHeelStrike1", share: 0.1 },
        { name: "rightHeelStrike1", share: 0.35 },
        { name: "leftHeelStrike2", share: 0.6 },
      ],
      2,
    ),
  ]);
  const cycle: IAutoMovieMotionHumanPopulation.ICycle = HumanPopulation.cycle(
    walk,
    "t",
    0.1,
    4,
  );
  TestValidator.predicate(
    "a walk cycle",
    cycle.gait === "walk" &&
      Math.abs(cycle.periodSeconds - 1) < ROUNDING &&
      Math.abs(cycle.strideMeters! - 1) < ROUNDING &&
      cycle.poses.length === 4 &&
      cycle.poses.every(
        (p: IAutoMoviePose): boolean =>
          vclose(p.root!.translation, { x: 0, y: 0.9, z: 0 }, ROUNDING) &&
          qclose(p.root!.rotation, { x: 0, y: 0, z: 0, w: 1 }, ROUNDING),
      ),
  );
  TestValidator.equals(
    "no whole stride",
    refused(walk, 0.8, 4, "cycle"),
    "cycle",
  );
}
