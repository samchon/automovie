import { AutoMovieHumanHeadJawBody } from "./AutoMovieHumanHeadJawBody";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { IAutoMovieHumanHeadMandible } from "./IAutoMovieHumanHeadMandible";
import type { IAutoMovieHumanHeadSection } from "./IAutoMovieHumanHeadSection";

/**
 * The jaw joined to the bodies of a section along a ray by a smooth minimum
 * whose width grows under the border, where the skin under the jaw meets the
 * neck, with the march that finds the outline.
 */
export namespace AutoMovieHumanHeadJawJoin {
  /**
   * The outline along a ray with the jaw joined: the outermost root of a smooth
   * minimum, of absolute width, of the distance past the bodies' outline and
   * the jaw's signed distance. A width in millimetres, unlike the bodies' scale
   * union, swells the skin by a quarter of it at most where the two meet flush,
   * and rounds the hollow between the jaw's underside and the neck by about it;
   * {@link blendAt} sets it.
   */
  export function jawed(
    section: IAutoMovieHumanHeadSection,
    ox: number,
    theta: number,
    base: number,
  ): number {
    const m: IAutoMovieHumanHeadMandible | undefined = section.jaw;
    if (m === undefined) return base;
    const c: number = Math.cos(theta);
    const n: number = Math.sin(theta);
    const cos: number = Math.cos(section.tilt);
    const sin: number = Math.sin(section.tilt);
    // The march steps no further than the widest blend can reach.
    const k: number = Math.max(m.blend, m.throat);
    const join = (r: number): [number, number] => {
      const xi: number = ox + r * c;
      const x: number = xi * cos;
      const y: number = section.station + xi * sin;
      const d: number = AutoMovieHumanHeadJawBody.mandible(m, x, y, r * n);
      return [AutoMovieHumanHeadMath.softMin(r - base, d, blendAt(m, x, y, r * n)), d];
    };
    let inside: number = -1;
    let outside: number = -1;
    for (let r: number = base, i: number = 0; i < 400; i++) {
      const [v, d] = join(r);
      if (v < 0) {
        inside = r;
        outside = -1;
      } else if (outside < 0) outside = r;
      if (v >= 0 && d > JAW_REACH) break;
      r += Math.max(JAW_STEP, Math.abs(d) - k);
    }
    if (inside < 0) return base;
    if (outside < 0) return inside;
    let lo: number = inside;
    let hi: number = outside;
    for (let i: number = 0; i < 32; i++) {
      const mid: number = (lo + hi) / 2;
      if (join(mid)[0] < 0) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  /**
   * Width of the jaw's blend at a point: its own over and beside the jaw, the
   * throat's under the border and well inside the arch, where the skin under
   * the jaw meets the neck at the cervicomental angle. The sections cross that
   * hollow nearly along the skin under the jaw, so a blend of the jaw's own
   * 6 mm turned it within one layer and shaded it as a row of facets. Within a
   * round of the arch the throat's width would swell the chin's sides, where
   * the jaw and the face meet nearly flush, and round the border away.
   */
  function blendAt(m: IAutoMovieHumanHeadMandible, x: number, y: number, z: number): number {
    const below: number = (m.menton + (m.chin - x) * m.slope - y) * m.cos;
    const inside: number = -AutoMovieHumanHeadJawBody.arch(m, x, y, z);
    return (
      m.blend +
      (m.throat - m.blend) *
        AutoMovieHumanHeadMath.smooth(below / m.round) *
        AutoMovieHumanHeadMath.smooth((inside - m.round) / m.round)
    );
  }
}

/** Least step along a ray near the jaw, millimetres. */
const JAW_STEP: number = 0.4;

/** Distance from the jaw past which a ray has left it, millimetres. */
const JAW_REACH: number = 80;
