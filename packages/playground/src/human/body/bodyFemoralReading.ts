import type { IConnectedBodyFemoralHeads } from "@automovie/human/body/runtime/IConnectedBodyFemoralHeads";

/**
 * Describe the femoral head targets an explicit body check read, or null when the document asks for none.
 *
 * The line names each side's target radius and its skin room, and says the centre is the hip rig joint, so a fit reading is not read as a hip joint, femur or acetabulum.
 *
 * @evidence contracts/common.md#principled-implementation The formatter preserves the inspection union's absent and skin-crossing states and translates target radii and signed clearance from metres to millimetres, without relocating the hip-rig reference centres.
 * @evidence contracts/common.md#clear-and-simple-design One status sentence displays numerical target readback while the Human inspection owner retains geometry, reference frames and admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sentence explicitly calls the hip rig centre unregistered and distinguishes skin room, protrusion and outside-centre distance rather than claiming a complete anatomical hip.
 * @evidence contracts/common.md#meaningful-documentation Documentation names optional no-target output, each side's radius and clearance, and the limitation of rig-centred targets compared with registered femoral anatomy.
 * @evidence contracts/performance.md#efficient-algorithms A single map over h femoral-head readings and one join produce O(h) fragments and output; display rounding performs no additional numerical evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This femoral-status formatter performs no request coordination or reusable measurement computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Per-call formatted fragments leave with the returned sentence; no handles, subscriptions or live tasks are retained.
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
      .map((head: IConnectedBodyFemoralHeads["heads"][number]): string => {
        const side: string = head.bone === "leftUpperLeg" ? "left" : "right";
        const room: string = (Math.abs(head.clearanceMetres) * 1000).toFixed(1);
        const fit: string = head.centerInside
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
