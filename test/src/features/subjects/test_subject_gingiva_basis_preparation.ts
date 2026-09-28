import { TestValidator } from "@nestia/e2e";

import {
  faceClinicalCrowns,
  faceFrontRaster,
  faceFrontVisible,
  meshComponents,
  prepareGingivaBasis,
} from "../../../scripts/face-review/prepareGingivaBasis";
import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Six box crowns 0.05 wide, 0.1 tall and 0.05 deep at x = 2.03, 2.09, 2.15,
 * 2.21, 2.27 and 2.33 (their top faces open: the root rings), and a gum slab
 * at z = 1.05 in front of them from y = 0.05 up, so each crown shows its
 * lower 0.05 from the front.
 */
const dentition = (offset: number) => {
  const positions: number[] = [];
  const indices: number[] = [];
  const closure: number[] = [];
  const centres = [2.03, 2.09, 2.15, 2.21, 2.27, 2.33];
  for (const c of centres) {
    const base = offset + positions.length / 3;
    // 0-3 bottom (y 0), 4-7 top (y 0.1); x-, x+ by z-, z+.
    for (const y of [0, 0.1])
      for (const [x, z] of [
        [c - 0.025, 0.95],
        [c + 0.025, 0.95],
        [c + 0.025, 1],
        [c - 0.025, 1],
      ] as const)
        positions.push(x, y, z);
    const quad = (a: number, b: number, d: number, e: number) =>
      indices.push(base + a, base + b, base + d, base + a, base + d, base + e);
    quad(0, 1, 2, 3);
    quad(3, 2, 6, 7);
    quad(1, 0, 4, 5);
    quad(2, 1, 5, 6);
    quad(0, 3, 7, 4);
    closure.push(base + 4, base + 7, base + 6, base + 4, base + 6, base + 5);
  }
  const gum = offset + positions.length / 3;
  positions.push(
    1.9,
    0.05,
    1.05,
    2.5,
    0.05,
    1.05,
    2.5,
    0.3,
    1.05,
    1.9,
    0.3,
    1.05,
  );
  indices.push(gum, gum + 1, gum + 2, gum, gum + 2, gum + 3);
  return { positions, indices, closure, gum };
};

/**
 * Raising the maxillary gum to clinical crown norms.
 * Scenarios:
 * 1. Components, the front raster and its visibility: the slab hides what
 *    lies behind it, a crown's own front face shows, and a point off the
 *    raster does not.
 * 2. Each box crown shows 0.05 with gum above it.
 * 3. Norms of 0.08 raise the gum 0.03 (the norm bound) and the crowns then
 *    show 0.08; the fixture's own upper crown, sealed by nothing, rides with
 *    the gum, and the mandibular crown stays.
 * 4. Norms of 0.2 would lift the gum past the root rings at 0.1: the rise
 *    stops where the rings would show (the ring bound), short of them by at
 *    most two of the raster's pixels, and the crowns then show nearly their
 *    whole 0.1.
 * 5. The documents and controls name the new revision; a basis without
 *    contact, a repeated revision, a dentition without six maxillary crowns
 *    and one whose gum hides them from the front refuse.
 */
export const test_subject_gingiva_basis_preparation = (): void => {
  const { basis, document } = humanFaceContactFixture();
  const teeth = basis.surfaces.find((one) => one.id === "teeth")!;
  const offset = teeth.positions.length / 3;
  const added = dentition(offset);
  teeth.positions.push(...added.positions);
  teeth.indices.push(...added.indices);
  teeth.regions[0]!.indices.push(...added.indices);
  basis.contact!.colliders![0]!.closure.push(...added.closure);

  const component = meshComponents(teeth.positions.length / 3, teeth.indices);
  const crowns = [0, 1, 2, 3, 4, 5].map((k) => component[offset + 8 * k]!);
  const gum = new Set([component[added.gum]!]);
  const raster = faceFrontRaster({
    positions: teeth.positions,
    indices: teeth.indices,
    component,
    resolution: 0.004,
  });
  TestValidator.predicate(
    "components and visibility",
    new Set(crowns).size === 6 &&
      component[offset] !== component[added.gum] &&
      faceFrontVisible(raster, [2.03, 0.01, 1], crowns[0]!, 0.004) &&
      !faceFrontVisible(raster, [2.03, 0.09, 1], crowns[0]!, 0.004) &&
      !faceFrontVisible(raster, [9, 0.01, 1], crowns[0]!, 0.004),
  );
  const seen = faceClinicalCrowns({
    positions: teeth.positions,
    indices: teeth.indices,
    component,
    crowns,
    gum,
    resolution: 0.004,
  });
  TestValidator.predicate(
    "clinical crowns",
    crowns.every((crown) => {
      const one = seen.get(crown)!;
      return nclose(one.visible, 0.052, 0.0041) && one.above === "gum";
    }),
  );

  const base = {
    basis,
    documents: [document],
    controls: { basis: basis.id, groups: [] },
    revision: "analytic-contact/2",
    norms: [0.08, 0.08, 0.08] as [number, number, number],
    resolution: 0.004,
  };
  const raised = prepareGingivaBasis(base);
  const shiftOf = (vertex: number) =>
    raised.basis.surfaces.find((one) => one.id === "teeth")!.positions[
      3 * vertex + 1
    ]! - teeth.positions[3 * vertex + 1]!;
  TestValidator.predicate(
    "norm bound",
    raised.receipt.bound === "norm" &&
      nclose(raised.receipt.shiftMetres, raised.receipt.normShiftMetres, 0) &&
      nclose(raised.receipt.shiftMetres, 0.028, 0.0041) &&
      raised.receipt.anterior.every((one) =>
        nclose(one.afterMetres, 0.08, 0.0041),
      ) &&
      nclose(shiftOf(added.gum), raised.receipt.shiftMetres, 1e-12) &&
      nclose(shiftOf(3), raised.receipt.shiftMetres, 1e-12) &&
      shiftOf(9) === 0 &&
      shiftOf(offset) === 0,
  );
  TestValidator.equals(
    "restamped",
    [raised.basis.id, raised.documents[0]!.basis, raised.controls.basis],
    ["analytic-contact/2", "analytic-contact/2", "analytic-contact/2"],
  );
  const bounded = prepareGingivaBasis({
    ...base,
    norms: [0.2, 0.2, 0.2],
  });
  TestValidator.predicate(
    "ring bound",
    bounded.receipt.bound === "ring" &&
      bounded.receipt.shiftMetres < bounded.receipt.normShiftMetres &&
      bounded.receipt.shiftMetres <= 0.05 &&
      nclose(bounded.receipt.shiftMetres, 0.05, 0.0081) &&
      bounded.receipt.anterior.every((one) =>
        nclose(one.afterMetres, 0.1, 0.0081),
      ),
  );
  const bare = structuredClone(basis);
  delete bare.contact;
  const lone = structuredClone(basis);
  lone.contact!.colliders![0]!.closure.splice(
    humanFaceContactFixture().basis.contact!.colliders![0]!.closure.length,
  );
  // The gum slab lowered below the incisal edges hides every crown.
  const hidden = structuredClone(basis);
  const slab = hidden.surfaces.find((one) => one.id === "teeth")!;
  for (const vertex of [added.gum, added.gum + 1])
    slab.positions[3 * vertex + 1] = -0.05;
  const refuse = (change: object, message: string) =>
    throwsError(() => prepareGingivaBasis({ ...base, ...change }), message);
  TestValidator.predicate(
    "refusals",
    refuse({ basis: bare }, "contact basis") &&
      refuse({ revision: basis.id }, "distinct revision") &&
      refuse({ basis: lone }, "anterior crowns") &&
      refuse({ basis: hidden }, "fewer than six"),
  );
};
