import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieLoudnessMeter,
  IAutoMovieProductionVideoProfile,
} from "@automovie/interface";

import type { IAutoMovieCliDeliveryProbe } from "./IAutoMovieCliDeliveryProbe";
import type { IAutoMovieCliDeliveryReferenceDecode } from "./IAutoMovieCliDeliveryReferenceDecode";
import { readDeliveryProbe } from "./internal/readDeliveryProbe";
import { runDeliveryDecode } from "./internal/runDeliveryDecode";
import { runDeliveryReferenceDecode } from "./internal/runDeliveryReferenceDecode";
import { runFfmpeg } from "../ffmpeg/internal/runFfmpeg";

/** Node CLI delivery file probes and FFmpeg decode evidence. */
export namespace AutoMovieCliDelivery {
  /** Reads MP4 track and timing facts from the file headers. */
  export function readProbe(
    path: string,
    srgb: Readonly<IAutoMovieProductionVideoProfile["color"]>,
  ): Promise<IAutoMovieCliDeliveryProbe> {
    return readDeliveryProbe(path, srgb);
  }

  /** Decodes an encoded delivery for native stream audit evidence. */
  export function decode(
    binary: string,
    artifact: string,
    expected: Expected,
    thresholds: Thresholds,
    run: typeof runFfmpeg = runFfmpeg,
    meter?: (channels: 1 | 2) => IAutoMovieLoudnessMeter,
  ): Promise<Audit["streams"]> {
    return runDeliveryDecode(
      binary,
      artifact,
      expected,
      thresholds,
      run,
      meter,
    );
  }

  /** Decodes the picture and soundtrack inputs used to encode a delivery. */
  export function referenceDecode(
    binary: string,
    encoder: readonly string[],
    expected: Expected,
    thresholds: Thresholds,
    run: typeof runFfmpeg = runFfmpeg,
  ): Promise<IAutoMovieCliDeliveryReferenceDecode> {
    return runDeliveryReferenceDecode(
      binary,
      encoder,
      expected,
      thresholds,
      run,
    );
  }
}

type Audit = IAutoMovieDeliveryContentAudit.IProps;
type Expected = Pick<Audit["expected"], "frameCount" | "frameRate">;
type Thresholds = Audit["thresholds"];
