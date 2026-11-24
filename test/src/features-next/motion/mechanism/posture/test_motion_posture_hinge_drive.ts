import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  createDoor,
  createStorage,
} from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";

/**
 * Two acts that drive one articulation at overlapping seconds are refused,
 * naming both (#3476): no rule says which hand wins.
 *
 * Scenarios:
 * two average men on either side of a chest of drawers:
 * 1. Both pull the same drawer at once: the performance is refused with a
 *    `cut` refusal on `drives` whose reason names both performers.
 * 2. The second pulls it only after the first has let go (synced to the
 *    first's end): the performance resolves, the drawer's state holding both
 *    pulls' travels at the end, 0.2 m: the second starts where the first
 *    left it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the overlapping and the sequential case through the public chain; a performance that lets two drives fight, or refuses a sequence, fails.
 * @evidence contracts/development/testing.md#independent-expectations The refusal's kind and axis are #3476's contract; the travels are the scene's asks.
 * @evidence contracts/development/testing.md#distinguishing-cases Overlapping against sequential drives of one articulation.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the two numbered scenarios.
 */
export function test_motion_posture_hinge_drive(): void {
  checkDoorStroke();
  checkKnobWriters();
  const chest: ReturnType<typeof createStorage> = createStorage({
    kind: "chest",
  });
  const placement: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  // The top drawer, whose handle a standing person reaches; a lower one is
  // crouched to, which `operate` does not do.
  const drawer = (chest.affordances ?? [])
    .filter((a) => a.kind === "slider")
    .sort((a, b) => b.frame.translation.y - a.frame.translation.y)[0];
  TestValidator.predicate("the chest has a drawer", drawer !== undefined);
  if (drawer === undefined) return;
  const handle = (chest.affordances ?? []).find((a) => a.rides === drawer.id);
  TestValidator.predicate("the drawer has a handle", handle !== undefined);
  if (handle === undefined) return;
  const placed: IAutoMovieTransform = chest.placed(
    handle.id as never,
    placement,
  );
  const at: IAutoMovieVector3 = placed.translation;
  // The handle's outward normal, its frame's +Y: the side a person pulls from.
  const out: IAutoMovieVector3 = Quaternion.rotateVector(placed.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const facing: number = (Math.atan2(-out.x, -out.z) * 180) / Math.PI;
  const across: IAutoMovieVector3 = { x: out.z, y: 0, z: -out.x };
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  // Each pulls with the hand on the handle's side: "a" stands to its left
  // (the handle at a's right), "b" to its right.
  const pull = (who: string) =>
    HumanChain.subject(who).operate(
      {
        hand: who === "a" ? "right" : "left",
        kind: {
          kind: "slider",
          at: { kind: "prop", subject: "chest", point: handle.id },
          travel: 0.1,
        },
      },
      `${who}-pull`,
    );
  const input = (composition: IAutoMovieComposition) => ({
    seed: "overlap",
    props: [
      HumanObject.prop("chest", chest, {
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        fixed: true,
      }),
    ],
    performers: [
      {
        subject: "a",
        body,
        at: {
          x: at.x + 0.45 * out.x - 0.15 * across.x,
          y: 0,
          z: at.z + 0.45 * out.z - 0.15 * across.z,
        },
        yaw: facing,
        proficiency: { level: "trained" as const },
      },
      {
        subject: "b",
        body,
        at: {
          x: at.x + 0.45 * out.x + 0.15 * across.x,
          y: 0,
          z: at.z + 0.45 * out.z + 0.15 * across.z,
        },
        yaw: facing,
        proficiency: { level: "trained" as const },
      },
    ],
    composition,
  });

  // 1. At once: refused naming both.
  let refusal: unknown;
  try {
    new HumanPerformance(
      input(AutoMovieComposition.parallel(pull("a").node, pull("b").node)),
    );
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    `two drives at once are refused on drives (${refusal instanceof Error ? refusal.message : "accepted"})`,
    refusal instanceof HumanRefusal &&
      refusal.kind === "cut" &&
      refusal.axis === "drives" &&
      refusal.message.includes("a") &&
      refusal.message.includes("b"),
  );

  // 2. One after the other: resolved.
  let resolved: IAutoMovieMotionHumanPerformance | undefined;
  try {
    resolved = new HumanPerformance(
      input(
        AutoMovieComposition.parallel(
          pull("a").node,
          pull("b").sync({ of: "a-pull", event: "end" }).node,
        ),
      ),
    );
  } catch (error) {
    resolved = undefined;
    refusal = error;
  }
  TestValidator.predicate(
    `drives one after the other resolve (${resolved === undefined && refusal instanceof Error ? refusal.message : "resolved"})`,
    resolved !== undefined,
  );
  if (resolved !== undefined)
    TestValidator.predicate(
      "the drawer holds both pulls' travels",
      Math.abs(
        (resolved.state("chest", resolved.duration)[drawer.id] ?? 0) - 0.2,
      ) <= 1e-9,
    );
}

/** The two knobs attached to the shared gear. */
type Knob = "drive" | "follower";
/** Two knob coordinates of the same degree, at a standing hand's height, with a two-to-one reversible ratio. */
function coupled(): AutoMovieArchetype<Knob, never> {
  const frame: ReturnType<typeof AutoMovieArchetypeFrame.upright> =
    AutoMovieArchetypeFrame.upright(Vector3.create(0, 1, 0));
  return new AutoMovieArchetypeBuilder<Knob, never>({
    material: "steel",
    name: "coupled-operation",
    draw: new AutoMovieArchetypeDrawSession<never>(
      "coupled-operation",
      {},
      undefined,
    ),
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

/** The signed ratio, persistent endpoint and overlapping writes of a two-knob fixture. */
function checkKnobWriters(): void {
  const body = motionHumanBody("m-average");
  const model: ReturnType<typeof coupled> = coupled();
  const turn = (
    who: string,
    point: Knob,
    amount: number,
  ): IAutoMovieMotionHumanChain =>
    HumanChain.subject(who).operate(
      {
        hand: who === "a" ? "right" : "left",
        kind: {
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
  const first = sequence.segments("a")[0]!;
  TestValidator.equals(
    "knob starts at rest",
    model.articulate(sequence.state("mechanism", 0)).travel("drive"),
    0,
  );
  TestValidator.predicate(
    "first operation leaves sixty follower degrees",
    nclose(
      model
        .articulate(sequence.state("mechanism", first.end))
        .travel("follower"),
      60,
      1e-9,
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

function checkDoorStroke(): void {
  const origin = { x: 0, y: 0, z: 0 };
  const transform: IAutoMovieTransform = {
    translation: origin,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const door = createDoor({ hinge: "right", hardware: "lever" });
  const handle = door.placed("pull", transform).translation;
  const pivot = door.placed("hinge", transform).translation;
  const body = motionHumanBody("m-average");
  const swing = 40;
  const performance = new HumanPerformance({
    seed: "door",
    props: [
      HumanObject.prop("door", door, { at: origin, yaw: 0, fixed: true }),
    ],
    performers: [
      {
        subject: "operator",
        body,
        at: {
          x:
            handle.x +
            Math.sign(handle.x - pivot.x) *
              (body.measure.shoulderHalfWidth + body.measure.upperArmRadius),
          y: 0,
          z: 0.45,
        },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("operator")
      .operate({
        kind: {
          kind: "hinge",
          at: { kind: "prop", subject: "door", point: "pull" },
          hinge: { kind: "prop", subject: "door", point: "hinge" },
          swing,
        },
      })
      .stand({ hold: 1 }).node,
  });
  const stroke = performance.segments("operator")[0]!;
  const drives = stroke.plan.drives!;
  TestValidator.equals(
    "driven part",
    drives.map((drive) => [drive.prop, drive.articulation]),
    [["door", "hinge"]],
  );
  const from = stroke.start + stroke.plan.duration * drives[0]!.from;
  const to = stroke.start + stroke.plan.duration * drives[0]!.to;
  TestValidator.equals(
    "closed before contact",
    performance.state("door", from / 2).hinge,
    undefined,
  );
  const mid = performance.state("door", (from + to) / 2).hinge!;
  TestValidator.predicate(
    "moving inside the drive window",
    0 < mid && mid < swing,
  );
  const opened = door
    .articulate({ hinge: swing })
    .placed("pull", transform).translation;
  for (const time of [to, performance.duration]) {
    TestValidator.predicate(
      "open position is held",
      nclose(performance.state("door", time).hinge!, swing, 1e-9),
    );
    const actual = performance.aim(
      { kind: "prop", subject: "door", point: "pull" },
      time,
      {
        root: origin,
        yaw: 0,
        heights: { low: 0.5, middle: 1, high: 1.5 },
        range: 1,
        body,
        bones: () => performance.bones("operator", time),
      },
    ).point;
    TestValidator.predicate(
      "contact follows the articulated handle",
      Vector3.length(Vector3.subtract(actual, opened)) <= 1e-3,
    );
  }
  const hand = performance
    .bones("operator", to)
    .get("rightHand")!.worldPosition;
  TestValidator.predicate(
    "grip finishes on the handle",
    Vector3.length(Vector3.subtract(hand, opened)) <= 0.7 * body.measure.hand,
  );
  const place = { point: { x: 1, y: 1, z: 0 }, normal: { x: 0, y: 0, z: 1 } };
  const at = { kind: "point", frame: "world", at: origin } as const;
  const lid = AutoMovieMotionHumanOperate.operate.state(
    { kind: "hinge", at, swing: 90 },
    place,
    { point: origin, axis: { x: 1, y: 0, z: 0 } },
    1,
  );
  TestValidator.predicate(
    "horizontal lid rotates through a quarter circle",
    nclose(lid.point.x, 1) && nclose(lid.point.y, 0) && nclose(lid.point.z, 1),
  );
  const upright = AutoMovieMotionHumanOperate.operate.state(
    { kind: "hinge", at, swing: 90 },
    place,
    { point: origin },
    1,
  );
  TestValidator.predicate(
    "a door defaults to the vertical pivot",
    nclose(upright.point.x, 0) &&
      nclose(upright.point.y, 1) &&
      nclose(upright.point.z, 1),
  );
  const travel = 0.01;
  for (const progress of [0, 0.5, 1]) {
    const button = AutoMovieMotionHumanOperate.operate.state(
      { kind: "button", at, travel },
      place,
      undefined,
      progress,
    );
    TestValidator.equals(
      "button displaces only along inward normal",
      button.point,
      { ...place.point, z: -travel * progress },
    );
  }
}
