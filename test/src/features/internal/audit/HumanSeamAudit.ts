import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieLoftChain, type AutoMovieSolidBlendChain, type AutoMovieSolidJoin, type AutoMovieSolidRail, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanSeamObserver } from "../../../../../packages/human/src/inspection/HumanSeamObserver";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Continuity across every declared seam and blend of a figure, one
 * data-driven audit (#3057's composition audit): each seam is two sides that
 * meet along a curve, the owner and the neighbour, each a point at a seam
 * parameter `a` and a distance `sigma >= 0` into its own side, with the
 * continuity the seam declares. `HumanSeamObserver.surface` reads each side
 * in the plane normal to the seam at evenly spread seam parameters, so the
 * gap, the normal angle and the normal-curvature jump are the normal
 * section's own, whatever either side's parameterisation, and each is held to
 * the declared continuity under the limits of a rendered skin ({@link rows}).
 *
 * A solid merge or diff declares two seams (`join`): the blend chain at its
 * host end against the host past its rail, and at its part end against the
 * part past its rail, both G2 (`AutoMovieSolidJoin`).
 */
export namespace HumanSeamAudit {
  /** One declared seam. */
  export interface ISeam {
    /** Name in rows, such as `blend.arm.left host rail`. */
    name: string;

    /** Declared continuity. */
    continuity: HumanSeamObserver.Continuity;

    /** The owner's point at seam parameter `a` and distance `sigma >= 0` into the owner, mm. */
    owner: (a: number, sigma: number) => number[];

    /** The neighbour's point at `a` and `sigma >= 0` into the neighbour, mm. */
    neighbour: (a: number, sigma: number) => number[];

    /** Seam parameter range read, `[from, to)` for a closed seam. */
    from: number;

    /** End of the seam parameter range. */
    to: number;

    /** Stencil step in both parameters, small against the sides' bending; mm or radians. */
    step: number;

    /** Seam parameters to read, such as a published blend's columns, where the sides are exact. Absent, {@link COUNT} evenly spread over the range. */
    at?: number[];
  }

  /** How a figure's seams are judged. */
  export interface IOptions {
    /** Input mm per calibration mm. */
    k: number;

    /** Stature, input mm: the coordinates' magnitude (`HumanSeamObserver.rendered`). */
    stature: number;

    /** Vertex spacing across the seams, input mm, which sizes the hidden gap and the visible curvature jump. */
    spacing: number;
  }

  /** Readings per seam, evenly spread over its parameter range. */
  export const COUNT: number = 48;

  /**
   * The tightest radius smooth skin bends at, mm: the crease bound's 12.5 mm
   * (`HumanAnatomyShared.CREASE`, the sagitta of 1.04 mm over a 10 mm chord).
   */
  export const RADIUS: number = 12.5;

  /**
   * Every seam's worst gap, and as declared its worst normal angle and
   * normal-curvature jump, as rows. Both sides are tessellated from the
   * seam's shared rail points, so a gap between the two surfaces shows only
   * where it passes the facets' own chordal error: the sagitta of one vertex
   * spacing on the tightest smooth radius, `h^2 / (8 R)`. The angle stays
   * under the class A 0.1 degree and the jump under 0.1 degree over one
   * vertex spacing (`HumanSeamObserver.rendered`). Each row names the seam
   * parameter of its worst reading.
   */
  export function rows(person: string, seams: readonly ISeam[], options: IOptions): IRow[] {
    const t: HumanSeamObserver.ITolerance = { ...HumanSeamObserver.rendered(options.stature, options.spacing), gap: options.spacing ** 2 / (8 * RADIUS) };
    const out: IRow[] = [];
    for (const seam of seams) {
      let gap: [number, number] = [0, seam.from];
      let angle: [number, number] = [0, seam.from];
      let curvature: [number, number] = [0, seam.from];
      const places: number[] = seam.at ?? Array.from({ length: COUNT }, (_: unknown, i: number): number => seam.from + ((seam.to - seam.from) * (i + 0.5)) / COUNT);
      for (const a of places) {
        const r: HumanSeamObserver.IReading = HumanSeamObserver.surface(seam.name, `${a}`, seam.owner, seam.neighbour, a, seam.step);

        // A reading that cannot be taken is the worst reading there is.
        const g: number = Number.isFinite(r.gap) ? r.gap * options.k : Infinity;
        const n: number = Number.isFinite(r.angle) ? r.angle : Infinity;
        const c: number = Number.isFinite(r.curvature) ? r.curvature / options.k : Infinity;
        if (g > gap[0]) gap = [g, a];
        if (n > angle[0]) angle = [n, a];
        if (c > curvature[0]) curvature = [c, a];
      }
      out.push({ person, site: `${seam.name} gap, worst at ${gap[1].toFixed(3)} (${seam.continuity})`, value: gap[0], low: 0, high: t.gap, unit: "mm" });
      if (seam.continuity !== "G0") out.push({ person, site: `${seam.name} normal angle, worst at ${angle[1].toFixed(3)} (${seam.continuity})`, value: angle[0], low: 0, high: t.angle, unit: "rad" });
      if (seam.continuity === "G2") out.push({ person, site: `${seam.name} normal-curvature jump, worst at ${curvature[1].toFixed(3)} (${seam.continuity})`, value: curvature[0], low: 0, high: t.curvature, unit: "1/mm" });
    }
    return out;
  }

  /**
   * The two seams of a published join: the blend chain against the host at
   * the host's rail and against the part at the part's rail, both G2 as the
   * join declares. The seam parameter is the curve's own `t` (the part's phase under the `phase` parameter, an angle about an axis under `angle`); the blend chain's
   * phase is that less the blend's seed (`AutoMovieSolidBlendChain`).
   * Past its rail the host is read along the rail's chart offset direction,
   * which has unit world speed and points away from the curve into the kept
   * host; the part along its rail's own chart direction `partAcross` (unit world speed, past the rail on its kept side).
   *
   * @param name The join's name in rows.
   * @param join The join.
   * @param blend Its published blend chain.
   * @param host The host surface.
   * @param part The part surface.
   * @param step Stencil step, mm and radians.
   */
  export function join(
    name: string,
    join: AutoMovieSolidJoin.IJoin,
    blend: AutoMovieSolidBlendChain.IBlend,
    host: IAutoMovieSolidSurface,
    part: IAutoMovieSolidSurface,
    step: number,
  ): ISeam[] {
    const rail: (phi: number) => AutoMovieSolidRail.IRail = (phi: number): AutoMovieSolidRail.IRail => {
      const r: AutoMovieSolidRail.IRail | null = join.rail(phi);
      if (r === null) throw new Error(`${name}: no rail at curve parameter ${phi}`);
      return r;
    };
    const along: (s: number, phi: number) => number[] = (s: number, phi: number): number[] => AutoMovieLoftChain.point(blend.chain, s, phi - blend.seed);
    const from: number = blend.seed;
    const to: number = blend.seed + 2 * Math.PI;
    return [
      {
        name: `${name} host rail`,
        continuity: "G2",
        owner: (phi: number, sigma: number): number[] => along(sigma, phi),
        neighbour: (phi: number, sigma: number): number[] => {
          const r: AutoMovieSolidRail.IRail = rail(phi);
          return [...host.jet(r.host[0] + sigma * r.across[0], r.host[1] + sigma * r.across[1]).p];
        },
        from,
        to,
        step,
      },
      {
        name: `${name} part rail`,
        continuity: "G2",
        owner: (phi: number, sigma: number): number[] => along(blend.length - sigma, phi),
        neighbour: (phi: number, sigma: number): number[] => {
          const r: AutoMovieSolidRail.IRail = rail(phi);
          return [...part.jet(r.s + sigma * r.partAcross[0], r.phi + sigma * r.partAcross[1]).p];
        },
        from,
        to,
        step,
      },
    ];
  }

  /**
   * The two seams of every merge and diff a body publishes
   * (`IAutoMovieHumanBodyCalibration.merges`), rebuilt from its data alone:
   * the blend chain at station `sigma` against the host chain at its rail's
   * chart point plus `sigma` along the column's chart direction `across`
   * (unit world speed, past the rail away from the curve), and the blend at
   * `L - sigma` against the part chain at its rail's chart point plus
   * `sigma` along its published chart direction `partAcross` (absent, along
   * its station by its kept sign). The seam parameter is the blend's
   * phase; each seam is read at the blend's columns, phase `2 pi k / count`,
   * where both sides are exact, each host column on its own chain where the
   * rail crosses faces (`hostChains`). The observer's search in the normal plane
   * moves the phase slightly off a column, where the rail data are carried
   * by the periodic Catmull-Rom cubic of the columns (C1, error of the
   * columns' spacing cubed), far below the gap the facets hide.
   *
   * @param body The body.
   * @param step Stencil step, calibration mm and radians.
   * @throws {Error} When a merge names a chain the body does not carry.
   */
  export function merges(body: IAutoMovieHumanBodyCalibration, step: number): ISeam[] {
    const named: (name: string) => IAutoMovieLoftChain = (name: string): IAutoMovieLoftChain => {
      const c: IAutoMovieLoftChain | undefined = body.chains.find((x: IAutoMovieLoftChain): boolean => x.name === name);
      if (c === undefined) throw new Error(`a merge names the chain ${name}, which the body does not carry`);
      return c;
    };
    return (body.merges ?? []).flatMap((m: IAutoMovieHumanBodyCalibration.IMerge): ISeam[] => {
      const blend: IAutoMovieLoftChain = named(m.blend);
      const host: IAutoMovieLoftChain = named(m.host);
      const part: IAutoMovieLoftChain = named(m.part);
      const count: number = m.hostLoop.chart.length;
      const columns: number[] = Array.from({ length: count }, (_: unknown, k: number): number => (2 * Math.PI * k) / count);
      const hostAt: (a: number) => number[] = periodic([...m.hostLoop.chart.map((p: [number, number]): number[] => [...p]), ...m.across.map((d: [number, number]): number[] => [...d])], count, [1]);

      // On a rail across faces, column k's chart point lies on chain hostChains[k]; near a column
      // its rail is carried to first order by the chart slope toward its neighbours on the same
      // chain (central where both are, one-sided where one is), its offset direction held.
      const local: (a: number) => [IAutoMovieLoftChain, number, number, number, number] = (a: number): [IAutoMovieLoftChain, number, number, number, number] => {
        const width: number = (2 * Math.PI) / count;
        const k: number = ((Math.round(a / width) % count) + count) % count;
        const on: string = m.hostChains![k]!;

        // The phase's change over one turn of the loop (its winding times 2 pi), as `periodic` unwraps it.
        const last: number = m.hostLoop.chart[count - 1]![1];
        const turn: number = last - m.hostLoop.chart[0]![1] + Math.atan2(Math.sin(m.hostLoop.chart[0]![1] - last), Math.cos(m.hostLoop.chart[0]![1] - last));
        const at: (j: number) => [number, number] | null = (j: number): [number, number] | null => {
          const i: number = ((j % count) + count) % count;
          if (m.hostChains![i] !== on) return null;
          const wraps: number = Math.floor(j / count);
          return [m.hostLoop.chart[i]![0], m.hostLoop.chart[i]![1] + wraps * turn];
        };
        const here: [number, number] = m.hostLoop.chart[k]!;
        const before: [number, number] | null = at(k - 1);
        const after: [number, number] | null = at(k + 1);
        const slope: [number, number] =
          before !== null && after !== null ? [(after[0] - before[0]) / (2 * width), (after[1] - before[1]) / (2 * width)] : after !== null ? [(after[0] - here[0]) / width, (after[1] - here[1]) / width] : before !== null ? [(here[0] - before[0]) / width, (here[1] - before[1]) / width] : [0, 0];
        const d: number = a - k * width - Math.round((a - k * width) / (2 * Math.PI)) * 2 * Math.PI;
        return [named(on), here[0] + d * slope[0], here[1] + d * slope[1], m.across[k]![0], m.across[k]![1]];
      };

      // The part continues past its rail along its published chart direction, or along its station on its kept side.
      const partAcross: [number, number][] = m.partAcross ?? m.partLoop.chart.map((): [number, number] => [m.sigma, 0]);
      const partAt: (a: number) => number[] = periodic([...m.partLoop.chart.map((p: [number, number]): number[] => [...p]), ...partAcross.map((d: [number, number]): number[] => [...d])], count, [1]);
      const kind: string = m.diff === true ? "diff" : "merge";
      return [
        {
          name: `${m.blend} (${kind} of ${m.part} with ${m.host}) host rail`,
          continuity: "G2",
          owner: (a: number, sigma: number): number[] => AutoMovieLoftChain.point(blend, sigma, a),
          neighbour: (a: number, sigma: number): number[] => {
            // A rail that crosses faces is read on each column's own chain, by the local model of its column.
            if (m.hostChains !== undefined) {
              const [chain, y, theta, dy, dt]: [IAutoMovieLoftChain, number, number, number, number] = local(a);
              return AutoMovieLoftChain.point(chain, y + sigma * dy, theta + sigma * dt);
            }
            const [y, theta, dy, dt]: number[] = hostAt(a);
            return AutoMovieLoftChain.point(host, y! + sigma * dy!, theta! + sigma * dt!);
          },
          from: 0,
          to: 2 * Math.PI,
          step,
          at: columns,
        },
        {
          name: `${m.blend} (${kind} of ${m.part} with ${m.host}) part rail`,
          continuity: "G2",
          owner: (a: number, sigma: number): number[] => AutoMovieLoftChain.point(blend, m.length - sigma, a),
          neighbour: (a: number, sigma: number): number[] => {
            const [s, t, ds, dt]: number[] = partAt(a);
            return AutoMovieLoftChain.point(part, s! + sigma * ds!, t! + sigma * dt!);
          },
          from: 0,
          to: 2 * Math.PI,
          step,
          at: columns,
        },
      ];
    });
  }

  /**
   * Column data as a periodic function of the blend's phase: the uniform
   * Catmull-Rom cubic through the columns `2 pi k / count`. Rows of `values`
   * hold the first `count` entries as the columns' first quantities (for the
   * host, its chart point, then the next `count` rows its offset direction);
   * the result concatenates each quantity's interpolated components. A
   * component listed in `unwrap` (a phase) is unwrapped round the loop: its
   * total change over one turn is the last column's value less the first's
   * plus the last step, wrapped into `(-pi, pi]`, so a loop that winds once
   * round its chain carries its `2 pi`.
   */
  function periodic(values: readonly number[][], count: number, unwrap: readonly number[]): (a: number) => number[] {
    const groups: number[][][] = [];
    for (let g: number = 0; g * count < values.length; g++) groups.push(values.slice(g * count, (g + 1) * count));
    const turns: number[][] = groups.map((rows: number[][], g: number): number[] =>
      rows[0]!.map((_: number, c: number): number => {
        if (g !== 0 || !unwrap.includes(c)) return 0;
        const last: number = rows[count - 1]![c]!;
        const step: number = Math.atan2(Math.sin(rows[0]![c]! - last), Math.cos(rows[0]![c]! - last));
        return last - rows[0]![c]! + step;
      }),
    );
    return (a: number): number[] => {
      const x: number = (a / (2 * Math.PI)) * count;
      const i: number = Math.floor(x);
      const f: number = x - i;
      return groups.flatMap((rows: number[][], g: number): number[] =>
        rows[0]!.map((_: number, c: number): number => {
          const at: (j: number) => number = (j: number): number => {
            const wraps: number = Math.floor(j / count);
            return rows[j - wraps * count]![c]! + wraps * turns[g]![c]!;
          };
          const [p0, p1, p2, p3]: number[] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
          return 0.5 * (2 * p1! + (p2! - p0!) * f + (2 * p0! - 5 * p1! + 4 * p2! - p3!) * f * f + (3 * p1! - p0! - 3 * p2! + p3!) * f * f * f);
        }),
      );
    };
  }
}
