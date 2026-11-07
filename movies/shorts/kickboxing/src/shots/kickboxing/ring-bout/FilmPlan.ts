import { AutoMovieEnvelope as Ease } from "@automovie/engine";

import { Aftermath } from "../../../motion/reactions/Aftermath";
import { FilmVector as Vec3 } from "../../../motion/rig/FilmVector";
import { BoutCamera } from "./BoutCamera";
import { BoutScript } from "./BoutScript";

/**
 * Film-wide clock, event vocabulary and the delivered camera.
 *
 * @evidence contracts/common.md#implementation-and-ownership One immutable namespace shared by the Viewer, the soundtrack and export. The bout camera is a precomputed relational operator (BoutCamera) sampled by film time, so seek, playback and capture frame identically.
 * @evidence contracts/common.md#authoring-interface Seconds on the film clock, 30 output frames per second, world metres with +Y up. The bout's exchanges live in BoutScript; this namespace owns only timing constants, the event shape and the camera.
 */
export namespace FilmPlan {
  /** Delivered duration, seconds. */
  export const duration: number = 180;

  /** Output frame rate. */
  export const fps: number = 30;

  /** Output frame count. */
  export const frames: number = 5400;

  /** Contact of the finishing kick. */
  export const koSeconds: number = 150;

  /** The referee opens the count once A is in the neutral corner. */
  export const countStart: number = 157;

  /** The tenth second expires. */
  export const countEnd: number = 167;

  /** The referee waves the contest off. */
  export const decisionSeconds: number = 167.6;

  /** A's celebration begins. */
  export const celebrationSeconds: number = 168.1;

  /** The camera finishes widening into the knockout view. */
  const WIDENED: number = 151;

  /** The match-ending bell. */
  export const endBellSeconds: number = 170.1;

  /**
   * Performer identity.
   *
   * @evidence contracts/common.md#implementation-and-ownership Closed performer identity shared by audio and runtime.
   * @evidence contracts/common.md#authoring-interface Fighters and the referee.
   */
  export type ActorId = "a" | "b" | "referee";

  /**
   * One audible or visible consequence on the film clock.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain cue record consumed by AudioMix.
   * @evidence contracts/common.md#authoring-interface Film seconds; optional fields depend on the kind.
   */
  export interface Event {
    /** Stable cue identity shared by Viewer and export. */
    id: string;
    /** Film second. */
    seconds: number;
    /** Kind of cue. */
    kind:
      | "bell"
      | "touch"
      | "attempt"
      | "contact"
      | "miss"
      | "step"
      | "count"
      | "decision"
      | "celebration"
      | "speech"
      | "fall"
      | "ambience"
      | "breath";
    /** Acting performer. */
    actorId: ActorId;
    /** Receiving performer. */
    targetId?: ActorId;
    /** Exact action identity. */
    actionId?: string;
    /** Requested contact relation; the measured receipt must agree. */
    relation?: "guard" | "body" | "head" | "shin-check";
    /** Spoken count in [1, 10]. */
    count?: number;
    /** Referee phrase. */
    speech?: "fight" | "down" | "neutral" | "decision";
    /** Audible window, seconds. */
    durationSeconds?: number;
    /** Action whose measured contact gates this cue. */
    requiresContact?: string;
    /** Actual foot/floor arrival and its control owner; geometric arrivals carry no solved impulse claim. */
    footfall?: {
      source: "solver" | "geometric";
      ownership: "authored" | "return" | "dynamic";
      /** Absolute actual measurement/landing time used by the authoritative ownership sampler. */ ownershipSeconds: number;
      bone: string;
      contactSeconds: number;
      confirmedSeconds: number;
      receiptIds: string[];
      /** Exact substep confirmation, when a recovery landed inside the receipt's containing cache interval. */ recoverySeconds?: number;
    };
  }

  /**
   * The delivered physical camera.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain camera record.
   * @evidence contracts/common.md#authoring-interface World metres; vertical field of view in degrees.
   */
  export interface Camera {
    /** Edit identity. */
    shotId: string;
    /** World camera centre, metres. */
    position: [number, number, number];
    /** World look-at point, metres. */
    target: [number, number, number];
    /** Vertical field of view, degrees. */
    fovDegrees: number;
  }

  /**
   * Map an output frame index to film seconds.
   *
   * @evidence contracts/common.md#implementation-and-ownership Integer frame divided once by the frame rate, so no drift accumulates.
   * @evidence contracts/common.md#authoring-interface Throws outside [0, 5399].
   */
  export function frameSeconds(index: number): number {
    if (!Number.isInteger(index) || index < 0 || index >= frames)
      throw new Error("Film frame index must be an integer in [0,5399]");
    return index / fps;
  }

  /**
   * The delivered camera at a film second.
   *
   * @evidence contracts/common.md#implementation-and-ownership During the bout BoutCamera keeps a side view of both fighters from across their line opposite the referee, wide while they reset, medium while an exchange is live and pushed in on clean landings, orbiting and following with operator lag inside the ropes. From 143 s it eases over eight seconds into the aftermath's side-on view, which holds the kick, fall, neutral corner, count and celebration without a cut. Every clean landing jolts the view with a damped shake of at most a few centimetres for 0.3 s.
   * @evidence contracts/common.md#authoring-interface Finite seconds in [0, 180]; returns a fresh camera.
   */
  export function camera(seconds: number): Camera {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > duration)
      throw new Error("Camera time is outside the film");
    // The relational bout camera until the widening completes.
    const live: BoutCamera.IState = BoutCamera.at(Math.min(seconds, WIDENED), WIDENED);
    const bout: { position: Vec3.Value; target: Vec3.Value } = {
      position: live.position,
      target: live.target,
    };

    // Side-on view of the fallen fighter and the neutral corner (owned by the aftermath).
    const wide: { position: Vec3.Value; target: Vec3.Value } =
      Aftermath.wideCamera;
    const k: number = Ease.smoother((seconds - 143) / 8);

    // A clean blow jolts the whole view for a quarter second: a damped vertical
    // shake scaled by the blow (jab lightest, kicks heavier, the knockout most).
    let jolt: number = 0;
    for (const action of BoutScript.actions) {
      const tau: number = seconds - action.at;
      if (action.defense !== "hit" || tau < 0 || tau > 0.3) continue;
      const power: number =
        action === BoutScript.finish
          ? 2.5
          : BoutScript.specs[action.technique].limb === "leg"
            ? 1.4
            : BoutScript.specs[action.technique].windup <= BoutScript.specs.jab.windup
              ? 0.5
              : 1;
      jolt += power * Math.exp(-tau / 0.07) * Math.sin(2 * Math.PI * 16 * tau);
    }
    const shake: Vec3.Value = [0, 0.012 * jolt, 0];
    return {
      shotId:
        seconds < 143 ? `ringside-${live.size}` : "knockout-and-count-unbroken",
      position: [
        ...Vec3.add(Vec3.lerp(bout.position, wide.position, k), shake),
      ] as [number, number, number],
      target: [...Vec3.add(Vec3.lerp(bout.target, wide.target, k), shake)] as [
        number,
        number,
        number,
      ],
      fovDegrees: Ease.lerp(live.fov, 62, k),
    };
  }
}
