import {
  type AutoMovieProductionLanguage,
  isAutoMovieProductionLanguage,
} from "@automovie/evidence";
import {
  AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES,
  type AutoMovieExternalModelIngestProfile,
  isAutoMovieExternalModelIngestProfile,
} from "@automovie/ingest";
import {
  AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS,
  type AutoMovieAuthoringProductionKind,
  isAutoMovieAuthoringProductionKind,
} from "@automovie/template";

type AutoMovieCommand =
  | { command: "help" }
  | { command: "version" }
  | {
      command: "start";
      directory: string;
      force: boolean;
      language: AutoMovieProductionLanguage;
    }
  | {
      command: "inspect-external";
      path: string;
      profile: AutoMovieExternalModelIngestProfile;
    }
  | { command: "toc"; check: boolean }
  | { command: "routes"; kind: AutoMovieAuthoringProductionKind };

const nonBlankDirectory = (
  command: string,
  value: string | undefined,
): string => {
  if (value === undefined || value.trim().length === 0)
    throw new Error(`${command} needs one non-blank target directory.`);
  return value;
};

const startArguments = (
  args: readonly string[],
): Extract<AutoMovieCommand, { command: "start" }> => {
  const positionals: string[] = [];
  let force = false;
  let language: string | undefined;
  for (let index = 0; index < args.length; ++index) {
    const token = args[index]!;
    if (token === "--force") {
      if (force)
        throw new Error("--force may be supplied only once for start.");
      force = true;
    } else if (token === "--language") {
      if (language !== undefined)
        throw new Error("--language may be supplied only once for start.");
      language = args[++index];
      if (language === undefined || language.startsWith("-"))
        throw new Error("--language requires a value.");
    } else if (token.startsWith("-"))
      throw new Error(`Unknown or inapplicable start option "${token}".`);
    else positionals.push(token);
  }
  if (positionals.length > 1)
    throw new Error(
      `start accepts exactly one target directory; received ${positionals.length}.`,
    );
  if (isAutoMovieProductionLanguage(language) === false)
    throw new Error(
      "start requires --language with one of chinese, english, japanese, or korean.",
    );
  return {
    command: "start",
    directory: nonBlankDirectory("start", positionals[0]),
    force,
    language,
  };
};

/**
 * Resolve one complete CLI request into a closed command-specific operation
 * plan before scaffold publication or source inspection begins.
 *
 * `args` excludes the node executable and script positions. No arguments, or a
 * lone `-h`/`--help`, means help; a lone `-v`/`--version` means version; either
 * flag beside other tokens is refused by the named command's own admission.
 * Options take their value as the next token (`--language korean`), a repeated
 * option is refused rather than last-wins, and there is no `--` terminator, so
 * a directory or source path beginning with `-` must be spelled `./-name`. Every refusal throws an `Error`
 * whose message names the correction.
 *
 * @evidence contracts/common.md#principled-implementation A single left-to-right token scan per command that builds a discriminated union, with the language, ingest-profile and production-kind vocabularies decided by type guards their owning packages export.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns every command's admission, with `start` split into `startArguments` because it alone combines a flag, a valued option and a positional; run receives only the closed union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Restates no vocabulary (supported languages, profiles and kinds come from `@automovie/evidence`, `@automovie/ingest` and `@automovie/template`), and duplicate or unknown options are refused instead of ignored.
 * @evidence contracts/common.md#meaningful-documentation States the expected argv slice, the standalone-flag rule, the next-token value form, duplicate refusal, the missing `--` terminator and the throw behavior.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the tokens, plus `toc`'s `some` and `includes` checks over at most a few tokens, so cost is linear in argument count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A process parses its own argv once, so there is no second request whose parse could be shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates one positional array and the small result object, which the caller owns; no handle is acquired.
 * @evidence contracts/portability.md#os-neutral-implementation Receives Node's already split argv strings and never joins or re-splits them, so shell quoting differences between cmd, PowerShell and POSIX shells are settled before this function; directory and source tokens stay opaque until run resolves them with `node:path`.
 */
export const readAutoMovieCommandArguments = (
  args: readonly string[],
): AutoMovieCommand => {
  if (
    args.length === 0 ||
    (args.length === 1 && ["-h", "--help"].includes(args[0]!))
  )
    return { command: "help" } as const;
  if (args.length === 1 && ["-v", "--version"].includes(args[0]!))
    return { command: "version" } as const;

  const [command, ...rest] = args;
  if (command === "start") return startArguments(rest);
  if (command === "toc") {
    if (rest.some((option) => option !== "--check") || rest.length > 1)
      throw new Error("toc accepts --check at most once.");
    return { command, check: rest.includes("--check") } as const;
  }
  if (command === "inspect-external") {
    const positionals: string[] = [];
    let profile: string | undefined;
    for (let index = 0; index < rest.length; ++index) {
      const token = rest[index]!;
      if (token === "--profile") {
        if (profile !== undefined)
          throw new Error("--profile may be supplied only once.");
        profile = rest[++index];
        if (profile === undefined || profile.startsWith("-"))
          throw new Error("--profile requires a value.");
      } else if (token.startsWith("-"))
        throw new Error(
          `Unknown or inapplicable inspect-external option "${token}".`,
        );
      else positionals.push(token);
    }
    if (positionals.length !== 1)
      throw new Error(
        `inspect-external accepts exactly one source path; received ${positionals.length}.`,
      );
    if (isAutoMovieExternalModelIngestProfile(profile) === false)
      throw new Error(
        `inspect-external requires --profile naming one supported ingest profile: ${AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES.join(", ")}.`,
      );
    return {
      command,
      path: positionals[0]!,
      profile,
    } as const;
  }
  if (command === "routes") {
    const kind = rest[0];
    if (rest.length !== 1 || isAutoMovieAuthoringProductionKind(kind) === false)
      throw new Error(
        `routes needs exactly one of ${AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS.join(", ")}.`,
      );
    return { command, kind } as const;
  }
  throw new Error(`Unknown command ${JSON.stringify(command ?? "")}.`);
};

/**
 * Invoke a dispatcher only after the complete command request has been
 * admitted, leaving invalid input with no opportunity to perform side effects.
 *
 * A parse failure throws before `dispatch` runs; whatever `dispatch` returns or
 * throws passes through unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Plain function composition: `readAutoMovieCommandArguments` completes, or throws, before `dispatch` is called, so admission strictly precedes every effect.
 * @evidence contracts/common.md#clear-and-simple-design A one-expression seam whose generic `Output` carries run's numeric exit code through; it holds the admit-then-act ordering and nothing else.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no catch, default command or retry; exceptions from either side propagate untouched to run's single handler.
 * @evidence contracts/common.md#meaningful-documentation States the ordering guarantee and that results and exceptions pass through unchanged.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Adds one function call around the parse and chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call parses the argv it was given exactly once and calls `dispatch` once.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps the parsed command only for the duration of the `dispatch` call it is passed to.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation Forwards the token array to the reader and owns no filesystem, path or process effect; run performs those inside `dispatch`.
 */
export const dispatchAutoMovieCommandArguments = <Output>(
  args: readonly string[],
  dispatch: (
    command: ReturnType<typeof readAutoMovieCommandArguments>,
  ) => Output,
): Output => dispatch(readAutoMovieCommandArguments(args));
