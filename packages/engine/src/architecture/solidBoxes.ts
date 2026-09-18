/**
 * The boxes a locator's body actually fills, one per drawn part where it has
 * them and the reported box otherwise.
 *
 * An element resolves to its parts, because a multi-part body's union box is
 * mostly air and a test written against it answers about the box rather than
 * the body. Every other locator has no part structure to consult and keeps the
 * one box it reports, and so does an element that draws nothing.
 *
 * The parts arrive through `lookup` rather than from a fixed source, because
 * one caller asks about a single pair and another has already resolved the whole
 * building. The rule about what to do with the answer is the same either way,
 * and writing it twice is how the two stop agreeing.
  * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Supplies the world extent project source needs to inspect one named building placement.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Resolves element geometry or conservative compact-population bounds while preserving the measurement basis.
 * @author Samchon
 */
export const solidBoxes = (
  locator: AutoMovieBuiltPlacementBodyLocator,
  reported: IAutoMovieBuiltPlacementBounds,
  lookup: (id: string) => readonly IWorldBox[] | null | undefined,
): readonly IWorldBox[] => {
  if (locator.kind !== "element") return [reported];
  const parts = lookup(locator.id);
  return parts === null || parts === undefined || parts.length === 0
    ? [reported]
    : parts;
};
