import type { IAutoMovieFilmOptics } from "./IAutoMovieFilmOptics";

/**
 * Data contracts of `planFilmSamples`, the sub-frame samples a
 * directly rendered frame averages for its shutter and its lens.
 */
export namespace IAutoMoviePlanFilmSamples {
  /** The frame and the film's optics at it. */
  export type IProps = {
    /** The frame's second `t`, film seconds. */
    seconds: number;

    /** The film's frame rate, frames per second; finite and above zero. */
    fps: number;

    /** The film's optics at `t`, admitted, with `samples` set. */
    optics: IAutoMovieFilmOptics;

    /**
     * The drawing camera's vertical field of view in degrees, within (0, 180),
     * from which the lens's full-frame equivalent focal length follows.
     */
    fovY: number;
  };

  /** One sub-frame sample, in the order the host draws them. */
  export type ISample = {
    /** The second the scene is placed at for this sample. */
    seconds: number;

    /**
     * Index into the fixed Hammersley set of the lens point this sample takes,
     * or null without a lens.
     */
    point: number | null;

    /**
     * The eye's offset on the aperture disk, in metres along the camera's local
     * right and up axes, or null without a lens.
     */
    eye: ISampleEye | null;
  };

  /** The eye object of {@link ISample}. */
  export type ISampleEye = { x: number; y: number };
}
