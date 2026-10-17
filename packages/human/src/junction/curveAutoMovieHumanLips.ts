import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AUTOMOVIE_HUMAN_LIP_OUTLINE } from "./AUTOMOVIE_HUMAN_LIP_OUTLINE";
import { IAutoMovieHumanLipForm } from "./IAutoMovieHumanLipForm";

/**
 * One spatial definition of the vermilion border and its common oral arch.
 *
 * The mouth network and its pigmentation consume this curve. The cupid peaks follow the shared philtral span; the upper and lower borders stand in front of their common meeting course, with the vertical part derived from the measured three-dimensional vermilion chord. Coordinates are head-frame millimetres. The spatial/outline fractions are a small pooled reference fit. Input vermilion chords still require an independent three-dimensional limit-surface check.
 */
export function curveAutoMovieHumanLips(props: {
  head: IAutoMovieHumanIdentity.IHead;
  stomion: number;
  form: IAutoMovieHumanLipForm;
}): curveAutoMovieHumanLips.ICurve {
  const { head, stomion, form }: typeof props = props;
  const features: IAutoMovieHumanIdentity.IFeatures = head.features;
  const halfWidth: number = features.mouthWidth / 2;
  const outline: (x: number, upper: boolean) => number = (
    x: number,
    upper: boolean,
  ): number => {
    const t: number = Math.min(1, Math.abs(x) / halfWidth);
    if (!upper)
      return Math.pow(1 - t * t, AUTOMOVIE_HUMAN_LIP_OUTLINE.lowerExponent);
    const inner: number = Math.min(1, t / form.philtrum);
    const outer: number = Math.max(
      0,
      (t - form.philtrum) / (1 - form.philtrum),
    );
    const rise: number = AUTOMOVIE_HUMAN_LIP_OUTLINE.bowRise;
    return t <= form.philtrum
      ? 1 + rise * inner * inner * (3 - 2 * inner)
      : (1 + rise) *
          Math.pow(
            1 - outer * outer,
            AUTOMOVIE_HUMAN_LIP_OUTLINE.upperExponent,
          );
  };
  const height: (upper: boolean) => number = (upper: boolean): number =>
    upper ? features.upperVermilionHeight : features.lowerVermilionHeight;
  const forward: (upper: boolean) => number = (upper: boolean): number =>
    upper
      ? AUTOMOVIE_HUMAN_LIP_OUTLINE.upperForward
      : AUTOMOVIE_HUMAN_LIP_OUTLINE.lowerForward;
  const border: (x: number, upper: boolean) => number = (
    x: number,
    upper: boolean,
  ): number => {
    const t: number = Math.min(1, Math.abs(x) / halfWidth);
    // The supplied vermilion height is a 3D chord, not a Y projection.
    // Its fitted anterior fraction and Pythagoras retain that independent
    // length; the transverse outline only changes its off-midline course.
    const vertical: number = height(upper) * Math.sqrt(1 - forward(upper) ** 2);
    return (
      stomion +
      (upper ? 1 : -1) *
        (form.commissure * t * t + vertical * outline(x, upper))
    );
  };
  const projection: (x: number, upper: boolean) => number = (
    x: number,
    upper: boolean,
  ): number => height(upper) * forward(upper) * outline(x, upper);
  const arch: (x: number, centreZ: number) => number = (
    x: number,
    centreZ: number,
  ): number =>
    centreZ -
    AUTOMOVIE_HUMAN_LIP_OUTLINE.archSag *
      halfWidth *
      Math.pow(
        Math.min(1, Math.abs(x) / halfWidth),
        AUTOMOVIE_HUMAN_LIP_OUTLINE.archExponent,
      );
  return { halfWidth, border, projection, arch };
}

/** Input-independent output contract of the shared physical lip course. */
export namespace curveAutoMovieHumanLips {
  /** Shared mouth outline and its spatial projection.
   *
   * @author Samchon
   */
  export interface ICurve {
    /** Half the independently measured cheilion-to-cheilion width, millimetres. */
    halfWidth: number;

    /** Upper/lower border Y at head-local X, millimetres; the commissure retains the form's finite edge. */
    border: (x: number, upper: boolean) => number;

    /** Forward part of the measured vermilion chord at this transverse position. */
    projection: (x: number, upper: boolean) => number;

    /** Common transverse oral-arch depth, relative to its midpoint. */
    arch: (x: number, centreZ: number) => number;
  }
}
