import type {
  AutoMovieMatrix3Tuple,
  AutoMovieVector3Tuple,
  IAutoMovieCurveBoundary64,
  IAutoMovieCurveBoundaryEdge64,
  IAutoMovieCurveHierarchyFrame64,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Matrix4 } from "../../math/Matrix4";
import { assertAutoMovieCurveBoundary64 } from "./assertAutoMovieCurveBoundary64";
import { assertFiniteCurveVector } from "./internal/assertFiniteCurveVector";
import { freezeCurveBoundary } from "./internal/freezeCurveBoundary";
import { isDenseFinite } from "./internal/isDenseFinite";

/**
 * Resolve a parent-first proper rigid hierarchy before constructing controls,
 * then authenticate named boundary sharing within this exact context. Points
 * use millimetres; rotations preserve the units of directions and derivative
 * vectors. Composition accumulates binary64 roundoff, so a transpose inverse is
 * subject to the admitted-basis tolerance and accumulated error.
 */
export class AutoMovieEngineCurveParentContext {
  /**
   * JSON serialization of resolved frames and edges in insertion order; equal
   * strings do not authenticate another context's copied operator.
   */
  public readonly revision: string;



  /**
   * Admit and resolve the supplied parent-first frames and clone the directed
   * edge declarations. Construction throws before a usable context exists if a
   * transform or graph endpoint is invalid.
   */
  public constructor(
    localFrames: readonly IAutoMovieCurveHierarchyFrame64[],
    edges: readonly IAutoMovieCurveBoundaryEdge64[],
  ) {
    for (const frame of localFrames) {
      if (
        !frame.bone ||
        this.frames.has(frame.bone) ||
        (frame.parent !== null && !this.frames.has(frame.parent))
      )
        throw new Error("Parents must precede unique bones");
      assertFiniteCurveVector(frame.translationMm);
      if (frame.rotation.length !== 3)
        throw new Error("Proper orthonormal frame required");
      for (const row of frame.rotation) assertFiniteCurveVector(row);
      for (let i: number = 0; i < 3; i++)
        for (let j: number = 0; j < 3; j++) {
          const dot: number = frame.rotation[i]!.reduce(
            (s: number, x: number, k: number): number =>
              s + x * frame.rotation[j]![k]!,
            0,
          );
          if (!(Math.abs(dot - (i === j ? 1 : 0)) <= 64 * Number.EPSILON))
            throw new Error("Proper orthonormal frame required");
        }
      const r: AutoMovieMatrix3Tuple.ReadonlyRows = frame.rotation;
      const determinant: number =
        r[0][0] * (r[1][1] * r[2][2] - r[1][2] * r[2][1]) -
        r[0][1] * (r[1][0] * r[2][2] - r[1][2] * r[2][0]) +
        r[0][2] * (r[1][0] * r[2][1] - r[1][1] * r[2][0]);
      if (!(determinant > 0) || !Number.isFinite(determinant))
        throw new Error("Reflected frames are not proper rotations");
      const parent: IAutoMovieCurveHierarchyFrame64 | undefined =
        frame.parent === null ? undefined : this.frames.get(frame.parent);
      const local: number[] = [
        r[0][0],
        r[1][0],
        r[2][0],
        0,
        r[0][1],
        r[1][1],
        r[2][1],
        0,
        r[0][2],
        r[1][2],
        r[2][2],
        0,
        ...frame.translationMm,
        1,
      ];
      const world: number[] =
        parent === undefined
          ? local
          : Matrix4.multiply(this.matrices.get(parent.bone)!, local);
      if (!isDenseFinite(world))
        throw new Error("Resolved curve frame must remain finite");
      function row(i: number): Readonly<AutoMovieVector3Tuple> { return [world[i]!, world[4 + i]!, world[8 + i]!]; }
      const rotation: AutoMovieMatrix3Tuple.ReadonlyRows = [
        row(0),
        row(1),
        row(2),
      ];
      const translation: Readonly<AutoMovieVector3Tuple> = [
        world[12]!,
        world[13]!,
        world[14]!,
      ];
      this.frames.set(frame.bone, {
        bone: frame.bone,
        parent: frame.parent,
        rotation,
        translationMm: translation,
      });
      this.matrices.set(frame.bone, world);
    }
    for (const edge of edges) {
      if (
        this.edges.has(edge.id) ||
        !this.frames.has(edge.ownerBone) ||
        !this.frames.has(edge.consumerBone)
      )
        throw new Error("Unique edges need actual owner and consumer bones");
      this.edges.set(edge.id, Object.freeze(structuredClone(edge)));
    }
    this.revision = JSON.stringify({
      frames: [...this.frames.values()],
      edges: [...this.edges.values()],
    });
  }

  /**
   * Rotate a finite local vector into world coordinates without translation,
   * preserving its physical units.
   */
  public direction(
    bone: string,
    vector: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple> {
    const frame: IAutoMovieCurveHierarchyFrame64 | undefined =
      this.frames.get(bone);
    if (frame === undefined) throw new Error("Unknown bone");
    assertFiniteCurveVector(vector);
    function dot(row: Readonly<AutoMovieVector3Tuple>): number {
      return row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2];
    }
    const direction: AutoMovieVector3Tuple = [
      dot(frame.rotation[0]),
      dot(frame.rotation[1]),
      dot(frame.rotation[2]),
    ];
    assertFiniteCurveVector(direction);
    return direction;
  }

  /**
   * Transform a finite local millimetre point to world millimetres using the
   * resolved affine matrix.
   */
  public point(
    bone: string,
    point: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple> {
    if (!this.frames.has(bone)) throw new Error("Unknown bone");
    assertFiniteCurveVector(point);
    const pointWorld: IAutoMovieVector3 = Matrix4.transformPoint(
      this.matrices.get(bone)!,
      {
        x: point[0],
        y: point[1],
        z: point[2],
      },
    );
    const world: AutoMovieVector3Tuple = [pointWorld.x, pointWorld.y, pointWorld.z];
    assertFiniteCurveVector(world);
    return world;
  }

  /**
   * Rotate a finite world vector back to a node chart with the transpose of its
   * resolved proper rotation.
   */
  public inverseDirection(
    bone: string,
    vector: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple> {
    const frame: IAutoMovieCurveHierarchyFrame64 | undefined =
      this.frames.get(bone);
    if (frame === undefined) throw new Error("Unknown bone");
    const r: AutoMovieMatrix3Tuple.ReadonlyRows = frame.rotation;
    assertFiniteCurveVector(vector);
    const direction: AutoMovieVector3Tuple = [
      r[0][0] * vector[0] + r[1][0] * vector[1] + r[2][0] * vector[2],
      r[0][1] * vector[0] + r[1][1] * vector[1] + r[2][1] * vector[2],
      r[0][2] * vector[0] + r[1][2] * vector[1] + r[2][2] * vector[2],
    ];
    assertFiniteCurveVector(direction);
    return direction;
  }

  /**
   * Pull a world millimetre point into the node chart by subtracting world
   * translation and applying the inverse direction transform.
   */
  public inversePoint(
    bone: string,
    point: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple> {
    const frame: IAutoMovieCurveHierarchyFrame64 | undefined =
      this.frames.get(bone);
    if (frame === undefined) throw new Error("Unknown bone");
    assertFiniteCurveVector(point);
    return this.inverseDirection(bone, [
      point[0] - frame.translationMm[0],
      point[1] - frame.translationMm[1],
      point[2] - frame.translationMm[2],
    ]);
  }

  /**
   * Return an independent copy of a resolved world frame, with the original
   * node and parent keys preserved.
   */
  public frame(bone: string): IAutoMovieCurveHierarchyFrame64 {
    const frame: IAutoMovieCurveHierarchyFrame64 | undefined =
      this.frames.get(bone);
    if (frame === undefined) throw new Error("Unknown bone");
    return structuredClone(frame);
  }

  /**
   * Admit an owner boundary once, clone and freeze its complete field, then
   * retain the genuine token for later binding.
   */
  public publish(
    region: string,
    bone: string,
    boundary: IAutoMovieCurveBoundary64,
  ): AutoMovieEngineCurveParentContext.IPublication {
    assertAutoMovieCurveBoundary64(boundary);
    const edge: IAutoMovieCurveBoundaryEdge64 | undefined = this.edges.get(
      boundary.id,
    );
    if (
      edge === undefined ||
      edge.ownerRegion !== region ||
      edge.ownerBone !== bone ||
      boundary.section.name !== boundary.id ||
      this.published.has(boundary.id)
    )
      throw new Error("Wrong or repeated anatomical boundary owner");
    const value: IAutoMovieCurveBoundary64 = freezeCurveBoundary(boundary);
    const operator: AutoMovieEngineCurveParentContext.IPublication = Object.freeze({
      edge,
      contextRevision: this.revision,
      value,
    });
    this.published.set(boundary.id, operator);
    return operator;
  }

  /**
   * Authenticate the declared consumer against this context's genuine
   * publication and return the same immutable boundary object.
   */
  public bind(
    region: string,
    bone: string,
    operator: AutoMovieEngineCurveParentContext.IPublication,
  ): IAutoMovieCurveBoundary64 {
    const edge: IAutoMovieCurveBoundaryEdge64 | undefined = this.edges.get(
      operator.value.id,
    );
    if (
      edge === undefined ||
      edge.consumerRegion !== region ||
      edge.consumerBone !== bone ||
      edge.ownerBone !== operator.edge.ownerBone ||
      edge.ownerRegion !== operator.edge.ownerRegion ||
      edge.id !== operator.edge.id ||
      operator.value.section.name !== edge.id ||
      operator.contextRevision !== this.revision ||
      this.published.get(edge.id) !== operator
    )
      throw new Error("Stale, forged or wrong anatomical connection");
    return operator.value;
  }
  /** Resolved world frames owned by this context, keyed by node. */
  private readonly frames: Map<string, IAutoMovieCurveHierarchyFrame64> =
    new Map();

  /** Column-major local-to-world matrices reused by point transforms. */
  private readonly matrices: Map<string, number[]> = new Map();

  /** Cloned and frozen routing declarations keyed by boundary ID. */
  private readonly edges: Map<string, IAutoMovieCurveBoundaryEdge64> =
    new Map();

  /** Genuine frozen publications, bounded by the declared edge count. */
  private readonly published: Map<
    string,
    AutoMovieEngineCurveParentContext.IPublication
  > = new Map();
}

/** Values owned and authenticated by one curve parent context. */
export namespace AutoMovieEngineCurveParentContext {
  /** A frozen publication authenticated by exact identity during binding. */
  export interface IPublication {
    /** Frozen routing record authorizing the publication. */
    readonly edge: IAutoMovieCurveBoundaryEdge64;

    /** Resolved graph identity at the time of publication. */
    readonly contextRevision: string;

    /** Independent frozen copy of the owner's generated boundary. */
    readonly value: IAutoMovieCurveBoundary64;
  }
}
