import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import { HumanVerdictInspection } from "@automovie/motions";

import type { IFilmProduction } from "./IFilmProduction";

/**
 * The findings and coverage one inspection packet carries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which part of the inspection diagnostics one verdict packet carries.
 * @evidence contracts/development/design.md#principled-representation Picks its members from the interface's inspection diagnostics, so the packet keeps the inspector's own shape. Derives the members from the interface type instead of restating them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Carries only the two members the verdict reader fills; the rest of the diagnostics stays with the inspector.
 */
export type FilmVerdictPacket = Pick<
  IAutoMovieInspectionDiagnostics,
  "findings" | "coverage"
>;

/**
 * The verdict reader of one mounted film: reads the film's human performance
 * through `IFilmProduction.humanPerformance` the first time it is called and
 * answers every later call with the same findings and coverage.
 *
 * The report judges the whole performance, which costs seconds to minutes, so a
 * capture or delivery run keeps it for the run; the mount that owns the run
 * owns the reader. A film without the member has no reader.
 *
 * @param production The film.
 * @returns The memoizing reader, or `undefined` for a film without a human
 *   performance.
 * @evidence contracts/development/common.md#meaningful-documentation States what the reader reads, when, and that it is kept for the run.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the film's performance once through motions' report mapper and keeps the mapped packet. A film without the member has no reader, so no verdict coverage is invented.
 * @evidence contracts/development/implementation.md#efficient-algorithms One closure holding the packet, filled at the first call. The report is read once per run and its mapping is linear in the report. Every sample of the run shares the one packet. Keeps only the mapped packet, never the performance, and the mount's disposal drops the reader.
 */
export function readFilmVerdicts(
  production: IFilmProduction,
): (() => FilmVerdictPacket) | undefined {
  const source: IFilmProduction["humanPerformance"] =
    production.humanPerformance?.bind(production);
  if (source === undefined) return undefined;
  let packet: FilmVerdictPacket | undefined;
  return (): FilmVerdictPacket =>
    (packet ??= HumanVerdictInspection.read(source()));
}
