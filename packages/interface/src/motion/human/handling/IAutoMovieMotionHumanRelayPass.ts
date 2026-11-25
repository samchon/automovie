import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A relay baton pass, one role of it, performed over a run (`HumanChain.over`):
 * the outgoing runner's hand goes back, open, palm back, and the incoming
 * runner pushes the baton's end into it at a film second both roles state alike
 * (`at`), from where the baton passes to the outgoing hand.
 *
 * The outgoing hand is placed in the runner's own frame: behind and below the
 * shoulder by shares of the arm (the upsweep's hand, provisional), the palm
 * back and the fingers down. The incoming hand is placed each second so the
 * baton's end, read in the hand's frame where the baton is worn
 * (`IAutoMovieMotionHumanProp.worn`), lies on the outgoing runner's displayed
 * palm. Each arm leaves the run's swing over `REACH` seconds before `at` and
 * goes back to it over `REACH` after `HOLD`. The outgoing role wears the baton
 * on its hand from `at` (`IAutoMovieMotionHumanActionPlan.wears`), so it rides
 * that hand from the exchange on; without a baton the pass is mimed.
 *
 * First pass: the free distance is the composition's (where the two runs put
 * the runners at `at`); the runners do not adjust their speed to meet, and the
 * fingers do not close on the baton.
 */
export namespace IAutoMovieMotionHumanRelayPass {
  /** Parameters. */
  export interface IParams {
    /** Which runner: the one bringing the baton or the one taking it. */
    role: "incoming" | "outgoing";

    /** The other runner. */
    partner: string;

    /**
     * The film second the baton reaches the outgoing hand; both roles give the
     * same one.
     */
    at: number;

    /**
     * The baton's subject id, worn on the incoming runner's passing hand; mimed
     * when absent.
     */
    baton?: string;

    /**
     * The baton's point that is pushed into the outgoing hand, one of its
     * points; required with `baton`.
     */
    end?: string;

    /** The passing hand of both runners; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** The takeover zone the baton must pass in; unchecked when absent. */
    zone?: IAutoMovieMotionHumanRelayPass.IZone;
  }

  /**
   * A relay takeover zone on the track: the lane's middle at the zone's entry
   * line and at its exit line, world metres on the floor. The pass at `at` must
   * fall between them (World Athletics TR24.19: a 30 m zone).
   */
  export interface IZone {
    /** The lane's middle on the zone's entry line, world metres. */
    from: IAutoMovieVector3;

    /** The lane's middle on the zone's exit line, world metres. */
    to: IAutoMovieVector3;
  }
}
