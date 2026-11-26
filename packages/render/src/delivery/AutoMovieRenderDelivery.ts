import type {
  IAutoMovieProductionAudioProbe,
  IAutoMovieAssertProductionVideoProfileProps,
  IAutoMovieProductionVideoProfile,
  IAutoMovieResolveProductionVideoProfileProps,
} from "@automovie/interface";

import { assertProductionAacProfile } from "./assertProductionAacProfile.js";
import { assertProductionVideoProfile } from "./assertProductionVideoProfile.js";
import { resolveProductionVideoProfile } from "./resolveProductionVideoProfile.js";

/** Render-owned delivery profile operations. */
export class AutoMovieRenderDelivery {
  private constructor() {}

  /** Refuse a probed audio track that differs from the production AAC profile. */
  public static assertAacProfile(actual: IAutoMovieProductionAudioProbe): void {
    assertProductionAacProfile(actual);
  }

  /** Refuse a probed video track that differs from its expected delivery profile. */
  public static assertVideoProfile(
    props: IAutoMovieAssertProductionVideoProfileProps,
  ): void {
    assertProductionVideoProfile(props);
  }

  /** Resolve the fixed H.264-in-MP4 profile for an authored raster and rate. */
  public static resolveVideoProfile(
    props: IAutoMovieResolveProductionVideoProfileProps,
  ): IAutoMovieProductionVideoProfile {
    return resolveProductionVideoProfile(props);
  }
}
