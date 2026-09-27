import { TestValidator } from "@nestia/e2e";

import {
  faceGingivaScallopRise,
  prepareGingivaScallopBasis,
} from "../../../scripts/face-review/prepareGingivaScallopBasis";
import { gingivaScallopFixture } from "../internal/gingivaScallopFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Scalloping the maxillary gum to each anterior crown's clinical height.
 * Scenarios:
 * 1. The rise: flat beyond the outer knots, linear between them, and held
 *    under a ceiling whose ring span meets the vertex's triangles' span.
 * 2. Norms of 0.08: the four inner crowns (headroom past the norm) rise to
 *    it at their zeniths while the papillae between them stay; the short
 *    outer crowns rise only to their ring headroom less one pixel; no ring
 *    opens; the fixture's upper octahedron, sealed by nothing, is gum and
 *    rides with the flat rise beyond the outermost zenith, unclipped by any
 *    ring; its mandibular crown stays.
 * 3. The documents and controls name the new revision; a basis without
 *    contact or an incisor surface, a repeated or blank revision, and a
 *    dentition showing fewer than six crowns refuse.
 */
export const test_subject_gingiva_scallop_basis = (): void => {
  const knots = [
    [0, 1],
    [1, 0],
    [2, 2],
  ] as const;
  TestValidator.predicate(
    "rise",
    faceGingivaScallopRise(knots, [], -1, [-1, -1]) === 1 &&
      faceGingivaScallopRise(knots, [], 3, [3, 3]) === 2 &&
      nclose(faceGingivaScallopRise(knots, [], 0.5, [0.5, 0.5]), 0.5, 1e-12) &&
      nclose(faceGingivaScallopRise(knots, [], 1.5, [1.5, 1.5]), 1, 1e-12) &&
      faceGingivaScallopRise(knots, [[1.6, 1.8, 0.2]], 1.5, [1.4, 1.6]) ===
        0.2 &&
      nclose(
        faceGingivaScallopRise(knots, [[1.7, 1.8, 0.2]], 1.5, [1.4, 1.6]),
        1,
        1e-12,
      ),
  );

  const { basis, offset, added, base } = gingivaScallopFixture();
  const teeth = basis.surfaces.find((one) => one.id === "teeth")!;
  const out = prepareGingivaScallopBasis(base);
  const after = out.basis.surfaces.find((one) => one.id === "teeth")!;
  const riseAt = (column: number) =>
    after.positions[3 * (added.gum + column) + 1]! -
    teeth.positions[3 * (added.gum + column) + 1]!;
  const column = (x: number) =>
    added.columns.findIndex((one) => Math.abs(one - x) < 1e-9);
  const inner = out.receipt.anterior.filter(
    (one) => Math.abs(one.centre - 2.18) < 0.1,
  );
  const outer = out.receipt.anterior.filter(
    (one) => Math.abs(one.centre - 2.18) > 0.1,
  );
  TestValidator.predicate(
    "scallop",
    out.receipt.anterior.length === 6 &&
      inner.length === 4 &&
      inner.every(
        (one) =>
          nclose(one.wishMetres, 0.03, 0.0041) &&
          one.headroomMetres > one.wishMetres &&
          nclose(one.riseMetres, one.wishMetres, 1e-12),
      ) &&
      outer.every(
        (one) =>
          one.headroomMetres < one.wishMetres &&
          nclose(one.riseMetres, one.headroomMetres - 0.004, 1e-12),
      ) &&
      nclose(riseAt(column(2.15)), inner[0]!.wishMetres, 0.0041) &&
      riseAt(column((2.15 + 2.21) / 2)) === 0 &&
      nclose(riseAt(column(2.03)), outer[0]!.riseMetres, 1e-12) &&
      // Beyond the outermost zenith, flat, and held by the ring it meets.
      nclose(riseAt(0), outer[0]!.riseMetres, 1e-12) &&
      [0, 1, 2, 3, 4, 5].every((v) =>
        nclose(
          after.positions[3 * v + 1]! - teeth.positions[3 * v + 1]!,
          outer[0]!.wishMetres,
          1e-12,
        ),
      ) &&
      after.positions
        .slice(18, 3 * offset)
        .every((value, i) => value === teeth.positions[18 + i]),
  );
  TestValidator.equals(
    "restamped",
    [out.basis.id, out.documents[0]!.basis, out.controls.basis],
    ["analytic-contact/3", "analytic-contact/3", "analytic-contact/3"],
  );
  const bare = structuredClone(basis);
  delete bare.contact;
  const elsewhere = structuredClone(basis);
  elsewhere.contact!.incisors.surface = "none";
  const hidden = structuredClone(basis);
  const strip = hidden.surfaces.find((one) => one.id === "teeth")!;
  for (let k = 0; k < added.columns.length; ++k)
    strip.positions[3 * (added.gum + k) + 1] = -0.05;
  const refuse = (change: object, message: string) =>
    throwsError(
      () => prepareGingivaScallopBasis({ ...base, ...change }),
      message,
    );
  TestValidator.predicate(
    "refusals",
    refuse({ basis: bare }, "contact basis") &&
      refuse({ basis: elsewhere }, "contact basis") &&
      refuse({ revision: basis.id }, "distinct revision") &&
      refuse({ revision: " " }, "distinct revision") &&
      refuse({ basis: hidden }, "fewer than six"),
  );
};
