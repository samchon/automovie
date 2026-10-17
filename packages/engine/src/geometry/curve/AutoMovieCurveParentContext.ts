import { Matrix4 } from "../../math/Matrix4";
import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";
import { assertAutoMovieCurveBoundary64 } from "./assertAutoMovieCurveBoundary64";

/**
 * Resolve a parent-first proper rigid hierarchy before constructing controls, then authenticate named boundary sharing within this exact context. Points use millimetres; rotations preserve the units of directions and derivative vectors. Composition accumulates binary64 roundoff, so a transpose inverse is subject to the admitted-basis tolerance and accumulated error.
 *
 * @evidence contracts/common.md#principled-implementation Each local row-basis is admitted within 64 epsilons, requires positive determinant, and composes through column-major parent matrices. Binding checks both serialized context revision and exact published object identity.
 * @evidence contracts/common.md#clear-and-simple-design The constructor resolves all frames and clones all edges before revision serialization; frame/matrix maps own placement while edge/publication maps own routing and token authenticity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reflections, absent parents, nonfinite transforms and copied/stale operator tokens are refused; no pose fitting or anatomy-specific placement is inserted.
 * @evidence contracts/common.md#meaningful-documentation Documents parent-first inputs, millimetre charts, throw-before-use construction failure, copied frame snapshots, immutable shared fields and same-instance publication binding.
 * @evidence contracts/performance.md#efficient-algorithms F frames and E edges take O(F+E) construction and storage apart from serialized key lengths; publication additionally scans/clones/freezes its full coefficient field.
 * @evidence contracts/performance.md#reuse-equivalent-work Resolved world transforms and each published field are shared for the context lifetime; mutable caller frames are copied into resolved values and edges are cloned/frozen.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This instance retains F resolved frames/matrices, E cloned edges and at most E frozen boundary/operator entries plus its revision string. They release with the context; no native handles or global cache exist.
 */
export class AutoMovieCurveParentContext {
  /**
   * JSON serialization of resolved frames and edges in insertion order; equal strings do not authenticate another context's copied operator.
   */
  public readonly revision: string;

  /** Resolved world frames owned by this context, keyed by node. */
  private readonly frames: Map<string, C.Frame> = new Map();

  /** Column-major local-to-world matrices reused by point transforms. */
  private readonly matrices: Map<string, number[]> = new Map();

  /** Cloned and frozen routing declarations keyed by boundary ID. */
  private readonly edges: Map<string, C.Edge> = new Map();

  /** Genuine frozen publications, bounded by the declared edge count. */
  private readonly published: Map<string, C.Operator> = new Map();

  /**
   * Admit and resolve the supplied parent-first frames and clone the directed edge declarations. Construction throws before a usable context exists if a transform or graph endpoint is invalid.
   */
  public constructor(
    localFrames: readonly C.Frame[],
    edges: readonly C.Edge[],
  ) {
    for (const frame of localFrames) {
      if (
        typeof frame.bone !== "string" ||
        !frame.bone ||
        this.frames.has(frame.bone) ||
        (frame.parent !== null && !this.frames.has(frame.parent))
      )
        throw new Error("Parents must precede unique bones");
      if (
        frame.rotation.length !== 3 ||
        frame.rotation.some((r: C.Vector): boolean => r.length !== 3) ||
        frame.translationMm.length !== 3 ||
        ![...frame.rotation.flat(), ...frame.translationMm].every(
          Number.isFinite,
        )
      )
        throw new Error("Finite rigid frames required");
      for (let i: number = 0; i < 3; i++)
        for (let j: number = 0; j < 3; j++) {
          const dot: number = frame.rotation[i]!.reduce(
            (s: number, x: number, k: number): number =>
              s + x * frame.rotation[j]![k]!,
            0,
          );
          if (Math.abs(dot - (i === j ? 1 : 0)) > 64 * Number.EPSILON)
            throw new Error("Proper orthonormal frame required");
        }
      const r: C.Matrix = frame.rotation;
      const determinant: number =
        r[0][0] * (r[1][1] * r[2][2] - r[1][2] * r[2][1]) -
        r[0][1] * (r[1][0] * r[2][2] - r[1][2] * r[2][0]) +
        r[0][2] * (r[1][0] * r[2][1] - r[1][1] * r[2][0]);
      if (determinant <= 0)
        throw new Error("Reflected frames are not proper rotations");
      const parent: C.Frame | undefined =
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
      const rotation: C.Matrix = [0, 1, 2].map(
        (i: number): C.Vector => [world[i]!, world[4 + i]!, world[8 + i]!],
      ) as unknown as C.Matrix;
      const translation: C.Vector = [world[12]!, world[13]!, world[14]!];
      if (![...rotation.flat(), ...translation].every(Number.isFinite))
        throw new Error("Unresolved parent transform");
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
   * Rotate a finite local vector into world coordinates without translation, preserving its physical units.
   *
   * @evidence contracts/common.md#principled-implementation Resolved rotation-row dot products apply the admitted local-to-world proper basis.
   * @evidence contracts/common.md#clear-and-simple-design Direction transformation is separate from point translation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown nodes and nonfinite results throw rather than returning a default axis.
   * @evidence contracts/common.md#meaningful-documentation States local/world charts, unit preservation and failure conditions.
   * @evidence contracts/performance.md#efficient-algorithms Fixed 3-by-3 arithmetic and one vector allocation, O(1).
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the constructor-resolved basis rather than recomposing the hierarchy.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new vector and retains neither the input nor the result.
   */
  public direction(bone: string, vector: C.Vector): C.Vector {
    const frame: C.Frame | undefined = this.frames.get(bone);
    if (
      frame === undefined ||
      vector.length !== 3 ||
      !vector.every(Number.isFinite)
    )
      throw new Error("Unknown bone or invalid direction");
    const result: C.Vector = frame.rotation.map((row: C.Vector): number =>
      row.reduce(
        (s: number, x: number, k: number): number => s + x * vector[k]!,
        0,
      ),
    ) as unknown as C.Vector;
    if (!result.every(Number.isFinite))
      throw new Error("Unresolved direction transform");
    return result;
  }

  /**
   * Transform a finite local millimetre point to world millimetres using the resolved affine matrix.
   *
   * @evidence contracts/common.md#principled-implementation Matrix4.transformPoint applies the stored proper local-to-world matrix including millimetre translation.
   * @evidence contracts/common.md#clear-and-simple-design The point path owns translation while direction owns rotation alone.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No generated-curve fitting or later compensating placement occurs here.
   * @evidence contracts/common.md#meaningful-documentation States input/output units and unknown-node/nonfinite failure.
   * @evidence contracts/performance.md#efficient-algorithms One fixed 4-by-4 point transform and a new tuple, O(1).
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the matrix resolved once during context construction.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The new point belongs to the caller; the input is not retained.
   */
  public point(bone: string, point: C.Vector): C.Vector {
    if (
      !this.frames.has(bone) ||
      point.length !== 3 ||
      !point.every(Number.isFinite)
    )
      throw new Error("Unknown bone or invalid point");
    const pointWorld: ReturnType<typeof Matrix4.transformPoint> =
      Matrix4.transformPoint(this.matrices.get(bone)!, {
        x: point[0],
        y: point[1],
        z: point[2],
      });
    const result: C.Vector = [pointWorld.x, pointWorld.y, pointWorld.z];
    if (!result.every(Number.isFinite))
      throw new Error("Unresolved point transform");
    return result;
  }

  /**
   * Rotate a finite world vector back to a node chart with the transpose of its resolved proper rotation.
   *
   * @evidence contracts/common.md#principled-implementation For the admitted orthonormal basis, transpose is the inverse; binary64 orthogonality tolerance remains the constructor premise.
   * @evidence contracts/common.md#clear-and-simple-design The inverse direction path avoids applying a translation or constructing a generic matrix inverse.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown nodes and unresolved arithmetic throw; no direction is normalized or clamped.
   * @evidence contracts/common.md#meaningful-documentation States the world-to-local direction and the orthonormal premise.
   * @evidence contracts/performance.md#efficient-algorithms Fixed 3-by-3 products, O(1) time and one vector.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the retained resolved rotation instead of rebuilding or inverting the hierarchy.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only a new result tuple is allocated; no inverse-query state is retained.
   */
  public inverseDirection(bone: string, vector: C.Vector): C.Vector {
    const frame: C.Frame | undefined = this.frames.get(bone);
    if (
      frame === undefined ||
      vector.length !== 3 ||
      !vector.every(Number.isFinite)
    )
      throw new Error("Unknown bone or invalid direction");
    const result: C.Vector = [0, 1, 2].map((k: number): number =>
      frame.rotation.reduce(
        (s: number, row: C.Vector, i: number): number =>
          s + row[k]! * vector[i]!,
        0,
      ),
    ) as unknown as C.Vector;
    if (!result.every(Number.isFinite))
      throw new Error("Unresolved inverse direction");
    return result;
  }

  /**
   * Pull a world millimetre point into the node chart by subtracting world translation and applying the inverse direction transform.
   *
   * @evidence contracts/common.md#principled-implementation The inverse of a rigid affine transform is R-transpose times the translated point.
   * @evidence contracts/common.md#clear-and-simple-design Reuses inverseDirection so the proper-basis inverse has one implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown nodes and nonfinite subtraction/rotation fail through the same checks as direction conversion.
   * @evidence contracts/common.md#meaningful-documentation States both coordinate charts and millimetre translation.
   * @evidence contracts/performance.md#efficient-algorithms Three subtractions plus one fixed inverse direction operation, O(1).
   * @evidence contracts/performance.md#reuse-equivalent-work Uses stored world translation and the shared inverseDirection method.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary difference/result tuples are caller-local and not retained.
   */
  public inversePoint(bone: string, point: C.Vector): C.Vector {
    const frame: C.Frame | undefined = this.frames.get(bone);
    if (frame === undefined) throw new Error("Unknown bone");
    return this.inverseDirection(
      bone,
      point.map(
        (x: number, k: number): number => x - frame.translationMm[k]!,
      ) as unknown as C.Vector,
    );
  }

  /**
   * Return an independent copy of a resolved world frame, with the original node and parent keys preserved.
   *
   * @evidence contracts/common.md#principled-implementation A structured clone prevents callers from mutating the context-owned resolved basis and translation.
   * @evidence contracts/common.md#clear-and-simple-design The snapshot exposes one node without exposing the retained maps.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown nodes throw instead of synthesizing a root or default frame.
   * @evidence contracts/common.md#meaningful-documentation Clarifies that rotation/translation are resolved world values despite the original parent key.
   * @evidence contracts/performance.md#efficient-algorithms One fixed-size frame clone, O(1) excluding key string lengths.
   * @evidence contracts/performance.md#reuse-equivalent-work The resolved frame is reused as the snapshot source; returned snapshots are independent.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the clone and the context retains only its original frame.
   */
  public frame(bone: string): C.Frame {
    const frame: C.Frame | undefined = this.frames.get(bone);
    if (frame === undefined) throw new Error("Unknown bone");
    return structuredClone(frame);
  }

  /**
   * Admit an owner boundary once, clone and deep-freeze its complete field, then retain the genuine token for later binding. Deep freezing expects the supported acyclic plain coefficient record; arbitrary cyclic extra properties are outside this input contract.
   *
   * @evidence contracts/common.md#principled-implementation Declared region/node/ID ownership is checked before a cloned field is recursively frozen and paired with the context revision.
   * @evidence contracts/common.md#clear-and-simple-design Publication is the sole writer of the token map and owns immutable field sharing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A repeated or wrong owner fails; equal copied data is not a substitute for the actual publication.
   * @evidence contracts/common.md#meaningful-documentation States owner authentication, copy/freeze behavior, units inherited from the boundary and same-instance binding.
   * @evidence contracts/performance.md#efficient-algorithms For B boundary entries, admission, clone and recursive freeze cost O(B); map lookup is keyed by ID.
   * @evidence contracts/performance.md#reuse-equivalent-work All later consumers bind the same frozen field rather than cloning or regenerating its coefficients.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The context retains at most one token and coefficient clone per declared edge until the context is released.
   */
  public publish(
    region: string,
    bone: string,
    boundary: C.Boundary,
  ): C.Operator {
    assertAutoMovieCurveBoundary64(boundary);
    const edge: C.Edge | undefined = this.edges.get(boundary.id);
    if (
      edge === undefined ||
      edge.ownerRegion !== region ||
      edge.ownerBone !== bone ||
      boundary.section.name !== boundary.id ||
      this.published.has(boundary.id)
    )
      throw new Error("Wrong or repeated anatomical boundary owner");
    const value: C.Boundary = structuredClone(boundary);
    const freeze: (item: unknown) => void = (item: unknown): void => {
      if (item !== null && typeof item === "object") {
        for (const child of Object.values(item)) freeze(child);
        Object.freeze(item);
      }
    };
    freeze(value);
    const operator: C.Operator = Object.freeze({
      edge,
      contextRevision: this.revision,
      value,
    });
    this.published.set(boundary.id, operator);
    return operator;
  }

  /**
   * Authenticate the declared consumer against this context's genuine publication and return the same immutable boundary object.
   *
   * @evidence contracts/common.md#principled-implementation Edge endpoint checks, revision equality and publication-map object identity jointly authenticate the token.
   * @evidence contracts/common.md#clear-and-simple-design One method owns consumer authorization without copying the shared field.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Forged, stale or wrong-owner/consumer tokens throw; matching serialized data alone does not grant access.
   * @evidence contracts/common.md#meaningful-documentation States exact-instance authentication and shared-return ownership.
   * @evidence contracts/performance.md#efficient-algorithms Fixed keyed lookups and scalar/key comparisons; no coefficient traversal or clone.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns the published field instance reused across dependent constructors.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The operation adds no retained references or handles; existing context publication ownership is unchanged.
   */
  public bind(region: string, bone: string, operator: C.Operator): C.Boundary {
    const edge: C.Edge | undefined = this.edges.get(operator.value.id);
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
}
