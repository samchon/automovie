import type {
  IAutoMovieHumanSkeleton,
  IAutoMoviePolygonBodyCue,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Actual Three drawing handles for the original polygon mannequin. Inputs use
 * the canonical Human skeleton bone and placement contracts directly.
 *
 * The mannequin stays deliberately simple: a fix corrects a wrong value within
 * the same primitives and segment count, never adds geometry, detail or
 * realism, because its job is a cheap, deterministic silhouette for motion
 * checks and diffusion hints.
 */
export namespace AutoMovieHumanPolygon {
  /** Source-clock readers and authored cues for one actor's visible drawing. */
  export interface IPresentation {
    /** Exact staged actor identity. Only matching cues apply to this drawing. */
    subject: string;

    /**
     * Cues in shot-local source seconds. Selected bone subtrees must be
     * disjoint.
     */
    cues: readonly IAutoMoviePolygonBodyCue[];

    /**
     * Read the complete deterministic pose in Human body coordinates at
     * shot-local source seconds.
     */
    poseAt: (seconds: number) => Pick<IAutoMovieHumanSkeleton.IOutput, "posed">;

    /**
     * Read the actor-local to shot-world rigid frame at shot-local source
     * seconds. Omission means identity. The host applies this frame through the
     * drawing's parent.
     */
    actorFrameAt?: (seconds: number) => IAutoMovieRigidTransform;
  }

  /** Actual rigid polygon drawing and its owned resource lifetime. */
  export interface IDrawing {
    /** Actor-local root; the host applies actor placement through its parent. */
    object: THREE.Group;

    /** Flat rigid surface modules, individually bound by evaluator bone id. */
    surface: THREE.Group;

    /** Matching construction diagnostics; initially hidden. */
    sections: THREE.Group;

    /** Actual surface mesh by emitted bone identity, stable until disposal. */
    parts: ReadonlyMap<string, THREE.Mesh>;

    /**
     * Actual surface group by emitted bone identity; owns that bone-local
     * frame.
     */
    bones: ReadonlyMap<string, THREE.Group>;

    /** Surface and diagnostic groups sharing each emitted bone placement. */
    bindings: ReadonlyMap<string, readonly THREE.Object3D[]>;

    /** Actual head group and its emitted, unposed local polygon extent. */
    head: {
      /** Attach a separately owned face or equipment in head-local metres. */
      object: THREE.Group;

      /** Minimum actual local polygon coordinate, metres. */
      min: [number, number, number];

      /** Maximum actual local polygon coordinate, metres. */
      max: [number, number, number];

      /** Frontmost local triangle X at Y/Z, undefined outside the silhouette. */
      frontAt: (y: number, z: number) => number | undefined;
    };

    /**
     * Apply an admitted complete pose to existing polygon groups and refresh
     * world matrices.
     */
    setPose: (output: Pick<IAutoMovieHumanSkeleton.IOutput, "posed">) => void;

    /**
     * Draw the source pose with authored polygon cues at the given shot-local
     * seconds. Present when the drawing was built with a presentation.
     */
    drawAt?: (seconds: number) => void;

    /**
     * Replace emitted-part RGB overrides; undefined restores the borrowed clay
     * material.
     */
    setPartColors: (colors?: Readonly<Record<string, number>>) => void;

    /**
     * Attempt retirement of owned drawing resources once; attached faces remain
     * caller-owned.
     */
    dispose: () => void;
  }
}
