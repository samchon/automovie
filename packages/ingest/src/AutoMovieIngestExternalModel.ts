import type {
  AutoMovieExternalModelIngestProfile,
  AutoMovieGltfMotionInterpretationProfile,
  IAutoMovieExternalModelInspection,
  IAutoMovieExternalMotionAdoptionReceipt,
} from "@automovie/interface";

import { AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES as profiles } from "./AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES";
import { AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE as motionInterpretationProfile } from "./AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE";
import { adoptAutoMovieExternalMotion as adoptMotion } from "./adoptAutoMovieExternalMotion";
import { inspectAutoMovieExternalModelBytes as inspectBytes } from "./inspectAutoMovieExternalModelBytes";
import { isAutoMovieExternalModelIngestProfile as isProfile } from "./isAutoMovieExternalModelIngestProfile";

/** Inspects external model bytes and validates authored motion adoption. */
export class AutoMovieIngestExternalModel {
  /** Supported fixed external-model profile literals. */
  public static readonly profiles: readonly AutoMovieExternalModelIngestProfile[] =
    profiles;

  /** Fixed spatial interpretation used by glTF motion inspection. */
  public static readonly motionInterpretationProfile: AutoMovieGltfMotionInterpretationProfile =
    motionInterpretationProfile;

  /**
   * Check whether an unknown value names a supported external-model profile.
   * @param value Candidate profile value.
   * @returns Whether it exactly matches a supported profile.
   */
  public static isProfile(
    value: unknown,
  ): value is AutoMovieExternalModelIngestProfile {
    return isProfile(value);
  }

  /**
   * Inspect and admit bytes under a caller-selected external-model profile.
   * @param props Inspection options and resident bytes.
   * @returns Facts admitted from the source bytes.
   */
  public static inspectBytes(
    props: IAutoMovieExternalModelInspection.IProps,
  ): IAutoMovieExternalModelInspection {
    return inspectBytes(props);
  }

  /**
   * Validate an authored native or retarget decision against inspected motion.
   * @param props Inspection, source identity, and adoption decision.
   * @returns A detached motion-adoption receipt.
   */
  public static adoptMotion(
    props: IAutoMovieExternalMotionAdoptionReceipt.IProps,
  ): IAutoMovieExternalMotionAdoptionReceipt {
    return adoptMotion(props);
  }
}
