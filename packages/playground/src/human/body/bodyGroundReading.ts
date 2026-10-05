import type { IAutoMovieHumanBodyFootSupport } from "@automovie/human";

/**
 * Describe each foot's lowest skin point against the ground plane, or null
 * when the basis has no ground landmark.
 *
 * The line states the signed gap of each foot (clear above, through below)
 * and that it is a geometric reading, not a contact model.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor States each foot's ground gap beside the posed preview.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Shows the geometric ground support reading with its qualification.
 * @author Samchon
 */
export function bodyGroundReading(support: readonly IAutoMovieHumanBodyFootSupport[] | null | undefined): string | null {
  if (support === null || support === undefined) return null;
  return (
    "Ground (geometric, the source ground plane): " +
    support
      .map((foot) => {
        const millimetres = foot.gapMetres * 1000;
        return `${foot.side} foot ${millimetres >= 0 ? `clear by ${millimetres.toFixed(1)} mm` : `through by ${(-millimetres).toFixed(1)} mm`}`;
      })
      .join("; ") +
    "."
  );
}
