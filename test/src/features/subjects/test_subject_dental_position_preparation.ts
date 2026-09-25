import { TestValidator } from "@nestia/e2e";

import { prepareDentalPosition } from "../../../scripts/face-review/prepareDentalPosition";
import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The maxillary dentition is placed at a requested resting incisal display,
 * limited by a maximum overbite.
 * Scenarios:
 * 1. On the analytic contact basis, asking for 0.01 more display with no
 *    binding overbite limit shifts the upper crown (vertices 0 to 5, not
 *    bound to the jaw) down by exactly 0.01 and nothing else: the lower
 *    crown, the tongue, the lips and the globe keep their positions, the
 *    overbite deepens by 0.01 and the overjet is unchanged, the receipt names
 *    the display as the bound, and the documents and control map name the
 *    new revision while the inputs stay untouched.
 * 2. An overbite limit 0.004 beyond the current overbite stops the shift at
 *    0.004 and names the overbite as the bound.
 * 3. The edges are read from the crowns, not the contact pair: naming the
 *    upper crown's side vertex as the pair still measures from its tip.
 * 4. A basis without contact, a blank or the same revision, a non-finite
 *    display or overbite limit, an upper edge bound to the jaw, a lower edge
 *    not bound to it (a dentition without jaw attachment), a document
 *    or a control map naming another basis, and an incisal pair on one
 *    crown refuse.
 */
export const test_subject_dental_position_preparation = (): void => {
  const { basis, document } = humanFaceContactFixture();
  const controls = { basis: basis.id, groups: [] };
  const y = (surface: string, vertex: number) =>
    basis.surfaces.find((one) => one.id === surface)!.positions[
      3 * vertex + 1
    ]!;
  const display = y("mouth", 0) - y("teeth", 3);
  const snapshot = JSON.stringify(basis);
  const prepared = prepareDentalPosition({
    basis,
    documents: [document],
    controls,
    displayMetres: display + 0.01,
    maxOverbiteMetres: 1,
    revision: "analytic-contact/2",
  });
  TestValidator.predicate("shift", nclose(prepared.receipt.shiftMetres, -0.01));
  TestValidator.equals("display bound", prepared.receipt.bound, "display");
  TestValidator.equals("moved vertices", prepared.receipt.movedVertices, 6);
  const moved = (id: string) => {
    const before = basis.surfaces.find((one) => one.id === id)!.positions;
    const after = prepared.basis.surfaces.find(
      (one) => one.id === id,
    )!.positions;
    return after.map((value, k) => value - before[k]!);
  };
  TestValidator.predicate(
    "upper crown moves down",
    moved("teeth").every((d, k) =>
      nclose(d, k < 18 && k % 3 === 1 ? -0.01 : 0, 1e-12),
    ),
  );
  TestValidator.predicate(
    "lower crown, tongue, lips and globe stay",
    ["tongue", "mouth", "globe"].every((id) =>
      moved(id).every((d) => d === 0),
    ) &&
      moved("teeth")
        .slice(18)
        .every((d) => d === 0),
  );
  TestValidator.predicate(
    "display reaches the request",
    nclose(prepared.receipt.after.displayMetres, display + 0.01, 1e-12) &&
      nclose(prepared.receipt.before.displayMetres, display, 1e-12),
  );
  TestValidator.predicate(
    "overbite deepens, overjet kept",
    nclose(
      prepared.receipt.after.overbiteMetres,
      prepared.receipt.before.overbiteMetres + 0.01,
      1e-12,
    ) &&
      nclose(
        prepared.receipt.after.overjetMetres,
        prepared.receipt.before.overjetMetres,
        1e-12,
      ),
  );
  TestValidator.equals("revision", prepared.basis.id, "analytic-contact/2");
  TestValidator.equals(
    "documents restamped",
    prepared.documents.map((one) => one.basis),
    ["analytic-contact/2"],
  );
  TestValidator.equals(
    "controls restamped",
    prepared.controls.basis,
    "analytic-contact/2",
  );
  TestValidator.equals("input untouched", JSON.stringify(basis), snapshot);

  const limited = prepareDentalPosition({
    basis,
    documents: [document],
    controls,
    displayMetres: display + 0.01,
    maxOverbiteMetres: prepared.receipt.before.overbiteMetres + 0.004,
    revision: "analytic-contact/3",
  });
  TestValidator.predicate(
    "overbite limit",
    nclose(limited.receipt.shiftMetres, -0.004, 1e-12) &&
      limited.receipt.bound === "overbite",
  );

  const side = structuredClone(basis);
  side.contact!.incisors.upper = 0;
  const fromSide = prepareDentalPosition({
    basis: side,
    documents: [{ ...document, basis: side.id }],
    controls,
    displayMetres: display,
    maxOverbiteMetres: 1,
    revision: "analytic-contact/4",
  });
  TestValidator.equals(
    "edges from crowns",
    [fromSide.receipt.before.upperEdge, fromSide.receipt.before.lowerEdge],
    [3, 8],
  );
  TestValidator.predicate("no shift", nclose(fromSide.receipt.shiftMetres, 0));

  const base = {
    basis,
    documents: [document],
    controls,
    displayMetres: display,
    maxOverbiteMetres: 1,
    revision: "r2",
  };
  TestValidator.predicate(
    "no contact",
    throwsError(
      () =>
        prepareDentalPosition({
          ...base,
          basis: { ...basis, contact: undefined },
        }),
      "contact basis",
    ),
  );
  TestValidator.predicate(
    "same revision",
    throwsError(
      () => prepareDentalPosition({ ...base, revision: basis.id }),
      "distinct revision",
    ),
  );
  TestValidator.predicate(
    "blank revision",
    throwsError(
      () => prepareDentalPosition({ ...base, revision: " " }),
      "distinct revision",
    ),
  );
  TestValidator.predicate(
    "non-finite display",
    throwsError(
      () => prepareDentalPosition({ ...base, displayMetres: NaN }),
      "finite",
    ),
  );
  TestValidator.predicate(
    "non-finite overbite limit",
    throwsError(
      () => prepareDentalPosition({ ...base, maxOverbiteMetres: Infinity }),
      "finite",
    ),
  );
  const skullless = structuredClone(basis);
  skullless.surfaces
    .find((one) => one.id === "teeth")!
    .attachments![0]!.rows.push(3, 1);
  TestValidator.predicate(
    "upper edge on the jaw",
    throwsError(
      () => prepareDentalPosition({ ...base, basis: skullless }),
      "ride the skull",
    ),
  );
  const jawless = structuredClone(basis);
  delete jawless.surfaces.find((one) => one.id === "teeth")!.attachments;
  TestValidator.predicate(
    "lower edge off the jaw",
    throwsError(
      () => prepareDentalPosition({ ...base, basis: jawless }),
      "ride the skull",
    ),
  );
  const oneCrown = structuredClone(basis);
  oneCrown.contact!.incisors.lower = 0;
  TestValidator.predicate(
    "one crown",
    throwsError(
      () => prepareDentalPosition({ ...base, basis: oneCrown }),
      "separate crowns",
    ),
  );
  TestValidator.predicate(
    "document on another basis",
    throwsError(
      () =>
        prepareDentalPosition({
          ...base,
          documents: [{ ...document, basis: "other" }],
        }),
      "names another basis",
    ),
  );
  TestValidator.predicate(
    "control map on another basis",
    throwsError(
      () =>
        prepareDentalPosition({
          ...base,
          controls: { basis: "other", groups: [] },
        }),
      "control map",
    ),
  );
};
