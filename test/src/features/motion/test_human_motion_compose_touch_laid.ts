import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanTouch,
  AutoMovieMotionHumanTouchEffector,
  AutoMovieMotionHumanTouchLaid,
  AutoMovieMotionHumanTouchUpright,
  HumanHand,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A touch's region, elbow hint, laid arm and primitives
 * (`AutoMovieMotionHumanTouch.region`, `bend`, `laid`, `touch`) put the
 * effector on the region, on the average man in the quiet stance.
 *
 * The region of these cells is a fixed place in the air ahead of each
 * shoulder, 0.15 m below it and 0.35 m ahead, facing back at the performer,
 * as a partner's chest would. The effector is the flat palm; a skin surface
 * stands `pad` inside its hand, so the displayed palm point lies that far
 * beyond the region along its normal, within the 10 mm skin tolerance.
 *
 * Scenarios, per hand:
 * 1. `region` of a performer's limb region is the region placed on the
 *    entry's displayed bone, and of a trunk region the region placed on the
 *    posture's displayed trunk.
 * 2. `laid`, solved with the elbow hint of `bend`, is an arm (upper arm and
 *    forearm, without the hand's turn) whose displayed wrist lies within the
 *    palm's reach of the region, plus the pad and 10 mm.
 *    `rest`'s goal stands the effector exactly a pad off the region along
 *    its normal; an upright vessel's facing
 *    (`AutoMovieMotionHumanTouchUpright.solve`) is a level unit direction,
 *    and the region's own normal when that has no level part.
 * 3. `touch` refuses a count of 0 or 1.5, claims the arm and the hand, holds
 *    the rest angles at the start and, held between `ready` and
 *    `strokeStart`, shows the palm on the region within 10 mm beyond the pad.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Lays real arms through the touch owner and reads displayed bones; a region read on the wrong pose, a hint that sends the arm elsewhere, a reference off the region, a missing refusal or a hold off its region fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The region is a stated place; the displayed palm is read from the engine's forward kinematics, the pad from the effector owner.
 * @evidence contracts/development/testing.md#distinguishing-cases Both hands, a limb and a trunk region, the start and the hold of a touch, two refused counts.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because a touch solves fitted postures; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the region, the effector, the pad's allowance and the 3 scenarios.
 */
export function test_human_motion_compose_touch_laid(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const body: IHumanBody = motionHumanBody("m-average");
  const quiet: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const entry: IAutoMoviePose = resolveHumanPosture(body, quiet);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    entry,
  );
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const context = {
    body,
    aim: (): never => {
      throw new Error("a self region is not aimed at");
    },
  };

  // 1. Region.
  const regions = Object.entries(body.surfaces.regions) as [
    AutoMovieHumanoidRegion,
    { bone: AutoMovieHumanoidBone },
  ][];
  const limb = regions.find(([, f]) => f.bone === "leftLowerArm");
  const trunk = regions.find(([, f]) => f.bone === "chest");
  const pitched: IHumanPosture = { ...quiet, pitch: 20, limbs: {} };
  const shown = poseBones(body, resolveHumanPosture(body, pitched));
  for (const [kind, found, on] of [
    ["limb", limb, bones],
    ["trunk", trunk, shown],
  ] as const) {
    if (found === undefined) {
      complaints.check(`a ${kind} region exists`, false);
      continue;
    }
    const [name, frame] = found;
    const read = AutoMovieMotionHumanTouch.region(
      context as never,
      { kind: "self", region: name } as never,
      0,
      pitched,
      bones,
    );
    const want = resolveAutoMovieHumanoidSurfaces.place(
      body.surfaces.regions[name],
      on.get(frame.bone)!,
    );
    complaints.check(
      `a ${kind} region (${name}) is read ${distance(read.point, want.point).toFixed(6)} m off its displayed place`,
      distance(read.point, want.point) <= 1e-6,
    );
  }

  for (const side of ["left", "right"] as const) {
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const place = {
      point: { x: shoulder.x, y: shoulder.y - 0.15, z: shoulder.z + 0.35 },
      normal: { x: 0, y: 0, z: -1 },
    };
    const effector: AutoMovieMotionHumanTouchEffector.IEffector = {
      surface: "palm",
      shape: "flat",
    };
    const pad: number = AutoMovieMotionHumanTouchEffector.pad(
      body,
      side,
      effector,
    );
    const off = (
      shownBones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): number =>
      distance(
        AutoMovieMotionHumanTouchEffector.point(
          body,
          shownBones,
          side,
          effector,
        ),
        { x: place.point.x, y: place.point.y, z: place.point.z - pad },
      );

    // 2. Bend and laid.
    const hint: IAutoMovieVector3 = AutoMovieMotionHumanTouchLaid.bend(
      body,
      quiet,
      side,
      effector,
      place,
      "up",
    );
    const reference = AutoMovieMotionHumanTouchLaid.laid(
      body,
      quiet,
      side,
      effector,
      place,
      "up",
      hint,
    );
    const laidPose = poseBones(
      body,
      resolveHumanPosture(body, {
        ...quiet,
        limbs: Object.fromEntries(
          Object.entries(quiet.limbs).filter(([l]) => l !== `${side}Arm`),
        ),
        joints: {
          ...quiet.joints,
          [`${side}UpperArm`]: reference.upper,
          [`${side}LowerArm`]: reference.lower,
        },
      }),
    );
    // The reference holds the upper arm and the forearm, not the hand's
    // turn, so the laid arm is read at its wrist: within the palm's own
    // reach of the region, beyond the pad and the skin tolerance.
    const palm: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      "palm",
      "flat",
    ).point;
    const reach: number = Math.hypot(palm.x, palm.y, palm.z) + pad + 0.01;
    const wrist: number = distance(
      laidPose.get(`${side}Hand`)!.worldPosition,
      place.point,
    );
    complaints.check(
      `${side}: the laid arm's wrist is ${(wrist * 1000).toFixed(2)} mm from the region, within the palm's reach of ${(reach * 1000).toFixed(2)} mm`,
      wrist <= reach,
    );

    // The rest goal stands the effector a pad off the region along its
    // normal; an upright vessel faces a level direction.
    const goal: IHumanPosture.IGoal = AutoMovieMotionHumanTouchLaid.rest(
      body,
      quiet,
      side,
      effector,
      place,
      "up",
      hint,
    );
    const atRest = AutoMovieMotionHumanTouchEffector.point(
      body,
      new Map([
        [
          `${side}Hand` as AutoMovieHumanoidBone,
          { worldPosition: goal.point, worldRotation: goal.rotation! },
        ],
      ]),
      side,
      effector,
    );
    complaints.check(
      `${side}: the rest goal stands the effector ${(distance(atRest, { x: place.point.x, y: place.point.y, z: place.point.z - pad }) * 1000).toFixed(4)} mm off a pad from the region`,
      distance(atRest, {
        x: place.point.x,
        y: place.point.y,
        z: place.point.z - pad,
      }) <= 1e-6,
    );
    const level: IAutoMovieVector3 = AutoMovieMotionHumanTouchUpright.solve(
      body,
      quiet,
      side,
      effector,
      { point: place.point, normal: { x: 0.2, y: 0.5, z: -1 } },
      hint,
    ).facing;
    const flat: IAutoMovieVector3 = AutoMovieMotionHumanTouchUpright.solve(
      body,
      quiet,
      side,
      effector,
      { point: place.point, normal: { x: 0, y: 1, z: 0 } },
      hint,
    ).facing;
    complaints.check(
      `${side}: an upright vessel faces a level unit direction, and a level region keeps its normal`,
      Math.abs(level.y) <= 1e-9 &&
        Math.abs(Math.hypot(level.x, level.z) - 1) <= 1e-9 &&
        flat.x === 0 &&
        flat.y === 1 &&
        flat.z === 0,
    );

    // 3. Touch.
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.phrase({
      prepare: 0.6,
      wait: 0.4,
      attack: 0.3,
      retract: 0.6,
    });
    const rest: AutoMovieMotionHumanArm.IAngles =
      AutoMovieMotionHumanArm.angles(entry, side);
    const props = (count: number): AutoMovieMotionHumanTouch.ITouch => ({
      body,
      clock,
      side,
      rest,
      effector,
      region: () => place,
      kind: "hold",
      count,
      bend: hint,
      reference,
      entry: { root: quiet.root, yaw: quiet.yaw },
    });
    complaints.refuses(`${side}: a count of 0`, () =>
      AutoMovieMotionHumanTouch.touch(props(0)),
    );
    complaints.refuses(`${side}: a count of 1.5`, () =>
      AutoMovieMotionHumanTouch.touch(props(1.5)),
    );
    const primitives: IAutoMovieMotionHumanPrimitive[] =
      AutoMovieMotionHumanTouch.touch(props(1));
    complaints.equals(
      `${side}: a touch claims the arm and the hand`,
      primitives.map((p) => p.channels),
      [[`${side}Arm`], [`${side}Hand`]],
    );
    const written = (seconds: number): IHumanPosture =>
      primitives.reduce(
        (posture: IHumanPosture, p: IAutoMovieMotionHumanPrimitive) =>
          p.write(posture, seconds),
        quiet,
      );
    complaints.check(
      `${side}: a touch starts from its rest angles`,
      JSON.stringify(written(0).joints[`${side}UpperArm`]) ===
        JSON.stringify(rest.upper) &&
        JSON.stringify(written(0).joints[`${side}LowerArm`]) ===
          JSON.stringify(rest.lower),
    );
    const held = poseBones(body, resolveHumanPosture(body, written(0.8)));
    complaints.check(
      `${side}: a held touch shows the palm ${(off(held) * 1000).toFixed(2)} mm off the region`,
      off(held) <= 0.01,
    );
  }
  complaints.assert("every touch is laid on its region");
}
