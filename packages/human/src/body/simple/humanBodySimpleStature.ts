import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import type { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import { humanBodyMeasurementRule } from "../measure/humanBodyMeasurementRule";

/**
 * The measured clip-ring height plus the basis's declared crown allowance.
 * The reader's one rest skin supplies the ring and lowest foot point; the
 * head allowance is not a second skin deformation or a user sculpt control.
 */
export function humanBodySimpleStature(
  reader: ReturnType<typeof createHumanBodyMeasurementReader>,
): number {
  const height = reader.read(
    humanBodyMeasurementRule(HUMAN_BODY_SIMPLE_SHAPE.solved.stature)!,
  )!;
  return height + HUMAN_BODY_SIMPLE_SHAPE.stature.headAboveRingMetres;
}
