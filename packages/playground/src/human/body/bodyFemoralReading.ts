import type { IConnectedBodyFemoralHeads } from "./IConnectedBodyFemoralHeads";

/**
 * Describe the femoral head targets an explicit body check read, or null
 * when the document asks for none.
 *
 * The line names each side's target radius and its skin room, and says the
 * centre is the hip rig joint, so a fit reading is not read as a hip joint,
 * femur or acetabulum.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor States the femoral head target reading beside the preview.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Shows measured or unavailable femoral heads with their qualification.
 * @author Samchon
 */
export function bodyFemoralReading(
  reading: IConnectedBodyFemoralHeads | null | undefined,
): string | null {
  if (reading === null || reading === undefined) return null;
  if (reading.status === "skin-crossing")
    return "Femoral-head clearance unavailable: the posed skin crosses itself.";
  return (
    "Femoral head targets at the hip rig centre (not a registered head centre): " +
    reading.heads
      .map((head) => {
        const side = head.bone === "leftUpperLeg" ? "left" : "right";
        const room = (Math.abs(head.clearanceMetres) * 1000).toFixed(1);
        const fit = head.centerInside
          ? head.clearanceMetres >= 0
            ? `skin room ${room} mm`
            : `skin protrusion ${room} mm`
          : `centre outside skin by ${(head.nearestMetres * 1000).toFixed(1)} mm`;
        return `${side} radius ${(head.radiusMetres * 1000).toFixed(1)} mm, ${fit}`;
      })
      .join("; ") +
    "."
  );
}
