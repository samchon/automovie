import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFoot,
  HumanFrame,
  type IHumanBody,
  hipJoints,
  humanRig,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The frames every posture is written in: a performer's floor frame
 * (`HumanFrame`), the rigid foot rocker (`HumanFoot`), the hip joints under
 * a root (`hipJoints`) and the rig poses are read through (`humanRig`), on
 * the average man.
 *
 * A heading of 0 faces world +Z with the performer's left along world +X; a
 * heading of 90 faces +X with the left along -Z (the documented right-handed
 * turn about +Y). A foot pivoting about a sole point keeps that point where
 * it was put, whatever the heading and the pitch, because the rocker is a
 * rotation of the rigid foot about it (Perry and Burnfield). The hip joints
 * depend only on the root, its rotation and the pelvis joint, so they are
 * where a fully resolved stance displays its thighs' roots.
 *
 * Scenarios:
 * 1. `HumanFrame.point` puts a local left, up and forward at the stated
 *    world axes for headings 0 and 90, `local` inverts it for any heading,
 *    and `turn(90)` carries +Z to +X.
 * 2. `HumanFoot.offset` is the socket's own point for a socket on the foot
 *    and the toes' joint for `mtp`; a toe socket on the toes bone keeps its
 *    distance from the toes' joint as the toes flex and rises as they lift.
 * 3. `HumanFoot.pivot` keeps its heel, ball or toe on the given point for
 *    headings 0 and 90 and pitches -20, 0 and 30, with the documented
 *    rotation.
 * 4. On the displayed stance, `HumanFoot.sockets` lists heel, ball and toe in
 *    that order, from back to front, each within 10 mm of the floor.
 * 5. `hipJoints` at the stance's root, root rotation and pelvis are the
 *    stance's displayed hip joints within a micrometre, and a root moved by
 *    a vector moves both by it.
 * 6. `humanRig` is the body's skeleton with the engine's canonical joint
 *    axes and rest frames.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls each function on a real body and its displayed stance; a turned axis, a pivot that slides, a socket on the wrong bone, hips that ignore the root or a foreign rig fails.
 * @evidence contracts/development/testing.md#independent-expectations Axes are the documented heading convention, the pivot's fixed point is its definition, and the hips and sockets are read off the engine's forward kinematics of the stance.
 * @evidence contracts/development/testing.md#distinguishing-cases Two headings, three sole points and three pitches, both feet, a moved root.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the conventions and the 6 scenarios with their bounds.
 */
export function test_motion_posture_frames(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const near = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    e: number = 1e-9,
  ): boolean =>
    Math.abs(a.x - b.x) <= e &&
    Math.abs(a.y - b.y) <= e &&
    Math.abs(a.z - b.z) <= e;

  // 1. The floor frame.
  const origin: IAutoMovieVector3 = { x: 1, y: 0.5, z: 2 };
  const at = (yaw: number, x: number, y: number, z: number) =>
    HumanFrame.point({ origin, yaw }, { x, y, z });
  complaints.check(
    "heading 0: left is +X, up is +Y, forward is +Z",
    near(at(0, 1, 0, 0), { x: 2, y: 0.5, z: 2 }) &&
      near(at(0, 0, 1, 0), { x: 1, y: 1.5, z: 2 }) &&
      near(at(0, 0, 0, 1), { x: 1, y: 0.5, z: 3 }),
  );
  complaints.check(
    "heading 90: left is -Z and forward is +X",
    near(at(90, 1, 0, 0), { x: 1, y: 0.5, z: 1 }) &&
      near(at(90, 0, 0, 1), { x: 2, y: 0.5, z: 2 }),
  );
  for (const yaw of [-135, -30, 0, 47, 180]) {
    const local: IAutoMovieVector3 = { x: 0.3, y: -0.2, z: 1.1 };
    complaints.check(
      `local inverts point at heading ${yaw}`,
      near(
        HumanFrame.local({ origin, yaw }, at(yaw, local.x, local.y, local.z)),
        local,
      ),
    );
  }
  complaints.check(
    "turn(90) carries +Z to +X and turn(0) is the identity",
    near(Quaternion.rotateVector(HumanFrame.turn(90), { x: 0, y: 0, z: 1 }), {
      x: 1,
      y: 0,
      z: 0,
    }) &&
      near(
        Quaternion.rotateVector(HumanFrame.turn(0), { x: 0.2, y: 0.3, z: 0.4 }),
        { x: 0.2, y: 0.3, z: 0.4 },
      ),
  );

  const body: IHumanBody = motionHumanBody("m-average");
  for (const side of ["left", "right"] as const) {
    const suffix: "Left" | "Right" = side === "left" ? "Left" : "Right";
    // 2. Offsets.
    const foot: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
    const toesJoint: IAutoMovieVector3 = body.rest.get(`${side}Toes`)!;
    complaints.check(
      `${side}: mtp is the toes' joint from the ankle`,
      near(HumanFoot.offset(body, side, "mtp"), {
        x: toesJoint.x - foot.x,
        y: toesJoint.y - foot.y,
        z: toesJoint.z - foot.z,
      }),
    );
    for (const socket of ["heel", "ball", "toe"] as const) {
      const frame = body.surfaces.sockets[`${socket}${suffix}`];
      if (frame.bone === `${side}Foot`) {
        complaints.check(
          `${side} ${socket}: a socket on the foot is its own point`,
          near(HumanFoot.offset(body, side, socket), frame.point) &&
            near(HumanFoot.offset(body, side, socket, 40), frame.point),
        );
        continue;
      }
      const joint: IAutoMovieVector3 = body.rest.get(frame.bone)!;
      const pivotAt: IAutoMovieVector3 = {
        x: joint.x - foot.x,
        y: joint.y - foot.y,
        z: joint.z - foot.z,
      };
      const flat: IAutoMovieVector3 = HumanFoot.offset(body, side, socket, 0);
      const lifted: IAutoMovieVector3 = HumanFoot.offset(
        body,
        side,
        socket,
        30,
      );
      const radius = (p: IAutoMovieVector3): number =>
        Math.hypot(p.x - pivotAt.x, p.y - pivotAt.y, p.z - pivotAt.z);
      complaints.check(
        `${side} ${socket}: a socket on the toes keeps its distance from their joint and rises as they lift (${flat.y.toFixed(4)} to ${lifted.y.toFixed(4)})`,
        Math.abs(radius(flat) - radius(lifted)) <= 1e-9 && lifted.y > flat.y,
      );
    }

    // 3. Pivots.
    const fixed: IAutoMovieVector3 = { x: 0.4, y: 0, z: -0.3 };
    for (const point of ["heel", "ball", "toe"] as const)
      for (const heading of [0, 90])
        for (const pitch of [-20, 0, 30]) {
          const placed: HumanFoot.IPlacement = HumanFoot.pivot(
            body,
            side,
            point,
            fixed,
            heading,
            pitch,
          );
          complaints.check(
            `${side} pivot on the ${point} at heading ${heading}, pitch ${pitch} keeps it in place`,
            near(HumanFoot.point(body, side, point, placed), fixed, 1e-9) &&
              near(
                Quaternion.rotateVector(placed.rotation, { x: 0, y: 0, z: 1 }),
                Quaternion.rotateVector(HumanFoot.rotation(heading, pitch), {
                  x: 0,
                  y: 0,
                  z: 1,
                }),
              ),
          );
        }
  }

  // 4. Sockets on the displayed stance.
  const pose: IAutoMoviePose = resolveHumanPosture(
    body,
    stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
  );
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    pose,
  );
  for (const side of ["left", "right"] as const) {
    const sockets: HumanFoot.ISocket[] = HumanFoot.sockets(body, bones, side);
    complaints.equals(
      `${side}: the sockets in order`,
      sockets.map((s) => s.socket),
      ["heel", "ball", "toe"],
    );
    complaints.check(
      `${side}: heel, ball and toe run back to front (${sockets.map((s) => s.point.z.toFixed(3)).join(", ")})`,
      sockets[0]!.point.z < sockets[1]!.point.z &&
        sockets[1]!.point.z < sockets[2]!.point.z,
    );
    complaints.check(
      `${side}: every socket is on the floor (${sockets.map((s) => (s.point.y * 1000).toFixed(1)).join(", ")} mm)`,
      sockets.every((s) => Math.abs(s.point.y) <= 0.01),
    );
  }

  // 5. The hip joints.
  const pelvis: IAutoMovieJointPose | undefined = pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "hips",
  );
  const triple: readonly [number, number, number] | undefined =
    pelvis === undefined
      ? undefined
      : [pelvis.flexion ?? 0, pelvis.abduction ?? 0, pelvis.twist ?? 0];
  const root = pose.root!;
  const hips = hipJoints(body, root.translation, root.rotation, triple);
  complaints.check(
    "the hip joints are the stance's",
    near(hips.left, bones.get("leftUpperLeg")!.worldPosition, 1e-6) &&
      near(hips.right, bones.get("rightUpperLeg")!.worldPosition, 1e-6),
  );
  const moved = hipJoints(
    body,
    {
      x: root.translation.x + 0.7,
      y: root.translation.y - 0.2,
      z: root.translation.z + 1.5,
    },
    root.rotation,
    triple,
  );
  complaints.check(
    "a moved root moves both hips by as much",
    near(
      moved.left,
      { x: hips.left.x + 0.7, y: hips.left.y - 0.2, z: hips.left.z + 1.5 },
      1e-9,
    ) &&
      near(
        moved.right,
        {
          x: hips.right.x + 0.7,
          y: hips.right.y - 0.2,
          z: hips.right.z + 1.5,
        },
        1e-9,
      ),
  );

  // 6. The rig.
  const rig = humanRig(body);
  complaints.check(
    "the rig is the body's skeleton with the canonical tables",
    rig.skeleton === body.skeleton &&
      rig.jointAxes === HUMANOID_JOINT_AXES &&
      rig.restFrames === HUMANOID_REST_FRAME,
  );
  complaints.assert("every frame reads as documented");
}
