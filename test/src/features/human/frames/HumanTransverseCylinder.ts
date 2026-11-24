import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection } from "@automovie/human";
import type { IAutoMovieHumanConicLoft, IAutoMovieViewPart } from "@automovie/interface";

/** One transverse cylinder crosses both sides of a large wall. Its two saddle curves share no source branch. */
export function HumanTransverseCylinder() {
  const full: number = Math.SQRT2 - 1;
  const cylinder = (name: string, from: [number, number, number], to: [number, number, number], up: [number, number, number], length: number, radius: number): IAutoMovieHumanConicLoft.IFamily => ({
    name,
    centres: [from, to],
    halves: [],
    up,
    layout: AutoMovieHumanConicSection.limb(0),
    knots: [0, length / 2, length],
    values: [[radius, radius, radius], [0, 0, 0], [0, 0, 0], [radius, radius, radius], [-radius, -radius, -radius], [0, 0, 0], [0, 0, 0], [-radius, -radius, -radius], ...[0, 1, 2, 3].map((): number[] => [full, full, full])],
  });
  const every = (length: number): number[] => Array.from({ length: length / 10 + 1 }, (_: unknown, i: number): number => 10 * i);
  const host: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(cylinder("host", [0, 0, 0], [0, 400, 0], [1, 0, 0], 400, 100), every(400));
  const crossing = AutoMovieHumanConicLoft.part(cylinder("both", [0, 200, -150], [0, 200, 150], [0, 1, 0], 300, 20), [0, 150, 300]);
  return { host, crossing, phases: [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2] };
}
