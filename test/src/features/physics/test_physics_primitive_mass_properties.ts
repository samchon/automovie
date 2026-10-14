import { primitiveCentroid, primitiveVolume } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * The physics layer weighs true solid mass properties, not the render
 * tessellation's approximations. Each primitive's analytic volume and local
 * centroid are pinned against hand math, so mass, support, and free-fall
 * feedback compute from real shapes.
 *
 * Scenarios:
 *
 * 1. Box volume is width·height·depth.
 * 2. Sphere volume is 4/3·π·r³.
 * 3. Cylinder volume is π·r²·h.
 * 4. Cone volume is 1/3·π·r²·h, a third of its bounding cylinder.
 * 5. Capsule volume is the cylinder body plus a full sphere.
 * 6. Plane is a degenerate solid with zero volume.
 * 7. Only the cone has an off-origin centroid, at +height/4 along +Y; every other
 *    primitive is centered on its origin.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates primitive solid volume and centroid functions against analytic values, catching missing factors, omitted capsule caps, a nonzero plane volume or an inverted cone centroid.
 * @evidence contracts/testing.md#independent-expectations Standard solid-volume equations and symmetry supply the expected numbers; the cone sign follows the supported +Y-base convention. This numerical unit does not inspect rendered tessellation or all symmetric primitive kinds.
 * @evidence contracts/testing.md#distinguishing-cases Covers box, sphere, cylinder, cone, capsule and zero-volume plane plus asymmetric cone versus symmetric sphere centroid; part transforms and aggregate weighting belong to derivation units.
 * @evidence contracts/testing.md#execution-ownership The named exported unit calls portable formula functions with authored records and direct numeric predicates; no rendering host or dynamic test is involved.
 */
export function test_physics_primitive_mass_properties(): void {
  TestValidator.predicate(
    "box volume = w·h·d",
    nclose(primitiveVolume({ type: "box", width: 2, height: 3, depth: 4 }), 24),
  );
  TestValidator.predicate(
    "sphere volume = 4/3·π·r³",
    nclose(
      primitiveVolume({ type: "sphere", radius: 2 }),
      (4 / 3) * Math.PI * 8,
    ),
  );
  TestValidator.predicate(
    "cylinder volume = π·r²·h",
    nclose(
      primitiveVolume({ type: "cylinder", radius: 2, height: 3 }),
      Math.PI * 4 * 3,
    ),
  );
  TestValidator.predicate(
    "cone volume = 1/3·π·r²·h",
    nclose(
      primitiveVolume({ type: "cone", radius: 2, height: 3 }),
      (1 / 3) * Math.PI * 4 * 3,
    ),
  );
  TestValidator.predicate(
    "capsule volume = cylinder + full sphere",
    nclose(
      primitiveVolume({ type: "capsule", radius: 2, height: 3 }),
      Math.PI * 4 * 3 + (4 / 3) * Math.PI * 8,
    ),
  );
  TestValidator.predicate(
    "plane volume = 0",
    nclose(primitiveVolume({ type: "plane", width: 2, depth: 3 }), 0),
  );
  TestValidator.predicate(
    "cone centroid at +height/4 on +Y",
    vclose(primitiveCentroid({ type: "cone", radius: 2, height: 4 }), {
      x: 0,
      y: 1,
      z: 0,
    }),
  );
  TestValidator.predicate(
    "symmetric primitive centroid at origin",
    vclose(primitiveCentroid({ type: "sphere", radius: 2 }), {
      x: 0,
      y: 0,
      z: 0,
    }),
  );
}
