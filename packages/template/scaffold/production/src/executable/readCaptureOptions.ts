/**
 * Read the capture command's arguments into a map from option to text.
 *
 * A valued option takes the next argument or the text after `=`; a flag takes none and reads as `1`. It throws for an option the command does not have, for a valued option without a value and for a flag given one. A later repeat of an option replaces the earlier one.
 *
 * ```ts
 * readCaptureOptions(["--film", "starter", "--shade=clay", "--wire"]);
 * // Map { "--film" => "starter", "--shade" => "clay", "--wire" => "1" }
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both value forms, what a flag reads as, the three refusals and the repeat rule, with one example.
 * @evidence contracts/development/implementation.md#principled-implementation Every option is admitted against the command's two lists before any work starts, so a mistyped option stops the run instead of being ignored; a flag reads as `1`, the text the inspection request reader takes for a switch that is on.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the arguments; what each option means belongs to the capture command.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown options, missing values and a value on a flag throw; nothing is guessed from position.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of arguments.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The arguments are read once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one small map and keeps nothing.
 */
export function readCaptureOptions(
  argv: readonly string[],
): Map<string, string> {
  const options: Map<string, string> = new Map();
  for (let index: number = 0; index < argv.length; index++) {
    const [key, inline] = argv[index]!.split(/=(.*)/s) as [string, string?];
    if (FLAGS.includes(key)) {
      if (inline !== undefined) throw new Error(`${key} takes no value`);
      options.set(key, "1");
      continue;
    }
    if (!VALUED.includes(key)) throw new Error(`Unknown option ${key}`);
    const value: string | undefined = inline ?? argv[++index];
    if (value === undefined || value === "")
      throw new Error(`${key} needs a value`);
    options.set(key, value);
  }
  return options;
}

/** Options that take no value. */
const FLAGS: readonly string[] = [
  "--list",
  "--paths",
  "--no-label",
  "--no-sheet",
  "--video",
  "--wire",
  "--xray",
];

/** Options that take a value. */
const VALUED: readonly string[] = [
  "--film",
  "--module",
  "--export",
  "--file",
  "--from",
  "--to",
  "--rate",
  "--events",
  "--every",
  "--at",
  "--width",
  "--height",
  "--supersample",
  "--view",
  "--out",
  "--per-sheet",
  "--columns",
  "--round",
  "--compare",
  "--tolerance",
  "--parts",
  "--hide",
  "--shade",
  "--surface",
  "--curves",
  "--defects",
  "--sliver",
  "--section",
  "--stroke",
];
