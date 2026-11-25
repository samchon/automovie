/** Skeletal centre separations and extremity breadths used in F1 placement. */
export namespace IAutoMovieHumanF1SegmentLengths {
  /** Three bone lengths beyond a hand digit's first joint, in millimetres. */
  export type IBones = [number, number, number];

  /**
   * Segment lengths and extremity breadths for the reference-family figure, in
   * millimetres.
   */
  export interface IFields {
    /**
     * The upper arm: glenohumeral centre to elbow centre (the forearm's offset
     * in the humerus).
     */
    upperArm: number;
    /**
     * The forearm: elbow centre to wrist centre (the hand's offset in the
     * forearm).
     */
    forearm: number;
    /**
     * The thigh: hip joint centre to knee centre (the tibia's offset in the
     * femur).
     */
    thigh: number;
    /** The shank: knee centre to ankle centre (the foot's offset in the tibia). */
    shank: number;
    /**
     * The lower trunk run: the hip centres' midpoint to suprasternale (the
     * thorax's offset in the pelvis).
     */
    pelvisToThorax: number;
    /**
     * The upper trunk run: suprasternale to the bitragion midpoint (the head's
     * offset in the thorax).
     */
    thoraxToHead: number;
    /**
     * The hand along its axis: wrist centre to the third metacarpal head (the
     * middle finger's first joint).
     */
    handLength: number;
    /**
     * The hand across: the second to the fifth metacarpal head, square to the
     * hand's axis.
     */
    handBreadth: number;
    /**
     * The foot along its axis: ankle centre to the foot's course end, square to
     * the sole's normal.
     */
    footLength: number;
    /**
     * The foot across: the first to the fifth metatarsophalangeal joint, square
     * to the foot's axis and the sole's normal.
     */
    footBreadth: number;
    /**
     * Each finger's and the thumb's bones past its first joint, by digit name
     * (index, middle, ring, pinky, thumb).
     */
    phalanges: Record<string, IBones>;
  }
}
