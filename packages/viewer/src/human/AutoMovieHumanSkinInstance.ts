import type {
  AutoMovieHumanChange,
  AutoMovieHumanRig,
  AutoMovieHumanSkeleton,
} from "@automovie/human";
import { AutoMovieHumanInstance } from "@automovie/human/instance";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieModelObject } from "../IAutoMovieModelObject.js";
import { invalidateAutoMovieSkinnedPose } from "../invalidateAutoMovieSkinnedPose.js";
import { reportAutoMovieResourceRetirement } from "../reportAutoMovieResourceRetirement.js";
import type { AutoMovieHumanSkinAsset } from "./AutoMovieHumanSkinAsset.js";

/**
 * One independently posed Human on a shared {@link AutoMovieHumanSkinAsset}.
 *
 * The instance owns its scene graph (root group, bones, one skeleton per joint
 * list and its meshes, which reference the asset's shared geometry and
 * materials) and its pure `AutoMovieHumanInstance` state. Deformation is the
 * GPU's: the meshes are skinned in the vertex shader (dual quaternion where the
 * skin asks for it, in the beauty and both shadow passes) from the skeleton's
 * bone texture, so an update writes bone transforms and never a vertex. A
 * Human skin binds every part to the same joint list, so one skeleton serves
 * every part: the renderer updates and uploads its bone matrices once a frame
 * instead of once per part.
 *
 * Display is either `bind`, the posture the skin was generated in, or `pose`,
 * the instance's clinical state. An update is planned by the pure instance,
 * written to the bones only while the pose is displayed, and committed after
 * the write; an inadmissible update throws before anything moves and leaves
 * the previous state shown. Only bones whose local transform changed are
 * written, and the root placement moves the whole graph. Object, mesh,
 * geometry and material identities never change across updates.
 *
 * The parts are `buildModel`'s `AutoMovieSkinnedMesh` class, cloned, so
 * every write that moves a joint starts their pose revision: culling, shadows,
 * framing and picking read safe posed bounds and the posed vertices, and
 * culling stays on in every posture.
 *
 * @evidence contracts/common.md#principled-implementation Writes parent-local bone translations and rotations from AutoMovieHumanRig.locals of the admitted pose onto the instance's bones, which Three's skeleton turns into the bone texture the existing skinning shaders read; the root writes the group's TRS.
 * @evidence contracts/common.md#clear-and-simple-design Pose semantics, admission, equivalence and rollback stay in AutoMovieHumanInstance; this class owns only its Three graph and the write of an admitted plan.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry is rebuilt or rewritten on the CPU; an unchanged bone is skipped only when every local component rounds to the same float32 as the written value, the bone texture's own resolution, not by a tuned tolerance; a failed plan or a disposed instance throws.
 * @evidence contracts/common.md#meaningful-documentation States the GPU deformation authority, the bind/pose display, the plan-write-commit order, culling and identity guarantees.
 * @evidence contracts/performance.md#efficient-algorithms An update costs one skeleton evaluation (about 0.6 ms for f1) plus at most B bone writes and a world update of the bone subtree, or of the whole graph when the root moved, and one constant-time pose revision per part when a joint moved; nothing here scales with vertices, while the next frame's culling spheres cost O(U^2) per part in AutoMovieSkinnedMesh.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the asset's buffers and programs, reuses the pure instance's cached evaluation for an equal pose, and skips writes for bones whose values are unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns its bones, skeletons and meshes; dispose retires the skeletons' bone textures, detaches the graph and releases the asset's live count exactly once.
 */
export class AutoMovieHumanSkinInstance implements IAutoMovieModelObject {
  /** Root group; add it to a scene. */
  public readonly object: THREE.Group;

  /** Bones by rig slot. */
  public readonly bones: ReadonlyMap<AutoMovieHumanoidBone, THREE.Bone>;

  /** Meshes by model part id. */
  public readonly parts: ReadonlyMap<string, THREE.Object3D>;

  /** The rig at the bind. */
  private readonly rig: AutoMovieHumanSkinAsset.ITemplate["skeleton"];

  /** Pure state of this instance. */
  private readonly human: AutoMovieHumanInstance;

  /** Owned skeletons, one per joint list. */
  private readonly skeletons: THREE.Skeleton[];

  /** Last written local transform per bone, `[tx, ty, tz, qx, qy, qz, qw]`. */
  private readonly written: Map<AutoMovieHumanoidBone, number[]> = new Map();

  /** Releases the asset's live count. */
  private release: (() => void) | undefined;

  /** Which posture is displayed. */
  private shown: "bind" | "pose" = "bind";

  /** Bones written by the last display write. */
  private touched: number = 0;

  /** Whether the root moved since the last world update. */
  private moved: boolean = false;

  /**
   * Build the graph on shared records; use `AutoMovieHumanSkinAsset.instantiate`.
   *
   * @param template The asset's shared records.
   * @param body The prepared evaluator and rig.
   * @param initial First state.
   * @param release Decrements the asset's live count.
   */
  public constructor(
    template: AutoMovieHumanSkinAsset.ITemplate,
    body: AutoMovieHumanInstance.IBody,
    initial: Partial<AutoMovieHumanInstance.IState> | undefined,
    release: () => void,
  ) {
    this.human = new AutoMovieHumanInstance(body, initial);
    this.rig = template.skeleton;
    const group: THREE.Group = new THREE.Group();
    group.name = template.name;
    const bones: Map<AutoMovieHumanoidBone, THREE.Bone> = new Map();
    for (const b of template.skeleton.bones) {
      const bone: THREE.Bone = new THREE.Bone();
      bone.name = b.bone;
      bone.position.set(
        b.rest.translation.x,
        b.rest.translation.y,
        b.rest.translation.z,
      );
      bone.quaternion.set(
        b.rest.rotation.x,
        b.rest.rotation.y,
        b.rest.rotation.z,
        b.rest.rotation.w,
      );
      bones.set(b.bone, bone);
    }
    for (const b of template.skeleton.bones)
      (b.parent === null ? group : bones.get(b.parent)!).add(
        bones.get(b.bone)!,
      );
    group.updateMatrixWorld(true);

    // One skeleton per joint list, bound to the shared inverse binds.
    const skeletons: Map<string, THREE.Skeleton> = new Map();
    const parts: Map<string, THREE.Object3D> = new Map();
    for (const part of template.parts) {
      // A shallow clone shares the geometry and material and keeps the mesh
      // class buildModel chose; the skeleton reference it copies is replaced.
      const mesh: THREE.Mesh = part.prototype.clone(false);
      mesh.geometry = part.geometry;
      mesh.material = part.material;
      mesh.name = part.name;
      mesh.position.copy(part.position);
      mesh.quaternion.copy(part.quaternion);
      mesh.scale.copy(part.scale);
      mesh.userData = structuredClone(part.userData);
      if (part.depth !== undefined) mesh.customDepthMaterial = part.depth;
      if (part.distance !== undefined)
        mesh.customDistanceMaterial = part.distance;
      parts.set(part.id, mesh);
      if (mesh instanceof THREE.SkinnedMesh && part.joints !== null) {
        let skeleton: THREE.Skeleton | undefined = skeletons.get(
          part.joints.key,
        );
        if (skeleton === undefined) {
          skeleton = new THREE.Skeleton(
            part.joints.bones.map(
              (joint: AutoMovieHumanoidBone): THREE.Bone => {
                const bone: THREE.Bone | undefined = bones.get(joint);
                if (bone === undefined)
                  throw new Error(`Human skin names a missing bone ${joint}`);
                return bone;
              },
            ),
            [...template.inverses.get(part.joints.key)!],
          );
          skeletons.set(part.joints.key, skeleton);
        }
        group.add(mesh);
        mesh.updateMatrixWorld(false);

        // The explicit bind matrix keeps Three from recomputing inverses.
        mesh.bind(skeleton, part.bind!);
      } else if (part.attachedBone !== null) {
        const bone: THREE.Bone | undefined = bones.get(part.attachedBone);
        if (bone === undefined)
          throw new Error(
            `Human part ${part.id} rides a missing bone ${part.attachedBone}`,
          );
        bone.add(mesh);
      } else group.add(mesh);
    }
    this.object = group;
    this.bones = bones;
    this.parts = parts;
    this.skeletons = [...skeletons.values()];
    this.release = release;
    this.write(this.human.bindLocals());
  }

  /** Independent copy of the pure state. */
  public get state(): AutoMovieHumanInstance.IState {
    return this.human.state;
  }

  /** Commits of the pure state so far. */
  public get revision(): number {
    return this.human.revision;
  }

  /** Which posture is displayed. */
  public get display(): "bind" | "pose" {
    return this.shown;
  }

  /** Bones the last display write changed. */
  public get writtenBones(): number {
    return this.touched;
  }

  /** Clamps the evaluator applied to the current pose. */
  public get clamped(): AutoMovieHumanSkeleton.IClamp[] {
    return this.human.clamped;
  }

  /** Skeletons this instance owns, for inspection; never dispose them directly. */
  public get skeletonCount(): number {
    return this.skeletons.length;
  }

  /**
   * The current state as an engine pose, through the admitted adapter.
   *
   * @evidence contracts/common.md#principled-implementation Delegates to AutoMovieHumanInstance.enginePose, which refuses poses the engine rig cannot carry.
   * @evidence contracts/common.md#clear-and-simple-design Exposes the pure adapter beside the drawing that shows the same state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No cast; a refused pose throws.
   * @evidence contracts/common.md#meaningful-documentation States the delegation and refusal.
   * @evidence contracts/performance.md#efficient-algorithms O(B) angle extraction over the cached evaluation.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the current evaluation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a caller-owned pose.
   */
  public enginePose(): IAutoMoviePose {
    return this.human.enginePose();
  }

  /**
   * Change the state; the bones follow while the pose is displayed.
   *
   * @param update Snapshot or patch, admitted by the pure instance.
   * @returns The classes that changed.
   *
   * @evidence contracts/common.md#principled-implementation Plans, writes the plan's locals and root, then commits, so a refused update moves nothing and keeps the previous state.
   * @evidence contracts/common.md#clear-and-simple-design The pure instance owns admission and equivalence; this method sequences the Three write between plan and commit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Inadmissible input throws from the plan before any bone moves.
   * @evidence contracts/common.md#meaningful-documentation States the order and the returned classes.
   * @evidence contracts/performance.md#efficient-algorithms One evaluation for a changed pose and at most B bone writes; an equal state writes nothing.
   * @evidence contracts/performance.md#reuse-equivalent-work An equal pose reuses the cached evaluation and skips every write.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the committed state and the last written values.
   */
  public update(
    update: AutoMovieHumanInstance.IUpdate,
  ): AutoMovieHumanChange.Class[] {
    const plan: AutoMovieHumanInstance.IPlan = this.human.plan(update);
    this.touched = 0;
    if (this.shown === "pose" && plan.changed.length !== 0) {
      const locals: ReadonlyMap<
        AutoMovieHumanoidBone,
        AutoMovieHumanRig.ILocal
      > = this.human.localsOf(plan);
      this.place(plan.state.root);
      this.write(locals);
    }
    this.human.commit(plan);
    return [...plan.changed];
  }

  /**
   * Display the bind, the posture the skin was generated in, keeping the state.
   *
   * @evidence contracts/common.md#principled-implementation Writes the rig's bind locals, which leave the skin exactly as generated.
   * @evidence contracts/common.md#clear-and-simple-design Inspection display, separate from the clinical state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The state keeps its pose; showing the bind is not a pose.
   * @evidence contracts/common.md#meaningful-documentation States that the state is kept.
   * @evidence contracts/performance.md#efficient-algorithms At most B writes.
   * @evidence contracts/performance.md#reuse-equivalent-work Unchanged bones are skipped.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires nothing.
   */
  public showBind(): void {
    this.open();
    this.place(this.human.state.root);
    this.write(this.human.bindLocals());
    this.cull("bind");
  }

  /**
   * Display the current clinical state.
   *
   * @evidence contracts/common.md#principled-implementation Writes the cached evaluation's rig locals and the root.
   * @evidence contracts/common.md#clear-and-simple-design The inverse of showBind.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Evaluation failures propagate before any write.
   * @evidence contracts/common.md#meaningful-documentation States what is written.
   * @evidence contracts/performance.md#efficient-algorithms One evaluation at most and at most B writes.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the cached evaluation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires nothing.
   */
  public showPose(): void {
    this.open();
    const locals: ReadonlyMap<AutoMovieHumanoidBone, AutoMovieHumanRig.ILocal> =
      this.human.locals();
    this.place(this.human.state.root);
    this.write(locals);
    this.cull("pose");
  }

  /**
   * Retire this instance's skeletons and graph; the shared asset stays.
   *
   * @evidence contracts/common.md#principled-implementation Disposes each owned skeleton, which releases its bone texture, detaches and empties the graph and releases the asset's count.
   * @evidence contracts/common.md#clear-and-simple-design The instance retires only what it made; the asset retires shared resources.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared geometry and materials are never disposed here; a failed skeleton release propagates after every step is attempted.
   * @evidence contracts/common.md#meaningful-documentation States what is and is not released.
   * @evidence contracts/performance.md#efficient-algorithms Linear in skeletons and parts; a repeat is constant.
   * @evidence contracts/performance.md#reuse-equivalent-work The asset remains for other instances.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Releases the asset count exactly once, even when a step fails.
   */
  public dispose(): void {
    const release: (() => void) | undefined = this.release;
    if (release === undefined) return;
    this.release = undefined;
    reportAutoMovieResourceRetirement([
      ...this.skeletons.map(
        (s: THREE.Skeleton): (() => void) =>
          (): void =>
            s.dispose(),
      ),
      (): void => {
        this.object.removeFromParent();
      },
      (): void => {
        this.object.clear();
      },
      (): void => this.human.dispose(),
      release,
    ]);
  }

  /** Write the root placement, marking the graph for a full world update when it moved. */
  private place(root: AutoMovieHumanInstance.IState["root"]): void {
    const [x, y, z] = root.translation;
    const [qx, qy, qz, qw] = root.rotation;
    const p: THREE.Vector3 = this.object.position;
    const q: THREE.Quaternion = this.object.quaternion;
    if (
      p.x === x &&
      p.y === y &&
      p.z === z &&
      q.x === qx &&
      q.y === qy &&
      q.z === qz &&
      q.w === qw
    )
      return;
    p.set(x, y, z);
    q.set(qx, qy, qz, qw);
    this.moved = true;
  }

  /** Write the bones whose locals changed and update their world matrices. */
  private write(
    locals: ReadonlyMap<AutoMovieHumanoidBone, AutoMovieHumanRig.ILocal>,
  ): void {
    // Every name is checked before the first write, so a foreign pose moves nothing.
    for (const name of locals.keys())
      if (!this.bones.has(name))
        throw new Error(`Human pose names a missing bone: ${name}`);
    // Rig locals come from world placements through the parent's inverse, so
    // a bone below a moved joint returns its old local within float64
    // rounding. The bone texture holds float32, so a local whose every
    // component rounds to the same float32 as the written one differs from
    // the drawn bone by less than that texture resolves and is not written;
    // only the joints the update actually turned are.
    let touched: number = 0;
    for (const [name, local] of locals) {
      const bone: THREE.Bone = this.bones.get(name)!;
      const values: number[] = [...local.translation, ...local.rotation];
      const before: number[] | undefined = this.written.get(name);
      if (
        before !== undefined &&
        before.every(
          (v: number, i: number): boolean =>
            Math.fround(v) === Math.fround(values[i]!),
        )
      )
        continue;
      bone.position.set(values[0]!, values[1]!, values[2]!);
      bone.quaternion.set(values[3]!, values[4]!, values[5]!, values[6]!);
      this.written.set(name, values);
      touched++;
    }
    this.touched = touched;

    // A moved root moves every mesh; otherwise only the bone tree changed.
    if (this.moved) {
      this.object.updateMatrixWorld(true);
      this.moved = false;
    } else if (touched !== 0)
      for (const b of this.rig.bones)
        if (b.parent === null) this.bones.get(b.bone)!.updateMatrixWorld(true);

    // Moved joints start a pose revision of the skinned parts, whose culling
    // spheres, boxes and vertex queries then follow the drawn pose; a root move
    // alone cancels in the skin's local joint transforms and needs none.
    if (touched !== 0) invalidateAutoMovieSkinnedPose(this.object);
  }

  /** Record which posture is displayed; culling stays on, on posed bounds. */
  private cull(display: "bind" | "pose"): void {
    this.shown = display;
  }

  /** Refuse use after disposal. */
  private open(): void {
    if (this.release === undefined)
      throw new Error("Human skin instance is disposed");
  }
}
