import fs from "node:fs";
import path from "node:path";
import type { IAutoMovieLoftRelief } from "@automovie/engine";
import { FamilyConicFit as F } from "./FamilyConicFit";
import type { FamilyConicSection as C } from "./FamilyConicSection";

/**
 * Least-squares fit of an engine relief to what lies inside a part's tape
 * wall.
 *
 * The engine moves a wall point at chart station `s` and phase `t` along the
 * relief's fixed axis by a height `d(s, t)`, a tensor-product uniform cubic
 * B-spline over the relief's window with its three outer rings of control
 * points zero (`AutoMovieLoftRelief`). The height that carries a wall point
 * onto the observed skin is the distance from that point to the observed
 * section along the axis, so the control heights solve a linear
 * least-squares problem; a second-difference penalty keeps the net fair
 * where the observations leave it open.
 */
export namespace FamilyConicRelief {
  /** A relief window to fit. */
  export interface IWindow {
    /** Relief name. */
    name: string;

    /** Station range of the window, mm. */
    stations: [number, number];

    /** Phase range of the window, radians, in increasing phase. */
    phases: [number, number];

    /** Unit world direction of the height; it must lie in the section planes. */
    axis: [number, number, number];

    /** With it, the height's direction turns with the phase about the window's middle: `cos(t - c) axis + sin(t - c) turn` (`IAutoMovieLoftRelief.turn`). */
    turn?: [number, number, number];

    /** Control points across the station range, at least 7. */
    rows: number;

    /** Control points across the phase range, at least 7. */
    columns: number;

    /** The window is centred on the median line and its net is tied symmetric across it. */
    mirror: boolean;

    /** The window goes once round (`phases` one turn apart) and its net closes on itself, with no edge in phase. */
    periodic?: boolean;

    /**
     * Farthest a cast may land from the wall and still be observed, mm; absent, any distance. A cast that slips through an opening of the skin,
     * between the lips or past an eyelid, lands on what lies behind it, and its height is not the skin's.
     */
    reach?: number;

    /**
     * How far from its first and from its last station the window takes less than the whole height, mm: the share rises smoothly from none
     * at the edge to all of it that far in. A window's outer rows are zero, so a net asked for the whole height right up to its edge falls
     * off within two rows, and the window fitted after it over the same skin cannot follow so short a fall: the edge showed as a level line
     * across the chest. Faded, the earlier net leaves a smooth remainder for the later one, which must start inside the earlier one's whole
     * part.
     */
    fade?: [number, number];

    /** The same toward the window's first and last phase, radians: a window's edge down the skin creases as its edge across it does. */
    fadePhase?: [number, number];

    /**
     * Least angle between a cast and the skin's tangent plane, degrees, for the cast to be observed; absent, any. The angle is judged on the
     * skin's 3D normal (`IRow.slope`), since a section's chart sees only its in-plane part: where the skin faces along the course, a cast in
     * the section plane runs along it and measures where an edge-on face begins, not how deep the skin lies, and the net builds a cliff there
     * (lofting.md, Composition before lofting: "Leave unobserved an observation whose cast meets the skin at a grazing angle"). Over the
     * shoulder's up-facing slope `trunk.chest.side`'s casts met the skin 4 to 13 degrees from its plane with heights of 8 to 23 mm and drew
     * the notch over each collar bone; its sound neighbours stood 36 to 43 degrees off.
     */
    graze?: number;

    /**
     * Least angle between the section plane and the skin where a cast lands, degrees, for the cast to be observed; absent, any. It is read
     * from the skin's rise along the station (`IRow.slope`): the angle is that between the skin's 3D normal and the course. Where the skin
     * faces along the course the plane cuts it at a shallow angle, the cut moves far within a millimetre of station, and the section's loop
     * there is not a sampling of the skin a cast in it can see (lofting.md, Composition before lofting: "A relief's cast must see the skin it
     * carries"). Such skin is a cast's along the course, such as the shoulder's straight down.
     */
    plane?: number;

    /**
     * The hold is judged where a cast lands only, not also where it starts on the wall. A wall that stands out over a neighbour's box says
     * nothing about the skin under it: the trunk's head stood 4 to 7 mm proud of the skin round the ear's bowl (s 796, x 4 to 24), its
     * casts landed on head skin 72.5 to 75.5 mm out, outside the ear's box (past 77 mm), and were held because their wall points stood in
     * it, which left the shelf on the tape wall at 77 to 80 mm.
     */
    holdLanding?: boolean;
  }

  /** One observed section with the wall beneath it. */
  export interface IRow {
    /** Station, mm. */
    s: number;

    /** Observed skin polygon in the section chart, mm. */
    skin: C.P[];

    /** The wall's chart point at a phase. */
    wall: (phi: number) => C.P;

    /** The relief axis projected into the section chart; its length is the share of a height that stays in the section plane. */
    axis: C.P;

    /** The window's `turn` projected likewise, when it has one. */
    turn?: C.P;

    /** Withheld from the fit. */
    heldout: boolean;

    /**
     * Whether, or how much, a chart point of the skin polygon is not this part's skin: a point of the chord that closes the cut a
     * neighbouring part leaves, or skin a neighbour owns. `true` or 1 leaves a cast that lands there unobserved; a share between weighs its
     * observation down by that much, so a neighbour's footprint can be left out over a smooth edge. An observed region that ends in a hard
     * edge is a step in what the net is asked for, and the net draws it (lofting.md, Composition before lofting: targets from C2 functions):
     * the face's nets, observing below the nose box's floor and not above, turned the upper lip by 6 degrees in one level line.
     */
    open?: (p: C.P) => boolean | number;

    /**
     * Whether, or how much, the net is held where a cast lands: the share of the observed height taken away, 1 or `true` for all of it (the
     * height observed there is zero, whatever the cast measured, so the wall stays as it was). A share that rises smoothly across the held
     * region's edge keeps the target C2 there; a held region asked for zero inside and the whole depth just outside is a step in the target,
     * and the net turns within one row along its edge (lofting.md, Composition before lofting: "A hard clamp ... becomes a crease"). The
     * ear's hard hold drew creases of 41 to 44 deg/mm round the bowl on `trunk.head`, against 2 to 4 beside them.
     */
    hold?: (p: C.P) => boolean | number;

    /**
     * How fast the skin moves out along its in-plane normal per millimetre of station at a chart point, given that normal; null where it
     * cannot be read. With it the skin's 3D normal is known and a window's `graze` applies.
     */
    slope?: (p: C.P, normal: C.P) => number | null;
  }

  /** A fitted relief and its sampled errors along the axis. */
  export interface IResult {
    /** The relief as the engine reads it. */
    relief: IAutoMovieLoftRelief;

    /** Independent control heights. */
    scalars: number;

    /** Largest height the observations ask for, mm. */
    deepestMm: number;

    /** Largest along-axis miss on fitting sections, mm. */
    trainMaxMm: number;

    /** Largest along-axis miss on withheld sections, mm. */
    heldMaxMm: number;
  }

  /** Least cosine between the relief axis and the wall's radial direction for a phase to be observed. */
  const FACING: number = 0.35;

  /** Phase samples per control span. */
  const PER_SPAN: number = 4;

  /** Weight of the squared second differences of the net against the summed squared misses, per control point. */
  const FAIR: number = 1e-3;

  /** A height observed directly at a chart point, for a window whose cast is not taken in the section planes. */
  export interface IObserved {
    /** Station, mm. */
    s: number;

    /** Phase, radians. */
    phi: number;

    /** The height that carries the base point there onto the skin, mm along the window's axis. */
    target: number;

    /** Withheld from the fit. */
    heldout: boolean;
  }

  /**
   * Fit one window.
   *
   * @param window The window.
   * @param rows Observed sections; each is cast in its own plane along the window's axis.
   * @param observed Heights observed directly at chart points, beside or instead of the sections.
   */
  export function fit(window: IWindow, rows: readonly IRow[], observed: readonly IObserved[] = []): IResult {
    const span: number = window.phases[1] - window.phases[0];
    const R: number = window.rows;
    const Cn: number = window.columns;

    // Unknowns: the inner control points, tied across the median when mirrored. A window that goes once round has no phase edge: its last
    // three columns are its first three again, which makes the uniform cubic net periodic, and no column is held at zero.
    const slot: number[] = new Array<number>(R * Cn).fill(-1);
    let unknowns: number = 0;
    for (let r: number = 3; r < R - 3; ++r)
      if (window.periodic === true)
        for (let c: number = 0; c < Cn; ++c) slot[r * Cn + c] = c >= Cn - 3 ? slot[r * Cn + c - (Cn - 3)]! : unknowns++;
      else
        for (let c: number = 3; c < Cn - 3; ++c) {
          const twin: number = r * Cn + (Cn - 1 - c);
          slot[r * Cn + c] = window.mirror && slot[twin]! >= 0 ? slot[twin]! : unknowns++;
        }

    // Observations: for each section inside the window, the along-axis height at phases across the window.
    const samples: { weights: [number, number][]; target: number; heldout: boolean; weight: number }[] = [];
    let deepest: number = 0;
    const phases: number = (Cn - 3) * PER_SPAN;

    // The share of a height the window takes at a station and a phase: a smooth step over each faded edge.
    const share = (s: number, phi: number): number => {
      const step = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
      const [low, high]: [number, number] = window.fade ?? [0, 0];
      const [first, last]: [number, number] = window.fadePhase ?? [0, 0];
      return (low > 0 ? step((s - window.stations[0]) / low) : 1) * (high > 0 ? step((window.stations[1] - s) / high) : 1) * (first > 0 ? step((phi - window.phases[0]) / first) : 1) * (last > 0 ? step((window.phases[1] - phi) / last) : 1);
    };
    // `--relief-dump=<directory>` with `--relief-dump-names=<name>,...`: every cast of the named windows written as `<name>.samples.tsv`
    // (station, phase, the height asked for, the share, the hold, the height fitted, the weight a neighbour's footprint leaves it, the angle the section plane meets the skin at where the
    // window reads the skin's rise, and why a cast was left unobserved), to read a net's
    // misfit sample by sample on the failing place and its neighbours.
    const dumpDir: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--relief-dump="))?.slice("--relief-dump=".length);
    const dumped: boolean = dumpDir !== undefined && (process.argv.find((argument: string): boolean => argument.startsWith("--relief-dump-names="))?.slice("--relief-dump-names=".length).split(",") ?? []).includes(window.name);
    const records: { s: number; phi: number; heldout: boolean; why?: string; along?: number; landing?: C.P; meets?: number | null; share?: number; held?: number; target?: number; sample?: number }[] = [];
    const sine: number = window.graze === undefined ? 0 : Math.sin((window.graze * Math.PI) / 180);
    for (const row of rows) {
      if (row.s <= window.stations[0] || row.s >= window.stations[1]) continue;
      const [iu, wu] = basis(((row.s - window.stations[0]) / (window.stations[1] - window.stations[0])) * (R - 3), R);
      for (let k: number = 1; k < phases; ++k) {
        const offset: number = (span * k) / phases;
        const phi: number = window.phases[0] + offset;

        // The cast's direction at this phase: the fixed axis, or the axis turned about the window's middle phase.
        const turned: number = phi - (window.phases[0] + span / 2);
        const axis: C.P = row.turn === undefined ? row.axis : [Math.cos(turned) * row.axis[0] + Math.sin(turned) * row.turn[0], Math.cos(turned) * row.axis[1] + Math.sin(turned) * row.turn[1]];
        const inPlane: number = Math.hypot(axis[0], axis[1]);

        // Where the axis runs along the wall instead of through it, a cast measures the wall's slope, not a depth: such phases are left to the net's fairness.
        if (Math.abs(axis[0] * Math.cos(phi) + axis[1] * Math.sin(phi)) / inPlane < FACING) {
          if (dumped) records.push({ s: row.s, phi, heldout: row.heldout, why: "facing" });
          continue;
        }
        const from: C.P = row.wall(window.phases[0] + offset);
        const direction: C.P = [axis[0] / inPlane, axis[1] / inPlane];
        const hit: { along: number; normal: C.P } | null = crossing(row.skin, from, direction);
        if (hit === null) {
          if (dumped) records.push({ s: row.s, phi, heldout: row.heldout, why: "miss" });
          continue;
        }
        const along: number = hit.along;
        const landing: C.P = [from[0] + (along * axis[0]) / inPlane, from[1] + (along * axis[1]) / inPlane];
        const portion = (value: boolean | number | undefined): number => (value === true ? 1 : typeof value === "number" ? Math.min(1, Math.max(0, value)) : 0);
        const held: number = Math.max(portion(row.hold?.(landing)), window.holdLanding === true ? 0 : portion(row.hold?.(from)));
        // The skin's rise along the station where the cast lands, and the angle at which the section plane meets the skin there, degrees.
        const rise: number | null = row.slope === undefined ? null : row.slope(landing, hit.normal);
        const meets: number | null = rise === null ? null : (Math.atan2(1, Math.abs(rise)) * 180) / Math.PI;
        const why: string | undefined =
          held >= 1 ? undefined
          : window.reach !== undefined && Math.abs(along) / inPlane > window.reach ? "reach"
          : row.open?.(landing) === true || row.open?.(landing) === 1 ? "open"
          : window.graze !== undefined && rise !== null && Math.abs(direction[0] * hit.normal[0] + direction[1] * hit.normal[1]) / Math.hypot(1, rise) < sine ? "graze"
          : window.plane !== undefined && meets !== null && meets < window.plane ? "plane"
          : undefined;
        if (why !== undefined) {
          if (dumped) records.push({ s: row.s, phi, heldout: row.heldout, why, along: along / inPlane, landing, meets });
          continue;
        }
        const taken: number = share(row.s, phi);
        const target: number = held >= 1 ? 0 : ((1 - held) * taken * along) / inPlane;
        const [iv, wv] = basis((offset / span) * (Cn - 3), Cn);
        const weights: [number, number][] = [];
        for (let a: number = 0; a < 4; ++a)
          for (let b: number = 0; b < 4; ++b) {
            const at: number = slot[(iu + a) * Cn + iv + b]!;
            if (at >= 0) weights.push([at, wu[a]! * wv[b]!]);
          }
        deepest = Math.max(deepest, Math.abs(target));
        if (dumped) records.push({ s: row.s, phi, heldout: row.heldout, along: along / inPlane, landing, meets, share: taken, held, target, sample: samples.length });
        // A landing partly on a neighbour's footprint weighs less (`IRow.open`).
        const unseen: boolean | number | undefined = held >= 1 ? undefined : row.open?.(landing);
        samples.push({ weights, target, heldout: row.heldout, weight: typeof unseen === "number" ? 1 - Math.min(1, Math.max(0, unseen)) : 1 });
      }
    }
    for (const seen of observed) {
      const offset: number = seen.phi - window.phases[0] - 2 * Math.PI * Math.floor((seen.phi - window.phases[0]) / (2 * Math.PI));
      if (seen.s <= window.stations[0] || seen.s >= window.stations[1] || offset >= span) continue;
      if (window.reach !== undefined && Math.abs(seen.target) > window.reach) continue;
      const [iu, wu] = basis(((seen.s - window.stations[0]) / (window.stations[1] - window.stations[0])) * (R - 3), R);
      const [iv, wv] = basis((offset / span) * (Cn - 3), Cn);
      const weights: [number, number][] = [];
      for (let a: number = 0; a < 4; ++a)
        for (let b: number = 0; b < 4; ++b) {
          const at: number = slot[(iu + a) * Cn + iv + b]!;
          if (at >= 0) weights.push([at, wu[a]! * wv[b]!]);
        }
      // A height cast in space fades over the window's edges as a section's does, at its phase within the window.
      const target: number = share(seen.s, window.phases[0] + offset) * seen.target;
      deepest = Math.max(deepest, Math.abs(target));
      samples.push({ weights, target, heldout: seen.heldout, weight: 1 });
    }

    // Normal equations with the fairness penalty on second differences along both directions.
    const A: number[][] = Array.from({ length: unknowns }, (): number[] => new Array<number>(unknowns).fill(0));
    const b: number[] = new Array<number>(unknowns).fill(0);
    for (const sample of samples) {
      if (sample.heldout) continue;
      for (const [i, wi] of sample.weights) {
        b[i]! += sample.weight * wi * sample.target;
        for (const [j, wj] of sample.weights) A[i]![j]! += sample.weight * wi * wj;
      }
    }
    const fair: number = FAIR * Math.max(1, samples.length / Math.max(1, unknowns));
    const penalise = (cells: number[]): void => {
      const terms: [number, number][] = [];
      [1, -2, 1].forEach((w: number, k: number): void => {
        if (slot[cells[k]!]! >= 0) terms.push([slot[cells[k]!]!, w]);
      });
      for (const [i, wi] of terms) for (const [j, wj] of terms) A[i]![j]! += fair * wi * wj;
    };
    for (let r: number = 0; r < R; ++r)
      for (let c: number = 0; c < Cn; ++c) {
        if (r + 2 < R) penalise([r * Cn + c, (r + 1) * Cn + c, (r + 2) * Cn + c]);
        if (c + 2 < Cn) penalise([r * Cn + c, r * Cn + c + 1, r * Cn + c + 2]);
      }
    for (let i: number = 0; i < unknowns; ++i) A[i]![i]! += 1e-9;
    const solved: number[] | null = F.solve(A, b);
    if (solved === null) throw new Error("relief " + window.name + ": the net is not determined by its observations");
    const heights: number[] = slot.map((at: number): number => (at >= 0 ? Math.round(solved[at]! * 100) / 100 : 0));
    let trainMaxMm: number = 0;
    let heldMaxMm: number = 0;
    for (const sample of samples) {
      const miss: number = Math.abs(sample.weights.reduce((sum: number, [i, w]: [number, number]): number => sum + w * Math.round(solved[i]! * 100) / 100, 0) - sample.target);
      if (sample.heldout) heldMaxMm = Math.max(heldMaxMm, miss);
      else trainMaxMm = Math.max(trainMaxMm, miss);
    }
    if (dumped) {
      const fitted = (i: number): number => samples[i]!.weights.reduce((sum: number, [j, w]: [number, number]): number => sum + w * Math.round(solved[j]! * 100) / 100, 0);
      fs.mkdirSync(dumpDir!, { recursive: true });
      // One tab-separated line a cast, so a table reader streams it.
      const cell = (x: number | null | undefined, digits: number): string => (x === undefined || x === null ? "" : x.toFixed(digits));
      const lines: string[] = ["s\tphi\theldout\twhy\talong\tu\tv\tmeets\tshare\theld\ttarget\tfitted\tweight"];
      for (const record of records)
        lines.push([cell(record.s, 2), cell(record.phi, 4), record.heldout ? "1" : "0", record.why ?? "", cell(record.along, 3), cell(record.landing?.[0], 2), cell(record.landing?.[1], 2), cell(record.meets, 1), cell(record.share, 3), cell(record.held, 3), cell(record.target, 3), record.sample === undefined ? "" : cell(fitted(record.sample), 3), record.sample === undefined ? "" : cell(samples[record.sample]!.weight, 3)].join("\t"));
      fs.writeFileSync(path.join(dumpDir!, window.name + ".samples.tsv"), lines.join("\n") + "\n");
    }
    return { relief: { name: window.name, stations: window.stations, phases: window.phases, axis: window.axis, ...(window.turn === undefined ? {} : { turn: window.turn }), rows: R, columns: Cn, heights }, scalars: unknowns, deepestMm: deepest, trainMaxMm, heldMaxMm };
  }

  /** Signed distance from a chart point along a unit direction to the nearest crossing of a polygon; null when the line misses it. */
  export function cast(polygon: readonly C.P[], from: C.P, direction: C.P): number | null {
    return crossing(polygon, from, direction)?.along ?? null;
  }

  /** Where a cast crosses a polygon. */
  export interface ICrossing {
    /** Signed distance along the cast's unit direction, mm. */
    along: number;

    /** Unit normal of the crossed edge in the chart; its sign follows the polygon's winding. */
    normal: C.P;
  }

  /** The nearest crossing as `cast` finds it, with the unit normal of the polygon's edge there. */
  export function crossing(polygon: readonly C.P[], from: C.P, direction: C.P): ICrossing | null {
    let best: number | null = null;
    let normal: C.P = [0, 0];
    for (let i: number = 0; i < polygon.length; ++i) {
      const a: C.P = polygon[i]!;
      const e: C.P = polygon[(i + 1) % polygon.length]!;
      const edge: C.P = [e[0] - a[0], e[1] - a[1]];
      const den: number = direction[0] * edge[1] - direction[1] * edge[0];
      if (den === 0) continue;
      const delta: C.P = [a[0] - from[0], a[1] - from[1]];
      const along: number = (delta[0] * direction[1] - delta[1] * direction[0]) / den;
      if (along < 0 || along > 1) continue;
      const t: number = (delta[0] * edge[1] - delta[1] * edge[0]) / den;
      if (best === null || Math.abs(t) < Math.abs(best)) {
        best = t;
        const length: number = Math.hypot(edge[0], edge[1]);
        normal = [edge[1] / length, -edge[0] / length];
      }
    }
    return best === null ? null : { along: best, normal };
  }

  /** The engine's uniform cubic B-spline span and weights at a parameter (`AutoMovieLoftRelief`'s private `basis`). */
  function basis(x: number, count: number): [number, number[]] {
    const i: number = Math.min(count - 4, Math.max(0, Math.floor(x)));
    const f: number = x - i;
    return [i, [(1 - f) ** 3 / 6, (3 * f ** 3 - 6 * f ** 2 + 4) / 6, (-3 * f ** 3 + 3 * f ** 2 + 3 * f + 1) / 6, f ** 3 / 6]];
  }
}
