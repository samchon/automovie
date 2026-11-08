import { AutoMovieViewSection, type IAutoMovieLoftRelief } from "@automovie/engine";

import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import { AutoMovieHumanHeadF1Lines } from "./AutoMovieHumanHeadF1Lines";
import { AutoMovieHumanHeadF1Pose } from "./AutoMovieHumanHeadF1Pose";
import type { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";
import { AutoMovieHumanHeadMassCurves } from "./AutoMovieHumanHeadMassCurves";
import type { AutoMovieHumanHeadNeckCourse } from "./AutoMovieHumanHeadNeckCourse";
import type { AutoMovieHumanHeadProfile } from "./AutoMovieHumanHeadProfile";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Knot = AutoMovieHumanHeadMassCurves.IKnot;

/**
 * The nose, upper lip, lower lip and chin as reliefs over head.mass's deep
 * plane (its anterior outline passes the subnasale, the stomion and the
 * chin's fillet), all reading one midline profile
 * (`AutoMovieHumanHeadProfile`).
 *
 * Each feature's midline is the profile's forward place as a function of
 * height, `X(y)`, a C2 minimum-energy chain (`AutoMovieHumanFairOutline`)
 * through its profile points with their declared tangents: the nose from the
 * subnasale (the columella's tangent) through the pronasale (the tip's
 * vertical tangent) to the nasion; the upper lip from the stomion through
 * labrale superius (its vertical tangent) to the subnasale; the lower lip
 * from the sulcus (its vertical tangent) through labrale inferius to the
 * stomion; the chin from the gnathion's place on the mass through the soft
 * pogonion to the sulcus. A horizontal ray from the face at a height between
 * the subnasale and the pronasale meets the nose first at the columella, so
 * that underside is a single height along the forward axis. Each relief
 * raises the base point forward by
 *
 *   height(y, phi) = R(X(y) - x_m(y)) * W(z / w(y))
 *
 * with `x_m` the mass's anterior place, `R` the C2 ramp over the sampling
 * (a profile behind the mass adds nothing, without a slope break), `z` the
 * base point's half breadth, `w` the feature's half width and
 * `W(u) = (1 - u^2)^3` (zero with its first two derivatives at the feature's
 * edge). Widths: the nose from `DORSUM` at the nasion to half al-al (public)
 * at the subnasale, linear in height (DEBT); the lips half ch-ch (public);
 * the chin `CHIN` (DEBT). The upper and lower lips are two reliefs that both
 * vanish at the stomion on the deep plane, so the vermilions stay distinct
 * along the stomion line; their path to two separate contacting sheets for
 * an opening mouth (#3090's native lip inputs) is open design debt.
 *
 * Sampling rule (`AutoMovieHumanHeadJawRelief`): every sampling across a
 * feature edge is at most a quarter of it; here the smallest edge is the
 * thinner vermilion height (public), so the nets' station and phase spans and
 * the loft's layers there (the nets' rows are layer keys) are at most a
 * quarter of it. Controls sit at their Greville abscissae, three outer rings
 * zero (C2 edges).
 */
export namespace AutoMovieHumanHeadFaceRelief {
  /** DEBT: the nasal dorsum's half width at the nasion, mm (no published soft-tissue dorsal width read). */
  export const DORSUM: number = 6;

  /** DEBT: the soft chin's half width, mm (no published soft-tissue chin breadth read). */
  export const CHIN: number = 18;

  /** Philtrum width between the philtral columns at the vermilion border, women, mm: 14.19 +- 2.23 (3D lip morphology, Chinese women; a Korean photogrammetric sample gives 10.2); the cupid's bow peaks stand on the columns. */
  export const PHILTRUM: number = 14.19;

  /** DEBT: the cupid's bow peaks' rise above the midline notch, mm (the published bow angle, 116.75 degrees in Korean women, is not read with its landmarks; no linear depth read). */
  export const BOW: number = 1.5;

  /**
   * The lips' plan as a station map (the engine's relief `shift`): at the
   * lateral offset `z` the vermilion border stands at `border(z)`, f1's
   * authored border line in the mouth's frame (`line`, `[|z|, height above
   * the stomion]` to the commissure). The map takes a station between the
   * stomion and that border to the midline's vermilion proportionally, and
   * one between the border and the lip's far end (the subnasale, or the
   * sulcus) to the midline's cutaneous lip, so the vermilion borders move
   * while the cutaneous lips stay; the returned value is the map less the
   * station.
   */
  function lipMap(sto: number, far: number, line: [number, number][]): (y: number, z: number) => number {
    // f1 first (owner, 2026-11-08 13:1x): the border's height above the stomion is f1's authored knots in the mouth's frame (`AutoMovieHumanHeadF1Lines.MOUTH`), a fair chain in |z| level at the midline. Later algorithmization: the midline border tapered elliptically to the commissures and lifted by `BOW` sin^2 on the philtral columns (`PHILTRUM`).
    const zs: number[] = line.map((k: [number, number]): number => k[0]);
    const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(line.map((k: [number, number], i: number): AutoMovieHumanFairOutline.IKnot => ({ q: k[0], value: k[1], slope: i === 0 ? 0 : null })));
    const half: number = zs[zs.length - 1]!;
    const mid: number = sto + line[0]![1];
    return (y: number, z: number): number => {
      const border: number = sto + AutoMovieHumanFairOutline.evaluate(zs, jets, Math.min(half, Math.abs(z)))[0];
      const span: number = border - sto;
      if (!(Math.abs(span) > 0.2)) return mid + ((y - sto) * (far - mid)) / (far - sto) - y;
      const between: boolean = (y - sto) * Math.sign(mid - sto) <= Math.abs(span);
      const mapped: number = between ? sto + ((y - sto) * (mid - sto)) / span : mid + ((y - border) * (far - mid)) / (far - border);
      return mapped - y;
    };
  }

  /** DEBT: the dorsum's declared concave shape (no published rhinion place or supratip depth read in the time box): the rhinion at this share of the way from the pronasale up to the nasion, this far behind the chord, mm. */
  export const RHINION: [number, number] = [0.55, 1.5];

  /** DEBT: the supratip break at this share of the way from the pronasale up to the nasion, this far behind the chord, mm. */
  export const SUPRATIP: [number, number] = [0.15, 2];

  /** DEBT: the infratip lobule at this share of the way from the subnasale up to the pronasale, this far ahead of their chord, mm (no published columella point Cm place read). */
  export const LOBULE: [number, number] = [0.7, 2.5];

  // f1 first (owner, 2026-11-08 13:1x): the nose's profile between the subnasale and the nasion is f1's authored knots (`AutoMovieHumanHeadF1Lines.NOSE`). Later algorithmization: the declared lobule (LOBULE ahead of the sn-prn chord) and the concave dorsum (SUPRATIP, RHINION behind the prn-n chord).

  /**
   * The soft chin between the menton and the soft pogonion: the exact
   * quarter ellipse in their tangent box (Liming's conic of weight 1/sqrt 2,
   * as the throat's fillet), whose tangents are those the landmarks'
   * definitions fix: horizontal at the menton (the chin's lowest point) and
   * vertical at the pogonion (its most prominent point). Its centre is the
   * menton's forward place at the pogonion's height, its semi-axes the two
   * landmarks' forward and vertical separations. Knots at 30 and 60 degrees
   * from the menton carry the ellipse's own slope dX/dy = (a cos t) / (b sin t),
   * so the chain follows the conic between them (her mid-chin point, read
   * 2026-11-08, stands 0.2 mm off it). It replaces the declared chord bulge.
   */
  function chinEllipse(upMe: Vec3, upPg: Vec3): { y: number; x: number; slope: number | null }[] {
    // The tangent box is the landmarks' definitions in the zero (Frankfort) frame; the knots return to her upright frame (`AutoMovieHumanHeadF1Pose`).
    const me: Vec3 = AutoMovieHumanHeadF1Pose.frankfort(upMe);
    const pg: Vec3 = AutoMovieHumanHeadF1Pose.frankfort(upPg);
    const a: number = pg[0] - me[0];
    const b: number = pg[1] - me[1];
    if (!(a > 0) || !(b > 0)) throw new Error(`head chin: the soft pogonion (${pg[0].toFixed(1)}, ${pg[1].toFixed(1)}) does not stand ahead of and above the menton (${me[0].toFixed(1)}, ${me[1].toFixed(1)})`);
    return [30, 60].map((deg: number): { y: number; x: number; slope: number | null } => {
      const t: number = (deg * Math.PI) / 180;
      const p: Vec3 = AutoMovieHumanHeadF1Pose.upright([me[0] + a * Math.sin(t), pg[1] - b * Math.cos(t), 0]);
      return { y: p[1], x: p[0], slope: AutoMovieHumanHeadF1Pose.slope((a * Math.cos(t)) / (b * Math.sin(t))) };
    });
  }

  /** What the reliefs read, head frame. */
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

    /** The midline profile. */
    profile: AutoMovieHumanHeadProfile.IOutput;
  }

  /** The reliefs and the drawn midline. */
  export interface IOutput {
    /** Nose, upper lip, lower lip and chin, stations in the head frame. */
    reliefs: IAutoMovieLoftRelief[];

    /** The features' midlines X(y), sampled every millimetre, head frame. */
    midline: Vec3[];
  }

  /** One feature's midline chain and width. */
  interface IFeature {
    name: string;
    knots: { y: number; x: number; slope: number | null }[];
    width: (y: number) => number;
    shift?: (y: number, z: number) => number;
  }

  /** Build the four reliefs. */
  export function create(input: IInput): IOutput {
    const M: typeof AutoMovieHumanHeadMassCurves = AutoMovieHumanHeadMassCurves;
    const P: Record<AutoMovieHumanHeadProfile.Name, Vec3> = input.profile.points;
    const D: AutoMovieHumanHeadFrankfort.IDims = input.head.dims;
    const L: number = input.length;
    const mass: (y: number) => number = (y: number): number => input.course.frame(y).origin[0] + M.value(input.outlines.anterior, y, L)[0];
    // Her pose (`AutoMovieHumanHeadF1Pose`): the zero frame's vertical tangents (the most prominent points: pronasale, labrale superius and inferius, the sulcus, the pogonion) lean by her FH's pitch in the upright frame where the reliefs are built; the authored nose knots pass through the pose's rotation.
    const vertical: number | null = AutoMovieHumanHeadF1Pose.slope(0);
    const nose: { y: number; x: number; slope: number | null }[] = AutoMovieHumanHeadF1Lines.NOSE.map((k: { y: number; x: number; slope: number | null }): { y: number; x: number; slope: number | null } => {
      const p: Vec3 = AutoMovieHumanHeadF1Pose.upright([k.x, k.y, 0]);
      return { y: p[1], x: p[0], slope: AutoMovieHumanHeadF1Pose.slope(k.slope) };
    });
    const features: IFeature[] = [
      {
        name: "nose",
        knots: [
          // The columella's direction at Sn (the nasolabial angle) is left to the chain: as a fixed slope it drove the chain 5 mm ahead of the pronasale below the tip (render 10:10); the angle is the profile's check.
          { y: P.sn[1], x: P.sn[0], slope: null },
          ...nose.filter((k: { y: number }): boolean => k.y < P.prn[1]),
          { y: P.prn[1], x: P.prn[0], slope: vertical },
          ...nose.filter((k: { y: number }): boolean => k.y > P.prn[1]),
          { y: P.n[1], x: P.n[0], slope: null },
        ],
        width: (y: number): number => D.nose / 2 + ((DORSUM - D.nose / 2) * (y - P.sn[1])) / (P.n[1] - P.sn[1]),
      },
      {
        name: "lip.upper",
        knots: [
          { y: P.sto[1], x: P.sto[0], slope: null },
          { y: P.ls[1], x: P.ls[0], slope: vertical },
          { y: P.sn[1], x: P.sn[0], slope: null },
        ],
        width: (): number => AutoMovieHumanHeadF1Lines.MOUTH.half,
        shift: lipMap(P.sto[1], P.sn[1], AutoMovieHumanHeadF1Lines.MOUTH.upper),
      },
      {
        name: "lip.lower",
        knots: [
          { y: P.si[1], x: P.si[0], slope: vertical },
          { y: P.li[1], x: P.li[0], slope: vertical },
          { y: P.sto[1], x: P.sto[0], slope: null },
        ],
        width: (): number => AutoMovieHumanHeadF1Lines.MOUTH.half,
        shift: lipMap(P.sto[1], P.si[1], AutoMovieHumanHeadF1Lines.MOUTH.lower),
      },
      {
        name: "chin",
        knots: [
          { y: P.gn[1], x: mass(P.gn[1]), slope: null },
          ...chinEllipse(input.head.points.me, P.pg),
          { y: P.pg[1], x: P.pg[0], slope: vertical },
          { y: P.si[1], x: P.si[0], slope: vertical },
        ],
        width: (): number => CHIN,
      },
    ];
    for (const f of features)
      for (let i: number = 1; i < f.knots.length; ++i)
        if (!(f.knots[i]!.y > f.knots[i - 1]!.y)) throw new Error(`head ${f.name}: the profile points are not in increasing height`);

    // Sampling: a quarter of the thinner vermilion (public).
    const spacing: number = Math.min(input.head.points.ls[1] - input.head.points.sto[1], input.head.points.sto[1] - input.head.points.li[1]) / 4;
    const radius: number = Math.max(...features.map((f: IFeature): number => Math.max(...f.knots.map((k: { x: number; y: number }): number => k.x - input.course.frame(k.y).origin[0]))));
    const reliefs: IAutoMovieLoftRelief[] = [];
    const midline: Vec3[] = [];
    for (const f of features) {
      const ys: number[] = f.knots.map((k: { y: number }): number => k.y);
      const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(f.knots.map((k: { y: number; x: number; slope: number | null }): AutoMovieHumanFairOutline.IKnot => ({ q: k.y, value: k.x, slope: k.slope })));
      const X: (y: number) => number = (y: number): number => AutoMovieHumanFairOutline.evaluate(ys, jets, y)[0];
      const y0: number = ys[0]!;
      const y1: number = ys[ys.length - 1]!;
      for (let y: number = y0; y <= y1; y += 1) midline.push([X(y), y, 0]);

      // The net: rows across [y0, y1] plus three zero rings beyond each end,
      // columns across the widest half width plus three beyond each side.
      const rows: number = Math.ceil((y1 - y0) / spacing) + 7;
      const ds: number = (y1 - y0) / (rows - 7);
      const s0: number = y0 - 2 * ds;
      const wide: number = Math.max(...ys.map(f.width));
      const reach: number = Math.atan2(wide, radius) * 1.15 + (3 * spacing) / radius;
      const columns: number = Math.ceil((2 * reach * radius) / spacing) + 3;
      const dphi: number = (2 * reach) / (columns - 3);
      const heights: number[] = [];
      const shifts: number[] = [];
      for (let i: number = 0; i < rows; ++i) {
        const y: number = s0 + (i - 1) * ds;
        const inner: boolean = i >= 3 && i < rows - 3 && y >= y0 - 1e-9 && y <= y1 + 1e-9;
        const H: number = inner ? ramp(X(y) - mass(y), spacing) : 0;
        const l: number = M.value(input.outlines.lateral, y, L)[0];
        // The section is read on every inner row: a lip's station map moves the reading where the height here is zero.
        const section: AutoMovieViewSection.ISection | null =
          i >= 3 && i < rows - 3
            ? AutoMovieViewSection.of(
                { extents: [M.value(input.outlines.anterior, y, L)[0], l, M.value(input.outlines.posterior, y, L)[0], l] },
                [M.fullness(input.fullness.anterior, y), M.fullness(input.fullness.posterior, y), M.fullness(input.fullness.posterior, y), M.fullness(input.fullness.anterior, y)],
              )
            : null;
        const w: number = f.width(y);
        for (let j: number = 0; j < columns; ++j) {
          if (section === null || j < 3 || j >= columns - 3) {
            heights.push(0);
            shifts.push(0);
            continue;
          }
          const phi: number = -reach + (j - 1) * dphi;
          const z: number = AutoMovieViewSection.radius(section, phi)[0] * Math.sin(phi);
          const u: number = Math.min(1, Math.abs(z) / w);
          const fall: number = 1 - u * u;
          heights.push(H * fall * fall * fall);
          shifts.push(f.shift === undefined ? 0 : f.shift(y, z));
        }
      }
      reliefs.push({ name: f.name, stations: [s0, s0 + (rows - 3) * ds], phases: [-reach, reach], axis: [1, 0, 0], rows, columns, heights, ...(f.shift === undefined ? {} : { shift: shifts }) });
    }
    return { reliefs, midline };
  }

  /** The C2 ramp: zero below `-w/2`, the identity above `w/2`, between them `w` times the smoothstep's integral (2.5 u^4 - 3 u^5 + u^6, u = t / w + 1/2). */
  function ramp(t: number, w: number): number {
    const u: number = t / w + 0.5;
    if (u <= 0) return 0;
    if (u >= 1) return t;
    return w * u * u * u * u * (2.5 + u * (-3 + u));
  }
}
