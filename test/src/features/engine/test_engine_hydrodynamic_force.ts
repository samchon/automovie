import {
  AutoMovieEngineGravity,
  AutoMovieEngineVector3,
  AutoMovieEngineMotionHydrodynamics,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieResolveHydrodynamicForce,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The water's forces on one segment (#3432): `AutoMovieEngineMotionHydrodynamics`.
 *
 * Every case is a 4-litre segment, the sphere of that volume `r =
 * (3 V / 4π)^(1/3)` standing in for it, in fresh water (1000 kg/m³) whose
 * surface is at 0 m.
 *
 * Scenarios:
 * 1. Archimedes: wholly under, the buoyancy is `ρ g V` upward within 1e-9
 *    relative; its centre on the surface, half of that; wholly above, none;
 *    at every depth in between, the spherical cap's `π d² (3r - d) / 3`.
 * 2. Drag: still, none; moving at `v`, `½ ρ C_d π r² |v| v` against the
 *    velocity when wholly under, scaled by the submerged share when partly;
 *    doubling the speed quadruples it (quadratic drag); none above the
 *    water.
 * 3. A denser fluid (sea water, 1025 kg/m³) lifts in its ratio.
 * 4. Volumes: a sphere, a capsule and a box collider give their closed-form
 *    volumes, and two shapes sum.
 * 5. A non-positive volume or density is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public force and volume on closed-form segments; a cap volume off its formula, buoyancy at the wrong depth, drag along the velocity or linear in speed, or a shape's volume misread fails.
 * @evidence contracts/development/testing.md#independent-expectations Archimedes' principle, the spherical cap's volume, quadratic drag's law and the shapes' volumes, all written out.
 * @evidence contracts/development/common.md#meaningful-documentation Submerged buoyancy and still or moving drag use hand formulas. Density scaling, sphere, capsule and box volumes and nonpositive inputs exercise separate physical cases.
 */
export function test_engine_hydrodynamic_force(): void {
  const findings: string[] = [];
  const V: number = 0.004;
  const r: number = Math.cbrt((3 * V) / (4 * Math.PI));
  const g: number = AutoMovieEngineGravity.STANDARD;
  const rho: number = AutoMovieEngineMotionHydrodynamics.WATER;
  const at = (
    y: number,
    velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
    density?: number,
  ): IAutoMovieResolveHydrodynamicForce.IForce =>
    AutoMovieEngineMotionHydrodynamics.resolve({
      volume: V,
      centre: { x: 0, y, z: 0 },
      velocity,
      surface: 0,
      ...(density === undefined ? {} : { density }),
    });
  const close = (a: number, b: number): boolean =>
    Math.abs(a - b) <= 1e-9 * Math.max(1e-9, Math.abs(b));

  // 1. Archimedes over the cap.
  if (!close(at(-2 * r).buoyancy.y, rho * g * V))
    findings.push(`wholly under: ${at(-2 * r).buoyancy.y}`);
  if (!close(at(0).buoyancy.y, (rho * g * V) / 2))
    findings.push(`centre on the surface: ${at(0).buoyancy.y}`);
  if (at(2 * r).buoyancy.y !== 0) findings.push("wholly above, still lifted");
  for (let k: number = 1; k < 10; k++) {
    const d: number = (2 * r * k) / 10;
    const cap: number = (Math.PI * d * d * (3 * r - d)) / 3;
    if (!close(at(r - d).submerged, cap))
      findings.push(
        `depth ${d.toFixed(4)} m: submerged ${at(r - d).submerged}, cap ${cap}`,
      );
  }

  // 2. Drag.
  if (AutoMovieEngineVector3.length(at(-2 * r).drag) !== 0)
    findings.push("a still segment feels drag");
  const v: IAutoMovieVector3 = { x: 0.6, y: 0, z: 0.8 };
  const full: IAutoMovieResolveHydrodynamicForce.IForce = at(-2 * r, v);
  const expected: number =
    0.5 * rho * AutoMovieEngineMotionHydrodynamics.DRAG * Math.PI * r * r;
  if (
    !close(AutoMovieEngineVector3.length(full.drag), expected) ||
    AutoMovieEngineVector3.dot(full.drag, v) >= 0
  )
    findings.push(
      `drag at 1 m/s: ${JSON.stringify(full.drag)}, expected ${expected} against the velocity`,
    );
  const faster: number = AutoMovieEngineVector3.length(at(-2 * r, AutoMovieEngineVector3.scale(v, 2)).drag);
  if (!close(faster, 4 * AutoMovieEngineVector3.length(full.drag)))
    findings.push(
      `doubling the speed scales drag by ${faster / AutoMovieEngineVector3.length(full.drag)}`,
    );
  const half: IAutoMovieResolveHydrodynamicForce.IForce = at(0, v);
  if (!close(AutoMovieEngineVector3.length(half.drag), expected / 2))
    findings.push(
      `half under: drag ${AutoMovieEngineVector3.length(half.drag)}, expected ${expected / 2}`,
    );
  if (AutoMovieEngineVector3.length(at(2 * r, v).drag) !== 0)
    findings.push("drag above the water");

  // 3. A denser fluid.
  if (
    !close(
      at(-2 * r, undefined, 1025).buoyancy.y,
      (1025 / rho) * at(-2 * r).buoyancy.y,
    )
  )
    findings.push("sea water does not lift in its density's ratio");

  // 4. Volumes.
  const transform: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const segment = (
    shapes: IAutoMoviePhysicalShape[],
  ): IAutoMoviePhysicalSegment => ({
    bone: "hips",
    neutral: transform,
    mass: 1,
    centerOfMass: { x: 0, y: 0, z: 0 },
    inertia: { x: 1, y: 1, z: 1 },
    inertiaRotation: { x: 0, y: 0, z: 0, w: 1 },
    shapes,
  });
  const sphere: IAutoMoviePhysicalShape = {
    id: "s",
    material: "m",
    transform,
    kind: "sphere",
    radius: 0.1,
  };
  const capsule: IAutoMoviePhysicalShape = {
    id: "c",
    material: "m",
    transform,
    kind: "capsule",
    radius: 0.05,
    halfLength: 0.2,
  };
  const box: IAutoMoviePhysicalShape = {
    id: "b",
    material: "m",
    transform,
    kind: "box",
    halfExtents: { x: 0.1, y: 0.2, z: 0.3 },
  };
  const vs: number = (4 / 3) * Math.PI * 0.001;
  const vc: number = Math.PI * 0.0025 * 0.4 + (4 / 3) * Math.PI * 0.000125;
  const vb: number = 8 * 0.1 * 0.2 * 0.3;
  if (!close(AutoMovieEngineMotionHydrodynamics.volume(segment([sphere])), vs))
    findings.push("a sphere's volume");
  if (!close(AutoMovieEngineMotionHydrodynamics.volume(segment([capsule])), vc))
    findings.push("a capsule's volume");
  if (!close(AutoMovieEngineMotionHydrodynamics.volume(segment([box])), vb))
    findings.push("a box's volume");
  if (!close(AutoMovieEngineMotionHydrodynamics.volume(segment([sphere, box])), vs + vb))
    findings.push("two shapes do not sum");

  // 5. Refusals.
  TestValidator.error("a zero volume is refused", (): void => {
    AutoMovieEngineMotionHydrodynamics.resolve({
      volume: 0,
      centre: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      surface: 0,
    });
  });
  TestValidator.error("a zero density is refused", (): void => {
    AutoMovieEngineMotionHydrodynamics.resolve({
      volume: V,
      centre: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      surface: 0,
      density: 0,
    });
  });

  TestValidator.predicate(
    `hydrodynamic force: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
