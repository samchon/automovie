import type {
  IAutoMovieProductionAudioProbe,
  IAutoMovieAssertProductionPngPictureProps,
  IAutoMovieProductionPngProfile,
  IAutoMovieResolveProductionPngProfileProps,
} from "@automovie/interface";

import { assertProductionAacProfile } from "./internal/assertProductionAacProfile.js";
import { assertProductionVideoProfile } from "./internal/assertProductionVideoProfile.js";
import { resolveProductionVideoProfile } from "./internal/resolveProductionVideoProfile.js";
import { assertProductionPngPicture } from "./internal/assertProductionPngPicture.js";
import { resolveProductionPngProfile } from "./internal/resolveProductionPngProfile.js";

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

  /** Refuse a decoded PNG picture that differs from its output role profile. */
  public static assertPngPicture(
    props: IAutoMovieAssertProductionPngPictureProps,
  ): void {
    assertProductionPngPicture(props);
  }

  /** Resolve the PNG profile one output role must emit. */
  public static resolvePngProfile(
    props: IAutoMovieResolveProductionPngProfileProps,
  ): IAutoMovieProductionPngProfile {
    return resolveProductionPngProfile(props);
  }
}
