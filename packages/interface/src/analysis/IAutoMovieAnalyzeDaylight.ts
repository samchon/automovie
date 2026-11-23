import type { IAutoMovieDaylightRequest } from "./IAutoMovieDaylightRequest";

/** Data and callback contracts shared by the AnalyzeDaylight operations. */
export namespace IAutoMovieAnalyzeDaylight {
  /**
   * Measure one workplane under one declared instant, one set of shades and one
   * set of luminaires.
   *
   * The governing model is stated and bounded rather than implied:
   *
   * - Beam illuminance is `DNI * max(0, dot(n, s))`, zeroed when any solid stops
   *   the ray to the sun;
   * - Sky illuminance is the isotropic vault `DHI * V`, where `V` is the fraction
   *   of a cosine-weighted hemisphere that reaches the sky unobstructed and
   *   above the reference ground. An unobstructed ground-facing-up plane has
   *   V=1; tilted or shaded planes retain sampling error;
   * - Each luminaire contributes `I * max(0, dot(n, d)) / r^2`, zeroed when a
   *   solid stands between the fitting and the point;
   * - Ground-reflected light is **not** modelled, and says so as an `unsupported`
   *   metric rather than being quietly folded into the sky term.
   *
   * Anything the solver cannot answer is reported rather than approximated. A
   * sky model it does not implement returns an `unsupported` run; a study with
   * neither a sun nor a fitting returns `not-run`; a contrast ratio over a
   * plane with a dark point returns a gap, because `max / 0` is not a large
   * number, it is not a number.
   *
   * Settings text covers the declared study fields and preserves list order;
   * equivalent covered JSON values repeat the digest, while ignored fields,
   * signed zero and possible hash collisions limit identity claims.
   *
   * The cosine-weighted sky estimate is exact only for an unobstructed plane
   * whose hemisphere lies wholly above the reference ground; a tilted or shaded
   * plane's sky term depends on `diffuseSamples`. This identity is
   * mathematical: binary64 light products and summation can overflow, and
   * nonfinite computed metrics throw even when scalar inputs were admitted.
   */
  export type IProps = {
    /** Study to measure; validated in full before any ray is cast. */
    request: IAutoMovieDaylightRequest;
  };
}
