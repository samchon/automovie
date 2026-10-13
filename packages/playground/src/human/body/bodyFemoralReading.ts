import type { IConnectedBodyFemoralHeads } from "@automovie/human/body/runtime/IConnectedBodyFemoralHeads";

/**
 * Describe the femoral head targets an explicit body check read, or null
 * when the document asks for none.
 *
 * The line names each side's target radius and its skin room, and says the
 * centre is the hip rig joint, so a fit reading is not read as a hip joint,
 * femur or acetabulum.
 *
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
