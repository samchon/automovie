import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanHead,
  AutoMovieMotionHumanLeg,
  AutoMovieMotionHumanLegPhrase,
  AutoMovieMotionHumanRoot,
  AutoMovieMotionHumanTrunk,
  type HumanFoot,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The phrases: each part's movement over the standard instants of a phrase
 * clock, with and without something solid to bear on.
 *
 * The free clock has `ready` at 0.25 s, `strokeStart` at 0.375, `stroke` at
 * 0.625, `strokeEnd` at 0.875, `relax` at 1 and lasts 1.25 s. The arrested
 * clock has no follow phase: `strokeEnd` is at 0.625 with `stroke`. The body is a stub with
 * the wrist as the hand's surface, an ankle 0.08 m above the floor and the
 * ball of the foot 0.12 m ahead of it.
 *
 * Scenarios:
 * 1. A pass through an instant is 0 at `strokeStart`, 1 at `stroke` with speed,
 *    and 2 at rest at `strokeEnd` when attack and follow are equal; arrested,
 *    it reaches 1 with speed and stays 1.
 * 2. A wave of 2 cycles is 0 at both ends, 0.5 at the first quarter cycle
 *    while it grows and -1 at the third quarter; 0 cycles throws.
 * 3. A visit is on its origin at `start` and `end`, on its place from `stroke`
 *    to `relax` and at rest at `stroke`; it has no contact window in the air
 *    and one from 0.5 to 0.8 of the action on a solid place.
 * 4. A strike is on its chamber at `strokeStart`, passes its target at
 *    `stroke` with speed and travels on; arrested, it stays on the target.
 * 5. An oscillation hands its pose the wave; a swing writes the shoulder and
 *    the elbow and releases the arm's goal.
 * 6. A lifted foot stands planted at both ends and is raised and free between;
 *    a tapped foot bears on its place only when the place is solid; a swung
 *    foot passes its target at `stroke` with speed; a pivoted foot turned 90°
 *    keeps the ball of the foot where it was.
 * 7. A nod and a shake of 1 cycle at the quarter cycle, and a tilt at its
 *    fullest, share their angle half and half between the neck and the head;
 *    a trunk turn gives the chest 60 % and the spine 40 %.
 * 8. A shift and a facing turn arrive at their window's end and stay.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls each public phrase and reads the posture it writes, its channels and its contact windows; a strike that stops in the air, a visit still moving on its place, a contact window on a place in the air, a pivot that drags the ball, or a share other than the stated one fails.
 * @evidence contracts/development/testing.md#independent-expectations The points are the stated origins, places and chambers at instants where the profile is 0, 1 or 2 by its definition; the windows are the instants over the duration; the wave's values follow from a sine at its quarter cycles under a growth of half; the pivoted ankle is the ball's stated offset turned 90° by hand. Speed is a central difference of the written points.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a free against an arrested pass and strike, a place in the air against a solid one for the hand and the foot, both ends and the hold of each phrase, three head axes, the trunk's two joints, and a moved against a turned root.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on a stub body of the bones and sockets the goals read. `AutoMovieMotionHumanTrunk.crouch` and `counterbalance` are not covered: their balance solve needs a real body's masses, and they have no caller until the laws are rebuilt, where the motion captures judge them. The arm's bend, the solved limb and the look on screen are the captures' as well. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States both clocks and the stub, and lists the 8 scenarios with their numbers.
 */
export function test_motion_compose_phrase(): void {
  const close = (a: number, b: number, e: number = 1e-9): boolean =>
    Math.abs(a - b) <= e;
  const at = (g: IAutoMovieVector3, x: number, y: number, z: number): boolean =>
    close(g.x, x) && close(g.y, y) && close(g.z, z);
  const free = AutoMovieMotionClock.phrase({
    prepare: 0.25,
    wait: 0.125,
    attack: 0.25,
    follow: 0.25,
    hold: 0.125,
    retract: 0.25,
  });
  const arrested = AutoMovieMotionClock.phrase({
    prepare: 0.25,
    wait: 0.125,
    attack: 0.25,
    hold: 0.375,
    retract: 0.25,
  });
  const h: number = 1e-4;

  // 1. A pass through an instant.
  const window = ["strokeStart", "stroke", "strokeEnd"] as const;
  const pass = (clock: AutoMovieMotionClock.IClock, s: number): number =>
    AutoMovieMotionClock.through(clock, window, s);
  TestValidator.predicate(
    "a free pass crosses 1 with speed and rests at 2",
    close(pass(free, 0.375), 0) &&
      close(pass(free, 0.625), 1) &&
      (pass(free, 0.625 + h) - pass(free, 0.625 - h)) / (2 * h) > 1 &&
      close(pass(free, 0.875), 2) &&
      close(pass(free, 0.875 - h), 2, 1e-6) &&
      close(pass(free, 1.1), 2),
  );
  TestValidator.predicate(
    "an arrested pass reaches 1 with speed and stays",
    close(pass(arrested, 0.625), 1) &&
      (1 - pass(arrested, 0.625 - h)) / h > 1 &&
      close(pass(arrested, 0.75), 1),
  );

  // 2. A wave.
  const wave = (s: number): number =>
    AutoMovieMotionClock.wave(free, ["strokeStart", "strokeEnd"], 2, s);
  TestValidator.predicate(
    "a wave grows from 0, swings and ends at 0",
    close(wave(0.375), 0) &&
      close(wave(0.4375), 0.5) &&
      close(wave(0.5625), -1) &&
      close(wave(0.875), 0),
  );
  TestValidator.error("a wave of no cycles", (): unknown =>
    AutoMovieMotionClock.wave(free, ["strokeStart", "strokeEnd"], 0, 0.4),
  );

  const body: IHumanBody = {
    rest: new Map<string, IAutoMovieVector3>([
      ["leftLowerLeg", { x: 0.1, y: 0.5, z: 0 }],
      ["leftFoot", { x: 0.1, y: 0.08, z: 0 }],
      ["leftToes", { x: 0.1, y: 0.02, z: 0.12 }],
    ]),
    surfaces: {
      sockets: {
        palmRight: {
          bone: "rightHand",
          point: { x: 0, y: -0.02, z: 0.08 },
          normal: { x: 0, y: -1, z: 0 },
          forward: { x: 0, y: 0, z: 1 },
        },
        heelLeft: { bone: "leftFoot", point: { x: 0, y: -0.08, z: -0.05 } },
        ballLeft: { bone: "leftFoot", point: { x: 0, y: -0.08, z: 0.12 } },
        toeLeft: { bone: "leftFoot", point: { x: 0, y: -0.08, z: 0.2 } },
      },
    },
  } as unknown as IHumanBody;
  const posture: IHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {
      rightArm: { point: { x: 9, y: 9, z: 9 }, bend: { x: 0, y: 0, z: 0 } },
    },
  };
  const identity = { x: 0, y: 0, z: 0, w: 1 };
  const bend: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  const target =
    (point: IAutoMovieVector3): AutoMovieMotionHumanArm.Frame =>
    (): AutoMovieMotionHumanArm.ITarget => ({
      surface: "wrist",
      shape: "relaxed",
      point,
      rotation: identity,
      bend,
    });
  const origin: AutoMovieMotionHumanArm.IOrigin = {
    point: { x: -0.2, y: 0.9, z: 0 },
    rotation: identity,
  };
  const hand = (
    primitive: IAutoMovieMotionHumanPrimitive,
    s: number,
  ): IAutoMovieVector3 => primitive.write(posture, s).limbs.rightArm!.point;
  const speed = (
    point: (s: number) => IAutoMovieVector3,
    s: number,
  ): number => {
    const a: IAutoMovieVector3 = point(s - h);
    const b: IAutoMovieVector3 = point(s + h);
    return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / (2 * h);
  };

  // 3. A visit.
  const arm = { body, side: "right" as const, origin };
  const visit = AutoMovieMotionHumanArm.visit({
    ...arm,
    clock: free,
    target: target({ x: -0.2, y: 1.2, z: 0.5 }),
  });
  TestValidator.equals("a visit's channels", visit.channels, [
    "rightArm",
    "rightHand",
  ]);
  TestValidator.predicate(
    "a visit goes to its place, rests and returns",
    at(hand(visit, 0), -0.2, 0.9, 0) &&
      at(hand(visit, 0.625), -0.2, 1.2, 0.5) &&
      at(hand(visit, 0.9375), -0.2, 1.2, 0.5) &&
      at(hand(visit, 1.25), -0.2, 0.9, 0) &&
      speed((s) => hand(visit, s), 0.625) < 1e-3 &&
      speed((s) => hand(visit, s), 0.3) > 0.5,
  );
  TestValidator.equals(
    "a visit in the air bears on nothing",
    visit.contacts,
    [],
  );
  TestValidator.equals(
    "a visit on a solid place bears from stroke to relax",
    AutoMovieMotionHumanArm.visit({
      ...arm,
      clock: free,
      target: target({ x: -0.2, y: 1.2, z: 0.5 }),
      contact: { kind: "grip", support: { kind: "prop", subject: "cup" } },
    }).contacts,
    [
      {
        part: "rightHand",
        kind: "grip",
        from: 0.5,
        to: 0.8,
        support: { kind: "prop", subject: "cup" },
      },
    ],
  );

  // 4. A strike.
  const strike = (
    clock: AutoMovieMotionClock.IClock,
  ): IAutoMovieMotionHumanPrimitive =>
    AutoMovieMotionHumanArm.strike({
      ...arm,
      clock,
      chamber: target({ x: -0.2, y: 1.4, z: 0.1 }),
      target: target({ x: -0.2, y: 1.4, z: 0.5 }),
    });
  TestValidator.predicate(
    "a free strike passes its target with speed and travels on",
    at(hand(strike(free), 0.375), -0.2, 1.4, 0.1) &&
      at(hand(strike(free), 0.625), -0.2, 1.4, 0.5) &&
      speed((s) => hand(strike(free), s), 0.625) > 1 &&
      at(hand(strike(free), 0.875), -0.2, 1.4, 0.9) &&
      at(hand(strike(free), 1.25), -0.2, 0.9, 0),
  );
  TestValidator.predicate(
    "an arrested strike stays on its target",
    at(hand(strike(arrested), 0.625), -0.2, 1.4, 0.5) &&
      at(hand(strike(arrested), 0.875), -0.2, 1.4, 0.5) &&
      hand(strike(arrested), 0.625 - h).z < 0.5 - 1e-5,
  );

  // 5. An oscillation and a swing.
  const swings: number[] = [];
  AutoMovieMotionHumanArm.oscillate({
    ...arm,
    clock: free,
    cycles: 2,
    pose: (_p, _s, swing: number): AutoMovieMotionHumanArm.ITarget => {
      swings.push(swing);
      return target({ x: 0, y: 1, z: 0.3 })(posture, 0);
    },
  }).write(posture, 0.5625);
  TestValidator.predicate(
    "an oscillation hands its pose the wave",
    swings.length === 1 && close(swings[0]!, -1),
  );
  const swung: IHumanPosture = AutoMovieMotionHumanArm.swing(
    "right",
    0,
    1.25,
    () => ({ upper: [20, 5, 0], elbow: 30 }),
  ).write(posture, 0.5);
  TestValidator.equals(
    "a swing writes the shoulder and the elbow",
    swung.joints,
    {
      rightUpperArm: [20, 5, 0],
      rightLowerArm: [30, 0, 0],
    },
  );
  TestValidator.equals("a swing releases the arm's goal", swung.limbs, {});

  // 6. The leg.
  const stance: HumanFoot.IPlacement = {
    ankle: { x: 0.1, y: 0.08, z: 0 },
    rotation: identity,
  };
  const placed =
    (ankle: IAutoMovieVector3): AutoMovieMotionHumanLeg.Frame =>
    (): HumanFoot.IPlacement => ({ ankle, rotation: identity });
  const leg = { body, side: "left" as const, stance };
  const foot = (
    primitive: IAutoMovieMotionHumanPrimitive,
    s: number,
  ): IHumanPosture.IGoal => primitive.write(posture, s).limbs.leftLeg!;
  const lift = AutoMovieMotionHumanLegPhrase.lift({
    ...leg,
    clock: free,
    raised: placed({ x: 0.1, y: 0.4, z: 0.1 }),
  });
  TestValidator.predicate(
    "a lifted foot stands at both ends and is free between",
    lift.channels.length === 1 &&
      lift.channels[0] === "leftLeg" &&
      at(foot(lift, 0).point, 0.1, 0.08, 0) &&
      foot(lift, 0).planted === true &&
      at(foot(lift, 0.9375).point, 0.1, 0.4, 0.1) &&
      foot(lift, 0.9375).planted === undefined &&
      at(foot(lift, 1.25).point, 0.1, 0.08, 0) &&
      foot(lift, 1.25).planted === true,
  );
  const tap = (solid: boolean): IAutoMovieMotionHumanPrimitive =>
    AutoMovieMotionHumanLegPhrase.tap({
      ...leg,
      clock: free,
      target: placed({ x: 0.1, y: 0.08, z: 0.3 }),
      clearance: 0.05,
      ...(solid
        ? {
            contact: {
              kind: "plant" as const,
              support: { kind: "ground" as const },
            },
          }
        : {}),
    });
  TestValidator.predicate(
    "a tapped foot bears on its place only when the place is solid",
    at(foot(tap(false), 0.9375).point, 0.1, 0.08, 0.3) &&
      foot(tap(false), 0.9375).planted === undefined &&
      foot(tap(true), 0.9375).planted === true &&
      foot(tap(true), 0.3).planted === undefined &&
      foot(tap(true), 0.3).point.y > 0.08 &&
      (tap(false).contacts ?? []).length === 0,
  );
  TestValidator.equals("a tap's contact window", tap(true).contacts, [
    {
      part: "leftFoot",
      kind: "plant",
      from: 0.5,
      to: 0.8,
      support: { kind: "ground" },
    },
  ]);
  const kick = AutoMovieMotionHumanLegPhrase.swing({
    ...leg,
    clock: free,
    chamber: placed({ x: 0.1, y: 0.5, z: 0.1 }),
    target: placed({ x: 0.1, y: 0.9, z: 0.6 }),
  });
  TestValidator.predicate(
    "a swung foot passes its target with speed",
    at(foot(kick, 0.375).point, 0.1, 0.5, 0.1) &&
      at(foot(kick, 0.625).point, 0.1, 0.9, 0.6) &&
      speed((s) => foot(kick, s).point, 0.625) > 1 &&
      foot(kick, 0.625).planted === undefined &&
      at(foot(kick, 1.25).point, 0.1, 0.08, 0),
  );
  const pivot = AutoMovieMotionHumanLegPhrase.pivot({
    ...leg,
    clock: free,
    about: "ball",
    turn: 90,
    pitch: 0,
  });
  TestValidator.predicate(
    "a pivoted foot keeps the ball where it was",
    at(foot(pivot, 0).point, 0.1, 0.08, 0) &&
      at(foot(pivot, 0.9375).point, -0.02, 0.08, 0.12) &&
      foot(pivot, 0.9375).planted === true,
  );
  TestValidator.equals("a pivot's contact window", pivot.contacts, [
    {
      part: "leftFoot",
      kind: "pivot",
      from: 0,
      to: 1,
      support: { kind: "ground" },
    },
  ]);

  // 7. The head and the trunk.
  const bare: IHumanPosture = { ...posture, limbs: {} };
  const span = ["strokeStart", "strokeEnd"] as const;
  TestValidator.equals(
    "a nod at its quarter cycle",
    AutoMovieMotionHumanHead.nod(free, span, 1, 20).write(bare, 0.5).joints,
    { neck: [5, 0, 0], head: [5, 0, 0] },
  );
  TestValidator.equals(
    "a shake at its quarter cycle",
    AutoMovieMotionHumanHead.shake(free, span, 1, 40).write(bare, 0.5).joints,
    { neck: [0, 0, 10], head: [0, 0, 10] },
  );
  TestValidator.equals(
    "a tilt at its fullest",
    AutoMovieMotionHumanHead.tilt(
      free,
      ["start", "stroke"],
      ["relax", "end"],
      10,
    ).write(bare, 0.9375).joints,
    { neck: [0, 5, 0], head: [0, 5, 0] },
  );
  const turned = AutoMovieMotionHumanTrunk.turn(
    free,
    ["start", "stroke"],
    ["relax", "end"],
    30,
  );
  TestValidator.predicate(
    "a trunk turn is shared by the chest and the spine",
    turned.channels.length === 1 &&
      turned.channels[0] === "trunk" &&
      close(turned.write(bare, 0.9375).joints.chest![2], 18) &&
      close(turned.write(bare, 0.9375).joints.spine![2], 12) &&
      close(turned.write(bare, 1.25).joints.chest![2], 0),
  );

  // 8. The root.
  const shifted = AutoMovieMotionHumanRoot.shift(free, ["start", "stroke"], {
    x: 0.1,
    y: -0.05,
    z: 0,
  });
  const faced = AutoMovieMotionHumanRoot.face(free, ["start", "stroke"], 45);
  TestValidator.predicate(
    "a shift and a facing turn arrive and stay",
    shifted.to === 1.25 &&
      at(shifted.write(bare, 0).root, 0, 0, 0) &&
      at(shifted.write(bare, 0.625).root, 0.1, -0.05, 0) &&
      at(shifted.write(bare, 1.1).root, 0.1, -0.05, 0) &&
      close(faced.write(bare, 0.625).yaw, 45) &&
      close(faced.write(bare, 1.25).yaw, 45) &&
      close(faced.write(bare, 0).yaw, 0),
  );
}
