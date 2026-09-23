import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

import { prepareNumericalHairBasis } from "../../../scripts/face-review/prepareNumericalHairBasis";
import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Shared hair metadata cannot attach to a stale neutral, topology or revision.
 * Scenarios:
 * 1. An analytic closed surface admits its pinned domain without changing callers.
 * 2. Revision, surface and each independent buffer mismatch refuse.
 * 3. Existing metadata and malformed contact closure refuse before publication.
 */
export const test_subject_numerical_hair_preparation = (): void => {
  const { basis } = numericalHairBasisFixture();
  const surface = basis.surfaces[0];
  const points = Buffer.alloc(surface.positions.length * 8);
  surface.positions.forEach((value, at) => points.writeDoubleLE(value, at * 8));
  const topology = Buffer.alloc(surface.indices.length * 4);
  surface.indices.forEach((value, at) => topology.writeUInt32LE(value, at * 4));
  const metadata = {
    basis: basis.id,
    surface: surface.id,
    neutralFloat64LESha256: createHash("sha256").update(points).digest("hex"),
    topologyUint32LESha256: createHash("sha256").update(topology).digest("hex"),
    hairDomains: structuredClone(surface.hairDomains!),
    hairContactClosure: [] as number[],
  };
  delete surface.hairDomains;
  const props = { basis, metadata, revision: "analytic-hair/2" };
  const before = structuredClone(props);
  const prepared = prepareNumericalHairBasis(props);
  TestValidator.equals("new shared revision", prepared.id, props.revision);
  TestValidator.equals(
    "same resident geometry",
    prepared.surfaces[0].positions,
    surface.positions,
  );
  TestValidator.equals(
    "pinned domain attached",
    prepared.surfaces[0].hairDomains,
    metadata.hairDomains,
  );
  prepared.surfaces[0].hairDomains![0].triangles.length = 0;
  TestValidator.equals("all input data remain owned", props, before);
  for (const modify of [
    (p: typeof props) => {
      p.revision = " ";
    },
    (p: typeof props) => {
      p.revision = p.basis.id;
    },
    (p: typeof props) => {
      p.metadata.basis = "different";
    },
    (p: typeof props) => {
      p.metadata.surface = "missing";
    },
    (p: typeof props) => {
      p.metadata.neutralFloat64LESha256 = "different";
    },
    (p: typeof props) => {
      p.metadata.topologyUint32LESha256 = "different";
    },
    (p: typeof props) => {
      p.basis.surfaces[0].positions[0] += 0.001;
    },
    (p: typeof props) => {
      const rows = p.basis.surfaces[0].indices;
      p.basis.surfaces[0].indices = [...rows.slice(3), ...rows.slice(0, 3)];
    },
    (p: typeof props) => {
      p.basis.surfaces[0].hairDomains = [];
    },
    (p: typeof props) => {
      p.basis.surfaces[0].hairContactClosure = [];
    },
    (p: typeof props) => {
      p.metadata.hairContactClosure = [0];
    },
  ]) {
    const candidate = structuredClone(props);
    modify(candidate);
    const untouched = structuredClone(candidate);
    TestValidator.predicate(
      "inconsistent shared source refuses",
      throwsError(() => prepareNumericalHairBasis(candidate)),
    );
    TestValidator.equals("refusal preserves candidate", candidate, untouched);
  }
};
