import type { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";
import { AutoMovieHumanMouthPrior as Prior } from "./AutoMovieHumanMouthPrior";

/**
 * The dental arch of the mouth: the beta curve one quadrant's crowns stand
 * along (Braun et al. 1998), sized so its half length is the quadrant's crown
 * widths and its first molars stand the adult intermolar width apart, and the
 * teeth of a jaw placed side by side on it in the mouth's frame (calibration
 * millimetres, forward +X, up +Y, left +Z).
 *
 * The arch is a plan curve: lateral place against depth forward of the line
 * through its ends. Its arc length has no closed form, so lengths along it are
 * walked in fine chords; 2000 chords over the half width keep the walk's error
 * under a micrometre for arches of a few centimetres.
 */
export namespace AutoMovieHumanMouthArch {
  /** A beta arch fitted to one quadrant's teeth. */
  export interface IArch {
    /** Full width between the arch's ends, mm. */
    width: number;

    /** Depth from the ends' line to the front, mm. */
    depth: number;
  }

  /**
   * The upper arch: its half length is the quadrant's crown widths, and its
   * first molars' mesiobuccal cusps, a quarter of the molar past its mesial
   * face, stand the adult intermolar width apart. Two conditions fix width
   * and depth. For a fixed depth/width ratio every sampled chord scales with
   * width, so its unit-width length fixes width directly. Bisection retains
   * the original ratio interval, 60 iterations and 2000-chord cusp walk.
   *
   * @param teeth One quadrant's crowns from the central incisor back.
   * @returns The arch.
   */
  export function arch(teeth: readonly Prior.ITooth[]): IArch {
    const total: number = teeth.reduce(
      (s: number, t: Prior.ITooth): number => s + t.width,
      0,
    );
    const cusp: number =
      teeth
        .slice(0, 5)
        .reduce((s: number, t: Prior.ITooth): number => s + t.width, 0) +
      teeth[5]!.width / 4;
    const sized: (ratio: number) => IArch = (ratio: number): IArch => {
      // Chord lengths are positively homogeneous in width. Keep the former
      // solve's bounds, including saturation, without remeasuring 60 scales.
      const w: number = Math.min(
        4 * total,
        Math.max(1, total / halfLength({ width: 1, depth: ratio })),
      );
      return { width: w, depth: ratio * w };
    };
    let lo: number = 0.1;
    let hi: number = 2;
    for (let k: number = 0; k < 60; k++) {
      const r: number = (lo + hi) / 2;

      // A deeper arch for the same length is narrower at the molars.
      if (walk(sized(r), cusp).lateral * 2 > Prior.INTERMOLAR) lo = r;
      else hi = r;
    }
    return sized((lo + hi) / 2);
  }

  /**
   * Teeth of one jaw, both sides, on the upper arch inset by an offset.
   *
   * @param crowns The jaw's quadrant crowns from the central incisor back.
   * @param upper The upper arch.
   * @param inset Inward offset of this jaw's cusp line from the upper's, mm (the overjet for the lower).
   * @param start Forward place of the upper central incisors' cusp line, mm.
   * @param edge The upper incisal edge `[x, y]`, mm.
   * @param cant Slope of the occlusal plane, rise per millimetre backward.
   * @param jaw Which jaw.
   * @returns The jaw's teeth, left side first.
   */
  export function place(
    crowns: readonly Prior.ITooth[],
    upper: IArch,
    inset: number,
    start: number,
    edge: [number, number],
    cant: number,
    jaw: "upper" | "lower",
  ): AutoMovieHumanMouth.ITooth[] {
    const out: AutoMovieHumanMouth.ITooth[] = [];
    const front: number = beta(upper, 0);
    for (const side of [1, -1] as const) {
      let length: number = 0;
      crowns.forEach((crown: Prior.ITooth): void => {
        // The lower cusp line is the upper's moved inward by the overjet, and
        // its teeth stand side by side along it from the midline. A crown's
        // centre lies a quarter of its depth inside the cusp line.
        const centre: IStep = walk(upper, length + crown.width / 2, inset);
        length += crown.width;
        const inside: number = crown.depth / 4;
        const lateral: number = centre.lateral - centre.out[0] * inside;
        const depth: number = centre.depth - centre.out[1] * inside;
        const x: number = start - (front - depth);

        // Upper tips sit on the occlusal plane through the incisal edge; lower
        // incisors overlap them by the overbite, fading to cusps meeting at
        // the premolars and molars.
        const overlap: number =
          crown.kind === "incisor" ? 1 : crown.kind === "canine" ? 0.5 : 0;
        const tip: number =
          edge[1] +
          cant * (edge[0] - x) +
          (jaw === "lower" ? Prior.OVERBITE * overlap : 0);
        const neck: number =
          jaw === "upper" ? tip + crown.height : tip - crown.height;
        out.push({
          name: `${jaw}.${side > 0 ? "left" : "right"}.${crown.name}`,
          crown,
          jaw,
          neck: [x, neck, side * lateral],
          axis: jaw === "upper" ? [0, -1, 0] : [0, 1, 0],
          along: unit([centre.along[1], 0, side * centre.along[0]]),
          out: unit([centre.out[1], 0, side * centre.out[0]]),
        });
      });
    }
    return out;
  }

  /**
   * Depth of the beta arch in plan at a lateral place, mm.
   *
   * @param a The arch.
   * @param lateral Lateral place from the midline, mm.
   */
  export function beta(a: IArch, lateral: number): number {
    const s: number = lateral / a.width;
    const q: number = Math.max(0, (0.5 + s) * (0.5 - s));
    return BETA * a.depth * q ** Prior.ARCH_POWER;
  }

  /** A place on an arch in plan: lateral, depth forward of the ends' line, unit tangent and outward normal. */
  interface IStep {
    /** Lateral place, mm. */
    lateral: number;

    /** Depth forward of the ends' line, mm. */
    depth: number;

    /** Unit tangent `[lateral, depth]`. */
    along: [number, number];

    /** Unit outward normal `[lateral, depth]`. */
    out: [number, number];
  }

  /**
   * The place an arc length from the midline along the curve parallel to an
   * arch, inset toward its inside; the arch's own curve for no inset. Walked
   * in fine chords, since the beta arch has no closed arc length.
   */
  function walk(a: IArch, length: number, inset: number = 0): IStep {
    const steps: number = 2000;
    const half: number = a.width / 2;
    const at = (lateral: number): IStep => {
      const h: number = half / steps;
      const l0: number = Math.max(0, lateral - h);
      const l1: number = Math.min(half, lateral + h);
      const dl: number = l1 - l0;
      const dd: number = beta(a, l1) - beta(a, l0);
      const n: number = Math.hypot(dl, dd) || 1;
      const along: [number, number] = [dl / n, dd / n];

      // The arch is convex toward the front, so outward is the tangent turned
      // toward the front and the side.
      const out: [number, number] = [-along[1], along[0]];
      return {
        lateral: lateral - inset * out[0],
        depth: beta(a, lateral) - inset * out[1],
        along,
        out,
      };
    };
    let travelled: number = 0;
    let previous: IStep = at(0);
    for (let i: number = 1; i <= steps; i++) {
      const point: IStep = at((half * i) / steps);
      const d: number = Math.hypot(
        point.lateral - previous.lateral,
        point.depth - previous.depth,
      );
      if (travelled + d >= length || i === steps) {
        const f: number = d > 0 ? Math.min(1, (length - travelled) / d) : 0;
        return {
          lateral: previous.lateral + f * (point.lateral - previous.lateral),
          depth: previous.depth + f * (point.depth - previous.depth),
          along: point.along,
          out: point.out,
        };
      }
      travelled += d;
      previous = point;
    }
    throw new Error("Unreachable arch walk");
  }

  /** Half arc length of an arch, mm, walked in 2000 chords. */
  function halfLength(a: IArch): number {
    let travelled: number = 0;
    let previous: [number, number] = [0, beta(a, 0)];
    const steps: number = 2000;
    for (let i: number = 1; i <= steps; i++) {
      const lateral: number = (a.width / 2) * (i / steps);
      const point: [number, number] = [lateral, beta(a, lateral)];
      travelled += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
      previous = point;
    }
    return travelled;
  }

  /** A vector scaled to unit length; the zero vector stays zero. */
  function unit(v: [number, number, number]): [number, number, number] {
    const l: number = Math.hypot(...v) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }

  /** Normalisation of the beta arch, so its front lies at its depth (Braun et al. 1998). */
  const BETA: number = 3.0314;
}
