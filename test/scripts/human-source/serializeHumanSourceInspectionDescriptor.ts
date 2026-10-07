import type { IHumanSourceAuthoredStageReceipt } from "./structures/IHumanSourceAuthoredStageReceipt.ts";

/** Portable failed-component identity, excluding only host refusal prose.
 * Clinical/full-stage refusal stays explicit. The same serialization serves
 * acquisition and final input reobservation; run PID/executable/stack do not
 * become geometry identity. Original receipt and raw failure are preserved.
 * @author Samchon
 */
export function serializeHumanSourceInspectionDescriptor(
  receipt: IHumanSourceAuthoredStageReceipt,
): Buffer {
  const files = Object.fromEntries(
    Object.entries(receipt.files).filter(
      ([name]) => name !== "full-stage-refusal.json",
    ),
  );
  return Buffer.from(
    JSON.stringify({
      schema: receipt.schema,
      completed: receipt.completedComponents,
      refused: receipt.refusedComponents,
      completeGeneration: receipt.completeGeneration,
      fullStageAccepted: receipt.fullStageAccepted,
      inspectionOnly: receipt.inspectionOnly,
      inputs: receipt.inputs,
      files,
    }),
  );
}
