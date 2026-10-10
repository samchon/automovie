import type { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import { humanBodyMeasurementRule } from "../measure/humanBodyMeasurementRule";

/**
 * One named tape, breadth or landmark rule on an unchanged shaped body.
 * Only the table's own rules are physical measurements; an unsupported morph
 * name cannot become a numerical control by falling through to a vertex row.
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
