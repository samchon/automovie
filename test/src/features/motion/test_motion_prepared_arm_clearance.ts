import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanArmOvershoot } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/**
 * Prepared forearm clearance shares only fixed obstacle geometry while
 * every current elbow/wrist pair receives its actual distance and depth.
 *
 * Scenarios:
 * 1. A real canonical body's forearm-length axis runs parallel to the faces
 *    of an owned2x0.2x2m box, placed by a Z90 frame at(2,3,4). Every point
 *    on the axis has signed distance abs(localY)-0.1m. The elbow's untapered
 *    radius therefore fixes the maximum depth max(0,radius-distance),
 *    converted to degrees through the body's actual upper-arm length.
 * 2. Interior/just-outside/clear/interior/reverse-side candidates are read
 *    in one preparation on both sides with screening on and off. The
 *    current answer cannot retain an earlier candidate's distance.
 * 3. Own, other and resting lists and goal/no-goal metadata preserve this
 *    elbow-dominated case. Their wrist allowances only decrease later
 *    samples, so cold parity supplements the same independent maximum;
 *    this test does not claim to specify each allowance's active boundary.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States canonical body dimensions, isolated owned-box metre geometry, degree conversion, query/room lifetimes, the exact elbow maximum and three scenarios with the allowance-oracle limitation.
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual public prepared and ordinary HumanArmOvershoot readers against changing physical-length axes, checks a closed-form signed-plane-depth expectation, toggles the public screening switch, and covers current candidate replay through three fixed room roles and both sides.
 * @evidence contracts/development/testing.md#independent-expectations Axis local X stays within a box face's span while local Y is fixed and Z=0, making the nearest distance abs(Y)-0.1 at every axis point. Radius is greatest at the elbow and wrist allowances are nonpositive, so that sample exactly attains max(0,radius-distance). A metre depth divided by actual upper-arm metres gives radians, then degrees;1e-9 degrees covers rigid-transform binary64 roundoff, independently of the shared distance/query implementation.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers positive penetration, positive distance with remaining radius intrusion, complete clearance, A/B/A and opposite face, both arm sides, screened/full queries and three fixed-list roles with goal on/off. Actual median-plane/rival and wrist-allowance boundaries retain their existing canonical-body clearance tests.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable numerical unit borrows immutable canonical Human measurements and owns a finite box, poses, lists and candidate points. It restores screening in finally, uses only public APIs, and adds no Human imitation, internal import, foreign replacement, host or compiler.
 */
export function test_motion_prepared_arm_clearance(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const box: IAutoMovieMotionHumanColliders.IPlaced = {
    bone: "head",
    pose: { position: { x: 2, y: 3, z: 4 },
      rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 } },
    shapes: [{ id: "analytic-box", material: "solid", kind: "box",
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      halfExtents: { x: 1, y: 0.1, z: 1 } }],
  };
  const absent: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [];
  const obstacle: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [box];
  try {
    for (const [own, others, rests] of [
      [obstacle, absent, absent], [absent, obstacle, absent], [absent, absent, obstacle],
    ] as const)
      for (const side of ["left", "right"] as const)
        for (const goal of [true, false]) {
          const read: ReturnType<typeof HumanArmOvershoot.prepare> = HumanArmOvershoot.prepare(
            body, own, side, others, goal, undefined, undefined, rests,
          );
          for (const screened of [false, true]) {
            HumanArmOvershoot.broad(screened);
            for (const height of [0, 0.11, 0.1 + body.measure.forearmRadius + 0.02, 0, -0.025]) {
              const elbow: IAutoMovieVector3 = { x: 2 - height, y: 3 - body.measure.forearm / 2, z: 4 };
              const wrist: IAutoMovieVector3 = { x: 2 - height, y: 3 + body.measure.forearm / 2, z: 4 };
              const depth: number = Math.max(0, body.measure.forearmRadius - (Math.abs(height) - 0.1));
              const expected: number = depth / body.measure.upperArm * 180 / Math.PI;
              const prepared: number = read(elbow, wrist);
              const cold: number = HumanArmOvershoot.of(body, own, elbow, wrist, side,
                others, goal, undefined, undefined, rests);
              TestValidator.predicate(`current ${side} clearance screened=${screened}, goal=${goal}, localY=${height}`,
                nclose(prepared, expected, 1e-9) && nclose(cold, expected, 1e-9),
              );
            }
          }
        }
  } finally {
    HumanArmOvershoot.broad(true);
  }
}
