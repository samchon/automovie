import type { IAutoMovieInspectionRequest } from "../scene/inspection/IAutoMovieInspectionRequest.js";
import { parseAutoMovieInspectionRequest } from "../scene/inspection/parseAutoMovieInspectionRequest.js";
import { parseAutoMovieInspectionView } from "../scene/inspection/parseAutoMovieInspectionView.js";
import { AUTO_MOVIE_CAPTURE_PLAN_KEYS } from "./AUTO_MOVIE_CAPTURE_PLAN_KEYS.js";
import type { IAutoMovieCapturePlanRequest } from "./IAutoMovieCapturePlanRequest.js";
import type { IAutoMovieCaptureRequestSource } from "./IAutoMovieCaptureRequestSource.js";

/** Every key the reader admits, for constant-time lookup. */
const KNOWN: ReadonlySet<string> = new Set(AUTO_MOVIE_CAPTURE_PLAN_KEYS);

/**
 * Stills per second of an even sampling when none is asked: five, the sparser end of the five to ten stills per second `.agents/skills/visual-debugging/capture.md` asks for a moving picture.
 */
const RATE: number = 5;

/**
 * Frames drawn on each side of an event when none is asked: three, so an event shows seven consecutive frames of the output, the approach, the instant and the release, as `capture.md` asks around every contact, cut and join.
 */
const WINDOW: number = 3;

/** The scene-cut score when none is asked: 10, the default of FFmpeg's `scdet` filter. */
const THRESHOLD: number = 10;

/** The reader's longest edge when none is asked, in pixels: the size the Claude vision guide downsizes above on older models. */
const LONGEST: number = 1568;

/** The smallest legible cell edge when none is asked, in pixels: the size under which the Claude vision guide reads an image unreliably. */
const SMALLEST: number = 200;

/** The view drawn when none is asked: the subject's own camera, which shows the delivered framing. */
const VIEW: string = "film";

/** Separator of view texts, which may themselves hold commas and colons. */
const VIEW_SEPARATOR: string = ";";

/** A round name: letters, digits, dots, underscores and hyphens, starting with a letter or digit, so it is one folder name. */
const ROUND: RegExp = /^[a-z0-9][a-z0-9._-]*$/iu;

/**
 * Read a capture plan request from named text values, the one reader every host maps its source onto: the page passes its address's `URLSearchParams`, the command passes the map of `readAutoMovieCaptureArguments`, and a component passes its props as text.
 *
 * A key given without a value reads as the empty string, which turns a switch on. `AUTO_MOVIE_CAPTURE_PLAN_KEYS` lists every key and `formatAutoMovieCapturePlanRequest` writes a request back. The inspection keys are read by `parseAutoMovieInspectionRequest`.
 *
 * | Key | Text | Absent |
 * | --- | --- | --- |
 * | `subject` | The name of the subject to load | The host's only subject |
 * | `from`, `to` | Subject seconds of an even sampling, `0 <= from < to` | 0 and the subject's end |
 * | `rate` | Stills per second of an even sampling, positive | 5 |
 * | `at` | Exact seconds separated by commas, instead of `from`, `to` and `rate` | Even sampling |
 * | `events` | Seconds separated by commas whose surrounding frames are drawn | None |
 * | `window` | Frames drawn on each side of an event or cut, a whole number | 3 |
 * | `threshold` | The `scdet` score from 0 to 100 at which a video file's frame starts a new scene | 10 |
 * | `views` | View texts of the inspection view grammar separated by `;` | `film` |
 * | `passes` | Shades separated by commas, instead of `shade` | The inspection's `shade` |
 * | `sweep` | A path pattern of the units drawn alone and with their neighbours | No sweep |
 * | `margin` | Metres between two units' boxes that still make them neighbours, with `sweep` | 0 |
 * | `longest` | The reader's longest edge in pixels | 1568 |
 * | `smallest` | The smallest legible cell edge in pixels, at most `longest` | 200 |
 * | `reduction` | `area` or `nearest` | `area` |
 * | `round` | A round name: letters, digits, `.`, `_`, `-` | The unnamed capture |
 * | `compare` | An earlier round's name, not `round` | No comparison |
 * | `tolerance` | Bytes 0 to 255 of channel difference counted as unchanged, with `compare` | 0 |
 *
 * It throws an `Error` naming the key for a key it does not know, a key given twice, `at` beside `from`, `to` or `rate`, `passes` beside `shade`, `margin` without `sweep`, `tolerance` without `compare`, and a round compared against itself; and naming the key, the text and what is accepted for a value it cannot read. A view text is checked by `parseAutoMovieInspectionView`; whether the subject offers that view, and whether times lie within it, is `planAutoMovieCapture`'s check.
 *
 * ```ts
 * const request = parseAutoMovieCapturePlanRequest(new URL(location.href).searchParams);
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation Tabulates every key with its accepted text and absent value, states every refusal and what each names, and which checks are left to the planner and why.
 * @evidence contracts/development/implementation.md#principled-implementation The keys are admitted before any value is read, so a mistyped option stops the request instead of being ignored; inspection keys and pass names go through the inspection core's own reader, and view texts through its view grammar, so no rule is restated here. Defaults come from the visual-debugging skill (rate, window), FFmpeg's `scdet` (threshold) and the Claude vision guide (budget edges).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the keys, read the inspection, then one helper per value form: number, number list, whole number, name and pattern list; the record literal reads in the table's order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unreadable text throws instead of falling back to the absent value, and two keys that would ask the same thing twice (`at` with a range, `passes` with `shade`) throw instead of one silently winning.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of keys and the length of their text.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each key is read once per call.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing; the source is read and dropped and the returned record is the caller's.
 */
export function parseAutoMovieCapturePlanRequest(
  source: IAutoMovieCaptureRequestSource,
): IAutoMovieCapturePlanRequest {
  // Admit every name before reading any value.
  const given: Set<string> = new Set();
  for (const key of source.keys()) {
    if (!KNOWN.has(key))
      throw new Error(
        `Capture key "${key}" is not one of ${AUTO_MOVIE_CAPTURE_PLAN_KEYS.join(", ")}`,
      );
    if (given.has(key)) throw new Error(`Capture key "${key}" is given twice`);
    given.add(key);
  }
  const read: (key: string) => string | null = (key: string): string | null =>
    source.get(key) ?? null;

  // The inspection core reads its own keys; passes are its shades.
  const inspection: IAutoMovieInspectionRequest =
    parseAutoMovieInspectionRequest(read);
  if (given.has("passes") && given.has("shade"))
    throw new Error("Capture passes and shade name one thing; give only one");
  const passes: IAutoMovieInspectionRequest.Shade[] = given.has("passes")
    ? distinct("passes", read("passes")!, items(read("passes")!)).map(
        (text: string): IAutoMovieInspectionRequest.Shade => shadeOf(text),
      )
    : [inspection.shade];
  if (passes.length === 0) refuse("passes", read("passes")!, "one or more shades");

  // Seconds: explicit, or an even sampling.
  if (
    given.has("at") &&
    (given.has("from") || given.has("to") || given.has("rate"))
  )
    throw new Error("Capture at excludes from, to and rate");
  const sampling: IAutoMovieCapturePlanRequest.Sampling = given.has("at")
    ? { kind: "at", seconds: seconds("at", read("at")!, true) }
    : even(read);

  // Views, each checked by the view grammar.
  const views: string[] =
    read("views") === null
      ? [VIEW]
      : distinct(
          "views",
          read("views")!,
          read("views")!
            .split(VIEW_SEPARATOR)
            .map((view: string): string => view.trim())
            .filter((view: string): boolean => view !== ""),
        );
  if (views.length === 0)
    refuse("views", read("views")!, `view texts separated by ${VIEW_SEPARATOR}`);
  for (const view of views)
    try {
      parseAutoMovieInspectionView(view);
    } catch (error) {
      throw new Error(
        `Capture views "${view}" is not a view: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }

  // Sweep and its margin.
  const sweep: string | null = read("sweep");
  if (sweep !== null && sweep.trim() === "")
    refuse("sweep", sweep, "a path pattern");
  if (given.has("margin") && sweep === null)
    throw new Error("Capture margin applies only with sweep");

  // The reader budget.
  const longest: number = whole("longest", read("longest"), 1) ?? LONGEST;
  const smallest: number = whole("smallest", read("smallest"), 1) ?? SMALLEST;
  if (smallest > longest)
    refuse("smallest", String(smallest), `at most longest (${longest})`);
  const reduction: string = read("reduction") ?? "area";
  if (reduction !== "area" && reduction !== "nearest")
    refuse("reduction", reduction, "area or nearest");

  // Rounds.
  const round: string | null = roundName("round", read("round"));
  const compare: string | null = roundName("compare", read("compare"));
  if (compare !== null && compare === round)
    throw new Error(`Capture round "${round}" cannot be compared against itself`);
  if (given.has("tolerance") && compare === null)
    throw new Error("Capture tolerance applies only with compare");
  const tolerance: number = bounded("tolerance", read("tolerance"), 0, 255) ?? 0;

  return {
    subject: subject(read("subject")),
    sampling,
    events: read("events") === null ? [] : seconds("events", read("events")!, false),
    window: whole("window", read("window"), 0) ?? WINDOW,
    threshold: bounded("threshold", read("threshold"), 0, 100) ?? THRESHOLD,
    views,
    passes,
    sweep: sweep === null ? null : sweep.trim(),
    margin: bounded("margin", read("margin"), 0, Infinity) ?? 0,
    budget: { longest, smallest, reduction },
    round,
    compare,
    tolerance,
    inspection: { ...inspection, shade: passes[0]! },
  };
}

/** Throw the refusal of a value: the key, the text and what is accepted. */
function refuse(key: string, text: string, accepted: string): never {
  throw new Error(`Capture ${key} "${text}" is not ${accepted}`);
}

/** The trimmed non-empty items of a comma-separated text. */
function items(text: string): string[] {
  return text
    .split(",")
    .map((item: string): string => item.trim())
    .filter((item: string): boolean => item !== "");
}

/** The items of a key's text, refusing one given twice. */
function distinct(key: string, text: string, values: string[]): string[] {
  const seen: Set<string> = new Set();
  for (const value of values) {
    if (seen.has(value))
      throw new Error(`Capture ${key} "${text}" names "${value}" twice`);
    seen.add(value);
  }
  return values;
}

/** A shade, read by the inspection core so the shade list has one owner. */
function shadeOf(text: string): IAutoMovieInspectionRequest.Shade {
  try {
    return parseAutoMovieInspectionRequest((key: string): string | undefined =>
      key === "shade" ? text : undefined,
    ).shade;
  } catch (error) {
    throw new Error(
      `Capture passes "${text}" is not a shade: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

/** The number a text spells, NaN for blank or malformed text. */
function finite(text: string): number {
  const value: number = text.trim() === "" ? Number.NaN : Number(text);
  return Number.isFinite(value) ? value : Number.NaN;
}

/** A finite number in `[minimum, maximum]`, or null when the key is absent. */
function bounded(
  key: string,
  text: string | null,
  minimum: number,
  maximum: number,
): number | null {
  if (text === null) return null;
  const value: number = finite(text);
  if (!(value >= minimum && value <= maximum))
    refuse(
      key,
      text,
      maximum === Infinity
        ? `a number of at least ${minimum}`
        : `a number from ${minimum} to ${maximum}`,
    );
  return value;
}

/** A whole number of at least `minimum`, or null when the key is absent. */
function whole(
  key: string,
  text: string | null,
  minimum: number,
): number | null {
  if (text === null) return null;
  const value: number = finite(text);
  if (!(Number.isSafeInteger(value) && value >= minimum))
    refuse(key, text, `a whole number of at least ${minimum}`);
  return value;
}

/** Seconds separated by commas, each zero or more; at least one when `required`. */
function seconds(key: string, text: string, required: boolean): number[] {
  const values: number[] = items(text).map((item: string): number => {
    const value: number = finite(item);
    if (!(value >= 0)) refuse(key, text, "seconds of zero or more separated by commas");
    return value;
  });
  if (required && values.length === 0)
    refuse(key, text, "one or more seconds separated by commas");
  return values;
}

/** An even sampling from `from`, `to` and `rate`. */
function even(
  read: (key: string) => string | null,
): IAutoMovieCapturePlanRequest.Sampling {
  const from: number = bounded("from", read("from"), 0, Infinity) ?? 0;
  const to: number | null = bounded("to", read("to"), 0, Infinity);
  if (to !== null && !(to > from))
    refuse("to", read("to")!, `a second after from (${from})`);
  const rate: number | null = bounded("rate", read("rate"), 0, Infinity);
  if (rate !== null && !(rate > 0))
    refuse("rate", read("rate")!, "a positive number of stills per second");
  return { kind: "even", from, to, rate: rate ?? RATE };
}

/** A round name, or null when the key is absent. */
function roundName(key: string, text: string | null): string | null {
  if (text === null) return null;
  if (!ROUND.test(text))
    refuse(key, text, "a name of letters, digits, dots, underscores and hyphens");
  return text;
}

/** A subject name, or null when the key is absent. */
function subject(text: string | null): string | null {
  if (text === null) return null;
  if (text.trim() === "") refuse("subject", text, "a subject name");
  return text;
}
