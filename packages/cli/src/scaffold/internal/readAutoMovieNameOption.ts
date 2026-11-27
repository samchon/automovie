/*
 * Admit the value following `--name`: present, non-blank and not itself an
 * option.
 *
 * The value is returned as typed; the template's name rule trims and admits it
 * at render time.
 * Parameter value: The token after `--name`, absent at the end of the arguments.
 * Returns: The value.
 * When the value is missing, blank or begins with `-`.
 */
export function readAutoMovieNameOption(value: string | undefined): string {
  if (value === undefined || value.startsWith("-") || value.trim() === "")
    throw new Error("--name needs one non-blank package name.");
  return value;
}
