import { assertCaptureClock as assertCaptureClockImplementation } from "../delivery/internal/assertCaptureClock";
import { planCaptureUrl as planCaptureUrlImplementation } from "../delivery/internal/planCaptureUrl";

import { type IAutoMovieCaptureComparison, type IAutoMovieCaptureComparisonProps, type IAutoMovieCaptureFindingDiff, type IAutoMovieCaptureFindingDiffProps, type IAutoMovieCaptureRequestEntry, type IAutoMovieCaptureCompleteRecord, type IAutoMovieCapturePlanRequest, type IAutoMovieCaptureRequestSource, type IAutoMovieCapturePlan, type IAutoMovieCapturePlanProps, type IAutoMovieCaptureFramePlan, type IAutoMovieCaptureFramePlanProps, type IAutoMovieCaptureLayout, type IAutoMovieCaptureLayoutProps, type IAutoMoviePlanVideoFramesProps, type IAutoMoviePlanVideoSceneCutsProps, type IAutoMovieCaptureVideoSource, type IAutoMovieCaptureResolution, type IAutoMovieResolveCapturePatternsProps, type IAutoMovieRunCaptureProps, type IAutoMovieRunVideoCaptureProps, type IAutoMovieRasterImage, type IAutoMovieAssertCaptureClockHost, type IAutoMovieAssertCaptureClockExpected, type IAutoMovieCaptureSubject, type IAutoMoviePlaybackEvent } from "@automovie/interface";
import { compareCaptureRounds as compareCaptureRoundsImplementation } from "./internal/compareCaptureRounds";
import { diffCaptureFindings as diffCaptureFindingsImplementation } from "./internal/diffCaptureFindings";
import { formatCapturePlanRequest as formatCapturePlanRequestImplementation } from "./internal/formatCapturePlanRequest";
import { parseCapturePlanRequest as parseCapturePlanRequestImplementation } from "./internal/parseCapturePlanRequest";
import { planCapture as planCaptureImplementation } from "./internal/planCapture";
import { planCaptureFrames as planCaptureFramesImplementation } from "./internal/planCaptureFrames";
import { planNativeReviewFrames } from "./internal/planNativeReviewFrames";
import { planCaptureLayout as planCaptureLayoutImplementation } from "./internal/planCaptureLayout";
import { planVideoFrames as planVideoFramesImplementation } from "./internal/planVideoFrames";
import { planVideoSceneCuts as planVideoSceneCutsImplementation } from "./internal/planVideoSceneCuts";
import { readCaptureArguments as readCaptureArgumentsImplementation } from "./internal/readCaptureArguments";
import { readVideoSceneCuts as readVideoSceneCutsImplementation } from "./internal/readVideoSceneCuts";
import { resolveCapturePatterns as resolveCapturePatternsImplementation } from "./internal/resolveCapturePatterns";
import { resolveCaptureCue } from "./internal/resolveCaptureCue";
import { runCapture as runCaptureImplementation } from "./internal/runCapture";
import { runVideoCapture as runVideoCaptureImplementation } from "./internal/runVideoCapture";
import { scaleCaptureLabels as scaleCaptureLabelsImplementation } from "./internal/scaleCaptureLabels";

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
   * The findings of the two rounds are compared by diffCaptureFindings,
   * from the earlier record's diagnostics and this round's, which the caller
   * reduces first.
   *
   * Each entry takes three consecutive cells of the comparison sheets, the
   * earlier still, this capture's still and the difference image, with a marked
   * cell where a side or the difference is missing; rows and sheets hold whole
   * entries, laid out for `budget` and named `comparison-001.png` onwards.
   */
  export function compareRounds(props: IAutoMovieCaptureComparisonProps): Promise<IAutoMovieCaptureComparison> {
    return compareCaptureRoundsImplementation(props);
  }

  /**
   * Compare this round's inspection findings with an earlier round's and decide
   * the round outcome from its errors.
   *
   * Each finding identity, its `scope`, `check`, `key`, `code` and ordered
   * `paths`, is summarized per round by its worst observation across its
   * episodes, under compareInspectionFindings, the order the reducer
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
  export function diffFindings(props: IAutoMovieCaptureFindingDiffProps): IAutoMovieCaptureFindingDiff {
    return diffCaptureFindingsImplementation(props);
  }

  /**
   * Write a capture plan request as the named text values
   * `parseCapturePlanRequest` reads, so a request worked out in one host
   * repeats in another as an address, a command line or props.
   *
   * Keys come in the order of `AutoMovieRenderCapturePlanKeys`, and a key whose
   * value is the reader's absent value is left out, so the request that asks for
   * nothing is the empty list. Numbers are written in JavaScript's shortest form
   * that reads back to the same number, lists joined by commas and views by `;`.
   * One pass is written through the inspection's `shade`, several through
   * `passes` with `shade` left out. The inspection keys come last, written by
   * `formatInspectionRequest`. For every request the reader returns,
   * reading the written values gives an equal request.
   *
   * ```ts
   * const address = new URLSearchParams(
   *   formatCapturePlanRequest(request),
   * );
   * const command = formatCapturePlanRequest(request).flatMap(
   *   ([key, value]) => [`--${key}`, value],
   * );
   * ```
   */
  export function formatPlanRequest(request: IAutoMovieCapturePlanRequest): IAutoMovieCaptureRequestEntry[] {
    return formatCapturePlanRequestImplementation(request);
  }

  /**
   * Read a capture plan request from named text values, the one reader every host
   * maps its source onto: the page passes its address's `URLSearchParams`, the
   * command passes the map of `readCaptureArguments`, and a component
   * passes its props as text.
   *
   * A key given without a value reads as the empty string, which turns a switch
   * on. `AutoMovieRenderCapturePlanKeys` lists every key and
   * `formatCapturePlanRequest` writes a request back. The inspection
   * keys are read by `parseInspectionRequest`.
   *
   * | Key          | Text                                                                             | Absent                   |
   * | ------------ | -------------------------------------------------------------------------------- | ------------------------ |
   * | `subject`    | The name of the subject to load                                                  | The host's only subject  |
   * | `from`, `to` | Subject seconds of an even sampling, `0 <= from < to`                            | 0 and the subject's end  |
   * | `rate`       | Stills per second of an even sampling, positive                                  | 5                        |
   * | `at`         | Exact seconds separated by commas, instead of `from`, `to` and `rate`            | Even sampling            |
   * | `events`     | Seconds separated by commas whose surrounding frames are drawn                   | None                     |
   * | `cue`        | Exact id of a played source event, captured with its native neighborhood           | None                     |
   * | `entry`      | Zero-based sequence entry selecting one repeated play of `cue`                     | A unique play            |
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
   * cannot read. A view text is checked by `parseInspectionView`;
   * whether the subject offers that view, and whether times lie within it, is
   * `planCapture`'s check.
   *
   * ```ts
   * const request = parseCapturePlanRequest(
   *   new URL(location.href).searchParams,
   * );
   * ```
   */
  export function parsePlanRequest(source: IAutoMovieCaptureRequestSource): IAutoMovieCapturePlanRequest {
    return parseCapturePlanRequestImplementation(source);
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
  export function plan(props: IAutoMovieCapturePlanProps): IAutoMovieCapturePlan {
    return planCaptureImplementation(props);
  }

  /**
   * Resolve a played source event on both the shot and output clocks.
   * The subject supplies admitted occurrences from its sequence. Select an
   * entry when the same source event plays several times. Missing, ambiguous
   * or out-of-range occurrences throw with the subject and cue in the message.
   *
   * @param subject Named source and its played occurrences, ending at its duration.
   * @param cue Exact source identifier with an optional zero-based sequence entry.
   * @returns A copy of the selected occurrence, including actor and action identity.
   */
  export function resolveCue(
    subject: Pick<IAutoMovieCaptureSubject, "name" | "durationSeconds" | "playedCues">,
    cue: IAutoMovieCapturePlanRequest.ICue,
  ): Readonly<IAutoMoviePlaybackEvent> {
    return resolveCaptureCue(subject, cue);
  }

  /**
   * Select native frames and continuous poses for a capture request.
   *
   * Native frames use the encoder's rounded frame count. Even sampling snaps
   * to that grid and omits the requested end. Explicit off-grid seconds remain
   * continuous poses. Events and cuts retain their source seconds and select
   * the nearest available frame plus the requested integer-radius window.
   * A window clipped by either endpoint is marked.
   *
   * Reject a nonfinite or nonpositive clock, an invalid sampling interval,
   * seconds outside the subject, an invalid rate, or a radius outside the
   * nonnegative safe integers. A continuous pose remains available on a
   * positive-duration subject shorter than half a frame.
   */
  export function planFrames(props: IAutoMovieCaptureFramePlanProps): IAutoMovieCaptureFramePlan {
    return planCaptureFramesImplementation(props);
  }

  /** An exact uniform native frame grid and the interval to review. */
  export interface INativeReviewFramePlanProps {
    /** Positive numerator and denominator in frames per second. */
    frameRate: readonly [number, number];
    /** First and last native indices, both included. */
    frames: readonly [number, number];
    /** Keep every native frame in these inclusive decisive intervals. */
    decisive?: readonly (readonly [number, number])[];
  }

  /** Native indices and planned cadence for the requested interval. */
  export interface INativeReviewFramePlan {
    /** A source below ten frames per second cannot meet the review cadence. */
    type: "planned" | "source-rate-below-review";
    /** Endpoints and selected native indices in strictly ascending order. */
    frames: readonly number[];
    /** Largest gap in seconds as an exact fraction, or null for a single frame. */
    largestGap: readonly [number, number] | null;
  }

  /**
   * Plan representative stills at native addresses on an exact uniform grid.
   * Keep both endpoints and all frames in decisive intervals. Use the longest
   * native stride at most one tenth of a second. A slower grid keeps all of its
   * samples and reports the cadence shortfall. The plan does not certify that
   * the caller has retained any requested image.
   */
  export function planReviewFrames(props: INativeReviewFramePlanProps): INativeReviewFramePlan {
    return planNativeReviewFrames(props);
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
   * planCaptureLayout({
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
    return planCaptureLayoutImplementation(props);
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
   * The caller may select an absolute stream index. Omitting it selects the
   * first video stream. Enable `presentation` to retain input PTS and emit
   * `showinfo` for the actual selected frames, in PNG order. An empty list or
   * a frame or stream index outside the nonnegative safe integers throws.
   *
   * ```ts
   * planVideoFrames({
   *   file: "delivery.mp4",
   *   frames: [57, 58, 59, 90],
   *   directory: "out",
   * });
   * // [..., "-vf", "select='between(n,57,59)+eq(n,90)'", "-fps_mode", "passthrough", ...]
   * ```
   */
  export function planVideoFrames(props: IAutoMoviePlanVideoFramesProps): string[] {
    return planVideoFramesImplementation(props);
  }

  /**
   * Plan the FFmpeg arguments that detect a video file's scene cuts with the
   * `scdet` filter and write each cut to a report, which
   * `readVideoSceneCuts` reads.
   *
   * `scdet` scores how much each frame differs from the one before, from 0 to
   * 100, and marks a frame whose score reaches `threshold` as the first frame of
   * a new scene; FFmpeg's default threshold is 10. The `metadata` filters keep
   * only marked frames and print each one's time and score to `report`. The
   * decoded frames go to the null muxer, so nothing else is written. The report
   * path is escaped for both levels of FFmpeg's filter-graph syntax, so a drive
   * letter or a comma in it stays part of the path.
   *
   * The filter reads the specified absolute video stream, or the first video
   * stream when omitted. A threshold outside [0, 100] or an invalid stream
   * index throws.
   *
   * ```ts
   * await run(
   *   planVideoSceneCuts({
   *     file: "delivery.mp4",
   *     report: `${folder.directory}/scenecut.txt`,
   *     threshold: 10,
   *   }),
   * );
   * ```
   */
  export function planVideoSceneCuts(props: IAutoMoviePlanVideoSceneCutsProps): string[] {
    return planVideoSceneCutsImplementation(props);
  }

  /**
   * Map a command line onto the named text values
   * `parseCapturePlanRequest` reads, the command's whole share of
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
   * const request = parseCapturePlanRequest(
   *   readCaptureArguments(process.argv.slice(2)),
   * );
   * ```
   */
  export function readArguments(argv: readonly string[]): Map<string, string> {
    return readCaptureArgumentsImplementation(argv);
  }

  /**
   * Read the report of `planVideoSceneCuts` into the file's scene cuts:
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
    return readVideoSceneCutsImplementation(report);
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
   * resolveCapturePatterns({
   *   paths: ["hero", "hero/arm", "lamp"],
   *   request,
   *   view: "front@focus=hero",
   * });
   * // [{ role: "focus", pattern: "hero", paths: ["hero"], count: 2 }, ...]
   * ```
   */
  export function resolvePatterns(props: IAutoMovieResolveCapturePatternsProps): IAutoMovieCaptureResolution[] {
    return resolveCapturePatternsImplementation(props);
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
   * the drawn cells are reduced in film time for the record. A drawn cell can
   * also retain its selected source-backed trail samples with their own exact
   * clocks. With a `compare` round, `compareCaptureRounds` follows at `match` and diffs those
   * findings against the earlier record's. The record comes last.
   *
   * Files are touched in the order `AutoMovieRenderCaptureFolder` states: the host
   * opens the folder for the plan's round and compared round, which checks both
   * before anything is deleted; every still and sheet is claimed in a `running`
   * record before the first is written, the comparison's files are claimed before
   * it writes, and the `complete` record is written last. It rejects a folder
   * opened for another round, and a storage failure, leaving a record that owns
   * every file written so far.
   *
   * ```ts
   * const plan = planCapture({ request, subject, cuts: [] });
   * const folder = await AutoMovieRenderCaptureFolder.open({
   *   storage: fs,
   *   root: "media/capture",
   *   round: request.round,
   *   compare: request.compare,
   * });
   * const record = await runCapture({
   *   plan,
   *   draw,
   *   folder,
   *   revision,
   *   match: "cell",
   * });
   * ```
   */
  export function run(props: IAutoMovieRunCaptureProps): Promise<IAutoMovieCaptureCompleteRecord> {
    return runCaptureImplementation(props);
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
   * 2. Open the folder, run `planVideoSceneCuts` at `request.threshold`,
   *    read the report with `readVideoSceneCuts` and delete it.
   * 3. Plan again with the cuts, so every frame within `request.window` frames of a
   *    cut is planned as an event's are.
   * 4. Run `planVideoFrames` for the planned frames, then let
   *    `runCapture` read each extracted still as its cell's picture,
   *    delete the extracted file and write the still under the cell's name.
   *
   * Each still is captioned by its frame index and estimated sampling second.
   * The exact decoder clock, when `extract` supplies one, keeps the source
   * stream and rational PTS beside the estimated sampling addresses. A planned frame the
   * file does not hold, as when the file is shorter than its stated duration, is
   * a failed cell with the cause, and a comparison against the source's round at
   * `time` matching reports it unmatched. The record lists the file, the
   * threshold and every detected cut with its score, so a file with no cut
   * records zero cuts at the threshold used.
   *
   * It rejects a request for played cues, views, passes, a sweep or an inspection,
   * since a file's pixels are drawn already, and explicit seconds that fall
   * between the file's frames.
   */
  export function runVideo(props: IAutoMovieRunVideoCaptureProps): Promise<IAutoMovieCaptureCompleteRecord> {
    return runVideoCaptureImplementation(props);
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
    return scaleCaptureLabelsImplementation(raster, layout);
  }

  /**
   * Refuse a capture page that is not ready or does not expose the commissioned
   * clock, before any sound is prepared or pixel captured: the page must be
   * ready, report the commissioned duration and frame rate, and count exactly
   * `durationSeconds * fps` frames, an integer. Readiness is no visual or
   * physical acceptance.
   *
   * @param host Values read from the capture page.
   * @param expected The commissioned duration and rate.
   */
  export function assertClock(host: IAutoMovieAssertCaptureClockHost, expected: IAutoMovieAssertCaptureClockExpected): void {
    assertCaptureClockImplementation(host, expected);
  }

  /**
   * The capture URL of a local review page: the requested URL with its path and
   * unrelated options kept, the given capture parameters set, and autoplay
   * (`play`) removed because capture seeks each frame. Only an HTTP loopback host
   * is admitted, so capture never drives a remote page.
   *
   * @param requested The review page URL.
   * @param parameters Capture parameters to set, such as raster and range.
   * @returns The capture URL.
   */
  export function planUrl(requested: string, parameters: Readonly<Record<string, string>>): string {
    return planCaptureUrlImplementation(requested, parameters);
  }
}
