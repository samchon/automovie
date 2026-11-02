import type {
  AutoMovieHumanoidBone,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import {
  type IAutoMovieTextureResolver,
  buildModel,
  collectAutoMovieOwnedResources,
  reportAutoMovieResourceRetirement,
} from "@automovie/viewer";
import * as THREE from "three";

import type { AutoMovieHumanInstance } from "../../../src/index";
import { AutoMovieHumanSkinInstance } from "./AutoMovieHumanSkinInstance.js";

/**
 * The immutable GPU assets of one prepared Human, shared by every instance of
 * that person.
 *
 * `buildModel` builds the model once; its geometry (positions, normals, UVs,
 * colours, relief weights, indices, skin indices and weights), its materials
 * with their skinning and relief patches, the dual quaternion shadow
 * materials and each joint list's inverse bind matrices are kept, and the
 * built graph and its per-part skeletons are discarded. {@link instantiate}
 * then makes an independent scene graph whose meshes reference those shared
 * objects and whose bones, skeletons, root and culling state are its own.
 * Nothing shared is written after creation: an instance binds with the
 * stored bind matrix, so Three never recomputes the shared inverses, and
 * pose, root and culling live on the instance's objects.
 *
 * The asset owns the shared geometry and materials; textures stay with the
 * resolver's owner (the caller's texture cache). Each instance owns its
 * skeletons, whose disposal releases their bone textures. The asset refuses
 * disposal while an instance is alive, so no instance can draw a retired
 * buffer, and it is retired once.
 *
 * @evidence contracts/common.md#principled-implementation Shares BufferGeometry and Material objects across SkinnedMeshes, which Three supports because skin indices and weights live in the geometry and bone matrices in each mesh's Skeleton; shared inverse bind matrices stay valid because instances bind with an explicit bind matrix and every instance's bones start at the same rig rest.
 * @evidence contracts/common.md#clear-and-simple-design Reuses buildModel for every geometry, material, relief and skinning decision and only separates shared resources from per-instance graph state; the pure Human instance owns pose semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A model without a rig, a mesh that buildModel did not make, or disposal with live instances throws; no Three method is replaced and no part is special-cased by name.
 * @evidence contracts/common.md#meaningful-documentation States which resources are shared, which belong to an instance, texture ownership and the disposal order.
 * @evidence contracts/performance.md#efficient-algorithms Creation is one buildModel plus one O(P) pass over parts and one inverse-bind copy per distinct joint list; instantiation allocates O(B) bones, one skeleton per joint list and O(P) meshes without copying any vertex buffer.
 * @evidence contracts/performance.md#reuse-equivalent-work Every instance of one prepared shape reuses the same GPU buffers, compiled programs and shadow materials; equivalence is the prepared shape's identity, so another shape needs another asset.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the shared geometries, materials and inverse binds of one model until dispose, which runs once after the last instance is disposed; a failed creation retires everything buildModel made.
 */
export class AutoMovieHumanSkinAsset {
  /** The rig instances build their bones from, at the bind. */
  public readonly skeleton: IAutoMovieSkeleton;

  /** Model display name for each instance's root group. */
  private readonly name: string;

  /** Shared per-part drawing records, in model order. */
  private readonly records: AutoMovieHumanSkinAsset.IPart[];

  /** Inverse bind matrices per joint list, shared read-only. */
  private readonly inverses: Map<string, readonly THREE.Matrix4[]>;

  /** Shared geometry and materials this asset retires. */
  private readonly owned: readonly { dispose(): void }[];

  /** Instances alive now. */
  private live: number = 0;

  /** Terminal state. */
  private disposed: boolean = false;

  private constructor(
    skeleton: IAutoMovieSkeleton,
    name: string,
    records: AutoMovieHumanSkinAsset.IPart[],
    inverses: Map<string, readonly THREE.Matrix4[]>,
    owned: readonly { dispose(): void }[],
  ) {
    this.skeleton = skeleton;
    this.name = name;
    this.records = records;
    this.inverses = inverses;
    this.owned = owned;
  }

  /**
   * Build one prepared model's shared assets.
   *
   * @param model The prepared shape's model, at the bind, with its rig.
   * @param resolveTexture The caller's primed texture resolver.
   * @returns The asset; a failure retires what was built and rethrows.
   *
   * @evidence contracts/common.md#principled-implementation Builds through buildModel, snapshots its owned resources, copies each part's mesh references, transform and bind matrix and each joint list's inverses, then retires the prototype skeletons, which never drew.
   * @evidence contracts/common.md#clear-and-simple-design The one constructor path; the prototype graph is internal and never displayed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses a model without a skeleton or with a part buildModel did not realize as a single-material mesh, rather than drawing it incompletely.
   * @evidence contracts/common.md#meaningful-documentation States the resolver's ownership and the failure behaviour.
   * @evidence contracts/performance.md#efficient-algorithms Dominated by buildModel's O(V) buffer work; the record pass is O(P) and the inverse copy O(B) per joint list.
   * @evidence contracts/performance.md#reuse-equivalent-work The resolver's textures are borrowed, not decoded again.
   * @evidence contracts/performance.md#bound-retention-and-release-resources On failure every geometry, material, shadow material and skeleton buildModel made is retired before the error propagates.
   */
  public static create(
    model: IAutoMovieModel,
    resolveTexture?: IAutoMovieTextureResolver,
  ): AutoMovieHumanSkinAsset {
    const skeleton: IAutoMovieSkeleton | null = model.skeleton;
    if (skeleton === null)
      throw new Error("A Human skin asset needs the model's rig");
    const built: ReturnType<typeof buildModel> = buildModel(
      model,
      resolveTexture,
    );
    const resources: readonly { dispose(): void }[] =
      collectAutoMovieOwnedResources(built.object);
    try {
      const records: AutoMovieHumanSkinAsset.IPart[] = [];
      const inverses: Map<string, readonly THREE.Matrix4[]> = new Map();
      for (const part of model.parts) {
        const object: THREE.Object3D | undefined = built.parts.get(part.id);
        if (!(object instanceof THREE.Mesh) || Array.isArray(object.material))
          throw new Error(
            `Human part ${part.id} was not built as a single-material mesh`,
          );
        const joints: AutoMovieHumanSkinAsset.IPart["joints"] =
          object instanceof THREE.SkinnedMesh ? jointsOf(part) : null;
        if (
          object instanceof THREE.SkinnedMesh &&
          joints !== null &&
          !inverses.has(joints.key)
        )
          inverses.set(
            joints.key,
            object.skeleton.boneInverses.map(
              (m: THREE.Matrix4): THREE.Matrix4 => m.clone(),
            ),
          );
        records.push({
          id: part.id,
          prototype: object,
          name: object.name,
          geometry: object.geometry,
          material: object.material,
          depth: object.customDepthMaterial,
          distance: object.customDistanceMaterial,
          joints,
          bind:
            object instanceof THREE.SkinnedMesh
              ? object.bindMatrix.clone()
              : null,
          attachedBone: part.attachedBone,
          position: object.position.clone(),
          quaternion: object.quaternion.clone(),
          scale: object.scale.clone(),
          userData: structuredClone(object.userData),
        });
      }

      // The prototype graph never drew, so its skeletons hold no bone
      // texture; they and the graph are dropped, the shared meshes kept.
      const skeletons: THREE.Skeleton[] = resources.filter(
        (r: { dispose(): void }): r is THREE.Skeleton =>
          r instanceof THREE.Skeleton,
      );
      reportAutoMovieResourceRetirement(
        skeletons.map(
          (s: THREE.Skeleton): (() => void) =>
            (): void =>
              s.dispose(),
        ),
      );
      built.object.clear();
      return new AutoMovieHumanSkinAsset(
        skeleton,
        model.name ?? model.id,
        records,
        inverses,
        resources.filter(
          (r: { dispose(): void }): boolean => !(r instanceof THREE.Skeleton),
        ),
      );
    } catch (error: unknown) {
      reportAutoMovieResourceRetirement(
        resources.map(
          (r: { dispose(): void }): (() => void) =>
            (): void =>
              r.dispose(),
        ),
        { error },
      );
      throw error;
    }
  }

  /** Instances alive now. */
  public get instances(): number {
    return this.live;
  }

  /**
   * Make one independent instance on this asset.
   *
   * @param body The prepared shape's evaluator and the same rig.
   * @param initial The instance's first state; see `AutoMovieHumanInstance`.
   * @returns A new instance, displaying the bind until it is shown posed.
   *
   * @evidence contracts/common.md#principled-implementation Hands the shared records to a new instance, whose pure state admits the initial pose and whose graph binds to this asset's inverses.
   * @evidence contracts/common.md#clear-and-simple-design The asset counts lifetimes; the instance owns its graph and state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A disposed asset or a body whose rig differs from the model's refuses instead of binding a foreign skeleton.
   * @evidence contracts/common.md#meaningful-documentation States the initial display and ownership.
   * @evidence contracts/performance.md#efficient-algorithms O(B + P) objects and no vertex copy.
   * @evidence contracts/performance.md#reuse-equivalent-work Every instance references the same buffers and materials.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Increments the live count, which the instance's dispose decrements exactly once.
   */
  public instantiate(
    body: AutoMovieHumanInstance.IBody,
    initial?: Partial<AutoMovieHumanInstance.IState>,
  ): AutoMovieHumanSkinInstance {
    if (this.disposed) throw new Error("Human skin asset is disposed");
    if (
      body.skeleton === null ||
      body.skeleton.id !== this.skeleton.id ||
      body.skeleton.bones.length !== this.skeleton.bones.length ||
      body.skeleton.bones.some(
        (b: IAutoMovieSkeleton["bones"][number], i: number): boolean =>
          b.bone !== this.skeleton.bones[i]!.bone,
      )
    )
      throw new Error("Human instance body does not carry this asset's rig");
    let released: boolean = false;
    const instance: AutoMovieHumanSkinInstance = new AutoMovieHumanSkinInstance(
      {
        name: this.name,
        skeleton: this.skeleton,
        parts: this.records,
        inverses: this.inverses,
      },
      body,
      initial,
      (): void => {
        if (released) return;
        released = true;
        this.live--;
      },
    );
    this.live++;
    return instance;
  }

  /**
   * Retire the shared geometry and materials once no instance remains.
   *
   * @evidence contracts/common.md#principled-implementation Disposes each shared geometry, material and shadow material once through the shared retirement collector.
   * @evidence contracts/common.md#clear-and-simple-design The single release of the shared resources; textures remain the resolver owner's.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Throws while an instance is alive instead of leaving it drawing retired buffers; a failed release propagates.
   * @evidence contracts/common.md#meaningful-documentation States the live-instance refusal and the single attempt.
   * @evidence contracts/performance.md#efficient-algorithms Linear in shared resources; repeated calls are constant.
   * @evidence contracts/performance.md#reuse-equivalent-work Nothing survives; a new shape builds a new asset.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Marks the asset terminal before one attempt per resource, so an uncertain release is never retried as known.
   */
  public dispose(): void {
    if (this.disposed) return;
    if (this.live !== 0)
      throw new Error(
        `Human skin asset still has ${this.live} live instance(s)`,
      );
    this.disposed = true;
    reportAutoMovieResourceRetirement(
      this.owned.map(
        (r: { dispose(): void }): (() => void) =>
          (): void =>
            r.dispose(),
      ),
    );
  }
}

/** Shared records an instance builds from. */
export namespace AutoMovieHumanSkinAsset {
  /**
   * One part's shared drawing and its placement at the bind.
   *
   * @evidence contracts/common.md#principled-implementation Holds the exact objects and local transform buildModel produced for the part.
   * @evidence contracts/common.md#clear-and-simple-design One record per part replaces the prototype graph.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts References are shared read-only; an instance writes none of them.
   * @evidence contracts/common.md#meaningful-documentation Each field states its role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record chooses no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record itself coordinates no reuse; the asset does.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The asset owns the referenced resources.
   */
  export interface IPart {
    /** Model part id. */
    id: string;

    /**
     * The mesh buildModel made, detached and never drawn. An instance clones
     * it without children, so it keeps whatever mesh class, blend method and
     * flags buildModel chose, then rebinds the clone to its own skeleton.
     */
    prototype: THREE.Mesh;

    /** Mesh name. */
    name: string;

    /** Shared geometry. */
    geometry: THREE.BufferGeometry;

    /** Shared material. */
    material: THREE.Material;

    /** Shared dual quaternion depth material, if any. */
    depth: THREE.Material | undefined;

    /** Shared dual quaternion distance material, if any. */
    distance: THREE.Material | undefined;

    /** A skinned part's joint list and its key, or null for a rigid one. */
    joints: { key: string; bones: readonly AutoMovieHumanoidBone[] } | null;

    /** Bind matrix of a skinned part, or null. */
    bind: THREE.Matrix4 | null;

    /** Bone a rigid part rides, or null. */
    attachedBone: AutoMovieHumanoidBone | null;

    /** Local translation at the bind. */
    position: THREE.Vector3;

    /** Local rotation at the bind. */
    quaternion: THREE.Quaternion;

    /** Local scale. */
    scale: THREE.Vector3;

    /** buildModel's flags and driver records, copied per instance. */
    userData: Record<string, unknown>;
  }

  /**
   * Everything an instance needs from its asset.
   *
   * @evidence contracts/common.md#principled-implementation Bundles the rig, shared part records and inverses of one asset.
   * @evidence contracts/common.md#clear-and-simple-design Keeps the instance independent of the asset class.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Read-only for the instance.
   * @evidence contracts/common.md#meaningful-documentation Each field states its role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record chooses no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The asset coordinates reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The asset owns the referenced resources.
   */
  export interface ITemplate {
    /** Root group name. */
    name: string;

    /** The rig at the bind. */
    skeleton: IAutoMovieSkeleton;

    /** Shared part records. */
    parts: readonly IPart[];

    /** Shared inverse bind matrices per joint list. */
    inverses: ReadonlyMap<string, readonly THREE.Matrix4[]>;
  }
}

/** A skinned part's joint list, keyed by its names in order. */
function jointsOf(
  part: IAutoMovieModelPart,
): AutoMovieHumanSkinAsset.IPart["joints"] {
  if (part.geometry.type !== "mesh" || part.geometry.mesh.skin === null)
    throw new Error(`Human part ${part.id} was skinned without a skin`);
  const bones: AutoMovieHumanoidBone[] = [...part.geometry.mesh.skin.joints];
  return { key: bones.join(","), bones };
}
