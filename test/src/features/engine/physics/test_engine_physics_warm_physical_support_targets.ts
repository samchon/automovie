import { Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../../internal/PhysicalSupportFixtures";
import { PhysicalTolerance } from "../../internal/PhysicalTolerance";
import { vclose } from "../../internal/vclose";

/**
 * The warm start's task tolerance, metres: a correction under a millimetre
 * returns to authored, and a kept endpoint stays within it.
 */
const WARM: number = 1e-3;

/**
 * How far a null-space zig-zag may move the endpoint, metres: it is fixed to
 * first order, and its second-order drift over the fixture's small turns stays
 * under a tenth of a millimetre.
 */
const FIRST_ORDER: number = 1e-4;

/**
 * A warm support seed keeps the previous fit's task-space choice while its
 * support-task null space returns to the authored posture.
 *
 * Scenarios:
 *
 * 1. Null-space carry: a bent-knee four-support leg whose previous fit hides an
 *    x-axis zig-zag that leaves the endpoint fixed to first order: the cross
 *    product of the endpoint's y and z rows over the hip, knee and ankle pivots
 *    read from the fixture's joint anchors, so the analytic null direction is
 *    independent of the solver, scaled to α at its largest. The seed returns to
 *    the authored coordinates. Red: a seed that transports the whole previous
 *    correction keeps an offset of order α.
 * 2. Task-space carry: a previous hip rotation that moves the endpoint keeps that
 *    endpoint within the fit's 1 mm tolerance, the budget the returned
 *    directions' linearized effects may spend, while the seed differs from the
 *    previous fit because the hip rotation's null component returns. Red:
 *    projecting the whole difference to authored moves the endpoint by about
 *    1.8 mm.
 * 3. Non-redundant carry: when only the hip's two coordinates are fitted, no null
 *    space exists and a task-moving previous hip rotation is retained exactly,
 *    preserving the chosen bend branch.
 * 4. Tolerance budget: a 0.5 mrad previous hip rotation moves the endpoint by
 *    about 0.48 mm, within the fit's 1 mm tolerance, so returning it is cheaper
 *    than the fit already accepts and the seed returns fully to authored. Red:
 *    a rank cutoff keeps it because its singular value is large.
 */
export function test_engine_physics_warm_physical_support_targets(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const body: IAutoMoviePhysicalSimulationInput.IBody =
    PhysicalSupportFixtures.body(profile, 1 / 120);
  const limb: IAutoMovieFootfallPattern["limbs"][number] =
    body.balance!.pattern.limbs.find(
      (candidate: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
        candidate.bone === "support-0",
    )!;
  const pattern: IAutoMovieFootfallPattern = {
    ...body.balance!.pattern,
    limbs: [limb],
  };
  const joints: Map<string, IAutoMoviePhysicalJoint> = new Map(
    profile.joints.map(
      (joint: IAutoMoviePhysicalJoint): [string, IAutoMoviePhysicalJoint] => [
        joint.child,
        joint,
      ],
    ),
  );
  const descendants: Map<string, readonly string[]> = new Map(
    profile.segments.map(
      (segment: IAutoMoviePhysicalSegment): [string, string[]] => [
        segment.bone,
        subtree(segment.bone),
      ],
    ),
  );
  const authored: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    profile.segments.map(
      (
        segment: IAutoMoviePhysicalSegment,
      ): [string, IAutoMovieRigidTransform] => [
        segment.bone,
        structuredClone(segment.neutral),
      ],
    ),
  );
  const chain: readonly string[] = ["upper-0", "lower-0", "support-0"];

  // 1. A pure first-order null-space zig-zag returns to the authored posture.
  // The x-axis rotations' endpoint rows from the fixture's own pivots: an
  // x-axis turn theta at pivot p moves the endpoint e by theta (0, -(e - p).z,
  // (e - p).y), so the null direction is the cross product of the y and z
  // rows over the three joints, scaled to alpha at its largest.
  const alpha: number = 0.005;
  const tip: IAutoMovieRigidTransform["position"] = endpoint(authored);
  const pivots: IAutoMovieRigidTransform["position"][] = chain.map((bone) => {
    const joint: IAutoMoviePhysicalJoint = joints.get(bone)!;
    const parent: IAutoMovieRigidTransform = authored[joint.parent]!;
    return Vector3.add(
      parent.position,
      Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
    );
  });
  const rowY: number[] = pivots.map((p) => -(tip.z - p.z));
  const rowZ: number[] = pivots.map((p) => tip.y - p.y);
  const direction: number[] = [
    rowY[1]! * rowZ[2]! - rowY[2]! * rowZ[1]!,
    rowY[2]! * rowZ[0]! - rowY[0]! * rowZ[2]!,
    rowY[0]! * rowZ[1]! - rowY[1]! * rowZ[0]!,
  ];
  const largest: number = Math.max(...direction.map(Math.abs));
  const zigzag: Record<string, IAutoMovieRigidTransform> = pose(
    Object.fromEntries(
      chain.map((bone, i): [string, number] => [
        bone,
        (alpha * direction[i]!) / largest,
      ]),
    ),
  );
  const returned: Record<string, IAutoMovieRigidTransform> = warm(
    zigzag,
    chain,
  );
  TestValidator.predicate(
    "null-space zig-zag leaves the endpoint fixed to first order",
    vclose(endpoint(zigzag), endpoint(authored), FIRST_ORDER),
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
  const hip: Record<string, IAutoMovieRigidTransform> = pose({
    "upper-0": beta,
  });
  const kept: Record<string, IAutoMovieRigidTransform> = warm(hip, chain);
  TestValidator.predicate(
    "the previous task-space endpoint is meaningfully away from authored",
    !vclose(endpoint(hip), endpoint(authored), WARM),
  );
  // The returned directions' linearized effects stay within the fit's 1 mm
  // tolerance (`resolvePhysicalSupportRedundancy`), so the seed keeps the
  // endpoint within that budget and second order, short of the 1.8 mm a full
  // return of the hip would move it.
  TestValidator.predicate(
    "task-space hip correction keeps its endpoint within the fit tolerance",
    Math.hypot(
      endpoint(kept).x - endpoint(hip).x,
      endpoint(kept).y - endpoint(hip).y,
      endpoint(kept).z - endpoint(hip).z,
    ) <=
      WARM + PhysicalTolerance.CONTACT_TIME,
  );
  TestValidator.predicate(
    "the hip correction's null component returns toward authored",
    Math.abs(angle(kept, "lower-0")) > 0.1 * beta,
  );

  // 3. Without redundancy the previous coordinates stay exactly warm.
  const branch: Record<string, IAutoMovieRigidTransform> = warm(hip, [
    "upper-0",
  ]);
  TestValidator.predicate(
    "a non-redundant fit keeps its previous coordinates",
    Math.abs(angle(branch, "upper-0") - beta) <= PhysicalTolerance.ROUNDING &&
      Math.abs(angle(branch, "lower-0")) <= PhysicalTolerance.ROUNDING,
  );

  // 4. A previous correction cheaper than the fit tolerance returns fully.
  const small: Record<string, IAutoMovieRigidTransform> = warm(
    pose({ "upper-0": 0.0005 }),
    chain,
  );
  TestValidator.predicate(
    "a sub-tolerance task correction returns to authored",
    chain.every(
      (bone: string): boolean =>
        Math.abs(angle(small, bone)) <= PhysicalTolerance.ROUNDING,
    ),
  );

  /** World support endpoint of the tested limb. */
  function endpoint(
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ): IAutoMovieRigidTransform["position"] {
    return AutoMovieEnginePhysics.physicalSupportPoint(poses[limb.bone]!, limb.localPoint);
  }

  /** Run the warm seed with identical current and preceding authored poses. */
  function warm(
    previous: Readonly<Record<string, IAutoMovieRigidTransform>>,
    selected: readonly string[],
  ): Record<string, IAutoMovieRigidTransform> {
    return AutoMovieEnginePhysics.warmPhysicalSupportTargets({
      order: profile.segments,
      joints,
      descendants,
      selected: new Set(selected),
      targets: authored,
      before: authored,
      previous,
      pattern,
      planted: new Set(),
      tolerance: WARM,
    });
  }

  /**
   * Authored neutral with the given x-axis twist coordinates, applied
   * parent-first.
   */
  function pose(
    angles: Readonly<Record<string, number>>,
  ): Record<string, IAutoMovieRigidTransform> {
    const result: Record<string, IAutoMovieRigidTransform> =
      structuredClone(authored);
    for (const bone of chain)
      if (angles[bone] !== undefined)
        AutoMovieEnginePhysics.setPhysicalTargetJointRotation(
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
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
    bone: string,
  ): number {
    const joint: IAutoMoviePhysicalJoint = joints.get(bone)!;
    const relative: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
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
        .filter(
          (joint: IAutoMoviePhysicalJoint): boolean => joint.parent === bone,
        )
        .flatMap((joint: IAutoMoviePhysicalJoint): string[] =>
          subtree(joint.child),
        ),
    ];
  }
}
