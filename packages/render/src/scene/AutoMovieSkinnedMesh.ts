import type { IAutoMovieMeshSkin } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieSkinBlend } from "./AutoMovieSkinBlend.js";
import { AutoMovieSkinPose } from "./AutoMovieSkinPose.js";
import { AutoMovieThreeKind } from "./AutoMovieThreeKind.js";

/**
 * A skinned mesh whose CPU queries read the deformation its shaders draw.
 *
 * Three's {@link THREE.SkinnedMesh} evaluates `applyBoneTransform` by linear
 * blending, and its bounds, `getVertexPosition` and raycast all go through it,
 * while a dual-quaternion skin draws with the patched vertex shader. This mesh
 * keeps one selected result for every CPU consumer: morph targets first
 * (Three's `Mesh.getVertexPosition`, relative or absolute as the geometry
 * declares), then the skin's own method over the joint transforms `K_j =
 * bindMatrixInverse * boneWorld_j * boneInverse_j * bindMatrix` that the shader
 * blends, giving a point in the mesh's own frame. The world placement cancels
 * inside `K_j`, so moving the model root changes no local result.
 *
 * The posed positions are cached, three floats per vertex, under a key of
 * everything they depend on: the geometry object and the versions of its
 * position and skin attributes, the morph influences, and `K_j` of each joint
 * that weighs on some vertex. A writer that changes bones or morph influences
 * calls {@link AutoMovieSkinnedMesh.invalidatePose}, the duty Three places on
 * any animated skinned mesh's bounds; the next query then rebuilds only the
 * key, and evaluates the vertices again only when the key changed, so a pose
 * that leaves this mesh's joints alone costs it O(joints).
 *
 * Bounds come in two tiers. The box is the exact CPU extent of the cache. The
 * sphere, which frustum culling, shadow culling and Three's raycast prefilter
 * read every frame, is derived from the joints alone: dual quaternion blending
 * commutes with a rigid change of frame on either side (Kavan et al. 2008), so
 * with the rest sphere `(c, r)` of the vertices, every posed vertex lies within
 * `r + max_k |K_k c - K_a c| / m` of the anchor joint's image `K_a c`, where
 * `m`, the least `|q_k . q_l|` over the weighted joints, bounds the blended
 * rotation's norm from below because the aligned weights sum to one; a linear
 * blend is a convex combination of rigid images and needs no `m`. When `m`
 * falls to 0.25 or below, or a morph is live, the sphere is the exact one
 * instead. Both tiers grow by {@link AutoMovieSkinnedMesh.tolerance}'s float32
 * bound, so culling and framing never cut a vertex the GPU draws.
 *
 * Precision: the CPU blend runs in double precision and agrees with the
 * engine's `skinAutoMovieMesh` to double rounding; the cache stores float32,
 * which adds at most 2^-24 of a coordinate. The GPU evaluates the same blend in
 * float32 over float32 matrices, about sixty roundings per vertex, so its
 * result lies within 2^-18 of the largest local coordinate of the CPU one.
 */
export class AutoMovieSkinnedMesh<
  TMaterial extends THREE.Material | THREE.Material[] =
    | THREE.Material
    | THREE.Material[],
> extends THREE.SkinnedMesh<THREE.BufferGeometry, TMaterial> {
  /** This class's literal type flag, as three.js flags its own classes. */
  public readonly isAutoMovieSkinnedMesh: true = true;

  /** Blend the shader draws this skin with; `linear` is Three's own. */
  public method: NonNullable<IAutoMovieMeshSkin["method"]>;

  /** The cached CPU pose: positions, extent and the joint-only sphere. */
  private readonly cpu: AutoMovieSkinPose = new AutoMovieSkinPose(this);

  /**
   * @param geometry Geometry with skin indices and weights.
   * @param material Material, patched for dual quaternions by its builder.
   * @param method The skin's blend; omitted it is linear, as `Object3D.clone`
   *   constructs before `copy`.
   */
  public constructor(
    geometry?: THREE.BufferGeometry,
    material?: TMaterial,
    method: NonNullable<IAutoMovieMeshSkin["method"]> = "linear",
  ) {
    super(geometry, material);
    this.method = method;
  }

  /**
   * Largest distance by which the GPU's float32 skin may differ from this
   * mesh's CPU result, metres in the mesh frame: 2^-18 of the largest absolute
   * posed coordinate, from about sixty float32 roundings per vertex. Zero for
   * an empty mesh.
   */
  public tolerance(): number {
    this.cpu.evaluate();
    return this.cpu.largest * AutoMovieSkinBlend.GPU_RELATIVE_ERROR;
  }

  /**
   * Mark the pose possibly changed: the next query checks the key and both
   * bounds recompute. Call it after writing bones or morph influences.
   */
  public invalidatePose(): void {
    this.cpu.invalidate();
    AutoMovieSkinnedMesh.clearBounds(this);
  }

  /**
   * Clear a skinned mesh's object-level bounds, so every Three consumer
   * recomputes them on next read. Three's runtime documents both as nullable
   * (`@default null`, recomputed when null by Frustum, Raycaster and Box3),
   * while `@types/three` declares them non-null; the widened write states that
   * runtime contract rather than hiding a type error.
   *
   * @param mesh Any skinned mesh, including a foreign `THREE.SkinnedMesh`.
   */
  public static clearBounds(
    mesh: Pick<THREE.SkinnedMesh, "boundingBox" | "boundingSphere">,
  ): void {
    const nullable: {
      boundingBox: THREE.Box3 | null;
      boundingSphere: THREE.Sphere | null;
    } = mesh;
    nullable.boundingBox = null;
    nullable.boundingSphere = null;
  }

  /** Posed local vertex position: morphs, then this skin's method. */
  public override getVertexPosition(
    index: number,
    target: THREE.Vector3,
  ): THREE.Vector3 {
    this.cpu.evaluate();
    return target.fromArray(this.cpu.posed, index * 3);
  }

  /** Apply this skin's blend to an already morphed point or direction. */
  public override applyBoneTransform(
    index: number,
    target: THREE.Vector3,
  ): THREE.Vector3;
  public override applyBoneTransform(
    index: number,
    target: THREE.Vector4,
  ): THREE.Vector4;
  public override applyBoneTransform(
    index: number,
    target: THREE.Vector3 | THREE.Vector4,
  ): THREE.Vector3 | THREE.Vector4;
  public override applyBoneTransform(
    index: number,
    target: THREE.Vector3 | THREE.Vector4,
  ): THREE.Vector3 | THREE.Vector4 {
    if (this.method !== "dual-quaternion")
      return super.applyBoneTransform(index, target);
    _index.fromBufferAttribute(
      this.geometry.attributes.skinIndex as THREE.BufferAttribute,
      index,
    );
    _weight.fromBufferAttribute(
      this.geometry.attributes.skinWeight as THREE.BufferAttribute,
      index,
    );
    for (let k: number = 0; k < 4; ++k)
      AutoMovieSkinPose.joint(this, _index.getComponent(k), SINGLE, k * STRIDE);
    const point: boolean =
      !AutoMovieThreeKind.isVector4(target) || target.w !== 0;
    AutoMovieSkinBlend.dual(
      SINGLE,
      0,
      STRIDE,
      2 * STRIDE,
      3 * STRIDE,
      _weight.x,
      _weight.y,
      _weight.z,
      _weight.w,
      target.x,
      target.y,
      target.z,
      point,
      RESULT,
      0,
    );
    target.x = RESULT[0]!;
    target.y = RESULT[1]!;
    target.z = RESULT[2]!;
    return target;
  }

  /** Exact posed local box of the current key, grown by {@link tolerance}. */
  public override computeBoundingBox(): void {
    this.cpu.evaluate();
    const previous: THREE.Box3 | null = (
      this as { boundingBox: THREE.Box3 | null }
    ).boundingBox;
    const box: THREE.Box3 = (previous ?? new THREE.Box3()).copy(
      this.cpu.extent,
    );
    if (!box.isEmpty()) box.expandByScalar(this.tolerance());
    this.boundingBox = box;
  }

  /**
   * Safe posed local sphere: the joint-only bound of the class comment, or the
   * exact sphere about the posed box's centre when that bound does not hold;
   * either is grown by the float32 rounding bound.
   */
  public override computeBoundingSphere(): void {
    const sphere: THREE.Sphere =
      (this as { boundingSphere: THREE.Sphere | null }).boundingSphere ??
      new THREE.Sphere();
    if (!this.cpu.enclose(sphere)) {
      this.cpu.evaluate();
      if (this.cpu.extent.isEmpty()) sphere.makeEmpty();
      else {
        this.cpu.extent.getCenter(sphere.center);
        sphere.radius = this.cpu.radius + this.tolerance();
      }
    }
    this.boundingSphere = sphere;
  }

  /** Raycast the posed surface of the current key. */
  public override raycast(
    raycaster: THREE.Raycaster,
    intersects: THREE.Intersection[],
  ): void {
    // The culling sphere may be loose; a ray that meets it earns the exact
    // box, which Three tests before any triangle.
    const bounds: {
      boundingBox: THREE.Box3 | null;
      boundingSphere: THREE.Sphere | null;
    } = this;
    if (bounds.boundingSphere === null) this.computeBoundingSphere();
    _sphere.copy(this.boundingSphere).applyMatrix4(this.matrixWorld);
    if (!raycaster.ray.intersectsSphere(_sphere)) return;
    if (bounds.boundingBox === null) this.computeBoundingBox();
    super.raycast(raycaster, intersects);
  }

  /** Copy Three's skinned state and the blend method; the cache recomputes. */
  public override copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);
    this.method = source.method;
    this.cpu.reset();
    this.invalidatePose();
    return this;
  }
}

const STRIDE: number = AutoMovieSkinBlend.STRIDE;

/** The four joints of one uncached vertex query. */
const SINGLE: Float64Array = new Float64Array(4 * STRIDE);

/** One uncached query's result. */
const RESULT: Float64Array = new Float64Array(3);

const _index: THREE.Vector4 = new THREE.Vector4();
const _weight: THREE.Vector4 = new THREE.Vector4();
const _sphere: THREE.Sphere = new THREE.Sphere();
