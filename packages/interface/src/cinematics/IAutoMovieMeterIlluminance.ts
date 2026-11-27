import type { IAutoMovieEnvironmentContext } from "../analysis/IAutoMovieEnvironmentContext";
import type { IAutoMovieEnvironmentInstant } from "../analysis/IAutoMovieEnvironmentInstant";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieLight } from "../scene/IAutoMovieLight";
import type { IAutoMovieSceneEnvironment } from "../scene/IAutoMovieSceneEnvironment";

/**
 * Data contracts of `meterIlluminance`, an incident-light meter held
 * at one point of a scene.
 */
export namespace IAutoMovieMeterIlluminance {
  /**
   * Where the meter is held and the light that reaches it.
   *
   * The lights are the scene's lights at the metered second, after any light
   * motion; the meter reads them as given.
   */
  export type IProps = {
    /** The scene's lights, as the beauty pass draws them. */
    lights: readonly IAutoMovieLight[];

    /** World point metered, in metres; finite. */
    point: IAutoMovieVector3;

    /**
     * World normal of the metered surface, any non-zero finite length: the
     * direction an incident meter's dome faces.
     */
    normal: IAutoMovieVector3;

    /**
     * The scene's environment. An image is reported as unmetered, since its
     * intensity has no photometric unit. Absent or null meters no environment.
     */
    environment?: IAutoMovieSceneEnvironment | null;

    /**
     * A declared daylight instant of the scene. Its sky is reported as
     * unmetered, because no rendered frame draws a sky in physical units; its
     * beam never enters the total, because the frame draws the sun only as a
     * staged directional light, which the meter counts among `lights`.
     */
    daylight?: IDaylight;
  };

  /** A daylight instant with the site its sky is measured against. */
  export type IDaylight = {
    /** The site: its ground is the horizon and its occluders block sky rays. */
    context: IAutoMovieEnvironmentContext;

    /** The declared instant, one of the context's instants. */
    instant: IAutoMovieEnvironmentInstant;

    /**
     * Number of cosine-weighted hemisphere directions estimating the visible
     * sky, a positive safe integer, as a daylight study's `diffuseSamples`.
     */
    diffuseSamples: number;
  };

  /** What the meter reads. */
  export type IResult = {
    /**
     * Illuminance in lux of every term the rendered frame draws: the sum of
     * `contributions`.
     */
    lux: number;

    /** One entry per light, in the order of `lights`. */
    contributions: IContribution[];

    /**
     * Sources the frame carries or the daylight declares but `lux` leaves out,
     * in the order environment image, then daylight sky.
     */
    unmetered: IUnmetered[];
  };

  /** One light's share of the metered illuminance. */
  export type IContribution = {
    /** The light's id. */
    light: string;

    /** Its illuminance at the point, in lux; at or above zero. */
    lux: number;
  };

  /** A source left out of the total. */
  export type IUnmetered = {
    /**
     * `"environmentImage"`: the scene's image lighting; `"daylightSky"`: the
     * declared instant's isotropic sky.
     */
    source: "environmentImage" | "daylightSky";

    /**
     * Its illuminance in lux, or null when it has no photometric value: the
     * image's intensity is unitless.
     */
    lux: number | null;
  };
}
