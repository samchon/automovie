import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import type { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import { humanBodyMeasurementRule } from "../measure/humanBodyMeasurementRule";

/**
 * The measured clip-ring height plus the basis's declared crown allowance.
 * The reader's one rest skin supplies the ring and lowest foot point; the
 * head allowance is not a second skin deformation or a user sculpt control.
 *
 * @evidence contracts/common.md#principled-implementation Stature is read as the ring height above the lowest skin point plus the basis's declared crown allowance, both read from one shaped skin, so the two terms describe one body; the allowance is the constant the basis declares for the head the clip removed.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: the stature reading of an already read body, in two lines over the reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The allowance is a table value for the basis, not a per-person or per-request adjustment, and no expected stature is named.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the two terms are and that the allowance is neither a deformation nor a control.
 * @evidence contracts/modeling.md#spatial-conventions Lengths are metres in the rest body's frame with the height along Y; the allowance is metres from the same table.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is not an input through which a caller shapes a body.
 */
export function humanBodySimpleStature(
  reader: ReturnType<typeof createHumanBodyMeasurementReader>,
): number {
  const height = reader.read(
    humanBodyMeasurementRule(HUMAN_BODY_SIMPLE_SHAPE.solved.stature)!,
  )!;
  return height + HUMAN_BODY_SIMPLE_SHAPE.stature.headAboveRingMetres;
}
