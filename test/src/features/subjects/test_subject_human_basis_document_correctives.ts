import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

type Own = NonNullable<IAutoMovieHumanFaceBasisDocument["correctives"]>[number];

/** The analytic basis, and a document carrying one corrective of its own. */
const withOwn = (over: Partial<Own> = {}) => {
  const { basis, document } = humanFaceBasisFixture();
  const own: Own = {
    id: "ownWideLift",
    inputs: [
      { channel: "width", side: "positive" },
      { channel: "lift", side: "positive" },
    ],
    weight: 1,
    // One vertex, one axis, one metre on the first surface: the activation
    // reads straight off that vertex, so every expected number is by hand.
    targets: { [basis.surfaces[0].id]: [2, 0, 0, 1] },
    ...over,
  };
  return { basis, document: { ...document, correctives: [own] } };
};

/** Z of the square's far corner, less the `lift` the plain endpoint gives it. */
const activation = (
  basis: IAutoMovieHumanFaceBasis,
  document: IAutoMovieHumanFaceBasisDocument,
  lift: number,
): number => {
  const model = createHumanFaceBasisBuilder(basis)(document);
  const part = model.parts.find((entry) => entry.id === "first")!;
  if (part.geometry.type !== "mesh") throw new Error("mesh expected");
  return part.geometry.mesh.positions[8] - lift;
};

/**
 * A document carries correctives of its own, evaluated by the basis's rule.
 *
 * A basis corrective is a field on the shared neutral; this face's teeth are
 * not the neutral's, so the residual it needs is its own and lives in its
 * document, applied after the basis's correctives with the same product
 * activation and the same in-between tents. The rows are the identity's
 * shape, and they are admitted the identity's way: a surface the basis does
 * not declare, a vertex outside it, a malformed row and an unordered vertex
 * all refuse. Its identity may not shadow a channel or a basis corrective,
 * because a name that resolves twice is a corrective that fires twice.
 *
 * Scenarios:
 * 1. The document corrective fires on the combination and on nothing less; both at half is a quarter.
 * 2. It stacks on a basis corrective over the same drivers rather than replacing it.
 * 3. A driver with a peak is an in-between: whole at the peak, gone at full.
 * 4. A surface the document names but the corrective has no rows for is left alone.
 * 5. A document without correctives is exactly what it was.
 * 6. An identity taken by a channel, a basis corrective or another document corrective, an empty or duplicate driver set, a gain outside (0,1], a driver no channel carries, a peak outside (0,1], and malformed rows each refuse.
 */
export const test_subject_human_basis_document_correctives = (): void => {
  const { basis, document } = withOwn();
  const pose = (
    width: number,
    lift: number,
  ): IAutoMovieHumanFaceBasisDocument => ({
    ...document,
    shape: { width },
    expression: { lift },
  });

  TestValidator.predicate(
    "one driver alone contributes nothing",
    nclose(activation(basis, pose(1, 0), 0), 0) &&
      nclose(activation(basis, pose(0, 1), 1), 0),
  );
  TestValidator.predicate(
    "both drivers at half contribute a quarter, at full the whole",
    nclose(activation(basis, pose(0.5, 0.5), 0.5), 0.25) &&
      nclose(activation(basis, pose(1, 1), 1), 1),
  );

  // The same drivers on a basis corrective moving the same vertex by another
  // metre: the document's answer lands on top of the basis's, so the vertex
  // reads two at full weight.
  const stacked = withOwn();
  stacked.basis.surfaces[0].targets.eased = [2, 0, 0, 1];
  stacked.basis.correctives = [
    {
      id: "wideLift",
      inputs: [
        { channel: "width", side: "positive" },
        { channel: "lift", side: "positive" },
      ],
      weight: 1,
      target: "eased",
    },
  ];
  TestValidator.predicate(
    "a document corrective stacks on a basis corrective over the same drivers",
    nclose(
      activation(
        stacked.basis,
        { ...stacked.document, shape: { width: 1 }, expression: { lift: 1 } },
        1,
      ),
      2,
    ),
  );

  const between = withOwn({
    inputs: [
      { channel: "width", side: "positive" },
      { channel: "lift", side: "positive", peak: 0.5 },
    ],
  });
  TestValidator.predicate(
    "an in-between document corrective is whole at its peak and gone at full",
    nclose(
      activation(
        between.basis,
        { ...between.document, shape: { width: 1 }, expression: { lift: 0.5 } },
        0.5,
      ),
      1,
    ) &&
      nclose(
        activation(
          between.basis,
          { ...between.document, shape: { width: 1 }, expression: { lift: 1 } },
          1,
        ),
        0,
      ),
  );

  // Rows on the second surface only: the first surface's corner does not move
  // by the corrective, and the second surface's vertex 0 moves one metre in X.
  const elsewhere = withOwn({
    targets: { [basis.surfaces[1].id]: [0, 1, 0, 0] },
  });
  const built = createHumanFaceBasisBuilder(elsewhere.basis)({
    ...elsewhere.document,
    shape: { width: 1 },
    expression: { lift: 1 },
  });
  const other = built.parts.find((entry) => entry.id === "attached")!;
  if (other.geometry.type !== "mesh") throw new Error("mesh expected");
  const plainOther = createHumanFaceBasisBuilder(basis)(pose(1, 1)).parts.find(
    (entry) => entry.id === "attached",
  )!;
  if (plainOther.geometry.type !== "mesh") throw new Error("mesh expected");
  TestValidator.predicate(
    "a surface without rows is left alone and the surface with rows moves",
    nclose(
      activation(
        elsewhere.basis,
        { ...elsewhere.document, shape: { width: 1 }, expression: { lift: 1 } },
        1,
      ),
      0,
    ) &&
      nclose(
        other.geometry.mesh.positions[0] -
          plainOther.geometry.mesh.positions[0],
        1,
      ),
  );

  const plain = humanFaceBasisFixture();
  TestValidator.predicate(
    "a document without correctives is unchanged",
    nclose(
      activation(
        plain.basis,
        { ...plain.document, shape: { width: 1 }, expression: { lift: 1 } },
        1,
      ),
      0,
    ),
  );

  const surface = basis.surfaces[0].id;
  const broken: [string, Partial<Own>][] = [
    ["unclaimed identity", { id: "width" }],
    ["unclaimed identity", { id: " " }],
    ["unclaimed identity", { inputs: [] }],
    [
      "unclaimed identity",
      {
        inputs: [
          { channel: "width", side: "positive" },
          { channel: "width", side: "positive" },
        ],
      },
    ],
    ["unclaimed identity", { weight: 0 }],
    ["unclaimed identity", { weight: 1.5 }],
    [
      "no channel carries",
      { inputs: [{ channel: "absent", side: "positive" }] },
    ],
    ["no channel carries", { inputs: [{ channel: "lift", side: "negative" }] }],
    [
      "no channel carries",
      { inputs: [{ channel: "lift", side: "positive", peak: 0 }] },
    ],
    [
      "no channel carries",
      { inputs: [{ channel: "lift", side: "positive", peak: 2 }] },
    ],
    ["surface this basis declares", { targets: { absent: [0, 1, 0, 0] } }],
    ["surface this basis declares", { targets: { [surface]: [0, 1, 0] } }],
    [
      "surface this basis declares",
      { targets: { [surface]: [0, Number.NaN, 0, 0] } },
    ],
    [
      "strictly increasing",
      { targets: { [surface]: [1, 1, 0, 0, 1, 1, 0, 0] } },
    ],
    ["strictly increasing", { targets: { [surface]: [99, 1, 0, 0] } }],
  ];
  for (const [reason, candidate] of broken)
    TestValidator.predicate(
      "an unresolvable document corrective refuses: " +
        JSON.stringify(candidate),
      throwsError(() => {
        const { basis: b, document: d } = withOwn(candidate);
        createHumanFaceBasisBuilder(b)(d);
      }, reason),
    );
  TestValidator.predicate(
    "two document correctives sharing an identity refuse",
    throwsError(() => {
      const { basis: b, document: d } = withOwn();
      createHumanFaceBasisBuilder(b)({
        ...d,
        correctives: [...d.correctives!, { ...d.correctives![0] }],
      });
    }, "unclaimed identity"),
  );
  TestValidator.predicate(
    "an identity taken by a basis corrective refuses",
    throwsError(() => {
      const { basis: b, document: d } = withOwn({ id: "wideLift" });
      b.surfaces[0].targets.eased = [2, 0, 0, 1];
      b.correctives = stacked.basis.correctives;
      createHumanFaceBasisBuilder(b)(d);
    }, "unclaimed identity"),
  );
};
