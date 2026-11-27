import type {
  IAutoMovieHumanSkeleton,
  IAutoMoviePolygonBodyCue,
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionRenderLayer,
  IAutoMovieRigidTransform,
  IAutoMovieShot,
} from "@automovie/interface";
import type * as THREE from "three";
import type { AutoMovieRenderHumanCartoon } from "./AutoMovieRenderHumanCartoon";
import { buildHumanPolygon as buildHumanPolygonImplementation } from "./human-polygon/internal/buildHumanPolygon";
import { buildPolygonShotActor as buildPolygonShotActorImplementation } from "./human-polygon/internal/buildPolygonShotActor";
import { createHumanPolygonFigure as createFigureImplementation } from "./human-polygon/internal/createHumanPolygonFigure";

/**
 * Actual Three drawing handles for the original polygon mannequin. Inputs use
 * the canonical Human skeleton bone and placement contracts directly.
 *
 * The mannequin stays deliberately simple: a fix corrects a wrong value within
 * the same primitives and segment count, never adds geometry, detail or
 * realism, because its job is a cheap, deterministic silhouette for motion
 * checks and diffusion hints.
 */
export namespace AutoMovieRenderHumanPolygon {
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
    head: IDrawingHead;

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

  /** The head object of {@link IDrawing}. */
  export type IDrawingHead = {
    /** Attach a separately owned face or equipment in head-local metres. */
    object: THREE.Group;

    /** Minimum actual local polygon coordinate, metres. */
    min: [number, number, number];

    /** Maximum actual local polygon coordinate, metres. */
    max: [number, number, number];

    /** Frontmost local triangle X at Y/Z, undefined outside the silhouette. */
    frontAt: (y: number, z: number) => number | undefined;
  };

  /** Display colours and optional source-clock pose presentation. */
  export interface IBuildOptions {
  /** RGB hex overrides keyed by emitted bone name; omitted parts retain clay. */
    partColors?: Readonly<Record<string, number>>;
  /** Source pose, actor frame and authored polygon cues for time-based drawing. */
    presentation?: IPresentation;
  }

  /** Inputs for building and sampling one polygon actor within a compiled shot. */
  export interface IBuildShotActorProps {
  /** Compiled shot and its optional body presentation cues. */
    shot: Pick<IAutoMovieShot, "id" | "polygonBodyCues">;
  /** Staged actor id. */
    subject: string;
  /** Bind bones and placements used to build the polygon drawing. */
    opening: Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">;
  /** Canonical body-frame pose at a shot-local time. */
    poseAt: (seconds: number) => Pick<IAutoMovieHumanSkeleton.IOutput, "posed">;
  /** Deterministic actor rigid frame at shot-local time in scene-world axes. */
    actorFrameAt?: (seconds: number) => IAutoMovieRigidTransform;
  /** Production frame grid used by the layer's source frame. */
    frameRate: IAutoMovieProductionFrameRate;
  /** Optional palette by emitted bone name. */
    partColors?: Readonly<Record<string, number>>;
  }

  /** Polygon drawing and layer sampler for a compiled shot. */
  export interface IShotActor {
  /** Drawing to mount in the shot scene and dispose when finished. */
    drawing: IDrawing;
  /** Evaluate the visible actor for an admitted render layer of this shot. */
    drawLayer: (layer: IAutoMovieProductionRenderLayer) => void;
  }

  /** Input needed to create a posed polygon figure. */
  export interface ICreateFigureProps {
  /** Evaluate a pose to rest bones and placements; called once with neutral. */
    evaluate: (
      pose: Readonly<Record<string, never>>,
    ) => Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">;
  /** RGB overrides by emitted bone. */
    partColors?: Readonly<Record<string, number>>;
  }

  /** A posed polygon figure and its owned face/drawing lifecycle. */
  export interface IFigure {
  /** The figure's root; the host places the actor through its parent. */
    readonly object: THREE.Group;
  /** The underlying drawing, for colours, bone groups and attachments. */
    readonly drawing: IDrawing;
  /** Requested face fields outside the cartoon's supported subset. */
    unsupported: readonly string[];
  /** Apply an evaluated pose and the face for a head pose and expression. */
    place(
      output: Pick<Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">, "posed">,
      head?: AutoMovieRenderHumanCartoon.IHeadPose,
      expression?: AutoMovieRenderHumanCartoon.IExpression,
    ): void;
  /** Release the face and drawing once; later `place` calls throw. */
    dispose(): void;
  }

  /**
   * Draw a rigid polygon blockout from the generated skeleton, in metres.
   *
   * Every module is procedural and comes from the skeleton alone: joint
   * positions, tips and skin girth radii, never the Human's skin surfaces, so the
   * polygon figure keeps working however the realistic skin is built. The
   * engine's `resolveHumanoidRingModules` owns the rings and their
   * points, which the physical profile also takes its colliders from. Modules use
   * eight-sided sections at their selected levels. Joint spans set torso, palm
   * and foot breadth; girth radii set thickness; the neck runs from the neck
   * joint to the head joint and the head closes on the head's tip. Each
   * rest-space module is moved once by its bone's world placement. Adjacent rigid
   * modules can overlap or separate when posed; this is not skin binding or a
   * watertight skin.
   *
   * The blockout stays deliberately simple: a fix corrects a wrong value (a
   * radius, a length, a frame) within the same primitives and section count,
   * never adds geometry, smoothing, anatomy or realism, because its job is a
   * cheap, deterministic silhouette for motion checks and diffusion hints.
   *
   * The head attachment uses the head joint's rest axes: +X forward, +Y up and +Z
   * left. Its bounds describe the emitted polygon, before the posed transform.
   * The caller may attach a face to `head.object` in that same local frame.
   *
   * @param output Generated bones and placements.
   * @param options Optional display colours keyed by emitted bone name and
   *   authored cues sampled on the shot-local source clock.
   * @returns Owned surface, actual bone/mesh registries, pose/palette ports,
   *   generating sections, head attachment and cleanup. Local probe points use
   *   registered rest point minus the corresponding rest joint; actor-root
   *   placement belongs to the parent.
   */
  export function build(
    output: Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">,
    options: IBuildOptions = {},
  ): IDrawing {
    return buildHumanPolygonImplementation(output, options);
  }

  /**
   * Build a polygon actor and its source-frame sampler for a compiled shot. A
   * film host mounts the drawing in the shot scene and supplies `drawLayer` as a
   * layer preparation callback. Its source frame accounts for cuts and trims. If
   * an actor frame is supplied, the sampler also places the drawing at that world
   * frame under its rigid parent. Without a supplied frame the cue's shot axes
   * coincide with the drawing's axes at the origin. Dispose the drawing with the
   * usual polygon drawing owner.
   */
  export function buildShotActor(input: IBuildShotActorProps): IShotActor {
    return buildPolygonShotActorImplementation(input);
  }

  /**
   * A posed polygon figure with its cartoon face: the original polygon drawing
   * ({@link AutoMovieRenderHumanPolygon.build}) built once from the evaluator's neutral output,
   * and a face ({@link AutoMovieRenderHumanCartoon.buildFace}) on its actual head front.
   *
   * `place` applies an evaluated pose to the existing groups and rebuilds the
   * face only when the head pose or expression changes by value, disposing the
   * previous face, so a held expression costs no geometry. The evaluator is a
   * structural function (a Human skeleton evaluator fits); the Viewer imports no
   * figure generator.
   *
   * The figure stays deliberately simple: a fix corrects a wrong value within the
   * same primitives, never adds geometry, detail or realism, because its job is a
   * cheap, deterministic silhouette for motion checks and diffusion hints.
   *
   * @returns The figure's root object, its drawing, the pose port and disposal.
   */
  export function createFigure(input: ICreateFigureProps): IFigure {
    return createFigureImplementation(input);
  }
}
