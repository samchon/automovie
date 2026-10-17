import type { AutoMovieTextureBinding } from "@automovie/interface";
import type { readAutoMovieTextureSource } from "@automovie/viewer";

import type { setHumanViewerRelief } from "./setHumanViewerRelief";

/**
 * Current accepted person's actual decoded/configured texture observations.
 *
 * These are CPU material and compile-callback facts, not GPU residency, visible sample counts, optical calibration, or an anatomical appearance judgment.
 *
 * @evidence contracts/common.md#principled-implementation Carries the actual material/texture reader's scalar facts with the accepted generation and completion state.
 * @evidence contracts/common.md#clear-and-simple-design One copied current record separates declared occurrences, resolver issuance and actual material slots.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not equate UUID labels, decoded assets or metadata relief flags with native sampling or appearance.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish pending/failure from readiness and state the narrower CPU/shader observation scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record does not perform decoding, material construction or drawing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record owns no cache; the page correlates it with the exact accepted object.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only copied documents and scalar source facts are returned; texture/cache/material handles stay with their existing owners.
 *
 * @author Samchon
 */
export interface IHumanViewerTextureState {
  /** Monotone page-local accepted display generation, not a content hash. */
  generation: number;

  /** Readiness of this person's original texture transaction. */
  status: "pending" | "ready" | "failed" | "closed";

  /** Authored non-null binding occurrences, including unused material declarations. */
  declaredOccurrences: number;

  /** Successfully issued wrappers from real cache resolver calls, including an attempt that later fails to build. */
  resolvedOccurrences: number;

  /** Current transaction failure text; null on pending/ready. */
  error: string | null;

  /** Actual built surface materials, including ones temporarily substituted for a display mode. */
  materials: {
    /** Authored part ids using this same material object. */
    parts: string[];

    /** Actual material object's UUID, a label rather than a content identity. */
    material: string;

    /** Whether at least one current mesh assigns this surface material; ignores mesh/ancestor visibility, occlusion and actual draw. */
    active: boolean;

    /** Authored base scale; toggling final relief does not edit it. */
    normalScale: [number, number] | null;

    /** Actual owned relief uniform and callback state, when registered. */
    relief: ReturnType<typeof setHumanViewerRelief.read>;

    /** Existing actual slots; shared wrappers may occur in more than one role. */
    bindings: {
      /** Native or feature-specific material slot. */
      slot: string;

      /** Carried asset id when this wrapper came from the real page resolver. */
      asset: string | null;

      /** Same real resolver request, copied after construction; null for internal fallback maps. */
      declared: AutoMovieTextureBinding | null;

      /** Existing public observer's actual decoded/source/allocation facts. */
      source: ReturnType<typeof readAutoMovieTextureSource>;

      /** Actual texture UV channel. */
      texCoord: number;

      /** Actual Three color-space declaration. */
      colorSpace: string;

      /** Current binding transform, with radians for rotation. */
      transform: {
        offset: [number, number];
        repeat: [number, number];
        rotation: number;
      };
    }[];
  }[];
}
