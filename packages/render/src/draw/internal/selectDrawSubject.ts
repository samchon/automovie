/*
 * Choose the subject a draw page creates from the names its module offers: the
 * named one, or with no name the only one.
 *
 * It throws, listing every offered name: for a name the module does not offer,
 * for no name when the module offers several, and for a module that offers
 * none.
 */
export function selectDrawSubject(
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
