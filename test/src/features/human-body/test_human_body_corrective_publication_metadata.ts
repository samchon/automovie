import { TestValidator } from "@nestia/e2e";

import { assertBodyCorrectiveBasis } from "../../../scripts/body-basis/assertBodyCorrectiveBasis";
import { bodyCorrectiveBasisDigest } from "../../../scripts/body-basis/bodyCorrectiveBasisDigest";
import { createBodyCorrectiveMergeReceipt } from "../../../scripts/body-basis/createBodyCorrectiveMergeReceipt";
import { createBodyCorrectiveShardMetadata } from "../../../scripts/body-basis/createBodyCorrectiveShardMetadata";
import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The real solve/merge metadata owners retain the captured complete input
 * identity and distinguish it from exact output bytes. Standard SHA-256 vectors
 * supply independent expectations; no filesystem or command is involved.
 *
 * Scenarios:
 * 1. A shard carries the loaded revision and digest and is admitted by the
 *    actual merge guard; neither construction changes its caller's input.
 * 2. A normalized changed skin, another revision and an absent digest are
 *    refused through that emitted metadata and the actual guard.
 * 3. A receipt preserves input identity, step order and the independent hashes
 *    and byte counts of an offset `abc` view and an empty output.
 * 4. Both empty byte populations and an empty step list remain distinct from
 *    absent input provenance, and the returned step array is independently owned.
 */
export const test_human_body_corrective_publication_metadata = (): void => {
  const { basis } = humanBodyBasisFixture();
  const before = JSON.stringify(basis);
  const input = { id: basis.id, sha256: bodyCorrectiveBasisDigest(basis) };
  const inputBefore = JSON.stringify(input);
  const metadata = createBodyCorrectiveShardMetadata(input);
  TestValidator.equals("a shard records the captured revision", metadata.basis, input.id);
  TestValidator.equals("a shard records the complete input fingerprint", metadata.basisSha256, input.sha256);
  assertBodyCorrectiveBasis(input, metadata, "metadata-shard");
  const changed = structuredClone(basis);
  changed.surfaces[0].skin.weights[0] = 0.9;
  changed.surfaces[0].skin.weights[1] = 0.1;
  changed.surfaces[0].skin.boneIndices[1] = 1;
  TestValidator.predicate(
    "the changed skin keeps a normalized vertex binding",
    nclose(changed.surfaces[0].skin.weights.slice(0, 4).reduce((sum, weight) => sum + weight, 0), 1, 1e-12),
  );
  const changedMetadata = createBodyCorrectiveShardMetadata({
    id: changed.id,
    sha256: bodyCorrectiveBasisDigest(changed),
  });
  TestValidator.predicate(
    "the negative twin keeps its revision and changes its complete payload",
    changedMetadata.basis === metadata.basis && changedMetadata.basisSha256 !== metadata.basisSha256,
  );
  TestValidator.predicate(
    "emitted same-name changed-skin metadata is refused",
    throwsError(() => assertBodyCorrectiveBasis(input, changedMetadata, "metadata-shard"), "input basis payload differs"),
  );
  TestValidator.predicate(
    "emitted other-revision metadata is refused",
    throwsError(() => assertBodyCorrectiveBasis(input, createBodyCorrectiveShardMetadata({ ...input, id: input.id + "/other" }), "metadata-shard"), "not on " + input.id),
  );
  TestValidator.predicate(
    "an absent emitted digest remains unverifiable",
    throwsError(() => assertBodyCorrectiveBasis(input, { basis: metadata.basis }, "metadata-shard"), "no input basis digest"),
  );
  const abc = new Uint8Array([0, 97, 98, 99, 0]).subarray(1, 4);
  const empty = new Uint8Array();
  const steps = [{ shard: "one" }, { shard: "two" }];
  const receipt = createBodyCorrectiveMergeReceipt({ revision: "next", input, steps, document: abc, compressed: empty });
  const abcSha = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
  const emptySha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  TestValidator.equals("a receipt identifies both revisions", [receipt.basis, receipt.supersedes], ["next", input.id]);
  TestValidator.equals("a receipt pins the complete source payload separately from output bytes", receipt.inputSha256, input.sha256);
  TestValidator.equals("the receipt preserves step order", receipt.steps, steps);
  TestValidator.equals("only the uncompressed view bytes participate", [receipt.uncompressedSha256, receipt.uncompressedBytes], [abcSha, 3]);
  TestValidator.equals("an empty compressed population is hashed", [receipt.compressedSha256, receipt.compressedBytes], [emptySha, 0]);
  receipt.steps.pop();
  TestValidator.equals("the receipt owns its step array", steps.length, 2);
  const boundary = createBodyCorrectiveMergeReceipt({ revision: "next", input, steps: [], document: empty, compressed: abc });
  TestValidator.equals("an empty document and no steps are representable", [boundary.uncompressedSha256, boundary.uncompressedBytes, boundary.steps.length], [emptySha, 0, 0]);
  TestValidator.equals("the compressed view is independently counted", [boundary.compressedSha256, boundary.compressedBytes], [abcSha, 3]);
  TestValidator.equals("the basis remains caller-owned", JSON.stringify(basis), before);
  TestValidator.equals("output bytes remain caller-owned", [...abc], [97, 98, 99]);
  TestValidator.equals("captured identity remains caller-owned", JSON.stringify(input), inputBefore);
};
