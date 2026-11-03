import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";

/**
 * Where a brow lies, centred on the face plane at its eye's medial canthus:
 * the brow is laid out in the face plane (the eye opening's projection
 * plane, lateral and up) from the same eye's canthi, `a` along the temple
 * direction from the medial canthus and `h` up. Its middle line passes,
 * above the horizontal through the medial canthus, at heights taken from the
 * upper brow margin of young adult women with the eyes opened smoothly (Park
 * et al. 2017: 26.4 mm at the medial canthus, 31.0 at the lateral limbus,
 * 28.4 at the lateral canthus, 21.6 at the lateral end) less half the brow's
 * width there. The brow starts 1 mm medial of the medial canthus and ends 9
 * mm beyond the lateral canthus, about where the line from the nasal ala
 * through the lateral canthus meets it (a conventional landmark), its tail
 * inside the 1.2 to 1.7 cm of Rajput 2021; its width swells from 3.5 mm at
 * its rounded medial start to 9 mm above the medial canthus, then falls
 * through 6.5 mm at the peak to 2 mm at the tail (a groomed brow; the widths
 * are conventions inside Rajput's 1 to 1.5 cm for men).
 */
export namespace AutoMovieHumanEyebrowPlacement {
  /** The face plane at the medial canthus. */
  export interface IFrame {
    /** The eye's globe. */
    globe: AutoMovieHumanEyelid.IGlobe;

    /** Medial canthus, calibration millimetres. */
    medial: AutoMovieHumanEyelid.Point;

    /** Lateral canthus, calibration millimetres. */
    lateral: AutoMovieHumanEyelid.Point;

    /** Unit direction toward the temple. */
    temple: AutoMovieHumanEyelid.Point;
  }

  /** One control of the middle line. */
  export interface IControl {
    /** Distance from the medial canthus toward the temple, mm. */
    a: number;

    /** Height of the middle line above the medial canthus's horizontal, mm. */
    mid: number;

    /** Brow width, mm. */
    width: number;
  }

  /** The brow's profile at one place. */
  export interface IProfile extends IControl {
    /** Slope of the middle line per mm along the brow. */
    slope: number;
  }

  /**
   * The face-plane frame of a lid.
   *
   * @param lid The eye's lid margin
   * @returns The frame
   */
  export function frame(lid: AutoMovieHumanEyelid.ILid): IFrame {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const g: AutoMovieHumanEyelid.IGlobe = lid.globe;
    const medial: AutoMovieHumanEyelid.Point = lid.samples[lid.medial]!.contact;
    const lateral: AutoMovieHumanEyelid.Point =
      lid.samples[lid.lateral]!.contact;
    const sign: number = E.dot(E.sub(lateral, medial), g.lateral) >= 0 ? 1 : -1;
    return { globe: g, medial, lateral, temple: E.scale(g.lateral, sign) };
  }

  /**
   * Distance of a point from the medial canthus along the temple direction.
   *
   * @param frame The face-plane frame
   * @param p The point
   * @returns Distance, millimetres
   */
  export function along(
    frame: IFrame,
    p: Readonly<AutoMovieHumanEyelid.Point>,
  ): number {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    return E.dot(E.sub(p, frame.medial), frame.temple);
  }

  /**
   * The middle line's controls, from the head to the tail.
   *
   * @param frame The face-plane frame
   * @returns Controls, in increasing distance
   */
  export function controls(frame: IFrame): IControl[] {
    const stations: Record<string, number> = {
      head: -1,
      medial: 0,
      limbus: along(frame, frame.globe.centre) + 5.85,
      lateral: along(frame, frame.lateral),
      end: along(frame, frame.lateral) + 9,
    };
    return CONTROLS.map(
      (c: { at: string; upper: number; width: number }): IControl => ({
        a: stations[c.at]!,
        mid: c.upper - c.width / 2,
        width: c.width,
      }),
    );
  }

  /**
   * The brow's profile at a fraction of its physical temple-directed
   * distance. The distance itself is linear and strictly increasing. Only
   * height and width interpolate, with tangents measured per millimetre
   * rather than per control index: the short head-to-medial span cannot
   * reverse under a tangent borrowed from the much longer medial-to-limbus
   * span.
   *
   * @param controls The middle line's controls
   * @param t Fraction of the brow's length, 0 at the head, 1 at the tail
   * @returns The profile
   */
  export function profile(controls: IControl[], t: number): IProfile {
    const last: number = controls.length - 1;
    const distance: number =
      controls[0]!.a +
      Math.min(1, Math.max(0, t)) * (controls[last]!.a - controls[0]!.a);
    let i: number = 0;
    while (i + 1 < last && controls[i + 1]!.a < distance) i++;
    const span: number = controls[i + 1]!.a - controls[i]!.a;
    const u: number = (distance - controls[i]!.a) / span;

    /** Value and physical derivative on nonuniform observed stations. */
    const hermite: (key: "mid" | "width") => [number, number] = (
      key: "mid" | "width",
    ): [number, number] => {
      /** Secant derivative per millimetre, one-sided at each end. */
      const slope: (k: number) => number = (k: number): number => {
        const lo: number = Math.max(0, k - 1);
        const hi: number = Math.min(last, k + 1);
        return (
          (controls[hi]![key] - controls[lo]![key]) /
          (controls[hi]!.a - controls[lo]!.a)
        );
      };
      const a: number = controls[i]![key];
      const b: number = controls[i + 1]![key];
      const ma: number = slope(i);
      const mb: number = slope(i + 1);
      return [
        (2 * u ** 3 - 3 * u * u + 1) * a +
          (u ** 3 - 2 * u * u + u) * span * ma +
          (-2 * u ** 3 + 3 * u * u) * b +
          (u ** 3 - u * u) * span * mb,
        ((6 * u * u - 6 * u) * a + (-6 * u * u + 6 * u) * b) / span +
          (3 * u * u - 4 * u + 1) * ma +
          (3 * u * u - 2 * u) * mb,
      ];
    };
    const [mid, slope]: [number, number] = hermite("mid");
    return { a: distance, mid, width: hermite("width")[0], slope };
  }

  /**
   * The face-plane point of brow coordinates.
   *
   * @param controls The middle line's controls
   * @param t Along the brow, 0 at the head, 1 at the tail
   * @param v Across the brow, -1 at the lower border, +1 at the upper
   * @returns `[a, h]` in the face plane, millimetres
   */
  export function face(
    controls: IControl[],
    t: number,
    v: number,
  ): [number, number] {
    const b: IProfile = profile(controls, t);
    return [b.a, b.mid + (v * b.width) / 2];
  }
}

/**
 * Middle line control points: distance from the medial canthus toward the
 * temple (in units named by `at`), height of the upper margin above the
 * medial canthus and width, mm (Park 2017 heights, convention widths).
 */
const CONTROLS: ReadonlyArray<{
  at: "head" | "medial" | "limbus" | "lateral" | "end";
  upper: number;
  width: number;
}> = [
  { at: "head", upper: 24.0, width: 3.5 },
  { at: "medial", upper: 26.4, width: 9.0 },
  { at: "limbus", upper: 31.0, width: 6.5 },
  { at: "lateral", upper: 28.4, width: 5.0 },
  { at: "end", upper: 21.6, width: 2.0 },
];
