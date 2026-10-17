import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { profileAutoMovieHumanHead } from "./profileAutoMovieHumanHead";

/**
 * Shared nasal meridian and alar courses, in head-frame millimetres.
 *
 * The tip's forward reach is the projection of the measured subnasale–pronasale chord after the form's vertical rise. The ridge and alar lobes are anterior heights, never tilted-section radial distances. These existing conventional coefficients define a source curve; clinical chords and the final limit surface are checked independently.
 */
export function curveAutoMovieHumanNose(props: {
  frame: frameAutoMovieHumanHead.IFrame;
  head: IAutoMovieHumanIdentity.IHead;
  profile: profileAutoMovieHumanHead.IProfile;
  form: IAutoMovieHumanHeadForm.IRelief["nose"];
}): curveAutoMovieHumanNose.ICurve {
  const { frame, head, profile, form }: typeof props = props;
  const f: IAutoMovieHumanIdentity.IFeatures = head.features;
  const yNasion: number = frame.nasion.y;
  const ySub: number = profile.subnasale.y;
  const yTip: number = ySub + form.tipAboveSubnasale * f.noseHeight;
  // Nasal protrusion is a 3D chord. The form supplies the vertical rise;
  // Pythagoras derives its anterior component from that independent input.
  const rise: number = yTip - ySub;
  const zTip: number =
    profile.subnasale.z +
    Math.sqrt(Math.max(0, f.noseProtrusion ** 2 - rise * rise));
  const tipShare: number = (yNasion - yTip) / (yNasion - ySub);
  // t^p(1+p(1-t)) interpolates both endpoint depths with zero endpoint
  // slopes for p>1. The fitted exponent changes curvature, not tip position.
  const dorsum: (y: number) => number = (y: number): number => {
    const t: number = Math.min(
      1,
      Math.max(0, (yNasion - y) / (yNasion - yTip)),
    );
    return (
      frame.nasion.z +
      (zTip - frame.nasion.z) *
        Math.pow(t, form.dorsumCurve) *
        (1 + form.dorsumCurve * (1 - t))
    );
  };
  // The meridian's two endpoint values and zero tip/base slopes determine
  // the unique cubic underside; a square-root cutoff had an infinite base slope.
  const tipHeight: number = zTip - profile.front(yTip);
  const nose: (x: number, y: number) => number = (
    x: number,
    y: number,
  ): number => {
    if (y > yNasion || y < ySub) return 0;
    const s: number = (yNasion - y) / (yNasion - ySub);
    const height: number =
      s <= tipShare
        ? Math.max(0, dorsum(y) - profile.front(y))
        : Math.max(
            0,
            zTip +
              (profile.subnasale.z - zTip) *
                smooth(0, 1, (s - tipShare) / (1 - tipShare)) -
              profile.front(y),
          );
    const half: number =
      f.noseWidth * lerp(form.bridge, form.ala, smooth(0, tipShare, s));
    const t: number = Math.abs(x) / half;
    const ridge: number =
      t >= 1
        ? 0
        : height * Math.pow(1 - t * t, lerp(1.6, 1.0, smooth(0, tipShare, s)));
    // the alar lobes beside the tip, low on the nose
    const ala: number =
      form.alaHeight *
      tipHeight *
      Math.exp(
        -(
          ((Math.abs(x) - form.alaOffset * f.noseWidth) /
            (form.alaSpread * f.noseWidth)) **
          2
        ),
      ) *
      Math.exp(-(((s - (1 + tipShare) / 2) / form.alaDepth) ** 2)) *
      // The alar source shares the underside's exact endpoint. A Gaussian
      // alone remains positive at subnasale and the source cutoff makes a step.
      smooth(ySub, (yTip + ySub) / 2, y);
    return Math.max(ridge, ala);
  };

  return {
    tip: { y: yTip, z: zTip },
    alarY: (yTip + ySub) / 2,
    displacement: nose,
  };
}
/** Output contract of the named physical source courses. */
export namespace curveAutoMovieHumanNose {
  /** Named courses consumed by both patch layout and surface.
   *
   * @author Samchon
   */
  export interface ICurve {
    /** Pronasale in the sagittal head plane, millimetres. */
    tip: { y: number; z: number };

    /** Shared level midway from tip to subnasale, millimetres. */
    alarY: number;

    /** Anterior +Z height over the base profile at head-local XY, millimetres. */
    displacement: (x: number, y: number) => number;
  }
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function smooth(a: number, b: number, x: number): number {
  const t: number = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
