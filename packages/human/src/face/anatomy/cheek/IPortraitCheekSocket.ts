/**
 * Subject-owned attachments for one side of the midface. All identities refer
 * to skin vertices retained by subdivision. The mouth-corner attachment lies
 * on the neighbouring cheek, outside the actual oral opening.
 *
 *
 * @evidence contracts/common.md#principled-implementation Retained skin vertex identities attach the named cheek masses and ordered nasolabial path to the actual subject skin.
 * @evidence contracts/common.md#clear-and-simple-design Four mass anchors and a separate path accompany the anatomical side instead of copied absolute support centres.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The perioral anchor stays outside the oral opening and subdivision retains the original identities rather than replacing another person's geometry.
 * @evidence contracts/common.md#meaningful-documentation Members name each anatomical attachment, side convention and nasal-wing-to-mouth path order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitCheekSocket is a TypeScript-only schema and executes no guide, surface or field algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitCheekSocket declares inputs or results; copying and equivalence belong to its concrete producer/consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitCheekSocket acquires no runtime state or handle; array, map and callback lifetimes remain with their owning operations.
 *
 * @author Samchon
 */
export interface IPortraitCheekSocket {
  /** Anatomical side; positive head X is left. */
  side: "left" | "right";

  /** Prominence beneath the lateral orbital margin. */
  malar: number;

  /** Medial cheek mass lateral to the nasal wing. */
  medial: number;

  /** Lower/lateral cheek transition towards the mandibular region. */
  buccal: number;

  /** Perioral attachment lateral to the lip commissure. */
  modiolus: number;

  /** Nasolabial path from beside the nasal wing towards the mouth corner. */
  nasolabial: number[];
}
