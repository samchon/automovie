import type {
  IAutoMovieContourLoft64,
  IAutoMovieHumanHandConstruction,
} from "@automovie/interface";

import { AutoMovieHumanHandPalm } from "./AutoMovieHumanHandPalm";

/** Restore a caller's authored contour incidence for the hand. */
export namespace AutoMovieHumanHandConstruction {
  /** Restore exactly the declared contour coefficients and event incidence. */
  export function fixedContour(
    value: IAutoMovieHumanHandConstruction.IFixedContourInput,
  ): IAutoMovieContourLoft64 {
    const point: typeof AutoMovieHumanHandPalm.fixedPoint =
      AutoMovieHumanHandPalm.fixedPoint;
    return {
      ...value,
      sections: value.sections.map(
        (
          section: IAutoMovieHumanHandConstruction.IFixedContourInput["sections"][number],
        ): IAutoMovieContourLoft64.ISection => ({
          ...section,
          loops: section.loops.map(
            (
              loop: (typeof section.loops)[number],
            ): IAutoMovieContourLoft64.ISection["loops"][number] => {
              if (loop.winding !== 1 && loop.winding !== -1)
                throw new Error("A fixed contour loop has no declared winding");
              return {
                ...loop,
                winding: loop.winding,
                curve: AutoMovieHumanHandPalm.fixedCurve(loop.curve),
              };
            },
          ),
        }),
      ),
      events: value.events.map(
        (
          event: IAutoMovieHumanHandConstruction.IFixedContourInput["events"][number],
        ): IAutoMovieContourLoft64.IEvent => {
          if (
            event.kind !== "saddle" &&
            event.kind !== "minimum" &&
            event.kind !== "maximum"
          )
            throw new Error("A fixed contour event has an unknown incidence");
          return {
            ...event,
            kind: event.kind,
            terminal: event.terminal === null ? null : point(event.terminal),
          };
        },
      ),
    };
  }
}
