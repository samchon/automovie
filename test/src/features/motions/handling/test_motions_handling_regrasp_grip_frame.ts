import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanProp, IAutoMovieMotionHumanRegrasp, IAutoMovieResolvedBone, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanPrehension } from "@automovie/motions";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { testAffordance } from "../../internal/fixtures/testAffordance";
import { motionActionContext } from "../../internal/motionActionContext";
import { vclose } from "../../internal/vclose";

/**
 * Pin the displayed prop path of a regrip around an offset grip socket.
 *
 * Scenarios:
 *
 * 1. The right hand's fixed wrist holds a mug by one offset and moves the mug
 *    towards its independently fitted second grasp without shifting the wrist.
 * 2. The left hand repeats the change with a different rotation. The prop follows
 *    a straight line halfway through and ends at the fitted second grasp when
 *    the grip window's displacement is applied at the socket.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines displayed prop translation through an offset grip while the supporting wrist stays fixed.
 * @evidence contracts/development/testing.md#behavioral-verification Stages right and left grasp changes with distinct rotations and reads the actual prop through the grip-window interpolation.
 * @evidence contracts/development/testing.md#independent-expectations An independently fitted second grasp provides the endpoint. The midpoint follows the local socket's translated half displacement and the fixed wrist does not drift.
 */
export async function test_motions_handling_regrasp_grip_frame(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const rotation: IAutoMovieRigidTransform["rotation"] =
    AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 70);
  const prop: IAutoMovieMotionHumanProp = {
    subject: "mug",
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: AutoMovieEngineQuaternion.identity() },
    points: {},
    shapes: [
      {
        id: "body",
        kind: "box",
        material: "ceramic",
        transform: { position: { x: 0, y: 0.05, z: 0 }, rotation },
        halfExtents: { x: 0.039, y: 0.05, z: 0.039 },
      },
    ],
    affordances: [
      testAffordance("body", "handle", { x: 0, y: 0.05, z: 0 }, rotation, {
        grip: "power",
        aperture: 0.078,
      }),
    ],
  };

  for (const side of ["right", "left"] as const) {
    const carried: IAutoMovieRigidTransform = {
      position: { x: side === "right" ? 0.11 : -0.09, y: 0.04, z: -0.05 },
      rotation: AutoMovieEngineQuaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        side === "right" ? 25 : -35,
      ),
    };
    const context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRegrasp.IParams> =
      motionActionContext(
        body,
        { kind: "regrip", hand: side, prop: "mug", to: "body" },
        {
          yaw: 43,
          props: [prop],
          holds: { [side]: "mug" },
          carried: { [side]: carried },
        },
      );
    const wrist: IAutoMovieResolvedBone = poseBones(
      body,
      context.entry.pose,
    ).get(`${side}Hand`)!;
    const socket: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
      body.surfaces.sockets[side === "right" ? "gripRight" : "gripLeft"],
      wrist,
    ).point;
    const start: IAutoMovieRigidTransform = context
      .prop("mug")
      .frame(context.start);
    const { HumanGrasp, regrasp } = AutoMovieMotionHumanPrehension;
    const fitted: IAutoMovieMotionHumanHand.IWrist = HumanGrasp.hand(
      body,
      side,
      HumanGrasp.at(prop, "body", start),
    );

    // Match the held object to its second wrist fit, then take it with that
    // wrist kept at the first pose. This gives the target in world coordinates.
    const end: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      wrist.worldPosition,
      AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.multiply(
          wrist.worldRotation,
          AutoMovieEngineQuaternion.inverse(fitted.rotation),
        ),
        AutoMovieEngineVector3.subtract(start.position, fitted.point),
      ),
    );
    const motion: NonNullable<IAutoMovieMotionHumanContactWindow["inHand"]> =
      regrasp.plan(context).contacts[0]!.inHand!;
    const stored: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(wrist.worldRotation),
      AutoMovieEngineVector3.subtract(start.position, socket),
    );
    for (const share of [0, 0.5, 1]) {
      const change: IAutoMovieRigidTransform = motion(share);
      const displayed: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        socket,
        AutoMovieEngineQuaternion.rotateVector(
          wrist.worldRotation,
          AutoMovieEngineVector3.add(
            AutoMovieEngineQuaternion.rotateVector(change.rotation, stored),
            change.position,
          ),
        ),
      );
      TestValidator.predicate(
        `${side} grip follows the second grasp at share ${share}`,
        vclose(displayed, AutoMovieEngineVector3.lerp(start.position, end, share), 1e-10),
      );
    }
  }
}
