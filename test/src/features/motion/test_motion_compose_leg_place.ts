import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanLeg,
  AutoMovieMotionHumanLegPhrase,
  type HumanFoot,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A foot's placement turned into its leg's goal: the goal itself, the
 * primitive that follows a placement, a planted foot, a step, the contact
 * window and the blend of two placements.
 *
 * The body is a stub whose left knee rests at `(0.1, 0.5, 0)`, ankle at
 * `(0.1, 0.08, 0)` and toes' joint at `(0.1, 0.02, 0.12)`, so the toes' joint
 * lies `(0, -0.06, 0.12)` from the ankle. A knee's hint is one metre ahead of
 * its rest place along the foot's heading, the rest place carried by the
 * root. The clock has `ready` at 0.25 s, `strokeStart` at 0.375 and lasts
 * 1.25 s; a minimum-jerk progress is 0.5 at its window's middle, where a
 * step's arc is at its clearance above the straight line.
 *
 * Scenarios:
 * 1. A goal is the placement's ankle and rotation; its knee hint is
 *    `(0.1, 0.5, 1)` for a foot heading +Z, `(1.1, 0.5, 0)` for one turned 90
 *    degrees left, and moves with the root.
 * 2. A planted goal declares the toes' joint as its contact; a free one
 *    declares neither a plant nor a contact.
 * 3. `place` claims its leg over its span, asks its placement and its
 *    bearing with the second it writes, and keeps the other limbs.
 * 4. `plant` holds one placement planted over its window.
 * 5. `step` leaves its first placement free, is at the midpoint raised by the
 *    clearance and turned half way at the window's middle, still free just
 *    before the landing, and planted on the second placement at the landing.
 * 6. `bearing` gives no window without a contact and the foot's window over
 *    the instants' shares with one.
 * 7. `between` at 0.5 is the midpoint turned half way; past 1 the ankle goes
 *    on and the rotation stays the second's; before 0 the ankle goes back
 *    and the rotation stays the first's.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls each public function and reads the goal it writes; a free foot pinned, a planted foot without its contact, a step planted before it lands, a knee hint that ignores the foot's heading or an ankle clamped in `between` fails.
 * @evidence contracts/development/testing.md#independent-expectations Every point is a stated placement, a midpoint, the stub's own rest offsets or the knee's rest place plus one metre along a stated heading.
 * @evidence contracts/development/testing.md#distinguishing-cases Planted against free; two foot headings and two roots; a step's start, middle, last moment and landing; shares inside and on both sides outside [0, 1].
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on a stub body of the bones the goal reads; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the stub and the clock, and lists the 7 scenarios with their numbers.
 */
export function test_motion_compose_leg_place(): void {
  const close = (a: number, b: number, e: number = 1e-9): boolean =>
    Math.abs(a - b) <= e;
  const at = (g: IAutoMovieVector3, x: number, y: number, z: number): boolean =>
    close(g.x, x) && close(g.y, y) && close(g.z, z);
  const body: IHumanBody = {
    rest: new Map<string, IAutoMovieVector3>([
      ["leftLowerLeg", { x: 0.1, y: 0.5, z: 0 }],
      ["leftFoot", { x: 0.1, y: 0.08, z: 0 }],
      ["leftToes", { x: 0.1, y: 0.02, z: 0.12 }],
    ]),
    surfaces: { sockets: {} },
  } as unknown as IHumanBody;
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const quarter: IAutoMovieQuaternion = {
    x: 0,
    y: Math.SQRT1_2,
    z: 0,
    w: Math.SQRT1_2,
  };
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
  const stance: HumanFoot.IPlacement = {
    ankle: { x: 0.1, y: 0.08, z: 0 },
    rotation: identity,
  };
  const ahead: HumanFoot.IPlacement = {
    ankle: { x: 0.1, y: 0.08, z: 0.4 },
    rotation: quarter,
  };

  // 1. The goal and its knee hint.
  const free: IHumanPosture.IGoal = AutoMovieMotionHumanLeg.goal(
    body,
    posture,
    "left",
    stance,
    false,
  );
  TestValidator.predicate(
    "a goal is the ankle and the rotation with the knee ahead of its rest place",
    at(free.point, 0.1, 0.08, 0) &&
      close(free.rotation!.w, 1) &&
      at(free.bend!, 0.1, 0.5, 1),
  );
  TestValidator.predicate(
    "the knee hint follows the foot's heading and the root",
    at(
      AutoMovieMotionHumanLeg.goal(body, posture, "left", ahead, false).bend!,
      1.1,
      0.5,
      0,
    ) &&
      at(
        AutoMovieMotionHumanLeg.goal(
          body,
          { root: { x: 1, y: 0, z: 2 }, yaw: 0 },
          "left",
          stance,
          false,
        ).bend!,
        1.1,
        0.5,
        3,
      ),
  );

  // 2. Planted against free.
  const planted: IHumanPosture.IGoal = AutoMovieMotionHumanLeg.goal(
    body,
    posture,
    "left",
    stance,
    true,
  );
  TestValidator.predicate(
    "a planted goal declares the toes' joint as its contact",
    planted.planted === true &&
      planted.contact !== undefined &&
      at(planted.contact, 0, -0.06, 0.12),
  );
  TestValidator.predicate(
    "a free goal declares neither a plant nor a contact",
    !("planted" in free) && !("contact" in free),
  );

  // 3. The primitive.
  const asked: number[] = [];
  const placed: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLeg.place({
    body,
    side: "left",
    from: 0.5,
    to: 2,
    placement: (_: IHumanPosture, seconds: number): HumanFoot.IPlacement => {
      asked.push(seconds);
      return { ankle: { x: 0.1, y: 0.08, z: seconds }, rotation: identity };
    },
    planted: (seconds: number): boolean => seconds >= 1.5,
  });
  const early: IHumanPosture = placed.write(posture, 1);
  const late: IHumanPosture = placed.write(posture, 1.5);
  TestValidator.equals(
    "a placed leg claims its leg over its span",
    [placed.channels, placed.from, placed.to],
    [["leftLeg"], 0.5, 2],
  );
  TestValidator.predicate(
    "a placed leg asks its placement and its bearing with the second written",
    asked.length === 2 &&
      asked[0] === 1 &&
      asked[1] === 1.5 &&
      at(early.limbs.leftLeg!.point, 0.1, 0.08, 1) &&
      early.limbs.leftLeg!.planted !== true &&
      at(late.limbs.leftLeg!.point, 0.1, 0.08, 1.5) &&
      late.limbs.leftLeg!.planted === true &&
      early.limbs.rightArm?.point.x === 9,
  );

  // 4. A planted foot.
  const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.phrase({
    prepare: 0.25,
    wait: 0.125,
    attack: 0.25,
    follow: 0.25,
    hold: 0.125,
    retract: 0.25,
  });
  const window = ["ready", "strokeStart"] as const;
  const plant: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLeg.plant(
    body,
    clock,
    "left",
    window,
    ahead,
  );
  TestValidator.predicate(
    "a plant holds one placement planted over its window",
    close(plant.from, 0.25) &&
      close(plant.to, 0.375) &&
      [0.25, 0.3, 0.375].every((t: number): boolean => {
        const g: IHumanPosture.IGoal = plant.write(posture, t).limbs.leftLeg!;
        return at(g.point, 0.1, 0.08, 0.4) && g.planted === true;
      }),
  );

  // 5. A step.
  const step: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLeg.step(
    body,
    clock,
    "left",
    window,
    stance,
    ahead,
    0.05,
  );
  const leg = (t: number): IHumanPosture.IGoal =>
    step.write(posture, t).limbs.leftLeg!;
  TestValidator.predicate(
    "a step leaves free, peaks at its clearance half way and lands planted",
    close(step.from, 0.25) &&
      close(step.to, 0.375) &&
      at(leg(0.25).point, 0.1, 0.08, 0) &&
      leg(0.25).planted !== true &&
      at(leg(0.3125).point, 0.1, 0.13, 0.2) &&
      close(leg(0.3125).rotation!.y, Math.sin(Math.PI / 8)) &&
      leg(0.3125).planted !== true &&
      leg(0.3749).planted !== true &&
      leg(0.3749).point.y > 0.08 &&
      at(leg(0.375).point, 0.1, 0.08, 0.4) &&
      leg(0.375).planted === true,
  );

  // 6. The contact window.
  TestValidator.equals(
    "a foot in the air bears nothing",
    AutoMovieMotionHumanLegPhrase.bearing(
      { clock, side: "left" },
      "stroke",
      "relax",
    ),
    [],
  );
  TestValidator.equals(
    "a foot on a solid place bears over the two instants' shares",
    AutoMovieMotionHumanLegPhrase.bearing(
      {
        clock,
        side: "right",
        contact: { kind: "plant", support: { kind: "ground" } },
      },
      "stroke",
      "relax",
    ),
    [
      {
        part: "rightFoot",
        kind: "plant",
        from: 0.5,
        to: 0.8,
        support: { kind: "ground" },
      },
    ],
  );

  // 7. Between two placements.
  const mid: HumanFoot.IPlacement = AutoMovieMotionHumanLegPhrase.between(
    stance,
    ahead,
    0.5,
  );
  const past: HumanFoot.IPlacement = AutoMovieMotionHumanLegPhrase.between(
    stance,
    ahead,
    1.5,
  );
  const back: HumanFoot.IPlacement = AutoMovieMotionHumanLegPhrase.between(
    stance,
    ahead,
    -0.5,
  );
  TestValidator.predicate(
    "between is the midpoint turned half way",
    at(mid.ankle, 0.1, 0.08, 0.2) &&
      close(mid.rotation.y, Math.sin(Math.PI / 8)) &&
      close(mid.rotation.w, Math.cos(Math.PI / 8)),
  );
  TestValidator.predicate(
    "outside [0, 1] the ankle goes on and the rotation stays an end's",
    at(past.ankle, 0.1, 0.08, 0.6) &&
      close(past.rotation.y, Math.SQRT1_2) &&
      at(back.ankle, 0.1, 0.08, -0.2) &&
      close(back.rotation.w, 1) &&
      close(back.rotation.y, 0),
  );
}
