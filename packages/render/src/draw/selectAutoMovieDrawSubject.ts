/**
 * Choose the subject a draw page creates from the names its module offers: the named one, or with no name the only one.
 *
 * It throws, listing every offered name: for a name the module does not offer, for no name when the module offers several, and for a module that offers none.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two ways a subject is chosen and the three refusals.
 * @evidence contracts/development/implementation.md#principled-implementation A name is matched exactly against the module's own keys, and an absent name is accepted only where it cannot be ambiguous.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per refusal, then the choice.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No first subject is guessed for an absent name, and a mistyped name is refused instead of falling back.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the offered names.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure choice made once per page.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one string and keeps nothing.
 */
export function selectAutoMovieDrawSubject(
  offered: readonly string[],
  name: string | null,
): string {
  const listed: string = offered.join(", ") || "none";
  if (offered.length === 0)
    throw new Error("The draw page's subject module offers no subject");
  if (name === null) {
    if (offered.length !== 1)
      throw new Error(
        `The draw page offers several subjects, so one must be named: ${listed}`,
      );
    return offered[0]!;
  }
  if (!offered.includes(name))
    throw new Error(
      `The draw page offers no subject "${name}"; it offers ${listed}`,
    );
  return name;
}
