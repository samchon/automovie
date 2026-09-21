import { AutoMovieFilmTime } from "./AutoMovieFilmTime";
import { IAutoMovieGeometrySelector } from "./IAutoMovieGeometrySelector";

/**
 * One compact query over the current compiled production.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `AutoMovieGeometryQuery` as the portable data boundary for the agent contract guidance requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `AutoMovieGeometryQuery` for the spec authoring knowledge request output system contract.
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
       * Camera root-point projection query; pixel occlusion remains a
       * frame-review concern.
       */
      query: "camera";

      /** Shot id. */
      shot: string;

      /** Time in seconds. */
      time: number;

      /** Unique compiled scene-node ids whose animated roots are projected. */
      subjects: string[];
    };
