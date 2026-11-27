import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieLoudnessMeter,
  IAutoMovieProductionVideoProfile,
} from "@automovie/interface";

import type { IAutoMovieCliDeliveryProbe } from "./IAutoMovieCliDeliveryProbe";
import type { IAutoMovieCliDeliveryReferenceDecode } from "./IAutoMovieCliDeliveryReferenceDecode";
import { readAutoMovieDeliveryProbe } from "./internal/readAutoMovieDeliveryProbe";
import { runAutoMovieDeliveryDecode } from "./internal/runAutoMovieDeliveryDecode";
import { runAutoMovieDeliveryReferenceDecode } from "./internal/runAutoMovieDeliveryReferenceDecode";
import { runAutoMovieFfmpeg } from "../ffmpeg/internal/runAutoMovieFfmpeg";

/** Node CLI delivery file probes and FFmpeg decode evidence. */
export namespace AutoMovieCliDelivery {
  /** Reads MP4 track and timing facts from the file headers. */
  export function readProbe(
    path: string,
    srgb: Readonly<IAutoMovieProductionVideoProfile["color"]>,
  ): Promise<IAutoMovieCliDeliveryProbe> {
    return readAutoMovieDeliveryProbe(path, srgb);
  }

  /** Decodes an encoded delivery for native stream audit evidence. */
  export function decode(
    binary: string,
    artifact: string,
    expected: Expected,
    thresholds: Thresholds,
    run: typeof runAutoMovieFfmpeg = runAutoMovieFfmpeg,
    meter?: (channels: 1 | 2) => IAutoMovieLoudnessMeter,
  ): Promise<Audit["streams"]> {
    return runAutoMovieDeliveryDecode(
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
    run: typeof runAutoMovieFfmpeg = runAutoMovieFfmpeg,
  ): Promise<IAutoMovieCliDeliveryReferenceDecode> {
    return runAutoMovieDeliveryReferenceDecode(
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
