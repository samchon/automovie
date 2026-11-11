/**
 * Map a command line onto the named text values `parseAutoMovieCapturePlanRequest` reads, the command's whole share of reading a request.
 *
 * Each option is `--<key> <value>`, `--<key>=<value>`, or `--<key>` alone, which reads as the empty string and turns a switch on, as `?<key>` does in an address. An option takes the next argument as its value unless that argument starts with `--`, so a negative number or an axis cut such as `-x:0.2` is a value. Which keys exist is the reader's to decide.
 *
 * It throws for an argument that is not an option where one is expected, and for an option given twice, naming it.
 *
 * ```ts
 * const request = parseAutoMovieCapturePlanRequest(readAutoMovieCaptureArguments(process.argv.slice(2)));
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three option forms, what a bare option reads as and why, the value rule, what is left to the reader, and both refusals.
 * @evidence contracts/development/implementation.md#principled-implementation A bare option and an address key without a value both read as the empty string, so one request text means the same switch in either host; a repeat is refused because the reader cannot tell which of two values was meant.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the arguments; the meaning of every key belongs to the reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is guessed from position: a stray value and a repeated option throw.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of arguments.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The arguments are read once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one small map and keeps nothing.
 */
export function readAutoMovieCaptureArguments(
  argv: readonly string[],
): Map<string, string> {
  const values: Map<string, string> = new Map();
  for (let index: number = 0; index < argv.length; index++) {
    const argument: string = argv[index]!;
    if (!argument.startsWith("--") || argument.length === 2)
      throw new Error(`Capture argument "${argument}" is not an option --<key>`);

    // The value is after `=`, the next argument that is not an option, or empty.
    const equals: number = argument.indexOf("=");
    const key: string =
      equals === -1 ? argument.slice(2) : argument.slice(2, equals);
    const next: string | undefined = argv[index + 1];
    let value: string = "";
    if (equals !== -1) value = argument.slice(equals + 1);
    else if (next !== undefined && !next.startsWith("--")) {
      value = next;
      index++;
    }
    if (values.has(key))
      throw new Error(`Capture option --${key} is given twice`);
    values.set(key, value);
  }
  return values;
}
