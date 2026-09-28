import { Vector3 } from "@automovie/engine";
import { humanFaceHairEmergence } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * A follicle is not a pin: a hair leaves the scalp at a stated angle from the
 * surface, tilted toward the field it is combed by. Scenarios:
 * 1. Behind the hairline's transition zone a hair leaves at the mid-scalp
 *    angle, and the tilt is in the plane of the normal and the field.
 * 2. On the hairline itself it leaves at the shallower hairline angle, and
 *    halfway across the zone between the two.
 * 3. Only the field's tangential part turns the hair, so a field along the
 *    normal, against it, or absent leaves the hair on its normal.
 */
export const test_subject_human_hair_emergence = (): void => {
  const open = { front: Math.PI, left: Math.PI, right: Math.PI, back: Math.PI };
  const normal = Vector3.create(0, 1, 0),
    field = Vector3.create(1, 0, 0);
  const crown = Vector3.create(0, 0.1, 0);
  const deep = humanFaceHairEmergence({
    hairline: open,
    chart: crown,
    normal,
    field,
  });
  const degrees = (emergence: ReturnType<typeof Vector3.create>) =>
    (Math.asin(Vector3.dot(emergence, normal)) * 180) / Math.PI;
  TestValidator.predicate(
    "behind the zone a hair leaves at the mid-scalp angle",
    nclose(degrees(deep), 30) &&
      nclose(Vector3.length(deep), 1) &&
      nclose(deep.z, 0) &&
      deep.x > 0,
  );
  // On the hairline itself the ramp is zero. The boundary is the polar angle
  // from the chart's own axis, so a direction on the equator sits exactly on a
  // half-pi hairline.
  const edge = {
    front: Math.PI / 2,
    left: Math.PI / 2,
    right: Math.PI / 2,
    back: Math.PI / 2,
  };
  const border = Vector3.create(0, 0, 0.1);
  TestValidator.predicate(
    "on the hairline it leaves at the hairline angle",
    nclose(
      degrees(
        humanFaceHairEmergence({
          hairline: edge,
          chart: border,
          normal,
          field,
        }),
      ),
      15,
    ),
  );
  // Half the 10 mm zone, at this chart's own 100 mm radius, is 0.05 radians.
  const half = humanFaceHairEmergence({
    hairline: edge,
    chart: Vector3.create(0, 0.1 * Math.sin(0.05), 0.1 * Math.cos(0.05)),
    normal,
    field,
  });
  TestValidator.predicate(
    "halfway across the zone it leaves between the two",
    nclose(degrees(half), 15 + 15 * 0.5 * 0.5 * (3 - 2 * 0.5)),
  );
  for (const parallel of [
    Vector3.create(0, 2, 0),
    Vector3.create(0, -2, 0),
    Vector3.create(),
  ])
    TestValidator.predicate(
      "a field with no tangential part leaves the hair on its normal",
      Vector3.length(
        Vector3.subtract(
          humanFaceHairEmergence({
            hairline: open,
            chart: crown,
            normal,
            field: parallel,
          }),
          normal,
        ),
      ) < 1e-12,
    );
};
