import { expandAutoMovieInspectionSweep } from "../scene/inspection/expandAutoMovieInspectionSweep.js";
import type { IAutoMovieInspectionRequest } from "../scene/inspection/IAutoMovieInspectionRequest.js";
import type { IAutoMovieInspectionView } from "../scene/inspection/IAutoMovieInspectionView.js";
import { matchAutoMovieInspectionPath } from "../scene/inspection/matchAutoMovieInspectionPath.js";
import { parseAutoMovieInspectionView } from "../scene/inspection/parseAutoMovieInspectionView.js";
import type { IAutoMovieCaptureCell } from "./IAutoMovieCaptureCell.js";
import type { IAutoMovieCapturePlan } from "./IAutoMovieCapturePlan.js";
import type { IAutoMovieCapturePlanRequest } from "./IAutoMovieCapturePlanRequest.js";
import type { IAutoMovieCaptureSelection } from "./IAutoMovieCaptureSelection.js";
import type { IAutoMovieCaptureSubject } from "./IAutoMovieCaptureSubject.js";
import type { IAutoMovieCaptureTime } from "./IAutoMovieCaptureTime.js";
import { planAutoMovieCaptureFrames } from "./planAutoMovieCaptureFrames.js";
import { planAutoMovieCaptureLayout } from "./planAutoMovieCaptureLayout.js";


/**
 * Plan a capture as data before anything is drawn: check the request against what the subject offers, then list every cell, fixed by selection, time, view and pass, and lay them out for the reader budget.
 *
 * Cells are ordered by selection, then time, then view, then pass, so the views and passes of one instant sit together and every pass of a view shares its camera. A cell's name is its second written to the millisecond (`t002.000`), its view and pass, and for a swept selection its kind and unit, with every character other than letters, digits, `_` and `-` written `_`; a cell's caption names the frame, when the second lies on one, and the second to the millisecond, as the name writes it, then whichever of view, pass and selection vary in the plan, so a caption fits its cell whatever the second's digits. Times come from `planAutoMovieCaptureFrames` and the sheet layout from `planAutoMovieCaptureLayout`, with a row's group being the views times the passes.
 *
 * Frames around cuts are planned like those around events, for a video file whose cuts were detected before planning.
 *
 * It throws, before anything is drawn and naming what it refuses: a subject without a name or with a raster that is not a positive whole number of pixels; a view the subject does not offer, listing those it does; a `marks` pattern that matches none of the subject's mark kinds; a sweep that matches no drawn object; times outside the subject; and two cells that would take one name. Every view text is read by `parseAutoMovieInspectionView`, which refuses malformed text; `film` and a fixed camera need no name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cell order and why, how names and captions are formed, which planners supply times and layout, and every refusal with what it names.
 * @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/capture.md` fixes a cell by subject, time, view and pass and asks for every cell before any is drawn; every check here needs only the request and what the host learned of the subject, so a refused capture costs no drawing and leaves the previous one in place.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check the subject, the views and the marks, expand the selections, plan the times, then one nested loop builds the cells and one call lays them out.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Mark kinds and paths are matched by the inspection core's own pattern rule, sweeps grouped by its own sweep, and names collide only when two cells' fixing values write alike, which is refused instead of overwritten.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the cells, which are selections × times × views × passes, plus the mark-kind and sweep checks over the subject's kinds and drawables.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the request and the subject.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the cells it returns and one set of their names.
 */
export function planAutoMovieCapture(props: {
  /** What the capture asks for. */
  request: IAutoMovieCapturePlanRequest;

  /** What the host learned of the subject. */
  subject: IAutoMovieCaptureSubject;

  /** Seconds of the scene cuts detected in a video file, whose surrounding frames are drawn like an event's; empty for a drawn scene. */
  cuts: readonly number[];
}): IAutoMovieCapturePlan {
  const { request, subject } = props;
  if (subject.name.trim() === "") throw new Error("A capture subject has no name");
  if (
    ![subject.width, subject.height].every(
      (size: number): boolean => Number.isSafeInteger(size) && size > 0,
    )
  )
    throw new Error(
      `Subject ${subject.name}'s raster ${subject.width}x${subject.height} is not a positive whole number of pixels`,
    );

  // Views: well-formed, and a named one offered by the subject.
  for (const view of request.views) {
    const parsed: IAutoMovieInspectionView = parseAutoMovieInspectionView(view);
    if (parsed.type === "named" && !subject.views.includes(parsed.name))
      throw new Error(
        `Subject ${subject.name} has no view "${parsed.name}"; it offers ${subject.views.join(", ")}, film, or a camera by coordinates`,
      );
  }

  // Marks: every kind pattern matches a kind the subject supplies.
  for (const pattern of request.inspection.marks)
    if (
      !subject.marks.some((kind: string): boolean =>
        matchAutoMovieInspectionPath(kind, pattern),
      )
    )
      throw new Error(
        `Mark pattern "${pattern}" matches none of subject ${subject.name}'s mark kinds: ${subject.marks.join(", ") || "none"}`,
      );

  // Selections: the request's own, or each swept unit alone and with its neighbours.
  const selections: IAutoMovieCaptureSelection[] =
    request.sweep === null
      ? [{ kind: "whole", parts: request.inspection.parts }]
      : sweep(request, subject);

  // Times, then every cell.
  const frames: ReturnType<typeof planAutoMovieCaptureFrames> =
    planAutoMovieCaptureFrames({
    durationSeconds: subject.durationSeconds,
    fps: subject.fps,
    sampling: request.sampling,
    events: request.events,
    cuts: props.cuts,
    window: request.window,
  });
  const { times, windows } = frames;
  const cells: IAutoMovieCaptureCell[] = [];
  const names: Set<string> = new Set();
  for (const selection of selections)
    for (const time of times)
      for (const view of request.views)
        for (const pass of request.passes) {
          const name: string = [
            `t${time.seconds.toFixed(3).padStart(7, "0")}`,
            slug(view),
            pass,
            ...(selection.kind === "whole"
              ? []
              : [selection.kind, slug(selection.unit)]),
          ].join("-");
          if (names.has(name))
            throw new Error(
              `Two capture cells take the name ${name}; give seconds at least a millisecond apart and views that differ in letters or digits`,
            );
          names.add(name);
          cells.push({
            index: cells.length,
            name,
            selection,
            time,
            view,
            pass,
            request: inspect(request.inspection, pass, selection),
            caption: caption(request, selections.length, time, view, pass, selection),
          });
        }

  return {
    subject,
    request,
    times,
    windows,
    cells,
    layout: planAutoMovieCaptureLayout({
      width: subject.width,
      height: subject.height,
      count: cells.length,
      group: request.views.length * request.passes.length,
      budget: request.budget,
    }),
  };
}

/** Each unit the sweep pattern matches, alone and with its neighbours. */
function sweep(
  request: IAutoMovieCapturePlanRequest,
  subject: IAutoMovieCaptureSubject,
): IAutoMovieCaptureSelection[] {
  const units: ReturnType<typeof expandAutoMovieInspectionSweep> =
    expandAutoMovieInspectionSweep({
      objects: subject.drawables,
      pattern: request.sweep!,
      margin: request.margin,
    });

  // A unit with no neighbour draws once, since its neighbour cell would equal its alone cell.
  return units.flatMap(
    (
      unit: ReturnType<typeof expandAutoMovieInspectionSweep>[number],
    ): IAutoMovieCaptureSelection[] => {
      const self: string[] = unit.unit === "" ? ["**"] : [...unit.alone];
      return [
        { kind: "alone", unit: unit.unit, parts: self },
        ...(unit.neighbours.length === 0
          ? []
          : [
              {
                kind: "neighbours",
                unit: unit.unit,
                parts: [...self, ...unit.neighbours],
              } satisfies IAutoMovieCaptureSelection,
            ]),
      ];
    },
  );
}
/** The plan's inspection with a cell's pass and selection. */
function inspect(
  inspection: IAutoMovieInspectionRequest,
  pass: IAutoMovieInspectionRequest.Shade,
  selection: IAutoMovieCaptureSelection,
): IAutoMovieInspectionRequest {
  return { ...inspection, shade: pass, parts: [...selection.parts] };
}

/** A view text as a file-name part: runs of other characters than letters, digits, `_` and `-` become `_`. */
function slug(text: string): string {
  return text.replace(/[^A-Za-z0-9_-]+/gu, "_");
}

/** What a sheet cell says: frame and second, then whatever varies in the plan. */
function caption(
  request: IAutoMovieCapturePlanRequest,
  selections: number,
  time: IAutoMovieCaptureTime,
  view: string,
  pass: IAutoMovieInspectionRequest.Shade,
  selection: IAutoMovieCaptureSelection,
): string {
  return [
    ...(time.frame === null ? [] : [`f${time.frame}`]),
    `${time.seconds.toFixed(3)}s`,
    ...(request.views.length > 1 ? [view] : []),
    ...(request.passes.length > 1 ? [pass] : []),
    ...(selections > 1
      ? [selection.kind === "whole" ? "whole" : `${selection.kind} ${selection.unit}`]
      : []),
  ].join(" ");
}
