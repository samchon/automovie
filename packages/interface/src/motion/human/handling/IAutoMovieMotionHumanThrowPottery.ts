/**
 * Throwing pottery: seated at a wheel, both hands keep contact with the clay
 * wall, one inside and one outside, while the wheel head turns and the wall is
 * drawn up. The clay is round about the head's axis, so a hand on its wall at
 * one height stays on the same surface in the turning head's frame: the head is
 * a moving support the hands follow by staying put on it while the wall rises
 * under them.
 */
export namespace IAutoMovieMotionHumanThrowPottery {
  /** The parameters of `throwPottery`. */
  export interface IParams {
    /**
     * The wheel's subject id: its `head` crank, `raise` slider and `outside`
     * and `inside` wall faces.
     */
    wheel: string;

    /** How far the wall is drawn up, metres; the wheel's whole rise when absent. */
    rise?: number;

    /** The head's speed, revolutions per minute; 120 when absent. */
    rpm?: number;

    /**
     * Seconds of the pull before tempo scaling; positive. Required: no natural
     * value is defined, so the author sets it (provisional: no timing study was
     * read).
     */
    duration: number;
  }
}
