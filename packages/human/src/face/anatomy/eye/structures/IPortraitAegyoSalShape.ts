/**
 * Optional one-body pretarsal roll. These values shape visible surface
 * fullness in the lower-lid construction; they are not a claim about muscle
 * thickness or a detached tissue mesh.
 * @author Samchon
 */
export interface IPortraitAegyoSalShape {
  /** Distance from the lower-lid margin to the roll crest, in millimetres. */
  offset: number;

  /** Positive anterior relief at the crest, in millimetres. */
  projection: number;

  /** Full transverse roll width, in millimetres. */
  width: number;

  /** Crest-to-shoulder distance, in millimetres. */
  height: number;

  /** Positive support reach used to validate the authored section. */
  reach: number;

  /** Optional medial-to-lateral weights for the seven lower-lid witnesses. */
  weights?: readonly number[];
}
