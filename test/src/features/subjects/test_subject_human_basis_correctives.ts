import {
  createHumanFaceBasisBuilder,
  type IAutoMovieHumanFaceBasis,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/** The analytic basis with one corrective added over its two channels. */
const withCorrective = (
  over: Partial<NonNullable<IAutoMovieHumanFaceBasis["correctives"]>[number]> = {},
) => {
  const { basis, document } = humanFaceBasisFixture();
  const square = basis.surfaces[0];
  // One vertex, one axis, one metre: the activation reads straight off the
  // vertex it moves, so every expected number below is the formula by hand.
  square.targets.eased = [2, 0, 0, 1];
  basis.correctives = [
    {
      id: "wideLift",
      inputs: [
        { channel: "width", side: "positive" },
        { channel: "lift", side: "positive" },
      ],
      weight: 1,
      target: "eased",
      ...over,
    },
  ];
  return { basis, document };
};

/** Z of the square's far corner, the only vertex any of this moves. */
const corner = (
  basis: IAutoMovieHumanFaceBasis,
  document: Parameters<ReturnType<typeof createHumanFaceBasisBuilder>>[0],
): number => {
  const model = createHumanFaceBasisBuilder(basis)(document);
  const part = model.parts.find((entry) => entry.id === "first")!;
  if (part.geometry.type !== "mesh") throw new Error("mesh expected");
  // The region's third corner is the surface's vertex 2.
  return part.geometry.mesh.positions[8];
};

/**
 * A corrective fires on the combination and on nothing less than it.
 *
 * Linear endpoints added together are wrong wherever two of them move the same
 * tissue, and the whole point of a corrective is to be absent from each driver
 * alone and present in their coincidence. So the activation is a product, and a
 * product is exactly what the expected values here check: the `eased` endpoint
 * moves one vertex one metre along Z, so that vertex's Z is the activation.
 *
 * Every number is the formula by hand. One driver at full and the other at zero
 * gives zero; both at half gives a quarter; both at full gives one; a gain of
 * 0.5 halves all of it; and a product that would exceed one is capped, because
 * a corrective that overshot its own authored endpoint would be inventing
 * geometry rather than correcting it.
 *
 * Scenarios:
 * 1. One driver alone contributes nothing, at any strength.
 * 2. Both drivers at half contribute a quarter; at full, the whole endpoint.
 * 3. The authored gain scales the activation and the cap holds it at one.
 * 4. A negative-side driver reads the negative weight, and the positive side of the same channel then contributes nothing.
 * 5. A basis with no correctives evaluates exactly as it did before.
 * 6. Correctives whose drivers, sides, gain, identity or endpoint do not resolve refuse at compile time.
 */
export const test_subject_human_basis_correctives = (): void => {
  const { basis, document } = withCorrective();
  const pose = (width: number, lift: number) => ({
    ...document,
    shape: { width },
    expression: { lift },
  });

  // `raised` already moves this vertex by `lift`, so the corrective's own
  // contribution is whatever exceeds that.
  const plain = humanFaceBasisFixture();
  for (const [width, lift] of [
    [1, 0],
    [0, 1],
    [1, 1],
    [0.5, 0.5],
  ] as const)
    TestValidator.predicate(
      `the basis without correctives is unchanged at ${width}/${lift}`,
      nclose(corner(plain.basis, pose(width, lift)), lift),
    );

  TestValidator.predicate(
    "one driver alone contributes nothing",
    nclose(corner(basis, pose(1, 0)), 0) &&
      nclose(corner(basis, pose(0, 1)), 1),
  );
  TestValidator.predicate(
    "both drivers at half contribute a quarter",
    nclose(corner(basis, pose(0.5, 0.5)), 0.5 + 0.25),
  );
  TestValidator.predicate(
    "both drivers at full contribute the whole endpoint",
    nclose(corner(basis, pose(1, 1)), 1 + 1),
  );

  const halved = withCorrective({ weight: 0.5 });
  TestValidator.predicate(
    "the authored gain scales the activation",
    nclose(corner(halved.basis, pose(1, 1)), 1 + 0.5) &&
      nclose(corner(halved.basis, pose(0.5, 0.5)), 0.5 + 0.125),
  );

  // Width reaches 1 and lift reaches 1, so no product can exceed the gain; the
  // cap is reached by driving the gain itself to its maximum and both drivers
  // to theirs, where the uncapped value would be exactly one anyway. A basis
  // whose channels exceed one is the case that matters, so the envelope is
  // widened to make the product overshoot.
  const wide = withCorrective();
  wide.basis.channels[0].maximum = 2;
  TestValidator.predicate(
    "an activation that would exceed the endpoint is capped at it",
    nclose(
      corner(wide.basis, { ...document, shape: { width: 2 }, expression: { lift: 1 } }),
      1 + 1,
    ),
  );

  const negative = withCorrective({
    inputs: [
      { channel: "width", side: "negative" },
      { channel: "lift", side: "positive" },
    ],
  });
  TestValidator.predicate(
    "a negative-side driver reads the negative weight",
    nclose(corner(negative.basis, pose(-1, 1)), 1 + 1),
  );
  TestValidator.predicate(
    "and the positive side of that channel then drives nothing",
    nclose(corner(negative.basis, pose(1, 1)), 1),
  );

  const broken: [
    string,
    Partial<NonNullable<IAutoMovieHumanFaceBasis["correctives"]>[number]>,
  ][] = [
    [
      "drives off a side no channel carries",
      { inputs: [{ channel: "absent", side: "positive" }] },
    ],
    [
      "drives off a side no channel carries",
      { inputs: [{ channel: "lift", side: "negative" }] },
    ],
    ["distinct drivers", { inputs: [] }],
    [
      "distinct drivers",
      {
        inputs: [
          { channel: "width", side: "positive" },
          { channel: "width", side: "positive" },
        ],
      },
    ],
    ["distinct drivers", { weight: 0 }],
    ["distinct drivers", { weight: 1.5 }],
    ["distinct drivers", { target: " " }],
    ["nonempty and unique", { id: "width" }],
  ];
  for (const [reason, candidate] of broken)
    TestValidator.predicate(
      "an unresolvable corrective refuses: " + JSON.stringify(candidate),
      throwsError(
        () => createHumanFaceBasisBuilder(withCorrective(candidate).basis),
        reason,
      ),
    );
  TestValidator.predicate(
    "a corrective naming an endpoint no surface carries refuses",
    throwsError(
      () => createHumanFaceBasisBuilder(withCorrective({ target: "absent" }).basis),
      "endpoint",
    ),
  );
};
