/**
 * Throwing pottery: seated at a wheel, both hands keep contact with the
 * clay wall, one inside and one outside, while the wheel head turns and the
 * wall is drawn up. The clay is round about the head's axis, so a hand on
 * its wall at one height stays on the same surface in the turning head's
 * frame: the head is a moving support the hands follow by staying put on
 * it while the wall rises under them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two contacts, the turning support and why the contact holds in its frame.
 * @evidence contracts/development/design.md#principled-representation The wheel by subject, the rise in metres, the turning in revolutions per minute and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `throwPottery` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The wheel must declare its head, rise and two wall faces.
 */
export namespace IAutoMovieMotionHumanThrowPottery {
  /**
   * The parameters of `throwPottery`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the wheel, the rise, the speed and the duration.
   * @evidence contracts/development/design.md#principled-representation Metres, revolutions per minute and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs the law reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The rise must lie within the wheel's.
   */
  export interface IParams {
    /** The wheel's subject id: its `head` crank, `raise` slider and `outside` and `inside` wall faces. */
    wheel: string;

    /** How far the wall is drawn up, metres; the wheel's whole rise when absent. */
    rise?: number;

    /** The head's speed, revolutions per minute; 120 when absent. */
    rpm?: number;

    /** Seconds of the pull before tempo scaling; positive. */
    seconds: number;
  }
}
