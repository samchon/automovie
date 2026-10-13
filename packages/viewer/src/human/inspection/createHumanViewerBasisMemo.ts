import { createHash } from "node:crypto";

import { readHumanViewerBasisIdentity } from "./readHumanViewerBasisIdentity.js";

/**
 * Memoize immutable input bytes under the input provider's version stamp.
 * Basis identity comes from the compressed opening header, while ordinary
 * subject JSON contributes only a digest. The provider owns reading and must
 * change its stamp whenever bytes change; unchanged stamps avoid another read.
 */
export function createHumanViewerBasisMemo(io: {
  stamp: (file: string) => string;
  read: (file: string) => Buffer;
}) {
  const memoized = new Map<
    string,
    { stamp: string; digest: string; id: string }
  >();
  return (file: string): { id: string; digest: string } => {
    const stamp = io.stamp(file);
    let kept = memoized.get(file);
    if (kept?.stamp !== stamp) {
      const bytes = io.read(file);
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
