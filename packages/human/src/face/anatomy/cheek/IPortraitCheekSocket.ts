/**
 * Subject-owned attachments for one side of the midface. All identities refer
 * to skin vertices retained by subdivision. The mouth-corner attachment lies
 * on the neighbouring cheek, outside the actual oral opening.
 *
 * @evidence contracts/common.md#principled-implementation The record names one skin vertex per soft-tissue mass and an ordered path for the nasolabial groove, on one anatomical side; the distinct, ordered, nonnegative integer identities the type cannot express are checked by createPortraitCheekLayer, and the vertices are read from the live skin at fit time.
 * @evidence contracts/common.md#clear-and-simple-design Four identities, one ordered path and a side, with no behaviour.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration carries no behaviour, special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation The comment and members state the side convention, what each identity attaches to and that the path runs beside the nasal wing towards the mouth corner outside the oral opening.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is a declaration and defines no part or group; it names attachments of the cheek layer.
 * @evidenceExclude contracts/modeling.md#parameter-channels The socket holds skin identities and no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The members are vertex identities and a side name; they carry no unit or coordinate frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type constructs no surface; it names the skin vertices the layer binds to.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type is a declaration and displays nothing; the layer that reads it is observed by its owner.
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
