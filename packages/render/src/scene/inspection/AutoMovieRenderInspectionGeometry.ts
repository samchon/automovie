import type { IAutoMovieInspectionMeasured } from "./IAutoMovieInspectionMeasured.js";
import type { IAutoMovieViewerSubjectBounds } from "../subjectViewpoint/IAutoMovieViewerSubjectBounds.js";
import type { Mesh, Object3D } from "three";
import type {
  IAutoMovieInspectionDrawable,
  IAutoMovieMark,
} from "@automovie/interface";
import type { IAutoMovieInspectionPath } from "./IAutoMovieInspectionPath.js";

import { measureAutoMovieInspectionBounds as measureBoundsImplementation } from "./internal/measureAutoMovieInspectionBounds.js";
import { collectAutoMovieCollisionParts as collectCollisionPartsImplementation } from "./internal/collectAutoMovieCollisionParts.js";
import { measureAutoMovieInspectionEdges as measureEdgesImplementation } from "./internal/measureAutoMovieInspectionEdges.js";
import { measureAutoMovieInspectionPaths as measurePathsImplementation } from "./internal/measureAutoMovieInspectionPaths.js";

/** Public operations for Auto Movie Render Inspection Geometry. */
export namespace AutoMovieRenderInspectionGeometry {
  /** Inputs for measuring drawn object and mark bounds by inspection path. */
  export interface IMeasurePathsProps {
    /** Drawn objects with their paths. */
    objects: readonly IAutoMovieInspectionPath[];
    /** Drawn marks with their anchor, or null for world space. */
    marks: readonly { mark: IAutoMovieMark; anchor: Object3D | null }[];
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
    root: Object3D,
  ): IAutoMovieViewerSubjectBounds | null {
    return measureBoundsImplementation(root);
  }

  /** Inputs for measuring one mesh's posed triangle edges. */
  export interface IMeasureEdgesProps {
    /** The mesh to read, drawn and with a position buffer. */
    mesh: Mesh;
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
  ): IAutoMovieInspectionMeasured {
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
}