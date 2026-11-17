import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  createCannon,
} from "@automovie/archetypes";
import { AutoMovieComposition, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose, vclose } from "../internal/predicates";

/** Two knob coordinates of the same degree, at a standing hand's height, with a two-to-one reversible ratio. */
function coupled(): Archetype<"drive" | "follower", never> {
  const frame: ReturnType<typeof ArchetypeFrame.upright> =
    ArchetypeFrame.upright(Vector3.create(0, 1, 0));
  return new ArchetypeBuilder<"drive" | "follower", never>({
    material: "steel",
    name: "coupled-operation",
    draw: new ArchetypeDrawSession<never>("coupled-operation", {}, undefined),
  })
    .box("base", Vector3.create(0.05, 0.05, 0.05), Vector3.create(0, 0.025, 0))
    .affordance({
      id: "drive",
      kind: "knob",
      frame,
      extent: null,
      travel: 360,
      reverse: 360,
    })
    .affordance({
      id: "follower",
      kind: "knob",
      frame,
      extent: null,
      travel: 720,
      reverse: 720,
      follows: { id: "drive", ratio: 2, reversible: true },
    })
    .build(1);
}

/**
 * A persistent prop state changes coordinate within one coupled degree without
 * losing its current pose or letting simultaneous writers fight.
 *
 * Scenarios:
 * 1. An average man turns a real field gun's screw 90 degrees after an elevation
 *    track has raised it to 5 degrees and another track has moved its recoil
 *    0.1 m. At the stroke's start it keeps both poses; at its end it holds the
 *    additional screw turn, replacing the elevation input and preserving recoil.
 *    Reading the muzzle after, before and after again observes the right pose.
 * 2. Two operators turn a fixture's leader 30 degrees and then its two-to-one
 *    follower 60 degrees. The second starts at the follower's actual 60 degrees
 *    and finishes at 120, equivalent to 60 at the independent leader.
 * 3. The same two operations at overlapping seconds are refused as a cut on
 *    drives even though their authored articulation ids differ.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios, coordinate units, retained state and conflict rule.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves real operate plans through HumanPerformance with tracks, sequential actions and overlapping actions; reads published drives, persistent state and posed muzzle contacts, catching duplicate coordinates, a reset start, a lost independent degree and a stale pose.
 * @evidence contracts/development/testing.md#independent-expectations The gun's start travel follows the read base-ring geometry and screw pitch written below; 90 is the operation's ask. The fixture's two-to-one ratio makes the sequence's expected follower travel 2*30+60. The same-degree overlap is the established drives conflict contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Track-to-operation and leader-to-follower transitions, before and after the stroke, held end, another independent degree, nonchronological pose reads and simultaneous writers; contract_reversible separately owns direct authored-state duplicate refusals and ratio image bounds.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory test using the real average Human body and shipped operate law; starts no viewer or host.
 */
export function test_human_motion_coupled_operation(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const gun: ReturnType<typeof createCannon> = createCannon({
    kind: "fieldGun",
  });
  const screw: IAutoMovieVector3 = gun.affordance("screw").frame.translation;
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "coupled-gun-track",
    props: [
      HumanObject.prop(
        "gun",
        gun,
        { at: { x: 0, y: 0, z: 0 }, yaw: 0, fixed: true },
        undefined,
        undefined,
        [
          {
            articulation: "elevation",
            start: 0,
            duration: 1,
            travel: (seconds: number): number => 5 * Math.min(1, seconds),
          },
          {
            articulation: "recoil",
            start: 0,
            duration: 1,
            travel: (seconds: number): number => 0.1 * Math.min(1, seconds),
          },
        ],
      ),
    ],
    performers: [
      {
        subject: "gunner",
        body,
        at: { x: 0.45, y: 0, z: screw.z - 0.1 },
        yaw: 270,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("gunner")
      .stand({ seconds: 2 })
      .operate(
        {
          mechanism: {
            kind: "knob",
            at: { kind: "prop", subject: "gun", point: "screw" },
            turn: 90,
          },
        },
        "lay",
      )
      .stand({ seconds: 1 }).node,
  });
  const operation: ReturnType<
    IAutoMovieMotionHumanPerformance["segments"]
  >[number] = performance
    .segments("gunner")
    .find(
      (
        segment: ReturnType<
          IAutoMovieMotionHumanPerformance["segments"]
        >[number],
      ): boolean => segment.id === "lay",
    )!;
  const drive: NonNullable<typeof operation.plan.drives>[number] =
    operation.plan.drives![0]!;
  const from: number = operation.start + drive.from * operation.plan.duration;
  const to: number = operation.start + drive.to * operation.plan.duration;

  // The 6-pdr's trunnion-to-base-ring distance and base-ring radius, and the
  // provisional screw's one tenth inch pitch, independently in SI units.
  const inch: number = 0.0254;
  const angle: number = (5 * Math.PI) / 180;
  const base: number =
    ((60 - 34.91) * inch * Math.sin(angle) -
      ((10.3 * inch) / 2) * (1 - Math.cos(angle))) /
    (inch / 10 / 360);
  const before: Record<string, number> = performance.state("gun", 1.5);
  TestValidator.predicate(
    "the track keeps its authored coordinate before the operation",
    before.elevation === 5 &&
      before.screw === undefined &&
      nclose(before.recoil!, 0.1, 1e-12),
  );
  TestValidator.predicate(
    "the operation starts at the actual screw travel",
    nclose(drive.travel(from - operation.start), base, 1e-8),
  );
  for (const seconds of [to, to + 0.5, from, to]) {
    const state: Record<string, number> = performance.state("gun", seconds);
    const expected: number = seconds === from ? base : base + 90;
    TestValidator.predicate(
      `one input replaces the old coordinate at ${seconds}`,
      state.elevation === undefined &&
        nclose(state.screw!, expected, 1e-8) &&
        nclose(state.recoil!, 0.1, 1e-12),
    );
    const posed: ReturnType<typeof gun.articulate> = gun.articulate(state);
    const aimed: IAutoMovieVector3 = performance.aim(
      { kind: "prop", subject: "gun", point: "muzzle" },
      seconds,
      {
        root: { x: 0.45, y: 0, z: screw.z - 0.1 },
        yaw: 270,
        heights: { low: 0.5, middle: 1, high: 1.5 },
        range: 1,
        body,
        bones: () => performance.bones("gunner", seconds),
      },
    ).point;
    TestValidator.predicate(
      `the performance poses the muzzle at ${seconds}`,
      vclose(aimed, posed.affordance("muzzle").frame.translation, 1e-9),
    );
  }

  // The same persistent-state rule works in the other coordinate direction.
  const model: ReturnType<typeof coupled> = coupled();
  const turn = (
    who: string,
    point: "drive" | "follower",
    amount: number,
  ): IAutoMovieMotionHumanChain =>
    HumanChain.subject(who).operate(
      {
        hand: who === "a" ? "right" : "left",
        mechanism: {
          kind: "knob",
          at: { kind: "prop", subject: "mechanism", point },
          turn: amount,
        },
      },
      `${who}-turn`,
    );
  const input = (
    composition: IAutoMovieComposition,
  ): IAutoMovieMotionHumanPerformance.IInput => ({
    seed: "coupled-writers",
    props: [
      HumanObject.prop("mechanism", model, {
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        fixed: true,
      }),
    ],
    performers: [
      {
        subject: "a",
        body,
        at: { x: -0.15, y: 0, z: 0.45 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body,
        at: { x: 0.15, y: 0, z: 0.45 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition,
  });
  const sequence: IAutoMovieMotionHumanPerformance = new HumanPerformance(
    input(
      AutoMovieComposition.parallel(
        turn("a", "drive", 30).node,
        turn("b", "follower", 60).sync({ of: "a-turn", event: "end" }).node,
      ),
    ),
  );
  const final: Record<string, number> = sequence.state(
    "mechanism",
    sequence.duration,
  );
  TestValidator.predicate(
    "a follower operation starts where its leader left it",
    final.drive === undefined &&
      nclose(final.follower!, 120, 1e-9) &&
      nclose(model.articulate(final).travel("drive"), 60, 1e-9),
  );

  let refusal: unknown;
  try {
    new HumanPerformance(
      input(
        AutoMovieComposition.parallel(
          turn("a", "drive", 30).node,
          turn("b", "follower", 60).node,
        ),
      ),
    );
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "simultaneous coordinates of one degree still conflict",
    refusal instanceof HumanRefusal &&
      refusal.kind === "cut" &&
      refusal.axis === "drives" &&
      refusal.message.includes("a") &&
      refusal.message.includes("b"),
  );
}
