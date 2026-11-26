import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieLoudnessMeter,
  IAutoMovieProductionAudioProbe,
  IAutoMovieProductionVideoProfile,
  IAutoMovieProductionVideoProbe,
} from "@automovie/interface";

import { readAutoMovieDeliveryProbe } from "./internal/readAutoMovieDeliveryProbe";
import { runAutoMovieDeliveryDecode } from "./internal/runAutoMovieDeliveryDecode";
import { runAutoMovieDeliveryReferenceDecode } from "./internal/runAutoMovieDeliveryReferenceDecode";
import { runAutoMovieFfmpeg } from "../runAutoMovieFfmpeg";

type Audit = IAutoMovieDeliveryContentAudit.IProps;
type Expected = Pick<Audit["expected"], "frameCount" | "frameRate">;
type Thresholds = Audit["thresholds"];

/** Result read from one MP4's track and timing headers. */
export interface IAutoMovieCliDeliveryProbe {
  /** The video track facts. */
  video: IAutoMovieProductionVideoProbe;

  /** The audio track facts, or null when the file has no audio track. */
  audio: IAutoMovieProductionAudioProbe | null;
}

/** Reference evidence for the picture and soundtrack passed to the encoder. */
export interface IAutoMovieCliDeliveryReferenceDecode {
  /** Evidence for the encoder's picture input. */
  video: IAutoMovieDeliveryContentAudit.Stream;

  /** Evidence for the encoder's soundtrack input. */
  audio: IAutoMovieDeliveryContentAudit.Stream;
}

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
