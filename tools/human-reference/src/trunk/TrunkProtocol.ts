/**
 * Declares a private trunk crop and observation spacing in fixed-frame millimetres.
 * A lower crop can remain an unresolved geometric convention while branch surgery
 * is qualified; its method and uncertainty must travel with every resulting curve.
 *
 * @evidence contracts/common.md#principled-implementation Separates a measured or provisional boundary from the section producer, so a median-crossing heuristic cannot silently become a certified thigh-branch event.
 * @evidence contracts/common.md#clear-and-simple-design Contains only the crop boundary, its grounds and the requested sampling spacing; the upper boundary is read from the source neck01 rig marker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity-specific coordinates are embedded in maintained source; private boundary values retain explicit qualification state.
 * @evidence contracts/common.md#meaningful-documentation Documents millimetres, uncertainty, source-protocol responsibility and the distinction between a crop and an anatomical branch.
 * @evidence contracts/performance.md#efficient-algorithms A constant-size metadata record requires no geometric computation.
 * @evidence contracts/performance.md#reuse-equivalent-work One protocol is shared by training stations, reserved planes and both midline crops; it has no cache identity of its own.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Contains owned scalar data without handles or external resource lifetimes.
 *
 * @author Samchon
 */
export interface TrunkProtocol {
  /** Absolute +Y coordinate of the lower crop in the declared millimetre frame. */
  lowerHeightMm: number;

  /** Source observation or geometric convention that selected the lower crop. */
  lowerBoundaryMethod: string;

  /** Whether source thigh-branch correspondence has actually resolved this crop. */
  lowerBoundaryQualified: boolean;

  /** Observed event interval, when available; absence does not imply zero uncertainty. */
  lowerBoundaryBracketMm?: [number, number];

  /** Optional manifest input ID whose verified bytes support the crop's provenance. */
  lowerBoundaryInput?: string;

  /** Maximum physical training-station separation; its value is a sampling choice. */
  spacingMm: number;

  /** Number of equal intervals across each independent vertical validation family. */
  validationIntervals: number;
}
