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
