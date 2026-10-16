import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import type { AutoMovieHumanCageBuilder } from "./AutoMovieHumanCageBuilder";

/**
 * Close one generated station using the builder's existing Coons quad grid.
 *
 * The builder owns vertex identity and face/chart emission; this module owns
 * the cap's boundary walk, Coons interior, axial dome and polar chart pole.
 * Positions and height are model millimetres; axis is a model-frame unit
 * direction. The 4m boundary order, emitted vertex/face order and wrap-pole
 * averaging are retained so existing ear and neck consumers keep their cage.
 *
 * @param builder Owning part assembly; only its public emission methods are used
 * @param station Closed station counterclockwise about the outward axis
 * @param axis Unit outward axis, in the same model frame as the station
 * @param height Centre rise in millimetres, including the original signed convention
 * @throws Error When the station does not have 4m vertices with m at least two
 */
export function capAutoMovieHumanCage(
  builder: Pick<AutoMovieHumanCageBuilder, "position" | "vertex" | "face">,
  station: AutoMovieHumanCageBuilder.IStation,
  axis: IAutoMovieVector3,
  height: number,
): void {
    const n: number = station.vertices.length;
    if (n % 4 !== 0 || n < 8)
      throw new Error(
        `a cap needs a multiple of four of at least 8 vertices, got ${n}`,
      );
    const m: number = n / 4;
    // Boundary walk counterclockwise from (floor(m/2), 0), the station's vertex 0.
    const walk: Array<[number, number]> = [];
    for (let i: number = 0; i < m; ++i) walk.push([i, 0]);
    for (let j: number = 0; j < m; ++j) walk.push([m, j]);
    for (let i: number = m; i > 0; --i) walk.push([i, m]);
    for (let j: number = m; j > 0; --j) walk.push([0, j]);
    const shift: number = Math.floor(m / 2);
    const grid: number[][] = Array.from({ length: m + 1 }, (): number[] =>
      new Array<number>(m + 1).fill(-1),
    );
    const chart: AutoMovieHumanCageBuilder.IChart[][] = Array.from(
      { length: m + 1 },
      (): AutoMovieHumanCageBuilder.IChart[] => new Array(m + 1),
    );
    walk.forEach(([i, j]: [number, number], w: number): void => {
      const k: number = (w - shift + n) % n;
      grid[i]![j] = station.vertices[k]!;
      chart[i]![j] = station.coordinates[k]!;
    });
    const at: (i: number, j: number) => IAutoMovieVector3 = (i: number, j: number): IAutoMovieVector3 =>
      builder.position(grid[i]![j]!);
    const u0: number = station.coordinates[0]!.u;
    for (let i: number = 1; i < m; ++i)
      for (let j: number = 1; j < m; ++j) {
        const s: number = i / m;
        const t: number = j / m;
        const coons: IAutoMovieVector3 = AutoMovieHumanVector.offset(
          AutoMovieHumanVector.of(0, 0, 0),
          [at(i, 0), 1 - t],
          [at(i, m), t],
          [at(0, j), 1 - s],
          [at(m, j), s],
          [at(0, 0), -(1 - s) * (1 - t)],
          [at(m, 0), -s * (1 - t)],
          [at(0, m), -(1 - s) * t],
          [at(m, m), -s * t],
        );
        const inside: number =
          1 - Math.max(Math.abs(2 * s - 1), Math.abs(2 * t - 1));
        grid[i]![j] = builder.vertex(
          AutoMovieHumanVector.offset(coons, [
            axis,
            height * Math.sin((inside * Math.PI) / 2),
          ]),
        );
        const centre: boolean = 2 * i === m && 2 * j === m;
        chart[i]![j] = {
          u: u0 + (1 - u0) * inside,
          v: centre
            ? Number.NaN
            : ((Math.atan2(t - 0.5, s - 0.5) -
                Math.atan2(-0.5, (shift - m / 2) / m)) /
                (2 * Math.PI) +
                2) %
              1,
        };
      }
    for (let i: number = 0; i < m; ++i)
      for (let j: number = 0; j < m; ++j) {
        const corners: Array<[number, number]> = [
          [i, j],
          [i + 1, j],
          [i + 1, j + 1],
          [i, j + 1],
        ];
        const charts: AutoMovieHumanCageBuilder.IChart[] = corners.map(
          ([a, b]: [number, number]): AutoMovieHumanCageBuilder.IChart =>
            chart[a]![b]!,
        );
        const known: number[] = charts
          .filter(
            (c: AutoMovieHumanCageBuilder.IChart): boolean =>
              !Number.isNaN(c.v),
          )
          .map((c: AutoMovieHumanCageBuilder.IChart): number => c.v);
        const spread: boolean = Math.max(...known) - Math.min(...known) > 0.5;
        const unwrapped: number[] = known.map((v: number): number =>
          spread && v < 0.5 ? v + 1 : v,
        );
        const mean: number =
          unwrapped.reduce((a: number, b: number): number => a + b, 0) /
          unwrapped.length;
        builder.face(
          corners.map(([a, b]: [number, number]): number => grid[a]![b]!) as [
            number,
            number,
            number,
            number,
          ],
          charts.map(
            (
              c: AutoMovieHumanCageBuilder.IChart,
            ): AutoMovieHumanCageBuilder.IChart =>
              Number.isNaN(c.v) ? { u: c.u, v: mean % 1 } : c,
          ) as [
            AutoMovieHumanCageBuilder.IChart,
            AutoMovieHumanCageBuilder.IChart,
            AutoMovieHumanCageBuilder.IChart,
            AutoMovieHumanCageBuilder.IChart,
          ],
        );
      }
}
