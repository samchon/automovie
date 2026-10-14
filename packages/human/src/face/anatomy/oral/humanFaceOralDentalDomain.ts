import { humanPhysicalSourceDomain } from "../../../common/basis/humanPhysicalSourceDomain";
import { isHumanFaceOralSourceSha256 } from "./isHumanFaceOralSourceSha256";

/**
 * Name native dental ordinals independently of the skin source partition. Finish and actual Float32 readers share this exact domain; a fingerprint identifies source provenance without certifying geometry or anatomy.
 *
 * @evidence contracts/common.md#principled-implementation An injective instance/generation tuple and exact lowercase native dental digest name the ordinal domain independently of skin.
 * @evidence contracts/common.md#clear-and-simple-design Finish and actual Float32 acquisition share one dental-domain formatter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest syntax alone proves neither source bytes nor geometry/anatomy; malformed digest refuses without normalizing identity strings.
 * @evidence contracts/common.md#meaningful-documentation Original native dental ordinals remain tied to this precise source-instance domain.
 * @evidence contracts/performance.md#efficient-algorithms Work scales with instance/generation string length and constant-size digest validation.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared physical-domain and digest owners avoid duplicated identity escaping/admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned domain string escapes and no geometry/registration map is retained.
 *
 * @author Samchon
 */
export function humanFaceOralDentalDomain(
  instance: string,
  generation: string,
  dentalNativeSha256: string,
): string {
  if (!isHumanFaceOralSourceSha256(dentalNativeSha256))
    throw new Error(
      "Native oral domain needs an exact dental SHA-256 identity.",
    );
  return (
    humanPhysicalSourceDomain(instance, generation) +
    ":oral-native:" +
    dentalNativeSha256
  );
}
