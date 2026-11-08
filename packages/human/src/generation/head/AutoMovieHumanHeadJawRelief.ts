import { AutoMovieViewSection, type IAutoMovieLoftRelief } from "@automovie/engine";

import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanHeadF1Pose } from "./AutoMovieHumanHeadF1Pose";
import type { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";
import { AutoMovieHumanHeadMassCurves } from "./AutoMovieHumanHeadMassCurves";
import type { AutoMovieHumanHeadNeckCourse } from "./AutoMovieHumanHeadNeckCourse";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Knot = AutoMovieHumanHeadMassCurves.IKnot;

/**
 * The jaw relief over head.mass, one per side: the mandible inside the
 * gonial wedge, raised over a mass that carries only the neck there.
 *
 * A level section's lateral extreme stands at the course origin, about 30 mm
 * behind the gonion at its height, where only the neck reaches; the jaw is
 * wider than the neck ahead of that extreme. A jaw width on the mass's
 * lateral outline widened the neck behind the jaw, and every way of taking it
 * back left a step around the section (a groove ring at 06:12, a horizontal
 * crease from the cheek to the back at 07:21 on 2026-11-08). So head.mass
 * carries the neck's half breadth up to the gonion and this relief adds the
 * jaw where the mandible is.
 *
 * The wedge, in the side view (head frame): its corner the gonion (on the
 * tragion line at the gonion's height), its lower side the inferior border
 * (the mandibular plane through the menton at the Frankfort-mandibular plane
 * angle, `AutoMovieHumanHeadMassCurves.FMA`), its posterior side the ramus,
 * leaving the border at the gonial angle `GONIAL`.
 *
 * The jaw's lateral surface is one plane in (height, forward place): on the
 * border its half breadth is the border's front-view chord, half go-go at the
 * gonion to zero at the menton (linear in the forward place along the
 * border), and above the border it rises with the ramus chord's slope (half
 * go-go at the gonion to half t-t at FH). A plane has no corner, so neither a
 * height nor a forward place carries a crease across the wedge (the front
 * silhouette's corner at the gonion's height, used as a target for every
 * point at that height, drew a horizontal ledge across the whole wedge at
 * 08:17). The relief raises the base point along the outward lateral axis by
 *
 *   height = R(M(Z(s, x) - z, P(s, x))) * step((x - x_b(s)) / w + 1/2) * step((x - x_r(s)) / (2 w) + 1/2)
 *
 * with `x` and `z` the base point's forward place and half breadth, `Z` that
 * plane, `P` the jaw line's prominence over the region below the border
 * (`PROMINENCE`, DEBT; tapering to zero at the menton and fading over twice
 * the roll above the border), `x_b` and `x_r` the border's and the ramus's
 * forward places at that height, `step` the C2 smoothstep across the soft
 * tissue's roll `w` (`ROLL`, DEBT) at the border and twice it behind the
 * ramus, where the parotid region fills toward the neck (DEBT); the product
 * of the two steps rounds the gonial corner by C2 (a maximum of the two lines
 * had a corner there and drew a V groove, front-left-low 08:40), and `R` and `M` the C2 ramp and the C2 maximum
 * over half the roll (a hard clamp is a slope break that the net carries as
 * a crease: the concave arcs on the cheek at 08:17, traced to the layers at
 * -26 to -14 mm, whose outline and fullness jets are smooth while the
 * relief's height turns from its fade to zero there). Behind the wedge,
 * which holds the section's lateral extreme and the whole posterior half,
 * the height is zero: the back of the neck is outside the relief by
 * construction. Above the gonion the whole height fades by the C2
 * smoothstep to zero at FH, where the ramus and the masseter end under the
 * zygomatic arch: the plane stood above the mass up to FH across the face,
 * and the window's top cut it into a horizontal crease (08:32).
 *
 * Sampling rule: an edge is resolved only when every sampling across it is at
 * most a quarter of its roll (`SPACING`): the net's control spacing in
 * station and, at the jaw's half breadth, in phase, the loft's layer spacing
 * inside the window (the net's rows are layer keys) and the ring samples of
 * the chain and of its realization. The net samples the height at its
 * control points' Greville abscissae (the uniform cubic's knot `i - 1` for
 * control `i`), its three outer rings zero, so the height and its first two
 * derivatives vanish at the window's edge (C2 with the mass).
 */
export namespace AutoMovieHumanHeadJawRelief {
  /** Gonial angle, radians: 122.72 degrees, the women's mean of a Class I adult sample (25 women, lateral cephalograms; Korean, koreascience JAKO201334460140333, read through its abstract; a normodivergent Nepalese sample gives 123.94 for 34 women). */
  export const GONIAL: number = (122.72 * Math.PI) / 180;

  /** DEBT: the soft tissue's roll across the wedge's boundary, mm (published soft-tissue thickness at the gonion not read). */
  export const ROLL: number = 12;

  /** The widest sampling an edge of `ROLL` is resolved by: a quarter of it, mm (four samples across the roll). */
  export const SPACING: number = ROLL / 4;

  /** DEBT: the jaw line's prominence over the region below the inferior border, mm (no published value read). */
  export const PROMINENCE: number = 3;

  /**
   * Phase reach of the window from the anterior midline, radians: the half ring. Above the gonion the course origin stands ahead of the ramus line, so the jaw's height stays nonzero past the lateral extreme until the ramus step takes it to zero; a window ending at about 115 degrees cut it there into a vertical crease behind the cheek (front-left-low, 2026-11-08 10:22). Behind the ramus the step makes every height zero, so the back stays outside the relief.
   */
  export const REACH: number = Math.PI;

  /** The jaw's widest half breadth the phase spacing is held at, mm (above half t-t, 75 mm for f1). */
  export const RADIUS: number = 80;

  /** What the relief reads, head frame. */
  export interface IInput {
    /** Frankfort frame, landmarks and dimensions. */
    head: AutoMovieHumanHeadFrankfort.IOutput;

    /** The course. */
    course: AutoMovieHumanHeadNeckCourse.IOutput;

    /** Vertex station, mm. */
    length: number;

    /** head.mass's outlines. */
    outlines: Record<AutoMovieHumanHeadMassCurves.Label, Knot[]>;

    /** head.mass's fullness laws. */
    fullness: { anterior: Knot[]; posterior: Knot[] };

    /** Public neck girth (ISO 8559-1 5.3.2), mm. */
    neckGirth: number;
  }

  /** The two jaw reliefs (+v side, then -v side), their stations in the head frame (the loft adds its station shift). */
  export function create(input: IInput): IAutoMovieLoftRelief[] {
    const M: typeof AutoMovieHumanHeadMassCurves = AutoMovieHumanHeadMassCurves;
    const D: AutoMovieHumanHeadFrankfort.IDims = input.head.dims;
    const me: Vec3 = input.head.points.me;
    // The mandibular plane at FMA to FH, read in her upright frame (`AutoMovieHumanHeadF1Pose.PITCH`), where the head's stations run.
    const fma: number = M.FMA - AutoMovieHumanHeadF1Pose.PITCH;
    const tan: number = Math.tan(fma);
    const goY: number = me[1] + me[0] * tan;
    const halfGo: number = D.bigonial / 2;
    const ramus: number = (D.bitragion / 2 - halfGo) / (0 - goY);
    const back: number = 1 / Math.tan(GONIAL - fma);
    // The border's height at a forward place, the jaw's plane, the
    // prominence and the wedge's boundary at a height.
    const border: (x: number) => number = (x: number): number => goY - x * tan;
    const plane: (s: number, x: number) => number = (s: number, x: number): number => halfGo * (1 - x / me[0]) + ramus * (s - border(x));
    const prominence: (s: number, x: number) => number = (s: number, x: number): number => PROMINENCE * Math.max(0, 1 - x / me[0]) * (1 - smoothstep((s - border(x)) / (2 * ROLL)));
    const borderAt: (s: number) => number = (s: number): number => (goY - s) / tan;
    const ramusAt: (s: number) => number = (s: number): number => (s - goY) * back;
    const half: number = ROLL / 2;

    // The net: station spans and phase spans no wider than `SPACING`; the
    // inner controls span the menton's height to FH and the phases from the
    // midline to `REACH`; control i sits at knot i - 1.
    // The station spacing: the border's step, `ROLL` across in forward place, is only ROLL tan(FMA) (5.6 mm) across in station, since the border falls at FMA; at `SPACING` (3 mm) the net had two rows across it and drew a dashed line along the jaw's lower border (left.4, front-left-low.4, 2026-11-08 13:47). A quarter of that width, as the sampling rule asks.
    const stationSpacing: number = (ROLL * Math.tan(fma)) / 4;
    const rows: number = Math.ceil((0 - me[1]) / stationSpacing) + 7;
    const ds: number = (0 - me[1]) / (rows - 7);
    const s0: number = me[1] - 2 * ds;
    const columns: number = Math.ceil((REACH * RADIUS) / SPACING) + 3;
    const dphi: number = REACH / (columns - 3);
    const L: number = input.length;

    const heights: number[] = [];
    for (let i: number = 0; i < rows; ++i) {
      const s: number = s0 + (i - 1) * ds;
      const inner: boolean = i >= 3 && i < rows - 3;
      const l: number = M.value(input.outlines.lateral, s, L)[0];
      const section: AutoMovieViewSection.ISection | null = inner
        ? AutoMovieViewSection.of(
            { extents: [M.value(input.outlines.anterior, s, L)[0], l, M.value(input.outlines.posterior, s, L)[0], l] },
            [M.fullness(input.fullness.anterior, s), M.fullness(input.fullness.posterior, s), M.fullness(input.fullness.posterior, s), M.fullness(input.fullness.anterior, s)],
          )
        : null;
      const origin: number = input.course.frame(s).origin[0];
      const xb: number = borderAt(s);
      const xr: number = ramusAt(s);
      for (let j: number = 0; j < columns; ++j) {
        if (section === null || j < 3 || j >= columns - 3) {
          heights.push(0);
          continue;
        }
        const phi: number = (j - 1) * dphi;
        const r: number = AutoMovieViewSection.radius(section, phi)[0];
        const x: number = origin + r * Math.cos(phi);
        const p: number = prominence(s, x);
        heights.push(ramp(p + ramp(plane(s, x) - r * Math.sin(phi) - p, half), half) * smoothstep((x - xb) / ROLL + 0.5) * smoothstep((x - xr) / (2 * ROLL) + 0.5) * (s <= goY ? 1 : 1 - smoothstep((s - goY) / (0 - goY))));
      }
    }
    const mirrored: number[] = heights.map((_: number, k: number): number => heights[Math.floor(k / columns) * columns + (columns - 1 - (k % columns))]!);
    const stations: [number, number] = [s0, s0 + (rows - 3) * ds];
    return [
      { name: "jaw.positive-v", stations, phases: [0, REACH], axis: [0, 0, 1], rows, columns, heights },
      { name: "jaw.negative-v", stations, phases: [2 * Math.PI - REACH, 2 * Math.PI], axis: [0, 0, -1], rows, columns, heights: mirrored },
    ];
  }

  /** The C2 quintic smoothstep on [0, 1], clamped outside. */
  function smoothstep(t: number): number {
    const x: number = Math.min(1, Math.max(0, t));
    return x * x * x * (10 + x * (-15 + 6 * x));
  }

  /** The C2 ramp: zero below `-w/2`, the identity above `w/2`, between them `w` times the smoothstep's integral (2.5 u^4 - 3 u^5 + u^6, u = t / w + 1/2), so its slope is the smoothstep. */
  function ramp(t: number, w: number): number {
    const u: number = t / w + 0.5;
    if (u <= 0) return 0;
    if (u >= 1) return t;
    return w * u * u * u * u * (2.5 + u * (-3 + u));
  }
}
