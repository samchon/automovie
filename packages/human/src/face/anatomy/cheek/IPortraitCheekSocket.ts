/**
 * Subject-owned attachments for one side of the midface. All identities refer
 * to skin vertices retained by subdivision. The mouth-corner attachment lies
 * on the neighbouring cheek, outside the actual oral opening.
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
