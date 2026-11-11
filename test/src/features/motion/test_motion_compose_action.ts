import {
  AutoMovieMotionClock,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanActionPlan,
  type IHumanPosture,
  composeAutoMovieMotionHumanAction,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A composed action is its base with each primitive's channels written over
 * it inside the primitive's window, in the channel order.
 *
 * Scenarios:
 * 1. Over a base that walks its root along x, a trunk primitive from 0.2 to
 *    0.8 s pitches 30° and a head primitive copies the pitch it is given into
 *    the head joint. Inside the window the head reads 30 although it was
 *    listed first; outside it reads the base's 0. The arm joint no primitive
 *    claims and the root keep the base's values.
 * 2. A field a primitive writes outside its channels (the heading) is dropped.
 * 3. A second past the duration reads the last posture.
 * 4. The plan's duration and events are the clock's, its decisive instant is
 *    the named instant, and its contact windows and weapons are the base's
 *    followed by the primitives'.
 * 5. Two primitives on one channel may meet at an instant, and throw when
 *    their windows overlap.
 * 6. A base of another duration, a primitive without a channel, a reversed
 *    window and a window past the clock throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Composes plans through the public function and reads the returned posture, events, contacts and weapons; a wrong write order, a leaked field, an ungated window or an accepted overlap fails.
 * @evidence contracts/development/testing.md#independent-expectations The base and the primitives are written in the test with one distinct constant per field, so every expected value is that constant read off by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers inside and outside a window, dependent channels listed in reverse order, a foreign field, the time clamp, the carried plan members, touching and overlapping claims, and four refused inputs.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on synthetic plans; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 scenarios and what each pins.
 */
export function test_motion_compose_action(): void {
  const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(1, [
    { name: "strokeStart", seconds: 0.2 },
    { name: "contact", seconds: 0.5 },
    { name: "strokeEnd", seconds: 0.8 },
  ]);
  const base: IHumanActionPlan = {
    duration: 1,
    events: [],
    contacts: [
      {
        part: "leftFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
    ],
    posture: (seconds: number): IHumanPosture => ({
      root: { x: seconds, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: { leftUpperArm: [5, 0, 0] },
      limbs: {},
    }),
  };
  const head: IAutoMovieMotionHumanPrimitive = {
    channels: ["head"],
    from: 0,
    to: 1,
    write: (posture: IHumanPosture): IHumanPosture => ({
      ...posture,
      joints: { ...posture.joints, head: [posture.pitch, 0, 0] },
    }),
  };
  const trunk = (from: number, to: number): IAutoMovieMotionHumanPrimitive => ({
    channels: ["trunk"],
    from,
    to,
    contacts: [
      {
        part: "rightHand",
        kind: "grip",
        from: 0.2,
        to: 0.8,
        support: { kind: "prop", subject: "cup" },
      },
    ],
    weapons: [
      {
        id: "fist",
        limb: "rightArm",
        radius: 0.04,
        from: 0.2,
        to: 0.5,
        path: () => ({ x: 0, y: 1, z: 0 }),
      },
    ],
    write: (posture: IHumanPosture): IHumanPosture => ({
      ...posture,
      yaw: 99,
      pitch: 30,
    }),
  });
  const plan: IHumanActionPlan = composeAutoMovieMotionHumanAction({
    base,
    clock,
    primitives: [head, trunk(0.2, 0.8)],
    contact: "contact",
  });

  const inside: IHumanPosture = plan.posture(0.5);
  const outside: IHumanPosture = plan.posture(0.1);
  TestValidator.equals("inside the window the head reads the trunk", inside, {
    root: { x: 0.5, y: 0, z: 0 },
    yaw: 0,
    pitch: 30,
    roll: 0,
    joints: { leftUpperArm: [5, 0, 0], head: [30, 0, 0] },
    limbs: {},
  });
  TestValidator.equals("outside the window the trunk is the base's", outside, {
    root: { x: 0.1, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { leftUpperArm: [5, 0, 0], head: [0, 0, 0] },
    limbs: {},
  });
  TestValidator.equals(
    "a second past the end reads the last posture",
    plan.posture(5).root.x,
    1,
  );

  TestValidator.equals(
    "duration and decisive instant",
    [plan.duration, plan.contact],
    [1, 0.5],
  );
  TestValidator.equals(
    "events are the clock's",
    plan.events.map((e) => e.name),
    ["strokeStart", "contact", "strokeEnd"],
  );
  TestValidator.equals(
    "contacts are the base's then the primitives'",
    plan.contacts.map((c) => c.part),
    ["leftFoot", "rightHand"],
  );
  TestValidator.equals(
    "weapons are the primitives'",
    (plan.weapons ?? []).map((w) => w.id),
    ["fist"],
  );

  TestValidator.equals(
    "claims that meet at an instant are accepted",
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: [trunk(0, 0.5), trunk(0.5, 1)],
    }).posture(0.75).pitch,
    30,
  );
  TestValidator.error("overlapping claims", (): unknown =>
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: [trunk(0, 0.6), trunk(0.5, 1)],
    }),
  );
  TestValidator.error("a base of another duration", (): unknown =>
    composeAutoMovieMotionHumanAction({
      base: { ...base, duration: 2 },
      clock,
      primitives: [],
    }),
  );
  TestValidator.error("a primitive without a channel", (): unknown =>
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: [{ ...head, channels: [] }],
    }),
  );
  TestValidator.error("a reversed window", (): unknown =>
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: [trunk(0.8, 0.2)],
    }),
  );
  TestValidator.error("a window past the clock", (): unknown =>
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: [trunk(0.5, 1.5)],
    }),
  );
}
