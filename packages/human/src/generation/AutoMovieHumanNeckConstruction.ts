import { AutoMovieHumanHorizontalChain } from "../lofting/AutoMovieHumanHorizontalChain";
import type { IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanNeckSource } from "./AutoMovieHumanNeckSource";

/**
 * Transitional chain adapter for the old trunk assembly. Its input is the
 * same pure generating record the head reads without constructing a chain.
 * The remaining HumanHorizontalChain call is old-trunk debt, not a head
 * layout dependency or a demonstrated anatomical tape construction.
 */
export namespace AutoMovieHumanNeckConstruction {
  /**
   * The neck's chain.
   *
   * @param source Shared original generating descriptors, calibration mm.
   * @returns The temporary chain named head, consumed by the old trunk.
   */
  export function generate(source: AutoMovieHumanNeckSource.IOutput): IAutoMovieLoftChain {
    return AutoMovieHumanHorizontalChain.build(
      {
        name: "head",
        order: source.order,
        samples: source.samples,
        rule: "sagittal",
      },
      source.rows.map((row: AutoMovieHumanNeckSource.IRow): [number, number, number][] =>
        Array.from({ length: source.order }, (_: unknown, j: number): [number, number, number] => AutoMovieHumanNeckSource.point(row, 2 * Math.PI * j / source.order))),
    );
  }
}
