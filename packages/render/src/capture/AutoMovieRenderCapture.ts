import { type IAutoMovieCaptureComparison, type IAutoMovieCaptureComparisonProps, type IAutoMovieCaptureFindingDiff, type IAutoMovieInspectionDiagnostics, type IAutoMovieCapturePlanRequest, type IAutoMovieCaptureRequestSource, type IAutoMovieCapturePlan, type IAutoMovieCapturePlanProps, type IAutoMovieCaptureFramePlan, type IAutoMovieCaptureFramePlanProps, type IAutoMovieCaptureLayout, type IAutoMovieCaptureLayoutProps, type IAutoMoviePlanVideoFramesProps, type IAutoMoviePlanVideoSceneCutsProps, type IAutoMovieCaptureVideoSource, type IAutoMovieCaptureResolution, type IAutoMovieResolveCapturePatternsProps, type IAutoMovieCaptureRecord, type IAutoMovieRunCaptureProps, type IAutoMovieRunVideoCaptureProps, type IAutoMovieRasterImage } from "@automovie/interface";
import { compareAutoMovieCaptureRounds as compareAutoMovieCaptureRoundsImplementation } from "./internal/compareAutoMovieCaptureRounds.js";
import { diffAutoMovieCaptureFindings as diffAutoMovieCaptureFindingsImplementation } from "./internal/diffAutoMovieCaptureFindings.js";
import { formatAutoMovieCapturePlanRequest as formatAutoMovieCapturePlanRequestImplementation } from "./internal/formatAutoMovieCapturePlanRequest.js";
import { parseAutoMovieCapturePlanRequest as parseAutoMovieCapturePlanRequestImplementation } from "./internal/parseAutoMovieCapturePlanRequest.js";
import { planAutoMovieCapture as planAutoMovieCaptureImplementation } from "./internal/planAutoMovieCapture.js";
import { planAutoMovieCaptureFrames as planAutoMovieCaptureFramesImplementation } from "./internal/planAutoMovieCaptureFrames.js";
import { planAutoMovieCaptureLayout as planAutoMovieCaptureLayoutImplementation } from "./internal/planAutoMovieCaptureLayout.js";
import { planAutoMovieVideoFrames as planAutoMovieVideoFramesImplementation } from "./internal/planAutoMovieVideoFrames.js";
import { planAutoMovieVideoSceneCuts as planAutoMovieVideoSceneCutsImplementation } from "./internal/planAutoMovieVideoSceneCuts.js";
import { readAutoMovieCaptureArguments as readAutoMovieCaptureArgumentsImplementation } from "./internal/readAutoMovieCaptureArguments.js";
import { readAutoMovieVideoSceneCuts as readAutoMovieVideoSceneCutsImplementation } from "./internal/readAutoMovieVideoSceneCuts.js";
import { resolveAutoMovieCapturePatterns as resolveAutoMovieCapturePatternsImplementation } from "./internal/resolveAutoMovieCapturePatterns.js";
import { runAutoMovieCapture as runAutoMovieCaptureImplementation } from "./internal/runAutoMovieCapture.js";
import { runAutoMovieVideoCapture as runAutoMovieVideoCaptureImplementation } from "./internal/runAutoMovieVideoCapture.js";
import { scaleAutoMovieCaptureLabels as scaleAutoMovieCaptureLabelsImplementation } from "./internal/scaleAutoMovieCaptureLabels.js";

/** Public operations for Auto Movie Render Capture. */
export namespace AutoMovieRenderCapture {
  /**
   * Compare the cells a capture just wrote against an earlier round's, write a
   * difference image for every changed pair, and lay every pair on comparison
   * sheets.
   *
   * Under `cell`, two cells pair when their selection, second, view and pass
   * agree; when both state a resolved camera and the cameras differ, the cells
   * stay unmatched, because a view that fits itself to its subject can resolve to
   * another camera. Under `time`, cells pair by second, pass and selection. A
   * unique pair may have different views, as when an encoded file is compared
   * with its drawn source. Where a key repeats, only unique equal views pair.
   * Surplus, incompatible or ambiguous rows are reported as unmatched. A pair
   * whose stills name the same backend is measured by
   * `AutoMovieRenderPicture.compareRasters` at `tolerance`, and a changed pair
   * gets `diff-<name>.png`, the newer picture dimmed with every changed pixel in
   * magenta. A pair drawn by different or unstated backends is laid side by side
   * without a difference image. A cell either capture failed to draw, a cell only
   * one capture holds and a measured pair whose rasters differ are unmatched,
   * each with the cause.
   *
   * The findings of the two rounds are compared by diffAutoMovieCaptureFindings,
   * from the earlier record's diagnostics and this round's, which the caller
   * reduces first.
   *
   * Each entry takes three consecutive cells of the comparison sheets, the
   * earlier still, this capture's still and the difference image, with a marked
   * cell where a side or the difference is missing; rows and sheets hold whole
   * entries, laid out for `budget` and named `comparison-001.png` onwards.
   */
  export function compareRounds(props: IAutoMovieCaptureComparisonProps): Promise<IAutoMovieCaptureComparison> {
    return compareAutoMovieCaptureRoundsImplementation(props);
  }

  /**
   * Compare this round's inspection findings with an earlier round's and decide
   * the round outcome from its errors.
   *
   * Each finding identity, its `scope`, `check`, `key`, `code` and ordered
   * `paths`, is summarized per round by its worst observation across its
   * episodes, under compareAutoMovieInspectionFindings, the order the reducer
   * keeps an episode's worst witness by.
   *
   * An identity only one round has is `fixed` or `new` only when the other round
   * checked its episode samples. An isolated second can match a recorded sample
   * exactly. To match inside a range, the captured frame clocks must agree on the
   * zero-origin output grid and every required frame must be checked. The elapsed
   * bounds of two ranges cannot establish that on their own. An identity both
   * rounds have is `carried` only if each audit checked the samples of both sets
   * of episodes. Its change compares the worst observations. With insufficient
   * coverage it is `unmatched` with the open coverage status or `not-sampled`,
   * retaining all available witnesses.
   *
   * The outcome reads errors only: `worse` when an error is new or carried worse,
   * `better` when none is new, carried worse or unmatched and one is fixed or
   * carried better, and `same` otherwise.
   *
   * @param props The earlier round's audit and this round's, either absent when
   *   that record has no diagnostics.
   * @returns The compared entries and outcome, or `omitted` naming the records
   *   without diagnostics.
   */
  export function diffFindings(props: {
  /** The earlier round's recorded audit, absent when its record has none. */
  earlier: IAutoMovieInspectionDiagnostics.IAudit | undefined;

  /** This round's audit, absent when no drawn cell supplied diagnostics. */
  current: IAutoMovieInspectionDiagnostics.IAudit | undefined;
}): IAutoMovieCaptureFindingDiff {
    return diffAutoMovieCaptureFindingsImplementation(props);
  }

  /**
   * Write a capture plan request as the named text values
   * `parseAutoMovieCapturePlanRequest` reads, so a request worked out in one host
   * repeats in another as an address, a command line or props.
   *
   * Keys come in the order of `AUTO_MOVIE_CAPTURE_PLAN_KEYS`, and a key whose
   * value is the reader's absent value is left out, so the request that asks for
   * nothing is the empty list. Numbers are written in JavaScript's shortest form
   * that reads back to the same number, lists joined by commas and views by `;`.
   * One pass is written through the inspection's `shade`, several through
   * `passes` with `shade` left out. The inspection keys come last, written by
   * `formatAutoMovieInspectionRequest`. For every request the reader returns,
   * reading the written values gives an equal request.
   *
   * ```ts
   * const address = new URLSearchParams(
   *   formatAutoMovieCapturePlanRequest(request),
   * );
   * const command = formatAutoMovieCapturePlanRequest(request).flatMap(
   *   ([key, value]) => [`--${key}`, value],
   * );
   * ```
   */
  export function formatPlanRequest(request: IAutoMovieCapturePlanRequest): [key: string, value: string][] {
    return formatAutoMovieCapturePlanRequestImplementation(request);
  }

  /**
   * Read a capture plan request from named text values, the one reader every host
   * maps its source onto: the page passes its address's `URLSearchParams`, the
   * command passes the map of `readAutoMovieCaptureArguments`, and a component
   * passes its props as text.
   *
   * A key given without a value reads as the empty string, which turns a switch
   * on. `AUTO_MOVIE_CAPTURE_PLAN_KEYS` lists every key and
   * `formatAutoMovieCapturePlanRequest` writes a request back. The inspection
   * keys are read by `parseAutoMovieInspectionRequest`.
   *
   * | Key          | Text                                                                             | Absent                   |
   * | ------------ | -------------------------------------------------------------------------------- | ------------------------ |
   * | `subject`    | The name of the subject to load                                                  | The host's only subject  |
   * | `from`, `to` | Subject seconds of an even sampling, `0 <= from < to`                            | 0 and the subject's end  |
   * | `rate`       | Stills per second of an even sampling, positive                                  | 5                        |
   * | `at`         | Exact seconds separated by commas, instead of `from`, `to` and `rate`            | Even sampling            |
   * | `events`     | Seconds separated by commas whose surrounding frames are drawn                   | None                     |
   * | `window`     | Frames drawn on each side of an event or cut, a whole number                     | 3                        |
   * | `threshold`  | The `scdet` score from 0 to 100 at which a video file's frame starts a new scene | 10                       |
   * | `views`      | View texts of the inspection view grammar separated by `;`                       | `film`                   |
   * | `passes`     | Shades separated by commas, instead of `shade`                                   | The inspection's `shade` |
   * | `sweep`      | A path pattern of the units drawn alone and with their neighbours                | No sweep                 |
   * | `margin`     | Metres between two units' boxes that still make them neighbours, with `sweep`    | 0                        |
   * | `longest`    | The reader's longest edge in pixels                                              | 1568                     |
   * | `smallest`   | The smallest legible cell edge in pixels, at most `longest`                      | 200                      |
   * | `reduction`  | `area` or `nearest`                                                              | `area`                   |
   * | `round`      | A round name: letters, digits, `.`, `_`, `-`                                     | The unnamed capture      |
   * | `compare`    | An earlier round's name, not `round`                                             | No comparison            |
   * | `tolerance`  | Bytes 0 to 255 of channel difference counted as unchanged, with `compare`        | 0                        |
   *
   * It throws an `Error` naming the key for a key it does not know, a key given
   * twice, `at` beside `from`, `to` or `rate`, `passes` beside `shade`, `margin`
   * without `sweep`, `tolerance` without `compare`, and a round compared against
   * itself; and naming the key, the text and what is accepted for a value it
   * cannot read. A view text is checked by `parseAutoMovieInspectionView`;
   * whether the subject offers that view, and whether times lie within it, is
   * `planAutoMovieCapture`'s check.
   *
   * ```ts
   * const request = parseAutoMovieCapturePlanRequest(
   *   new URL(location.href).searchParams,
   * );
   * ```
   */
  export function parsePlanRequest(source: IAutoMovieCaptureRequestSource): IAutoMovieCapturePlanRequest {
    return parseAutoMovieCapturePlanRequestImplementation(source);
  }

  /**
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
   * `planAutoMovieCaptureFrames` and the sheet layout from
   * `planAutoMovieCaptureLayout`, with a row's group being the views times the
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
   * name. Every view text is read by `parseAutoMovieInspectionView`, which
   * refuses malformed text; `film` and a fixed camera need no name.
   */
  export function plan(props: IAutoMovieCapturePlanProps): IAutoMovieCapturePlan {
    return planAutoMovieCaptureImplementation(props);
  }

  /**
   * Plan the instants a capture draws, for a drawn scene and for a video file
   * alike: an even sampling or explicit seconds, merged with every frame within
   * `window` frames of each event and each cut.
   *
   * The subject's frames are the indices `0` to `N - 1` with `N =
   * ceil(durationSeconds × fps)`, frame `i` showing second `i / fps`. An even
   * sample is moved to the nearest frame, so every still is a frame the subject
   * encodes, and stops before `to`. An explicit second is kept as written. The
   * frame nearest an event or a cut is `round(seconds × fps)`, and its window
   * runs `window` frames to each side at the frame rate, cut at the first and
   * last frame. The result is in time order with every frame once, and each
   * window is listed with whether the bounds cut it.
   *
   * It throws for a frame rate or duration that is not positive, a sampling that
   * starts at or after the subject's end or ends past it, an explicit second,
   * event or cut outside `[0, durationSeconds]`, and a window that is not a whole
   * number of frames.
   *
   * ```ts
   * planAutoMovieCaptureFrames({
   *   durationSeconds: 4,
   *   fps: 30,
   *   sampling: { kind: "even", from: 0, to: null, rate: 5 },
   *   events: [2],
   *   cuts: [],
   *   window: 3,
   * });
   * // frames 0, 6, 12, ... with 57 to 63 around the event
   * ```
   */
  export function planFrames(props: IAutoMovieCaptureFramePlanProps): IAutoMovieCaptureFramePlan {
    return planAutoMovieCaptureFramesImplementation(props);
  }

  /**
   * Lay out a capture's cells on contact sheets for a stated reader: every
   * sheet's longest edge within `budget.longest`, every cell's shorter edge at
   * least `budget.smallest`, and the cells as large as those two bounds allow.
   * Each cell's caption strip is reserved under it and counted against the
   * longest edge, never taken from the cell: it holds as many lines as the
   * longest of `captions` wraps to at the cell's width, by
   * `AutoMovieRenderRasterSheet.lines`, at the height
   * `AutoMovieRenderRasterSheet.caption` gives, so every caption keeps every word
   * that identifies its cell.
   *
   * A cell keeps the still's proportions, so a portrait still gives upright
   * cells, and never enlarges the still. The smallest cell decides how many cells
   * one sheet can hold; when the cells do not fit one sheet they are spread
   * evenly over as few sheets as hold them. Cells come in groups of `group`, such
   * as the views and passes of one instant: when a group fits a row, a sheet
   * holds whole groups and its column count is a multiple of the group, so each
   * row starts a new group and no group is split between sheets. Among the grids
   * that hold a sheet's cells, the one giving the largest cell wins, ties going
   * to the grid with fewer empty cells, then to the one with fewer rows. A still
   * so elongated that one smallest cell exceeds the longest edge is shrunk to fit
   * it, the one case where a cell falls under `smallest`, because a reader would
   * downsize a larger sheet anyway.
   *
   * It throws for a raster, count or group that is not a positive whole number.
   *
   * ```ts
   * planAutoMovieCaptureLayout({
   *   width: 1280,
   *   height: 720,
   *   count: 50,
   *   group: 1,
   *   budget: { longest: 1568, smallest: 200, reduction: "area" },
   *   captions: ["f30 1.000s"],
   * });
   * // cells of 366 x 206 with an 18 px caption strip, in 4 columns of 7 rows, 25 per sheet on 2 sheets
   * ```
   */
  export function planLayout(props: IAutoMovieCaptureLayoutProps): IAutoMovieCaptureLayout {
    return planAutoMovieCaptureLayoutImplementation(props);
  }

  /**
   * Plan the FFmpeg arguments that extract exactly the given frames of a video
   * file, the file's own pixels, as numbered PNG stills.
   *
   * One `select` expression names every index: a run of consecutive indices as
   * `between(n,first,last)` and a lone index as `eq(n,index)`, joined by `+`.
   * `-fps_mode passthrough` keeps each selected frame once with its own timestamp
   * instead of duplicating or dropping frames to a constant rate. The k-th
   * selected frame, counting from zero in ascending index order, is written as
   * `<directory>/s<k>.png` with `k` padded to five digits, in 8-bit RGB.
   *
   * It throws for an empty list and for an index that is not a whole number of
   * zero or more.
   *
   * ```ts
   * planAutoMovieVideoFrames({
   *   file: "delivery.mp4",
   *   frames: [57, 58, 59, 90],
   *   directory: "out",
   * });
   * // [..., "-vf", "select='between(n,57,59)+eq(n,90)'", "-fps_mode", "passthrough", ...]
   * ```
   */
  export function planVideoFrames(props: IAutoMoviePlanVideoFramesProps): string[] {
    return planAutoMovieVideoFramesImplementation(props);
  }

  /**
   * Plan the FFmpeg arguments that detect a video file's scene cuts with the
   * `scdet` filter and write each cut to a report, which
   * `readAutoMovieVideoSceneCuts` reads.
   *
   * `scdet` scores how much each frame differs from the one before, from 0 to
   * 100, and marks a frame whose score reaches `threshold` as the first frame of
   * a new scene; FFmpeg's default threshold is 10. The `metadata` filters keep
   * only marked frames and print each one's time and score to `report`. The
   * decoded frames go to the null muxer, so nothing else is written. The report
   * path is escaped for both levels of FFmpeg's filter-graph syntax, so a drive
   * letter or a comma in it stays part of the path.
   *
   * It throws for a threshold outside 0 to 100.
   *
   * ```ts
   * await run(
   *   planAutoMovieVideoSceneCuts({
   *     file: "delivery.mp4",
   *     report: `${folder.directory}/scenecut.txt`,
   *     threshold: 10,
   *   }),
   * );
   * ```
   */
  export function planVideoSceneCuts(props: IAutoMoviePlanVideoSceneCutsProps): string[] {
    return planAutoMovieVideoSceneCutsImplementation(props);
  }

  /**
   * Map a command line onto the named text values
   * `parseAutoMovieCapturePlanRequest` reads, the command's whole share of
   * reading a request.
   *
   * Each option is `--<key> <value>`, `--<key>=<value>`, or `--<key>` alone,
   * which reads as the empty string and turns a switch on, as `?<key>` does in an
   * address. An option takes the next argument as its value unless that argument
   * starts with `--`, so a negative number or an axis cut such as `-x:0.2` is a
   * value. Which keys exist is the reader's to decide.
   *
   * It throws for an argument that is not an option where one is expected, and
   * for an option given twice, naming it.
   *
   * ```ts
   * const request = parseAutoMovieCapturePlanRequest(
   *   readAutoMovieCaptureArguments(process.argv.slice(2)),
   * );
   * ```
   */
  export function readArguments(argv: readonly string[]): Map<string, string> {
    return readAutoMovieCaptureArgumentsImplementation(argv);
  }

  /**
   * Read the report of `planAutoMovieVideoSceneCuts` into the file's scene cuts:
   * the second each new scene starts and its `scdet` score, in the report's
   * order.
   *
   * The report is FFmpeg's `metadata` print: a `frame:<n> pts:<t>
   * pts_time:<seconds>` line per marked frame, followed by `key=value` lines
   * among which `lavfi.scd.score` and `lavfi.scd.time`. A frame's second is its
   * `lavfi.scd.time`, or its `pts_time` when that key is missing. Line endings
   * may be `\n` or `\r\n`, and other keys are ignored. An empty report means the
   * file has no cut at the threshold used.
   *
   * It throws naming the frame for a marked frame without a readable second or
   * score.
   */
  export function readVideoSceneCuts(report: string): IAutoMovieCaptureVideoSource["cuts"] {
    return readAutoMovieVideoSceneCutsImplementation(report);
  }

  /**
   * Resolve every pattern a cell's request and view carry against the paths a
   * drawn scene holds: the `parts`, `hide`, `label` and `color` patterns in that
   * order and as written, then the view's focus pattern.
   *
   * `paths` are the scene's object paths and the paths of the marks it draws, in
   * the scene's order; a repeated path counts once. Each pattern is matched by
   * the inspection core's own rule, so it resolves exactly as the inspection
   * applied it, and lists only its topmost matched paths, a path whose ancestor
   * it also matched being counted but not listed.
   *
   * ```ts
   * resolveAutoMovieCapturePatterns({
   *   paths: ["hero", "hero/arm", "lamp"],
   *   request,
   *   view: "front@focus=hero",
   * });
   * // [{ role: "focus", pattern: "hero", paths: ["hero"], count: 2 }, ...]
   * ```
   */
  export function resolvePatterns(props: IAutoMovieResolveCapturePatternsProps): IAutoMovieCaptureResolution[] {
    return resolveAutoMovieCapturePatternsImplementation(props);
  }

  /**
   * Draw a planned capture through the host's draw function and write its stills,
   * contact sheets and record into its opened folder, so every rule of a capture
   * runs the same in a Node host, a page and a test.
   *
   * Each cell is drawn in plan order, one at a time. A drawn still gets its
   * labels stamped at their anchors, at a scale that keeps a label's font pixel
   * at least one sheet pixel after the still is reduced into its cell, and is
   * written as `<cell name>.png` with its content hash, RGB except a `graphics`
   * still, which keeps its straight alpha as RGBA. A cell whose draw throws, or
   * returns a picture that is not the subject's raster, is recorded with the
   * cause and stands on the sheet as a marked cell, and the run continues. Sheets
   * are written as `sheet-001.png` onwards as each fills. Diagnostics supplied by
   * the drawn cells are reduced in film time for the record. With a `compare`
   * round, `compareAutoMovieCaptureRounds` follows at `match` and diffs those
   * findings against the earlier record's. The record comes last.
   *
   * Files are touched in the order `AutoMovieCaptureFolder` states: the host
   * opens the folder for the plan's round and compared round, which checks both
   * before anything is deleted; every still and sheet is claimed in a `running`
   * record before the first is written, the comparison's files are claimed before
   * it writes, and the `complete` record is written last. It rejects a folder
   * opened for another round, and a storage failure, leaving a record that owns
   * every file written so far.
   *
   * ```ts
   * const plan = planAutoMovieCapture({ request, subject, cuts: [] });
   * const folder = await AutoMovieCaptureFolder.open({
   *   storage: fs,
   *   root: "media/capture",
   *   round: request.round,
   *   compare: request.compare,
   * });
   * const record = await runAutoMovieCapture({
   *   plan,
   *   draw,
   *   folder,
   *   revision,
   *   match: "cell",
   * });
   * ```
   */
  export function run(props: IAutoMovieRunCaptureProps): Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> {
    return runAutoMovieCaptureImplementation(props);
  }

  /**
   * Capture an encoded or generated video file as stills of its own frames: the
   * frames around every cut the file holds and every event the request names,
   * beside an even sampling, through the same folder, sheets, record and
   * comparison as a drawn capture.
   *
   * The steps, each through the injected storage and process runner:
   *
   * 1. Plan the request against the file's clock with no cuts, refusing what the
   *    file cannot give before the folder is touched.
   * 2. Open the folder, run `planAutoMovieVideoSceneCuts` at `request.threshold`,
   *    read the report with `readAutoMovieVideoSceneCuts` and delete it.
   * 3. Plan again with the cuts, so every frame within `request.window` frames of a
   *    cut is planned as an event's are.
   * 4. Run `planAutoMovieVideoFrames` for the planned frames, then let
   *    `runAutoMovieCapture` read each extracted still as its cell's picture,
   *    delete the extracted file and write the still under the cell's name.
   *
   * Each still is captioned by its frame index and second. A planned frame the
   * file does not hold, as when the file is shorter than its stated duration, is
   * a failed cell with the cause, and a comparison against the source's round at
   * `time` matching reports it unmatched. The record lists the file, the
   * threshold and every detected cut with its score, so a file with no cut
   * records zero cuts at the threshold used.
   *
   * It rejects a request that asks for views, passes, a sweep or an inspection,
   * since a file's pixels are drawn already, and explicit seconds that fall
   * between the file's frames.
   */
  export function runVideo(props: IAutoMovieRunVideoCaptureProps): Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> {
    return runAutoMovieVideoCaptureImplementation(props);
  }

  /**
   * The font pixel size, in still pixels, at which a capture stamps labels on a
   * still: large enough that one font pixel stays at least one sheet pixel once
   * the still is reduced into its cell, and never below one.
   *
   * A still of `width` by `height` is reduced into a cell of the layout, so the
   * reduction is the ratio of their shorter sides, and a font pixel of that many
   * still pixels survives it. The capture run stamps at this scale, and a draw
   * page places its labels at the same scale so labels it keeps apart stay apart
   * once stamped.
   */
  export function scaleLabels(raster: Pick<IAutoMovieRasterImage, "width" | "height">, layout: Pick<IAutoMovieCaptureLayout, "cell">): number {
    return scaleAutoMovieCaptureLabelsImplementation(raster, layout);
  }
}
