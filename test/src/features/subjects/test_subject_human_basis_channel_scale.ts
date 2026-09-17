import { measureHumanFaceBasisChannels } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A channel's metric scale is the whole basis's displacement, not one surface's.
 *
 * The analytic basis holds seven vertices across two surfaces. `wide` moves two
 * of them 0.5 m along X, so its mean square over all seven is 0.5/7 and its peak
 * is 0.5; `narrow` halves that distance, giving a quarter of the mean square.
 * `raised` is the case a per-surface measurement would get wrong: it moves one
 * square vertex 1 m and one attachment vertex 0.5 m, so only summing both
 * surfaces before dividing by the shared vertex count yields 1.25/7. Expected
 * values come from that arithmetic, never from the implementation's output.
 *
 * Scenarios:
 * 1. A signed shape channel reports both endpoints, each with its own rms, peak and moved-vertex count.
 * 2. An endpoint spanning two surfaces accumulates across them and divides by every resident vertex.
 * 3. A nonnegative channel reports a null negative side rather than a zeroed record.
 * 4. Channel order and kind follow the basis, so a caller can index without a second lookup.
 * 5. A basis with no resident vertex refuses instead of publishing NaN as a measurement.
 */
export const test_subject_human_basis_channel_scale = (): void => {
  const { basis } = humanFaceBasisFixture();
  const scales = measureHumanFaceBasisChannels(basis);
  TestValidator.equals(
    "one record per channel in basis order",
    scales.map((scale) => [scale.id, scale.kind]),
    [
      ["width", "shape"],
      ["lift", "expression"],
    ],
  );
  const [width, lift] = scales;
  TestValidator.predicate(
    "positive shape endpoint rms over every vertex",
    nclose(width.positive.displacement, Math.sqrt(0.5 / 7)),
  );
  TestValidator.predicate(
    "positive shape endpoint peak",
    nclose(width.positive.peak, 0.5),
  );
  TestValidator.equals(
    "positive shape endpoint moved vertices",
    width.positive.vertices,
    2,
  );
  TestValidator.predicate(
    "negative shape endpoint rms over every vertex",
    nclose(width.negative!.displacement, Math.sqrt(0.125 / 7)),
  );
  TestValidator.predicate(
    "negative shape endpoint peak",
    nclose(width.negative!.peak, 0.25),
  );
  TestValidator.equals(
    "negative shape endpoint moved vertices",
    width.negative!.vertices,
    2,
  );
  TestValidator.predicate(
    "expression endpoint accumulates across surfaces",
    nclose(lift.positive.displacement, Math.sqrt(1.25 / 7)),
  );
  TestValidator.predicate(
    "expression endpoint peak",
    nclose(lift.positive.peak, 1),
  );
  TestValidator.equals(
    "expression endpoint moved vertices",
    lift.positive.vertices,
    2,
  );
  TestValidator.equals(
    "nonnegative channel has no negative side",
    lift.negative,
    null,
  );
  TestValidator.equals(
    "measuring does not mutate the basis",
    basis,
    humanFaceBasisFixture().basis,
  );
  const empty = humanFaceBasisFixture().basis;
  empty.surfaces = [];
  TestValidator.predicate(
    "an empty surface population refuses",
    throwsError(
      () => measureHumanFaceBasisChannels(empty),
      "resident vertices",
    ),
  );
};
