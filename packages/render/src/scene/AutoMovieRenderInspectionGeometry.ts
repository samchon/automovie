import type { IAutoMovieRenderInspectionMeasured } from "./IAutoMovieRenderInspectionMeasured.js";
import type * as THREE from "three";
import { measureAutoMovieInspectionDefectsImplementation } from "./inspection/internal/measureAutoMovieInspectionDefectsImplementation.js";
import { measureAutoMovieInspectionMeshesImplementation } from "./inspection/internal/measureAutoMovieInspectionMeshesImplementation.js";
import type { IAutoMovieRenderViewerSubjectBounds } from "./IAutoMovieRenderViewerSubjectBounds.js";
import type {
  IAutoMovieInspectionDrawable,
  IAutoMovieMark,
  IAutoMovieMeshDefect,
} from "@automovie/interface";
import type { IAutoMovieRenderInspectionPath } from "./IAutoMovieRenderInspectionPath.js";

import { measureAutoMovieInspectionBounds as measureBoundsImplementation } from "./inspection/internal/measureAutoMovieInspectionBounds.js";
import { collectAutoMovieCollisionParts as collectCollisionPartsImplementation } from "./inspection/internal/collectAutoMovieCollisionParts.js";
import { measureAutoMovieInspectionEdges as measureEdgesImplementation } from "./inspection/internal/measureAutoMovieInspectionEdges.js";
import { measureAutoMovieInspectionPaths as measurePathsImplementation } from "./inspection/internal/measureAutoMovieInspectionPaths.js";

/** Public operations for Auto Movie Render Inspection Geometry. */
export namespace AutoMovieRenderInspectionGeometry {
  /** Inputs for measuring drawn object and mark bounds by inspection path. */
  export interface IMeasurePathsProps {
    /** Drawn objects with their paths. */
    objects: readonly IAutoMovieRenderInspectionPath[];
    /** Drawn marks with their anchor, or null for world space. */
    marks: readonly { mark: IAutoMovieMark; anchor: THREE.Object3D | null }[];
    /** Whether a path is measured. */
    choose: (path: string) => boolean;
  }
  /** One source-owned layer, after its exact placement and world-matrix update. */
  export type ILayer = collectCollisionPartsImplementation.ILayer;
  /** Drawn world surface of one part. */
  export type ISurface = collectCollisionPartsImplementation.ISurface;
  /** A lazily posed surface and the part of it a collision part owns. */
  export type IPartSurface = collectCollisionPartsImplementation.IPartSurface;
  /** Parts, their drawn surfaces and unsupported reasons. */
  export type IResult = collectCollisionPartsImplementation.IResult;

  /**
   * Measure the world-space bounds of what the scene currently draws.
   *
   * Visible objects on an active layer contribute their posed geometry; screen
   * space inspection lines contribute their segment ends. Sprites, batched
   * meshes and non-finite vertices do not contribute. World matrices are
   * updated before measurement. An empty result means nothing measurable draws.
   *
   * @param root The scene object whose drawn descendants are measured.
   * @returns The finite world-space bounds, or null when nothing measured draws.
   */
  export function measureBounds(
    root: THREE.Object3D,
  ): IAutoMovieRenderViewerSubjectBounds | null {
    return measureBoundsImplementation(root);
  }

  /** Inputs for measuring one mesh's posed triangle edges. */
  export interface IMeasureEdgesProps {
    /** The mesh to read, drawn and with a position buffer. */
    mesh: THREE.Mesh;
    /** The mesh's inspection path. */
    path: string;
  }

  /**
   * Read a mesh's triangle edges and return one mark attached to the mesh.
   *
   * Each undirected triangle edge is drawn once. Corners are welded by stored
   * positions, and a degenerate edge draws nothing. The returned measured
   * object owns a refresh callback that updates mark coordinates from the
   * mesh's current posed vertices.
   *
   * @param props The drawn mesh and its inspection path.
   * @returns The mesh anchor, its edge mark when nonempty, and its pose refresh.
   */
  export function measureEdges(
    props: IMeasureEdgesProps,
  ): IAutoMovieRenderInspectionMeasured {
    return measureEdgesImplementation(props);
  }
  /**
   * Read every visible drawn object of one placed layer as collision parts.
   *
   * @param layer The placed layer and its source-owned identities.
   * @param budget Posed-vertex allowance charged when a surface is read, and an
   *   optional part allowance charged per collected part; collection stops when
   *   the parts run out.
   * @returns Parts in traversal order, posed surfaces by part and unsupported
   *   reasons by part.
   */
  export function collectCollisionParts(
    layer: ILayer,
    budget: { posedVertices: number; parts?: number },
  ): IResult {
    return collectCollisionPartsImplementation(layer, budget);
  }
  /**
   * Measure each chosen path's drawn object and mark bounds in world space.
   *
   * @param props Drawn objects and marks with their paths and anchors, plus the
   *   path predicate.
   * @returns Nonempty measured bounds in first-seen object-then-mark order.
   */
  export function measurePaths(
    props: IMeasurePathsProps,
  ): IAutoMovieInspectionDrawable[] {
    return measurePathsImplementation(props);
  }
  /** Named input contract for measuring a mesh's defects. */
    /** Mesh, defect selection and geometry cache for one measurement. */
    export interface IMeasureDefectsProps {
      /** Drawn mesh with a position buffer. */
      mesh: THREE.Mesh;
      /** Inspection path used when reporting a refusal. */
      path: string;
      /** Engine defect kinds to retain. */
      kinds: ReadonlySet<IAutoMovieMeshDefect.Kind>;
      /** Sliver aspect limit, or null when disabled. */
      sliver: number | null;
      /** Cached engine defects by geometry. */
      measured: Map<THREE.BufferGeometry, IAutoMovieMeshDefect[]>;
    }
  /** Named input and result contracts for inspection mesh measurement. */
    /** Drawn paths and request predicates used to select meshes and defects. */
    export interface IMeasureMeshesProps {
      /** Drawn objects and their inspection paths. */
      drawn: readonly IAutoMovieRenderInspectionPath[];
      /** Engine defect kinds enabled by the request. */
      defects: readonly IAutoMovieMeshDefect.Kind[];
      /** Sliver aspect limit, or null. */
      sliver: number | null;
      /** Whether an inspection kind is requested. */
      asks: (kind: string) => boolean;
      /** Whether a path is hidden. */
      hidden: (path: string) => boolean;
    }
    /** Meshes found in the drawing and measurements retained by the request. */
    export interface IMeasureMeshesResult {
      /** Drawn, visible-position meshes before path hiding. */
      meshes: { path: string; mesh: THREE.Mesh }[];
      /** Measurements retained after request filtering. */
      measured: IAutoMovieRenderInspectionMeasured[];
    }
  /** Measure engine defects on one mesh and return posed inspection marks. */
  export function measureDefects(
    props: IMeasureDefectsProps,
  ): IAutoMovieRenderInspectionMeasured {
    return measureAutoMovieInspectionDefectsImplementation(props);
  }
  /** Find and measure the meshes an inspection draws and requests. */
  export function measureMeshes(
    props: IMeasureMeshesProps,
  ): IMeasureMeshesResult {
    return measureAutoMovieInspectionMeshesImplementation(props);
  }
}