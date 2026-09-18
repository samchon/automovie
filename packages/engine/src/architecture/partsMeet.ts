/** Whether any part of one body shares positive volume with any part of another.  * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Supplies the world extent project source needs to inspect one named building placement.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Resolves element geometry or conservative compact-population bounds while preserving the measurement basis.
 * @author Samchon
 */
export const partsMeet = (
  left: readonly IWorldBox[],
  right: readonly IWorldBox[],
): boolean =>
  left.some((leftPart) =>
    right.some((rightPart) => propBoundsOverlap(leftPart, rightPart)),
  );
