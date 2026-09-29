import { TestValidator } from "@nestia/e2e";

import { prepareCrownLengthBasis } from "../../../scripts/face-review/prepareCrownLengthBasis";
import { gingivaScallopFixture } from "../internal/gingivaScallopFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Maxillary anterior crowns lengthened to their anatomic lengths.
 * Scenarios:
 * 1. With norms 0.12 for the pair nearest the midline, 0.05 for the next
 *    and none for the outer pair: the inner crowns (0.06 and 0.1 long, open
 *    tops as rings) grow to 0.12 by moving their tops along their vertical
 *    axes while their incisal bottoms stay; the laterals, already longer
 *    than 0.05, and the outer pair keep every vertex; the fixture's own
 *    teeth stay; documents and controls are restamped; the input is kept.
 * 2. Refusals: an unchanged or blank revision, no contact, fewer sealed
 *    maxillary crowns than two per norm and a crown whose ring reaches its
 *    incisal half.
 */
export const test_subject_crown_length_basis = (): void => {
  const { basis, offset, base } = gingivaScallopFixture();
  const before = JSON.stringify(basis);
  const input = {
    ...base,
    revision: "analytic-contact/4",
    norms: [0.12, 0.05, null] as [number | null, number | null, number | null],
  };
  const out = prepareCrownLengthBasis(input);
  const was = basis.surfaces.find((one) => one.id === "teeth")!.positions;
  const now = out.basis.surfaces.find((one) => one.id === "teeth")!.positions;
  // Crown k's vertices: 0-3 its bottom (y 0), 4-7 its top.
  const y = (P: readonly number[], crown: number, corner: number) =>
    P[3 * (offset + 8 * crown + corner) + 1]!;
  const lengthened = [0, 1].every(
    (crown) =>
      [0, 1, 2, 3].every((k) => y(now, crown, k) === 0) &&
      [4, 5, 6, 7].every((k) => nclose(y(now, crown, k), 0.12, 1e-12)),
  );
  const kept = [2, 3, 4, 5].every((crown) =>
    Array.from({ length: 8 }, (_v, k) => k).every(
      (k) => y(now, crown, k) === y(was, crown, k),
    ),
  );
  TestValidator.predicate(
    "lengths",
    lengthened &&
      kept &&
      now.slice(0, 3 * offset).every((value, i) => value === was[i]) &&
      out.receipt.crowns.filter((one) => one.normMetres === 0.12).length ===
        2 &&
      out.receipt.crowns.every(
        (one) =>
          one.normMetres !== 0.12 || nclose(one.afterMetres, 0.12, 1e-12),
      ) &&
      out.basis.id === "analytic-contact/4" &&
      out.documents[0]!.basis === "analytic-contact/4" &&
      out.controls.basis === "analytic-contact/4" &&
      JSON.stringify(basis) === before,
  );
  const bare = structuredClone(basis);
  delete bare.contact;
  const few = structuredClone(basis);
  few.contact!.colliders[0]!.closure.splice(-12 * 2 - 6);
  const deep = structuredClone(basis);
  // The innermost crown's ring takes a bottom corner too.
  deep.contact!.colliders[0]!.closure.push(offset, offset + 4, offset + 7);
  const refuse = (change: object, message: string) =>
    throwsError(
      () => prepareCrownLengthBasis({ ...input, ...change }),
      message,
    );
  TestValidator.predicate(
    "refusals",
    refuse({ revision: basis.id }, "distinct revision") &&
      refuse({ revision: " " }, "distinct revision") &&
      refuse({ basis: bare }, "contact basis") &&
      refuse({ basis: few }, "a maxillary crown for every norm") &&
      refuse({ basis: deep }, "incisal half"),
  );
};
