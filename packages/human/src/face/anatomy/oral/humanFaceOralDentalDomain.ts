import { humanPhysicalSourceDomain } from "../../../common/basis/humanPhysicalSourceDomain";
import { isHumanFaceOralSourceSha256 } from "./isHumanFaceOralSourceSha256";

/**
 * Name native dental ordinals independently of the skin source partition.
 * Finish and actual Float32 readers share this exact domain; a fingerprint
 * identifies source provenance without certifying geometry or anatomy.
 * @evidence contracts/common.md#principled-implementation Exact instance/generation ownership and a fixed-length native SHA-256 identity separate dental ordinals from skin sample IDs.
 * @evidence contracts/common.md#clear-and-simple-design One domain owner serves emitted geometry and actual native dental readback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither equal coordinates nor rendered vertex numbers provide native source correspondence.
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
