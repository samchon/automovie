import type { IAutoMovieMeshSkin } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieSkinBlend } from "./AutoMovieSkinBlend.js";

/**
 * The CPU pose of one skinned mesh: posed positions under a complete
 * dependency key, the exact extent, and the joint-only safe sphere. Owned by
 * {@link AutoMovieSkinnedMesh}, which documents the operator order, the key and
 * the sphere's derivation; this class holds the state and the passes.
 *
 * @evidence contracts/development/design.md#principled-representation Morphs through Three's own Mesh.getVertexPosition, then blends over K_j = bindMatrixInverse * boneWorld_j * boneInverse_j * bindMatrix as the shader does; the sphere follows from the bi-invariance of dual quaternion blending and the convexity of linear blending.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separates cached state and passes from the mesh's Three overrides, and the arithmetic from both, keeping each file one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The key is rebuilt from current matrices, never trusted from an invalidation; an unbounded sphere falls back to the exact one.
 * @evidence contracts/development/common.md#meaningful-documentation States what is held and where the derivations are documented.
 */
export class AutoMovieSkinPose {
  /** Posed local positions under the key, three per vertex. */
  public posed: Float32Array = new Float32Array(0);

  /** Unpadded posed box of the cache. */
  public readonly extent: THREE.Box3 = new THREE.Box3();

  /** Largest distance of a cached vertex from the centre of {@link extent}. */
  public radius: number = 0;

  /** Largest absolute cached coordinate, the scale of the float32 error. */
  public largest: number = 0;

  /** Geometry the cache was read from; null before the first evaluation. */
  private source: THREE.BufferGeometry | null = null;

  /** Whether a writer invalidated since the key was last checked. */
  private stale: boolean = true;

  /** Skeleton slots weighing on at least one vertex of {@link source}. */
  private used: Int32Array = new Int32Array(0);

  /** Attribute versions, morph influences and `K_j` of the used joints at evaluation. */
  private key: Float64Array = new Float64Array(0);

  /** Rest sphere and weighted joints of a geometry at its attribute versions. */
  private rest: {
    geometry: THREE.BufferGeometry | null;
    version: string;
    centre: THREE.Vector3;
    radius: number;
    used: Int32Array;
  } = {
    geometry: null,
    version: "",
    centre: new THREE.Vector3(),
    radius: 0,
    used: new Int32Array(0),
  };

  /** @param mesh The skinned mesh this pose belongs to. */
  public constructor(private readonly mesh: AutoMovieSkinPose.IMesh) {}

  /**
   * Mark the key for checking at the next query.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The next query rebuilds the key from current matrices.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The mesh's invalidatePose delegates here.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Recomputes nothing eagerly.
   * @evidence contracts/development/common.md#meaningful-documentation States the effect.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Keeps the cache for an unchanged key.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Releases nothing.
   */
  public invalidate(): void {
    this.stale = true;
  }

  /**
   * Forget the cache entirely, as a copied mesh must.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Clears the geometry key so the next query evaluates.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Used by the mesh's copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cache is shared between meshes.
   * @evidence contracts/development/common.md#meaningful-documentation States the effect.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is reused afterwards.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps the allocated arrays for reuse.
   */
  public reset(): void {
    this.source = null;
    this.rest.geometry = null;
    this.stale = true;
  }

  /**
   * Bring the cache to the current key, evaluating the vertices only when it changed.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Rebuilds the key from attribute versions, morph influences and each weighted joint's K_j, then on a change morphs and blends every vertex by the skin's method and records extent, radius and largest coordinate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The one pass every vertex consumer shares.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Equality is exact; a stale cache of another geometry is never kept.
   * @evidence contracts/development/common.md#meaningful-documentation States the key and the outputs.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(U) for an unchanged key, otherwise two O(V) passes over typed arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every query of one key shares the pass.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Reallocates the cache and key only when their sizes change.
   */
  public evaluate(): void {
    const mesh: AutoMovieSkinPose.IMesh = this.mesh;
    const geometry: THREE.BufferGeometry = mesh.geometry;
    if (this.source === geometry && !this.stale) return;
    const indices: THREE.BufferAttribute = geometry.attributes
      .skinIndex as THREE.BufferAttribute;
    const weights: THREE.BufferAttribute = geometry.attributes
      .skinWeight as THREE.BufferAttribute;
    const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      geometry.attributes.position!;
    const count: number = position.count;
    if (this.source !== geometry)
      this.used = AutoMovieSkinBlend.usedJoints(indices, weights);

    // The key: attribute versions, morph influences, then K_j of every used
    // joint, written straight into the shared joint table the blend reads.
    const t: Float64Array = AutoMovieSkinPose.table(mesh.skeleton.bones.length);
    const influences: number[] = mesh.morphTargetInfluences ?? [];
    const size: number = 3 + influences.length + 16 * this.used.length;
    const key: Float64Array =
      this.key.length === size && this.source === geometry
        ? this.key
        : new Float64Array(size);
    let same: boolean = key === this.key;
    const put: (at: number, value: number) => void = (
      at: number,
      value: number,
    ): void => {
      if (key[at] !== value) {
        key[at] = value;
        same = false;
      }
    };
    put(0, AutoMovieSkinBlend.versionOf(position));
    put(1, indices.version);
    put(2, weights.version);
    influences.forEach((value: number, i: number): void => put(3 + i, value));
    let at: number = 3 + influences.length;
    for (const slot of this.used) {
      AutoMovieSkinPose.joint(mesh, slot, t, slot * STRIDE);
      for (let e: number = 0; e < 16; ++e) put(at++, t[slot * STRIDE + e]!);
    }
    this.key = key;
    this.stale = false;
    if (same && this.source === geometry) return;
    this.source = geometry;

    // Morph through Three's own query when any influence is live; otherwise
    // read the buffers directly.
    if (this.posed.length !== count * 3)
      this.posed = new Float32Array(count * 3);
    const morphing: boolean =
      geometry.morphAttributes.position !== undefined &&
      influences.some((value: number): boolean => value !== 0);
    const morph: (index: number, target: THREE.Vector3) => THREE.Vector3 =
      THREE.Mesh.prototype.getVertexPosition;
    const dual: boolean = mesh.method === "dual-quaternion";
    const posed: Float32Array = this.posed;
    const p: THREE.TypedArray | null = AutoMovieSkinBlend.packed(position, 3);
    const s: THREE.TypedArray | null = AutoMovieSkinBlend.packed(indices, 4);
    const w: THREE.TypedArray | null = AutoMovieSkinBlend.packed(weights, 4);
    let minX: number = Infinity;
    let minY: number = Infinity;
    let minZ: number = Infinity;
    let maxX: number = -Infinity;
    let maxY: number = -Infinity;
    let maxZ: number = -Infinity;
    for (let v: number = 0; v < count; ++v) {
      let px: number;
      let py: number;
      let pz: number;
      if (morphing) {
        morph.call(mesh, v, _point);
        px = _point.x;
        py = _point.y;
        pz = _point.z;
      } else if (p !== null) {
        px = p[v * 3]!;
        py = p[v * 3 + 1]!;
        pz = p[v * 3 + 2]!;
      } else {
        px = position.getX(v);
        py = position.getY(v);
        pz = position.getZ(v);
      }
      const a: number = (s !== null ? s[v * 4]! : indices.getX(v)) * STRIDE;
      const b: number = (s !== null ? s[v * 4 + 1]! : indices.getY(v)) * STRIDE;
      const c: number = (s !== null ? s[v * 4 + 2]! : indices.getZ(v)) * STRIDE;
      const d: number = (s !== null ? s[v * 4 + 3]! : indices.getW(v)) * STRIDE;
      const wa: number = w !== null ? w[v * 4]! : weights.getX(v);
      const wb: number = w !== null ? w[v * 4 + 1]! : weights.getY(v);
      const wc: number = w !== null ? w[v * 4 + 2]! : weights.getZ(v);
      const wd: number = w !== null ? w[v * 4 + 3]! : weights.getW(v);
      if (dual)
        AutoMovieSkinBlend.dual(
          t,
          a,
          b,
          c,
          d,
          wa,
          wb,
          wc,
          wd,
          px,
          py,
          pz,
          true,
          posed,
          v * 3,
        );
      else
        AutoMovieSkinBlend.linear(
          t,
          a,
          b,
          c,
          d,
          wa,
          wb,
          wc,
          wd,
          px,
          py,
          pz,
          posed,
          v * 3,
        );
      const x: number = posed[v * 3]!;
      const y: number = posed[v * 3 + 1]!;
      const z: number = posed[v * 3 + 2]!;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    if (count === 0) this.extent.makeEmpty();
    else {
      this.extent.min.set(minX, minY, minZ);
      this.extent.max.set(maxX, maxY, maxZ);
    }

    // Radius about the box centre and the error scale, from the cache.
    const cx: number = (minX + maxX) / 2;
    const cy: number = (minY + maxY) / 2;
    const cz: number = (minZ + maxZ) / 2;
    let farthest: number = 0;
    for (let i: number = 0; i < posed.length; i += 3) {
      const dx: number = posed[i]! - cx;
      const dy: number = posed[i + 1]! - cy;
      const dz: number = posed[i + 2]! - cz;
      const squared: number = dx * dx + dy * dy + dz * dz;
      if (squared > farthest) farthest = squared;
    }
    this.radius = count === 0 ? 0 : Math.sqrt(farthest);
    this.largest =
      count === 0 ? 0 : Math.max(-minX, maxX, -minY, maxY, -minZ, maxZ, 0);
  }

  /**
   * Write a safe posed sphere from the joints alone, without the vertices;
   * false when no useful finite bound follows (a live morph, or weighted
   * rotations too far apart), and the caller takes the exact sphere.
   *
   * @evidence contracts/development/implementation.md#principled-implementation With the rest sphere (c, r): DQ blending commutes with rigid frame changes, so each posed vertex lies within r of the blended image of c, and that image lies within max_k |K_k c - K_a c| / m of the anchor's, m = least |q_k . q_l| bounding the aligned blend's rotation norm from below because the weights sum to one; linear blending is a convex combination of rigid images, m = 1. Padded by the float32 bound.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The frame-rate tier of the mesh's bounds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A proven bound, not a fitted margin; MINIMUM_ALIGNMENT only chooses the exact sphere instead of a looser bound.
   * @evidence contracts/development/common.md#meaningful-documentation States the bound and the fallbacks.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(U^2) per call; the rest sphere costs O(V) once per geometry version.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Keeps the rest sphere and weighted slots per geometry and attribute versions.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes into the caller's sphere.
   */
  public enclose(sphere: THREE.Sphere): boolean {
    const mesh: AutoMovieSkinPose.IMesh = this.mesh;
    const geometry: THREE.BufferGeometry = mesh.geometry;
    const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      geometry.attributes.position!;
    const indices: THREE.BufferAttribute = geometry.attributes
      .skinIndex as THREE.BufferAttribute;
    const weights: THREE.BufferAttribute = geometry.attributes
      .skinWeight as THREE.BufferAttribute;
    if (
      geometry.morphAttributes.position !== undefined &&
      (mesh.morphTargetInfluences ?? []).some((v: number): boolean => v !== 0)
    )
      return false;
    if (position.count === 0) {
      sphere.makeEmpty();
      return true;
    }

    // The rest sphere and weighted joints, once per geometry and attribute versions.
    const version: string = `${AutoMovieSkinBlend.versionOf(position)}:${indices.version}:${weights.version}`;
    if (this.rest.geometry !== geometry || this.rest.version !== version) {
      const box: THREE.Box3 = new THREE.Box3();
      for (let v: number = 0; v < position.count; ++v)
        box.expandByPoint(_point.fromBufferAttribute(position, v));
      const centre: THREE.Vector3 = box.getCenter(new THREE.Vector3());
      let farthest: number = 0;
      for (let v: number = 0; v < position.count; ++v)
        farthest = Math.max(
          farthest,
          centre.distanceToSquared(_point.fromBufferAttribute(position, v)),
        );
      this.rest = {
        geometry,
        version,
        centre,
        radius: Math.sqrt(farthest),
        used: AutoMovieSkinBlend.usedJoints(indices, weights),
      };
    }

    // Each weighted joint's image of the rest centre; the anchor is the one
    // whose farthest other image is nearest.
    const used: Int32Array = this.rest.used;
    const t: Float64Array = AutoMovieSkinPose.table(mesh.skeleton.bones.length);
    const images: THREE.Vector3[] = [];
    for (const slot of used) {
      AutoMovieSkinPose.joint(mesh, slot, t, slot * STRIDE);
      _matrix.fromArray(t, slot * STRIDE);
      images.push(this.rest.centre.clone().applyMatrix4(_matrix));
    }
    let anchor: number = 0;
    let spread: number = Infinity;
    images.forEach((image: THREE.Vector3, k: number): void => {
      let reach: number = 0;
      for (const other of images)
        reach = Math.max(reach, image.distanceTo(other));
      if (reach < spread) {
        spread = reach;
        anchor = k;
      }
    });
    if (images.length === 0) return false;

    // Dual quaternions: the aligned blend's rotation norm is at least the
    // least |q_k . q_l|, which divides the anchor-relative translation.
    if (mesh.method === "dual-quaternion") {
      let least: number = 1;
      for (const k of used)
        for (const l of used) {
          const dot: number = Math.abs(
            t[k * STRIDE + 16]! * t[l * STRIDE + 16]! +
              t[k * STRIDE + 17]! * t[l * STRIDE + 17]! +
              t[k * STRIDE + 18]! * t[l * STRIDE + 18]! +
              t[k * STRIDE + 19]! * t[l * STRIDE + 19]!,
          );
          if (dot < least) least = dot;
        }
      if (!(least > MINIMUM_ALIGNMENT)) return false;
      spread /= least;
    }
    sphere.center.copy(images[anchor]!);
    const radius: number = this.rest.radius + spread;
    sphere.radius =
      radius +
      (sphere.center.length() + radius) * AutoMovieSkinBlend.GPU_RELATIVE_ERROR;
    return true;
  }

  /**
   * Write joint `j`'s `K_j`, rotation and dual part into `out` at `offset`.
   *
   * @param mesh The mesh whose bind matrices conjugate the bone transform.
   * @param j Skeleton slot.
   * @param out Joint table.
   * @param offset Start of the joint's entry.
   *
   * @evidence contracts/development/implementation.md#principled-implementation K_j as the shader forms it from Three's boneMatrices and attached bind, rotation by Shepperd's method in Three's branch order, dual part 0.5 (t, 0) q.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One writer of table entries for the key, the sphere and single queries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bone or inverse reads identity, as Three's Skeleton does.
   * @evidence contracts/development/common.md#meaningful-documentation States the entry layout.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three 4x4 products and one quaternion extraction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Callers write each joint once per query.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Uses module scratch only.
   */
  public static joint(
    mesh: AutoMovieSkinPose.IMesh,
    j: number,
    out: Float64Array,
    offset: number,
  ): void {
    const bone: THREE.Bone | undefined = mesh.skeleton.bones[j];
    _matrix.multiplyMatrices(
      bone === undefined ? IDENTITY : bone.matrixWorld,
      mesh.skeleton.boneInverses[j] ?? IDENTITY,
    );
    _matrix.premultiply(mesh.bindMatrixInverse).multiply(mesh.bindMatrix);
    const e: number[] = _matrix.elements;
    for (let i: number = 0; i < 16; ++i) out[offset + i] = e[i]!;
    if (mesh.method !== "dual-quaternion") return;
    _rotation.setFromRotationMatrix(_matrix);
    const tx: number = e[12]!;
    const ty: number = e[13]!;
    const tz: number = e[14]!;
    const { x, y, z, w }: THREE.Quaternion = _rotation;
    out[offset + 16] = x;
    out[offset + 17] = y;
    out[offset + 18] = z;
    out[offset + 19] = w;
    out[offset + 20] = 0.5 * (tx * w + ty * z - tz * y);
    out[offset + 21] = 0.5 * (-tx * z + ty * w + tz * x);
    out[offset + 22] = 0.5 * (tx * y - ty * x + tz * w);
    out[offset + 23] = 0.5 * (-tx * x - ty * y - tz * z);
  }

  /** The shared joint table, grown to at least `bones` entries. */
  private static table(bones: number): Float64Array {
    if (scratch.length < bones * STRIDE)
      scratch = new Float64Array(bones * STRIDE);
    return scratch;
  }
}

export namespace AutoMovieSkinPose {
  /**
   * What a pose reads from its mesh.
   *
   * @evidence contracts/development/design.md#principled-representation The SkinnedMesh members the shader's blend depends on, plus the blend method.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Avoids a circular class dependency on the mesh.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read-only use.
   * @evidence contracts/development/common.md#meaningful-documentation Names each dependency.
   */
  export interface IMesh extends Pick<
    THREE.SkinnedMesh,
    | "geometry"
    | "skeleton"
    | "morphTargetInfluences"
    | "bindMatrix"
    | "bindMatrixInverse"
  > {
    /** Blend the shader draws this skin with. */
    method: NonNullable<IAutoMovieMeshSkin["method"]>;
  }
}

const STRIDE: number = AutoMovieSkinBlend.STRIDE;

/** Least pairwise |q_k . q_l| the joint-only sphere accepts; below it the bound is too loose and the vertices decide. */
const MINIMUM_ALIGNMENT: number = 0.25;

/** Joint table of the mesh being evaluated, indexed by skeleton slot. */
let scratch: Float64Array = new Float64Array(0);

const IDENTITY: THREE.Matrix4 = new THREE.Matrix4();
const _matrix: THREE.Matrix4 = new THREE.Matrix4();
const _rotation: THREE.Quaternion = new THREE.Quaternion();
const _point: THREE.Vector3 = new THREE.Vector3();
