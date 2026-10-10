import { humanPhysicalSourceDomain } from "../../../common/basis/humanPhysicalSourceDomain";
import { isHumanFaceOralSourceSha256 } from "./isHumanFaceOralSourceSha256";

/**
 * Name native dental ordinals independently of the skin source partition.
 * Finish and actual Float32 readers share this exact domain; a fingerprint
 * identifies source provenance without certifying geometry or anatomy.
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
