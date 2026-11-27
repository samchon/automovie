import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  HumanPreparedPlayback
} from "../../../../../packages/motions/src/perform/internal/HumanPreparedPlayback";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { syntheticHumanPlan } from "../../internal/synthetic/syntheticHumanPlan";

/**
 * `HumanPreparedPlayback` binds a native action's phases to its plan
 * (`IAutoMovieMotionHumanActionPlan.playback`): a display leaf reads the phase
 * that covers its second in place of the posture reader once placement has
 * located the plan, and a phase set with an event-dependent setup only after
 * the performance prepared it.
 *
 * Scenarios:
 *
 * 1. Attaching copies the phases and binds the plan's reader; a set with setup is
 *    not ready.
 * 2. Before placement locates it, a posture-mode playback is not read; the plan's
 *    own and placed readers are owned, another is not.
 * 3. Once located and prepared, the setup runs once and the phase covering the
 *    second is read; a second outside every phase reads nothing.
 * 4. Another body reads nothing.
 * 5. A reader observes the first declared owner at overlaps and exact shared
 *    seconds, including an instant-only phase, in shuffled seek order.
 *
 * The bodies are records of the stored average man's and smallest woman's rigs:
 * the binding reads only a body's identity.
 */
export async function test_motions_perform_prepared_playback(): Promise<void> {
  const body: HumanPreparedPlayback.IBody = {
    skeleton: (await humanFixture("m-average")).skeleton,
  };
  const other: HumanPreparedPlayback.IBody = {
    skeleton: (await humanFixture("f-small")).skeleton,
  };
  const plan: IAutoMovieMotionHumanActionPlan = syntheticHumanPlan({
    duration: 2,
  });
  const sampled: IAutoMovieMotionHumanPosture = plan.posture(0);
  let setups: number = 0;
  const source: IAutoMovieMotionHumanPlayback = {
    mode: "posture",
    phases: [
      {
        from: 0,
        to: 1,
        sample: (): IAutoMovieMotionHumanPlayback.ISample => ({
          posture: sampled,
        }),
      },
    ],
    prepare: (): void => {
      ++setups;
    },
  };

  // 1. Attached, not ready.
  const original: IAutoMovieMotionHumanActionPlan["posture"] = plan.posture;
  HumanPreparedPlayback.attach(plan, body, source);
  TestValidator.predicate(
    "the phases are copied and wait for their setup",
    plan.playback !== undefined &&
      plan.playback.source.phases[0] !== source.phases[0] &&
      plan.playback.original === original &&
      plan.playback.ready === false,
  );

  // 2. Not located yet.
  const installed: IAutoMovieMotionHumanActionPlan["posture"] = (
    ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
  ): IAutoMovieMotionHumanPosture => original(...args);
  TestValidator.predicate(
    "an unplaced playback is not read",
    HumanPreparedPlayback.read(plan, body, original, true, true, 0.5) ===
      undefined &&
      HumanPreparedPlayback.owns(plan, original) &&
      !HumanPreparedPlayback.owns(plan, installed),
  );

  // 3. Located and prepared.
  HumanPreparedPlayback.locate(plan, original, installed, {
    performer: "ann",
    act: "stand",
    instance: 1,
  });
  plan.posture = installed;
  HumanPreparedPlayback.prepare(plan);
  HumanPreparedPlayback.prepare(plan);
  TestValidator.predicate(
    "the covering phase is read after its setup ran once",
    setups === 1 &&
      HumanPreparedPlayback.owns(plan, installed) &&
      HumanPreparedPlayback.read(plan, body, installed, false, false, 0.5)
        ?.posture === sampled &&
      HumanPreparedPlayback.read(plan, body, installed, false, false, 1.5) ===
        undefined,
  );

  // 4. Another body.
  TestValidator.predicate(
    "another body reads nothing",
    HumanPreparedPlayback.read(plan, other, installed, false, false, 0.5) ===
      undefined,
  );

  const phases: IAutoMovieMotionHumanPlayback.IPhase[] = [
    [3, 5],
    [0, 3],
    [5, 6],
    [8, 8],
    [7, 9],
    [1, 4],
  ].map(
    (
      [from, to]: number[],
      index: number,
    ): IAutoMovieMotionHumanPlayback.IPhase => ({
      from: from!,
      to: to!,
      sample: (): IAutoMovieMotionHumanPlayback.ISample => ({
        posture: { ...sampled, yaw: index },
      }),
    }),
  );
  plan.posture = original;
  HumanPreparedPlayback.attach(plan, body, { mode: "posture", phases });
  HumanPreparedPlayback.locate(plan, original, installed, {
    performer: "ann",
    act: "stand",
    instance: 1,
  });
  plan.posture = installed;
  for (const [seconds, owner] of [
    [8.001, 4],
    [3, 0],
    [-1, undefined],
    [0, 1],
    [5, 0],
    [8, 3],
    [9, 4],
    [6.99, undefined],
    [2, 1],
    [5.001, 2],
    [10, undefined],
  ] as const)
    TestValidator.equals(
      `first declared interval at ${seconds}s`,
      HumanPreparedPlayback.read(plan, body, installed, false, false, seconds)
        ?.posture.yaw,
      owner,
    );
}
