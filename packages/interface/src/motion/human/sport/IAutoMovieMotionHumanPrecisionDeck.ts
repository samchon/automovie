import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "../../../physics/IAutoMoviePhysicalProfile";
import type { IAutoMoviePhysicalSimulationInput } from "../../../physics/IAutoMoviePhysicalSimulationInput";
import type { IAutoMoviePhysicsCache } from "../../../physics/IAutoMoviePhysicsCache";

/**
 * The playing surface, released ball and loose targets of one precision
 * delivery: a bowling lane and its pins, a cue table and its object balls,
 * a putting green and its cup.
 *
 * After release the ball and the targets are rigid bodies of one native
 * simulation, so the ball rolls on the real surface, strikes targets that
 * then strike each other, and drops through any opening the surface leaves.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the release clock, duration, rigid placements, initial velocity and solver floor.
 * @evidence contracts/development/design.md#principled-representation One rigid profile and world placement per object. The ball adds its velocity from the displayed release.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The input to bakePrecisionDeck; physical bodies, floor bounds and playback retain their shared contracts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Actor motion stays outside the physical deck solve. The ball and each target keep their own stable scene identity.
 */
export interface IAutoMovieMotionHumanPrecisionDeck {
  /** Film second that transfers custody of the ball from the performer's release. */
  release: number;

  /** Simulated seconds from release through the chosen result, in whole intervals at 120 Hz. */
  duration: number;

  /** Positive safe-integer budget on the number of 120 Hz intervals before allocation. */
  maximumSteps: number;

  /** The fixed playing surface, such as a lane with gutters, a table or a green, in the shot's world frame. */
  surface: IAutoMovieMotionHumanPrecisionDeck.IRigid;

  /** The ball pose and linear velocity in world metres and m/s from the displayed release. */
  ball: IAutoMovieMotionHumanPrecisionDeck.IBall;

  /** Loose targets at rest at their placed poses: pins or object balls. */
  targets: readonly IAutoMovieMotionHumanPrecisionDeck.IRigid[];

  /** Backup floor top in world metres, below the modeled surface. */
  floor: number;

  /** Finite native support domain for the complete simulated result. */
  floorBounds: IAutoMoviePhysicalSimulationInput.IInput["floorBounds"];
}

/**
 * Placements and replay for the precision deck.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines rigid scene identities and film time versus solver-local playback.
 * @evidence contracts/development/design.md#principled-representation The result retains the original replay cache and reports the ball's first target contact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Companion records for bakePrecisionDeck. The shared cache supplies all ball and target poses; sport credits read it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No synthetic target animation or score is included.
 */
export namespace IAutoMovieMotionHumanPrecisionDeck {
  /**
   * One placed rigid body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States identity, one-segment physics and world placement.
   * @evidence contracts/development/design.md#principled-representation Uses the profile's sole root segment as the rigid object.
   * @evidence contracts/development/design.md#minimal-and-owned-surface bakePrecisionDeck prepares the shared native solver's authored frames from this record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Rigid means exactly one segment. The world pose is the segment origin, not its centre of mass.
   */
  export interface IRigid {
    /** Scene object identity, shared with the authored shot. */
    id: string;

    /** A single-segment physical profile of the displayed object. */
    profile: IAutoMoviePhysicalProfile;

    /** World pose of the segment origin, in metres with unit rotation. */
    pose: IAutoMovieRigidTransform;
  }

  /**
   * The released ball.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Adds the world linear velocity at release, m/s, to the placed rigid ball.
   * @evidence contracts/development/design.md#principled-representation The release velocity comes from the performer's displayed flight, so the solver continues the same ball.
   * @evidence contracts/development/design.md#minimal-and-owned-surface bakePrecisionDeck reads the velocity for the first solver interval only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Spin is not authored; surface contact develops it.
   */
  export interface IBall extends IRigid {
    /** World linear velocity at release, m/s. */
    velocity: IAutoMovieVector3;
  }

  /**
   * The ball's first target impact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the struck target and the film second of its first positive solver impulse.
   * @evidence contracts/development/design.md#principled-representation Film seconds are the release plus the cache's local receipt time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by callers that cut or cue on the impact.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent for a miss rather than encoded by a sentinel.
   */
  export interface ITargetContact {
    /** The target's scene object identity. */
    id: string;

    /** Film second of the first witnessed impulse. */
    seconds: number;
  }

  /**
   * A pocket mouth of a cue table or the cup of a green.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the pocket and its mouth centre at bed height, world metres.
   * @evidence contracts/development/design.md#principled-representation The mouth point's height is the bed plane a pocketed ball falls below.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by pocketedBalls; a table's pocket sockets or a green's cup supply it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The opening itself is the surface's geometry; this point only names which mouth a ball fell through.
   */
  export interface IPocket {
    /** The pocket's affordance identity. */
    id: string;

    /** The mouth centre on the bed plane, world metres. */
    point: IAutoMovieVector3;

    /** Plan radius around the mouth centre within which a ball falling below the bed is in this pocket, metres. */
    reach: number;
  }

  /**
   * A ball credited to a pocket.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the ball, the pocket and the film second it fell wholly below the bed.
   * @evidence contracts/development/design.md#principled-representation Film seconds are the release plus a cache frame time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by pocketedBalls.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A ball still on the bed at the cache end is absent, not credited to a sentinel pocket.
   */
  export interface IPocketed {
    /** The ball's scene object identity. */
    ball: string;

    /** The pocket it fell through. */
    pocket: string;

    /** Film second of the first cache frame with the whole ball below the bed. */
    seconds: number;
  }

  /**
   * The baked deck result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the release offset, local replay and the optional first ball-to-target contact.
   * @evidence contracts/development/design.md#principled-representation Each body is read as cache.at(filmSeconds - release); the cache's solver receipts hold every later contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses the shared collision and replay owners; consumers continue or cut the motion and credit the sport's result from the cache.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A miss leaves firstTarget absent. No continuous-time impact beyond the solver receipt is inferred.
   */
  export interface IResult {
    /** Film second corresponding to the physics cache's zero. */
    release: number;

    /** Completed poses and contact receipts, on the local clock after release. */
    cache: IAutoMoviePhysicsCache;

    /** First target receiving a positive impulse from the ball, when any is contacted. */
    firstTarget?: IAutoMovieMotionHumanPrecisionDeck.ITargetContact;
  }
}
