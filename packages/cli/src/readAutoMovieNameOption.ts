/**
 * Admit the value following `--name`: present, non-blank and not itself an option.
 *
 * The value is returned as typed; the template's name rule trims and admits it at render time.
 *
 * @param value The token after `--name`, absent at the end of the arguments.
 * @returns The value.
 * @throws When the value is missing, blank or begins with `-`.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Refusing a dash-leading value keeps a following option from being swallowed as the name.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure `create` and `add` share this one value rule.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The value is not normalized here; one name rule in the template decides admission.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the admitted shape, that the value is unchanged, and what throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms One trim and prefix check, linear in the value's length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call checks one token once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function returns a string and retains nothing.
 */
export function readAutoMovieNameOption(value: string | undefined): string {
  if (value === undefined || value.startsWith("-") || value.trim() === "")
    throw new Error("--name needs one non-blank package name.");
  return value;
}
