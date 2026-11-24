import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanExpression,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import {
  AutoMovieMotionClock,
  composeAutoMovieMotionHumanAction,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../internal/motionHumanBody";
import { throwsError } from "../../../internal/throwsError";

const { HumanAffect, HumanBreath } = AutoMovieMotionHumanExpression;

/**
 * Channel demand reads an active dependency inside its closed interval.
 *
 * Scenarios:
 *
 * 1. Read the head-independent trunk channel at both edges and just outside;
 *    request an unrelated channel and overlap the same writer.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Channel demand reads an active dependency inside its closed interval.
 * @evidence contracts/development/testing.md#independent-expectations Base pitch is zero. Inside the closed window trunk pitch is twice the root writer’s X position.
 * @evidence contracts/development/testing.md#distinguishing-cases Excluded demand never invokes either writer; competing writes on the same nonempty interval are ambiguous.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_channel_timing(): void {
  const base: IAutoMovieMotionHumanActionPlan = {
    duration: 1,
    events: [],
    contacts: [],
    posture: () => ({
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    }),
  };
  const clock = AutoMovieMotionClock(1, []);
  let rootReads: number = 0,
    trunkReads: number = 0;
  const root: IAutoMovieMotionHumanPrimitive = {
    channels: ["root"],
    reads: [],
    from: 0,
    to: 1,
    write: (p, t): IAutoMovieMotionHumanPosture => {
      rootReads++;
      return { ...p, root: { x: 1 + t, y: 0, z: 0 } };
    },
  };
  const trunk: IAutoMovieMotionHumanPrimitive = {
    channels: ["trunk"],
    reads: ["root"],
    from: 0.25,
    to: 0.75,
    write: (p): IAutoMovieMotionHumanPosture => {
      trunkReads++;
      return { ...p, pitch: 2 * p.root.x };
    },
  };
  const plan = composeAutoMovieMotionHumanAction({
    base,
    clock,
    primitives: [trunk, root],
  });
  for (const t of [0.25 - 2e-9, 0.25, 0.75, 0.75 + 2e-9]) {
    const active = t >= 0.25 && t <= 0.75;
    TestValidator.equals(
      "closed writer interval",
      plan.posture(t, ["trunk"]).pitch,
      active ? 2 * (1 + t) : 0,
    );
  }
  rootReads = 0;
  trunkReads = 0;
  plan.posture(0.5, []);
  TestValidator.equals(
    "no work without demand",
    [rootReads, trunkReads],
    [0, 0],
  );
  TestValidator.predicate(
    "overlapping trunk authors refused",
    throwsError(() =>
      composeAutoMovieMotionHumanAction({
        base,
        clock,
        primitives: [trunk, { ...trunk }],
      }),
    ),
  );
  const body = motionHumanBody("m-average");
  const perform = (
    layers: NonNullable<
      IAutoMovieMotionHumanPerformance.IInput["layers"]
    >[string],
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "layer",
      layers: { a: layers },
      performers: ["a", "b"].map((subject: string, index: number) => ({
        subject,
        body,
        at: { x: index * 1.5, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" as const },
      })),
      composition: HumanChain.subject("a")
        .stand({ hold: 6 })
        .with(
          HumanChain.subject("b")
            .stand({ hold: 1 })
            .gesture({ kind: "wave" }, "bye")
            .stand({ hold: 2 }),
        ).node,
    });

  const plain = perform([]),
    whole = perform([HumanBreath.layer({ rate: 20 })]);
  const timed = perform([
    { from: 2, to: 4, layer: HumanBreath.layer({ rate: 20 }) },
  ]);
  const apart = (
    left: IAutoMovieMotionHumanPerformance,
    right: IAutoMovieMotionHumanPerformance,
    t: number,
  ): number => {
    const a = left.bones("a", t),
      b = right.bones("a", t);
    return Math.max(
      ...Array.from(a, ([bone, value]) => {
        const p = value.worldPosition,
          q = b.get(bone)!.worldPosition;
        return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
      }),
    );
  };
  TestValidator.predicate(
    "outside windows have no motion and edge ramps stay within two millimetres",
    [1.99, 4.01].every((t) => apart(timed, plain, t) <= 1e-6) &&
      [2 + 1 / 60, 4 - 1 / 60].every((t) => apart(timed, plain, t) <= 0.002),
  );
  TestValidator.predicate(
    "window interior reaches the actual layer",
    apart(timed, plain, 3) > 0.002 && apart(timed, whole, 3) <= 1e-6,
  );
  const link = perform([
    {
      from: { of: "bye", event: "strokeEnd" },
      layer: (window) => HumanAffect.layer([{ kind: "sigh", at: window.from }]),
    },
  ]);
  const cue = link.instant({ of: "bye", event: "strokeEnd" });
  TestValidator.predicate(
    "another participant's event opens the layer",
    apart(link, plain, cue - 0.01) <= 1e-6 &&
      apart(link, plain, cue + 0.5) > 0.002,
  );
  const bad: IAutoMovieMotionHumanLayer.IScheduled[] = [
    { from: 3, to: 2, layer: HumanBreath.layer() },
    { from: { of: "absent", event: "end" }, layer: HumanBreath.layer() },
    { from: { of: "bye", event: "absent" }, layer: HumanBreath.layer() },
    {
      from: 1,
      to: 3,
      layer: {
        name: "planted",
        channels: ["leftLeg"],
        apply: (posture) => posture,
      },
    },
  ];
  const kinds = ["parameter", "participant", "parameter", "channel"];
  bad.forEach((layer, i) => {
    let rejected = false;
    try {
      perform([layer]);
    } catch (error) {
      rejected = error instanceof HumanRefusal && error.kind === kinds[i];
    }
    TestValidator.predicate(
      "invalid anchor, interval or claimed channel",
      rejected,
    );
  });
}
