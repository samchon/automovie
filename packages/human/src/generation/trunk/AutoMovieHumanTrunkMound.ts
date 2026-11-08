import { AutoMovieLoftRelief, type IAutoMovieLoftRelief } from "@automovie/engine";

/**
 * A soft-tissue mound composed into S00's own chain as an engine relief
 * (`IAutoMovieLoftRelief`): a breast over the thorax or a buttock over the
 * pelvis, a height over a window of the trunk wall's chart (station = world
 * height, phase = polar angle from +X anterior toward +Z right), moved along
 * a fixed horizontal axis through its apex, so every section stays level and
 * the mound cannot fold back over itself.
 *
 * The mound is drawn in its own frame, origin at its apex on the wall
 * (vertical offset `v` from the apex height, across offset `a` along the
 * wall's arc from the apex's phase, at the wall's radius there), by its view
 * curves: the footprint's four half extents (upper, lower, medial, lateral),
 * and the profile `P g(rho)` with `rho` the footprint's normalized radius.
 * Above the apex height and sideways `g = (1 - rho^2)^3`, a profile that
 * leaves the wall tangentially, concave below its inflection at rho = 0.447
 * and convex over the apex; straight down `g = (1 - rho^4)^3`, a fuller lower
 * pole that still meets the wall with zero height, slope and curvature (the
 * cube keeps every edge C2: the former square, `(1 - rho^4)^2`, met the wall
 * with a curvature jump that drew a hard crease along the whole fold). The
 * inner exponent changes smoothly with the direction below the apex's
 * level, through `sin^2` of the direction angle.
 *
 * The engine's height field is a tensor-product uniform cubic B-spline whose
 * three outer control rings are zero. Its control heights are the profile at
 * each control's centre (Schoenberg's variation-diminishing approximation,
 * exact for linear data), so the field is the C2 smoothing of the law: a
 * declared bounded approximation, and the field is rescaled once so its
 * actual height at the apex equals `P` exactly.
 */
export namespace AutoMovieHumanTrunkMound {
  /** A mound's own view curves and placement. */
  export interface ISpec {
    /** Relief name, such as `breast.left`. */
    name: string;

    /** Apex height, world mm. */
    station: number;

    /** Apex phase, radians. */
    phase: number;

    /** Wall radius at the apex station and phase, mm: the arc scale of the across offset. */
    radius: number;

    /** Apex height above the wall along the axis, mm. */
    projection: number;

    /** Half extents of the footprint from the apex: up, down (mm of height), medial and lateral (mm of wall arc). */
    extents: { up: number; down: number; medial: number; lateral: number };

    /** +1 when the lateral side lies at increasing phase from the apex, -1 otherwise. */
    lateral: 1 | -1;

    /**
     * The inner exponent straight down from the apex, 4 when absent (the
     * fuller lower pole of a buttock); 2 gives the lower half the upper
     * half's profile, so the apex stays the most projecting point (an f1
     * breast: her loops' most anterior point stands at the bust point, and
     * the fuller pole stood 4.5 mm ahead of her 14 mm below it).
     */
    lower?: number;

    /**
     * A measured height table replacing the profile law: heights `h[i][j]`
     * (mm) at offsets `v[i]` (mm of height from the apex, increasing) and
     * `a[j]` (mm of wall arc from the apex, positive lateral, increasing),
     * read bilinearly, faded to zero over its outer two spacings and taken as
     * zero outside; the relief's control heights are that reading as is (no
     * rescale), and the projection only records the table's value at the
     * apex.
     */
    table?: { v: number[]; a: number[]; h: number[][] };

    /**
     * The relief's motion, a unit world direction; absent, the horizontal
     * through the apex phase `(cos phase, 0, sin phase)`. A mound reaching a
     * tilted open bottom moves along that bottom plane's own direction at its
     * phase, so the end ring stays in its plane.
     */
    axis?: [number, number, number];
  }

  /** Control rows across the window's stations. */
  export const ROWS: number = 23;

  /** Control columns across the window's phases. */
  export const COLUMNS: number = 19;

  /** The profile `g` at a footprint offset (`v` mm up, `a` mm of arc toward the lateral side); zero outside the footprint. */
  export function profile(spec: ISpec, v: number, a: number): number {
    if (spec.table !== undefined) return spec.projection !== 0 ? lookup(spec.table, v, a) / spec.projection : 0;
    const e: ISpec["extents"] = spec.extents;
    const eta: number = v / (v >= 0 ? e.up : e.down);
    const xi: number = a / (a >= 0 ? e.lateral : e.medial);
    const rho: number = Math.hypot(xi, eta);
    if (!(rho < 1)) return 0;
    const below: number = v < 0 ? (eta * eta) / (rho * rho) : 0;
    const n: number = 2 + ((spec.lower ?? 4) - 2) * below;
    return Math.pow(1 - Math.pow(rho, n), 3);
  }

  /** Build the engine relief: window, axis and the control net, rescaled to the projection at the apex. */
  export function relief(spec: ISpec): IAutoMovieLoftRelief {
    const e: ISpec["extents"] = spec.extents;

    // Window: the footprint widened by one control spacing at each side, so
    // the three zero outer rings lie outside it.
    const dy: number = (e.up + e.down) / (ROWS - 5);
    const stations: [number, number] = [spec.station - e.down - dy, spec.station + e.up + dy];
    const lo: number = spec.lateral > 0 ? e.medial : e.lateral;
    const hi: number = spec.lateral > 0 ? e.lateral : e.medial;
    const dt: number = (lo + hi) / spec.radius / (COLUMNS - 5);
    const phases: [number, number] = [spec.phase - lo / spec.radius - dt, spec.phase + hi / spec.radius + dt];
    const axis: [number, number, number] = spec.axis ?? [Math.cos(spec.phase), 0, Math.sin(spec.phase)];

    // Control j stands at parameter j - 1 of [0, n - 3] over the window.
    const heights: number[] = [];
    for (let i: number = 0; i < ROWS; ++i)
      for (let j: number = 0; j < COLUMNS; ++j) {
        const outer: boolean = i < 3 || j < 3 || i >= ROWS - 3 || j >= COLUMNS - 3;
        const s: number = stations[0] + ((i - 1) / (ROWS - 3)) * (stations[1] - stations[0]);
        const t: number = phases[0] + ((j - 1) / (COLUMNS - 3)) * (phases[1] - phases[0]);
        const a: number = (t - spec.phase) * spec.radius * spec.lateral;
        heights.push(outer ? 0 : spec.table !== undefined ? lookup(spec.table, s - spec.station, a) : spec.projection * profile(spec, s - spec.station, a));
      }
    const draft: IAutoMovieLoftRelief = { name: spec.name, stations, phases: [wrap(phases[0]), wrap(phases[1])], axis, rows: ROWS, columns: COLUMNS, heights };
    // A measured table is traced as read (its control heights are the table at their centres, no rescale:
    // its apex value can be small or change sign). A law profile is rescaled once so its apex stands at
    // the projection; a hollow (negative projection) the same way; only a vanishing apex leaves the net flat.
    if (spec.table !== undefined) return draft;
    const apex: number = AutoMovieLoftRelief.height(draft, spec.station, spec.phase)[0];
    const gain: number = apex !== 0 ? spec.projection / apex : 0;
    return { ...draft, heights: heights.map((h: number): number => h * gain) };
  }
}

/**
 * Bilinear reading of a mound's height table, zero outside its grid. A table
 * read from a reference does not vanish at its border, so the reading fades
 * over the outer two grid spacings of each side by the quintic smoothstep of
 * the distance to the border (zero value, slope and curvature at the border,
 * untouched inside): the relief's zero outer control rings then meet a
 * table that is already zero, instead of a step the B-spline would round
 * into a ridge. A table that must keep its value at a border (an open end)
 * repeats that row past it, so the fade lies outside the surface.
 */
function lookup(table: { v: number[]; a: number[]; h: number[][] }, v: number, a: number): number {
  const fade = (axis: number[], x: number): number => {
    const band: number = 2 * Math.abs(axis[1]! - axis[0]!);
    const t: number = Math.min(1, Math.max(0, Math.min(x - axis[0]!, axis[axis.length - 1]! - x) / band));
    return t * t * t * (10 - 15 * t + 6 * t * t);
  };
  return bilinear(table, v, a) * fade(table.v, v) * fade(table.a, a);
}

/** Bilinear reading of a table; zero outside its grid. */
function bilinear(table: { v: number[]; a: number[]; h: number[][] }, v: number, a: number): number {
  const index = (axis: number[], x: number): [number, number] | null => {
    if (!(x >= axis[0]! && x <= axis[axis.length - 1]!)) return null;
    let i: number = 0;
    while (i < axis.length - 2 && x > axis[i + 1]!) ++i;
    return [i, (x - axis[i]!) / (axis[i + 1]! - axis[i]!)];
  };
  const iv: [number, number] | null = index(table.v, v);
  const ia: [number, number] | null = index(table.a, a);
  if (iv === null || ia === null) return 0;
  const [i, s] = iv;
  const [j, t] = ia;
  const h = (r: number, c: number): number => table.h[r]![c]!;
  return (1 - s) * ((1 - t) * h(i, j) + t * h(i, j + 1)) + s * ((1 - t) * h(i + 1, j) + t * h(i + 1, j + 1));
}

/** Phase reduced to [0, 2 pi). */
function wrap(t: number): number {
  const r: number = t % (2 * Math.PI);
  return r < 0 ? r + 2 * Math.PI : r;
}
