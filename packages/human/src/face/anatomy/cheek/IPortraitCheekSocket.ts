/**
 * Subject-owned attachments for one side of the midface. All identities refer
 * to skin vertices retained by subdivision. The mouth-corner attachment lies
 * on the neighbouring cheek, outside the actual oral opening.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Names distinct malar, medial, buccal and perioral support attachments for one side of the face.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Binds retained skin vertices and an ordered nasolabial path outside the actual oral opening.
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
