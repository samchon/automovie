import { AUTOMOVIE_REVIEW_OPTIONS } from "./AUTOMOVIE_REVIEW_OPTIONS";

/** Longest observation in seconds: one day, beyond any film's playback a person reviews. */
const LONGEST: number = 86_400;

/**
 * Read the options of `automovie review`, `AUTOMOVIE_REVIEW_OPTIONS`.
 *
 * | Option | Meaning | Absent |
 * | --- | --- | --- |
 * | `--url <address>` | The running inspector page, with the request it opens on | Required |
 * | `--seconds <s>` | Wall-clock seconds of playback recorded, positive, at most a day | Required |
 * | `--out <folder>` | Where the recording and `playback.json` go | `media/automovie/review` |
 *
 * It throws naming the option for an option outside the list, an empty value, a missing `--url` or `--seconds`, an address that is not HTTP on this machine, and seconds out of range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Tabulates every option with its meaning and absent value, and states every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation A review records the page a person would watch, so the command names that page and how long to watch it; only a loopback address is admitted, so the command never drives a page elsewhere.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass admitting the listed options, then the checks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No address or duration is guessed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the options.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per command.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record and keeps nothing.
 */
export function readAutoMovieReviewOptions(
  values: ReadonlyMap<string, string>,
): {
  /** The page's address. */
  url: string;

  /** Seconds of playback recorded. */
  seconds: number;

  /** The output folder, or null for the default. */
  out: string | null;
} {
  for (const [key, value] of values) {
    if (!AUTOMOVIE_REVIEW_OPTIONS.includes(key))
      throw new Error(
        `Review takes no option --${key}; it takes ${AUTOMOVIE_REVIEW_OPTIONS.map((option: string): string => `--${option}`).join(", ")}`,
      );
    if (value.trim() === "")
      throw new Error(`Review option --${key} needs a value`);
  }
  const url: string | undefined = values.get("url");
  const text: string | undefined = values.get("seconds");
  if (url === undefined || text === undefined)
    throw new Error("Review needs --url <inspector address> and --seconds <s>");
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
