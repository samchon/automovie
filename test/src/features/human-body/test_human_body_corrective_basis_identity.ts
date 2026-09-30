import { TestValidator } from "@nestia/e2e";

import { assertBodyCorrectiveBasis } from "../../../scripts/body-basis/assertBodyCorrectiveBasis";
import { bodyCorrectiveBasisDigest } from "../../../scripts/body-basis/bodyCorrectiveBasisDigest";
import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Corrective publication requires the complete solved-on payload as well as
 * its revision name. A small analytic box supplies real typed skin weights;
 * redistributing one vertex's weights without renaming the basis must
 * invalidate its shard.
 *
 * Scenarios:
 * 1. The same input and its untouched clone have one deterministic digest,
 *    and the matching shard is admitted without mutating either input.
 * 2. A missing digest is refused even when the revision matches.
 * 3. A different revision is refused even when its digest matches.
 * 4. A same-revision basis with a changed, still normalized skin binding is
 *    refused.
 * 5. A changed landmark or existing target also changes the digest, because
 *    a corrective depends on the whole input rather than skin weights alone.
 * 6. An empty digest cannot supply payload provenance.
 */
export const test_human_body_corrective_basis_identity = (): void => {
  const { basis } = humanBodyBasisFixture();
  const before = JSON.stringify(basis);
  const digest = bodyCorrectiveBasisDigest(basis);
  const input = { id: basis.id, sha256: digest };
  const shard = { basis: basis.id, basisSha256: digest };
  TestValidator.equals(
    "an untouched clone has the same digest",
    bodyCorrectiveBasisDigest(structuredClone(basis)),
    digest,
  );
  assertBodyCorrectiveBasis(input, shard, "analytic-shard");
  TestValidator.equals("the basis remains caller-owned", JSON.stringify(basis), before);
  TestValidator.equals("the shard remains caller-owned", shard, {
    basis: basis.id,
    basisSha256: digest,
  });
  TestValidator.predicate(
    "an unpinned historical shard cannot be published",
    throwsError(
      () => assertBodyCorrectiveBasis(input, { basis: basis.id }, "analytic-shard"),
      ["analytic-shard", "no input basis digest"],
    ),
  );
  TestValidator.predicate(
    "the revision must also match",
    throwsError(
      () => assertBodyCorrectiveBasis(input, { ...shard, basis: basis.id + "/other" }, "analytic-shard"),
      ["analytic-shard", "not on " + basis.id],
    ),
  );
  const reweighted = structuredClone(basis);
  reweighted.surfaces[0].skin.weights[0] = 0.9;
  reweighted.surfaces[0].skin.weights[1] = 0.1;
  reweighted.surfaces[0].skin.boneIndices[1] = 1;
  TestValidator.predicate(
    "the changed binding still keeps a whole vertex weight",
    nclose(
      reweighted.surfaces[0].skin.weights.slice(0, 4).reduce((sum, weight) => sum + weight, 0),
      1,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "same name with changed skin is a different input",
    throwsError(
      () => assertBodyCorrectiveBasis(
        { id: reweighted.id, sha256: bodyCorrectiveBasisDigest(reweighted) },
        shard,
        "analytic-shard",
      ),
      ["analytic-shard", "input basis payload differs"],
    ),
  );
  const landmark = structuredClone(basis);
  landmark.landmarks.positions[0] += 0.01;
  TestValidator.predicate(
    "landmark registration participates",
    bodyCorrectiveBasisDigest(landmark) !== digest,
  );
  const target = structuredClone(basis);
  target.surfaces[0].targets.wide[1] += 0.01;
  TestValidator.predicate(
    "existing corrective and shape rows participate",
    bodyCorrectiveBasisDigest(target) !== digest,
  );
  TestValidator.predicate(
    "an empty digest supplies no matching provenance",
    throwsError(
      () => assertBodyCorrectiveBasis(input, { ...shard, basisSha256: "" }, "analytic-shard"),
      "input basis payload differs",
    ),
  );
};
