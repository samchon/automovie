import type {
  AutoMovieExternalModelIngestProfile,
  AutoMovieGltfMotionInterpretationProfile,
  IAutoMovieExternalModelInspection,
  IAutoMovieExternalMotionAdoptionReceipt,
} from "@automovie/interface";

import { AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES as supportedProfiles } from "./internal/AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES";
import { AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE as fixedMotionInterpretationProfile } from "./internal/AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE";
import { adoptExternalMotion } from "./internal/adoptExternalMotion";
import { inspectExternalModelBytes as inspectModelBytes } from "./internal/inspectExternalModelBytes";
import { isExternalModelIngestProfile as isSupportedProfile } from "./internal/isExternalModelIngestProfile";

/** Inspects external model bytes and validates authored motion adoption. */
export namespace AutoMovieIngestExternalModel {
  /** Supported fixed external-model profile literals. */
  export const profiles: readonly AutoMovieExternalModelIngestProfile[] =
    supportedProfiles;

  /** Fixed spatial interpretation used by glTF motion inspection. */
  export const motionInterpretationProfile: AutoMovieGltfMotionInterpretationProfile =
    fixedMotionInterpretationProfile;

  /**
   * Check whether an unknown value names a supported external-model profile.
   * @param value Candidate profile value.
   * @returns Whether it exactly matches a supported profile.
   */
  export function isProfile(
    value: unknown,
  ): value is AutoMovieExternalModelIngestProfile {
    return isSupportedProfile(value);
  }

  /**
   * Inspect and admit bytes under a caller-selected external-model profile.
   * @param props Inspection options and resident bytes.
   * @returns Facts admitted from the source bytes.
   */
  export function inspectBytes(
    props: IAutoMovieExternalModelInspection.IProps,
  ): IAutoMovieExternalModelInspection {
    return inspectModelBytes(props);
  }

  /**
   * Validate an authored native or retarget decision against inspected motion.
   * @param props Inspection, source identity, and adoption decision.
   * @returns A detached motion-adoption receipt.
   */
  export function adoptMotion(
    props: IAutoMovieExternalMotionAdoptionReceipt.IProps,
  ): IAutoMovieExternalMotionAdoptionReceipt {
    return adoptExternalMotion(props);
  }
}
