import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidRegion } from "../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanBalance } from "./IAutoMovieMotionHumanBalance";

/**
 * Taking a clinch grip on a partner standing within reach and holding it: the
 * two-handed neck tie of Muay Thai (`plum`), or judo's collar and sleeve grip
 * (`collarSleeve`, kumikata).
 *
 * The goals are the partner's regions, read on the partner's displayed body at
 * every second, so the grip follows the partner. In the plum both palms lie on
 * the back of the partner's neck (the `nape`), one each side of it (`SPREAD` of
 * the half shoulder width, provisional); in the collar and sleeve grip the
 * right hand closes on the partner's left collar (`neckLeft`) and the left hand
 * on the partner's right sleeve at the elbow (`elbowRight`), mirrored for a
 * left-handed grip. Each hand reaches its region in the aimed movement time to
 * a 5 cm grip (McIntosh et al. 2018), holds `hold` seconds and lets go. The
 * feet stay planted. Events: the phrase's `ready` (`grip`, both hands closed),
 * `strokeStart`, `stroke`, `strokeEnd`, `relax` (`release`).
 *
 * With `under` the clinch is a throw's entry (tsukuri): the body lowers through
 * the reach until its fulcrum region stands at the height of the partner's
 * region that lies on it, the contact the throw turns over; the throw itself is
 * the partner's `perturb` under the pull.
 *
 * Not yet: pummelling, underhooks and overhooks, and the turn-in's own footwork
 * (Koshida et al. 2016).
 */
export namespace IAutoMovieMotionHumanClinch {
  /** Parameters. */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** The partner gripped. */
    partner: string;

    /**
     * The grip; `plum` when absent: `plum`, the two-handed neck tie of Muay
     * Thai clinch fighting; `collarSleeve`, judo's collar and sleeve grip that
     * opens a throw.
     */
    grip?: IAutoMovieMotionHumanClinch.Grip;

    /** The collar hand of `collarSleeve`; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /**
     * Seconds the grip is held once both hands have closed, before they let go,
     * at least 0; 2 s when absent (`clinch`, provisional: no study of a grip's
     * duration was read). The hands reach in their aimed movement time first
     * (McIntosh et al. 2018), so the whole action is that time, `hold` and the
     * release. 0 closes and lets go at once; a few seconds fits a held neck tie
     * or a grip taken before a throw.
     */
    hold?: number;

    /**
     * A throw's entry (tsukuri): through the reach the body lowers, its knees
     * bending over the planted feet, until its own `fulcrum` region stands at
     * the height of the partner's `on` region, the contact the throw turns the
     * partner over; none when absent.
     */
    under?: {
      /** This body's region the partner turns over. */
      fulcrum: AutoMovieHumanoidRegion;

      /** The partner's region that lies on it. */
      on: AutoMovieHumanoidRegion;
    };

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * The partner's region each hand grips and the sideways offset across it, a
   * share of the partner's half shoulder width toward the partner's left. A
   * clinch grip.
   */
  export type Grip = "plum" | "collarSleeve";

  /**
   * The partner's region each hand grips and the sideways offset across it, a
   * share of the partner's half shoulder width toward the partner's left.
   * Result returned by clinch.regions. The region and offset by hand.
   */
  export type IRegionsResult = Record<
    AutoMovieHumanSide,
    {
      /** Partner body region grasped by this hand. */
      region: AutoMovieHumanoidRegion;
      /**
       * Lateral offset toward the partner's left, in shares of half the
       * partner's shoulder width.
       */
      across: number;
    }
  >;

  /**
   * A partner's region on displayed bones, moved across by a share of the half
   * shoulder width toward the partner's left. Result returned by clinch.place.
   * The point and outward normal, world.
   */
  export type IPlaceResult = {
    /** Clinch contact point on the displayed partner in world metres. */
    point: IAutoMovieVector3;
    /** Partner's outward surface normal in world coordinates. */
    normal: IAutoMovieVector3;
  };
}
