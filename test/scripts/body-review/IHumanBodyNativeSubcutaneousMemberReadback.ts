import type { inspectAutoMovieMeshTopology } from "@automovie/engine";
import type { IAutoMovieHumanBodyNativeSubcutaneousSource } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyNativeSubcutaneousSource";
import type { IAutoMovieHumanBodyNativeLayerMemberQualification } from "@automovie/human/body/export/IAutoMovieHumanBodyNativeLayerMemberQualification";

/**
 * Actual native boundary member replay, independently of clinical admission.
 * A member may be open because the three members partition one full shell.
 * @author Samchon
 */
export interface IHumanBodyNativeSubcutaneousMemberReadback extends IAutoMovieHumanBodyNativeLayerMemberQualification {
  /** Actual field resource and producer registration. */
  nativeSource: IAutoMovieHumanBodyNativeSubcutaneousSource;

  /** Digest of the actual final exterior consumed by the layer owner. */
  finalExteriorDigest: string;

  /** Number of exported POSITION vertices in this member interval. */
  vertices: number;

  /** Number of exported triangle index scalars in this member interval. */
  indices: number;

  /** Zero only after exact rounded-coordinate replay has been checked. */
  maximumFloat32ReplayDifference: number;

  /** Actual member topology; this alone does not assert closedness of a group. */
  float32Topology: ReturnType<typeof inspectAutoMovieMeshTopology>;

  /** Interpretation and limits of this exported member observation. */
  meaning: string;
}
