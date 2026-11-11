import {
  Quaternion,
  type AutoMoviePhysicalSimulation as Simulation,
  physicalSupportPoint,
  setPhysicalTargetJointRotation,
  warmPhysicalSupportTargets,
} from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";
import { vclose } from "../internal/vclose";

/** A warm support seed keeps the previous fit's task-space choice while its support-task null space returns to the authored posture.
 *
 * Scenarios:
 * 1. Null-space carry: a straight four-support leg whose previous fit hides an x-axis zig-zag (hip +α, knee −2α, ankle +α) that leaves the endpoint fixed to first order. The pivot heights 1, 0.55 and 0.1 m make Σ αᵢ(hᵢ − y) vanish for the endpoint at 0.05 m, so the analytic null direction is independent of the solver. At the bent seed the endpoint-height row has a singular value of order α but a task effect of order α², so the seed returns to the authored coordinates. Red: a seed that transports the whole previous correction, or a rank-cutoff projection, keeps a knee offset of order α.
 * 2. Task-space carry: a previous hip rotation that moves the endpoint keeps that endpoint to second order, while the seed differs from the previous fit because the hip rotation's null component returns. Red: projecting the whole difference to authored moves the endpoint by about 1.9 mm.
 * 3. Non-redundant carry: when only the hip's two coordinates are fitted, no null space exists and a task-moving previous hip rotation is retained exactly, preserving the chosen bend branch.
 * 4. Tolerance budget: a 0.5 mrad previous hip rotation moves the endpoint by about 0.48 mm, within the fit's 1 mm tolerance, so returning it is cheaper than the fit already accepts and the seed returns fully to authored. Red: a rank cutoff keeps it because its singular value is large.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `AutoMoviePhysicalSimulation`, `physicalSupportPoint` on in-memory inputs and asserts the returned observations through 7x TestValidator.predicate; 4 numbered scenarios (first: Null-space carry: a straight four-support leg whose previous fit hides an x-axis zig-zag (hip +α, knee −2α,...; last: Tolerance budget: a 0.5 mrad previous hip rotation moves the endpoint by about 0.48 mm, within the fit's 1...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (7 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: Null-space carry: a straight four-support leg whose previous fit hides an x-axis zig-zag (hip +α, knee −2α,...; last: Tolerance budget: a 0.5 mrad previous hip rotation moves the endpoint by about 0.48 mm, within the fit's 1...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_redundancy`, which owns the cases delegated to `PhysicalModelFixtures`, `PhysicalSupportFixtures`, `vclose`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Null-space carry: a straight four-support leg whose previous fit hides an x-axis zig-zag (hip +α, knee −2α, ankle +α) that leaves the...).
 */
export function test_physical_support_redundancy(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const body: Simulation.IBody = PhysicalSupportFixtures.body(profile, 1 / 120);
  const limb: IAutoMovieFootfallPattern["limbs"][number] =
    body.balance!.pattern.limbs.find(
      (candidate: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
        candidate.bone === "support-0",
    )!;
  const pattern: IAutoMovieFootfallPattern = {
    ...body.balance!.pattern,
    limbs: [limb],
  };
  const joints: Map<string, P.IJoint> = new Map(
    profile.joints.map((joint: P.IJoint): [string, P.IJoint] => [
      joint.child,
      joint,
    ]),
  );
  const descendants: Map<string, readonly string[]> = new Map(
    profile.segments.map((segment: P.ISegment): [string, string[]] => [
      segment.bone,
      subtree(segment.bone),
    ]),
  );
  const authored: Record<string, P.ITransform> = Object.fromEntries(
    profile.segments.map((segment: P.ISegment): [string, P.ITransform] => [
      segment.bone,
      structuredClone(segment.neutral),
    ]),
  );
  const chain: readonly string[] = ["upper-0", "lower-0", "support-0"];

  // 1. A pure first-order null-space zig-zag returns to the authored posture.
  const alpha: number = 0.005;
  const zigzag: Record<string, P.ITransform> = pose({
    "upper-0": alpha,
    "lower-0": -2 * alpha,
    "support-0": alpha,
  });
  const returned: Record<string, P.ITransform> = warm(zigzag, chain);
  TestValidator.predicate(
    "null-space zig-zag leaves the endpoint fixed to first order",
    vclose(endpoint(zigzag), endpoint(authored), 1e-4),
  );
  TestValidator.predicate(
    "null-space zig-zag returns to the authored coordinates",
    chain.every(
      (bone: string): boolean =>
        Math.abs(angle(returned, bone)) <= 0.02 * 2 * alpha,
    ),
  );

  // 2. A task-moving hip rotation keeps its endpoint while its null part returns.
  const beta: number = 0.002;
  const hip: Record<string, P.ITransform> = pose({ "upper-0": beta });
  const kept: Record<string, P.ITransform> = warm(hip, chain);
  TestValidator.predicate(
    "the previous task-space endpoint is meaningfully away from authored",
    !vclose(endpoint(hip), endpoint(authored), 1e-3),
  );
  TestValidator.predicate(
    "task-space hip correction keeps its endpoint to second order",
    vclose(endpoint(kept), endpoint(hip), 1e-5),
  );
  TestValidator.predicate(
    "the hip correction's null component returns toward authored",
    Math.abs(angle(kept, "lower-0")) > 0.1 * beta,
  );

  // 3. Without redundancy the previous coordinates stay exactly warm.
  const branch: Record<string, P.ITransform> = warm(hip, ["upper-0"]);
  TestValidator.predicate(
    "a non-redundant fit keeps its previous coordinates",
    Math.abs(angle(branch, "upper-0") - beta) <= 1e-12 &&
      Math.abs(angle(branch, "lower-0")) <= 1e-12,
  );

  // 4. A previous correction cheaper than the fit tolerance returns fully.
  const small: Record<string, P.ITransform> = warm(
    pose({ "upper-0": 0.0005 }),
    chain,
  );
  TestValidator.predicate(
    "a sub-tolerance task correction returns to authored",
    chain.every(
      (bone: string): boolean => Math.abs(angle(small, bone)) <= 1e-12,
    ),
  );

  /** World support endpoint of the tested limb. */
  function endpoint(
    poses: Readonly<Record<string, P.ITransform>>,
  ): P.ITransform["position"] {
    return physicalSupportPoint(poses[limb.bone]!, limb.localPoint);
  }

  /** Run the warm seed with identical current and preceding authored poses. */
  function warm(
    previous: Readonly<Record<string, P.ITransform>>,
    selected: readonly string[],
  ): Record<string, P.ITransform> {
    return warmPhysicalSupportTargets({
      order: profile.segments,
      joints,
      descendants,
      selected: new Set(selected),
      targets: authored,
      before: authored,
      previous,
      pattern,
      planted: new Set(),
      tolerance: 1e-3,
    });
  }

  /** Authored neutral with the given x-axis twist coordinates, applied parent-first. */
  function pose(
    angles: Readonly<Record<string, number>>,
  ): Record<string, P.ITransform> {
    const result: Record<string, P.ITransform> = structuredClone(authored);
    for (const bone of chain)
      if (angles[bone] !== undefined)
        setPhysicalTargetJointRotation(
          result,
          joints.get(bone)!,
          descendants.get(bone)!,
          Quaternion.normalize({
            x: Math.tan(angles[bone]! / 2),
            y: 0,
            z: 0,
            w: 1,
          }),
        );
    return result;
  }

  /** Independent x-axis twist coordinate of one joint, read from world poses. */
  function angle(
    poses: Readonly<Record<string, P.ITransform>>,
    bone: string,
  ): number {
    const joint: P.IJoint = joints.get(bone)!;
    const relative: P.ITransform["rotation"] = Quaternion.multiply(
      Quaternion.inverse(
        Quaternion.multiply(
          poses[joint.parent]!.rotation,
          joint.parentFrame.rotation,
        ),
      ),
      Quaternion.multiply(poses[bone]!.rotation, joint.childFrame.rotation),
    );
    return (
      2 * Math.atan2(relative.x * Math.sign(relative.w), Math.abs(relative.w))
    );
  }

  /** The bone and every descendant, parent first. */
  function subtree(bone: string): string[] {
    return [
      bone,
      ...profile.joints
        .filter((joint: P.IJoint): boolean => joint.parent === bone)
        .flatMap((joint: P.IJoint): string[] => subtree(joint.child)),
    ];
  }
}
