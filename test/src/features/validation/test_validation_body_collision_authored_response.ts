import { detectBodyCollision } from "@automovie/engine";
import type {
  IAutoMovieBodyCollisionResult,
  IAutoMovieCollisionActor,
  IAutoMovieKeyframe,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { staticActor } from "../internal/staticActor";
import { vclose } from "../internal/vclose";

/**
 * The detector forwards actual authored mass and restitution into a moving response.
 *
 * Scenarios:
 * 1. A 2 kg capsule moves 0.1 m upward in one second against a static 3 kg
 *    capsule. Authored response parameters 0.8 and 0.75 yield the existing
 *    adviser's effective bounce ratio 0.6, impulse 0.192 kg m/s and upward
 *    velocities 0.004 and 0.064 m/s.
 * 2. The same authored masses with explicit zero restitution yield inelastic
 *    deflection, impulse 0.12 kg m/s and both velocities 0.04 m/s.
 * 3. Both responses preserve momentum 0.2 kg m/s and retain the two observed
 *    contacts. The unique deepest overlap at t=1 selects the nonzero motion
 *    derivative instead of making every numeric assertion vacuous at t=0.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs actual FK sampling, contact selection and collision response on an authored moving pair, then verifies response kind, normal impulse, both velocities, momentum and contact population. Default mass/COR substitution, swapped bodies or lost velocity fail numerical assertions.
 * @evidence contracts/development/testing.md#independent-expectations Parallel capsule gaps are 0.3 m initially and 0.2 m at t=1 against summed radii 0.4 m, so the last sample is uniquely deepest and relative closing speed is 0.1 m/s. Newton's j=(1+e)*0.1/(1/2+1/3) gives 0.192 for e=0.8*0.75=0.6 and 0.12 for e=0 under the explicitly existing material heuristic, not a claim that multiplied body parameters reproduce a measured pair. Mass division gives the stated exit speeds and momentum remains 2*0.1=0.2. Shared finite-aware 1e-6 vector/scalar tolerances bound floating arithmetic.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a positive restitution bounce with explicit-zero deflection on identical moving geometry and unequal authored masses. The neighboring unknown-body test owns absent or malformed mass/coefficient admission and intent/non-contact behavior; this test owns numeric forwarding after valid admission.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous entry mutates only its own fresh motion fixture into two explicit linear keyframes and calls the real detector, with no foreign-method replacement, Human build or real host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists three scenarios, independent SI calculations, the unique-deepest-contact setup, current adviser heuristic and limits of the numeric claim.
 */
export function test_validation_body_collision_authored_response(): void {
  const findings: string[] = [];

  /** A world translation expressed through the actual pose-root channel. */
  const root: (height: number) => IAutoMovieTransform = (
    height: number,
  ): IAutoMovieTransform => ({
    translation: { x: 0, y: height, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });
  for (const [
    aRestitution,
    bRestitution,
    kind,
    impulse,
    velocityA,
    velocityB,
  ] of [
    [0.8, 0.75, "bounce", 0.192, 0.004, 0.064],
    [0, 0, "deflect", 0.12, 0.04, 0.04],
  ] as const) {
    const a: IAutoMovieCollisionActor = staticActor({
      node: "moving 2 kg",
      a: { x: 0, y: 0, z: 0 },
      b: { x: 1, y: 0, z: 0 },
      radius: 0.2,
      body: { mass: 2, centerOfMass: null, restitution: aRestitution },
    });
    const first: IAutoMovieKeyframe = a.motion.keyframes[0]!;
    a.motion = {
      ...a.motion,
      keyframes: [
        { ...first, time: 0, pose: { ...first.pose, root: root(0) } },
        { ...first, time: 1, pose: { ...first.pose, root: root(0.1) } },
      ],
    };
    const b: IAutoMovieCollisionActor = staticActor({
      node: "static 3 kg",
      a: { x: 0, y: 0.3, z: 0 },
      b: { x: 1, y: 0.3, z: 0 },
      radius: 0.2,
      body: { mass: 3, centerOfMass: null, restitution: bRestitution },
    });
    const result: IAutoMovieBodyCollisionResult = detectBodyCollision({
      a,
      b,
      sampleRate: 1,
    });
    const response: IAutoMovieBodyCollisionResult["response"] = result.response;
    if (
      !result.validation.success ||
      result.events.length !== 2 ||
      response === null
    ) {
      findings.push(`${kind}: valid authored response or contacts missing`);
      continue;
    }
    if (
      response.impact.kind !== kind ||
      !vclose(response.impact.impulse, { x: 0, y: impulse, z: 0 }) ||
      !vclose(response.impact.velocityA, { x: 0, y: velocityA, z: 0 }) ||
      !vclose(response.impact.velocityB, { x: 0, y: velocityB, z: 0 }) ||
      !nclose(
        2 * response.impact.velocityA.y + 3 * response.impact.velocityB.y,
        0.2,
      )
    )
      findings.push(
        `${kind}: authored quantities did not reach the numerical response`,
      );
  }
  TestValidator.equals(
    "moving collision response uses authored quantities",
    findings,
    [],
  );
}
