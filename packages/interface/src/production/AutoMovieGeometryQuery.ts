import { AutoMovieFilmTime } from "./AutoMovieFilmTime";
import { IAutoMovieGeometrySelector } from "./IAutoMovieGeometrySelector";

/**
 * One bounded geometry question over the current compiled production. Shot times are finite nonnegative seconds; ambiguous recurring actors require an explicit shot. Camera answers project roots and do not prove pixel visibility.
 *
 * @evidence contracts/common.md#principled-implementation Query-discriminated operands select distance, rig reach, resolved pose, ground, formation, effect, exact film time or camera projection; the production oracle establishes compile freshness before measureAutoMovieGeometry resolves their current records.
 * @evidence contracts/common.md#clear-and-simple-design Each arm carries only its question's selectors and time, keeping render capture separate from numerical geometry; optional shot identity disambiguates actors without making every world query name a shot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale compile, missing selector or ambiguous actor is refused rather than measured from a guessed shot; camera root projection is not presented as an occlusion measurement.
 * @evidence contracts/common.md#meaningful-documentation Gives each query's operands, shot-local second units and default times, exact global frame input, actor disambiguation and the root-projection visibility limitation.
 */
export type AutoMovieGeometryQuery =
  | {
      /** Distance query. */
      query: "distance";

      /** First selector. */
      from: IAutoMovieGeometrySelector;

      /** Second selector. */
      to: IAutoMovieGeometrySelector;

      /** Optional shot that disambiguates recurring actors. */
      shot?: string;

      /** Optional shot-local sample time, zero by default. */
      time?: number;
    }
  | {
      /** Reachability query. */
      query: "reach";

      /** Actor id. */
      actor: string;

      /** Optional shot that disambiguates actors appearing more than once. */
      shot?: string;

      /** Target selector. */
      target: IAutoMovieGeometrySelector;

      /** Optional shot time in seconds. */
      time?: number;
    }
  | {
      /** Resolved pose query. */
      query: "pose";

      /** Actor id. */
      actor: string;

      /** Optional shot id. */
      shot?: string;

      /** Time in seconds. */
      time: number;
    }
  | {
      /** World-ground query. */
      query: "ground";

      /** Horizontal world point. */
      point: {
        /** World X in meters. */
        x: number;

        /** World Z in meters. */
        z: number;
      };
    }
  | {
      /** Compact formation bounds, budget, representative and LOD query. */
      query: "formation";

      /** Formation id. */
      formation: string;

      /** Optional participating shot used for camera-distance LOD summary. */
      shot?: string;

      /** Optional shot-local sample time, zero by default. */
      time?: number;
    }
  | {
      /** Bounded deterministic effect activity and visibility-risk query. */
      query: "effect";

      /** Existing world effect-zone id. */
      zone: string;

      /** Participating compiled shot id. */
      shot: string;

      /** Shot-local sample time. */
      time: number;

      /** Optional compiled scene-node ids tested against the zone. */
      subjects?: string[];
    }
  | {
      /** Resolve one film-global frame through the canonical edit timeline. */
      query: "film-time";

      /** Exact global frame or frame-grid second. */
      at: AutoMovieFilmTime;
    }
  | {
      /**
       * Camera root-point projection query; pixel occlusion remains a frame-review concern.
       */
      query: "camera";

      /** Shot id. */
      shot: string;

      /** Time in seconds. */
      time: number;

      /** Unique compiled scene-node ids whose animated roots are projected. */
      subjects: string[];
    };
