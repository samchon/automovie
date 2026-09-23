import { TestValidator } from "@nestia/e2e";

import { prepareDentalPosition } from "../../../scripts/face-review/prepareDentalPosition";
import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The dentition is placed at a requested resting incisal display.
 * Scenarios:
 * 1. On the analytic contact basis, asking for 0.01 more display than the
 *    fixture has shifts the teeth and the tongue down by exactly 0.01 and
 *    nothing else: the lips and the globe keep their positions, overbite and
 *    overjet are unchanged because both arches move together, the receipt
 *    reports the before and after display, and the documents and control
 *    map name the new revision while the inputs stay untouched.
 * 2. The edges are read from the crowns, not the contact pair: naming the
 *    upper crown's side vertex as the pair still measures from its tip.
 * 3. A basis without contact, a blank or the same revision, a non-finite
 *    display, a document or a control map naming another basis, and an
 *    incisal pair on one crown refuse.
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
    revision: "analytic-contact/2",
  });
  TestValidator.predicate("shift", nclose(prepared.receipt.shiftMetres, -0.01));
  const moved = (id: string) => {
    const before = basis.surfaces.find((one) => one.id === id)!.positions;
    const after = prepared.basis.surfaces.find(
      (one) => one.id === id,
    )!.positions;
    return after.map((value, k) => value - before[k]!);
  };
  TestValidator.predicate(
    "teeth and tongue move down together",
    ["teeth", "tongue"].every((id) =>
      moved(id).every((d, k) => nclose(d, k % 3 === 1 ? -0.01 : 0, 1e-12)),
    ),
  );
  TestValidator.predicate(
    "lips and globe stay",
    ["mouth", "globe"].every((id) => moved(id).every((d) => d === 0)),
  );
  TestValidator.predicate(
    "display reaches the request",
    nclose(prepared.receipt.after.displayMetres, display + 0.01, 1e-12) &&
      nclose(prepared.receipt.before.displayMetres, display, 1e-12),
  );
  TestValidator.predicate(
    "occlusion kept",
    nclose(
      prepared.receipt.after.overbiteMetres,
      prepared.receipt.before.overbiteMetres,
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
  TestValidator.equals("moved surfaces", prepared.receipt.moved, [
    "teeth",
    "tongue",
  ]);
  TestValidator.equals("input untouched", JSON.stringify(basis), snapshot);

  const side = structuredClone(basis);
  side.contact!.incisors.upper = 0;
  const fromSide = prepareDentalPosition({
    basis: side,
    documents: [{ ...document, basis: side.id }],
    controls,
    displayMetres: display,
    revision: "analytic-contact/3",
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
    "non-finite display",
    throwsError(
      () => prepareDentalPosition({ ...base, displayMetres: NaN }),
      "finite",
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
