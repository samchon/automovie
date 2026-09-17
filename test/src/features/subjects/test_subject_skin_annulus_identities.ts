import { portraitSkinAnnulus } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Skin reconnection follows resident boundary identities through the engine's
 * winding permutation. The independent oracle cancels opposed internal edges
 * and checks the surviving directed outer/hole boundary of a square annulus.
 * XYZ remains in head mm, including different nonplanar depths and unused points.
 *
 * Scenarios:
 * 1. Scrambled nonconsecutive resident IDs and unequal ring populations preserve
 *    every exact boundary edge in either common winding and touch no XYZ data.
 * 2. An unused vertex with identical XY and different Z never acquires a face.
 * 3. Reversing only one ring still refuses; input ownership survives refusal.
 */
export const test_subject_skin_annulus_identities = (): void => {
  const positions = Array.from({ length: 15 }, (_, id) => [100, 100, id / 7]);
  const outer = [11, 2, 9, 0],
    inner = [7, 3, 13];
  for (const [id, x, y] of [
    [11, -6, -6],
    [2, 6, -6],
    [9, 6, 6],
    [0, -6, 6],
    [7, -2, -2],
    [3, 2, -2],
    [13, 0, 2],
  ])
    positions[id] = [x, y, id / 7];
  positions[1] = [-6, -6, -100];
  const saved = structuredClone(positions);
  const boundary = (ring: number[]) =>
    ring.map((id, i) => `${id}/${ring[(i + 1) % ring.length]}`);
  for (const reverse of [false, true]) {
    const outerRing = reverse ? [...outer].reverse() : outer;
    const innerRing = reverse ? [...inner].reverse() : inner;
    const faces = portraitSkinAnnulus(positions, outerRing, innerRing);
    const expected = [
      ...boundary(outerRing),
      ...boundary([...innerRing].reverse()),
    ].sort((a, b) => a.localeCompare(b));
    const edges = new Set<string>();
    for (let at = 0; at < faces.length; at += 3)
      for (let corner = 0; corner < 3; ++corner) {
        const a = faces[at + corner],
          b = faces[at + ((corner + 1) % 3)];
        if (!edges.delete(`${b}/${a}`)) edges.add(`${a}/${b}`);
      }
    TestValidator.equals(
      "exact directed resident annulus boundary",
      [...edges].sort((a, b) => a.localeCompare(b)),
      expected,
    );
    TestValidator.equals(
      "all and only declared native IDs",
      [...new Set(faces)].sort((a, b) => a - b),
      [...outer, ...inner].sort((a, b) => a - b),
    );
    TestValidator.equals(
      "owned output repeats",
      portraitSkinAnnulus(positions, outerRing, innerRing),
      faces,
    );
  }
  TestValidator.predicate(
    "one reversed ring refuses",
    throwsError(
      () => portraitSkinAnnulus(positions, outer, [...inner].reverse()),
      "matching projected winding",
    ),
  );
  TestValidator.equals("all native XYZ retained", positions, saved);
};
