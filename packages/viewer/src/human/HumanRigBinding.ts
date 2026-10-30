import type {
  IAutoMovieHumanPose,
  AutoMovieHumanSkeleton as Skeleton,
} from "@automovie/human";
import type { AutoMovieHumanController } from "@automovie/human/control";
import * as THREE from "three";

import { reportAutoMovieResourceRetirement } from "../reportAutoMovieResourceRetirement.js";
import { createHumanRigClip } from "./createHumanRigClip.js";
import { convertHumanRigPose } from "./convertHumanRigPose.js";
import type { IAutoMovieHumanVisual } from "./IAutoMovieHumanVisual.js";

/**
 * Bind one fixed Human rest prototype to original rigid drawings and Three tracks.
 * This owner samples supplied local seconds; it never advances a second clock.
 * Explicit poses retain the evaluator's jaw translations. Clip eye/jaw channels
 * are refused because this body-track path does not interpolate a face drawing.
 * Drawing placements retain the complete parent-relative matrix, including
 * inverse ancestor scale and shear. Their hierarchy stays fixed while bound;
 * finite invertible affine ancestors are admitted within numeric matrix range.
 * Target world updates belong to this binding; manually maintained ancestor
 * world matrices remain the caller's responsibility. Failed construction restores
 * borrowed matrices, update flags and the original root sibling position.
 *
 * @evidence contracts/common.md#principled-implementation Reuses existing Human pose outputs, parent-inverse transforms and standard Three quaternion tracks/Mixer.setTime; fixed offsets preserve segment lengths without world-joint blending.
 * @evidence contracts/common.md#clear-and-simple-design Owns rest snapshots, the rig, private clip cache and rigid placement; an input-only compiler assembles tracks, the facade owns semantic time and the supplied visual owns geometry and face construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit bone slots replace builder-name guessing; unsupported facial motion keys reject before playback rather than introducing a second FK or face sampler.
 * @evidence contracts/common.md#meaningful-documentation States frames, fixed-body premise, body-versus-explicit-pose behavior, original visual borrowing and defensive rest/clip snapshots.
 * @evidence contracts/performance.md#efficient-algorithms Preparation evaluates distinct authored poses once per clip and emits O(keys*bones) data; sampling traverses the bounded rig and placement slots, with parent-world updates for actual target frames.
 * @evidence contracts/performance.md#reuse-equivalent-work One immutable definition source and fixed prototype qualify each private named clip; Three bindings are reused while supplied time is sampled explicitly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed matrix snapshots live only until facade construction commits or rolls back; private clips grow only with admitted names, and disposal attempts rig/player cleanup without disposing borrowed visual resources.
 */
export class HumanRigBinding {
  /** Whole-character scene placement; callers move this root rather than drawing slots. */
  public readonly object: THREE.Group = new THREE.Group();

  /** Geometryless transform graph with exact custom Human identities. */
  private readonly rig: THREE.Group = new THREE.Group();

  /** Rest data is owned privately; public callers receive a clone. */
  private snapshot: Skeleton.IOutput;

  /** Fixed body's existing clinical evaluator, released on disposal. */
  private evaluator:
    | ((pose: IAutoMovieHumanPose) => Skeleton.IOutput)
    | undefined;

  /** Each bone's unique transform node. */
  private readonly nodes: Map<string, THREE.Object3D> = new Map();

  /** Original targets in visual parent-before-child order; resources remain borrowed. */
  private readonly slots: { node: THREE.Object3D; target: THREE.Object3D }[] =
    [];

  /** Standard player used only as an explicit-time sampler. */
  private readonly mixer: THREE.AnimationMixer;

  /** Compiled prototype-specific clips, never returned directly. */
  private readonly prepared: Map<string, THREE.AnimationClip> = new Map();

  /** Active Three action and semantic name, without transport state. */
  private action: THREE.AnimationAction | null = null;

  /** Last bound named clip. */
  private selected: string | null = null;

  /** Shared transform scratch; no frame-sized geometry allocation. */
  private readonly inverse: THREE.Matrix4 = new THREE.Matrix4();

  /** One temporary target-relative matrix. */
  private readonly matrix: THREE.Matrix4 = new THREE.Matrix4();

  /** Terminal binding lifetime. */
  private disposed: boolean = false;

  /** Borrowed drawing state retained only until facade construction commits. */
  private borrowed:
    | {
        object: THREE.Object3D;
        parent: THREE.Object3D | null;
        index: number;
        transforms: {
          object: THREE.Object3D;
          matrix: THREE.Matrix4;
          world: THREE.Matrix4;
          localAuto: boolean;
          worldAuto: boolean;
          dirty: boolean;
        }[];
      }
    | undefined;

  /** Bind original visual groups after admitting a finite parent-before-child rest graph. */
  public constructor(
    rest: Skeleton.IOutput,
    evaluator: (pose: IAutoMovieHumanPose) => Skeleton.IOutput,
    visual: IAutoMovieHumanVisual,
  ) {
    this.snapshot = structuredClone(rest);
    this.evaluator = evaluator;
    const bones: Map<string, Skeleton.IBone> = new Map();
    for (const bone of this.snapshot.bones) {
      if (
        bones.has(bone.bone) ||
        bone.position.length !== 3 ||
        !bone.position.every(Number.isFinite) ||
        (bone.parent !== null && !bones.has(bone.parent))
      )
        throw new Error(
          "Human binding needs distinct finite parent-before-child rest bones",
        );
      bones.set(bone.bone, bone);
    }
    if (bones.size === 0)
      throw new Error("Human binding needs a nonempty rest prototype");
    const targets: Set<THREE.Object3D> = new Set();
    const descendants: Map<THREE.Object3D, number> = new Map();
    visual.object.traverse((node: THREE.Object3D): void => {
      descendants.set(node, descendants.size);
    });
    for (const slot of visual.bindings) {
      if (!bones.has(slot.bone))
        throw new Error(`Unknown Human visual bone: ${slot.bone}`);
      for (const target of slot.objects) {
        if (
          !descendants.has(target) ||
          target === visual.object ||
          targets.has(target) ||
          target.scale.x !== 1 ||
          target.scale.y !== 1 ||
          target.scale.z !== 1
        )
          throw new Error(
            "Human visual targets need unique owned rigid placement groups",
          );
        targets.add(target);
      }
    }

    // Rest rotations are identity; the original Human evaluator owns these offsets.
    for (const bone of this.snapshot.bones) {
      const parent: THREE.Object3D =
        bone.parent === null ? this.rig : this.nodes.get(bone.parent)!;
      const node: THREE.Object3D = new THREE.Object3D();
      node.name = bone.bone;
      node.position.set(...bone.position);
      if (bone.parent !== null)
        node.position.sub(
          new THREE.Vector3(...bones.get(bone.parent)!.position),
        );
      parent.add(node);
      this.nodes.set(bone.bone, node);
    }
    for (const slot of visual.bindings)
      for (const target of slot.objects)
        this.slots.push({ node: this.nodes.get(slot.bone)!, target });
    this.slots.sort(
      (a: { target: THREE.Object3D }, b: { target: THREE.Object3D }): number =>
        descendants.get(a.target)! - descendants.get(b.target)!,
    );
    this.object.name = "human.character";
    this.rig.name = "human.motion";
    this.mixer = new THREE.AnimationMixer(this.rig);
    const local: Map<string, HumanRigBinding.ILocal> = this.pose(this.snapshot);
    this.borrowed = {
      object: visual.object,
      parent: visual.object.parent,
      index: visual.object.parent?.children.indexOf(visual.object) ?? -1,
      transforms: [],
    };
    visual.object.traverse((object: THREE.Object3D): void => {
      this.borrowed!.transforms.push({
        object,
        matrix: object.matrix.clone(),
        world: object.matrixWorld.clone(),
        localAuto: object.matrixAutoUpdate,
        worldAuto: object.matrixWorldAutoUpdate,
        dirty: object.matrixWorldNeedsUpdate,
      });
    });
    try {
      this.object.add(this.rig, visual.object);
      this.apply(local);
    } catch (error: unknown) {
      reportAutoMovieResourceRetirement([(): void => this.rollback()], {
        error,
      });
      throw error;
    }
  }

  /** Successful facade construction transfers placement ownership and releases rollback data.
   *
   * @evidence contracts/common.md#principled-implementation Releases rollback snapshots only after the facade has successfully accepted the original drawing.
   * @evidence contracts/common.md#clear-and-simple-design One explicit construction commit separates borrowed setup from transferred placement ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No drawing or GPU resource is disposed and no failed construction is silently committed.
   * @evidence contracts/common.md#meaningful-documentation Documents successful-construction timing and released restoration data.
   * @evidence contracts/performance.md#efficient-algorithms Clears one reference; collection of its stored matrix copies is left to ordinary memory lifetime.
   * @evidence contracts/performance.md#reuse-equivalent-work Subsequent operation uses the already-bound original targets without retaining redundant pre-bind state.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The borrowed root/matrix snapshot is released; visual disposal ownership remains with the facade.
   */
  public commit(): void {
    this.borrowed = undefined;
  }

  /** Restore borrowed parent order and matrices after failed construction, attempting every cleanup.
   *
   * @evidence contracts/common.md#principled-implementation Captures then clears borrowed setup state and independently attempts binding retirement, parent/sibling restoration and every original matrix/update flag.
   * @evidence contracts/common.md#clear-and-simple-design Construction rollback owns placement restoration while the original visual retains geometry ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Restoration failure propagates through the existing collector; no target is recreated or silently detached as a successful rollback.
   * @evidence contracts/common.md#meaningful-documentation States original parent order, matrices and independent cleanup attempts after failed construction.
   * @evidence contracts/performance.md#efficient-algorithms Traverses the captured target population once; stored matrix copies supply restoration without recomputation.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the exact captured objects and sibling index rather than guessing original placements.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Clears rollback ownership before one-attempt fan-out; missing borrowed state is a no-op and no visual resource is disposed.
   */
  public rollback(): void {
    const borrowed: typeof this.borrowed = this.borrowed;
    this.borrowed = undefined;
    if (borrowed === undefined) return;
    reportAutoMovieResourceRetirement([
      (): void => this.dispose(),
      (): void => {
        borrowed.object.removeFromParent();
      },
      (): void => {
        borrowed.parent?.add(borrowed.object);
      },
      (): void => {
        if (borrowed.parent === null) return;
        const index: number = borrowed.parent.children.indexOf(borrowed.object);
        if (index === -1 || borrowed.object.parent !== borrowed.parent)
          throw new Error("Human visual parent restoration failed");
        borrowed.parent.children.splice(index, 1);
        borrowed.parent.children.splice(borrowed.index, 0, borrowed.object);
      },
      ...borrowed.transforms.map(
        (state: (typeof borrowed.transforms)[number]): (() => void) =>
          (): void => {
            state.object.matrix.copy(state.matrix);
            state.object.matrixWorld.copy(state.world);
            state.object.matrixAutoUpdate = state.localAuto;
            state.object.matrixWorldAutoUpdate = state.worldAuto;
            state.object.matrixWorldNeedsUpdate = state.dirty;
          },
      ),
    ]);
  }

  /** Independent fixed-rest record. */
  public get rest(): Skeleton.IOutput {
    return structuredClone(this.snapshot);
  }

  /** Independent clip and typed-array copies; callers cannot edit the private player. */
  public get clips(): ReadonlyMap<string, THREE.AnimationClip> {
    return new Map(
      [...this.prepared].map(
        ([name, clip]: [string, THREE.AnimationClip]): [
          string,
          THREE.AnimationClip,
        ] => [name, clip.clone()],
      ),
    );
  }

  /** Prepare a named clip from the facade's one admitted definition snapshot.
   *
   * @evidence contracts/common.md#principled-implementation Compiles the supplied admitted definition against this fixed rest prototype and existing evaluator, once per private name.
   * @evidence contracts/common.md#clear-and-simple-design Track compilation stays in createHumanRigClip while this binding owns the resulting private cache.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The facade must supply its immutable admitted name/definition; no name-only reuse is claimed across different prototypes or definitions.
   * @evidence contracts/common.md#meaningful-documentation Documents prototype-specific preparation and the facade-owned definition premise.
   * @evidence contracts/performance.md#efficient-algorithms First preparation evaluates distinct keys and emits O(keys*bones) tracks; a prepared name returns immediately.
   * @evidence contracts/performance.md#reuse-equivalent-work The private name cache is valid because this binding's body and the facade's definition snapshot remain fixed.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains at most one clip per admitted prepared name until binding disposal; no external clip instance is borrowed.
   */
  public prepare(
    name: string,
    definition: AutoMovieHumanController.IDefinition,
  ): void {
    if (this.prepared.has(name)) return;
    const clip: THREE.AnimationClip = createHumanRigClip(
      name,
      definition,
      this.snapshot,
      (pose: IAutoMovieHumanPose): Skeleton.IOutput => this.evaluator!(pose),
      (output: Skeleton.IOutput): Map<string, HumanRigBinding.ILocal> =>
        this.pose(output),
    );
    this.prepared.set(name, clip);
  }

  /** Copy a previously prepared clip, preserving private track arrays.
   *
   * @evidence contracts/common.md#principled-implementation Clones an already prepared clip, including Three track arrays, before returning it.
   * @evidence contracts/common.md#clear-and-simple-design The private cache remains mutation-isolated from callers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A previously prepared name is a caller premise; this operation does not synthesize a missing clip.
   * @evidence contracts/common.md#meaningful-documentation Documents required preparation and independent track ownership.
   * @evidence contracts/performance.md#efficient-algorithms Copy cost scales with the selected clip's keyframe arrays.
   * @evidence contracts/performance.md#reuse-equivalent-work The compiled private clip is reused as the source; caller edits cannot invalidate it.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the clone and the binding retains its original until disposal.
   */
  public clip(name: string): THREE.AnimationClip {
    return this.prepared.get(name)!.clone();
  }

  /** Existing prepared clinical evaluation for an explicit static pose, without shape preparation.
   *
   * @evidence contracts/common.md#principled-implementation Invokes this fixed body's supplied clinical evaluator for an explicit pose without preparing body shape again.
   * @evidence contracts/common.md#clear-and-simple-design Clinical mapping and clamping remain the evaluator's responsibility.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An active binding and matching prepared evaluator are premises; no fallback FK or shape law is provided.
   * @evidence contracts/common.md#meaningful-documentation Documents prepared evaluation and its separation from body preparation.
   * @evidence contracts/performance.md#efficient-algorithms Cost is the existing evaluator's bone/pose work; this forwarding boundary adds no traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work The same retained prepared callback serves explicit poses and clip compilation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The evaluator reference is released on disposal; this method retains no evaluated output cache.
   */
  public evaluate(pose: IAutoMovieHumanPose): Skeleton.IOutput {
    return this.evaluator!(pose);
  }

  /** Sample the pure controller's local seconds through the original Three interpolation/FK.
   *
   * @evidence contracts/common.md#principled-implementation Samples an already prepared motion at controller-supplied local seconds through Three's action and mixer, then publishes target placements.
   * @evidence contracts/common.md#clear-and-simple-design The binding owns sampling while the pure controller alone owns playback time.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Prepared name and admitted local time are caller premises; endpoint action pause is reset without introducing a wall clock or contact solver.
   * @evidence contracts/common.md#meaningful-documentation Documents local seconds, existing interpolation and separation from transport.
   * @evidence contracts/performance.md#efficient-algorithms Selection may restore rest once; each call samples existing tracks and publishes the bounded rig/slot populations.
   * @evidence contracts/performance.md#reuse-equivalent-work The same action is reused until name changes, with private prepared clips and original geometry preserved.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one active action and name plus prepared clips; no timer, geometry or per-sample owner is created.
   */
  public sample(name: string, time: number): void {
    if (this.selected !== name) {
      this.apply(this.pose(this.snapshot));
      this.action = this.mixer.clipAction(this.prepared.get(name)!);
      this.selected = name;
    }

    // Reset Three's endpoint pause before each explicit sample; it owns no wall clock here.
    this.action!.reset().setLoop(THREE.LoopOnce, 1);
    this.action!.clampWhenFinished = true;
    this.action!.play();
    this.mixer.setTime(time);
    this.publish();
  }

  /** Refresh caller ancestor transforms without advancing time or rebuilding geometry.
   *
   * @evidence contracts/common.md#principled-implementation Publishes existing rig placement through actual ancestor matrices without changing clip time.
   * @evidence contracts/common.md#clear-and-simple-design One publish path serves paused refresh and sampled motion alike.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No transform decomposition, new FK or guessed root correction replaces the full relative matrix.
   * @evidence contracts/common.md#meaningful-documentation States that caller ancestor transforms refresh without geometry rebuilding or time advancement.
   * @evidence contracts/performance.md#efficient-algorithms Traverses current rig and placement slots through publish using retained matrix scratch.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses accepted rig state and original targets, including external root scale and shear.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no resource or retained sample; binding-owned scratch remains bounded.
   */
  public refresh(): void {
    this.publish();
  }

  /** Validate and convert one actual evaluated world pose before changing any drawing.
   *
   * @evidence contracts/common.md#principled-implementation Delegates actual world placements to the unchanged parent-inverse quaternion/position conversion using this binding's fixed rest identities.
   * @evidence contracts/common.md#clear-and-simple-design One pure conversion helper validates and returns local transforms before drawing mutation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or nonfinite placements and zero quaternions reject; no clamping, new FK or coordinate correction is added.
   * @evidence contracts/common.md#meaningful-documentation Documents metre-valued world input, parent-local output and validation before applying drawings.
   * @evidence contracts/performance.md#efficient-algorithms Builds a placement lookup and one local record per rest bone in linear bone-population time and space.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the existing evaluated output and fixed rest graph rather than evaluating another pose.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned map/vectors; conversion acquires no mixer, drawing or persistent cache.
   */
  public pose(output: Skeleton.IOutput): Map<string, HumanRigBinding.ILocal> {
    return convertHumanRigPose(this.snapshot, output);
  }

  /** Apply already admitted local transforms; explicit pose translations retain their owner.
   *
   * @evidence contracts/common.md#principled-implementation Stops the current action, restores zero rig-root translation and copies admitted local positions/quaternions into the existing nodes before publication.
   * @evidence contracts/common.md#clear-and-simple-design Explicit pose application is separate from validation and the logical controller's transport reset.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Input must match the bound nodes; authored explicit translations are retained without new joint fitting or shape changes.
   * @evidence contracts/common.md#meaningful-documentation States admitted local transforms and their explicit-pose translation ownership.
   * @evidence contracts/performance.md#efficient-algorithms Copies one transform per input entry and publishes existing targets; geometry buffers are untouched.
   * @evidence contracts/performance.md#reuse-equivalent-work The same nodes, original drawings and retained matrix scratch serve every explicit pose.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Releases active action/name references; input vectors are copied rather than retained as node state.
   */
  public apply(local: Map<string, HumanRigBinding.ILocal>): void {
    this.mixer.stopAllAction();
    this.action = null;
    this.selected = null;
    this.rig.position.set(0, 0, 0);
    for (const [name, frame] of local) {
      const node: THREE.Object3D = this.nodes.get(name)!;
      node.position.copy(frame.position);
      node.quaternion.copy(frame.rotation);
    }
    this.publish();
  }

  /** Retire only owned transform/player data; the facade separately retires its visual sink.
   *
   * @evidence contracts/common.md#principled-implementation Marks this binding terminal and fans out action stop, mixer uncache, detach and transform/cache reference release.
   * @evidence contracts/common.md#clear-and-simple-design The binding retires only its player/transform data; the facade separately invokes the visual disposer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No borrowed visual geometry is disposed and a cleanup failure is propagated after independent attempts.
   * @evidence contracts/common.md#meaningful-documentation Documents terminal one-attempt ownership and the boundary from visual retirement.
   * @evidence contracts/performance.md#efficient-algorithms Cleanup scales with cached clips, nodes and slots; an already disposed binding returns immediately.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the existing retirement collector without installing another cleanup owner.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Releases nodes, slots, clips, evaluator and rest data once; uncertain cleanup is not retried by this binding.
   */
  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    reportAutoMovieResourceRetirement([
      (): void => {
        this.mixer.stopAllAction();
      },
      (): void => {
        this.mixer.uncacheRoot(this.rig);
      },
      (): void => {
        this.object.removeFromParent();
      },
      (): void => {
        this.object.clear();
      },
      (): void => {
        this.rig.clear();
      },
      (): void => {
        this.nodes.clear();
        this.slots.length = 0;
        this.prepared.clear();
        this.evaluator = undefined;
        this.snapshot = { bones: [], posed: [], clamped: [] };
        this.action = null;
        this.selected = null;
      },
    ]);
  }

  /** Preserve full relative affine matrices, including nonuniform scale and shear. */
  private publish(): void {
    this.object.updateWorldMatrix(true, true);
    for (const { node, target } of this.slots) {
      const parent: THREE.Object3D | null = target.parent;
      if (parent === null)
        throw new Error("Human visual target was detached while bound");
      parent.updateWorldMatrix(true, false);
      this.assertAffine(parent.matrixWorld);
      this.inverse.copy(parent.matrixWorld).invert();
      this.assertAffine(this.inverse);
      this.matrix.multiplyMatrices(this.inverse, node.matrixWorld);
      this.assertAffine(this.matrix);

      // Matrix decomposition cannot retain shear induced by scaled ancestors.
      target.matrix.copy(this.matrix);
      target.matrixAutoUpdate = false;
      target.matrixWorldAutoUpdate = true;
      target.matrixWorldNeedsUpdate = true;
      target.updateWorldMatrix(false, true);
    }
  }

  /** Reject projective, singular or numerically unrepresentable placement matrices. */
  private assertAffine(matrix: THREE.Matrix4): void {
    const elements: number[] = matrix.elements;
    const determinant: number = matrix.determinant();
    if (
      !elements.every(Number.isFinite) ||
      elements[3] !== 0 ||
      elements[7] !== 0 ||
      elements[11] !== 0 ||
      elements[15] === 0 ||
      !Number.isFinite(determinant) ||
      determinant === 0
    )
      throw new Error(
        "Human visual placement needs finite invertible affine matrices within numeric range",
      );
  }
}

/** Internal prepared transform data, built by standard Three coordinate conversion. */
export namespace HumanRigBinding {
  /** One actual joint in its parent's frame.
   *
   * @evidence contracts/common.md#principled-implementation Represents one joint's parent-local metre position and normalized quaternion produced by world-to-local conversion.
   * @evidence contracts/common.md#clear-and-simple-design One internal record is shared by pose conversion, application and authored-track compilation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is transform data, not another skeleton, body-shape authority or clinical validity proof.
   * @evidence contracts/common.md#meaningful-documentation Documents the parent frame, metre units and unit rotation premise.
   * @evidence contracts/performance.md#efficient-algorithms The interface is erased; the conversion allocates one vector and quaternion record per bone.
   * @evidence contracts/performance.md#reuse-equivalent-work The same shape carries converted static poses and keyframes into existing consumers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Callers own the map records; the type acquires no player or drawing resource.
   */
  export interface ILocal {
    /** Parent-local position in metres. */
    position: THREE.Vector3;

    /** Parent-local unit rotation. */
    rotation: THREE.Quaternion;
  }
}
