import {
  preparePhysicalGeometry as Geometry,
  Quaternion,
  Vector3,
  linearizePhysicalSeparation,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../../internal/PhysicalTolerance";

/** The probe's step across a tangency, metres: a tenth of a millimetre. */
const PROBE: number = 1e-4;

/**
 * How far a native signed distance may stand from its closed form near a
 * tangency, metres: the native query's micrometre resolution.
 */
const NATIVE: number = 1e-6;

/**
 * How far the linear model may miss the native distance after a small rigid
 * motion, metres: its second-order remainder, the motion's square over the
 * shapes' radius of order 0.1 m, under 2e-5 for motions of about a millimetre.
 */
const FIRST_ORDER: number = 2e-5;

import { capsuleBoxSeparation } from "../../../internal/capsuleBoxSeparation";

/**
 * `linearizePhysicalSeparation`'s witness-based self-separation rows agree with
 * the native signed distance across the shape matrix.
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
          const pose: IAutoMovieRigidTransform = place(tangent + step * PROBE);
          const expected: number = capsuleBoxSeparation(a, first, b, pose);
          const measured: number = signed(first, pose);
          const touching: boolean =
            geometry.contact(
              collider("a", a, first),
              collider("b", b, pose),
              0,
            ) !== null;
          if (
            !(Math.abs(measured - expected) < NATIVE) ||
            (expected < -NATIVE && !touching)
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
        !(Math.abs(contact) < NATIVE) ||
        (contact >= 0
          ? boundary(first, pressed) !== 0
          : !(
              Math.abs(boundary(first, pressed) - signed(first, pressed)) < FIRST_ORDER
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
      if (!(depth < -0.02) || !(Math.abs(model(first, deep) - depth) < PhysicalTolerance.ROUNDING))
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
            if (!(error < FIRST_ORDER))
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

}
