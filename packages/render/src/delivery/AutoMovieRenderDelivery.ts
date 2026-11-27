import { auditDecodedFrames as auditDecodedFramesImplementation } from "./internal/auditDecodedFrames";
import { auditDeliveryContent as auditDeliveryContentImplementation } from "./internal/auditDeliveryContent";
import { auditEncodedPresentation as auditEncodedPresentationImplementation } from "./internal/auditEncodedPresentation";

import { type IAutoMovieProductionAudioProbe, type IAutoMovieAssertProductionPngPictureProps, type IAutoMovieProductionPngProfile, type IAutoMovieResolveProductionPngProfileProps, type IAutoMovieAssertProductionVideoProfileProps, type IAutoMovieProductionVideoProfile, type IAutoMovieResolveProductionVideoProfileProps, type IAutoMovieDecodedFrameAudit, type IAutoMovieDeliveryContentAudit, type IAutoMovieAuditEncodedPresentationExpected, type IAutoMovieAuditEncodedPresentationProbe } from "@automovie/interface";

import { assertProductionAacProfile } from "./internal/assertProductionAacProfile";
import { assertProductionVideoProfile } from "./internal/assertProductionVideoProfile";
import { resolveProductionVideoProfile } from "./internal/resolveProductionVideoProfile";
import { assertProductionPngPicture } from "./internal/assertProductionPngPicture";
import { resolveProductionPngProfile } from "./internal/resolveProductionPngProfile";

/** Render-owned delivery profile and content-audit operations. */
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
    return auditDecodedFramesImplementation(text, expectedFrames, fps);
  }

  /** Audit decoded delivery evidence against its commissioned content rules. */
  public static auditContent(
    props: IAutoMovieDeliveryContentAudit.IProps,
  ): IAutoMovieDeliveryContentAudit.IResult {
    return auditDeliveryContentImplementation(props);
  }

  /** Audit an encoded file against its commissioned stream profile and exact duration. */
  public static auditEncodedPresentation(
    probe: IAutoMovieAuditEncodedPresentationProbe,
    expected: IAutoMovieAuditEncodedPresentationExpected,
  ): void {
    auditEncodedPresentationImplementation(probe, expected);
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
