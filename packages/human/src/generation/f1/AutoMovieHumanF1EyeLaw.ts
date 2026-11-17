import { AutoMovieHumanF1FacePriors as P } from "./AutoMovieHumanF1FacePriors";

/**
 * The lids' law in an eye's own frame: the two margins as phases about the canthal line, functions of the station along it, and what a
 * blink turns. It reads no family and no figure; `packages/human/docs/techniques/face-one-shot.md` holds the design it serves.
 *
 * Frame: the eye's (`AutoMovieHumanF1FaceCentres.eye`), origin the globe's centre, Z the canthal line toward exocanthion. A station `s`
 * is a distance along Z from the fissure's middle, which this law takes at the globe's centre; a phase is an angle about Z from the
 * forward axis, positive upward. The lid's outer face lies on the sphere of radius `rho`, the globe's radius plus the lid's thickness,
 * so at station `s` it stands `sqrt(rho^2 - s^2)` from the line.
 *
 * PROVISIONAL margin shape, refuted by the first reading it was checked against (`face-one-shot.md`, The eye's law against f1): on the
 * f1 reference the canthi stand 3.3 mm below the line through the globe's centre, the upper margin's apex 3.5 mm medial of the
 * fissure's middle and the lower's lowest point 3.5 mm lateral of it, and medial of 12 mm from the centre the lid leaves the globe's
 * sphere. The sphere's radius and the blink hold; the shape below is to be replaced by one that takes the canthi's drop and each apex's
 * station as inputs. Nothing reads this module yet.
 *
 * Each margin is the parabola through both canthi with its apex at the fissure's middle, in height above the line along the lid's face:
 * `h(s) = h0 (1 - (2 s / L)^2)`. The parabola is a declared shape, the even curve of least degree through the three measured points
 * (two canthi and the apex); a published contour replaces it when one is read (the package's notes name Shin's for the upper lid). The
 * heights `h0` come from the fissure's height by the share of it that lies above the canthal line, an input of the person.
 */
export namespace AutoMovieHumanF1EyeLaw {
  /** One eye's measures. */
  export interface IEye {
    /** Fissure length, endocanthion to exocanthion, mm (`IAutoMovieHumanEye.palpebralFissureLength`). */
    length: number;

    /** Fissure height at its middle, upper to lower margin, eye open at rest, mm (`IAutoMovieHumanEye.palpebralFissureHeight`). */
    height: number;

    /** The share of that height above the canthal line, in (0, 1). */
    above: number;

    /** The globe's radius, mm; half the axial length where the person's own is not given. */
    globe: number;

    /** The lid's thickness over the globe, mm. */
    lid: number;
  }

  /** The published eye where a person's own measure is absent: the globe and the lid from `AutoMovieHumanF1FacePriors`. */
  export function of(length: number, height: number, above: number, globe: number = P.GLOBE_AXIAL_MM / 2, lid: number = P.UPPER_LID_MM): IEye {
    return { length, height, above, globe, lid };
  }

  /** The radius of the lid's outer face about the globe's centre, mm. */
  export function radius(eye: IEye): number {
    return eye.globe + eye.lid;
  }

  /** The lid's face's distance from the canthal line at a station, mm; the station must lie inside the sphere. */
  export function reach(eye: IEye, s: number): number {
    return Math.sqrt(radius(eye) ** 2 - s * s);
  }

  /**
   * The two margins' phases at a station, radians, the upper first: `asin(h(s) / reach(s))` with the upper margin's apex `above * height`
   * over the line and the lower's `(1 - above) * height` under it, each measured as a chord from the line's point so that the chord
   * between the two apexes is the fissure's height when the two phases are equal and opposite, and within the reading otherwise.
   *
   * `blink` in [0, 1] carries the upper margin toward the lower by that share of the phase between them at every station, the lower
   * margin staying: 0 is the eye open at rest, 1 the margins together. Past a canthus both phases are 0.
   */
  export function margins(eye: IEye, s: number, blink: number = 0): [number, number] {
    const t: number = (2 * s) / eye.length;
    if (Math.abs(t) >= 1) return [0, 0];
    const fall: number = 1 - t * t;
    const r: number = reach(eye, s);
    const upper: number = Math.asin((eye.above * eye.height * fall) / r);
    const lower: number = -Math.asin(((1 - eye.above) * eye.height * fall) / r);
    return [upper + blink * (lower - upper), lower];
  }
}
