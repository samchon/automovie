import type { IAutoMovieHumanBodyFootSupport } from "@automovie/human";

/**
 * Describe each foot's lowest skin point against the ground plane, or null when the basis has no ground landmark.
 *
 * The line states the signed gap of each foot (clear above, through below) and that it is a geometric reading, not a contact model.
 *
 * @evidence contracts/common.md#principled-implementation Signed foot gaps are converted from metres to millimetres and formatted as clear or through relative to the source ground plane; absent inspection stays null and zero follows the nonnegative branch.
 * @evidence contracts/common.md#clear-and-simple-design This formatter consumes existing foot-support readings and returns display text without measuring a mesh, changing placement or modelling physical contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The result retains its geometric qualification and actual gap sign, without clamping penetration to zero or treating display rounding as ground contact admission.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies optional inspection, signed ground-gap meaning and the limitation to geometry rather than contact mechanics.
 * @evidence contracts/performance.md#efficient-algorithms Formatting traverses f supplied foot readings once with O(f) text fragments and output; the final join avoids repeating any ground measurement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Foot-status formatting is one synchronous value conversion with no retained work across inspection requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The operation acquires only temporary text and returns its result without owning ground meshes, GPU handles or tasks.
 *
 * @author Samchon
 */
export function bodyGroundReading(
  support: readonly IAutoMovieHumanBodyFootSupport[] | null | undefined,
): string | null {
  if (support === null || support === undefined) return null;
  return (
    "Ground (geometric, the source ground plane): " +
    support
      .map((foot: IAutoMovieHumanBodyFootSupport): string => {
        const millimetres: number = foot.gapMetres * 1000;
        return `${foot.side} foot ${millimetres >= 0 ? `clear by ${millimetres.toFixed(1)} mm` : `through by ${(-millimetres).toFixed(1)} mm`}`;
      })
      .join("; ") +
    "."
  );
}
