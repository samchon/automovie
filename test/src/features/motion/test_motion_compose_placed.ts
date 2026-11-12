import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanPlaced,
  AutoMovieMotionHumanTarget,
  HumanFoot,
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
 * The places a law reads around a posture (`AutoMovieMotionHumanPlaced`)
 * and the arm goals and carries that lay a hand on them
 * (`AutoMovieMotionHumanArm.origin`, `goal`, `carried`), on the average
 * man.
 *
 * Every place is checked on the engine's forward kinematics of a posture: a
 * root from `root` holds the resting point on the asked world point; the
 * pitch from `pitch` stands the resting shoulders' midpoint (`girdle`) the
 * asked height above the hips; `joint` and `shoulders` are the displayed
 * joints; `carried` keeps a point's place in the chest's frame; `grid`
 * reads a place from the floor point under the hips, so a trunk pitched
 * over the same hips reads the same place. A hand laid by a goal lies on its
 * target: the wrist from `wrist` or `goal`, turned as asked, puts the
 * surface on the point.
 *
 * Scenarios:
 * 1. `girdle` is the resting shoulders' midpoint; `root` at headings and
 *    tilts holds the resting hips on the asked point; `pitch` stands the
 *    girdle the asked height above the hips for five rises, and a rise past
 *    the trunk's length reads the nearest end.
 * 2. `joint`, `shoulders` and `carried` on the stance and on a trunk pitched
 *    by 30 degrees.
 * 3. `grid` reads the same place on the upright stance and on a trunk
 *    pitched over the same hips, at the stated heights and distances.
 * 4. `wrist` and `AutoMovieMotionHumanArm.goal` put the palm on the point,
 *    facing as asked; `AutoMovieMotionHumanArm.origin` read on the stance
 *    and carried back by `AutoMovieMotionHumanArm.point` is the palm's
 *    displayed point.
 * 5. `AutoMovieMotionHumanPlaced.arm` claims the arm and the hand; at weight
 *    0 it holds the rest angles and at weight 1 its arm, resolved, lays the
 *    palm within 10 mm of a place ahead at chest height.
 * 6. `AutoMovieMotionHumanTarget.hand` lays the palm on a table-top place
 *    facing down against its normal; `AutoMovieMotionHumanTarget.foot` puts
 *    the ball on a floor place, flat, along the heading;
 *    `AutoMovieMotionHumanArm.carried` claims the arm, holds its rest at
 *    weight 0 and takes its goal at weight 1.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads every place against the forward kinematics of real postures and lays a real arm; a root off its pivot, a wrong pitch, a joint read off the wrong pose, a grid anchored on the root or a hand off its target fails.
 * @evidence contracts/development/testing.md#independent-expectations Every expectation is a displayed bone or a stated point, never the function's own arithmetic.
 * @evidence contracts/development/testing.md#distinguishing-cases Three turns of the root, five rises and two past the length, an upright and a pitched trunk, both hands, both ends of a carry's weight.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States how each place is checked and the 5 scenarios with their bounds.
 */
export function test_motion_compose_placed(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const P = AutoMovieMotionHumanPlaced;
  const near = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    e: number = 1e-9,
  ): boolean =>
    Math.abs(a.x - b.x) <= e &&
    Math.abs(a.y - b.y) <= e &&
    Math.abs(a.z - b.z) <= e;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const body: IHumanBody = motionHumanBody("m-average");
  const rested = (
    root: IAutoMovieVector3,
    turn: Pick<IHumanPosture, "yaw" | "pitch" | "roll">,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    poseBones(body, {
      skeleton: body.skeleton.id,
      root: {
        translation: root,
        rotation: resolveHumanPosture.heading(turn),
        scale: { x: 1, y: 1, z: 1 },
      },
      joints: [],
    });
  const mid = (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 => {
    const l = bones.get("leftUpperArm")!.worldPosition;
    const r = bones.get("rightUpperArm")!.worldPosition;
    return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2, z: (l.z + r.z) / 2 };
  };

  // 1. Girdle, root and pitch.
  const l = body.rest.get("leftUpperArm")!;
  const r = body.rest.get("rightUpperArm")!;
  complaints.check(
    "the girdle is the resting shoulders' midpoint",
    near(P.girdle(body), {
      x: (l.x + r.x) / 2,
      y: (l.y + r.y) / 2,
      z: (l.z + r.z) / 2,
    }),
  );
  const target: IAutoMovieVector3 = { x: 0.3, y: 0.7, z: -0.2 };
  for (const turn of [
    { yaw: 0, pitch: 0, roll: 0 },
    { yaw: 70, pitch: 35, roll: 0 },
    { yaw: -120, pitch: 60, roll: 15 },
  ]) {
    const root: IAutoMovieVector3 = P.root(
      turn,
      body.rest.get("hips")!,
      target,
    );
    complaints.check(
      `a root at ${turn.yaw}, ${turn.pitch}, ${turn.roll} holds the hips on the point`,
      near(rested(root, turn).get("hips")!.worldPosition, target, 1e-9),
    );
  }
  const hips: IAutoMovieVector3 = body.rest.get("hips")!;
  const girdle: IAutoMovieVector3 = P.girdle(body);
  const length: number = Math.hypot(girdle.y - hips.y, girdle.z - hips.z);
  for (const share of [0.95, 0.6, 0.2, 0, -0.3]) {
    const p: number = P.pitch(body, share * length);
    const bones = rested({ x: 0, y: 1, z: 0 }, { yaw: 0, pitch: p, roll: 0 });
    const rise: number = mid(bones).y - bones.get("hips")!.worldPosition.y;
    complaints.check(
      `a pitch of ${p.toFixed(2)} stands the shoulders ${rise.toFixed(4)} m above the hips, ${(share * length).toFixed(4)} asked`,
      Math.abs(rise - share * length) <= 1e-6,
    );
  }
  complaints.check(
    "a rise past the trunk's length reads the nearest end",
    P.pitch(body, 2 * length) === P.pitch(body, length) &&
      P.pitch(body, -2 * length) === P.pitch(body, -length),
  );

  // 2. Joint, shoulders and carried.
  const quiet: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const pitched: IHumanPosture = { ...quiet, pitch: 30, limbs: {} };
  for (const [name, posture] of [
    ["the stance", quiet],
    ["a pitched trunk", pitched],
  ] as const) {
    const bones = poseBones(body, resolveHumanPosture(body, posture));
    complaints.check(
      `${name}: joint and shoulders are the displayed joints`,
      near(
        P.joint(body, posture, "chest"),
        bones.get("chest")!.worldPosition,
        1e-9,
      ) && near(P.shoulders(body, posture), mid(bones), 1e-9),
    );
  }
  const chest0 = poseBones(body, resolveHumanPosture(body, quiet)).get(
    "chest",
  )!;
  const chest1 = poseBones(body, resolveHumanPosture(body, pitched)).get(
    "chest",
  )!;
  const point: IAutoMovieVector3 = {
    x: chest0.worldPosition.x + 0.1,
    y: chest0.worldPosition.y + 0.2,
    z: chest0.worldPosition.z + 0.3,
  };
  const moved: IAutoMovieVector3 = P.carried(body, quiet, pitched, point);
  const local = (
    p: IAutoMovieVector3,
    chest: IAutoMovieResolvedBone,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(Quaternion.inverse(chest.worldRotation), {
      x: p.x - chest.worldPosition.x,
      y: p.y - chest.worldPosition.y,
      z: p.z - chest.worldPosition.z,
    });
  complaints.check(
    "carried keeps the point in the chest's frame and stays put without a change",
    near(local(moved, chest1), local(point, chest0), 1e-9) &&
      near(P.carried(body, quiet, quiet, point), point, 1e-9),
  );

  // 3. Grid.
  const restHips: IAutoMovieVector3 = body.rest.get("hips")!;
  const shownHips: IAutoMovieVector3 = {
    x: quiet.root.x + restHips.x,
    y: quiet.root.y + restHips.y,
    z: quiet.root.z + restHips.z,
  };
  const over: IHumanPosture = {
    ...quiet,
    pitch: 40,
    root: P.root({ yaw: 0, pitch: 40, roll: 0 }, restHips, shownHips),
  };
  const grid: AutoMovieMotionHumanTarget.IGrid = {
    height: "chest",
    lateral: "centre",
    distance: "near",
  };
  const upright: IAutoMovieVector3 = P.grid(body, quiet, "right", grid);
  const arm: number = body.measure.upperArm + body.measure.forearm;
  complaints.check(
    "the grid place is at chest height, a quarter arm ahead of the hips' floor point",
    Math.abs(upright.y - body.measure.chestHeight) <= 1e-9 &&
      Math.abs(upright.z - (shownHips.z - restHips.z + 0.25 * arm)) <= 1e-9,
  );
  complaints.check(
    "a trunk pitched over the same hips reads the same grid place",
    near(P.grid(body, over, "right", grid), upright, 1e-9),
  );

  // 4. Wrist, goal, origin.
  const stance: IAutoMoviePose = resolveHumanPosture(body, quiet);
  const stanceBones = poseBones(body, stance);
  for (const side of ["left", "right"] as const) {
    const at: IAutoMovieVector3 = {
      x: side === "left" ? 0.2 : -0.2,
      y: 1.2,
      z: 0.4,
    };
    const facing: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
    const forward: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const reach: HumanHand.IWrist = HumanHand.reach(
      body,
      side,
      "palm",
      {
        point: at,
        normal: facing,
        forward,
      },
      "flat",
    );
    const read = HumanHand.frame(
      body,
      new Map([
        [
          `${side}Hand` as AutoMovieHumanoidBone,
          {
            worldPosition: P.wrist(body, side, { point: at, facing, forward }),
            worldRotation: reach.rotation,
          },
        ],
      ]),
      side,
      "palm",
      "flat",
    );
    complaints.check(
      `${side}: the wrist puts the palm on the point, facing as asked`,
      near(read.point, at, 1e-9) && near(read.normal, facing, 1e-9),
    );
    const goal: IHumanPosture.IGoal = AutoMovieMotionHumanArm.goal(body, side, {
      surface: "palm",
      shape: "flat",
      point: at,
      rotation: reach.rotation,
      bend: { x: 0, y: 0, z: 0 },
    });
    complaints.check(
      `${side}: the goal's wrist and contact put the palm on the point`,
      near(goal.point, reach.point, 1e-9) &&
        goal.contact !== undefined &&
        near(
          (() => {
            const c = Quaternion.rotateVector(reach.rotation, goal.contact!);
            return {
              x: goal.point.x + c.x,
              y: goal.point.y + c.y,
              z: goal.point.z + c.z,
            };
          })(),
          at,
          1e-9,
        ),
    );
    const frame = { origin: quiet.root, yaw: quiet.yaw };
    const origin = AutoMovieMotionHumanArm.origin(
      body,
      stanceBones,
      frame,
      side,
      "palm",
    );
    complaints.check(
      `${side}: an origin read on the stance is carried back to the displayed palm`,
      near(
        AutoMovieMotionHumanArm.point(quiet, origin),
        HumanHand.frame(body, stanceBones, side, "palm", "relaxed").point,
        1e-9,
      ),
    );
  }

  // 5. The laid arm.
  const shoulder: IAutoMovieVector3 =
    stanceBones.get("rightUpperArm")!.worldPosition;
  const place = {
    point: { x: shoulder.x, y: shoulder.y - 0.1, z: shoulder.z + 0.4 },
    facing: { x: 0, y: 0, z: 1 },
  };
  const rest: AutoMovieMotionHumanArm.IAngles = AutoMovieMotionHumanArm.angles(
    stance,
    "right",
  );
  const laid = (weight: number): IAutoMovieMotionHumanPrimitive[] =>
    P.arm({
      body,
      side: "right",
      from: 0,
      to: 1,
      rest,
      weight: () => weight,
      place: () => place,
    });
  complaints.equals(
    "the arm and the hand are claimed",
    laid(1).map((p) => p.channels),
    [["rightArm"], ["rightHand"]],
  );
  const written = (weight: number): IHumanPosture =>
    laid(weight).reduce(
      (posture: IHumanPosture, p: IAutoMovieMotionHumanPrimitive) =>
        p.write(posture, 0.5),
      quiet,
    );
  const atRest: IHumanPosture = written(0);
  complaints.check(
    "at weight 0 the arm holds its rest",
    JSON.stringify(atRest.joints.rightUpperArm) ===
      JSON.stringify(rest.upper) &&
      JSON.stringify(atRest.joints.rightLowerArm) ===
        JSON.stringify(rest.lower),
  );
  const palm = HumanHand.frame(
    body,
    poseBones(body, resolveHumanPosture(body, written(1))),
    "right",
    "palm",
    "flat",
  );
  complaints.check(
    `at weight 1 the palm is ${(distance(palm.point, place.point) * 1000).toFixed(2)} mm from its place`,
    distance(palm.point, place.point) <= 0.01,
  );
  // 6. A hand and a foot on a place, and an arm carried by a weight.
  for (const side of ["left", "right"] as const) {
    const placeAt = {
      point: { x: side === "left" ? 0.15 : -0.15, y: 0.9, z: 0.45 },
      normal: { x: 0, y: 1, z: 0 },
    };
    const handTarget: AutoMovieMotionHumanArm.ITarget =
      AutoMovieMotionHumanTarget.hand(body, quiet, side, placeAt, {
        bend: "front",
      });
    const palmRest: HumanHand.IFrame = HumanHand.offset(
      body,
      side,
      "palm",
      "relaxed",
    );
    complaints.check(
      `${side}: a hand handTarget lays the palm on the place, against its normal`,
      handTarget.surface === "palm" &&
        near(handTarget.point, placeAt.point) &&
        near(Quaternion.rotateVector(handTarget.rotation, palmRest.normal), {
          x: 0,
          y: -1,
          z: 0,
        }),
    );
    const foot = AutoMovieMotionHumanTarget.foot(
      body,
      side,
      { point: { x: 0.1, y: 0, z: 0.3 } },
      90,
    );
    complaints.check(
      `${side}: a foot handTarget puts the ball on the place, flat, along the heading`,
      near(HumanFoot.point(body, side, "ball", foot), {
        x: 0.1,
        y: 0,
        z: 0.3,
      }) &&
        Math.abs(HumanFoot.pitch(foot.rotation)) <= 1e-9 &&
        Math.abs(HumanFoot.heading(foot.rotation) - 90) <= 1e-9,
    );
    const held: AutoMovieMotionHumanArm.IAngles =
      AutoMovieMotionHumanArm.angles(stance, side);
    const wanted: IHumanPosture.IGoal = AutoMovieMotionHumanArm.goal(
      body,
      side,
      handTarget,
    );
    const carry = (weight: number): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanArm.carried({
        body,
        side,
        from: 0,
        to: 1,
        rest: held,
        goal: () => wanted,
        weight: () => weight,
      });
    complaints.equals(
      `${side}: a carried arm claims its arm`,
      carry(0.5).channels,
      [`${side}Arm`],
    );
    const zero: IHumanPosture = carry(0).write(quiet, 0.5);
    const one: IHumanPosture = carry(1).write(quiet, 0.5);
    complaints.check(
      `${side}: a carried arm holds its rest at weight 0 and takes its goal at weight 1`,
      JSON.stringify(zero.joints[`${side}UpperArm`]) ===
        JSON.stringify(held.upper) &&
        zero.limbs[`${side}Arm`] === undefined &&
        one.limbs[`${side}Arm`] === wanted,
    );
  }
  complaints.assert("every place and laid hand is where it is documented");
}
