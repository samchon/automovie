import { auditAutoMovieDecodedFrames as auditAutoMovieDecodedFramesImplementation } from "./internal/auditAutoMovieDecodedFrames.js";

import { type IAutoMovieProductionAudioProbe, type IAutoMovieAssertProductionPngPictureProps, type IAutoMovieProductionPngProfile, type IAutoMovieResolveProductionPngProfileProps, type IAutoMovieAssertProductionVideoProfileProps, type IAutoMovieProductionVideoProfile, type IAutoMovieResolveProductionVideoProfileProps, type IAutoMovieDecodedFrameAudit } from "@automovie/interface";

import { assertProductionAacProfile } from "./internal/assertProductionAacProfile.js";
import { assertProductionVideoProfile } from "./internal/assertProductionVideoProfile.js";
import { resolveProductionVideoProfile } from "./internal/resolveProductionVideoProfile.js";
import { assertProductionPngPicture } from "./internal/assertProductionPngPicture.js";
import { resolveProductionPngProfile } from "./internal/resolveProductionPngProfile.js";

/** Render-owned delivery profile operations. */
export class AutoMovieRenderDelivery {
  /**
   * Admit a decoder's framemd5 listing against a commissioned half-open frame
   * clock: exactly one stream-zero time base, exactly `expectedFrames` video
   * rows, and frame `i` presenting precisely `[i / fps, (i + 1) / fps)` in that
   * time base, checked on the exact native tick grid. Adjacent identical images
   * are reported as holds, never rejected. Malformed rows, gaps, overlaps,
   * reordering, excess frames and a nonzero start are refused. This proves
   * presentation continuity of decoded bytes, not motion or quality.
   *
   * @param text Complete FFmpeg framemd5 output.
   * @param expectedFrames Commissioned frame count, a positive safe integer.
   * @param fps Commissioned frames per second, a positive safe integer.
   * @returns The admitted frames and holds.
   */
  public static auditDecodedFrames(text: string, expectedFrames: number, fps: number): IAutoMovieDecodedFrameAudit {
    return auditAutoMovieDecodedFramesImplementation(text, expectedFrames, fps);
  }

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
