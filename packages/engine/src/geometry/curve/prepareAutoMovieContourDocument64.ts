import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";
import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

type V3 = M.V;
interface Observation {
  curve: IAutoMovieCurve64.Cubic;
  winding: number;
}
interface Slice {
  y: number;
  loops: Observation[];
}
interface Incident {
  loop: number;
  winding: number;
}
interface Critical {
  y: number;
  y0: number;
  y1: number;
  point: V3 | null;
  below: Incident[];
  above: Incident[];
  lowerLinkComponents: number;
  upperLinkComponents: number;
  manifoldLink: boolean;
  equalHeightNeighbour: boolean;
}
interface Document {
  slices: Slice[];
  events: Critical[];
}

/**
 * Admit saved contour events and build the local physical section document.
 *
 * @evidence contracts/common.md#principled-implementation The unchanged finite-station and explicit event-incidence checks precede exact field mapping; terminals remain declared generating observations.
 * @evidence contracts/common.md#clear-and-simple-design The contour tessellator delegates structural admission and event mapping to one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing arithmetic, admission, coefficient authority and explicit failure meanings remain unchanged; no source geometry fallback is added.
 * @evidence contracts/common.md#meaningful-documentation States the owned stage and immutable inputs; output qualification remains with the caller.
 * @evidence contracts/performance.md#efficient-algorithms For K sections and E event incidences the original section lookups and incidence traversal are retained.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call reuses its prepared data for the same original lifetime without a new cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned section/event records belong to one tessellation; validation sets expire on return.
 */
export function prepareAutoMovieContourDocument64(
  input: IAutoMovieContourLoft64,
): Document {
  if (!Number.isFinite(input.chordToleranceMm) || input.chordToleranceMm <= 0)
    throw new Error("Positive physical curve chord tolerance required");
  if (
    input.sections.some(
      (section: IAutoMovieContourLoft64.ISection, i: number): boolean =>
        !Number.isFinite(section.coordinateMm) ||
        (i > 0 && section.coordinateMm <= input.sections[i - 1]!.coordinateMm),
    )
  )
    throw new Error("Finite increasing section coordinates required");
  const coordinates: Set<number> = new Set(
    input.sections.map(
      (section: IAutoMovieContourLoft64.ISection): number =>
        section.coordinateMm,
    ),
  );
  const names: Set<string> = new Set();
  for (const event of input.events) {
    if (
      !event.name ||
      names.has(event.name) ||
      !Number.isFinite(event.coordinateMm) ||
      !(
        event.beforeMm < event.coordinateMm &&
        event.coordinateMm < event.afterMm
      ) ||
      !coordinates.has(event.beforeMm) ||
      !coordinates.has(event.afterMm)
    )
      throw new Error(
        "A named event must lie between its declared saved sections",
      );
    names.add(event.name);
    if (event.kind !== "saddle" && event.terminal === null)
      throw new Error("An extremum requires its explicit generating terminal");
    if (event.terminal !== null && !event.terminal.every(Number.isFinite))
      throw new Error("Finite event terminal coordinates required");
    if (event.before.length + event.after.length === 0)
      throw new Error("A topology event requires incident contours");
    for (const [coordinate, indices] of [
      [event.beforeMm, event.before],
      [event.afterMm, event.after],
    ] as [number, readonly number[]][]) {
      const section: IAutoMovieContourLoft64.ISection = input.sections.find(
        (candidate: IAutoMovieContourLoft64.ISection): boolean =>
          candidate.coordinateMm === coordinate,
      )!;
      if (
        indices.some(
          (index: number): boolean =>
            !Number.isInteger(index) ||
            index < 0 ||
            index >= section.loops.length,
        )
      )
        throw new Error("Event contour index leaves its declared section");
    }
  }
  const document: Document = {
    slices: input.sections
      .filter(
        (section: IAutoMovieContourLoft64.ISection): boolean =>
          section.loops.length > 0 ||
          !input.events.some(
            (event: IAutoMovieContourLoft64.IEvent): boolean =>
              event.coordinateMm === section.coordinateMm,
          ),
      )
      .map(
        (section: IAutoMovieContourLoft64.ISection): Slice => ({
          y: section.coordinateMm,
          loops: section.loops.map(
            (
              loop: IAutoMovieContourLoft64.ISection["loops"][number],
            ): Observation => ({ curve: loop.curve, winding: loop.winding }),
          ),
        }),
      ),
    events: input.events.map(
      (event: IAutoMovieContourLoft64.IEvent): Critical => ({
        y: event.coordinateMm,
        y0: event.beforeMm,
        y1: event.afterMm,
        point: event.terminal === null ? null : M.clone(event.terminal),
        below: event.before.map(
          (loop: number): Incident => ({
            loop,
            winding: input.sections.find(
              (section: IAutoMovieContourLoft64.ISection): boolean =>
                section.coordinateMm === event.beforeMm,
            )!.loops[loop]!.winding,
          }),
        ),
        above: event.after.map(
          (loop: number): Incident => ({
            loop,
            winding: input.sections.find(
              (section: IAutoMovieContourLoft64.ISection): boolean =>
                section.coordinateMm === event.afterMm,
            )!.loops[loop]!.winding,
          }),
        ),
        lowerLinkComponents: event.kind === "minimum" ? 0 : 1,
        upperLinkComponents: event.kind === "maximum" ? 0 : 1,
        manifoldLink: event.regular,
        equalHeightNeighbour: !event.regular,
      }),
    ),
  };
  return document;
}
