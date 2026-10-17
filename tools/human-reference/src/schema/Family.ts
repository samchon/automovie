/**
 * Defines the physical frame and station meanings shared by a measured section family.
 * Phase labels describe orientation in degrees; their anatomical interpretation is provisional.
 *
 * @evidence contracts/common.md#principled-implementation Names the shared station coordinate and phase convention once for a related set of source sections.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface Family {
  /** Region-local identifier referenced by its sections and guides. */
  id: string;

  /** Producer's station construction category, such as level or bone-perpendicular. */
  kind: string;

  /** Physical axis and posture defining the station planes. */
  axis: string;

  /** Meaning of fractional station zero. */
  fraction0: string;

  /** Meaning of fractional station one, including any declared extrapolation. */
  fraction1: string;

  /** Direction defining the in-plane orientation and phase convention. */
  reference: string;

  /** Descriptions of named degree phases in the declared local frame. */
  phaseLabels: Record<string, string>;
}
