import { AutoMovieLoftViewRead, AutoMovieLoftViewSource } from "@automovie/engine";
import type { IAutoMovieViewPart } from "@automovie/interface";

/** Reads physical conic-wall calipers from actual native sources. */
export namespace AutoMovieHumanNativeCalipers {
  /**
   * Read a declared caliper on its actual native source and owned domain.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Native scalar preparation/read supplies the actual opposite signed-support distances; depth and breadth are their sums in physical mm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One native-source admission precedes one site read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A site outside the actual kept source domain, malformed source or unavailable scalar is refused, never replaced by another family's target or extrapolation.
   * @evidence contracts/development/common.md#meaningful-documentation Bare conic-wall calipers exclude independent relief features and clinical tape/posture claims.
   * @evidence contracts/development/implementation.md#efficient-algorithms Existing linear source preparation plus its bounded scalar reads; no loft or mesh is built.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This narrow pure read has no cross-call cache; the caller owns its immutable source bank.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Scalar preparation has call lifetime and only two physical calipers are returned.
   */
  export function read(
    part: IAutoMovieViewPart,
    station: number,
  ): { depth: number; breadth: number } {
    if (!(station >= part.stations[0]! && station <= part.stations.at(-1)!))
      throw new Error(
        part.name +
          " caliper site " +
          station +
          " is outside its actual source domain",
      );
    const prepared = AutoMovieLoftViewSource.create(part);
    if (prepared === null || prepared.source === null)
      throw new Error("native caliper source unavailable: " + part.name);
    const values = AutoMovieLoftViewRead.values(prepared.source, station);
    if (typeof values === "string") throw new Error(values);
    return {
      depth: values.extents[0]! + values.extents[2]!,
      breadth: values.extents[1]! + values.extents[3]!,
    };
  }
}
