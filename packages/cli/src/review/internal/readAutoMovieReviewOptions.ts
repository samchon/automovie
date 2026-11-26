import { AUTOMOVIE_REVIEW_OPTIONS } from "./AUTOMOVIE_REVIEW_OPTIONS";
import type { AutoMovieCliReviewTypes } from "../AutoMovieCliReviewTypes";

/**
 * Admit one `automovie review` operation.
 *
 * Inspector mode takes the loopback HTTP `--url`, wall-clock `--seconds` and
 * optional `--out`. File mode takes a published `--file` with `--at`, or with
 * `--from` and exclusive `--to`, in film seconds. New marks need `--note`.
 * `--mark` opens an existing receipt or, beside a file and selected time,
 * explicitly rebinds it. A rebind can reuse the note text. `--reviewer`,
 * `--decision` and `--viewed` belong together on a mark or rebind. Still review
 * needs `--at`. Playback and listening need `--from` and `--to`. `--out`
 * selects the output folder.
 */
export function readAutoMovieReviewOptions(
  values: ReadonlyMap<string, string>,
): AutoMovieCliReviewTypes.Options {
  for (const [key, value] of values) {
    if (!AUTOMOVIE_REVIEW_OPTIONS.includes(key))
      throw new Error(
        `Review takes no option --${key}; it takes ${AUTOMOVIE_REVIEW_OPTIONS.map((option: string): string => `--${option}`).join(", ")}`,
      );
    if (value.trim() === "")
      throw new Error(`Review option --${key} needs a value`);
  }
  return values.has("file") || values.has("mark")
    ? fileOptions(values)
    : inspectorOptions(values);
}

/** The longest Inspector recording in wall-clock seconds, one day. */
const LONGEST: number = 86_400;

/** Record only a loopback HTTP Inspector for a finite wall-clock duration. */
function inspectorOptions(
  values: ReadonlyMap<string, string>,
): AutoMovieCliReviewTypes.InspectorOptions {
  const url: string | undefined = values.get("url");
  const text: string | undefined = values.get("seconds");
  if (url === undefined || text === undefined)
    throw new Error(
      "Review needs --url <inspector address> and --seconds <s>, or --file / --mark",
    );
  for (const key of values.keys())
    if (key !== "url" && key !== "seconds" && key !== "out")
      throw new Error(`Review option --${key} needs --file or --mark`);
  let address: URL;
  try {
    address = new URL(url);
  } catch (error) {
    throw new Error(`Review --url "${url}" is not an address`, {
      cause: error,
    });
  }
  if (
    address.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(address.hostname)
  )
    throw new Error(
      `Review --url "${url}" is not an HTTP page on this machine`,
    );
  const seconds: number = Number(text);
  if (!(Number.isFinite(seconds) && seconds > 0 && seconds <= LONGEST))
    throw new Error(
      `Review --seconds "${text}" is not a number of seconds above 0 and at most ${LONGEST}`,
    );
  return { url: address.href, seconds, out: values.get("out") ?? null };
}

/** Admits a new mark, an explicit rebind, or replay of an existing mark. */
function fileOptions(
  values: ReadonlyMap<string, string>,
): AutoMovieCliReviewTypes.FileOptions {
  if (values.has("url") || values.has("seconds"))
    throw new Error(
      "Review --url and --seconds apply only to Inspector recording",
    );
  const file: string | null = values.get("file") ?? null;
  const mark: string | null = values.get("mark") ?? null;
  const note: string | null = values.get("note") ?? null;
  const at: number | null = second(values, "at");
  const from: number | null = second(values, "from");
  const to: number | null = second(values, "to");
  if (at !== null && (from !== null || to !== null))
    throw new Error("Review --at excludes --from and --to");
  if ((from === null) !== (to === null) || (from !== null && to! <= from))
    throw new Error("Review needs both --from and --to with --from below --to");
  const requested: AutoMovieCliReviewTypes.FileOptions["requested"] =
    at !== null ? { from: at, to: null } : from !== null ? { from, to } : null;
  if (requested !== null && file === null)
    throw new Error("Review a new position with --file");
  if (mark === null && (requested === null || note === null))
    throw new Error(
      "A new review mark needs --at or --from and --to, and --note",
    );

  const reviewer: string | null = values.get("reviewer") ?? null;
  const decision: string | null = values.get("decision") ?? null;
  const viewed: string | null = values.get("viewed") ?? null;
  if (
    decision !== null &&
    decision !== "accepted" &&
    decision !== "needs-repair"
  )
    throw new Error("Review --decision takes accepted or needs-repair");
  if (
    viewed !== null &&
    viewed !== "still" &&
    viewed !== "playback" &&
    viewed !== "listening"
  )
    throw new Error("Review --viewed takes still, playback or listening");
  if (
    (reviewer === null) !== (decision === null) ||
    (decision === null) !== (viewed === null)
  )
    throw new Error("Give --reviewer, --decision and --viewed together");
  if (requested === null && (note !== null || reviewer !== null))
    throw new Error(
      "Add a note or decision at an explicit position with --file",
    );
  if (viewed === "still" && at === null)
    throw new Error("Still review needs --at to select one frame");
  if (
    (requested === null || requested.to === null) &&
    (viewed === "playback" || viewed === "listening")
  )
    throw new Error("Playback and listening review need --from and --to");
  return {
    file,
    mark,
    requested,
    note,
    reviewer,
    decision,
    viewed,
    out: values.get("out") ?? null,
  };
}

/** Reads a finite nonnegative film second, or null when absent. */
function second(
  values: ReadonlyMap<string, string>,
  key: string,
): number | null {
  const text: string | undefined = values.get(key);
  if (text === undefined) return null;
  const value: number = Number(text);
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`Review --${key} needs a finite nonnegative second`);
  return value;
}
