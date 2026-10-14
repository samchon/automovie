import type { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import { humanBodyMeasurementRule } from "../measure/humanBodyMeasurementRule";

/**
 * One named tape, breadth or landmark rule on an unchanged shaped body.
 * Only the table's own rules are physical measurements; an unsupported morph
 * name cannot become a numerical control by falling through to a vertex row.
 *
 * @evidence contracts/common.md#principled-implementation A named measurement rule is resolved before reading the shaped skin; absent rules throw and a valid rule may return null when that surface cannot answer it.
 * @evidence contracts/common.md#clear-and-simple-design This adapter only joins the canonical rule table to the caller-owned reader, leaving shape evaluation and section geometry with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported names cannot fall back to raw vertex offsets; every supported name uses the same table lookup and reader.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes physical rules from morph controls; the number uses the rule's metres and null means an unreadable measurement.
 * @evidence contracts/performance.md#efficient-algorithms One own-property object lookup and one measurement are performed; the rule's skin or section traversal determines cost without constructing another reader.
 * @evidence contracts/performance.md#reuse-equivalent-work The passed reader reuses its already evaluated candidate across tape calls; this adapter stores no rule or reading across different shapes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the local rule reference is owned here; reader lifetime belongs to the caller and this synchronous adapter retains no handles or tasks.
 */
export function humanBodySimpleChannel(
  reader: ReturnType<typeof createHumanBodyMeasurementReader>,
  channel: string,
): number | null {
  const rule: ReturnType<typeof humanBodyMeasurementRule> =
    humanBodyMeasurementRule(channel);
  if (rule === undefined)
    throw new Error("No body measurement rule for " + channel + ".");
  return reader.read(rule);
}
