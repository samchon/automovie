import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPopulation,
  IAutoMoviePose,
} from "@automovie/interface";
import { AutoMovieMotionHumanEnsemble } from "@automovie/motions";
import { HumanRefusal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

const { HumanPopulation } = AutoMovieMotionHumanEnsemble;

/** A take's placed action. */
type ISegment = AutoMovieMotionHumanEnsemble.HumanPopulation.ISegment;

/** A take's performance. */
type IPerformance = AutoMovieMotionHumanEnsemble.HumanPopulation.IPerformance;

/** Rounding of a quarter turn taken out, metres and quaternion units. */
const ROUNDING: number = 1e-12;

/**
 * `HumanPopulation.cycle` and `standing` turn a performed template's displayed
 * poses into a population take moved to the slot origin facing +Z.
 *
 * - `standing` holds the pose at the active stand's `settled` event at every
 *   phase, its root at the origin above the stand's floor with its heading
 *   taken out, for the stand's placed length and no stride; it refuses a
 *   fractional phase count, no active stand, a successor at the settled instant
 *   and a stand on anything but ground.
 * - `cycle` reads the poses over the stride from the first heel strike at or
 *   after `from` to the next strike of the same foot, each moved back by its
 *   share of the stride along the travel and turned to face +Z; it refuses a
 *   window that holds no whole stride.
 *
 * The template's body and entry come from a typed action context; its feet are
 * lifted, so the stand's floor is 0. Its displayed pose is a stub that walks +X
 * at 1 m/s facing +X, its root 0.9 m up.
 *
 * Scenarios:
 *
 * 1. A stand placed over 1 to 3 s and settled a quarter in holds the pose at 1.5 s
 *    over three phases: the root at (0, 0.9, 0) facing +Z, period 2, no
 *    stride.
 * 2. A settled event at a short final stand's end still holds; no phase, a second
 *    outside every action, a walk, a stand on a prop and a stand followed at
 *    its settled instant are refused.
 * 3. A walk with heel strikes at 0.2 (left), 0.7 (right) and 1.2 s (left) from 0.1
 *    s gives a 1 s, 1 m cycle whose four poses all stand at (0, 0.9, 0) facing
 *    +Z; from 0.8 s no stride is whole.
 */
export async function test_unit_motions_ensemble_human_population(): Promise<void> {
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
  const east = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const asked: number[] = [];
  const pose = (_subject: string, seconds: number): IAutoMoviePose => {
    asked.push(seconds);
    return {
      skeleton: body.skeleton.id,
      root: { translation: { x: seconds, y: 0.9, z: 0 }, rotation: east },
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
      if (error instanceof HumanRefusal) return error.axis;
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
