import { TestValidator } from "@nestia/e2e";

import { createBodyCorrectiveSession } from "../../../scripts/body-basis/createBodyCorrectiveSession";
import { bodyCorrectiveBoxFixture } from "../internal/bodyCorrectiveBoxFixture";

/**
 * The corrective solver's ramp of a shaped state: a channel ramp beside the
 * joint ramp.
 *
 * The basis is the foldable box with millimetre bones (see
 * `bodyCorrectiveBoxFixture`) and the state is its `width` channel at its end
 * with the spine folded to 170 degrees.
 *
 * Scenarios:
 * 1. The corrective's drivers are a one-sided channel ramp from zero to the
 *    shape's weight, whose onset is measured as the largest fraction of the
 *    shape at which the pose is clean (zero here, since the fold crosses on
 *    every width), and the joint ramp; the id carries the state's set.
 * 2. The state starts repaired and ends with a visit that finds it clear.
 */
export const test_human_body_corrective_session_shaped = (): void => {
  const session = createBodyCorrectiveSession(
    bodyCorrectiveBoxFixture({ short: true }),
  );
  session.solve({
    name: "wide:spine.flexion@170",
    set: "shapes",
    group: "spine",
    shape: { width: 1 },
    pose: [{ bone: "spine", flexion: 170, abduction: null, twist: null }],
  });
  const { correctives, records } = session.published();

  // 1. drivers
  TestValidator.equals("a channel ramp beside the joint ramp", correctives[0].inputs[0], {
    channel: "width",
    side: "positive",
    onset: 0,
    full: 1,
  });
  TestValidator.equals("and the joint ramp", (correctives[0].inputs[1] as { bone: string }).bone, "spine");
  TestValidator.equals("the id carries the set", correctives[0].id, "state/shapes:wide:spine.flexion@170");

  // 2. outcomes
  const outcomes = records.map((record) => record.outcome);
  TestValidator.predicate(
    "the shaped state starts repaired and ends clear",
    outcomes[0].startsWith("repaired") && outcomes[outcomes.length - 1] === "clear",
  );
};
