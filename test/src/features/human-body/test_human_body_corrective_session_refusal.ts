import { TestValidator } from "@nestia/e2e";

import { createBodyCorrectiveSession } from "../../../scripts/body-basis/createBodyCorrectiveSession";
import { bodyCorrectiveBoxFixture } from "../internal/bodyCorrectiveBoxFixture";

const state = (bone: "spine" | "leftLowerLeg", flexion: number) => ({
  name: `${bone}.flexion@${flexion}`,
  set: "single",
  group: bone,
  shape: {},
  pose: [{ bone, flexion, abduction: null, twist: null }],
});

/**
 * The corrective solver publishes nothing for a state that is clear, refused
 * by the builder, contact the pose owes, or a body through a body.
 *
 * The basis is the foldable box (see `bodyCorrectiveBoxFixture`): its spine at
 * 170 degrees crosses the hips segment; with a full-length spine bone that bone
 * passes through the hips skin, and renamed `leftLowerLeg` the crossing is a
 * distal limb against the trunk.
 *
 * Scenarios:
 * 1. A pose short of the fold is clear: its record says so and no corrective
 *    is published; the working basis is the input.
 * 2. A pose past the joint's range is refused by the builder: the record
 *    carries the refusal and the log line names it.
 * 3. A crossing of a distal limb against the trunk is recorded as limb
 *    contact naming the pair, and nothing is pushed.
 * 4. A crossing with a bone through the skin cannot be parted: the outcome is
 *    beyond the budget, the record's log says the bone passes through the
 *    skin, no corrective is published, and no midpoint is queued for it.
 * 5. The log callback sees one line per visit.
 */
export const test_human_body_corrective_session_refusal = (): void => {
  const lines: string[] = [];
  const box = bodyCorrectiveBoxFixture();

  // 1. clear
  const clear = createBodyCorrectiveSession(box, (line) => lines.push(line));
  clear.solve(state("spine", 85));
  TestValidator.equals(
    "a clear state",
    clear.published().records.map((record) => record.outcome),
    ["clear"],
  );
  TestValidator.equals("publishes nothing", clear.published().correctives.length, 0);
  TestValidator.equals("and leaves the basis alone", clear.working(), box);

  // 2. refused
  const refused = createBodyCorrectiveSession(box, (line) => lines.push(line));
  refused.solve(state("spine", 200));
  const refusal = refused.published().records[0];
  TestValidator.predicate(
    "the builder's refusal is recorded",
    refusal.outcome.startsWith("refused: ") && refusal.crossing === null,
  );
  TestValidator.predicate(
    "and logged",
    lines.some((line) => line.includes("REFUSED")),
  );

  // 3. limb contact
  const limb = createBodyCorrectiveSession(
    bodyCorrectiveBoxFixture({ rename: true }),
    (line) => lines.push(line),
  );
  limb.solve(state("leftLowerLeg", 170));
  TestValidator.equals(
    "a distal limb against the trunk is the pose's",
    limb.published().records.map((record) => record.outcome),
    ["limb contact: hips x leftLowerLeg"],
  );
  TestValidator.equals("and pushes nothing", limb.published().correctives.length, 0);

  // 4. a bone through the skin
  const through = createBodyCorrectiveSession(box, (line) => lines.push(line));
  through.solve(state("spine", 170));
  const record = through.published().records;
  TestValidator.equals(
    "a bone through the skin cannot be parted",
    record.map((one) => one.outcome),
    ["beyond the budget"],
  );
  TestValidator.predicate(
    "and the log says why",
    record[0].crossing!.log.every((line) => line.endsWith("bone through skin")) &&
      record[0].crossing!.log.length > 0,
  );
  TestValidator.equals("no corrective is published", through.published().correctives.length, 0);

  // 5. the callback
  TestValidator.equals("one line per visit", lines.length, 4);
};
