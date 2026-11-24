import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";

import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A small performer's elbow angle and wrist position agree with the prescribed
 * two-link marker geometry.
 *
 * Scenarios:
 *
 * 1. Place one marker in front of each shoulder at the distance of a 30-degree
 *    elbow bend.
 * 2. Observe the independently resolved wrist and recompute the clinical elbow
 *    angle from the displayed links.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A small performer's elbow angle and wrist position agree with the prescribed two-link marker geometry.
 * @evidence contracts/development/testing.md#independent-expectations The law of cosines fixes the required wrist radius and the dot product of the displayed upper and lower arm vectors gives the bend.
 * @evidence contracts/development/testing.md#distinguishing-cases Place one marker in front of each shoulder at the distance of a 30-degree elbow bend. Observe the independently resolved wrist and recompute the clinical elbow angle from the displayed links.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_gesture_bent_stage_endpoint(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const rest: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const before: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, rest),
  );
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const side of ["left", "right"] as const) {
    const shoulder: IAutoMovieVector3 = before.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const fore: IAutoMovieVector3 = before.get(
      `${side}LowerArm`,
    )!.worldPosition;
    const hand: IAutoMovieVector3 = before.get(`${side}Hand`)!.worldPosition;
    const upper: number = Vector3.distance(shoulder, fore);
    const lower: number = Vector3.distance(fore, hand);
    const reach: number = Math.sqrt(
      upper ** 2 + lower ** 2 + 2 * upper * lower * Math.cos(Math.PI / 6),
    );
    const target: IAutoMovieVector3 = Vector3.add(shoulder, {
      x: 0,
      y: 0,
      z: reach,
    });
    const goal: IAutoMovieHumanLimbGoal = {
      point: target,
      bend: Vector3.add(shoulder, {
        x: side === "left" ? upper : -upper,
        y: -lower,
        z: 0,
      }),
    };
    const solved: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, {
        ...rest,
        limbs: { ...rest.limbs, [`${side}Arm`]: goal },
      }),
    );
    const elbow: IAutoMovieVector3 = solved.get(
      `${side}LowerArm`,
    )!.worldPosition;
    const wrist: IAutoMovieVector3 = solved.get(`${side}Hand`)!.worldPosition;
    const a: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(elbow, solved.get(`${side}UpperArm`)!.worldPosition),
    );
    const b: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(wrist, elbow),
    );
    const angle: number =
      (180 / Math.PI) * Math.acos(Math.max(-1, Math.min(1, Vector3.dot(a, b))));
    all.check(
      `${side}: ${angle} degrees at marker`,
      Math.abs(angle - 30) <= 0.1,
    );
    all.check(
      `${side}: wrist reaches its marker`,
      Vector3.distance(wrist, target) <= 0.001,
    );
  }
  all.assert("a staged marker determines both hand and elbow");
}
