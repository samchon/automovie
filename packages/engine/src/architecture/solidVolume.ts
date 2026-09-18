/** How much solid a body's parts hold, which is not the volume of its box.  * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Supplies the world extent project source needs to inspect one named building placement.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Resolves element geometry or conservative compact-population bounds while preserving the measurement basis.
 * @author Samchon
 */
export const solidVolume = (parts: readonly IWorldBox[]): number =>
  parts.reduce((total, part) => total + boxVolume(part), 0);
