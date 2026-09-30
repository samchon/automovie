import { TestValidator } from "@nestia/e2e";

import { mergeBodyCorrectives } from "../../../scripts/body-basis/mergeBodyCorrectives";
import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

const close = (found: number[], expected: number[]): boolean =>
  found.length === expected.length &&
  found.every((value, at) => nclose(value, expected[at], 1e-12));

/**
 * Publishing a solve shard onto a basis: the dropped correctives leave, the
 * solved ones arrive, sided ones with their exact mirror and midline or
 * bilateral ones with symmetrized rows, and nothing is silently replaced.
 *
 * The basis is the analytic box (see `humanBodyBasisFixture`) whose corners
 * mirror as 0-1, 2-3, 4-5 and 6-7 and whose `sideLeft` and `sideRight`
 * channels are a mirror pair. The shard drops the box's own `wideTall`
 * corrective and solves three: a sided one on `sideLeft`, a midline one on
 * the `tall` channel and a bilateral one on both side channels.
 *
 * Scenarios:
 * 1. The merged basis carries the new id and keeps every other field; the
 *    dropped corrective and its target are gone, the input is not mutated.
 * 2. The sided corrective is added and gains its mirror with the sides
 *    swapped, its rows stored at 10 micrometres on the partner vertices with x
 *    negated; the lists of added, mirrored, symmetrized and dropped ids say
 *    so.
 * 3. The midline and the bilateral correctives keep their ids and have
 *    symmetric rows: a vertex and its partner mirrored, the mean of the field
 *    and its mirror.
 * 4. A row that cancels to zero under symmetrization is dropped from the
 *    stored rows while the rows beside it stay.
 * 5. A shard that drops a corrective the basis lacks, one whose sided
 *    corrective's mirror id is already taken, and one with a row on a vertex
 *    without a mirror, are refused.
 */
export const test_human_body_merge_correctives = (): void => {
  const { basis } = humanBodyBasisFixture();
  const before = JSON.stringify(basis);
  const bilateralInputs = [
    { channel: "sideLeft", side: "positive" as const },
    { channel: "sideRight", side: "positive" as const },
  ];
  const sided = {
    id: "state/shapes:sideLeft:x",
    inputs: [{ channel: "sideLeft", side: "positive" as const }],
    weight: 1,
    target: "state/shapes:sideLeft:x",
  };
  const midline = {
    id: "state/shapes:tall:x",
    inputs: [{ channel: "tall", side: "positive" as const }],
    weight: 1,
    target: "state/shapes:tall:x",
  };
  const bilateral = {
    id: "state/combos:both:x",
    inputs: bilateralInputs,
    weight: 1,
    target: "state/combos:both:x",
  };
  const shard = {
    dropped: ["wideTall"],
    correctives: [sided, midline, bilateral],
    rows: {
      [sided.id]: [4, 0.00123456, 0.002, -0.001],
      [midline.id]: [
        4, 0.01, 0, 0, //  cancels against its partner's
        5, 0.01, 0, 0,
        6, 0, 0.01, 0,
      ],
      [bilateral.id]: [6, 0.02, 0.01, 0],
    },
  };

  // 1. merged basis
  const merged = mergeBodyCorrectives(basis, shard, "analytic-box/2");
  TestValidator.equals("the new id", merged.basis.id, "analytic-box/2");
  TestValidator.equals("nothing was mutated", JSON.stringify(basis), before);
  TestValidator.equals(
    "the dropped corrective and its target are gone",
    [
      merged.basis.correctives!.some((c) => c.id === "wideTall"),
      "wideTall" in merged.basis.surfaces[0].targets,
    ],
    [false, false],
  );
  TestValidator.equals(
    "the other targets stay",
    merged.basis.surfaces[0].targets.wide,
    basis.surfaces[0].targets.wide,
  );

  // 2. sided
  const mirrorId = "state/shapes:sideRight:x";
  TestValidator.equals("added", merged.added, [sided.id, midline.id, bilateral.id]);
  TestValidator.equals("mirrored", merged.mirrored, [mirrorId]);
  TestValidator.equals("symmetrized", merged.symmetrized, [midline.id, bilateral.id]);
  TestValidator.equals("dropped", merged.dropped, ["wideTall"]);
  const mirror = merged.basis.correctives!.find((c) => c.id === mirrorId)!;
  TestValidator.equals("the mirror's driver", mirror.inputs, [
    { channel: "sideRight", side: "positive" },
  ]);
  TestValidator.predicate(
    "the mirror's rows at ten micrometres on the partner vertex",
    close(merged.basis.surfaces[0].targets[mirrorId], [5, -0.00123, 0.002, -0.001]),
  );
  TestValidator.equals(
    "the sided corrective's own rows are the shard's",
    merged.basis.surfaces[0].targets[sided.id],
    shard.rows[sided.id],
  );

  // 3. symmetric fields
  TestValidator.predicate(
    "the bilateral field is its own mirror",
    close(merged.basis.surfaces[0].targets[bilateral.id], [
      6, 0.01, 0.005, 0, 7, -0.01, 0.005, 0,
    ]),
  );

  // 4. cancelling rows
  TestValidator.predicate(
    "the cancelled rows are gone and the rest stay",
    close(merged.basis.surfaces[0].targets[midline.id], [
      6, 0, 0.005, 0, 7, 0, 0.005, 0,
    ]),
  );

  // 5. refusals
  TestValidator.predicate(
    "dropping a corrective the basis lacks",
    throwsError(
      () => mergeBodyCorrectives(basis, { ...shard, dropped: ["nowhere"] }, "x"),
      "lacks: nowhere",
    ),
  );
  TestValidator.predicate(
    "a mirror id that is already taken",
    throwsError(
      () =>
        mergeBodyCorrectives(
          basis,
          {
            dropped: [],
            correctives: [
              sided,
              { ...sided, id: mirrorId, target: mirrorId, inputs: [{ channel: "sideRight", side: "positive" }] },
            ],
            rows: { [sided.id]: [4, 0.001, 0, 0], [mirrorId]: [5, 0.001, 0, 0] },
          },
          "x",
        ),
      "already carries the id",
    ),
  );
  TestValidator.predicate(
    "a row on a vertex without a mirror",
    throwsError(
      () =>
        mergeBodyCorrectives(
          {
            ...basis,
            surfaces: [
              {
                ...basis.surfaces[0],
                positions: basis.surfaces[0].positions.map((v, at) =>
                  at === 12 ? v + 1 : v,
                ),
              },
            ],
          },
          shard,
          "x",
        ),
      "no mirror",
    ),
  );
};
