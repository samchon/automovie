import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import crypto from "node:crypto";

/**
 * Fingerprint the complete input payload a body corrective was solved on.
 *
 * The solve and merge commands use the same UTF-8 JSON encoding after loading
 * a basis. Compression and insignificant whitespace of the input file do not
 * participate, while array order and object property order do. A revision name
 * alone cannot identify the skin: two candidate files may carry that name with
 * different weights. Every field participates because a pose or shape can
 * depend on landmarks, joints, channels and existing corrective rows as well
 * as on the surface. The input is read without mutation. A reordered but
 * otherwise equivalent payload requires a fresh solve rather than accepting
 * an unverified derivative.
 *
 * @evidence contracts/common.md#principled-implementation SHA-256 fingerprints the exact UTF-8 JSON serialization shared by both commands; every input field contributes, and the check therefore detects a changed skin even when the revision name stayed the same. Hash equality is a content identity check, not proof of geometric validity.
 * @evidence contracts/common.md#clear-and-simple-design One serialization and one standard synchronous digest operation own the identity used by solve and merge.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No revision, fixture or anatomical region is exempted from the fingerprint.
 * @evidence contracts/common.md#meaningful-documentation The comment states the two consumers, encoding, property-order limitation, complete dependency surface and non-mutation rule.
 */
export function bodyCorrectiveBasisDigest(
  basis: IAutoMovieHumanBodyBasis,
): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(basis))
    .digest("hex");
}
