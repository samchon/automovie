import { seatHumanFaceHairRoots } from "@automovie/human/face/anatomy/hair/seatHumanFaceHairRoots";
import { measureHumanFaceHairDomainArea } from "@automovie/human/face/anatomy/hair/measureHumanFaceHairDomainArea";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * Roots are barycentric seats that follow the face, and the population's
 * growth area is measured on the shape the face now has.
 * Scenarios:
 * 1. A root on the second of two triangles takes its weights over that
 *    triangle's current corners, and the seat keeps the very root it came from.
 * 2. Its normal is the current triangle's unit normal by the winding, so
 *    bending a corner turns it, and reversing the winding reverses it.
 * 3. The area is the share times the sum of the current triangle areas: half a
 *    unit square per triangle, scaling with the square of the head's size, and
 *    zero for no triangles or a zero share.
 */
export const test_subject_human_hair_root_seats = (): void => {
  const indices = [0, 1, 2, 0, 2, 3];
  const flat = [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0];
  const root = { triangle: 1, weights: [0.2, 0.3, 0.5] };
  const [seat] = seatHumanFaceHairRoots({
    roots: [root],
    indices,
    current: flat,
  });
  TestValidator.predicate(
    "the seat is the weighted current corners of its own triangle",
    vclose(seat.seated, { x: 0.3 * 1 + 0.5 * 0, y: 0.3 * 1 + 0.5 * 1, z: 0 }) &&
      seat.root === root,
  );
  TestValidator.predicate(
    "the normal is the unit normal by the winding",
    vclose(seat.normal, { x: 0, y: 0, z: 1 }),
  );
  const lifted = flat.slice();
  lifted[2] = 0.5;
  const moved = seatHumanFaceHairRoots({
    roots: [root],
    indices,
    current: lifted,
  })[0];
  TestValidator.predicate(
    "the seat follows a moved corner of its triangle",
    vclose(moved.seated, { x: 0.3, y: 0.8, z: 0.1 }) &&
      moved.normal.z < 1 &&
      nclose(Math.hypot(moved.normal.x, moved.normal.y, moved.normal.z), 1),
  );
  const reversed = seatHumanFaceHairRoots({
    roots: [root],
    indices: [0, 1, 2, 0, 3, 2],
    current: flat,
  })[0];
  TestValidator.predicate(
    "reversing the winding reverses the normal",
    vclose(reversed.normal, { x: 0, y: 0, z: -1 }),
  );

  const twice = flat.map((value) => value * 2);
  TestValidator.predicate(
    "the area is the share of the summed current triangle areas",
    nclose(
      measureHumanFaceHairDomainArea({
        share: 0.5,
        triangles: [0, 1],
        indices,
        current: flat,
      }),
      0.5,
    ) &&
      nclose(
        measureHumanFaceHairDomainArea({
          share: 0.5,
          triangles: [0, 1],
          indices,
          current: twice,
        }),
        2,
      ),
  );
  TestValidator.equals(
    "no triangles or no share has no area",
    [
      measureHumanFaceHairDomainArea({
        share: 1,
        triangles: [],
        indices,
        current: flat,
      }),
      measureHumanFaceHairDomainArea({
        share: 0,
        triangles: [0, 1],
        indices,
        current: flat,
      }),
    ],
    [0, 0],
  );
};
