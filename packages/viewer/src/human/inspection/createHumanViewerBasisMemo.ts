import { createHash } from "node:crypto";

import { readHumanViewerBasisIdentity } from "./readHumanViewerBasisIdentity.js";

/**
 * Memoize immutable input bytes under the input provider's version stamp. Basis identity comes from the compressed opening header, while ordinary subject JSON contributes only a digest. The provider owns reading and must change its stamp whenever bytes change; unchanged stamps avoid another read.
 *
 * @evidence contracts/common.md#principled-implementation Filename plus provider version stamp identifies reusable input facts; changed versions read/hash bytes and derive a gzip basis opening identity, while ordinary JSON has only a digest.
 * @evidence contracts/common.md#clear-and-simple-design One private Map keeps the version and computed identity/digest together behind a reader used by catalogue composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identity comes from actual compressed headers rather than filenames; correctness requires the documented provider premise that different bytes have different stamps.
 * @evidence contracts/common.md#meaningful-documentation The comment explains immutable-version premises, gzip identity versus ordinary JSON and provider ownership of reads and stamps.
 * @evidence contracts/performance.md#efficient-algorithms Matching stamp lookups avoid byte reads; a changed B-byte input requires O(B) hashing plus header reading and replaces one O(1)-metadata entry without retaining the Buffer.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuse is keyed by filename and provider version stamp; a stale or colliding provider stamp is outside the required version guarantee and cannot independently prove byte equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One metadata record remains per encountered filename until this reader becomes unreachable; no filename-count cap exists, and read buffers are transient rather than cached.
 */
export function createHumanViewerBasisMemo(io: {
  stamp: (file: string) => string;
  read: (file: string) => Buffer;
}): (file: string) => { id: string; digest: string } {
  type Facts = { stamp: string; digest: string; id: string };
  const memoized: Map<string, Facts> = new Map<
    string,
    { stamp: string; digest: string; id: string }
  >();
  return (file: string): { id: string; digest: string } => {
    const stamp: string = io.stamp(file);
    let kept: Facts | undefined = memoized.get(file);
    if (kept?.stamp !== stamp) {
      const bytes: Buffer = io.read(file);
      kept = {
        stamp,
        digest: createHash("sha256").update(bytes).digest("hex"),
        id: file.endsWith(".gz") ? readHumanViewerBasisIdentity(bytes) : "",
      };
      memoized.set(file, kept);
    }
    return kept;
  };
}
