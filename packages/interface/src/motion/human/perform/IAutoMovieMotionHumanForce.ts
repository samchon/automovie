import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";

/**
 * Forces on a performer as input to a performance (#3429): an impulse at an
 * instant (a blow, a shove, a hit) or a force sustained over a span (a load,
 * a pull, a braking support), each acting on a region or a point of a bone.
 *
 * Forces only inform the reactions a composition places, as layers never
 * start actions: a law reads the forces on its performer in its span
 * through its context (`IAutoMovieMotionHumanActionContext.forces`), and the balance
 * outcome of an impulse is the engine's (`resolveAutoMovieBalanceOutcome`).
 * A hit becomes an impulse here and only here (`ofHit`), so a melee stop, a
 * projectile and a blast reach the body the same way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation seconds: Film seconds. impulse: World newton seconds, on the body. from: Film seconds, start.
 * @evidence contracts/development/design.md#principled-representation seconds: Film seconds. impulse: World newton seconds, on the body. from: Film seconds, start.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.pull, return); grappling/HumanForceResponse.ts (HumanForceResponse.plan.open, return); grappling/HumanForceResponse.ts (HumanForceResponse.plan.sum, f); grappling/HumanForceResponse.ts (HumanForceResponse.plan.span, f); grappling/HumanForceResponse.ts (HumanForceResponse.plan.sites, f); perform/HumanForce.ts (HumanForce.at, force).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, AutoMovieHumanoidRegion, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanForce {
  /**
   * A force of either kind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A force of either kind.
   * @evidence contracts/development/design.md#principled-representation An impulse acts at one instant with momentum units; a sustained force acts over its declared interval with force units. Their separate records retain those different time laws.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceResponse.ts (HumanForceResponse.plan.open, f); perform/HumanForce.ts (HumanForce.within, forces); perform/HumanForce.ts (HumanForce.within, return); perform/HumanForce.ts (HumanForce.within, f); perform/HumanLoad.ts (HumanLoad.sustained, forces); perform/HumanPerformancePlace.ts (HumanPerformancePlace.place.context, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanForce.IImpulse, IAutoMovieMotionHumanForce.ISustained identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IForce =
    | IAutoMovieMotionHumanForce.IImpulse
    | IAutoMovieMotionHumanForce.ISustained;

  /**
   * The impulse a hit delivers to the struck person, the only conversion of a hit record into a force (P1, #3480). An impulse at an instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation seconds: Film seconds. impulse: World newton seconds, on the body.
   * @evidence contracts/development/design.md#principled-representation seconds: Film seconds. impulse: World newton seconds, on the body.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanForce.ts (HumanForce.ofHit, return); perform/HumanForce.ts (HumanForce.ofHit.of, return); reaction/perturb.ts (perturb.plan.impulses, return); reaction/perturb.ts (perturb.plan.impulse, f); reaction/perturb.ts (perturb.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanForce.At, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IImpulse {
    /** The discriminator. */
    kind: "impulse";

    /** The person it acts on. */
    subject: string;

    /** Where it acts. */
    at: IAutoMovieMotionHumanForce.At;

    /** Film seconds. */
    seconds: number;

    /** World newton seconds, on the body. */
    impulse: IAutoMovieVector3;
  }

  /**
   * Where a force acts on the body: a surface region, or a point in a bone's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation bone: Bone carrying the force application point. point: Force application point in that bone's local frame, metres.
   * @evidence contracts/development/design.md#principled-representation bone: Bone carrying the force application point. point: Force application point in that bone's local frame, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.pull, at); grappling/HumanForceThrow.ts (HumanForceThrow.site, at); perform/HumanForce.ts (HumanForce.ofHit).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidRegion, AutoMovieHumanoidBone, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type At =
    | AutoMovieHumanoidRegion
    | {
        /** Bone carrying the force application point. */
        bone: AutoMovieHumanoidBone;
        /** Force application point in that bone's local frame, metres. */
        point: IAutoMovieVector3;
      };

  /**
   * The pull as the force input's sustained records: the force spread equally over the grip sites, constant over the window. A force sustained over a span.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: Film seconds, start. to: Film seconds, end. force: World newtons on the body, constant or a pure function of film seconds.
   * @evidence contracts/development/design.md#principled-representation from: Film seconds, start. to: Film seconds, end. force: World newtons on the body, constant or a pure function of film seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.pull, return); grappling/HumanForceResponse.ts (HumanForceResponse.plan.open, return); grappling/HumanForceResponse.ts (HumanForceResponse.plan.sum, f); grappling/HumanForceResponse.ts (HumanForceResponse.plan.span, f); grappling/HumanForceResponse.ts (HumanForceResponse.plan.sites, f); perform/HumanForce.ts (HumanForce.at, force).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanForce.At, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISustained {
    /** The discriminator. */
    kind: "sustained";

    /** The person it acts on. */
    subject: string;

    /** Where it acts. */
    at: IAutoMovieMotionHumanForce.At;

    /** Film seconds, start. */
    from: number;

    /** Film seconds, end. */
    to: number;

    /** World newtons on the body, constant or a pure function of film seconds. */
    force: IAutoMovieVector3 | ((seconds: number) => IAutoMovieVector3);
  }

  /**
   * The receiver of a hit: its mass and its velocity at the struck point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation velocity: World metres per second at the struck point.
   * @evidence contracts/development/design.md#principled-representation velocity: World metres per second at the struck point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanForce.ts (HumanForce.ofHit, receiver).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IReceiver {
    /** Kilograms. */
    mass: number;

    /** World metres per second at the struck point. */
    velocity: IAutoMovieVector3;
  }
}
