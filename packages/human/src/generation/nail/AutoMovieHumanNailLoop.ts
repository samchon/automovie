import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieLoftChain, AutoMovieLoftViewRead, AutoMovieSolidVector } from "@automovie/engine";
import type {
  IAutoMovieHumanNail,
  IAutoMovieHumanNailLoop,
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionFrame,
  IAutoMovieSolidSurface,
  IAutoMovieViewAxis,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

/**
 * The curve a nail's plate and its digit meet on, as a declared loop on the digit's chart (`IAutoMovieConstructionJoin.loop`).
 *
 * The law knows where the two meet: inside the nail's outline the bedded skin lies under the plate's upper face, outside it over it,
 * and at the free edge the plate's cap comes down through the skin. The loop is that crossing read on the two lofted surfaces
 * themselves, so both share it within the solve: along each ray of the chart ellipse about the outline's middle
 * (`AutoMovieHumanNail.INail.outline`), the share of the ellipse at which the skin's point stands on the plate's upper face. Nothing
 * is traced or searched by the engine, and the loop's corners are the outline's own.
 */
export namespace AutoMovieHumanNailLoop {
  /** @deprecated Use `IAutoMovieLoftChain` from the interface package. */
  export type Chain = IAutoMovieLoftChain;

  /** Phases a plate's ring is scanned at for its side extreme. */
  const SCAN: number = 24;

  /**
   * Prepare the actual plate and bedded skin at the nail's parent footprint.
   *
   * @param nail Nail carrying the placement and parent chart footprint.
   * @param plate Original chain of the placed plate.
   * @param host Original bedded skin chain.
   * @param tip Distal station of the parent chart, millimetres.
   * @param surfaces If provided, the admitted readers of these same chains.
   */
  export function prepare(
    nail: IAutoMovieHumanNail.INail,
    plate: IAutoMovieLoftChain,
    host: IAutoMovieLoftChain,
    tip: number,
    surfaces?: { part: IAutoMovieSolidSurface; host: IAutoMovieSolidSurface },
  ) {
    const axis: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(nail.plate);
    const knots: [number, number] = [nail.plate.knots[0]!, nail.plate.knots.at(-1)!];
    const [from, to]: [number, number] = [nail.plate.tips?.[0]?.tip ?? knots[0], nail.plate.tips?.[1]?.tip ?? knots[1]];
    const start: IAutoMovieLoftSectionFrame = axis.at(0);
    const next: IAutoMovieLoftSectionFrame = axis.at(1);
    const straight: boolean = nail.plate.centres.length === 2;
    const along: number[] = straight
      ? AutoMovieSolidVector.cross(start.v, start.u)
      : [0, 1, 2].map((k: number): number => next.origin[k]! - start.origin[k]!);
    const source = plate.nativeSource;
    const supported = source?.kind === "view" && plate.originalSection === undefined &&
      !plate.sectionSpans?.length && !plate.reliefs?.length
      ? AutoMovieLoftViewRead.prepare(source.data) : null;

    // Read the original world point and its two plate section coordinates.
    const ring = (station: number, frame: IAutoMovieLoftSectionFrame) => {
      const reads = surfaces?.part.pointAt?.(station) ??
        AutoMovieLoftChain.sampler(plate, station);
      return (phase: number): { point: P3; u: number; v: number } => {
        const point: P3 = reads(phase);
        const d: number[] = [0, 1, 2].map((k: number): number => point[k]! - frame.origin[k]!);
        return {
          point,
          u: d[0]! * frame.u[0] + d[1]! * frame.u[1] + d[2]! * frame.u[2],
          v: d[0]! * frame.v[0] + d[1]! * frame.v[1] + d[2]! * frame.v[2],
        };
      };
    };
    // How far a point of the figure stands over the plate's upper face, mm, with the plate's chart point under it; null where no
    // upper face stands under or over it (past the plate's ends or its sides).
    const over = (p: readonly number[], includeFloor: boolean = true) => {
      // The station whose section plane holds the point: from its place along the first stretch, by the fixed point of its distance
      // along the course's own direction there, since the course turns past the free edge.
      let station: number = [0, 1, 2].reduce((sum: number, k: number): number => sum + (p[k]! - start.origin[k]!) * along[k]!, 0);
      // The standard nail has one straight course. The longitudinal normal
      // is unchanged by its roll and dorsal offset, so this is the plane foot.
      // Retain the iterative projection for a caller's turned course.
      const iterations: number = straight ? 0 : 16;
      if (iterations !== 0) station = Math.max(from + 1e-6, Math.min(to - 1e-6, station));
      for (let i: number = 0; i < iterations; ++i) {
        const here: IAutoMovieLoftSectionFrame = axis.at(station);
        const ahead: IAutoMovieLoftSectionFrame = axis.at(station + 1e-4);
        const step: number = [0, 1, 2].reduce((sum: number, k: number): number => sum + ((p[k]! - here.origin[k]!) * (ahead.origin[k]! - here.origin[k]!)) / 1e-4, 0);
        station += step;
        if (!(station > from && station < to - 1e-4)) return null;
      }
      if (!(station > from && station < to - 1e-4)) return null;
      const frame: IAutoMovieLoftSectionFrame = axis.at(station);
      const section = ring(station, frame);
      const d: number[] = [0, 1, 2].map((k: number): number => p[k]! - frame.origin[k]!);
      const [u, v]: [number, number] = [d[0]! * frame.u[0] + d[1]! * frame.u[1] + d[2]! * frame.u[2], d[0]! * frame.v[0] + d[1]! * frame.v[1] + d[2]! * frame.v[2]];
      // The upper face runs from the crown at phase 0 to the side extreme, the same on both sides; the side extreme is the ring's
      // farthest point from the median line.
      const sign: number = v < 0 ? -1 : 1;
      const lateral = (phase: number): number => sign * section(sign * phase).v;
      const values = supported?.values(station);
      const guide: number = sign > 0 ? 1 : 3;
      // A native side guide is the exact support point. Its polar angle uses
      // the original touch offset and extent, in the plate's own chart.
      const edge: number = values !== undefined && typeof values !== "string"
        ? Math.atan2(values.extents[guide]!, values.touch?.[guide] ?? 0)
        : sideExtreme(lateral);
      const target: number = Math.abs(v);
      if (target >= lateral(edge)) return null;
      const phaseAt = (from: number, to: number): number => {
        for (let i: number = 0; i < 40; ++i) {
          const middle: number = (from + to) / 2;
          if (lateral(middle) < target) from = middle;
          else to = middle;
        }
        return sign * (from + to) / 2;
      };
      const phase: number = phaseAt(0, edge);
      const floorPhase: number = includeFloor ? phaseAt(Math.PI, edge) : phase;
      const top = section(phase);
      return {
        gap: u - top.u,
        floorGap: (includeFloor ? section(floorPhase).u : top.u) - u,
        station,
        phase,
        floorPhase,
        point: top.point,
      };
    };
    const { centre, semi }: { centre: [number, number]; semi: [number, number] } = nail.outline;
    const chart = (clock: number, share: number): [number, number] => [Math.min(tip, centre[0] + share * semi[0] * Math.cos(clock)), centre[1] + share * semi[1] * Math.sin(clock)];
    const read = (clock: number, share: number) => {
      const [s, t]: [number, number] = chart(clock, share);
      return over(
        surfaces?.host.point?.(s, t) ?? AutoMovieLoftChain.point(host, s, t),
      );
    };
    const project = (p: readonly number[]): {
      gap: number;
      station: number;
      phase: number;
      point: P3;
    } | null => {
      const top = over(p, false);
      return top === null ? null : {
        gap: top.gap,
        station: top.station,
        phase: top.phase,
        point: top.point,
      };
    };
    return { centre, semi, chart, read, project };
  }

  /** A custom convex plate without native support values keeps a bounded search. */
  function sideExtreme(lateral: (phase: number) => number): number {
    let side: number = 0, reach: number = 0;
    for (let k: number = 1; k <= SCAN; ++k) {
      const value: number = lateral((Math.PI * k) / SCAN);
      if (value > reach) [side, reach] = [k, value];
    }
    let [a, b]: [number, number] = [(Math.PI * Math.max(0, side - 1)) / SCAN, (Math.PI * Math.min(SCAN, side + 1)) / SCAN];
    for (let i: number = 0; i < 24; ++i) {
      const first: number = (2 * a + b) / 3, second: number = (a + 2 * b) / 3;
      if (lateral(first) < lateral(second)) a = first;
      else b = second;
    }
    return (a+b) / 2;
  }

  /**
   * The loop of one nail.
   *
   * @param nail The nail.
   * @param plate The plate's lofted chain.
   * @param host The digit's lofted chain, with its bed.
   * @param tip The station of the digit's tip, mm.
   * @param count The join's columns.
   */
  export function create(nail: IAutoMovieHumanNail.INail, plate: IAutoMovieLoftChain, host: IAutoMovieLoftChain, tip: number, count: number): IAutoMovieHumanNailLoop.ILoop {
    const { centre, semi, chart, read } = prepare(nail, plate, host, tip);
    // Inside the curve the skin lies under the plate's face; outside it stands over it, or no face is there.
    const outside = (clock: number, share: number): boolean => {
      const found = read(clock, share);
      return found === null || found.gap > 0;
    };
    const shape: number[] = [];
    for (let k: number = 0; k < count; ++k) {
      const clock: number = (2 * Math.PI * k) / count;
      if (outside(clock, 0.25)) throw new Error("nail loop: " + nail.plate.name + "'s skin is not under its plate a quarter of the way out at clock " + clock.toFixed(3));
      let far: number = 0.5;
      while (!outside(clock, far) && far < 4) far += 0.125;
      if (!outside(clock, far)) throw new Error("nail loop: " + nail.plate.name + "'s plate does not end by four times its outline at clock " + clock.toFixed(3));
      let [a, b]: [number, number] = [far - 0.125, far];
      for (let i: number = 0; i < 44; ++i) {
        const middle: number = (a + b) / 2;
        if (outside(clock, middle)) b = middle;
        else a = middle;
      }
      shape.push(a);
    }
    const [s, t]: [number, number] = chart(0, shape[0]!);
    const seed = read(0, shape[0]!);
    if (seed === null) throw new Error("nail loop: " + nail.plate.name + "'s curve has no point on the plate at clock 0");
    return { centre: [centre[0] / 1000, centre[1]], semi: [semi[0] / 1000, semi[1]], shape, part: [seed.station / 1000, seed.phase], host: [s / 1000, t] };
  }
}
