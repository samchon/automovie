/**
 * Defines one native reference rig segment, whose markers are not clinical landmarks.
 * The observer retains the source posture and millimetre coordinate system.
 *
 * @evidence contracts/common.md#principled-implementation Names the rig markers defining one native segment without interpreting them as clinical landmarks.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface LimbSegment {
  /** Region-local family name, such as forearm or shank. */
  key: string;

  /** Proximal rig marker name. */
  proximal: string;

  /** Distal rig marker name. */
  distal: string;
}
