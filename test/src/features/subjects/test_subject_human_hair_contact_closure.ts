import {
  closeHumanFaceHairContact,
  humanFaceHairClosureLoops,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/** A regular octagon ring in the plane y = 0, vertex k at angle k * 45 degrees. */
const ring = (): number[] =>
  Array.from({ length: 8 }, (_, k) => [
    Math.cos((k * Math.PI) / 4),
    0,
    Math.sin((k * Math.PI) / 4),
  ]).flat();
/** The authored closure: a fan from ring vertex 0 over the flat octagon. */
const CLOSURE = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 6, 0, 6, 7];

/** The y component of a triangle's normal (its side of the ring plane). */
const side = (
  positions: readonly number[],
  a: number,
  b: number,
  c: number,
) => {
  const u = [0, 2].map((k) => positions[3 * b + k]! - positions[3 * a + k]!);
  const w = [0, 2].map((k) => positions[3 * c + k]! - positions[3 * a + k]!);
  return u[1]! * w[0]! - u[0]! * w[1]!;
};
/** Triangles on the other side than the flat authored closure's first. */
const flipped = (positions: readonly number[], indices: readonly number[]) => {
  const reference = Math.sign(side(ring(), 0, 1, 2));
  let count = 0;
  for (let t = 0; t < indices.length; t += 3)
    if (
      Math.sign(
        side(positions, indices[t]!, indices[t + 1]!, indices[t + 2]!),
      ) !== reference
    )
      ++count;
  return count;
};

/**
 * The shared hair contact closure.
 * Scenarios:
 * 1. The closure's rim is one loop of eight directed edges, wound as the
 *    closure winds them; a branching rim and one that does not close refuse.
 * 2. Closing the flat ring appends its centre and fans eight triangles over
 *    it, all on the closure's side.
 * 3. Pulling ring vertex 1 in to (0, 0, 0.4) folds the authored triangle
 *    (0, 1, 2) over to the other side, while every triangle of the fan from
 *    the ring's current centre keeps its side.
 * 4. Pulling ring vertex 4 past the centre, to (0.6, 0, 0.05), leaves no
 *    embedded fan, and closing refuses.
 */
export const test_subject_human_hair_contact_closure = (): void => {
  const loops = humanFaceHairClosureLoops(CLOSURE);
  TestValidator.equals("one loop", loops, [
    Array.from({ length: 8 }, (_, k): [number, number] => [k, (k + 1) % 8]),
  ]);
  TestValidator.predicate(
    "rim refusals",
    throwsError(
      () => humanFaceHairClosureLoops([0, 1, 2, 0, 1, 3]),
      "branches",
    ) &&
      throwsError(
        () => humanFaceHairClosureLoops([2, 1, 0, 2, 3, 1, 3, 2, 1]),
        "does not close",
      ),
  );
  const flat = closeHumanFaceHairContact(ring(), [], loops);
  TestValidator.predicate(
    "flat fan",
    flat.positions.length === 27 &&
      flat.positions.slice(-3).every((v) => nclose(v, 0, 1e-12)) &&
      flat.indices.length === 24 &&
      flipped(flat.positions, flat.indices) === 0 &&
      flipped(ring(), CLOSURE) === 0,
  );
  const bent = ring();
  bent.splice(3, 3, 0, 0, 0.4);
  const refan = closeHumanFaceHairContact(bent, [], loops);
  TestValidator.predicate(
    "authored triangulation folds, the fan does not",
    flipped(bent, CLOSURE) === 1 &&
      flipped(refan.positions, refan.indices) === 0,
  );
  const past = ring();
  past.splice(12, 3, 0.6, 0, 0.05);
  TestValidator.predicate(
    "not star-shaped",
    throwsError(
      () => closeHumanFaceHairContact(past, [], loops),
      "not star-shaped",
    ),
  );
};
