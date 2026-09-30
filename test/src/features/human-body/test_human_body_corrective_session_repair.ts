import {
  createHumanBodyBasisBuilder,
  createHumanBodySegmenter,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createBodyCorrectiveSession } from "../../../scripts/body-basis/createBodyCorrectiveSession";
import { readBodyContacts } from "../../../scripts/body-basis/readBodyContacts";
import { bodyCorrectiveBoxFixture } from "../internal/bodyCorrectiveBoxFixture";

const fold = (name: string, shape: Record<string, number> = {}) => ({
  name,
  set: shape.width === undefined ? "single" : "shapes",
  group: "spine",
  shape,
  pose: [
    { bone: "spine" as const, flexion: 170, abduction: null, twist: null },
  ],
});

/**
 * The corrective solver repairs a state that crosses: it measures the onset,
 * pushes the crossing apart, verifies the candidate through the builder and
 * queues the ramp midpoint that still crosses.
 *
 * The basis is the foldable box with millimetre bones (see
 * `bodyCorrectiveBoxFixture`), whose spine at 170 degrees crosses the hips
 * segment and whose tissue gives, since no bone passes through the skin.
 *
 * Scenarios:
 * 1. A pose-only state is repaired: its first visit is repaired with the
 *    ramp midpoint queued, the midpoint's own visit is repaired, and the
 *    state visited again is clear. Its corrective is a joint ramp from a
 *    measured onset below 170 up to 170 (a state clear at the onset and
 *    crossing above it), the queued one ends at the midpoint, the working
 *    basis carries both with their rows, the input basis is not mutated, and
 *    the working basis poses the state without a crossing.
 */
export const test_human_body_corrective_session_repair = (): void => {
  const basis = bodyCorrectiveBoxFixture({ short: true });
  const before = JSON.stringify(basis);

  // 1. a pose-only state
  const session = createBodyCorrectiveSession(basis);
  session.solve(fold("spine.flexion@170"));
  const { correctives, rows, records } = session.published();
  TestValidator.equals(
    "the visits of the ramp",
    records.map((record) => record.outcome),
    [
      "repaired; the midpoint of the joint ramp still crosses and is queued",
      "repaired",
      "clear",
    ],
  );
  TestValidator.equals(
    "the correctives",
    correctives.map((corrective) => corrective.id),
    ["pose/spine.flexion@170", "pose/spine.flexion@170@0.9609375"],
  );
  const first = correctives[0].inputs[0] as { onset: number; full: number };
  TestValidator.predicate(
    "the ramp runs from a measured onset to the full angle",
    first.onset > 100 && first.onset < 170 && first.full === 170,
  );
  const second = correctives[1].inputs[0] as { onset: number; full: number };
  TestValidator.predicate(
    "the queued midpoint ends where it was queued",
    second.onset === first.onset && second.full > first.onset && second.full < 170,
  );
  TestValidator.predicate(
    "the rows are the working basis's targets",
    correctives.every(
      (corrective) =>
        rows[corrective.id] === session.working().surfaces[0].targets[corrective.id],
    ),
  );
  TestValidator.equals("the input basis is not mutated", JSON.stringify(basis), before);
  const posed = createHumanBodyBasisBuilder(session.working())({
    id: "check",
    name: "check",
    basis: basis.id,
    shape: {},
    pose: [{ bone: "spine", flexion: 170, abduction: null, twist: null }],
  });
  TestValidator.equals(
    "the working basis poses the state without a crossing",
    readBodyContacts(createHumanBodySegmenter(basis)(posed)).length,
    0,
  );
  TestValidator.predicate(
    "a record keeps the pairs, the verification and the log",
    records[0].crossing!.pairs.length === 1 &&
      records[0].crossing!.verification.length === 2 &&
      records[0].crossing!.log.length > 0 &&
      records[0].crossing!.vertices > 0,
  );
};
