import {
  preparePhysicalGeometry as Geometry,
  Quaternion,
  Vector3,
  isPhysicalProfilePairExcluded,
  linearizePhysicalSeparation,
  measurePhysicalJointLimits,
  planPhysicalContactTargets,
  setPhysicalTargetJointRotation,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../../internal/PhysicalModelFixtures";
import { capsuleBoxSeparation } from "../../../internal/capsuleBoxSeparation";

/**
 * Witness-based self-separation derivatives agree with actual native signed
 * distance across the shape matrix, and the bounded fit accepts only real
 * improvement.
 *
 * Scenarios:
 *
 * 1. For every sphere, capsule and box pair, a positive gap yields an inactive
 *    zero row even when probed into overlap.
 * 2. At exact native tangency the row is either inactive or matches the native
 *    first-order change; within 1 mm of a capsule-box tangency the native
 *    distance equals the closed-form axis-to-box distance less the radius, and
 *    every real overlap is reported as contact.
 * 3. In deep overlap, small rigid translations and rotations of either collider
 *    change the linear model as native signed distance changes.
 * 4. A slide that removes the overlap exposes the frozen witness as local only;
 *    re-linearizing at the new pose follows native distance.
 * 5. The folded quadrupod regression, with its colliding branches recast as each
 *    shape kind, reduces actual native penetration while keeping the root,
 *    every anchor, joint ranges and the unrelated legs.
 * 6. Locking the folded joint keeps it fixed while free coordinates resolve the
 *    overlap.
 * 7. Locking every coordinate that can separate the overlap leaves targets and the
 *    actual penetration unchanged instead of claiming success.
 */
export async function test_unit_engine_physics_physical_separation_derivative(): Promise<void> {
  const geometry: IAutoMoviePreparePhysicalGeometry.IQueries = await Geometry();
  const shapes: IAutoMoviePhysicalShape[] = [
    {
      id: "surface",
      material: "solid",
      kind: "sphere",
      radius: 0.1,
      transform: {
        position: { x: 0.01, y: 0, z: -0.02 },
        rotation: Quaternion.identity(),
      },
    },
    {
      id: "surface",
      material: "solid",
      kind: "capsule",
      radius: 0.08,
      halfLength: 0.15,
      transform: {
        position: { x: 0, y: 0.02, z: 0 },
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 30),
      },
    },
    {
      id: "surface",
      material: "solid",
      kind: "box",
      halfExtents: { x: 0.1, y: 0.12, z: 0.09 },
      transform: {
        position: { x: -0.02, y: 0, z: 0.01 },
        rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 25),
      },
    },
  ];
  const approach: IAutoMovieVector3 = unit({ x: 1, y: 0.3, z: -0.2 });
  const first: IAutoMovieRigidTransform = {
    position: { x: 0, y: 1, z: 0 },
    rotation: Quaternion.fromAxisAngle(unit({ x: 1, y: 2, z: 3 }), 23),
  };
  const findings: string[] = [];
  for (const [index, a] of shapes.entries())
    for (const b of shapes.slice(index)) {
      const label: string = `${a.kind}-${b.kind}`;
      const place: (distance: number) => IAutoMovieRigidTransform = (
        distance: number,
      ): IAutoMovieRigidTransform => ({
        position: Vector3.add(
          first.position,
          Vector3.scale(approach, distance),
        ),
        rotation: Quaternion.fromAxisAngle(unit({ x: -2, y: 1, z: 1 }), 41),
      });
      const signed: (
        poseA: IAutoMovieRigidTransform,
        poseB: IAutoMovieRigidTransform,
      ) => number = (
        poseA: IAutoMovieRigidTransform,
        poseB: IAutoMovieRigidTransform,
      ): number =>
        geometry.contact(
          collider("a", a, poseA),
          collider("b", b, poseB),
          0,
          10,
        )!.separation;
      let near: number = 0;
      let far: number = 1;
      for (let iteration: number = 0; iteration < 48; ++iteration) {
        const middle: number = (near + far) / 2;
        if (signed(first, place(middle)) < 0) near = middle;
        else far = middle;
      }
      const tangent: number = (near + far) / 2;
      if (a.kind === "capsule" && b.kind === "box")
        for (const step of [-10, -3, -1, 0, 1, 3, 10]) {
          const pose: IAutoMovieRigidTransform = place(tangent + step * 1e-4);
          const expected: number = capsuleBoxSeparation(a, first, b, pose);
          const measured: number = signed(first, pose);
          const touching: boolean =
            geometry.contact(
              collider("a", a, first),
              collider("b", b, pose),
              0,
            ) !== null;
          if (
            !(Math.abs(measured - expected) < 1e-6) ||
            (expected < -1e-6 && !touching)
          )
            findings.push(
              `${label} ${step}e-4 native ${measured} analytic ${expected} touching ${touching}`,
            );
        }

      // 1. Separated colliders keep a zero row everywhere.
      const apart: IAutoMovieRigidTransform = place(tangent + 0.02);
      const inactive: (
        poseA: IAutoMovieRigidTransform,
        poseB: IAutoMovieRigidTransform,
      ) => number = linearizePhysicalSeparation(
        geometry,
        collider("a", a, first),
        collider("b", b, apart),
      );
      if (
        geometry.contact(
          collider("a", a, first),
          collider("b", b, apart),
          0,
        ) !== null ||
        inactive(first, apart) !== 0 ||
        inactive(first, place(tangent - 0.05)) !== 0
      )
        findings.push(`${label} positive gap is active`);

      // 2. Exact tangency is inactive or first-order exact.
      const touching: IAutoMovieRigidTransform = place(tangent);
      const contact: number = signed(first, touching);
      const boundary: (
        poseA: IAutoMovieRigidTransform,
        poseB: IAutoMovieRigidTransform,
      ) => number = linearizePhysicalSeparation(
        geometry,
        collider("a", a, first),
        collider("b", b, touching),
      );
      const pressed: IAutoMovieRigidTransform = place(tangent - 0.001);
      if (
        !(Math.abs(contact) < 1e-6) ||
        (contact >= 0
          ? boundary(first, pressed) !== 0
          : !(
              Math.abs(boundary(first, pressed) - signed(first, pressed)) < 2e-5
            ))
      )
        findings.push(
          `${label} tangency ${contact} model ${boundary(first, pressed)} native ${signed(first, pressed)}`,
        );

      // 3. Deep overlap follows native first-order change for each probe.
      const deep: IAutoMovieRigidTransform = place(tangent - 0.04);
      const depth: number = signed(first, deep);
      const model: (
        poseA: IAutoMovieRigidTransform,
        poseB: IAutoMovieRigidTransform,
      ) => number = linearizePhysicalSeparation(
        geometry,
        collider("a", a, first),
        collider("b", b, deep),
      );
      if (!(depth < -0.02) || !(Math.abs(model(first, deep) - depth) < 1e-12))
        findings.push(`${label} current ${depth} ${model(first, deep)}`);
      for (const axis of [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
      ])
        for (const sign of [-1, 1]) {
          const moved: IAutoMovieRigidTransform = {
            position: Vector3.add(
              deep.position,
              Vector3.scale(axis, sign * 0.001),
            ),
            rotation: deep.rotation,
          };
          const turnedA: IAutoMovieRigidTransform = turn(first, axis, sign);
          const turnedB: IAutoMovieRigidTransform = turn(deep, axis, sign);
          for (const [name, poseA, poseB] of [
            ["translate b", first, moved],
            ["rotate a", turnedA, deep],
            ["rotate b", first, turnedB],
          ] as const) {
            const error: number = Math.abs(
              model(poseA, poseB) - signed(poseA, poseB),
            );
            if (!(error < 2e-5))
              findings.push(
                `${label} ${name} ${JSON.stringify(axis)} ${sign}: ${error}`,
              );
          }
        }

      // 4. A frozen witness is local; refreshing follows the native measure.
      const normal: IAutoMovieVector3 = geometry.contact(
        collider("a", a, first),
        collider("b", b, deep),
        0,
      )!.normal;
      const slid: IAutoMovieRigidTransform = {
        position: Vector3.add(
          deep.position,
          Vector3.scale(unit(Vector3.cross(normal, { x: 0, y: 1, z: 0 })), 0.6),
        ),
        rotation: deep.rotation,
      };
      const refreshed: (
        poseA: IAutoMovieRigidTransform,
        poseB: IAutoMovieRigidTransform,
      ) => number = linearizePhysicalSeparation(
        geometry,
        collider("a", a, first),
        collider("b", b, slid),
      );
      if (
        !(signed(first, slid) > 0) ||
        !(model(first, slid) < -0.02) ||
        refreshed(first, slid) !== 0
      )
        findings.push(
          `${label} slide native ${signed(first, slid)} frozen ${model(first, slid)} refreshed ${refreshed(first, slid)}`,
        );
    }
  TestValidator.equals(
    "every shape pair's separation row follows native signed distance",
    findings,
    [],
  );

  // 5-7. Bounded planner on the folded quadrupod.
  const recasts: [
    string,
    (shape: IAutoMoviePhysicalShape) => IAutoMoviePhysicalShape,
  ][] = [
    ["box", (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShape => shape],
    [
      "capsule",
      (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShape => ({
        id: shape.id,
        material: shape.material,
        transform: shape.transform,
        kind: "capsule",
        radius: 0.05,
        halfLength: 0.175,
      }),
    ],
    [
      "sphere",
      (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShape => ({
        id: shape.id,
        material: shape.material,
        transform: shape.transform,
        kind: "sphere",
        radius: 0.12,
      }),
    ],
  ];
  for (const [kind, recast] of recasts) {
    const original: P = PhysicalModelFixtures.quadrupod();
    const profile: P = {
      ...original,
      segments: original.segments.map(
        (segment: IAutoMoviePhysicalSegment): IAutoMoviePhysicalSegment =>
          segment.bone === "lower-0" || segment.bone === "upper-2"
            ? { ...segment, shapes: segment.shapes.map(recast) }
            : segment,
      ),
    };
    const folded: Record<string, IAutoMovieRigidTransform> = fold(profile);
    const before: number = penetration(profile, folded);
    const fitted: Record<string, IAutoMovieRigidTransform> = plan(
      profile,
      folded,
    );
    const after: number = penetration(profile, fitted);
    TestValidator.predicate(
      `${kind} recast reduces actual native penetration`,
      before > 0.02 && after < before / 2,
    );
    TestValidator.equals(
      `${kind} recast keeps the admitted articulation`,
      admitted(profile, folded, fitted, ["1", "3"]),
      [],
    );
  }

  const profile: P = PhysicalModelFixtures.quadrupod();
  const folded: Record<string, IAutoMovieRigidTransform> = fold(profile);
  const before: number = penetration(profile, folded);
  const partial: P = lock(profile, folded, ["upper-0"]);
  const steered: Record<string, IAutoMovieRigidTransform> = plan(
    partial,
    folded,
  );
  TestValidator.predicate(
    "free coordinates resolve the overlap around a locked joint",
    penetration(partial, steered) < before / 2,
  );
  TestValidator.equals(
    "locked folded joint stays at its lock",
    admitted(partial, folded, steered, ["1", "3"]),
    [],
  );

  const sealed: P = lock(
    profile,
    folded,
    ["0", "2"].flatMap((leg: string): string[] =>
      ["upper", "lower", "support"].map(
        (part: string): string => `${part}-${leg}`,
      ),
    ),
  );
  const stuck: Record<string, IAutoMovieRigidTransform> = plan(sealed, folded);
  TestValidator.predicate(
    "an unreachable overlap stays measured instead of being claimed resolved",
    Math.abs(penetration(sealed, stuck) - before) < 1e-9 &&
      moved(folded, stuck) < 1e-9,
  );

  /** Borrow a shape at a test pose. */
  function collider(
    body: string,
    shape: IAutoMoviePhysicalShape,
    pose: IAutoMovieRigidTransform,
  ): IAutoMoviePreparePhysicalGeometry.ICollider {
    return { body, bone: "root", shape, pose };
  }

  /** Rotate a pose about its own origin by 0.05 degrees. */
  function turn(
    pose: IAutoMovieRigidTransform,
    axis: IAutoMovieVector3,
    sign: number,
  ): IAutoMovieRigidTransform {
    return {
      position: pose.position,
      rotation: Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.fromAxisAngle(axis, sign * 0.05),
          pose.rotation,
        ),
      ),
    };
  }

  /** Normalize a nonzero direction. */
  function unit(vector: IAutoMovieVector3): IAutoMovieVector3 {
    return Vector3.scale(vector, 1 / Vector3.length(vector));
  }

  /** The #3094 fold: upper-0 and its descendants turn -85 degrees about Z. */
  function fold(model: P): Record<string, IAutoMovieRigidTransform> {
    const targets: Record<string, IAutoMovieRigidTransform> =
      Object.fromEntries(
        model.segments.map(
          (
            segment: IAutoMoviePhysicalSegment,
          ): [string, IAutoMovieRigidTransform] => [
            segment.bone,
            structuredClone(segment.neutral),
          ],
        ),
      );
    setPhysicalTargetJointRotation(
      targets,
      model.joints.find(
        (joint: IAutoMoviePhysicalJoint): boolean => joint.child === "upper-0",
      )!,
      ["upper-0", "lower-0", "support-0"],
      Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -85),
    );
    return targets;
  }

  /** Self-avoidance fit with the root held at its actual pose. */
  function plan(
    model: P,
    targets: Record<string, IAutoMovieRigidTransform>,
  ): Record<string, IAutoMovieRigidTransform> {
    return planPhysicalContactTargets({
      body: "mechanism",
      profiles: { mechanism: model },
      targets: structuredClone(targets),
      actual: { mechanism: structuredClone(targets) },
      bindings: [],
      selfAvoidance: { iterations: 24, tolerance: 0.0001 },
      geometry,
      floor: -10,
    }).targets;
  }

  /** Lock every declared coordinate of the named joints at its current angle. */
  function lock(
    model: P,
    targets: Record<string, IAutoMovieRigidTransform>,
    children: readonly string[],
  ): P {
    return {
      ...model,
      joints: model.joints.map(
        (joint: IAutoMoviePhysicalJoint): IAutoMoviePhysicalJoint => {
          if (!children.includes(joint.child)) return joint;
          const angles: ReturnType<typeof measurePhysicalJointLimits> =
            measurePhysicalJointLimits(
              joint,
              targets[joint.parent]!,
              targets[joint.child]!,
            );
          return {
            ...joint,
            axes: joint.axes.map(
              (
                axis: IAutoMoviePhysicalJoint["axes"][number],
              ): IAutoMoviePhysicalJoint["axes"][number] => {
                const angle: number = angles.find(
                  (entry: (typeof angles)[number]): boolean =>
                    entry.axis === axis.axis,
                )!.angle;
                return { ...axis, minimum: angle, maximum: angle };
              },
            ),
          };
        },
      ),
    };
  }

  /** Root, anchors, ranges and untouched legs as declared by the profile. */
  function admitted(
    model: P,
    initial: Record<string, IAutoMovieRigidTransform>,
    poses: Record<string, IAutoMovieRigidTransform>,
    still: readonly string[],
  ): string[] {
    const findings: string[] = [];
    if (moved({ body: initial.body! }, { body: poses.body! }) > 1e-12)
      findings.push("root moved");
    for (const joint of model.joints) {
      const parent: IAutoMovieRigidTransform = poses[joint.parent]!;
      const child: IAutoMovieRigidTransform = poses[joint.child]!;
      const gap: number = Vector3.length(
        Vector3.subtract(
          Vector3.add(
            parent.position,
            Quaternion.rotateVector(
              parent.rotation,
              joint.parentFrame.position,
            ),
          ),
          Vector3.add(
            child.position,
            Quaternion.rotateVector(child.rotation, joint.childFrame.position),
          ),
        ),
      );
      if (!(gap < 1e-9)) findings.push(`${joint.id} anchor ${gap}`);
      for (const entry of measurePhysicalJointLimits(joint, parent, child))
        if (!(entry.violation < 1e-9))
          findings.push(`${joint.id}.${entry.axis} range ${entry.violation}`);
    }
    for (const leg of still)
      for (const part of ["upper", "lower", "support"]) {
        const bone: string = `${part}-${leg}`;
        if (moved({ [bone]: initial[bone]! }, { [bone]: poses[bone]! }) > 1e-12)
          findings.push(`${bone} moved without residual dependence`);
      }
    return findings;
  }

  /** Largest position or quaternion component change across shared bones. */
  function moved(
    from: Record<string, IAutoMovieRigidTransform>,
    to: Record<string, IAutoMovieRigidTransform>,
  ): number {
    let result: number = 0;
    for (const [bone, pose] of Object.entries(from)) {
      const next: IAutoMovieRigidTransform = to[bone]!;
      const sign: number =
        pose.rotation.x * next.rotation.x +
          pose.rotation.y * next.rotation.y +
          pose.rotation.z * next.rotation.z +
          pose.rotation.w * next.rotation.w <
        0
          ? -1
          : 1;
      result = Math.max(
        result,
        Vector3.length(Vector3.subtract(pose.position, next.position)),
        ...(["x", "y", "z", "w"] as const).map(
          (axis: "x" | "y" | "z" | "w"): number =>
            Math.abs(pose.rotation[axis] - sign * next.rotation[axis]),
        ),
      );
    }
    return result;
  }

  /** Worst actual enabled penetration through native geometry. */
  function penetration(
    model: P,
    poses: Record<string, IAutoMovieRigidTransform>,
  ): number {
    let result: number = 0;
    for (const [index, segment] of model.segments.entries())
      for (const other of model.segments.slice(index + 1)) {
        if (isPhysicalProfilePairExcluded(model, segment.bone, other.bone))
          continue;
        for (const a of segment.shapes)
          for (const b of other.shapes)
            result = Math.max(
              result,
              -(
                geometry.contact(
                  {
                    body: "mechanism",
                    bone: segment.bone,
                    shape: a,
                    pose: poses[segment.bone]!,
                  },
                  {
                    body: "mechanism",
                    bone: other.bone,
                    shape: b,
                    pose: poses[other.bone]!,
                  },
                  0,
                )?.separation ?? 0
              ),
            );
      }
    return result;
  }
}
