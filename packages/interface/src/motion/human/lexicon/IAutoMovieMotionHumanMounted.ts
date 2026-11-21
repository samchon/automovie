/**
 * A mounted performance on a moving carrier: an ordered list of seat
 * figures, each planned in the frame of one of the carrier's own contacts
 * and carried with it, with the body supports each figure names acquired,
 * held, transferred and released at their figure's instants. A side-saddle
 * rider settling onto the fixed head and the near stirrup, and a vaulter
 * going from the basic seat to the bench on a surcingle's handles, are such
 * lists on a horse given as a moving prop.
 *
 * The law (`HumanMounted`) is entered seated on the carrier, as
 * `sit` leaves a body, and ends seated, so `ride` or `rise` follows it. A
 * transfer between two figures keeps at least one support held through it,
 * the seat or a hand on the same contact, so weight passes to the next
 * support before the last is released.
 *
 * @evidence contracts/development/common.md#meaningful-documentation on: The moving prop's subject id. frame: The carrier contact whose frame the figures are planned in. figures: The ordered seat figures, at least one, the last seated.
 * @evidence contracts/development/design.md#principled-representation A closed seat vocabulary with named supports per figure and seconds per transfer and hold; the carrier and its contacts are named, never described.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `HumanMounted` and its generated schema.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No mount geometry, gait or contact position is supplied by the author; every support is one of the carrier's declared contacts.
 */
export interface IAutoMovieMotionHumanMounted {
  /** The moving prop the performer is on: its subject id in the performance. */
  on: string;

  /** The carrier's contact whose moving frame every figure is planned in, by its id: a saddle's seat or a vaulting pad's seat. */
  frame: string;

  /** The figures in order, at least one; the last one keeps the seat. */
  figures: IAutoMovieMotionHumanMounted.IFigure[];
}

/**
 * Companion types of {@link IAutoMovieMotionHumanMounted}.
 *
 */
export namespace IAutoMovieMotionHumanMounted {
  /**
   * One seat figure: how the performer reaches it from the previous figure, how long it is held and what each named body part bears on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation seat: The seat kind. transfer: Seconds from the previous figure, more than none. seconds: Seconds held, none or more. supports: The carrier contacts each body part bears on.
   * @evidence contracts/development/design.md#principled-representation Seconds on the action's own clock and contact ids of the carrier.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `HumanMounted`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Supports a seat kind does not read are refused by the law, not ignored.
   */
  export interface IFigure {
    /** The seat kind of the figure. */
    seat: Seat;

    /** Seconds the transfer from the previous figure, or from the entry for the first, takes; more than none. */
    transfer: number;

    /** Seconds the figure is held after its transfer; none or more. */
    seconds: number;

    /** What each body part bears on, by the carrier's contact ids; nothing when absent. */
    supports?: ISupports;
  }

  /**
   * The carrier contacts the body parts of a figure bear on, each by its id.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member names the part and what it holds or rests on.
   * @evidence contracts/development/design.md#principled-representation One optional contact id per supporting part.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The parts the current seat kinds read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A hand holds one contact through the whole performance; the law refuses a hand that changes contact.
   */
  export interface ISupports {
    /** The handle, rein or grip the left hand holds. */
    leftHand?: string;

    /** The handle, rein or grip the right hand holds. */
    rightHand?: string;

    /** The stirrup or rest the left sole stands on. */
    leftFoot?: string;

    /** The surface the left knee rests on. */
    leftKnee?: string;

    /** The surface the right knee rests on. */
    rightKnee?: string;

    /** The bar the right thigh lies over: a side saddle's fixed head. */
    rightThigh?: string;
  }

  /**
   * A seat kind, the posture a figure holds in the carrier contact's frame:
   *
   * - `entered`: the seated posture the law was entered with, legs as they were;
   * - `aside`: a side-saddle seat, square to the carrier's front, the right thigh over `rightThigh` and the left sole on `leftFoot`;
   * - `basic`: a vaulter's basic seat astride, upright, both arms stretched to the sides with the fingertips at eye level, no hand holding;
   * - `bench`: a vaulter's bench, both knees on `leftKnee` and `rightKnee` with the feet tucked behind, the trunk inclined forward and both hands on their handles; the seat is free.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Lists each kind, its posture and the supports it reads.
   * @evidence contracts/development/design.md#principled-representation A closed literal union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The kinds `HumanMounted` plans.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Seat = "entered" | "aside" | "basic" | "bench";

  /**
   * Where a second falls on a mounted performance's clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation index: The figure begun last. share: How far its transfer has gone, eased, 1 through its hold.
   * @evidence contracts/development/design.md#principled-representation An index into the figures and a share in [0, 1].
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by the mounted clock to the mounted law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPhase {
    /** The figure begun last, an index into the figures. */
    index: number;

    /** How far its transfer has gone, 0 to 1 eased by minimum jerk; 1 through its hold. */
    share: number;
  }
}
