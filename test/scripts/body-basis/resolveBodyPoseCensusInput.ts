/**
 * Preserve the shipped-input authority when no explicit census path was given.
 * The real command supplies its existing directory-anchored default and native
 * caller-CWD resolver. An explicit path, even one spelling the default, always
 * uses the caller's resolver; omission is never interpreted against that CWD.
 *
 * @evidence contracts/common.md#principled-implementation Explicit selection and omission retain their different path authorities without changing basis fingerprinting or population semantics.
 * @evidence contracts/common.md#clear-and-simple-design One pure selection owns the default/explicit distinction; the caller owns native resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No relative default is silently reinterpreted against whichever CWD launched the command.
 * @evidence contracts/common.md#meaningful-documentation Identifies the actual CLI consumer and its two authorities without emulating filesystem semantics.
 */
export function resolveBodyPoseCensusInput(input: {
  selected: string | undefined;
  shipped: string;
  resolveExplicit: (path: string) => string;
}): string {
  return input.selected === undefined ? input.shipped : input.resolveExplicit(input.selected);
}
