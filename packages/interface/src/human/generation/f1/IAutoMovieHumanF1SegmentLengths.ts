/**
 * Skeletal centre separations and extremity breadths used in F1 placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Skeletal centre separations and extremity breadths used in F1 placement.
 * @evidence contracts/development/design.md#principled-representation Named dimensions use millimetres. Digit lengths use an ordered bone-and-tip tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1SegmentLengths defines and resolves these inputs for native family placement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The frame definitions and admission remain with Human.
 */
export namespace IAutoMovieHumanF1SegmentLengths {
  /**
   * Three bone lengths beyond a hand digit's first joint, in millimetres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Three bone lengths beyond a hand digit's first joint, in millimetres.
   * @evidence contracts/development/design.md#principled-representation The fixed tuple distinguishes the two later joint offsets and the distal tip offset in their anatomical order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1SegmentLengths reads this tuple for each hand digit when rebuilding its local offsets.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The length domain and required digit keys remain runtime premises.
   */
  export type IBones = [number, number, number];

  /**
   * Segment lengths and extremity breadths for the reference-family figure, in millimetres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Segment lengths and extremity breadths for the reference-family figure, in millimetres.
   * @evidence contracts/development/design.md#principled-representation Named lengths identify their segment endpoints. Extremity breadths use the declared hand and foot axes. The segment placement owner admits numeric values.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Family placement and native field construction share these complete inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A length field is an authored skeletal displacement. Nothing in the record supplies a measured skin girth.
   */
  export interface IFields {
    /** The upper arm: glenohumeral centre to elbow centre (the forearm's offset in the humerus). */
    upperArm: number;
    /** The forearm: elbow centre to wrist centre (the hand's offset in the forearm). */
    forearm: number;
    /** The thigh: hip joint centre to knee centre (the tibia's offset in the femur). */
    thigh: number;
    /** The shank: knee centre to ankle centre (the foot's offset in the tibia). */
    shank: number;
    /** The lower trunk run: the hip centres' midpoint to suprasternale (the thorax's offset in the pelvis). */
    pelvisToThorax: number;
    /** The upper trunk run: suprasternale to the bitragion midpoint (the head's offset in the thorax). */
    thoraxToHead: number;
    /** The hand along its axis: wrist centre to the third metacarpal head (the middle finger's first joint). */
    handLength: number;
    /** The hand across: the second to the fifth metacarpal head, square to the hand's axis. */
    handBreadth: number;
    /** The foot along its axis: ankle centre to the foot's course end, square to the sole's normal. */
    footLength: number;
    /** The foot across: the first to the fifth metatarsophalangeal joint, square to the foot's axis and the sole's normal. */
    footBreadth: number;
    /** Each finger's and the thumb's bones past its first joint, by digit name (index, middle, ring, pinky, thumb). */
    phalanges: Record<string, IBones>;
  }
}
