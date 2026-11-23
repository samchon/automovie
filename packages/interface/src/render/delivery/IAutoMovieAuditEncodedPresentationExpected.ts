/**
 * Commissioned video raster/clock and optional audio format for
 * auditAutoMovieEncodedPresentation. The audit requires exact presentation
 * coverage and the declared audio profile; absent audio fields mean 48000
 * samples/second and two channels. These are required delivery facts, not probe
 * observations.
 */
export interface IAutoMovieAuditEncodedPresentationExpected {
  /** Whole seconds, positive. */ durationSeconds: number;
  /** Raster width, pixels. */ width: number;
  /** Raster height, pixels. */ height: number;
  /** Frames per second, an integer. */ fps: number;
  /** Audio samples per second; 48000 by default. */ sampleRate?: number;
  /** Audio channels; 2 by default. */ channels?: number;
}
