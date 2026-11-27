import { AutoMovieHumanConicLoft } from "./AutoMovieHumanConicLoft";
import { AutoMovieEngineLoftChain } from "@automovie/engine";
import type {
  IAutoMovieHumanNail,
  IAutoMovieHumanNailLoop,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewLoft,
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
  /** A lofted chain, as the engine publishes it. */
  export type Chain = NonNullable<IAutoMovieViewLoft.IResult["chain"]>;

  /**
   * The loop of one nail.
   *
   * @param nail The nail.
   * @param plate The plate's lofted chain.
   * @param host The digit's lofted chain, with its bed.
   * @param tip The station of the digit's tip, mm.
   * @param count The join's columns.
   */
  export function create(nail: IAutoMovieHumanNail.INail, plate: Chain, host: Chain, tip: number, count: number): IAutoMovieHumanNailLoop.ILoop {
    const axis: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(nail.plate);
    const knots: [number, number] = [nail.plate.knots[0]!, nail.plate.knots.at(-1)!];
    const [from, to]: [number, number] = [nail.plate.tips?.[0]?.tip ?? knots[0], nail.plate.tips?.[1]?.tip ?? knots[1]];
    const start: IAutoMovieLoftSectionFrame = axis.at(0);
    const next: IAutoMovieLoftSectionFrame = axis.at(1);
    const along: number[] = [0, 1, 2].map((k: number): number => next.origin[k]! - start.origin[k]!);
    // The plate's own chart point `[u, v]` of its ring at a station and a phase.
    const ring = (station: number, phase: number): [number, number] => {
      const frame: IAutoMovieLoftSectionFrame = axis.at(station);
      const p: number[] = AutoMovieEngineLoftChain.point(plate, station, phase);
      const d: number[] = [0, 1, 2].map((k: number): number => p[k]! - frame.origin[k]!);
      return [d[0]! * frame.u[0] + d[1]! * frame.u[1] + d[2]! * frame.u[2], d[0]! * frame.v[0] + d[1]! * frame.v[1] + d[2]! * frame.v[2]];
    };
    // How far a point of the figure stands over the plate's upper face, mm, with the plate's chart point under it; null where no
    // upper face stands under or over it (past the plate's ends or its sides).
    const over = (p: readonly number[]): { gap: number; station: number; phase: number } | null => {
      // The station whose section plane holds the point: from its place along the first stretch, by the fixed point of its distance
      // along the course's own direction there, since the course turns past the free edge.
      let station: number = Math.max(from + 1e-6, Math.min(to - 1e-6, [0, 1, 2].reduce((sum: number, k: number): number => sum + (p[k]! - start.origin[k]!) * along[k]!, 0)));
      for (let i: number = 0; i < 16; ++i) {
        const here: IAutoMovieLoftSectionFrame = axis.at(station);
        const ahead: IAutoMovieLoftSectionFrame = axis.at(station + 1e-4);
        const step: number = [0, 1, 2].reduce((sum: number, k: number): number => sum + ((p[k]! - here.origin[k]!) * (ahead.origin[k]! - here.origin[k]!)) / 1e-4, 0);
        station += step;
        if (!(station > from && station < to - 1e-4)) return null;
      }
      const frame: IAutoMovieLoftSectionFrame = axis.at(station);
      const d: number[] = [0, 1, 2].map((k: number): number => p[k]! - frame.origin[k]!);
      const [u, v]: [number, number] = [d[0]! * frame.u[0] + d[1]! * frame.u[1] + d[2]! * frame.u[2], d[0]! * frame.v[0] + d[1]! * frame.v[1] + d[2]! * frame.v[2]];
      // The upper face runs from the crown at phase 0 to the side extreme, the same on both sides; the side extreme is the ring's
      // farthest point from the median line.
      const sign: number = v < 0 ? -1 : 1;
      let side: number = 0;
      for (let k: number = 1; k <= SCAN; ++k) if (sign * ring(station, (sign * Math.PI * k) / SCAN)[1] > sign * ring(station, (sign * Math.PI * side) / SCAN)[1]) side = k;
      let [a, b]: [number, number] = [0, (sign * Math.PI * side) / SCAN];
      if (Math.abs(v) >= Math.abs(ring(station, b)[1])) return null;
      for (let i: number = 0; i < 40; ++i) {
        const middle: number = (a + b) / 2;
        if (Math.abs(ring(station, middle)[1]) < Math.abs(v)) a = middle;
        else b = middle;
      }
      return { gap: u - ring(station, (a + b) / 2)[0], station, phase: (a + b) / 2 };
    };
    const { centre, semi }: { centre: [number, number]; semi: [number, number] } = nail.outline;
    const chart = (clock: number, share: number): [number, number] => [Math.min(tip, centre[0] + share * semi[0] * Math.cos(clock)), centre[1] + share * semi[1] * Math.sin(clock)];
    // Inside the curve the skin lies under the plate's face; outside it stands over it, or no face is there.
    const outside = (clock: number, share: number): boolean => {
      const [s, t]: [number, number] = chart(clock, share);
      const found: { gap: number } | null = over(AutoMovieEngineLoftChain.point(host, s, t));
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
    const seed: { station: number; phase: number } | null = over(AutoMovieEngineLoftChain.point(host, s, t));
    if (seed === null) throw new Error("nail loop: " + nail.plate.name + "'s curve has no point on the plate at clock 0");
    return {
      centre: [centre[0] / 1000, centre[1]],
      semi: [semi[0] / 1000, semi[1]],
      shape,
      part: { station: seed.station / 1000, phase: seed.phase },
      host: { station: s / 1000, phase: t },
    };
  }

  /*
   * Phases a plate's ring is scanned at for its side extreme.
   */
  const SCAN: number = 24;
}
