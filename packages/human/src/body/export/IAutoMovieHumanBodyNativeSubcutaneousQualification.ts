import type { IAutoMovieHumanBodyNativeSubcutaneousSource } from "../anatomy/assembly/IAutoMovieHumanBodyNativeSubcutaneousSource";
import type { IAutoMovieHumanBodyLayerThicknessAnchor } from "../anatomy/layer/IAutoMovieHumanBodyLayerThicknessAnchor";
import type { IAutoMovieHumanBodyNativeLayerMemberQualification } from "./IAutoMovieHumanBodyNativeLayerMemberQualification";

/**
 * Native field provenance bound to its actual final boundary members.
 *
 * The source field and final query exterior are distinct inputs. Member
 * digests identify the emitted Float64 buffers; generic primitive intervals
 * and physical-source records independently address their Float32 export.
 * Original measured/authored anchors and clinical unavailability survive.
 *
 * @evidence contracts/common.md#principled-implementation Registered field provenance and actual final exterior/member identities accompany independently bound Float32 intervals.
 * @evidence contracts/common.md#clear-and-simple-design Native calculation qualification remains separate from static atlas-mesh qualification in the existing assembly report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native field resources are not relabeled acquired meshes, and original offset refusals imply no clinical acceptance.
 * @evidence contracts/common.md#meaningful-documentation States input/output identity, primitive subsets and the original field's scientific limits.
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
