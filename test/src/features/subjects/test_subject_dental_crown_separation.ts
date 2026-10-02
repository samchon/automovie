import { measureAutoMovieMeshClearance } from "@automovie/engine";
import {
  buildPortraitDentalCrown,
  separatePortraitDentalCrowns,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Ordered enamel crowns never share volume after separation.
 *
 * Scenarios:
 * 1. Two 4 mm crowns whose centres are 2 mm apart overlap; separation makes
 *    their proximal surfaces touch at most, moves them by equal and opposite X
 *    shifts (the row stays centred), and leaves Y, Z and normals untouched.
 * 2. Two crowns already 10 mm apart are the negative twin: no crown moves.
 * 3. A 0.5 mm contact gap is honoured, and a single crown is returned as it is.
 */
export const test_subject_dental_crown_separation = (): void => {
  const profile = {
    width: 4,
    height: 6,
    depth: 1.5,
    cervicalWidth: 0.8,
    edgeRise: 0.2,
  };
  const at = (x: number) => {
    const mesh = buildPortraitDentalCrown(profile, 1);
    return {
      ...mesh,
      positions: mesh.positions.map((v, i) => (i % 3 === 0 ? v + x : v)),
    };
  };
  const gap = (a: ReturnType<typeof at>, b: ReturnType<typeof at>) =>
    Math.min(
      ...measureAutoMovieMeshClearance(
        { ...b, positions: b.positions.map((v) => v / 1000) },
        { ...a, positions: a.positions.map((v) => v / 1000) },
        "x",
      ).map((face) => face.minimum * 1000),
    );
  const overlapping = [at(0), at(2)];
  TestValidator.predicate(
    "nominal placement overlaps",
    gap(overlapping[0], overlapping[1]) < -1,
  );
  const [first, second] = separatePortraitDentalCrowns(overlapping, 0);
  TestValidator.predicate("touching at most", gap(first, second) >= -1e-9);
  const shifts = [first, second].map(
    (crown, i) => crown.positions[0] - overlapping[i].positions[0],
  );
  TestValidator.predicate(
    "balanced shifts",
    nclose(shifts[0], -shifts[1]) && shifts[1] > 0,
  );
  const kept = (crown: typeof first) => [
    crown.positions.filter((_v, k) => k % 3 !== 0),
    crown.normals,
  ];
  TestValidator.equals(
    "transverse axes and normals retained",
    [first, second].map(kept),
    overlapping.map(kept),
  );
  const apart = [at(0), at(10)];
  TestValidator.equals(
    "separated input stays put",
    separatePortraitDentalCrowns(apart, 0).map((crown) => crown.positions),
    apart.map((crown) => crown.positions),
  );
  const [near, far] = separatePortraitDentalCrowns(overlapping, 0.5);
  TestValidator.predicate("contact gap honoured", gap(near, far) >= 0.5 - 1e-9);
  TestValidator.equals(
    "single crown untouched",
    separatePortraitDentalCrowns([at(3)], 0)[0].positions,
    at(3).positions,
  );
};
