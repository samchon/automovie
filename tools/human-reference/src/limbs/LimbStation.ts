import type { Section } from "../schema/Section.ts";

/**
 * Locates an axial observation in millimetres; an inherited anchor preserves its
 * complete shared boundary coordinates rather than independently cutting it again.
 *
 * @evidence contracts/common.md#principled-implementation Keeps physical millimetre station distance and an optional exact inherited anchor so shared rings are not independently re-extracted.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface LimbStation {
  /** Distance from the segment's proximal rig marker along its native joint line. */
  mm: number;

  /** Exact existing section, present only at inherited training anchors. */
  anchor?: Section;
}
