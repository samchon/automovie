import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanHand,
  type IHumanBody,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The hand's surfaces and the rotations that lay them on a place
 * (`HumanHand`), on the average man.
 *
 * A surface's offset is its frame from the wrist joint in the hand's rest
 * frame. The fingers of a hand at rest point out along the arm (world +X for
 * the left hand, -X for the right) with the palm down (-Y). A rotation
 * aligned from two frames meets the normal exactly and the forward's part
 * across the normal as closely as it can. Laying a surface on a frame with
 * `reach` and reading it back with `frame` on a hand placed at the returned
 * wrist gives the frame back.
 *
 * Scenarios, per hand:
 * 1. `offset`: the wrist is the joint itself with the palm's normal; the
 *    index fingertip of a flat hand lies farther from the wrist than the
 *    palm, and farther than that of a fist.
 * 2. `align` meets a normal exactly and a forward across it; it refuses a
 *    forward along the normal.
 * 3. `rotation` turns the rest fingers onto the asked fingers and the rest
 *    palm onto the asked palm; `facing` with fingers `forward` and palm
 *    `down` is that rotation for the heading's forward, at headings 0 and
 *    90.
 * 4. `place` puts the surface's point on the asked point.
 * 5. `reach` then `frame` on a hand at the returned wrist gives back the
 *    target's point and normal for the palm, the back of the hand and the
 *    fist; on the displayed stance the index fingertip's frame lies within
 *    30 mm of the index's distal joint.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls each function on a real body's hands; a surface off its socket, a rotation that misses its normal, a mirrored hand or a frame read off the wrong bone fails.
 * @evidence contracts/development/testing.md#independent-expectations Each expected direction is the documented rest frame turned by hand; the round trip compares a frame with itself; the fingertip is bounded by the displayed distal joint.
 * @evidence contracts/development/testing.md#distinguishing-cases Both hands, two shapes of the fingertip, two headings, three surfaces, a refused forward.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the rest frame, the alignment rule, the round trip and the 5 scenarios with their bounds.
 */
export function test_motion_posture_hand(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const near = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    e: number = 1e-9,
  ): boolean =>
    Math.abs(a.x - b.x) <= e &&
    Math.abs(a.y - b.y) <= e &&
    Math.abs(a.z - b.z) <= e;
  const turn = (q: IAutoMovieQuaternion, v: IAutoMovieVector3) =>
    Quaternion.rotateVector(q, v);
  const length = (v: IAutoMovieVector3): number => Math.hypot(v.x, v.y, v.z);
  const body: IHumanBody = motionHumanBody("m-average");
  const pose = resolveHumanPosture(
    body,
    stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
  );
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    pose,
  );
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    // 1. Offsets.
    const palm: HumanHand.IFrame = HumanHand.offset(body, side, "palm");
    const wrist: HumanHand.IFrame = HumanHand.offset(body, side, "wrist");
    complaints.check(
      `${side}: the wrist surface is the joint with the palm's normal`,
      near(wrist.point, { x: 0, y: 0, z: 0 }) &&
        near(wrist.normal, palm.normal),
    );
    const flat: number = length(
      HumanHand.offset(body, side, "indexTip", "flat").point,
    );
    const fist: number = length(
      HumanHand.offset(body, side, "indexTip", "fist").point,
    );
    complaints.check(
      `${side}: a flat index tip (${flat.toFixed(3)} m) lies beyond the palm (${length(palm.point).toFixed(3)} m) and beyond a fist's (${fist.toFixed(3)} m)`,
      flat > length(palm.point) && flat > fist,
    );

    // 2. Align.
    const rest = {
      normal: { x: 0, y: -1, z: 0 },
      forward: { x: sign, y: 0, z: 0 },
    };
    const world = {
      normal: { x: 0.3, y: 0.2, z: 0.9 },
      forward: { x: 0, y: 1, z: 0.4 },
    };
    const q: IAutoMovieQuaternion = HumanHand.align(rest, world);
    const n = (v: IAutoMovieVector3): IAutoMovieVector3 => {
      const l: number = length(v);
      return { x: v.x / l, y: v.y / l, z: v.z / l };
    };
    const across = (f: IAutoMovieVector3, nn: IAutoMovieVector3) => {
      const d: number = f.x * nn.x + f.y * nn.y + f.z * nn.z;
      return n({ x: f.x - d * nn.x, y: f.y - d * nn.y, z: f.z - d * nn.z });
    };
    complaints.check(
      `${side}: align meets the normal and the forward across it`,
      near(turn(q, rest.normal), n(world.normal)) &&
        near(
          turn(q, across(rest.forward, rest.normal)),
          across(world.forward, n(world.normal)),
        ),
    );
    complaints.refuses(
      `${side}: align refuses a forward along the normal`,
      () =>
        HumanHand.align(rest, {
          normal: { x: 0, y: 1, z: 0 },
          forward: { x: 0, y: 2, z: 0 },
        }),
    );

    // 3. Rotation and facing.
    const r: IAutoMovieQuaternion = HumanHand.rotation(side, {
      fingers: { x: 0, y: 0, z: 1 },
      palm: { x: 0, y: -1, z: 0 },
    });
    complaints.check(
      `${side}: rotation turns the rest fingers and palm onto the asked ones`,
      near(turn(r, { x: sign, y: 0, z: 0 }), { x: 0, y: 0, z: 1 }) &&
        near(turn(r, { x: 0, y: -1, z: 0 }), { x: 0, y: -1, z: 0 }),
    );
    for (const yaw of [0, 90]) {
      const f: IAutoMovieQuaternion = HumanHand.facing(side, yaw, {
        fingers: "forward",
        palm: "down",
      });
      const ahead: IAutoMovieVector3 = {
        x: Math.sin((yaw * Math.PI) / 180),
        y: 0,
        z: Math.cos((yaw * Math.PI) / 180),
      };
      complaints.check(
        `${side}: facing forward, palm down at heading ${yaw}`,
        near(turn(f, { x: sign, y: 0, z: 0 }), ahead) &&
          near(turn(f, { x: 0, y: -1, z: 0 }), { x: 0, y: -1, z: 0 }),
      );
    }

    // 4. Place.
    const at: IAutoMovieVector3 = { x: 0.2 * sign, y: 1.1, z: 0.35 };
    const placed: HumanHand.IWrist = HumanHand.place(body, side, "palm", at, r);
    const p: IAutoMovieVector3 = turn(r, palm.point);
    complaints.check(
      `${side}: place puts the palm on the point`,
      near(
        {
          x: placed.point.x + p.x,
          y: placed.point.y + p.y,
          z: placed.point.z + p.z,
        },
        at,
      ),
    );

    // 5. Reach and frame.
    const target: HumanHand.IFrame = {
      point: at,
      normal: n({ x: -0.2 * sign, y: 0.3, z: -1 }),
      forward: { x: 0, y: 1, z: 0 },
    };
    for (const surface of ["palm", "handBack", "fist"] as const) {
      const goal: HumanHand.IWrist = HumanHand.reach(
        body,
        side,
        surface,
        target,
        surface === "fist" ? "fist" : "relaxed",
      );
      const read: HumanHand.IFrame = HumanHand.frame(
        body,
        new Map([
          [
            `${side}Hand` as AutoMovieHumanoidBone,
            { worldPosition: goal.point, worldRotation: goal.rotation },
          ],
        ]),
        side,
        surface,
        surface === "fist" ? "fist" : "relaxed",
      );
      complaints.check(
        `${side}: the ${surface} reached is read back on its target`,
        near(read.point, target.point) && near(read.normal, target.normal),
      );
    }
    const tip: HumanHand.IFrame = HumanHand.frame(
      body,
      bones,
      side,
      "indexTip",
    );
    const distal: IAutoMovieVector3 = bones.get(
      `${side}IndexDistal`,
    )!.worldPosition;
    const gap: number = length({
      x: tip.point.x - distal.x,
      y: tip.point.y - distal.y,
      z: tip.point.z - distal.z,
    });
    complaints.check(
      `${side}: the displayed index tip is ${(gap * 1000).toFixed(1)} mm from its distal joint`,
      gap <= 0.03,
    );
  }
  complaints.assert("every hand surface is laid and read as documented");
}
