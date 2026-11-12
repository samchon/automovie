import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanArm,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanContactWindow,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The arm's transport between a body-carried origin and a target: the blend
 * `move` writes, its bowed path, the three clocked weights over it, the
 * contact window and the stroke's phases.
 *
 * The body is a stub whose hand surface is the wrist, so the written goal's
 * point is the blended point itself. The clock has `ready` at 0.25 s,
 * `strokeStart` at 0.375, `stroke` at 0.625, `strokeEnd` at 0.875, `relax` at
 * 1 and lasts 1.25 s. A minimum-jerk progress is 0.5 half way through its
 * window by its symmetry, so every expected point is an end or a midpoint.
 *
 * A bowed path adds to the straight path's point `curvature * length *
 * sin(pi s)` along the arm's own side less its part along the path. At the
 * middle (`s = 0.5`) of a path 0.4 m long straight ahead, a curvature of 0.25
 * moves the right hand 0.1 m to the right and the left hand 0.1 m to the
 * left. On the path from `(0, 1, 0)` to `(-0.3, 1, 0.4)`, 0.5 m long along
 * `(-0.6, 0, 0.8)`, the right side `(-1, 0, 0)` less its part along the path
 * is `(-0.64, 0, -0.48)`, of unit `(-0.8, 0, -0.6)`, so a curvature of 0.2
 * moves the middle by `(-0.08, 0, -0.06)`. A path that runs sideways has no
 * own side across it and bows up. A performer turned 90 degrees to the left
 * heads along +X with the right side along +Z.
 *
 * Scenarios:
 * 1. An origin's world point follows the root and the heading.
 * 2. `move` at weight 0 is on its origin, at weight 1 on its target, half way
 *    at the midpoint with the hand turned half way; a weight outside [0, 1]
 *    is the nearer end; it claims the arm and the hand and keeps other limbs.
 * 3. The bowed middle for each of the five paths above; a curvature of 0 is
 *    the straight middle; both ends are unmoved by any curvature.
 * 4. `reach` starts on its origin at its window's start, is half way at the
 *    window's middle and on its target at the end; `retract` is its mirror;
 *    `hold` is on its target throughout, wherever the target moves.
 * 5. `bearing` gives no window without a contact and one over the two
 *    instants' shares of the duration with one.
 * 6. A stroke is on its origin at both ends, on its ready point from `ready`
 *    to `strokeStart`, half way along its path at `stroke`, on the path's end
 *    from `strokeEnd` to `relax`; the path is read at progress 0 before the
 *    stroke and 1 after it.
 * 7. An extent of 2 doubles a stroke in the air about its ready point and
 *    leaves the ready point; with a contact the extent is ignored and the
 *    window runs from `strokeStart` to `relax`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls each public function and reads the goal it writes, its channels and its contact windows; a blend in the wrong frame, a bow to the wrong side or along the path, an unclamped weight, a stroke read at the wrong progress or an extent applied on a solid place fails.
 * @evidence contracts/development/testing.md#independent-expectations Every point is a stated end or a midpoint, and each bowed middle is worked out by hand in the comment from the stated definition.
 * @evidence contracts/development/testing.md#distinguishing-cases Both arms, three path directions and a turned performer for the bow; inside, at and outside the weight's range; with and without a contact; an extent in the air against one on a solid place.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on a stub body of the socket the goals read; it runs in CI. The solved limb is the real-body tests'.
 * @evidence contracts/development/common.md#meaningful-documentation States the stub, the clock and the bow's arithmetic, and lists the 7 scenarios.
 */
export function test_motion_compose_arm_transport(): void {
  const close = (a: number, b: number, e: number = 1e-9): boolean =>
    Math.abs(a - b) <= e;
  const at = (
    g: IAutoMovieVector3,
    x: number,
    y: number,
    z: number,
    e: number = 1e-9,
  ): boolean => close(g.x, x, e) && close(g.y, y, e) && close(g.z, z, e);
  const body: IHumanBody = {
    rest: new Map<string, IAutoMovieVector3>(),
    surfaces: {
      sockets: {
        palmLeft: {
          bone: "leftHand",
          point: { x: 0, y: -0.02, z: 0.08 },
          normal: { x: 0, y: -1, z: 0 },
          forward: { x: 0, y: 0, z: 1 },
        },
        palmRight: {
          bone: "rightHand",
          point: { x: 0, y: -0.02, z: 0.08 },
          normal: { x: 0, y: -1, z: 0 },
          forward: { x: 0, y: 0, z: 1 },
        },
      },
    },
  } as unknown as IHumanBody;
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const quarter: IAutoMovieQuaternion = {
    x: 0,
    y: Math.SQRT1_2,
    z: 0,
    w: Math.SQRT1_2,
  };
  const bend: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  const standing = (
    yaw: number = 0,
    root: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
  ): IHumanPosture => ({
    root,
    yaw,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {
      leftLeg: { point: { x: 7, y: 7, z: 7 }, bend: { x: 0, y: 0, z: 0 } },
    },
  });
  const target =
    (
      point: IAutoMovieVector3,
      rotation: IAutoMovieQuaternion = identity,
    ): AutoMovieMotionHumanArm.Frame =>
    (): AutoMovieMotionHumanArm.ITarget => ({
      surface: "wrist",
      shape: "relaxed",
      point,
      rotation,
      bend,
    });
  const goal = (
    primitive: IAutoMovieMotionHumanPrimitive,
    seconds: number,
    posture: IHumanPosture = standing(),
    side: "left" | "right" = "right",
  ): IHumanPosture.IGoal =>
    primitive.write(posture, seconds).limbs[`${side}Arm`]!;

  // 1. An origin's world point.
  const carried: AutoMovieMotionHumanArm.IOrigin = {
    point: { x: -0.2, y: 1, z: 0.3 },
    rotation: identity,
  };
  TestValidator.predicate(
    "an origin follows the root and the heading",
    at(AutoMovieMotionHumanArm.point(standing(), carried), -0.2, 1, 0.3) &&
      at(
        AutoMovieMotionHumanArm.point(
          standing(0, { x: 1, y: 0.1, z: 2 }),
          carried,
        ),
        0.8,
        1.1,
        2.3,
      ) &&
      at(AutoMovieMotionHumanArm.point(standing(90), carried), 0.3, 1, 0.2),
  );

  // 2. The blend.
  const blend = (
    weight: number,
    curvature?: number,
    side: "left" | "right" = "right",
    origin: IAutoMovieVector3 = { x: -0.2, y: 1, z: 0 },
    to: IAutoMovieVector3 = { x: -0.2, y: 1, z: 0.4 },
    posture: IHumanPosture = standing(),
  ): IHumanPosture.IGoal =>
    goal(
      AutoMovieMotionHumanArm.move({
        body,
        side,
        from: 0.5,
        to: 2,
        origin: { point: origin, rotation: identity },
        target: target(to, quarter),
        weight: (): number => weight,
        ...(curvature === undefined ? {} : { curvature }),
      }),
      1,
      posture,
      side,
    );
  const half: IHumanPosture.IGoal = blend(0.5);
  TestValidator.predicate(
    "a move is on its origin at 0, on its target at 1 and half way between",
    at(blend(0).point, -0.2, 1, 0) &&
      close(blend(0).rotation!.w, 1) &&
      at(blend(1).point, -0.2, 1, 0.4) &&
      close(blend(1).rotation!.y, Math.SQRT1_2) &&
      at(half.point, -0.2, 1, 0.2) &&
      close(half.rotation!.y, Math.sin(Math.PI / 8)) &&
      close(half.rotation!.w, Math.cos(Math.PI / 8)) &&
      at(half.bend!, 0, 0, -1),
  );
  TestValidator.predicate(
    "a weight outside [0, 1] is the nearer end",
    at(blend(-0.3).point, -0.2, 1, 0) && at(blend(1.7).point, -0.2, 1, 0.4),
  );
  const moved: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.move({
    body,
    side: "right",
    from: 0.5,
    to: 2,
    origin: carried,
    target: target({ x: 0, y: 1, z: 0.5 }),
    weight: (): number => 0.5,
  });
  TestValidator.equals(
    "a move claims the arm and the hand",
    [moved.channels, moved.from, moved.to],
    [["rightArm", "rightHand"], 0.5, 2],
  );
  TestValidator.predicate(
    "a move keeps the other limbs and shapes the fingers",
    moved.write(standing(), 1).limbs.leftLeg?.point.x === 7 &&
      moved.write(standing(), 1).joints.rightIndexProximal !== undefined &&
      moved.write(standing(), 1).joints.leftIndexProximal === undefined,
  );

  // 3. The bow.
  TestValidator.predicate(
    "the right hand bows right and the left hand left of a path ahead",
    at(blend(0.5, 0.25).point, -0.3, 1, 0.2) &&
      at(
        blend(
          0.5,
          0.25,
          "left",
          { x: 0.2, y: 1, z: 0 },
          { x: 0.2, y: 1, z: 0.4 },
        ).point,
        0.3,
        1,
        0.2,
      ),
  );
  TestValidator.predicate(
    "an oblique path bows across itself",
    at(
      blend(0.5, 0.2, "right", { x: 0, y: 1, z: 0 }, { x: -0.3, y: 1, z: 0.4 })
        .point,
      -0.23,
      1,
      0.14,
    ),
  );
  TestValidator.predicate(
    "a sideways path bows up",
    at(
      blend(0.5, 0.25, "right", { x: 0, y: 1, z: 0 }, { x: -0.4, y: 1, z: 0 })
        .point,
      -0.2,
      1.1,
      0,
    ),
  );
  TestValidator.predicate(
    "a turned performer's own side turns with the heading",
    at(
      blend(
        0.5,
        0.25,
        "right",
        { x: -0.2, y: 1, z: 0 },
        { x: 0.4, y: 1, z: 0.2 },
        standing(90),
      ).point,
      0.2,
      1,
      0.3,
    ),
  );
  TestValidator.predicate(
    "no curvature is the straight middle and both ends are unmoved",
    at(blend(0.5, 0).point, -0.2, 1, 0.2) &&
      at(blend(0, 0.25).point, -0.2, 1, 0) &&
      at(blend(1, 0.25).point, -0.2, 1, 0.4),
  );

  // 4. The clocked weights.
  const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.phrase({
    prepare: 0.25,
    wait: 0.125,
    attack: 0.25,
    follow: 0.25,
    hold: 0.125,
    retract: 0.25,
  });
  const window = ["ready", "strokeStart"] as const;
  const far: AutoMovieMotionHumanArm.Frame = target({ x: -0.2, y: 1, z: 0.4 });
  const start: AutoMovieMotionHumanArm.IOrigin = {
    point: { x: -0.2, y: 1, z: 0 },
    rotation: identity,
  };
  const reach: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.reach(
    body,
    clock,
    "right",
    window,
    start,
    far,
  );
  TestValidator.predicate(
    "a reach leaves its origin, is half way at its window's middle and arrives",
    close(reach.from, 0.25) &&
      close(reach.to, 0.375) &&
      at(goal(reach, 0.25).point, -0.2, 1, 0) &&
      at(goal(reach, 0.3125).point, -0.2, 1, 0.2) &&
      at(goal(reach, 0.375).point, -0.2, 1, 0.4),
  );
  const retract: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanArm.retract(body, clock, "right", window, far, start);
  TestValidator.predicate(
    "a retraction leaves its target and arrives on its origin",
    close(retract.from, 0.25) &&
      close(retract.to, 0.375) &&
      at(goal(retract, 0.25).point, -0.2, 1, 0.4) &&
      at(goal(retract, 0.3125).point, -0.2, 1, 0.2) &&
      at(goal(retract, 0.375).point, -0.2, 1, 0),
  );
  const hold: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.hold(
    body,
    clock,
    "right",
    window,
    (_: IHumanPosture, seconds: number): AutoMovieMotionHumanArm.ITarget => ({
      surface: "wrist",
      shape: "relaxed",
      point: { x: seconds, y: 1, z: 0.4 },
      rotation: identity,
      bend,
    }),
  );
  TestValidator.predicate(
    "a hold is on its target wherever the target is",
    close(hold.from, 0.25) &&
      close(hold.to, 0.375) &&
      at(goal(hold, 0.25).point, 0.25, 1, 0.4) &&
      at(goal(hold, 0.3).point, 0.3, 1, 0.4) &&
      at(goal(hold, 0.375).point, 0.375, 1, 0.4),
  );

  // 5. The contact window.
  const contact: Pick<IHumanContactWindow, "kind" | "support"> = {
    kind: "grip",
    support: { kind: "prop", subject: "rail" },
  };
  TestValidator.equals(
    "a place in the air bears nothing",
    AutoMovieMotionHumanArm.bearing(
      { clock, side: "right" },
      "stroke",
      "relax",
    ),
    [],
  );
  TestValidator.equals(
    "a solid place bears over the two instants' shares",
    AutoMovieMotionHumanArm.bearing(
      { clock, side: "left", contact },
      "stroke",
      "relax",
    ),
    [
      {
        part: "leftHand",
        kind: "grip",
        from: 0.5,
        to: 0.8,
        support: { kind: "prop", subject: "rail" },
      },
    ],
  );

  // 6. The stroke's phases.
  const read: number[] = [];
  const stroke = (
    more: Partial<AutoMovieMotionHumanArm.IPhrase> = {},
  ): IAutoMovieMotionHumanPrimitive =>
    AutoMovieMotionHumanArm.stroke({
      body,
      clock,
      side: "right",
      origin: start,
      ...more,
      path: (
        _: IHumanPosture,
        __: number,
        progress: number,
      ): AutoMovieMotionHumanArm.ITarget => {
        read.push(progress);
        return {
          surface: "wrist",
          shape: "relaxed",
          point: { x: -0.2 - 0.2 * progress, y: 1.2, z: 0.3 },
          rotation: identity,
          bend,
        };
      },
    });
  const drawn: IAutoMovieMotionHumanPrimitive = stroke();
  TestValidator.predicate(
    "a stroke leaves its origin, waits on its ready point, follows its path and returns",
    drawn.from === 0 &&
      close(drawn.to, 1.25) &&
      at(goal(drawn, 0).point, -0.2, 1, 0) &&
      at(goal(drawn, 0.25).point, -0.2, 1.2, 0.3) &&
      at(goal(drawn, 0.375).point, -0.2, 1.2, 0.3) &&
      at(goal(drawn, 0.625).point, -0.3, 1.2, 0.3) &&
      at(goal(drawn, 0.875).point, -0.4, 1.2, 0.3) &&
      at(goal(drawn, 1).point, -0.4, 1.2, 0.3) &&
      at(goal(drawn, 1.25).point, -0.2, 1, 0),
  );
  read.length = 0;
  goal(drawn, 0.3);
  const before: number[] = [...read];
  read.length = 0;
  goal(drawn, 0.95);
  TestValidator.predicate(
    "the path is read at 0 before the stroke and at 1 after it",
    before.every((p: number): boolean => p === 0) &&
      read.some((p: number): boolean => close(p, 1)) &&
      read.every((p: number): boolean => p === 0 || close(p, 1)),
  );
  TestValidator.equals("a stroke in the air has no window", drawn.contacts, []);

  // 7. The extent.
  const wide: IAutoMovieMotionHumanPrimitive = stroke({
    manner: { extent: 2, curvature: 0 },
  });
  TestValidator.predicate(
    "an extent doubles a stroke in the air about its ready point",
    at(goal(wide, 0.3).point, -0.2, 1.2, 0.3) &&
      at(goal(wide, 0.625).point, -0.4, 1.2, 0.3) &&
      at(goal(wide, 0.9).point, -0.6, 1.2, 0.3),
  );
  const solid: IAutoMovieMotionHumanPrimitive = stroke({
    manner: { extent: 2, curvature: 0 },
    contact,
  });
  TestValidator.predicate(
    "a stroke on a solid place keeps its path whatever the extent",
    at(goal(solid, 0.9).point, -0.4, 1.2, 0.3),
  );
  TestValidator.equals(
    "a stroke on a solid place bears from its start to its release",
    solid.contacts,
    [
      {
        part: "rightHand",
        kind: "grip",
        from: 0.3,
        to: 0.8,
        support: { kind: "prop", subject: "rail" },
      },
    ],
  );
}
