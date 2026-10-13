import type { IAutoMovieHumanBodyNativeSubcutaneousSource } from "../anatomy/assembly/IAutoMovieHumanBodyNativeSubcutaneousSource";
import type { IAutoMovieHumanBodyLayerThicknessAnchor } from "../anatomy/layer/IAutoMovieHumanBodyLayerThicknessAnchor";
import type { IAutoMovieHumanBodyNativeLayerMemberQualification } from "./IAutoMovieHumanBodyNativeLayerMemberQualification";

/**
 * Native field provenance bound to its actual final boundary members.
 *
 * The source field and final query exterior are distinct inputs. Member digests identify emitted Float64 buffers; generic primitive intervals and physical-source records independently address the Float32 export. Original measured/authored anchors and clinical unavailability remain explicit.
 *
 * @evidence contracts/common.md#principled-implementation Exact basis/instance, immutable field provenance, final exterior digest, original anchors and actual boundary members describe one native subcutaneous calculation's export account.
 * @evidence contracts/common.md#clear-and-simple-design Field, final exterior and emitted member identities remain distinct while a carrying primitive receives only its actual member subset.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Measured and authored anchors remain distinguishable, and geometric field registration cannot certify clinical segmentation or turn final mesh digests into acquisition provenance.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies Float64 versus Float32 boundaries and members give original field qualification, final query identity and explicit clinical unavailability.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This qualification schema performs no field sampling, boundary generation or digest calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Provenance typing does not memoize native calculations or equate different final exteriors.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema itself acquires no field resource, boundary buffer, writer or task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyNativeSubcutaneousQualification {
  /** Exact body basis consumed by native construction. */
  basis: string;

  /** Actual Body or Person instance owning the physical boundary points. */
  instance: string;

  /** Immutable field registration, with original resource provenance. */
  source: IAutoMovieHumanBodyNativeSubcutaneousSource;

  /** Content digest of the actual final query exterior's positions and indices. */
  exteriorDigest: string;

  /** Original field measurements and authored conventions. */
  anchors: readonly IAutoMovieHumanBodyLayerThicknessAnchor[];

  /** Original population and between-site qualification of the field. */
  fieldQualification: string;

  /** Actual emitted members; a material primitive carries its own subset. */
  members: readonly IAutoMovieHumanBodyNativeLayerMemberQualification[];

  /** Geometric source registration does not establish clinical segmentation. */
  clinical: "unavailable";
}
