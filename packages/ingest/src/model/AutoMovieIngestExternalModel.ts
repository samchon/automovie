import type {
  AutoMovieExternalModelIngestProfile,
  AutoMovieGltfMotionInterpretationProfile,
  IAutoMovieExternalModelInspection,
  IAutoMovieExternalMotionAdoptionReceipt,
} from "@automovie/interface";

import { AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE as fixedMotionInterpretationProfile } from "./internal/AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE";
import { AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES as supportedProfiles } from "./internal/AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES";
import { adoptExternalMotion } from "./internal/adoptExternalMotion";
import { inspectExternalModelBytes as inspectModelBytes } from "./internal/inspectExternalModelBytes";
import { isExternalModelIngestProfile as isSupportedProfile } from "./internal/isExternalModelIngestProfile";

/** Admits external glTF, GLB and VRM bytes and validates authored motion use. */
export namespace AutoMovieIngestExternalModel {
  /** Frozen list of the four supported external-model profile literals. */
  export const profiles: readonly AutoMovieExternalModelIngestProfile[] =
    supportedProfiles;

  /** Spatial interpretation for glTF motion: metres, right-handed and Y-up. */
  export const motionInterpretationProfile: AutoMovieGltfMotionInterpretationProfile =
    fixedMotionInterpretationProfile;

  /**
   * Checks whether a value exactly matches a supported profile literal.
   *
   * @param value Candidate profile value.
   * @returns Whether it exactly matches a supported profile.
   */
  export function isProfile(
    value: unknown,
  ): value is AutoMovieExternalModelIngestProfile {
    return isSupportedProfile(value);
  }

  /**
   * Checks resident model bytes against a caller-selected ingest profile.
   *
   * The case-insensitive path suffix selects glTF JSON, GLB or VRM. Supply a
   * resolver when external buffers or images are referenced. This validates the
   * structure and byte ranges consumed by the selected profile. A host still
   * owns full material, texture and image decoding.
   *
   * @param props Inspection options and resident bytes.
   * @returns Detached structural, resource and applicable motion facts.
   * @throws On the first unsupported container, profile or malformed field.
   */
  export function inspectBytes(
    props: IAutoMovieExternalModelInspection.IProps,
  ): IAutoMovieExternalModelInspection {
    return inspectModelBytes(props);
  }

  /**
   * Validates an authored motion handoff and returns a detached receipt.
   *
   * Use an unmodified `gltf-motion-v1` inspection and the identity of those
   * same bytes. The caller binds the SHA-256 digest to the bytes. Adoption
   * checks its spelling, path and byte length. Supply the source rig and
   * explicit mapping for each animated node. Mapped parents and rests must
   * match the inspected hierarchy by exact comparison.
   *
   * Native use omits target identity and translation scale. Retarget use
   * supplies a non-blank target and finite positive dimensionless scale.
   *
   * @param props Inspection, source identity, and adoption decision.
   * @returns An owned copy of the source identity, take and admitted handoff.
   * @throws On inconsistent provenance, an invalid map or rest, an unsupported
   *   track, or options outside the selected mode.
   */
  export function adoptMotion(
    props: IAutoMovieExternalMotionAdoptionReceipt.IProps,
  ): IAutoMovieExternalMotionAdoptionReceipt {
    return adoptExternalMotion(props);
  }
}
