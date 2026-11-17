

/**
 * Commissioned video raster/clock and optional audio format for auditAutoMovieEncodedPresentation. The audit requires exact presentation coverage and the declared audio profile; absent audio fields mean 48000 samples/second and two channels. These are required delivery facts, not probe observations.
 *
 * @evidence contracts/development/design.md#principled-representation The audit requires exact presentation coverage and the declared audio profile; absent audio fields mean 48000 samples/second and two channels.
 * @evidence contracts/development/design.md#minimal-and-owned-surface auditAutoMovieEncodedPresentation exchanges durationSeconds, width, height, fps, sampleRate, channels; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These are required delivery facts, not probe observations.
 * @evidence contracts/development/common.md#meaningful-documentation Commissioned video raster/clock and optional audio format for auditAutoMovieEncodedPresentation. The prose and members document how auditAutoMovieEncodedPresentation interprets and admits these values.
 */
export interface IAutoMovieAuditEncodedPresentationExpected {
    /** Whole seconds, positive. */ durationSeconds: number;
    /** Raster width, pixels. */ width: number;
    /** Raster height, pixels. */ height: number;
    /** Frames per second, an integer. */ fps: number;
    /** Audio samples per second; 48000 by default. */ sampleRate?: number;
    /** Audio channels; 2 by default. */ channels?: number;
  }
