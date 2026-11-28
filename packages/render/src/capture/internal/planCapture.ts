import type {
  AutoMovieInspectionShade,
  IAutoMovieCaptureCell,
  IAutoMovieCaptureInstant,
  IAutoMovieCapturePlan,
  IAutoMovieCapturePlanProps,
  IAutoMovieCapturePlanRequest,
  IAutoMovieCaptureSelection,
  IAutoMovieCaptureSubject,
  IAutoMovieCaptureTime,
  IAutoMovieInspectionRequest,
  IAutoMovieInspectionView,
  IAutoMoviePlaybackEvent,
} from "@automovie/interface";

import { expandInspectionSweep } from "../../scene/inspection/internal/expandInspectionSweep";
import { matchInspectionPath } from "../../scene/inspection/internal/matchInspectionPath";
import { parseInspectionView } from "../../scene/inspection/internal/parseInspectionView";
import { planCaptureFrames } from "./planCaptureFrames";
import { planCaptureLayout } from "./planCaptureLayout";
import { resolveCaptureCue } from "./resolveCaptureCue";

/*
 * Plan a capture as data before anything is drawn: check the request against
 * what the subject offers, then list every cell, fixed by selection, time, view
 * and pass, and lay them out for the reader budget.
 *
 * Cells are ordered by selection, then time, then view, then pass, so the views
 * and passes of one instant sit together and every pass of a view shares its
 * camera. A cell's name is its second written to the millisecond (`t002.000`),
 * its view and pass, and for a swept selection its kind and unit, with every
 * character other than letters, digits, `_` and `-` written `_`; a cell's
 * caption names the frame, when the second lies on one, and the second to the
 * millisecond, as the name writes it, then the label of the subject's named
 * instant written the same to the millisecond, which the cell also carries as
 * label, then whichever of view, pass and selection vary in the plan, so a
 * caption fits its cell whatever the second's digits. Times come from
 * `planCaptureFrames` and the sheet layout from
 * `planCaptureLayout`, with a row's group being the views times the
 * passes.
 *
 * Frames around cuts are planned like those around events, for a video file
 * whose cuts were detected before planning.
 *
 * It throws, before anything is drawn and naming what it refuses: a subject
 * without a name or with a raster that is not a positive whole number of
 * pixels; a view the subject does not offer, listing those it does; a `marks`
 * pattern that matches none of the subject's mark kinds; a sweep that matches
 * no drawn object; times outside the subject; and two cells that would take one
 * name. Every view text is read by `parseInspectionView`, which
 * refuses malformed text; `film` and a fixed camera need no name.
 */
export function planCapture(
  props: IAutoMovieCapturePlanProps,
): IAutoMovieCapturePlan {
  const { request, subject } = props;
  if (subject.name.trim() === "")
    throw new Error("A capture subject has no name");
  if (
    ![subject.width, subject.height].every((size: number): boolean => size > 0)
  )
    throw new Error(
      `Subject ${subject.name}'s raster ${subject.width}x${subject.height} is not a positive whole number of pixels`,
    );

  // Views: well-formed, and a named one offered by the subject.
  for (const view of request.views) {
    const parsed: IAutoMovieInspectionView = parseInspectionView(view);
    if (parsed.type === "named" && !subject.views.includes(parsed.name))
      throw new Error(
        `Subject ${subject.name} has no view "${parsed.name}"; it offers ${subject.views.join(", ")}, film, or a camera by coordinates`,
      );
  }

  // Marks: every kind pattern matches a kind the subject supplies.
  for (const pattern of request.inspection.marks)
    if (
      !subject.marks.some((kind: string): boolean =>
        matchInspectionPath(kind, pattern),
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
  const playedCue: Readonly<IAutoMoviePlaybackEvent> | undefined =
    request.cue === undefined ? undefined : resolveCaptureCue(subject, request.cue);
  const frames: ReturnType<typeof planCaptureFrames> =
    planCaptureFrames({
      durationSeconds: subject.durationSeconds,
      fps: subject.fps,
      sampling: playedCue === undefined ? request.sampling : { kind: "at", seconds: [] },
      events: playedCue === undefined ? request.events : [playedCue.globalTime],
      cuts: props.cuts,
      window: request.window,
    });
  const { times, windows } = frames;
  if (playedCue !== undefined && !times.some((time: IAutoMovieCaptureTime): boolean => time.seconds === playedCue.globalTime)) {
    // The neighboring native frame never stands in for an exact played pose.
    times.push({ seconds: playedCue.globalTime, frame: null });
    times.sort((left: IAutoMovieCaptureTime, right: IAutoMovieCaptureTime): number => left.seconds - right.seconds);
  }
  const cells: IAutoMovieCaptureCell[] = [];
  const names: Map<string, string> = new Map();

  // Named instants by their second to the millisecond, the resolution a cell is named at.
  const labels: Map<string, string> = new Map(
    (subject.instants ?? []).map(
      (instant: IAutoMovieCaptureInstant): [string, string] => [
        instant.seconds.toFixed(3),
        instant.label,
      ],
    ),
  );
  for (const selection of selections)
    for (const time of times)
      for (const view of request.views)
        for (const pass of request.passes) {
          const atCue: boolean = playedCue !== undefined && playedCue.globalTime === time.seconds;
          const name: string = [
            `t${time.seconds.toFixed(3).padStart(7, "0")}`,
            ...(atCue && time.frame === null ? ["pose"] : []),
            slug(view),
            pass,
            ...(selection.kind === "whole"
              ? []
              : [selection.kind, slug(selection.unit)]),
          ].join("-");
          const key: string = name.toLowerCase();
          const previous: string | undefined = names.get(key);
          if (previous !== undefined)
            throw new Error(
              `Capture cells "${previous}" and "${name}" would write the same PNG on a case-insensitive file system. Choose times, views or swept units that give distinct file names.`,
            );
          names.set(key, name);
          const label: string | null =
            atCue ? playedCue!.id : labels.get(time.seconds.toFixed(3)) ?? null;
          cells.push({
            index: cells.length,
            name,
            selection,
            time,
            view,
            pass,
            request: inspect(request.inspection, pass, selection),
            label,
            caption: caption(
              request,
              selections.length,
              time,
              label,
              view,
              pass,
              selection,
            ),
          });
        }

  return {
    subject,
    request,
    times,
    windows,
    ...(playedCue === undefined ? {} : { playedCue }),
    cells,
    layout: planCaptureLayout({
      width: subject.width,
      height: subject.height,
      count: cells.length,
      group: request.views.length * request.passes.length,
      budget: request.budget,
      // A cell the draw fails is captioned with " not drawn" after its caption.
      captions: cells.map(
        (cell: IAutoMovieCaptureCell): string => `${cell.caption} not drawn`,
      ),
    }),
  };
}

/*
 * Each unit the sweep pattern matches, alone and with its neighbours.
 */
function sweep(
  request: IAutoMovieCapturePlanRequest,
  subject: IAutoMovieCaptureSubject,
): IAutoMovieCaptureSelection[] {
  const units: ReturnType<typeof expandInspectionSweep> =
    expandInspectionSweep({
      objects: subject.drawables,
      pattern: request.sweep!,
      margin: request.margin,
    });

  // A unit with no neighbour draws once, since its neighbour cell would equal its alone cell.
  return units.flatMap(
    (
      unit: ReturnType<typeof expandInspectionSweep>[number],
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
/*
 * The plan's inspection with a cell's pass and selection.
 */
function inspect(
  inspection: IAutoMovieInspectionRequest,
  pass: AutoMovieInspectionShade,
  selection: IAutoMovieCaptureSelection,
): IAutoMovieInspectionRequest {
  return { ...inspection, shade: pass, parts: [...selection.parts] };
}

/*
 * A view text as a file-name part: runs of other characters than letters,
 * digits, `_` and `-` become `_`.
 */
function slug(text: string): string {
  return text.replace(/[^A-Za-z0-9_-]+/gu, "_");
}

/*
 * What a sheet cell says: frame and second, the named instant's label, then
 * whatever varies in the plan.
 */
function caption(
  request: IAutoMovieCapturePlanRequest,
  selections: number,
  time: IAutoMovieCaptureTime,
  label: string | null,
  view: string,
  pass: AutoMovieInspectionShade,
  selection: IAutoMovieCaptureSelection,
): string {
  return [
    ...(time.frame === null ? [] : [`f${time.frame}`]),
    `${time.seconds.toFixed(3)}s`,
    ...(label === null ? [] : [label]),
    ...(request.views.length > 1 ? [view] : []),
    ...(request.passes.length > 1 ? [pass] : []),
    ...(selections > 1
      ? [
          selection.kind === "whole"
            ? "whole"
            : `${selection.kind} ${selection.unit}`,
        ]
      : []),
  ].join(" ");
}
