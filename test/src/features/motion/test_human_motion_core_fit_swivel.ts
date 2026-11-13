import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An arm asked to put its wrist at a place with its elbow at another keeps
 * the elbow there as the wrist turns a little about it: the fit does not
 * leave the configuration the elbow's place asks for another one.
 *
 * The goals are the loser's right arm of `test_human_motion_social_arm_wrestle`
 * (the small woman, seated and leaning 36.84 degrees over a table whose top
 * lies at 0.6929 m under her elbow): the elbow's place on the top as the
 * bend, and the wrist at the pin of 0 degrees and turned 15 degrees about the
 * elbows' line toward the pin, as the law asks them. At 0 degrees the elbow
 * rests on the top; at 15 the arm wrestle measured it 22 mm off, where the
 * same configuration turned by 15 degrees still reaches.
 *
 * Scenarios:
 * 1. At both pins the fitted elbow lies within 5 mm of the place on its
 *    circle (every place the elbow can take with the shoulder and the wrist
 *    where the fit put them) nearest its asked place: where the bend hint
 *    asks it to be (the law's own hold bound is 5 mm).
 * 2. From one pin to the other the upper arm turns no more than 20 degrees:
 *    the wrist turns 15 about a line through the elbow, so the upper arm
 *    turns about as much, and a change of configuration turns it 60 and more.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Fits measured goals through the public resolver and reads the displayed elbow and upper arm; a fit that lifts the elbow off its place for another configuration fails with the heights and the angles.
 * @evidence contracts/development/testing.md#independent-expectations The goals are another specification's measured records; the bounds are the law's own and the size of the wrist's turn, stated.
 * @evidence contracts/development/testing.md#distinguishing-cases The pin that holds and the first that did not, in one posture.
 * @evidence contracts/development/testing.md#execution-ownership Two posture solves on one prepared body; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, where the goals come from and the 2 scenarios with their bounds.
 */
export function test_human_motion_core_fit_swivel(): void {
  const body: IHumanBody = motionHumanBody("f-small");
  const TOP: number = 0.6929;
  const bend: IAutoMovieVector3 = { x: 0, y: 0.6929, z: 0.4393 };
  const posture = (
    roll: number,
    twist: number,
    point: IAutoMovieVector3,
  ): IHumanPosture => ({
    root: { x: 0, y: -0.1608, z: 1.3025 },
    yaw: 180,
    pitch: 36.8367,
    roll: 0,
    joints: {
      leftUpperArm: [0, 5, 0],
      leftLowerArm: [12, 0, 0],
      rightUpperArm: [0, 5, 0],
      rightLowerArm: [12, 0, 0],
      spine: [4.8412, roll, twist],
      chest: [4.8412, roll, twist],
      neck: [-20, 0, 0],
      head: [10.3176, 0, 0],
    },
    limbs: {
      leftLeg: {
        point: { x: -0.0747, y: 0.0613, z: 0.4113 },
        bend: { x: -0.1965, y: 0.0926, z: -0.1865 },
        rotation: { x: 0, y: 0.9981, z: 0, w: -0.061 },
        planted: true,
        contact: { x: -0.0004, y: -0.0426, z: 0.1203 },
      },
      rightLeg: {
        point: { x: 0.0747, y: 0.0613, z: 0.4113 },
        bend: { x: 0.1965, y: 0.0926, z: -0.1865 },
        rotation: { x: 0, y: 0.9981, z: 0, w: 0.061 },
        planted: true,
        contact: { x: 0.0004, y: -0.0426, z: 0.1203 },
      },
      leftArm: {
        point: { x: -0.0999, y: 0.5301, z: 0.6701 },
        rotation: { x: 0.0496, y: -0.7422, z: -0.0309, w: -0.6676 },
        bend: { x: -0.2885, y: 0.6035, z: 0.9562 },
        contact: { x: 0.0376, y: -0.0223, z: 0 },
      },
      rightArm: { point, bend },
    },
  });
  const fitted = (
    of: IHumanPosture,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    poseBones(body, resolveHumanPosture(body, of));
  const complaints: string[] = [];
  const pins: readonly (readonly [number, IHumanPosture])[] = [
    [0, posture(0, 0, { x: 0, y: 0.8935, z: 0.315 })],
    [15, posture(1.6667, -2.5, { x: 0.0519, y: 0.8866, z: 0.315 })],
  ];
  const upper: IAutoMovieResolvedBone[] = [];
  for (const [pin, of] of pins) {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      fitted(of);
    // The elbow's circle: every place the elbow can take with the shoulder
    // and the wrist where the fit put them, and the place on it nearest the
    // elbow's asked place, which is where the hint asks the elbow to be.
    const shoulder: IAutoMovieVector3 = bones.get("rightUpperArm")!.worldPosition;
    const elbow: IAutoMovieVector3 = bones.get("rightLowerArm")!.worldPosition;
    const wrist: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
    const sub = (p: IAutoMovieVector3, q: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: p.x - q.x,
      y: p.y - q.y,
      z: p.z - q.z,
    });
    const dot = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
      p.x * q.x + p.y * q.y + p.z * q.z;
    const len = (p: IAutoMovieVector3): number => Math.sqrt(dot(p, p));
    const l1: number = len(sub(elbow, shoulder));
    const l2: number = len(sub(wrist, elbow));
    const span: IAutoMovieVector3 = sub(wrist, shoulder);
    const d: number = len(span);
    const axis: IAutoMovieVector3 = { x: span.x / d, y: span.y / d, z: span.z / d };
    const along: number = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const r: number = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const centre: IAutoMovieVector3 = {
      x: shoulder.x + axis.x * along,
      y: shoulder.y + axis.y * along,
      z: shoulder.z + axis.z * along,
    };
    const toward: IAutoMovieVector3 = sub(bend, centre);
    const flat: IAutoMovieVector3 = sub(toward, {
      x: axis.x * dot(toward, axis),
      y: axis.y * dot(toward, axis),
      z: axis.z * dot(toward, axis),
    });
    const ideal: IAutoMovieVector3 = {
      x: centre.x + (flat.x / len(flat)) * r,
      y: centre.y + (flat.y / len(flat)) * r,
      z: centre.z + (flat.z / len(flat)) * r,
    };
    const off: number = len(sub(elbow, ideal));
    if (off > 0.005)
      complaints.push(
        `at a pin of ${pin} degrees the elbow lies ${(off * 1000).toFixed(1)} mm from the place on its circle nearest its asked place (${((ideal.y - TOP) * 1000).toFixed(1)} mm above the top there, the elbow ${((elbow.y - TOP) * 1000).toFixed(1)}), within 5 mm expected`,
      );
    upper.push(bones.get("rightUpperArm")!);
  }
  const a: IAutoMovieQuaternion = upper[0]!.worldRotation;
  const b: IAutoMovieQuaternion = upper[1]!.worldRotation;
  const turn: number =
    (2 *
      Math.acos(
        Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)),
      ) *
      180) /
    Math.PI;
  if (turn > 20)
    complaints.push(
      `from a pin of 0 to 15 degrees the upper arm turns ${turn.toFixed(1)} degrees, within 20 expected`,
    );
  TestValidator.equals(
    "an elbow asked at a place stays there as the wrist turns about it",
    complaints,
    [],
  );
}
