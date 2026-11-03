import { AutoMovieHumanHeadRadius } from "./AutoMovieHumanHeadRadius";
import { AutoMovieHumanHeadRelief } from "./AutoMovieHumanHeadRelief";
import { AutoMovieHumanHeadSection } from "./AutoMovieHumanHeadSection";
import { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";
import type { IAutoMovieHumanHeadSection } from "./IAutoMovieHumanHeadSection";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * The stations of a head chain, spaced by the surface they cut: dense where
 * the head turns quickly along its height (the chin's underside and the
 * throat, the lips, the nose's base, the crown), as coarse as the ring's own
 * sampling where it is flat.
 *
 * Rule: a chain whose rings are sampled at `samples` points keeps its skin's
 * quads isotropic in both size and turn. Between two stations the skin may
 * advance no further along a guide than the ring's sample spacing (the ring's
 * perimeter over `samples`), and may turn no more than the ring turns between
 * two samples, `2 pi / samples`. Along a guide `x(s)` of the station `s` the
 * arclength per unit station is `sqrt(1 + x'^2)` and the turn per unit station
 * is `|x''| / (1 + x'^2)`, so the station density (stations per millimetre) is
 * the largest over the guides of
 * `max(sqrt(1 + x'^2) / spacing, |x''| / (1 + x'^2) / (2 pi / samples))`,
 * held at most at one station per opening pitch (`AutoMovieHumanMouth.PITCH`,
 * the spacing the skin takes near an aperture's rim, which a finer pitch would
 * let a cut vertex snap across). The guides are the skin of the section's
 * plane along its forward, lateral and backward rays: the base outline
 * (`AutoMovieHumanHeadRadius`, the face, the cranium, the temple sector and
 * the jaw) with the reliefs on it, so the median front profile, the chin's
 * underside, the throat, the face's lateral boundary and the back profile all
 * set the spacing. Stations are placed at equal shares of the integrated
 * density, so the count is the rule's, not a constant.
 */
export namespace AutoMovieHumanHeadStationDensity {
  /**
   * Stations from `a` to `b`, both included, at equal shares of the station
   * density's integral.
   *
   * @param surface The head's surface, its jaw and reliefs ready (after the pass's build).
   * @param a First station, calibration millimetres.
   * @param b Last station, above `a`.
   * @param samples Points per ring of the chain the stations cut.
   * @returns Strictly increasing stations.
   */
  export function stations(surface: IAutoMovieHumanHeadSurface, a: number, b: number, samples: number): number[] {
    // The density is read on a grid at half the opening pitch, the finest
    // spacing a station may take, so every station the rule places is
    // resolved. Each grid node's guides are cut once, and its slope and
    // curvature are the central differences of its two neighbours.
    const fine: number = Math.max(2, Math.ceil((b - a) / (AutoMovieHumanMouth.PITCH / 2)));
    const step: number = (b - a) / fine;
    const nodes: IGuides[] = Array.from(
      { length: fine + 3 },
      (_: unknown, i: number): IGuides => guides(surface, a + (i - 1) * step),
    );
    const rate: number[] = Array.from(
      { length: fine + 1 },
      (_: unknown, i: number): number => density(nodes[i]!, nodes[i + 1]!, nodes[i + 2]!, samples, step),
    );
    const total: number[] = [0];
    for (let i: number = 0; i < fine; i++) total.push(total[i]! + ((rate[i]! + rate[i + 1]!) / 2) * step);

    // At least one station per unit of the integral, and both ends.
    const count: number = Math.max(2, Math.ceil(total[fine]!) + 1);
    const out: number[] = [a];
    let j: number = 0;
    for (let k: number = 1; k + 1 < count; k++) {
      const target: number = (total[fine]! * k) / (count - 1);
      while (j + 1 < fine && total[j + 1]! < target) j++;
      const span: number = total[j + 1]! - total[j]!;
      out.push(a + (j + (span > 0 ? (target - total[j]!) / span : 0)) * step);
    }
    out.push(b);
    return out;
  }

  /**
   * Stations per millimetre at a grid node, from the guides there and at its
   * two neighbours.
   *
   * @param lo The guides one step under the node.
   * @param mid The guides at the node.
   * @param hi The guides one step over the node.
   * @param samples Points per ring.
   * @param step Station step between the nodes, millimetres.
   * @returns Density, stations per millimetre.
   */
  function density(lo: IGuides, mid: IGuides, hi: IGuides, samples: number, step: number): number {
    // The ring's sample spacing: the perimeter of the ellipse of the section's
    // half length and half width (Ramanujan's approximation, within 0.01
    // percent for a head's proportions) over the ring's samples.
    const a: number = Math.max(1, (mid.front - mid.back) / 2);
    const w: number = Math.max(1, mid.half);
    const perimeter: number = Math.PI * (3 * (a + w) - Math.sqrt((3 * a + w) * (a + 3 * w)));
    const spacing: number = perimeter / samples;
    const turn: number = (2 * Math.PI) / samples;

    let most: number = 1 / spacing;
    for (const key of ["front", "back", "half"] as const) {
      const slope: number = (hi[key] - lo[key]) / (2 * step);
      const bend: number = Math.abs(hi[key] - 2 * mid[key] + lo[key]) / (step * step);
      const run: number = 1 + slope * slope;
      most = Math.max(most, Math.sqrt(run) / spacing, bend / run / turn);
    }
    return Math.min(most, 1 / AutoMovieHumanMouth.PITCH);
  }

  /** The skin of a section's plane along three rays, in the plane's own coordinates. */
  interface IGuides {
    /** Forward place of the skin on the forward ray, mm. */
    front: number;

    /** Forward place of the skin on the backward ray, mm. */
    back: number;

    /** Lateral place of the skin on the left lateral ray, mm. */
    half: number;
  }

  /**
   * The skin along the section's forward, left lateral and backward rays from
   * its centre at a station: the base outline's radius there plus the relief
   * at that base point, as `AutoMovieHumanHeadSkin` places them.
   */
  function guides(surface: IAutoMovieHumanHeadSurface, s: number): IGuides {
    const m: IAutoMovieHumanHeadSection = AutoMovieHumanHeadSection.section(surface.compiled, surface.plan, s);
    const ox: number = (m.front + m.back) / 2;
    const cos: number = Math.cos(m.tilt);
    const sin: number = Math.sin(m.tilt);
    const along = (theta: number): number => {
      const r: number = AutoMovieHumanHeadRadius.radius(m, ox, theta);
      const xi: number = ox + r * Math.cos(theta);
      const z: number = r * Math.sin(theta);
      return AutoMovieHumanHeadRelief.merged(surface, r, xi * cos, s + xi * sin, z, 1);
    };
    return {
      front: ox + along(0),
      back: ox - along(Math.PI),
      half: along(Math.PI / 2),
    };
  }
}
