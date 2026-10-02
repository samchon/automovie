import { measureFaceSupportFaults } from "./measureFaceSupportFaults";

/**
 * The triangles of a changed surface's faults within a support (those
 * `faceSupportFaults` counts): each turned over against the source, and both
 * of each crossing pair the source did not have.
 *
 * Both APIs call the same pair-identity comparison and retain the same
 * coplanar and contact exclusions described by faceSupportFaults.
 *
 * @evidence contracts/common.md#principled-implementation The returned set contains every turned triangle and both offsets of every new crossing pair; set insertion names a triangle once when several defects touch it. measureFaceSupportFaults compares source identities, so removing an old pair does not mask a new one.
 * @evidence contracts/common.md#clear-and-simple-design The report shares orientation and crossing comparisons with faceSupportFaults and owns only accumulation of affected triangle offsets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports supplied topology identities without document-specific conditions, foreign mutation or caller-data edits.
 * @evidence contracts/common.md#meaningful-documentation States how the report differs from the count and names its shared exclusions.
 * @evidence contracts/modeling.md#spatial-conventions Source and result positions use metres in the same caller frame; returned offsets index the same triangle topology.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The report defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The report defines and consumes no form channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The report emits no geometric primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The report constructs no shared boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The report owns no displayed part or joint; its prepared basis consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The report carries no anatomical value or tissue model.
 * @evidenceExclude contracts/anatomy.md#permitted-range The report does not admit anatomical inputs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The report exposes no input that shapes a human form.
 */
export function faceSupportFaultTriangles(props: {
  source: readonly number[];
  positions: readonly number[];
  indices: readonly number[];
  triangles: readonly number[];
  contact?: ReadonlySet<number>;
}): Set<number> {
  const measured = measureFaceSupportFaults(props);
  const out = new Set(measured.turned);
  for (const pair of measured.crossings)
    for (const t of pair) out.add(t);
  return out;
}
