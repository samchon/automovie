import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

/** Reference evidence for the picture and soundtrack passed to the encoder. */
export interface IAutoMovieCliDeliveryReferenceDecode {
  /** Evidence for the encoder's picture input. */
  video: IAutoMovieDeliveryContentAudit.Stream;

  /** Evidence for the encoder's soundtrack input. */
  audio: IAutoMovieDeliveryContentAudit.Stream;
}
