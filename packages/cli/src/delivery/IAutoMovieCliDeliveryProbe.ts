import type {
  IAutoMovieProductionAudioProbe,
  IAutoMovieProductionVideoProbe,
} from "@automovie/interface";

/** Result read from one MP4's track and timing headers. */
export interface IAutoMovieCliDeliveryProbe {
  /** The video track facts. */
  video: IAutoMovieProductionVideoProbe;

  /** The audio track facts, or null when the file has no audio track. */
  audio: IAutoMovieProductionAudioProbe | null;
}
