import { Aftermath } from "../bout/Aftermath";
import { Blocking } from "../bout/Blocking";
import { Ease } from "../rig/Ease";
import { Vec3 } from "../rig/Vec3";

/**
 * Film-wide clock, event vocabulary and the delivered camera.
 *
 * @evidence contracts/common.md#implementation-and-ownership One immutable namespace shared by the Viewer, the soundtrack and export. The camera is closed-form in film time (it follows the smoothed ring geography, never the fighters' instantaneous positions), so seek, playback and capture frame identically.
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
    /** Stable cue identity shared by Viewer and export. */ id: string;
    /** Film second. */ seconds: number;
    /** Kind of cue. */ kind:
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
    /** Acting performer. */ actorId: ActorId;
    /** Receiving performer. */ targetId?: ActorId;
    /** Exact action identity. */ actionId?: string;
    /** Requested contact relation; the measured receipt must agree. */ relation?:
      | "guard"
      | "body"
      | "head"
      | "shin-check";
    /** Spoken count in [1, 10]. */ count?: number;
    /** Referee phrase. */ speech?: "fight" | "down" | "neutral" | "decision";
    /** Audible window, seconds. */ durationSeconds?: number;
    /** Action whose measured contact gates this cue. */ requiresContact?: string;
  }

  /**
   * The delivered physical camera.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain camera record.
   * @evidence contracts/common.md#authoring-interface World metres; vertical field of view in degrees.
   */
  export interface Camera {
    /** Edit identity. */ shotId: string;
    /** World camera centre, metres. */ position: [number, number, number];
    /** World look-at point, metres. */ target: [number, number, number];
    /** Vertical field of view, degrees. */ fovDegrees: number;
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
   * @evidence contracts/common.md#implementation-and-ownership During the bout the camera stands on A's left of the fighting axis (the same side throughout), 5.1 m out and 1.9 m up, looking at the pair centre; it drifts slowly along that side. From 143 s it eases into a fixed wide view that holds the kick, fall, neutral corner, count and celebration without a cut.
   * @evidence contracts/common.md#authoring-interface Finite seconds in [0, 180]; returns a fresh camera.
   */
  export function camera(seconds: number): Camera {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > duration)
      throw new Error("Camera time is outside the film");
    const [cx, cz, axis] = Blocking.geography(Math.min(seconds, koSeconds));
    const side: Vec3.Value = Vec3.rotateY([0, 0, 1], axis);
    const along: Vec3.Value = Vec3.rotateY([1, 0, 0], axis);
    const drift: number = 0.45 * Math.sin(seconds / 17);
    const bout: { position: Vec3.Value; target: Vec3.Value } = {
      position: Vec3.add(
        [cx, 2.55, cz],
        Vec3.add(Vec3.scale(side, 4.7), Vec3.scale(along, 0.35 + drift)),
      ),
      target: [cx, 0.98, cz],
    };

    // Wide view framed on the fallen fighter and the neutral corner (owned by the aftermath).
    const wide: { position: Vec3.Value; target: Vec3.Value } =
      Aftermath.wideCamera;
    const k: number = Ease.smoother((seconds - 143) / 6);
    return {
      shotId:
        seconds < 143 ? "ringside-continuous" : "knockout-and-count-unbroken",
      position: [...Vec3.lerp(bout.position, wide.position, k)] as [
        number,
        number,
        number,
      ],
      target: [...Vec3.lerp(bout.target, wide.target, k)] as [
        number,
        number,
        number,
      ],
      fovDegrees: Ease.lerp(42, 50, k),
    };
  }
}
