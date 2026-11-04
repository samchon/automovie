import { AutoMovieHumanHeadNeckBase } from "./AutoMovieHumanHeadNeckBase";
import { AutoMovieHumanHeadRadius } from "./AutoMovieHumanHeadRadius";
import { AutoMovieHumanHeadRelief } from "./AutoMovieHumanHeadRelief";
import { AutoMovieHumanHeadSection } from "./AutoMovieHumanHeadSection";
import type { IAutoMovieHumanHeadSection } from "./IAutoMovieHumanHeadSection";
import type { IAutoMovieHumanHeadSides } from "./IAutoMovieHumanHeadSides";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * The head's skin as cut sections: a section at a station with its reliefs on
 * (left and right sides from the front to the back of the midline), and the
 * readings other pieces take on it: the forward place of the skin at a height
 * and lateral place, the midline's front or back, a breadth at a forward
 * place and the widest half width.
 */
export namespace AutoMovieHumanHeadSkin {
  /** Cut the requested prefix at station s; whole-chain consumers take every phase. */
  export function sides(
    surface: IAutoMovieHumanHeadSurface,
    s: number,
    count: number = AutoMovieHumanHeadSection.ANGLES + 1,
  ): IAutoMovieHumanHeadSides {
    const known: IAutoMovieHumanHeadSides | undefined = surface.cut.get(s);
    if (known !== undefined && known.left.length >= count) return known;
    const out: IAutoMovieHumanHeadSides = cut(surface, s, count, known);
    surface.cut.set(s, out);
    return out;
  }

  /** The section at station s, its reliefs on. */
  function cut(
    surface: IAutoMovieHumanHeadSurface,
    s: number,
    count: number,
    known?: IAutoMovieHumanHeadSides,
  ): IAutoMovieHumanHeadSides {
    const {
      compiled,
      plan,
    }: Pick<IAutoMovieHumanHeadSurface, "compiled" | "plan"> = surface;
    const m: IAutoMovieHumanHeadSection = AutoMovieHumanHeadSection.section(
      compiled,
      plan,
      s,
    );
    const ox: number = (m.front + m.back) / 2;
    // The neck ring's difference from the law hands over as a cubic Hermite
    // span: the ring's own place and slope at its start, nothing at the end.
    // A weight falling at the ring under the law's own slope met the neck's
    // rising throat at a ridge turning 45 degrees round the front of the
    // neck; the slope carried on a straight line overshot the sides, where the
    // neck narrows at 2 mm per mm, into a dent.
    const [fade, run, bend] = AutoMovieHumanHeadNeckBase.neckFade(plan, s);
    const cos: number = Math.cos(m.tilt);
    const sin: number = Math.sin(m.tilt);

    // Landmark probes use only the anterior prefix. A later whole ring extends
    // the same solved phases with the original continuation's warm start.
    const left: Vec3[] = known?.left ?? [];
    const right: Vec3[] = known?.right ?? [];
    let guess: number = known?.radius ?? 0;
    for (let j: number = left.length; j < count; j++) {
      const theta: number = (Math.PI * j) / AutoMovieHumanHeadSection.ANGLES;
      const r: number = AutoMovieHumanHeadRadius.radius(m, ox, theta, guess);
      guess = r;
      const c: number = Math.cos(theta);
      const n: number = Math.sin(theta);
      const emit: (
        delta: number,
        slope: number,
        curve: number,
        rise: number,
        sign: 1 | -1,
      ) => Vec3 = (
        delta: number,
        slope: number,
        curve: number,
        rise: number,
        sign: 1 | -1,
      ): Vec3 => {
        const r0: number = r + fade * delta + run * slope + bend * curve;
        const xi: number = ox + r0 * c;
        const z: number = sign * r0 * n;
        const x: number = xi * cos;
        const y: number = s + xi * sin;
        const r1: number = AutoMovieHumanHeadRelief.merged(
          surface,
          r0,
          x,
          y,
          z,
          sign,
        );
        const xi1: number = ox + r1 * c;
        return [xi1 * cos, s + xi1 * sin + fade * rise, sign * r1 * n];
      };
      left[j] = emit(
        surface.neckLeft[j]!,
        surface.slopeLeft[j]!,
        surface.curveLeft[j]!,
        surface.riseLeft[j]!,
        1,
      );
      right[j] = emit(
        surface.neckRight[j]!,
        surface.slopeRight[j]!,
        surface.curveRight[j]!,
        surface.riseRight[j]!,
        -1,
      );
    }
    return { left, right, radius: guess };
  }
}

/** A point. */
type Vec3 = [number, number, number];
