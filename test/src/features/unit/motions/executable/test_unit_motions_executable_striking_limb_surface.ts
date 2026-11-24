import { StrikingLimb } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** How near a signed distance comes to its closed form, metres. */
const EXACT: number = 1e-12;

/**
 * `StrikingLimb.surface` is the signed distance from a point to a tapered
 * capsule. For a cone of radius `r0` at `a` growing by `k` per metre, a point
 * `s` along the axis and `h` from it whose nearest axis point falls inside the
 * axis lies `h sqrt(1 - k^2) - r0 - k s` from the surface.
 *
 * Scenarios:
 *
 * 1. A uniform capsule of radius 0.1 m along x from 0 to 1 m: a point 0.3 m off
 *    its middle lies 0.2 m out, one on its axis 0.1 m inside, and one 2 m along
 *    the axis 0.9 m past its end cap.
 * 2. A capsule tapering from 0.1 to 0.2 m: a point 1 m off its middle lies
 *    `sqrt(0.99) - 0.1 - 0.05` m out.
 * 3. A capsule whose radius changes by its length or more reads its larger end
 *    sphere.
 * 4. A capsule of no length is a sphere.
 */
export function test_unit_motions_executable_striking_limb_surface(): void {
  const uniform: StrikingLimb.ICapsule = {
    name: "uniform",
    a: { x: 0, y: 0, z: 0 },
    b: { x: 1, y: 0, z: 0 },
    radius: 0.1,
    tail: 0.1,
  };

  // 1. The uniform capsule.
  TestValidator.predicate(
    "off the side, inside and past the cap",
    nclose(
      StrikingLimb.surface({ x: 0.5, y: 0.3, z: 0 }, uniform),
      0.2,
      EXACT,
    ) &&
      nclose(
        StrikingLimb.surface({ x: 0.5, y: 0, z: 0 }, uniform),
        -0.1,
        EXACT,
      ) &&
      nclose(StrikingLimb.surface({ x: 2, y: 0, z: 0 }, uniform), 0.9, EXACT),
  );

  // 2. The taper.
  TestValidator.predicate(
    "the cone's closed form",
    nclose(
      StrikingLimb.surface(
        { x: 0.5, y: 0, z: 1 },
        { ...uniform, name: "taper", tail: 0.2 },
      ),
      Math.sqrt(0.99) - 0.1 - 0.05,
      EXACT,
    ),
  );

  // 3. A radius change past the length.
  TestValidator.predicate(
    "the larger end sphere",
    nclose(
      StrikingLimb.surface(
        { x: 1, y: 2, z: 0 },
        { ...uniform, name: "bulb", tail: 1.5 },
      ),
      2 - 1.5,
      EXACT,
    ),
  );

  // 4. No length.
  TestValidator.predicate(
    "a sphere",
    nclose(
      StrikingLimb.surface(
        { x: 0, y: 0.5, z: 0 },
        { ...uniform, name: "ball", b: { x: 0, y: 0, z: 0 } },
      ),
      0.4,
      EXACT,
    ),
  );
}
