import { TestValidator } from "@nestia/e2e";

import { prepareArchWidthBasis } from "../../../scripts/face-review/prepareArchWidthBasis";
import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The analytic contact basis with a two-sided `breadth` channel: its corners
 * move 0.1 outward (inward) each, widening (narrowing) the unit-wide mouth
 * by a fifth, while the whole dentition scales by 0.4 across and the tongue
 * with it on the wider side only; and a `lift` channel raising one lower
 * tooth vertex and the upper lip seam.
 */
const fixture = () => {
  const { basis, document } = humanFaceContactFixture();
  const mouth = basis.surfaces.find((one) => one.id === "mouth")!;
  const teeth = basis.surfaces.find((one) => one.id === "teeth")!;
  const tongue = basis.surfaces.find((one) => one.id === "tongue")!;
  const across = (surface: typeof teeth, factor: number) =>
    [...new Array(surface.positions.length / 3).keys()]
      .filter((v) => surface.positions[3 * v] !== 0)
      .flatMap((v) => [v, factor * surface.positions[3 * v]!, 0, 0]);
  mouth.targets.broader = [
    1, 0.1, 0, 0, 2, -0.1, 0, 0, 4, 0.1, 0, 0, 5, -0.1, 0, 0,
  ];
  mouth.targets.slimmer = [
    1, -0.1, 0, 0, 2, 0.1, 0, 0, 4, -0.1, 0, 0, 5, 0.1, 0, 0,
  ];
  teeth.targets.broader = across(teeth, 0.4);
  teeth.targets.slimmer = across(teeth, -0.4);
  tongue.targets.broader = across(tongue, 0.4);
  teeth.targets.lifted = [6, 0, 0.1, 0];
  mouth.targets.lifted = [0, 0, 0.05, 0];
  basis.channels.push(
    {
      id: "breadth",
      kind: "shape",
      minimum: -1,
      maximum: 1,
      positive: "broader",
      negative: "slimmer",
    },
    {
      id: "lift",
      kind: "shape",
      minimum: 0,
      maximum: 1,
      positive: "lifted",
      negative: null,
    },
  );
  return { basis, document };
};

/**
 * The dentition widens with the mouth by the arch's regression on it.
 * Scenarios:
 * 1. At an elasticity of a quarter, a mouth widened by a fifth widens the
 *    arch by 5 percent, not 40: the dentition's and the tongue's rows are
 *    scaled by 0.125, and the narrower side likewise narrows the arch by 5
 *    percent, its tongue having no rows to scale.
 * 2. At an elasticity of zero the rows scale to nothing and go; the arch
 *    keeps its width.
 * 3. Documents build and name the revision; the input is untouched.
 * 4. A repeated revision, a negative elasticity, a missing surface, region
 *    or shape channel, and a channel that does not move the dentition's
 *    width (`lift`) refuse.
 */
export const test_subject_arch_width_basis_preparation = (): void => {
  const { basis, document } = fixture();
  const snapshot = JSON.stringify(basis);
  const input = {
    basis,
    documents: [document],
    controls: { basis: basis.id, groups: [] },
    revision: "analytic-contact/2",
    channel: "breadth",
    skin: "mouth",
    lips: "mouth/all",
    dentition: "teeth",
    tongue: "tongue",
    elasticity: 0.25,
  };
  const prepared = prepareArchWidthBasis(input);
  const [wider, narrower] = prepared.receipt.endpoints;
  const targets = (id: string) =>
    prepared.basis.surfaces.find((one) => one.id === id)!.targets;
  // Every row of the revision is the source's row times `factor`.
  const scaled = (id: string, name: string, factor: number) => {
    const before = basis.surfaces.find((one) => one.id === id)!.targets[name]!;
    const after = targets(id)[name]!;
    return (
      after.length === before.length &&
      after.every((v, i) =>
        nclose(v, i % 4 === 0 ? before[i]! : factor * before[i]!, 1e-12),
      )
    );
  };
  TestValidator.predicate(
    "arch by regression",
    nclose(wider!.scale, 0.125, 1e-12) &&
      nclose(narrower!.scale, 0.125, 1e-12) &&
      nclose(wider!.after / wider!.arch[0], 1.05, 1e-12) &&
      nclose(narrower!.after / narrower!.arch[0], 0.95, 1e-12) &&
      nclose(wider!.mouth[1] / wider!.mouth[0], 1.2, 1e-12) &&
      scaled("teeth", "broader", 0.125) &&
      scaled("tongue", "broader", 0.125) &&
      targets("tongue").slimmer === undefined,
  );
  const still = prepareArchWidthBasis({ ...input, elasticity: 0 });
  TestValidator.predicate(
    "rows scaled to nothing go",
    ["teeth", "tongue"].every(
      (id) =>
        still.basis.surfaces.find((one) => one.id === id)!.targets.broader ===
        undefined,
    ) &&
      nclose(
        still.receipt.endpoints[0]!.after,
        still.receipt.endpoints[0]!.arch[0],
        1e-12,
      ),
  );
  TestValidator.predicate(
    "restamped, input kept",
    prepared.basis.id === "analytic-contact/2" &&
      prepared.documents[0]!.basis === "analytic-contact/2" &&
      prepared.controls.basis === "analytic-contact/2" &&
      JSON.stringify(basis) === snapshot,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareArchWidthBasis({ ...input, revision: basis.id }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareArchWidthBasis({ ...input, elasticity: -0.1 }),
        "elasticity",
      ) &&
      throwsError(
        () => prepareArchWidthBasis({ ...input, tongue: "none" }),
        "No surface none",
      ) &&
      throwsError(
        () => prepareArchWidthBasis({ ...input, lips: "mouth/none" }),
        "No region",
      ) &&
      throwsError(
        () => prepareArchWidthBasis({ ...input, channel: "open" }),
        "No shape channel",
      ) &&
      throwsError(
        () => prepareArchWidthBasis({ ...input, channel: "lift" }),
        "does not move the dentition",
      ),
  );
};
