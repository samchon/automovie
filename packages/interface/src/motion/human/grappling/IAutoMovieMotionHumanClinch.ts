import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";

/**
 * Taking a clinch grip on a partner standing within reach and holding it:
 * the two-handed neck tie of Muay Thai (`plum`), or judo's collar and sleeve
 * grip (`collarSleeve`, kumikata).
 *
 * The goals are the partner's regions, read on the partner's displayed body
 * at every second, so the grip follows the partner. In the plum both palms
 * lie on the back of the partner's neck (the `nape`), one each side of it
 * (`SPREAD` of the half shoulder width, provisional); in the collar and
 * sleeve grip the right hand closes on the partner's left collar (`neckLeft`)
 * and the left hand on the partner's right sleeve at the elbow (`elbowRight`),
 * mirrored for a left-handed grip. Each hand reaches its region in the aimed
 * movement time to a 5 cm grip (McIntosh et al. 2018), holds `hold` seconds
 * and lets go. The feet stay planted. Events: the phrase's `ready` (`grip`,
 * both hands closed), `strokeStart`, `stroke`, `strokeEnd`, `relax`
 * (`release`).
 *
 * With `under` the clinch is a throw's entry (tsukuri): the body lowers
 * through the reach until its fulcrum region stands at the height of the
 * partner's region that lies on it, the contact the throw turns over
 * (#3439); the throw itself is the partner's `perturb` under the pull.
 *
 * Not yet: pummelling, underhooks and overhooks, and the turn-in's own
 * footwork (Koshida et al. 2016).
 *
 * @evidence contracts/development/common.md#meaningful-documentation grip: The grip; `plum` when absent. hand: The collar hand of `collarSleeve`; `right` when absent. hold: Seconds the grip is held; 2 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation grip: The grip; `plum` when absent. hand: The collar hand of `collarSleeve`; `right` when absent. hold: Seconds the grip is held; 2 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.clinch, params); grappling/clinch.ts (clinch.plan, context); grappling/clinch.ts (clinch.regions, grip); grappling/clinch.ts (clinch.regions, return); grappling/clinch.ts (clinch.place, return); grappling/clinch.ts (clinch.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanSide, AutoMovieHumanoidRegion, IAutoMovieMotionManner, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanClinch {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation The partner, a closed grip, a hand and a hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
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

    /** The grip; `plum` when absent. */
    grip?: IAutoMovieMotionHumanClinch.Grip;

    /** The collar hand of `collarSleeve`; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** Seconds the grip is held; 2 when absent.
     * Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    hold?: number;

    /**
     * A throw's entry (tsukuri, #3439): through the reach the body lowers,
     * its knees bending over the planted feet, until its own `fulcrum`
     * region stands at the height of the partner's `on` region, the contact
     * the throw turns the partner over; none when absent.
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
   * The partner's region each hand grips and the sideways offset across it, a share of the partner's half shoulder width toward the partner's left. A clinch grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The partner's region each hand grips and the sideways offset across it, a share of the partner's half shoulder width toward the partner's left. A clinch grip.
   * @evidence contracts/development/design.md#principled-representation Closed choices "plum", "collarSleeve" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/clinch.ts (clinch.regions, grip); grappling/clinch.ts (clinch.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in clinch.regions.
   */
  export type Grip = "plum" | "collarSleeve";

  /**
   * The partner's region each hand grips and the sideways offset across it, a share of the partner's half shoulder width toward the partner's left. Result returned by clinch.regions. The region and offset by hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation region: Partner body region grasped by this hand. across: Lateral offset toward the partner's left, in shares of half the partner's shoulder width.
   * @evidence contracts/development/design.md#principled-representation region: Partner body region grasped by this hand. across: Lateral offset toward the partner's left, in shares of half the partner's shoulder width.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/clinch.ts (clinch.regions, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanSide, AutoMovieHumanoidRegion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IRegionsResult = Record<
    AutoMovieHumanSide,
    {
      /** Partner body region grasped by this hand. */
      region: AutoMovieHumanoidRegion;
      /** Lateral offset toward the partner's left, in shares of half the partner's shoulder width. */
      across: number;
    }
  >;

  /**
   * A partner's region on displayed bones, moved across by a share of the half shoulder width toward the partner's left. Result returned by clinch.place. The point and outward normal, world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Clinch contact point on the displayed partner in world metres. normal: Partner's outward surface normal in world coordinates.
   * @evidence contracts/development/design.md#principled-representation point: Clinch contact point on the displayed partner in world metres. normal: Partner's outward surface normal in world coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/clinch.ts (clinch.place, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IPlaceResult = {
    /** Clinch contact point on the displayed partner in world metres. */
    point: IAutoMovieVector3;
    /** Partner's outward surface normal in world coordinates. */
    normal: IAutoMovieVector3;
  };
}
