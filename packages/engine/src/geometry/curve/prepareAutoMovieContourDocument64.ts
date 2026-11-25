import type {
  IAutoMovieAdmitContourEvents64,
  IAutoMovieContourLoft64,
  IAutoMoviePrepareContourDocument64Document,
  IAutoMoviePrepareContourDocument64Observation,
  IAutoMoviePrepareContourDocument64Slice,
  IAutoMoviePreparedContourEvent64,
} from "@automovie/interface";

import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import { admitAutoMovieContourEvents64 } from "./admitAutoMovieContourEvents64";

/** Admit saved contour events and build the local physical section document. */
export function prepareAutoMovieContourDocument64(
  input: IAutoMovieContourLoft64,
): IAutoMoviePrepareContourDocument64Document {
  if (input.chordToleranceMm <= 0)
    throw new Error("Positive physical curve chord tolerance required");
  if (
    input.sections.some(
      (section: IAutoMovieContourLoft64.ISection, i: number): boolean =>
        i > 0 && section.coordinateMm <= input.sections[i - 1]!.coordinateMm,
    )
  )
    throw new Error("Finite increasing section coordinates required");
  const admittedEvents: IAutoMovieAdmitContourEvents64.IResult =
    admitAutoMovieContourEvents64(input);
  const events: IAutoMovieContourLoft64.IEvent[] = admittedEvents.events;
  const document: IAutoMoviePrepareContourDocument64Document = {
    declaredEvents: events,
    slices: input.sections
      .filter(
        (section: IAutoMovieContourLoft64.ISection): boolean =>
          section.loops.length > 0 ||
          !events.some(
            (event: IAutoMovieContourLoft64.IEvent, i: number): boolean =>
              admittedEvents.unsupported[i] === undefined &&
              event.coordinateMm === section.coordinateMm,
          ),
      )
      .map(
        (
          section: IAutoMovieContourLoft64.ISection,
        ): IAutoMoviePrepareContourDocument64Slice => ({
          y: section.coordinateMm,
          loops: section.loops.map(
            (
              loop: IAutoMovieContourLoft64.ISection["loops"][number],
            ): IAutoMoviePrepareContourDocument64Observation => ({
              curve: loop.curve,
              winding: loop.winding,
            }),
          ),
        }),
      ),
    events: events.map(
      (
        event: IAutoMovieContourLoft64.IEvent,
        i: number,
      ): IAutoMoviePreparedContourEvent64 => ({
        y: event.coordinateMm,
        y0: event.beforeMm,
        y1: event.afterMm,
        point: event.terminal === null ? null : M.clone(event.terminal),
        below: event.before.map(
          (loop: number): IAutoMoviePreparedContourEvent64.IIncident => ({
            loop,
            winding: input.sections.find(
              (section: IAutoMovieContourLoft64.ISection): boolean =>
                section.coordinateMm === event.beforeMm,
            )!.loops[loop]!.winding,
          }),
        ),
        above: event.after.map(
          (loop: number): IAutoMoviePreparedContourEvent64.IIncident => ({
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
        ...(admittedEvents.unsupported[i] === undefined
          ? {}
          : { unsupported: admittedEvents.unsupported[i] }),
      }),
    ),
  };
  return document;
}
