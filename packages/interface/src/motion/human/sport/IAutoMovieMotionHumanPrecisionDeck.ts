import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "../../../physics/IAutoMoviePhysicalProfile";
import type { IAutoMoviePhysicalSimulationInput } from "../../../physics/IAutoMoviePhysicalSimulationInput";
import type { IAutoMoviePhysicsCache } from "../../../physics/IAutoMoviePhysicsCache";

/**
 * The playing surface, released ball and loose targets of one precision
 * delivery: a bowling lane and its pins, a cue table and its object balls, a
 * putting green and its cup.
 *
 * After release the ball and the targets are rigid bodies of one native
 * simulation, so the ball rolls on the real surface, strikes targets that then
 * strike each other, and drops through any opening the surface leaves.
 */
export interface IAutoMovieMotionHumanPrecisionDeck {
  /**
   * Film second that transfers custody of the ball from the performer's
   * release.
   */
  release: number;

  /**
   * Simulated seconds from release through the chosen result, in whole
   * intervals at 120 Hz.
   */
  duration: number;

  /**
   * Positive safe-integer budget on the number of 120 Hz intervals before
   * allocation.
   */
  maximumSteps: number;

  /**
   * The fixed playing surface, such as a lane with gutters, a table or a green,
   * in the shot's world frame.
   */
  surface: IAutoMovieMotionHumanPrecisionDeck.IRigid;

  /**
   * The ball pose and linear velocity in world metres and m/s from the
   * displayed release.
   */
  ball: IAutoMovieMotionHumanPrecisionDeck.IBall;

  /** Loose targets at rest at their placed poses: pins or object balls. */
  targets: readonly IAutoMovieMotionHumanPrecisionDeck.IRigid[];

  /** Backup floor top in world metres, below the modeled surface. */
  floor: number;

  /** Finite native support domain for the complete simulated result. */
  floorBounds: IAutoMoviePhysicalSimulationInput.IInput["floorBounds"];
}

/** Placements and replay for the precision deck. */
export namespace IAutoMovieMotionHumanPrecisionDeck {
  /** One placed rigid body. */
  export interface IRigid {
    /** Scene object identity, shared with the authored shot. */
    id: string;

    /** A single-segment physical profile of the displayed object. */
    profile: IAutoMoviePhysicalProfile;

    /** World pose of the segment origin, in metres with unit rotation. */
    pose: IAutoMovieRigidTransform;
  }

  /** The released ball. */
  export interface IBall extends IRigid {
    /** World linear velocity at release, m/s. */
    velocity: IAutoMovieVector3;
  }

  /** The ball's first target impact. */
  export interface ITargetContact {
    /** The target's scene object identity. */
    id: string;

    /** Film second of the first witnessed impulse. */
    seconds: number;
  }

  /** A pocket mouth of a cue table or the cup of a green. */
  export interface IPocket {
    /** The pocket's affordance identity. */
    id: string;

    /** The mouth centre on the bed plane, world metres. */
    point: IAutoMovieVector3;

    /**
     * Plan radius around the mouth centre within which a ball falling below the
     * bed is in this pocket, metres.
     */
    reach: number;
  }

  /** A ball credited to a pocket. */
  export interface IPocketed {
    /** The ball's scene object identity. */
    ball: string;

    /** The pocket it fell through. */
    pocket: string;

    /** Film second of the first cache frame with the whole ball below the bed. */
    seconds: number;
  }

  /** The baked deck result. */
  export interface IResult {
    /** Film second corresponding to the physics cache's zero. */
    release: number;

    /** Completed poses and contact receipts, on the local clock after release. */
    cache: IAutoMoviePhysicsCache;

    /**
     * First target receiving a positive impulse from the ball, when any is
     * contacted.
     */
    firstTarget?: IAutoMovieMotionHumanPrecisionDeck.ITargetContact;
  }
}
