/**
 * Arm size from anatomical tape sites rather than fractions of the whole arm.
 * The positive girth profile joins each adjacent pair with a quintic having
 * zero first and second derivatives at its ends. It cannot add a belly between
 * tape sites. Ellipse normalization uses the perimeter of its actual section.
 */
export namespace AutoMovieHumanArmTapes {
  /** One tape in millimetres of walk distance and millimetres of circumference. */
  export interface IKey {
    /** Distance down the arm's generating walk. */
    station: number;

    /** Taut circumference in the plane across the bone. */
    girth: number;
  }

  /**
   * Circumference between ordered positive tape keys, held outside the keys.
   * Zero derivatives at extrema give one forearm belly and a level wrist end.
   */
  export function girth(keys: readonly IKey[], station: number): number {
    if (station <= keys[0]!.station) return keys[0]!.girth;
    for (let i: number = 1; i < keys.length; i++) {
      const b: IKey = keys[i]!;
      if (station > b.station) continue;
      const a: IKey = keys[i - 1]!;
      const t: number = (station - a.station) / (b.station - a.station);
      const w: number = t * t * t * (10 + t * (-15 + 6 * t));
      return a.girth + w * (b.girth - a.girth);
    }
    return keys[keys.length - 1]!.girth;
  }

  /**
   * Equivalent-area radius of an ellipse with a specified perimeter, mm.
   * The unit ellipse has semiaxes sqrt(aspect) and 1/sqrt(aspect). A periodic
   * trapezoidal integral of its speed gives its circumference without treating
   * it as a circle. Sixty-four samples resolve the smooth near-circular arm
   * sections, including the supported wrist aspect, far below a millimetre.
   */
  export function radius(girth: number, aspect: number): number {
    let speed: number = 0;
    for (let i: number = 0; i < SAMPLES; i++) {
      const phase: number = (2 * Math.PI * i) / SAMPLES;
      speed += Math.sqrt(aspect * Math.sin(phase) ** 2 + Math.cos(phase) ** 2 / aspect);
    }
    return girth / ((2 * Math.PI * speed) / SAMPLES);
  }
}

/** Periodic quadrature samples for the ellipse's analytic speed. */
const SAMPLES: number = 64;
