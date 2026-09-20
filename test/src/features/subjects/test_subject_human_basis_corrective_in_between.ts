import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/** The analytic basis with one corrective whose `lift` driver peaks early. */
const withInBetween = (
  peak: number | undefined,
  over: Partial<
    NonNullable<
      IAutoMovieHumanFaceBasis["correctives"]
    >[number]["inputs"][number]
  > = {},
) => {
  const { basis, document } = humanFaceBasisFixture();
  const square = basis.surfaces[0];
  // One vertex, one axis, one metre, so the activation is the vertex's Z.
  square.targets.eased = [2, 0, 0, 1];
  basis.correctives = [
    {
      id: "wideHalfLift",
      inputs: [
        { channel: "width", side: "positive" },
        { channel: "lift", side: "positive", peak, ...over },
      ],
      weight: 1,
      target: "eased",
    },
  ];
  return { basis, document };
};

/** Z of the square's far corner, less the `lift` the plain endpoint gives it. */
const activation = (
  basis: IAutoMovieHumanFaceBasis,
  document: Parameters<ReturnType<typeof createHumanFaceBasisBuilder>>[0],
  lift: number,
): number => {
  const model = createHumanFaceBasisBuilder(basis)(document);
  const part = model.parts.find((entry) => entry.id === "first")!;
  if (part.geometry.type !== "mesh") throw new Error("mesh expected");
  return part.geometry.mesh.positions[8] - lift;
};

/**
 * An in-between corrective peaks where it was solved and is gone at full.
 *
 * A product of clamped drivers is bilinear, so a corrective solved at full
 * weight lands at a quarter of itself at half weights on a pose that may cross
 * by more than a quarter as much. A driver that names a peak turns its factor
 * into a tent: `driver / peak` up to the peak, then a straight fall to zero at
 * one, so the in-between hands over to the full-weight corrective rather than
 * stacking on it. Every number is the tent by hand: at the peak the factor is
 * one, halfway up it is a half, halfway down it is a half, at one it is zero.
 *
 * Scenarios:
 * 1. At the peak the input contributes its whole factor.
 * 2. Below the peak the factor is the driver over the peak.
 * 3. Above the peak the factor falls linearly to zero at a driver of one, and is zero there.
 * 4. A peak of one is the plain clamp, identical to omitting it.
 * 5. The other driver still multiplies in, so the in-between is still a combination.
 * 6. A peak at zero, above one, or not finite refuses at compile time.
 */
export const test_subject_human_basis_corrective_in_between = (): void => {
  const half = withInBetween(0.5);
  const pose = (width: number, lift: number) => ({
    ...half.document,
    shape: { width },
    expression: { lift },
  });
  const at = (basis: IAutoMovieHumanFaceBasis, width: number, lift: number) =>
    activation(basis, pose(width, lift), lift);

  TestValidator.predicate(
    "at the peak the whole factor is present",
    nclose(at(half.basis, 1, 0.5), 1),
  );
  TestValidator.predicate(
    "below the peak the factor is the driver over the peak",
    nclose(at(half.basis, 1, 0.25), 0.5),
  );
  TestValidator.predicate(
    "above the peak the factor falls to zero at one",
    nclose(at(half.basis, 1, 0.75), 0.5) && nclose(at(half.basis, 1, 1), 0),
  );
  TestValidator.predicate(
    "the other driver still multiplies in",
    nclose(at(half.basis, 0.5, 0.5), 0.5) && nclose(at(half.basis, 0, 0.5), 0),
  );

  const unit = withInBetween(1);
  const plain = withInBetween(undefined);
  for (const lift of [0.25, 0.5, 1])
    TestValidator.predicate(
      `a peak of one is the plain clamp at ${lift}`,
      nclose(at(unit.basis, 1, lift), lift) &&
        nclose(at(plain.basis, 1, lift), lift),
    );

  for (const peak of [0, 1.5, -0.5])
    TestValidator.predicate(
      `a peak of ${peak} refuses`,
      throwsError(
        () => createHumanFaceBasisBuilder(withInBetween(peak).basis),
        "in-between",
      ),
    );
};
