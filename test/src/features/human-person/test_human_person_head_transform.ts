import { createHumanPersonHeadTransform } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { qclose, vclose } from "../internal/predicates";

/**
 * The head transform is `R (p + shift) + t`, hand-derived on a few frames.
 *
 * `R` is the posed rotation composed with the inverse of the rest rotation, the
 * shift is the rest joint minus the neutral joint, and `t` is the posed joint
 * minus `R` applied to the rest joint. A quarter turn about +Y sends +Z to +X.
 *
 * Scenarios:
 * 1. Rest and posed frames alike (identity rotation), the joint at rest at
 *    (0,1,0) though the neutral is at the origin: a point is only shifted by
 *    (0,1,0), and a direction is untouched.
 * 2. The joint stays at (0,1,0) and turns a quarter about +Y: the point (0,0,1)
 *    is at (0,0,1) relative to the joint after the shift, turns to (1,0,0)
 *    about it, and so lands at (1,1,0); the normal +Z becomes +X.
 * 3. The joint moves to (0.5,1,0) with no turn: a point lands 0.5 in +X of its
 *    shifted place.
 * 4. A rest rotation that already equals the posed one is no turn at all,
 *    whatever the rotation is: the point moves by the joint's translation only.
 */
export const test_human_person_head_transform = (): void => {
  const identity = { x: 0, y: 0, z: 0, w: 1 };
  const quarter = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
  const origin = { x: 0, y: 0, z: 0 };
  const joint = { x: 0, y: 1, z: 0 };

  const rest = createHumanPersonHeadTransform({
    neutral: origin,
    rest: { position: joint, rotation: identity },
    posed: { position: joint, rotation: identity },
  });
  TestValidator.predicate(
    "a shaped rest only shifts",
    vclose(rest.point({ x: 0.3, y: 0.2, z: 0.1 }), { x: 0.3, y: 1.2, z: 0.1 }) &&
      vclose(rest.direction({ x: 0, y: 0, z: 1 }), { x: 0, y: 0, z: 1 }) &&
      vclose(rest.shift, joint),
  );

  const turned = createHumanPersonHeadTransform({
    neutral: origin,
    rest: { position: joint, rotation: identity },
    posed: { position: joint, rotation: quarter },
  });
  TestValidator.predicate(
    "a quarter turn about the joint carries the point round it",
    vclose(turned.point({ x: 0, y: 0, z: 1 }), { x: 1, y: 1, z: 0 }) &&
      vclose(turned.direction({ x: 0, y: 0, z: 1 }), { x: 1, y: 0, z: 0 }) &&
      qclose(turned.rotation, quarter),
  );

  const moved = createHumanPersonHeadTransform({
    neutral: origin,
    rest: { position: joint, rotation: identity },
    posed: { position: { x: 0.5, y: 1, z: 0 }, rotation: identity },
  });
  TestValidator.predicate(
    "a moved joint translates the point",
    vclose(moved.point(origin), { x: 0.5, y: 1, z: 0 }),
  );

  const same = createHumanPersonHeadTransform({
    neutral: origin,
    rest: { position: joint, rotation: quarter },
    posed: { position: { x: 0, y: 2, z: 0 }, rotation: quarter },
  });
  TestValidator.predicate(
    "equal rest and posed rotations are no turn",
    vclose(same.point({ x: 0, y: 0, z: 1 }), { x: 0, y: 2, z: 1 }) &&
      vclose(same.direction({ x: 0, y: 0, z: 1 }), { x: 0, y: 0, z: 1 }),
  );
};
