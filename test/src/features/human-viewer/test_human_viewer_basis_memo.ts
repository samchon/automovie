import { TestValidator } from "@nestia/e2e";
import { gzipSync } from "node:zlib";

import { createHumanViewerBasisMemo } from "../../../scripts/human-viewer/createHumanViewerBasisMemo";
import { throwsError } from "../internal/predicates";

/**
 * Basis metadata follows immutable input versions without repeated byte reads.
 *
 * Scenarios:
 * 1. Reusing a stamp retains digest/identity and reads once.
 * 2. A new version refreshes both facts; plain subject JSON has no basis identity.
 * 3. A malformed basis refuses and does not poison a later repaired version.
 */
export const test_human_viewer_basis_memo = (): void => {
  let stamp = "one";
  let bytes = gzipSync('{"id":"basis-one","surfaces":[]}');
  let reads = 0;
  const memo = createHumanViewerBasisMemo({ stamp: () => stamp,
    read: () => { ++reads; return bytes; } });
  const first = memo("basis.gz");
  TestValidator.equals("basis identity", first.id, "basis-one");
  TestValidator.equals("same version metadata", memo("basis.gz"), first);
  TestValidator.equals("one byte read", reads, 1);
  stamp = "two";
  bytes = gzipSync('{"id":"basis-two","surfaces":[]}');
  const second = memo("basis.gz");
  TestValidator.equals("new identity", second.id, "basis-two");
  TestValidator.predicate("new bytes change digest", first.digest !== second.digest);
  bytes = Buffer.from("[]");
  TestValidator.equals("ordinary JSON has no basis id", memo("subjects.json").id, "");
  stamp = "broken";
  bytes = gzipSync("{}");
  TestValidator.predicate("malformed basis", throwsError(() => memo("basis.gz"), "identity"));
  stamp = "repaired";
  bytes = gzipSync('{"id":"basis-repaired"}');
  TestValidator.equals("repair", memo("basis.gz").id, "basis-repaired");
};
