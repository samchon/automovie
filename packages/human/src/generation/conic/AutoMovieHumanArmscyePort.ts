import {
  AutoMovieConstructionPortField,
  AutoMovieLoftAdmissionError,
  AutoMovieNaturalSpline,
  AutoMovieSolidVector as Vectors,
} from "@automovie/engine";
import type {
  AutoMovieVector2Tuple,
  AutoMovieVector3Tuple,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
} from "@automovie/interface";

import { AutoMovieHumanSkinStep } from "../../skeleton/AutoMovieHumanSkinStep";
import { AutoMovieHumanBoundSection } from "./AutoMovieHumanBoundSection";
import type { AutoMovieHumanJoinLoop } from "./AutoMovieHumanJoinLoop";

/** A chart coordinate in mm and radians, or its derivatives per clock. */
type P = AutoMovieVector2Tuple;
/** A world vector in mm or its derivatives per clock. */
type V = AutoMovieVector3Tuple;
/** A parent-published loop and its original source jets. */
type Master = ReturnType<typeof AutoMovieHumanJoinLoop.master>;
/** The value, first derivative and second derivative of a scalar function. */
type Jet = [number, number, number];

/**
 * Move a parent loop onto an admissible radial-slope level on its own skin. The
 * registered loop supplies the phase gauge and unaffected arcs. The child
 * supplies only its course and protected length, independently of root fields.
 */
export namespace AutoMovieHumanArmscyePort {
  /** One child's polar address inside a section plane. */
  export interface IAddress {
    /** Material station in mm. */
    station: number;
    /** Polar direction in the child's section frame in radians. */
    phase: number;
    /** Radius in that plane in mm. */
    radius: number;
  }

  /** Displacement evidence over one connected arc of violated slope. */
  export interface IArc {
    /** First and last affected original clock, unwrapped in radians. */
    clocks: [number, number];
    /** Mean distance between corresponding world points, in mm. */
    mean: number;
    /** Maximum distance between corresponding world points, in mm. */
    max: number;
    /** Number of evaluated points in the verified arc. */
    samples: number;
  }

  /** The displaced loop and the field parameters measured on its support. */
  export interface IPlacement {
    /** Parent's loop on its original chart with two clock derivatives. */
    master: Master;
    /** Child addresses of the published loop at the fit and join clocks. */
    clocks: (IAddress & { clock: number })[];
    /** First child station, in mm. */
    from: number;
    /** Protected child station, in mm. */
    mark: number;
    /** Host station extent of the moved curve, in mm. */
    extent: number;
    /** Per-arc displacement from the registered loop, for comparison only. */
    arcs: IArc[];
  }

  /**
   * Prepare one loop from a full host chart and the child's section planes.
   *
   * A physical unit normal to the old loop in the host tangent plane supplies
   * the initial transverse direction. Its preimage under the host metric is a
   * chart ray. Sampling the signed level along that ray predicts the branch,
   * and a bracket correction chooses the adjoining admissible sheet. Where that
   * gauge loses its bracket, a monotone coordinate of the host chart supplies a
   * transverse gauge for the complete affected arc.
   */
  export function place(input: {
    master: Master;
    host: Pick<IAutoMovieLoftViewFullSource.IReader, "domain" | "jet">;
    hostAxis: IAutoMovieViewAxis.IAxis;
    childAxis: IAutoMovieViewAxis.IAxis;
    address: (point: V) => IAddress | null;
    owns: (point: V) => boolean;
    count: number;
    reachShare: number;
    tolerance: number;
  }): IPlacement {
    const {
      master,
      host,
      hostAxis,
      childAxis,
      address,
      owns,
      count,
      reachShare,
      tolerance,
    } = input;
    if (
      !Number.isInteger(count) ||
      count < 8 ||
      !(reachShare > 0) ||
      !(tolerance > 0) ||
      !Number.isFinite(reachShare) ||
      !Number.isFinite(tolerance)
    )
      throw new AutoMovieLoftAdmissionError(
        "the armscye needs finite physical scales and at least eight clock samples",
      );
    const turn: number = 2 * Math.PI;
    const step: number = turn / count;
    const clockOf = (i: number): number => step * i;
    const slot = (i: number): number => ((i % count) + count) % count;

    /** Outward normal published by the actual host field. */
    const normal = (station: number, jet: IAutoMovieSolidSurface.IJet): V => {
      const n: V | null = Vectors.unit(Vectors.cross(jet.u, jet.v));
      if (n === null)
        throw new AutoMovieLoftAdmissionError(
          "the armscye host chart has no regular normal",
        );
      return Vectors.dot(n, Vectors.sub(jet.p, hostAxis.at(station).origin)) < 0
        ? Vectors.scale(n, -1)
        : n;
    };

    /** A contact reading on a finite regular host chart. */
    const read = (
      q: P,
    ): {
      chart: P;
      jet: IAutoMovieSolidSurface.IJet;
      n: V;
      address: IAddress;
      frame: IAutoMovieViewAxisJet.IJet;
      slope: ReturnType<typeof AutoMovieHumanBoundSection.portSlope>;
    } | null => {
      if (q[0] <= host.domain[0] || q[0] >= host.domain[1]) return null;
      const jet: IAutoMovieSolidSurface.IJet = host.jet(...q);
      if (!owns(jet.p)) return null;
      const target: IAddress | null = address(jet.p);
      if (target === null || !(target.radius > 0)) return null;
      const frame = childAxis.jet?.(target.station);
      if (frame === null || frame === undefined) return null;
      const n: V = normal(q[0], jet);
      return {
        chart: q,
        jet,
        n,
        address: target,
        frame,
        slope: AutoMovieHumanBoundSection.portSlope(
          frame,
          target.phase,
          target.radius,
          n,
        ),
      };
    };

    /** Original observations and their metric transverse directions. */
    const original = Array.from({ length: count }, (_, k: number) => {
      const clock: number = clockOf(k);
      const q = master.hostAt(clock);
      const sample = read(q.point);
      if (sample === null)
        throw new AutoMovieLoftAdmissionError(
          "no original armscye address at clock " + clock,
        );
      const direction: P | null = transverse(sample.jet, sample.n, q.first);
      if (direction === null)
        throw new AutoMovieLoftAdmissionError(
          "no transverse host chart at clock " + clock,
        );
      return { ...sample, direction, tangent: q.first };
    });

    // Chord arclength estimates the original fold's physical reach. The clock
    // spline carries the periodic speed variation and gives the blend's jets.
    const cumulative: number[] = [0];
    for (let k: number = 0; k < count; ++k)
      cumulative.push(
        cumulative[k]! +
          Vectors.norm(
            Vectors.sub(original[slot(k + 1)]!.jet.p, original[k]!.jet.p),
          ),
      );
    const length: number = cumulative[count]!;
    const rate: number = length / turn;
    const cyclic = (values: readonly number[]): ((clock: number) => Jet) =>
      AutoMovieConstructionPortField.periodic(values).at;
    const arcDeviation = cyclic(
      original.map(
        (_, i: number): number => cumulative[i]! - rate * clockOf(i),
      ),
    );
    const arcAt = (clock: number): Jet => {
      const [value, first, second] = arcDeviation(clock);
      return [value + rate * clock, first + rate, second];
    };

    const sizeOf = (
      points: readonly NonNullable<ReturnType<typeof read>>[],
    ): { reach: number; mark: number; extent: number } => {
      const hostStations: number[] = points.map((p): number => p.chart[0]);
      const extent: number =
        Math.max(...hostStations) - Math.min(...hostStations);
      const reach: number = reachShare * extent;
      if (!(reach > 0) || !Number.isFinite(reach))
        throw new AutoMovieLoftAdmissionError(
          "the armscye loop has no positive host-station fold reach",
        );
      return {
        extent,
        reach,
        mark: Math.max(...points.map((p): number => p.address.station)) + reach,
      };
    };
    let size = sizeOf(original);
    const passes: number = Math.max(
      1,
      Math.ceil(Math.log2(size.extent / tolerance)),
    );
    for (let pass: number = 0; pass < passes; ++pass) {
      const { mark, reach, extent } = size;
      // The level's inset provides room for chart interpolation. Resolve each
      // root to the tighter relative address accuracy so bracket error cannot
      // occupy that room after the periodic spline combines its controls.
      const rootTolerance: number = Math.max(
        32 * Number.EPSILON * extent,
        tolerance * (tolerance / extent),
      );
      /** On the outward sheet, both inequalities must hold at the same point. */
      const signed = (
        sample: NonNullable<ReturnType<typeof read>>,
        limits = { mark, reach },
      ): readonly [number, number] => {
        const length: number = limits.mark - sample.address.station;
        return length > 0
          ? AutoMovieHumanBoundSection.portSlopeMargins(
              sample.slope,
              sample.address.radius,
              length,
              limits.reach,
            )
          : [-Infinity, -Infinity];
      };
      const margin = (
        sample: NonNullable<ReturnType<typeof read>>,
        limits = { mark, reach },
      ): number => Math.min(...signed(sample, limits));
      const margins: number[] = original.map((p): number => margin(p));
      const starts: number[] = margins.flatMap((m, i): number[] =>
        m <= 0 && margins[slot(i - 1)]! > 0 ? [i] : [],
      );
      if (starts.length === 0 && margins.some((m): boolean => m <= 0))
        throw new AutoMovieLoftAdmissionError(
          "the entire armscye loop lies outside the radial-slope limits",
        );

      /** One transversal on the actual host chart. */
      const pointAt = (i: number, d: number, direction: P): P => {
        const { chart } = original[slot(i)]!;
        return [chart[0] + d * direction[0], chart[1] + d * direction[1]];
      };
      const root = (
        i: number,
        sign: number,
        direction: P,
        inset: number,
      ): number | null =>
        crossing(
          (distance: number): number | null => {
            if (distance === 0) return margins[slot(i)]! - inset;
            const sample = read(pointAt(i, sign * distance, direction));
            return sample === null ? null : margin(sample) - inset;
          },
          reach / 4,
          extent,
          rootTolerance,
        );

      /** Follow each outward branch on one side of its registered arc. */
      const correction: {
        start: number;
        end: number;
        shift: [(clock: number) => Jet, (clock: number) => Jet];
      }[] = [];
      const missing: string[] = [];
      for (const start of starts) {
        let end: number = start;
        while (margins[slot(end + 1)]! <= 0) ++end;
        const rows: number[] = Array.from(
          { length: end - start + 1 },
          (_, i: number): number => start + i,
        );
        const gauge =
          (coordinate: 0 | 1) =>
          (i: number): P => {
            const { jet } = original[slot(i)]!;
            return coordinate === 0
              ? [1 / Vectors.norm(jet.u), 0]
              : [0, 1 / Vectors.norm(jet.v)];
          };
        const normals = (i: number): P => original[slot(i)]!.direction;
        const gauges: ((i: number) => P)[] = [normals];
        for (const coordinate of [0, 1] as const) {
          const independent: 0 | 1 = coordinate === 0 ? 1 : 0;
          const first: number = original[slot(start)]!.tangent[independent];
          if (
            rows.every(
              (i): boolean =>
                first * original[slot(i)]!.tangent[independent] > 0,
            )
          )
            gauges.push(gauge(coordinate));
        }
        const foreshortened: boolean = rows.some(
          (i): boolean => original[slot(i)]!.slope.across <= 0,
        );
        const traces = (foreshortened ? [] : gauges).flatMap((readGauge) =>
          [1, -1].map((sign: number) => ({
            sign,
            readGauge,
            offsets: rows.map((i): number | null =>
              root(i, sign, readGauge(i), tolerance),
            ),
          })),
        );
        const candidates = traces
          .filter(({ offsets }): boolean =>
            offsets.every((offset): boolean => offset !== null),
          )
          .sort(
            (a, b): number =>
              a.offsets.reduce<number>((sum, d): number => sum + d!, 0) -
              b.offsets.reduce<number>((sum, d): number => sum + d!, 0),
          );
        const trace = candidates[0];
        const level = (p: P): number | null => {
          const sample = read(p);
          return sample === null ? null : margin(sample) - tolerance;
        };
        const edge = (
          inside: number,
          sense: -1 | 1,
          inset: number,
        ): number | null => {
          const sample = (distance: number): number | null => {
            const here = read(
              master.hostAt(clockOf(inside + sense * distance)).point,
            );
            return here === null ? null : margin(here) - inset;
          };
          const distance: number | null = crossing(
            sample,
            1,
            1,
            rootTolerance / reach,
          );
          return distance === null ? null : clockOf(inside + sense * distance);
        };
        const [first, last] = [edge(start, -1, 0), edge(end, 1, 0)];
        if (first === null || last === null) {
          missing.push(
            clockOf(start).toFixed(3) +
              ".." +
              clockOf(end).toFixed(3) +
              " rad, no continuous clock bracket",
          );
          continue;
        }
        const from: number = arcAt(first)[0];
        const to: number = arcAt(last)[0];
        const a: number | null = foreshortened
          ? edge(start, -1, tolerance)
          : null;
        const b: number | null = foreshortened ? edge(end, 1, tolerance) : null;
        const connected: ((s: number) => P | null) | null =
          a === null || b === null
            ? null
            : marchLevel(
                level,
                master.hostAt(a).point,
                master.hostAt(b).point,
                Vectors.norm(original[slot(start)]!.jet.v),
                reach / 4,
                extent,
                tolerance,
                rootTolerance,
              );
        if (
          (foreshortened && connected === null) ||
          (!foreshortened && trace === undefined)
        ) {
          const reason: string = foreshortened
            ? "no level connects the two original crossings"
            : "missing by gauge " +
              traces
                .map(({ offsets }): string =>
                  offsets.filter((d): boolean => d === null).length.toString(),
                )
                .join("/");
          missing.push(
            clockOf(start).toFixed(3) +
              ".." +
              clockOf(end).toFixed(3) +
              " rad, " +
              reason,
          );
          continue;
        }
        // Interpolate the level's actual displacement on this arc. The
        // quintic owns compact support; padding the displacement with zero
        // controls at its ends would introduce a second, oscillating fade.
        type Shift = { clock: number; delta: P };
        const change = (i: number, q: P): Shift => {
          const p: P = original[slot(i)]!.chart;
          return { clock: clockOf(i), delta: [q[0] - p[0], q[1] - p[1]] };
        };
        const levelFrom: number = a === null ? from : arcAt(a)[0];
        const levelTo: number = b === null ? to : arcAt(b)[0];
        const onLevel = (i: number): P | null =>
          connected?.(
            (arcAt(clockOf(i))[0] - levelFrom) / (levelTo - levelFrom),
          ) ?? null;
        const core: Shift[] = rows.map((i, j): Shift => {
          const q: P | null =
            connected === null
              ? pointAt(
                  i,
                  trace!.sign * trace!.offsets[j]!,
                  trace!.readGauge(i),
                )
              : onLevel(i);
          if (q === null)
            throw new AutoMovieLoftAdmissionError(
              "the continued armscye level loses its chart at " + clockOf(i),
            );
          return change(i, q);
        });
        const continueLevel = (
          at: number,
          sense: -1 | 1,
          edge: number,
        ): Shift[] => {
          const shifts: Shift[] = [];
          for (
            let i: number = at + sense;
            Math.abs(arcAt(clockOf(i))[0] - edge) <=
            reach +
              Vectors.norm(
                Vectors.sub(
                  original[slot(i)]!.jet.p,
                  original[slot(i + sense)]!.jet.p,
                ),
              );
            i += sense
          ) {
            if (margins[slot(i)]! <= 0) break;
            if (connected === null) {
              const sign: number =
                margins[slot(i)]! > tolerance ? -trace!.sign : trace!.sign;
              const offset: number | null = root(
                i,
                sign,
                trace!.readGauge(i),
                tolerance,
              );
              if (offset !== null)
                shifts.push(
                  change(i, pointAt(i, sign * offset, trace!.readGauge(i))),
                );
            } else {
              const q: P | null = onLevel(i);
              if (q !== null) shifts.push(change(i, q));
            }
          }
          return shifts;
        };
        const samples: Shift[] = [
          ...continueLevel(start, -1, from).reverse(),
          ...core,
          ...continueLevel(end, 1, to),
        ];
        const knot: number[] = samples.map((p): number => p.clock);
        const field = (coordinate: 0 | 1): ((clock: number) => Jet) => {
          if (samples.length === 1)
            return (): Jet => [samples[0]!.delta[coordinate], 0, 0];
          const spline = AutoMovieNaturalSpline.create(
            knot,
            samples.map((p): number => p.delta[coordinate]),
          );
          return (clock: number): Jet =>
            AutoMovieNaturalSpline.read(spline, clock);
        };
        correction.push({ start: from, end: to, shift: [field(0), field(1)] });
      }
      if (missing.length > 0)
        throw new AutoMovieLoftAdmissionError(
          "the armscye slope contour leaves its transverse host chart at " +
            missing.join("; "),
        );

      /**
       * The corrected chart jet. The old source is unchanged outside the
       * transitions.
       */
      const hostAt: Master["hostAt"] = (clock) => {
        const source = master.hostAt(clock);
        const base: ReturnType<Master["hostAt"]> = {
          point: [...source.point],
          first: [...source.first],
          second: [...source.second],
        };
        const arc: Jet = arcAt(clock);
        for (const { start, end, shift } of correction) {
          const around: number = Math.round(
            ((start + end) / 2 - arc[0]) / length,
          );
          const position: number = arc[0] + length * around;
          const sense: number = position < start ? -1 : position > end ? 1 : 0;
          const distance: number = Math.max(
            start - position,
            position - end,
            0,
          );
          if (distance >= reach) continue;
          const x: number = 1 - distance / reach;
          const dx: number = (-sense * arc[1]) / reach;
          const ddx: number = (-sense * arc[2]) / reach;
          const w: number = AutoMovieHumanSkinStep.rise(x);
          const slope: number = 30 * x * x * (1 - x) * (1 - x);
          const dw: number = slope * dx;
          const ddw: number =
            slope * ddx + 60 * x * (1 - x) * (1 - 2 * x) * dx * dx;
          for (const k of [0, 1] as const) {
            const [value, first, second] = shift[k](clock + turn * around);
            base.point[k] += w * value;
            base.first[k] += w * first + dw * value;
            base.second[k] += w * second + 2 * dw * first + ddw * value;
          }
        }
        return base;
      };
      const points = original.map((_, i: number) =>
        read(hostAt(clockOf(i)).point),
      );
      if (points.some((p): boolean => p === null))
        throw new AutoMovieLoftAdmissionError(
          "the corrected armscye leaves its owned host or child chart",
        );
      const observed = points as NonNullable<ReturnType<typeof read>>[];
      const next = sizeOf(observed);
      size = next;
      if (
        Math.max(Math.abs(next.mark - mark), Math.abs(next.reach - reach)) >
        tolerance / 16
      )
        continue;

      const failures: number[] = observed.flatMap((entry, i): number[] => {
        const [star, bulge] = signed(entry, next);
        return star > 0 && bulge >= 0 ? [] : [i];
      });
      if (failures.length > 0)
        throw new AutoMovieLoftAdmissionError(
          "the corrected armscye violates its final signed slope margins: " +
            JSON.stringify({
              pass,
              mark,
              reach,
              next,
              clocks: failures.map((i): number[] => [
                clockOf(i),
                margins[i]!,
                margin(observed[i]!),
              ]),
            }),
        );
      const result: Master = {
        hostAt,
        at: (clock: number) => world(host, hostAt(clock)),
        normal: (clock: number): V => {
          const { point } = hostAt(clock);
          return normal(point[0], host.jet(...point));
        },
      };
      // Check each published span at its start and three interior clocks.
      // The analytic phase derivative distinguishes a regular directed turn
      // from two samples that have advanced across a local fold.
      const subdivisions: number = 4;
      const probes = Array.from({ length: subdivisions * count }, (_, i) => {
        const clock: number = clockOf(i / subdivisions);
        const q = hostAt(clock);
        const p =
          i % subdivisions === 0 ? observed[i / subdivisions]! : read(q.point);
        if (p === null)
          return {
            clock,
            phase: NaN,
            speed: NaN,
            star: -Infinity,
            bulge: -Infinity,
          };
        const velocity: V = Vectors.combine([
          [q.first[0], p.jet.u],
          [q.first[1], p.jet.v],
        ]);
        const [star, bulge] = signed(p, next);
        return {
          clock,
          phase: p.address.phase,
          speed: phaseSpeed(p.frame, p.jet.p, velocity),
          star,
          bulge,
        };
      });
      const stale = probes.flatMap(
        (p): { clock: number; margin: number; original: number | null }[] => {
          if (p.star > 0 && p.bulge >= 0) return [];
          const original = read(master.hostAt(p.clock).point);
          return [
            {
              clock: p.clock,
              margin: Math.min(p.star, p.bulge),
              original: original === null ? null : margin(original, next),
            },
          ];
        },
      );
      if (stale.length > 0)
        throw new AutoMovieLoftAdmissionError(
          "the armscye slope level leaves its admissible chart between clocks " +
            JSON.stringify({ mark: next.mark, reach: next.reach, stale }),
        );
      const phaseSteps: number[] = probes.map(({ phase }, i): number => {
        const delta: number = probes[(i + 1) % probes.length]!.phase - phase;
        return Math.atan2(Math.sin(delta), Math.cos(delta));
      });
      const childWinding: number =
        phaseSteps.reduce((a, b): number => a + b, 0) / turn;
      const direction: number = Math.sign(childWinding);
      const backwards: number[] = probes.flatMap((p, i): number[] =>
        p.speed * direction > 0 && phaseSteps[i]! * direction > 0
          ? []
          : [p.clock],
      );
      if (Math.round(Math.abs(childWinding)) !== 1 || backwards.length > 0)
        throw new AutoMovieLoftAdmissionError(
          "the armscye must turn once on the child's chart: " +
            JSON.stringify({ childWinding, backwards }),
        );
      const arcs: IArc[] = starts.map((i): IArc => {
        let last: number = i;
        while (margins[slot(last + 1)]! <= 0) ++last;
        const distances: number[] = Array.from(
          { length: last - i + 1 },
          (_, j: number): number => {
            const k: number = slot(i + j);
            return Vectors.norm(
              Vectors.sub(original[k]!.jet.p, observed[k]!.jet.p),
            );
          },
        );
        return {
          clocks: [clockOf(i), clockOf(last)],
          samples: distances.length,
          max: Math.max(...distances),
          mean: distances.reduce((a, b): number => a + b, 0) / distances.length,
        };
      });
      return {
        master: result,
        arcs,
        extent: next.extent,
        mark: next.mark,
        from: Math.max(
          0,
          Math.min(...observed.map((p): number => p.address.station)) -
            tolerance,
        ),
        clocks: observed.map(({ address: here }, i) => ({
          clock: clockOf(i),
          ...here,
        })),
      };
    }
    throw new AutoMovieLoftAdmissionError(
      "the corrected armscye does not settle its fold reach and protected mark to the address tolerance",
    );
  }

  /**
   * The first bracketed sign crossing on a physical chart ray in millimetres.
   * Return the positive endpoint at the given positional tolerance. A missing
   * chart reading ends registration of that ray. No quotient crosses a pole.
   */
  export function crossing(
    read: (offset: number) => number | null,
    pitch: number,
    extent: number,
    tolerance: number,
  ): number | null {
    if (
      ![pitch, extent, tolerance].every(
        (x): boolean => Number.isFinite(x) && x > 0,
      )
    )
      throw new Error(
        "the chart crossing needs a finite positive pitch, extent and tolerance",
      );
    const initial: number | null = read(0);
    if (initial === null) return null;
    let lo: number = 0;
    let hi: number = Math.min(pitch, extent);
    for (;;) {
      const a: number | null = read(hi);
      if (a === null) return null;
      if (initial > 0 !== a > 0) break;
      if (hi >= extent) return null;
      lo = hi;
      hi = Math.min(extent, hi + pitch);
    }
    while (hi - lo > tolerance) {
      const middle: number = (lo + hi) / 2;
      const a: number | null = read(middle);
      if (a === null) return null;
      if (initial > 0 === a > 0) lo = middle;
      else hi = middle;
    }
    return initial > 0 ? lo : hi;
  }
}

/** Pull the metric unit transverse direction back to the host chart. */
function transverse(
  jet: IAutoMovieSolidSurface.IJet,
  normal: V,
  q: P,
): P | null {
  const along: V = Vectors.combine([
    [q[0], jet.u],
    [q[1], jet.v],
  ]);
  const across: V | null = Vectors.unit(Vectors.cross(normal, along));
  if (across === null) return null;
  const uu: number = Vectors.dot(jet.u, jet.u),
    uv: number = Vectors.dot(jet.u, jet.v),
    vv: number = Vectors.dot(jet.v, jet.v);
  return Vectors.solve2(uu, uv, uv, vv, [
    Vectors.dot(across, jet.u),
    Vectors.dot(across, jet.v),
  ]);
}

/**
 * Differentiate the child's section-plane equation and polar angle along the
 * host loop.
 */
function phaseSpeed(
  frame: IAutoMovieViewAxisJet.IJet,
  point: V,
  velocity: V,
): number {
  const { value, first } = frame;
  const q: V = Vectors.sub(point, value.origin);
  const k: V = Vectors.cross(value.v, value.u);
  const dk: V = Vectors.add(
    Vectors.cross(first.v, value.u),
    Vectors.cross(value.v, first.u),
  );
  // f(s,c) = (P(c) - o(s)) · k(s) = 0.
  const planeRate: number = Vectors.dot(first.origin, k) - Vectors.dot(q, dk);
  if (!Number.isFinite(planeRate) || planeRate === 0) return NaN;
  const ds: number = Vectors.dot(velocity, k) / planeRate;
  const dq: V = Vectors.sub(velocity, Vectors.scale(first.origin, ds));
  const x: number = Vectors.dot(q, value.u),
    y: number = Vectors.dot(q, value.v);
  const dx: number = Vectors.dot(dq, value.u) + ds * Vectors.dot(q, first.u);
  const dy: number = Vectors.dot(dq, value.v) + ds * Vectors.dot(q, first.v);
  return (x * dy - y * dx) / (x * x + y * y);
}

/** Compose the exact parent chart with the loop's own two derivatives. */
function world(
  host: Pick<IAutoMovieLoftViewFullSource.IReader, "jet">,
  q: ReturnType<Master["hostAt"]>,
): ReturnType<Master["at"]> {
  const h: IAutoMovieSolidSurface.IJet = host.jet(...q.point);
  const [u, v]: P = q.first;
  return {
    point: h.p,
    first: Vectors.combine([
      [u, h.u],
      [v, h.v],
    ]),
    second: Vectors.combine([
      [u * u, h.uu],
      [2 * u * v, h.uv],
      [v * v, h.vv],
      [q.second[0], h.u],
      [q.second[1], h.v],
    ]),
  };
}

/**
 * Trace the same level from either direction through a chart turning point. The
 * local continuation is normalized by the host's angular reach so both
 * coordinate increments are measured in millimetres. Each corrected point lands
 * on the same physical field. The two directions are compared by travelled
 * length only after they reach the other original crossing.
 */
function marchLevel(
  level: (point: P) => number | null,
  from: P,
  to: P,
  angularReach: number,
  pitch: number,
  extent: number,
  tolerance: number,
  rootTolerance: number,
): ((arc: number) => P | null) | null {
  const point = (p: P): P => [p[0], p[1] / angularReach];
  const a: P = [from[0], from[1] * angularReach],
    b: P = [to[0], to[1] * angularReach];
  const distance = (u: P, v: P): number => Math.hypot(u[0] - v[0], u[1] - v[1]);
  const read = (p: P): number | null => level(point(p));
  const grad = (p: P): P | null => {
    const h: number = tolerance;
    const x: (number | null)[] = [
      read([p[0] - h, p[1]]),
      read([p[0] + h, p[1]]),
    ];
    const y: (number | null)[] = [
      read([p[0], p[1] - h]),
      read([p[0], p[1] + h]),
    ];
    return [...x, ...y].some((v): boolean => v === null)
      ? null
      : [(x[1]! - x[0]!) / (2 * h), (y[1]! - y[0]!) / (2 * h)];
  };
  const correct = (p: P, limit: number): P | null => {
    let q: P = p;
    for (
      let i: number = 0;
      i < Math.ceil(Math.log2(pitch / rootTolerance));
      ++i
    ) {
      const f: number | null = read(q);
      if (f === null || distance(q, p) > limit) return null;
      if (Math.abs(f) <= rootTolerance) return q;
      const g: P | null = grad(q);
      if (g === null) return null;
      const squared: number = g[0] * g[0] + g[1] * g[1];
      if (!(squared > 0)) return null;
      q = [q[0] - (f * g[0]) / squared, q[1] - (f * g[1]) / squared];
    }
    return null;
  };
  const walk = (sense: number): { route: P[]; length: number } | null => {
    const route: P[] = [a];
    let current: P = a;
    let previous: P | null = null;
    let length: number = 0;
    while (length <= extent) {
      const g: P | null = grad(current);
      if (g === null) return null;
      const n: number = Math.hypot(...g);
      if (!(n > 0)) return null;
      const flip: number =
        previous === null
          ? sense
          : Math.sign(-g[1] * previous[0] + g[0] * previous[1]);
      const tangent: P = [(-flip * g[1]) / n, (flip * g[0]) / n];
      const target: P = [b[0] - current[0], b[1] - current[1]];
      const gap: number = Math.hypot(...target);
      if (
        gap <= pitch &&
        target[0] * tangent[0] + target[1] * tangent[1] > 0 &&
        correct([(b[0] + current[0]) / 2, (b[1] + current[1]) / 2], gap / 2) !==
          null
      )
        return { route: [...route, b], length: length + gap };
      let q: P | null = null;
      for (let step: number = pitch; step > tolerance; step /= 2) {
        q = correct(
          [current[0] + step * tangent[0], current[1] + step * tangent[1]],
          step / 2,
        );
        if (q !== null) break;
      }
      if (
        q === null ||
        distance(q, current) <= tolerance ||
        distance(q, a) <= tolerance
      )
        return null;
      previous = [q[0] - current[0], q[1] - current[1]];
      length += distance(q, current);
      current = q;
      route.push(q);
    }
    return null;
  };
  const chosen = [-1, 1]
    .map(walk)
    .filter((track) => track !== null)
    .sort((u, v): number => u.length - v.length)[0];
  if (chosen === undefined) return null;
  const stations: number[] = [0];
  for (let k: number = 1; k < chosen.route.length; ++k)
    stations.push(
      stations[k - 1]! + distance(chosen.route[k - 1]!, chosen.route[k]!),
    );
  const [x, y] = ([0, 1] as const).map((k) =>
    AutoMovieNaturalSpline.create(
      stations,
      chosen.route.map((p): number => p[k]),
    ),
  );
  return (arc: number): P | null => {
    const s: number = arc * chosen.length;
    const q: P | null = correct(
      [
        AutoMovieNaturalSpline.evaluate(x!, s),
        AutoMovieNaturalSpline.evaluate(y!, s),
      ],
      pitch,
    );
    return q === null ? null : point(q);
  };
}
