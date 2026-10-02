import type { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import { humanBodyMeasurementRule } from "../measure/humanBodyMeasurementRule";

/**
 * One named tape, breadth or landmark rule on an unchanged shaped body.
 * Only the table's own rules are physical measurements; an unsupported morph
 * name cannot become a numerical control by falling through to a vertex row.
 *
 * @evidence contracts/common.md#principled-implementation The rule table names the instrument of each channel; the function looks the rule up and reads it on the shared shaped body, and an id without a rule refuses instead of falling through.
 * @evidence contracts/common.md#clear-and-simple-design A lookup and a read over the reader; the rule table and the reader own everything else.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No channel is special-cased; an unmeasured id refuses with its name.
 * @evidence contracts/common.md#meaningful-documentation The comment states that only table rules are measurements and why an unknown name cannot become a control.
 * @evidence contracts/modeling.md#spatial-conventions The reading is metres in the rest body's frame as the reader defines it.
 * @evidence contracts/anatomy.md#parametric-authority The input is a channel id that must own a named measurement rule of the table; an id without a rule refuses, and no input addresses a vertex or curve.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 */
export function humanBodySimpleChannel(
  reader: ReturnType<typeof createHumanBodyMeasurementReader>,
  channel: string,
): number | null {
  const rule = humanBodyMeasurementRule(channel);
  if (rule === undefined)
    throw new Error("No body measurement rule for " + channel + ".");
  return reader.read(rule);
}
