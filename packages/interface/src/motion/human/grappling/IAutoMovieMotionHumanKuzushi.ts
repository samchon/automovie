/**
 * A broken base (kuzushi): the receiver of a judo throw drawn off balance
 * forward, the whole body tipped about the ankles over the toes while the feet
 * stay on the floor, the stage before a throw carries the body over.
 *
 * The body turns as one about the midpoint of its two ankles by `depth` degrees
 * forward over `TIP` seconds, holds there for `hold` seconds and comes back
 * over `TIP` seconds; the feet keep their planted goals, so the ankles bend and
 * the centre of mass passes ahead of the toes. A balanced person leans from the
 * hips and moves them back (`gestureBow.bowed`); a broken base is the lean that
 * does not, which is what the partner's pull and the thrower's entry produce.
 *
 * What follows, the body carried over the thrower's hip and its fall, is set by
 * the forces of the throw and is the force-determined follow-up, not staged
 * here; nor are the receiver's grips and the breakfall.
 *
 * Events: `broken` when the lean is full, `relax` when it starts back.
 */
export namespace IAutoMovieMotionHumanKuzushi {
  /** Parameters. */
  export interface IParams {
    /** The partner who breaks the base, for the mutual join; unread by the tip. */
    partner?: string;

    /**
     * How far forward the body tips about the ankles, degrees in (0, 30]; 15
     * degrees when absent (`kuzushi.DEPTH`, provisional: past the toes for an
     * adult). The tip takes 0.5 s each way (`kuzushi.TIP`, provisional).
     */
    depth?: number;

    /**
     * Seconds the tip is held at its depth; 1 when absent. The action lasts the
     * tip's 0.5 s each way and this.
     */
    hold?: number;
  }
}
