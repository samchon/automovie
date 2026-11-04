import { AutoMovieHumanGrounding, AutoMovieHumanLegIk, type AutoMovieHumanClinicalIk, type AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type AutoMovieHumanSupportFrame, type IAutoMovieHumanPose, type IAutoMovieHumanParameters } from "@automovie/human";
import * as THREE from "three";
import type { InspectionPerson } from "../InspectionPerson";
import { MotionAction } from "../motion/core/MotionAction";
import { LabFitPlan } from "./LabFitPlan";
import { labSupportTargets } from "./labSupportTargets";
import { createPersonParameters } from "../createPersonParameters";
import { measureLabSupportFrame } from "./measureLabSupportFrame";

/**
 * Original drawn surface support and nonmutating same-problem body planning.
 * @evidence contracts/common.md#implementation-and-ownership Captures actual bone-bound mesh vertices and uses public Human LegIk/Grounding with the original WORLD goals. Native numerical termination remains separate from actual loaded-contact admission.
 * @evidence contracts/common.md#authoring-interface All returned points are bone-local metres; roots and targets are WORLD metres. A captured planner owns fixed input geometry/frame and never reads a later actor reset or mutable matrix.
 */
export namespace LabActorSupport {
  /**
   * Capture anatomical action inputs and immutable original support references.
   * @evidence contracts/common.md#implementation-and-ownership Reads the original public neutral/guard FK and actual glove placement. Captured frame, plantar population and initial FK remain detached from later reset/adoption while the same public evaluator is reused.
   * @evidence contracts/common.md#authoring-interface Landmarks and target use evaluator metres; local glove/foot witnesses retain their own carrier frames. The planner is the same captured whole-foot consumer, without another fitting layer.
   */
  export function context(person: InspectionPerson, basePose: IAutoMovieHumanPose, guard: AutoMovieHumanSkeleton.IOutput, origin: MotionAction.Vec3, yaw: number, feet: Record<MotionAction.Side, AutoMovieHumanSupportFrame.IPoint[]>, patches: Record<MotionAction.Side, { low: MotionAction.SupportPatch; pivot: MotionAction.SupportPatch }>, planner: NonNullable<MotionAction.Context["prepareSupport"]>, side: MotionAction.Side, target: MotionAction.Vec3): MotionAction.Context {
    const point: (bone: string) => THREE.Vector3 = (bone: string): THREE.Vector3 => {
      const row: AutoMovieHumanSkeleton.IPlacement | undefined = person.neutral.posed.find((item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === bone);
      if (!row) throw new Error(`Missing ${bone}`);
      return new THREE.Vector3(...row.position);
    };
    const padMesh: THREE.Mesh = glove(person, side);
    const hand: AutoMovieHumanSkeleton.IPlacement | undefined = guard.posed.find((item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === `${side}Hand`);
    const shoulder: AutoMovieHumanSkeleton.IPlacement | undefined = guard.posed.find((item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === `${side}UpperArm`);
    const hip: AutoMovieHumanSkeleton.IPlacement | undefined = guard.posed.find((item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === `${side}UpperLeg`);
    if (!hand || !shoulder || !hip) throw new Error("Missing actual action landmarks");
    const initial: AutoMovieHumanSkeleton.IOutput = structuredClone(guard);
    const plantar: Record<MotionAction.Side, AutoMovieHumanSupportFrame.IPoint[]> = structuredClone(feet);
    const vertices: Cloud = [...plantar.left, ...plantar.right];
    const evaluate: AutoMovieHumanSkeleton.PoseEvaluator = person.evaluate;
    const frame: { origin: MotionAction.Vec3; yawRadians: number } = { origin: [...origin], yawRadians: yaw };
    const pad: THREE.Vector3 = padMesh.position.clone().applyQuaternion(new THREE.Quaternion(...hand.rotation)).add(new THREE.Vector3(...hand.position));
    return { basePose: structuredClone(basePose), target: [...target], evaluatePose: evaluate, neutral: person.neutral, supportFrame: (pose: IAutoMovieHumanPose, rootOffset: MotionAction.Vec3, patch: MotionAction.SupportPatch): MotionAction.SupportMeasurement => measureLabSupportFrame(evaluate, initial, plantar[patch.side], frame, pose, rootOffset, patch), supportTargets: (patch: MotionAction.Immutable<MotionAction.SupportPatch>): AutoMovieHumanClinicalIk.ITarget[] => labSupportTargets(initial, yaw, vertices, patch), prepareSupport: planner, frame, supportPatches: [patches.left.low, patches.left.pivot, patches.right.low, patches.right.pivot].map((patch: MotionAction.SupportPatch): MotionAction.SupportPatch => structuredClone(patch)), geometry: { shoulder: [...shoulder.position], hip: [...hip.position], hand: pad.toArray(), handLocalPoint: padMesh.position.toArray(), gloveRadiusMetres: Math.max(padMesh.scale.x, padMesh.scale.y, padMesh.scale.z), upperArmMetres: point(`${side}UpperArm`).distanceTo(point(`${side}LowerArm`)), forearmMetres: point(`${side}LowerArm`).distanceTo(point(`${side}Hand`)), gloveOffsetMetres: padMesh.position.length(), thighMetres: point(`${side}UpperLeg`).distanceTo(point(`${side}LowerLeg`)), shinMetres: point(`${side}LowerLeg`).distanceTo(point(`${side}Foot`)) } };
  }
  /**
   * One production-owned actual body input and its declared fictional identity.
   * @evidence contracts/common.md#implementation-and-ownership Fighters and the official consume the same public original Human construction with distinct authored dimensions and shape controls. Declared kilograms remain metadata because the Human input contains no measured mass.
   * @evidence contracts/common.md#authoring-interface Returns complete Human parameters in their public millimetre convention and matching metre/declared-weight identity. Role changes no package-level anatomy or policy.
   */
  export function profile(role: "a" | "b" | "referee"): { parameters: IAutoMovieHumanParameters; identity: { heightMetres: number; declaredMassKg: number; model: "original-polygon" } } {
    const metadata: ReturnType<typeof identity> = identity(role);
    return { parameters: createPersonParameters(metadata.heightMetres * 1000, role !== "referee"), identity: metadata };
  }

  /** Production identity shared by actual parameter authoring and lightweight inspection.
   * @evidence contracts/common.md#implementation-and-ownership The same authored dimensions feed profile parameters and metadata; declared weight is not computed physical mass.
   * @evidence contracts/common.md#authoring-interface Returns an owned small record without rebuilding complete Human parameters during observation.
   */
  export function identity(role: "a" | "b" | "referee"): { heightMetres: number; declaredMassKg: number; model: "original-polygon" } {
    return { heightMetres: role === "referee" ? 1.78 : 1.8, declaredMassKg: role === "referee" ? 76 : 80, model: "original-polygon" };
  }
  /** Actual original or equipment vertices carried by the named public bone.
   * @evidence contracts/common.md#implementation-and-ownership Reuses public bone-local point records for the actual emitted surface; no alternate collision shape is introduced.
   * @evidence contracts/common.md#authoring-interface Owned points use carrier-local metres and may include rigid equipment and the captured current face.
   */
  export type Cloud = AutoMovieHumanSupportFrame.IPoint[];

  /** Detached postsolve contact observation, independent of a scalar share.
   * @evidence contracts/common.md#implementation-and-ownership Separates declared load from original goal/actual point agreement and fixed-floor admission.
   * @evidence contracts/common.md#authoring-interface Each row names a foot or explicit contact id, with metre measurements and a separate grounded predicate.
   */
  export interface LoadCheck {
    /** Foot side, or explicit contact identity for another body region. */ side: string;
    /** Authored kinematic share, not measured force. */ weight: number;
    /** Original target and floor tolerances both passed. */ grounded: boolean;
    /** All matching retained point measurements in WORLD metres. */ points: { bone: string; world: MotionAction.Vec3; actual: MotionAction.Vec3; error: number }[];
  }

  /** Original non-arm external point task retained across a later arm stage.
   * @evidence contracts/common.md#implementation-and-ownership Keeps the complete authored effector metadata beside its original pre-fit WORLD target; no achieved bone point can replace this authority.
   * @evidence contracts/common.md#authoring-interface The effector retains actor/bone-local units and the independent world tuple is metres in the fixed scene frame.
   */
  export interface BodyTask { /** Original source task and priority. */ effector: MotionAction.Effector; /** Original WORLD goal frozen before body fitting. */ world: MotionAction.Vec3; }

  /** Validate a body-only request's actual leg ancestry before actor mutation.
   * @evidence contracts/common.md#implementation-and-ownership Walks the same public skeleton's exact parent identities until its own UpperLeg; hand/arm and unrelated central carriers cannot enter the leg/body stage. Surface-local tasks remain literal rather than being reduced to joint origins.
   * @evidence contracts/common.md#authoring-interface Returns the already-owned request unchanged. Subsequent native fitting retains its original root-transformed WORLD targets, support and full-foot floor requirements.
   */
  export function bodyRequest(request: MotionAction.Sample, neutral: AutoMovieHumanSkeleton.IOutput): MotionAction.Sample {
    const parents: Map<string, string | null> = new Map(neutral.bones.map((bone: AutoMovieHumanSkeleton.IBone): [string, string | null] => [bone.bone, bone.parent]));
    for (const effector of request.effectors) {
      if (!parents.has(effector.bone)) throw new Error(`Body task has no actual carrier: ${effector.bone}`);
      let bone: string | null = effector.bone;
      const visited: Set<string> = new Set();
      while (bone !== null && !/^(left|right)UpperLeg$/u.test(bone)) {
        if (!parents.has(bone) || visited.has(bone)) throw new Error(`Body task lacks an actual leg ancestry: ${effector.bone}`);
        visited.add(bone); bone = parents.get(bone) ?? null;
      }
      if (bone === null) throw new Error(`Arm or central task cannot enter the leg/body stage: ${effector.bone}`);
    }
    return request;
  }

  /** Re-express original WORLD body tasks around the same realized body for arm-only verification.
   * @evidence contracts/common.md#implementation-and-ownership Uses one inverse realized rigid root to compensate for permitted body root correction; forward fitting therefore recovers the exact same pre-fit WORLD goals. It never reads achieved FK or recomputes a target from a leg endpoint.
   * @evidence contracts/common.md#authoring-interface Returns detached task metadata and actor-root-relative metre targets for the existing arm merger. Lower-body/root controls remain fixed in the arm stage and actual original residuals/full-floor admission still decide success.
   */
  export function retainedBodyEffectors(tasks: readonly BodyTask[], placement: MotionAction.BodyPlacement, origin: MotionAction.Vec3, yaw: number): MotionAction.Effector[] {
    const heading: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const translation: THREE.Vector3 = new THREE.Vector3(...placement.rootOffset).applyQuaternion(heading).add(new THREE.Vector3(...origin));
    const inverse: THREE.Quaternion = heading.multiply(new THREE.Quaternion(...(placement.rootRotation ?? [0, 0, 0, 1]))).invert();
    return tasks.map((task: BodyTask): MotionAction.Effector => ({ ...structuredClone(task.effector), target: new THREE.Vector3(...task.world).sub(translation).applyQuaternion(inverse).toArray() }));
  }

  /**
   * Carry original declared support goals across an upright adopted frame.
   * @evidence contracts/common.md#implementation-and-ownership The old initial bone and original WORLD-axis delta define the absolute target orientation. Reexpressing it against the newly adopted initial bone changes only its reference frame, retaining the exact original point goal and emitted witness.
   * @evidence contracts/common.md#authoring-interface Yaws are radians and support points retain WORLD metres. This never substitutes the achieved residual as a new ground goal; absent frame goals retain their original point-only meaning.
   */
  export function adoptedPatches(previous: AutoMovieHumanSkeleton.IOutput, current: AutoMovieHumanSkeleton.IOutput, oldYaw: number, newYaw: number, patches: readonly MotionAction.SupportPatch[]): MotionAction.SupportPatch[] {
    const result: MotionAction.SupportPatch[] = patches.map((patch: MotionAction.SupportPatch): MotionAction.SupportPatch => {
      const retained: MotionAction.SupportPatch = structuredClone(patch);
      if (!patch.frameRotation && patch.mode !== "pivot" && patch.yawDegrees === undefined) return retained;
      const before: AutoMovieHumanSkeleton.IPlacement = previous.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === patch.bone)!;
      const after: AutoMovieHumanSkeleton.IPlacement = current.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === patch.bone)!;
      const rotation: THREE.Quaternion = patch.frameRotation ? new THREE.Quaternion(...patch.frameRotation) : new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -(patch.yawDegrees ?? 0) * Math.PI / 180);
      rotation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), oldYaw)).multiply(new THREE.Quaternion(...before.rotation));
      retained.frameRotation = rotation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), newYaw).multiply(new THREE.Quaternion(...after.rotation)).invert()).toArray();
      delete retained.yawDegrees;
      return retained;
    });
    for (const patch of result) {
      if (patch.mode !== "planted" || patch.frameRotation) continue;
      const frame: MotionAction.SupportPatch | undefined = result.find((candidate: MotionAction.SupportPatch): boolean => candidate.bone === patch.bone && candidate.frameRotation !== undefined && candidate.localPoint.every((value: number, axis: number): boolean => value === patch.localPoint[axis]) && candidate.world.every((value: number, axis: number): boolean => value === patch.world[axis]));
      if (frame) patch.frameRotation = [...frame.frameRotation!];
    }
    return result;
  }

  /** One complete support preparation observation, including original-pose inspection.
   * @evidence contracts/common.md#implementation-and-ownership Retains measured work and original physical residuals from one already-computed native result, without rerunning fitting to log it.
   * @evidence contracts/common.md#authoring-interface WORLD targets, actual points, requested/applied roots and raw native status remain detached from final actor admission.
   */
  export interface PlanningCost {
    /** Whole synchronous preparation CPU wall measurement, milliseconds. */ milliseconds: number;
    /** Actual native updates; analytical initialization and inspection are additional work. */ iterations: number;
    /** Raw native termination before independent displayed contact admission. */ reason: AutoMovieHumanGrounding.IResult["reason"];
    /** Native point/full-floor outcome, not balance or force proof. */ status: AutoMovieHumanGrounding.IResult["status"];
    /** Original unmodified WORLD tasks and same-order actual points. */ worldTargets: AutoMovieHumanClinicalIk.ITarget[];
    /** Actual points from the already computed same-result public FK. */ actual: MotionAction.Vec3[];
    /** Native largest unchanged hard-target residual, metres. */ error: number;
    /** Minimum across the entire captured original foot cloud, metres. */ floorMinimum: number;
    /** Original requested and realized WORLD root placements. */ requestedRoot: AutoMovieHumanGrounding.IRoot;
    /** Actual root belonging to the returned pose. */ appliedRoot: AutoMovieHumanGrounding.IRoot;
    /** Original native clinical clamp observations. */ clamped: AutoMovieHumanSkeleton.IOutput["clamped"];
  }

  /**
   * Snapshot every actual mesh vertex under its nearest real bone group.
   * @evidence contracts/common.md#implementation-and-ownership Uses each mesh's real local matrix relative to its nearest public bone carrier, including gloves, shorts and current cartoon face. Registered polygon vertices retain their exact native tuples. Nested bone groups are visited separately rather than copying an ancestor's coordinates.
   * @evidence contracts/common.md#authoring-interface The drawing must already have current matrices. This captures rigid attachments at the current expression; a later replaced expression requires a fresh snapshot. Returned data owns no native mesh or graphics resource.
   */
  export function cloud(person: InspectionPerson): Cloud {
    person.object.updateWorldMatrix(true, true);
    const result: Cloud = [];
    const carriers: Set<THREE.Object3D> = new Set(person.drawing.bones.values());
    for (const [bone, group] of person.drawing.bones) {
      const inverse: THREE.Matrix4 = group.matrixWorld.clone().invert();
      const visit: (node: THREE.Object3D) => void = (node: THREE.Object3D): void => {
        if (node !== group && carriers.has(node)) return;
        if (node instanceof THREE.Mesh) {
          const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = node.geometry.getAttribute("position");
          const native: boolean = person.drawing.parts.get(bone) === node;
          const relative: THREE.Matrix4 = inverse.clone().multiply(node.matrixWorld);
          for (let index: number = 0; index < attribute.count; index++) {
            const point: THREE.Vector3 = new THREE.Vector3().fromBufferAttribute(attribute, index);
            if (!native) point.applyMatrix4(relative);
            result.push({ bone: bone as AutoMovieHumanRigControls.Joint, localPoint: point.toArray() });
          }
        }
        for (const child of node.children) visit(child);
      };
      visit(group);
    }
    return result;
  }

  /**
   * Admit the exact actual vertex identity before a support goal reaches fitting.
   * @evidence contracts/common.md#implementation-and-ownership Exact bone/local tuple membership rejects a same-side hand presented as a foot and fabricated interior or displaced witnesses. No epsilon membership or shrunken geometry is used.
   * @evidence contracts/common.md#authoring-interface Populations must come from the same original drawing as the request. This is structural provenance only; WORLD target residual and floor admission remain independent.
   */
  export function requireVertex(points: readonly AutoMovieHumanSupportFrame.IPoint[], patch: { readonly bone: string; readonly localPoint: readonly number[] }): void {
    if (!points.some((point: AutoMovieHumanSupportFrame.IPoint): boolean => point.bone === patch.bone && point.localPoint.every((value: number, axis: number): boolean => value === patch.localPoint[axis]))) throw new Error(`Support witness is not an actual emitted vertex on ${patch.bone}`);
  }

  /** Largest original support residual from an already computed public FK.
   * @evidence contracts/common.md#implementation-and-ownership Applies each exact bone/local point through its same-result FK and requested rigid root, preserving original WORLD tasks.
   * @evidence contracts/common.md#authoring-interface Returns metres without another solve, actor mutation, retargeting or geometry reduction.
   */
  export function error(output: AutoMovieHumanSkeleton.IOutput, root: AutoMovieHumanGrounding.IRoot, targets: readonly AutoMovieHumanClinicalIk.ITarget[]): number {
    const placements: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(output.posed.map((placement: AutoMovieHumanSkeleton.IPlacement): [string, AutoMovieHumanSkeleton.IPlacement] => [placement.bone, placement]));
    return Math.max(0, ...targets.map((target: AutoMovieHumanClinicalIk.ITarget): number => {
      const placement: AutoMovieHumanSkeleton.IPlacement | undefined = placements.get(target.bone);
      if (!placement) throw new Error(`Missing measured support carrier ${target.bone}`);
      return new THREE.Vector3(...(target.localPoint ?? [0, 0, 0])).applyQuaternion(new THREE.Quaternion(...placement.rotation)).add(new THREE.Vector3(...placement.position)).applyQuaternion(new THREE.Quaternion(...root.rotation)).add(new THREE.Vector3(...root.translation)).distanceTo(new THREE.Vector3(...target.position));
    }));
  }

  /** Original raw hard equations read through actual displayed WORLD matrices.
   * @evidence contracts/common.md#implementation-and-ownership The original raw/effective mapping survives exact deduplication; every actual point comes from its drawn bone matrix.
   * @evidence contracts/common.md#authoring-interface Returns detached WORLD metre diagnostics, without changing original goals or the displayed pose.
   */
  export function goals(person: InspectionPerson, mapping: ReturnType<typeof LabFitPlan.hardTargets> | undefined): object[] {
    return (mapping?.rawTargets ?? []).map((target: AutoMovieHumanClinicalIk.ITarget, index: number): object => {
      const carrier: THREE.Group | undefined = person.drawing.bones.get(target.bone);
      if (!carrier) throw new Error(`Missing raw hard goal carrier ${target.bone}`);
      const actual: THREE.Vector3 = carrier.localToWorld(new THREE.Vector3(...(target.localPoint ?? [0, 0, 0])));
      return { rawIndex: index, effectiveIndex: mapping!.rawToEffective[index], ...structuredClone(target), actual: actual.toArray(), errorMetres: actual.distanceTo(new THREE.Vector3(...target.position)) };
    });
  }

  /** Declared support points measured through their actual displayed carriers.
   * @evidence contracts/common.md#implementation-and-ownership Foot and general contacts share actual native point measurement while unloaded trajectories retain their distinct classification.
   * @evidence contracts/common.md#authoring-interface Returns original request fields and actual WORLD metre points; a classification does not certify support.
   */
  export function witnesses(person: InspectionPerson, sample: MotionAction.Sample | undefined): object[] {
    return [...(sample?.support.patches ?? []), ...(sample?.support.kind === "contacts" ? sample.support.contacts : [])].map((patch: MotionAction.SupportPoint): object => {
      const carrier: THREE.Group | undefined = person.drawing.bones.get(patch.bone);
      if (!carrier) throw new Error(`Missing actual support carrier ${patch.bone}`);
      const actual: THREE.Vector3 = carrier.localToWorld(new THREE.Vector3(...patch.localPoint));
      return { ...structuredClone(patch), actual: actual.toArray(), errorMetres: actual.distanceTo(new THREE.Vector3(...patch.world)), classification: patch.mode === "free" ? `${MotionAction.supportConstraint(patch)}-trajectory-not-ground-support` : "hard-ground-retention-request" };
    });
  }

  /** Original named mesh, borrowed from the same displayed registry.
   * @evidence contracts/common.md#implementation-and-ownership Performs exact original registry lookup and refuses an absent part instead of substituting another mesh.
   * @evidence contracts/common.md#authoring-interface Ownership remains with the person; the borrowed mesh must not be independently retired or repositioned.
   */
  export function mesh(person: InspectionPerson, bone: string): THREE.Mesh {
    const result: THREE.Mesh | undefined = person.drawing.parts.get(bone);
    if (!result) throw new Error(`Missing displayed ${bone}`);
    return result;
  }

  /** Actual owned glove mesh attached to its own canonical Hand carrier.
   * @evidence contracts/common.md#implementation-and-ownership Reads the same equipment node that is rendered and refuses a missing glove rather than inventing a contact proxy.
   * @evidence contracts/common.md#authoring-interface Side is anatomical and ownership remains with the actor; ungloved officials intentionally have no glove.
   */
  export function glove(person: InspectionPerson, side: MotionAction.Side): THREE.Mesh {
    const result: THREE.Object3D | undefined = person.object.getObjectByName(`${side}-glove`);
    if (!(result instanceof THREE.Mesh)) throw new Error(`Missing real ${side} glove`);
    return result;
  }

  /** Actual displayed bone-local point transformed through its refreshed world matrix.
   * @evidence contracts/common.md#implementation-and-ownership Refreshes the same drawn graph and applies its actual carrier matrix exactly once.
   * @evidence contracts/common.md#authoring-interface Input is bone-local metres and output is an owned WORLD metre tuple; missing carriers refuse.
   */
  export function point(person: InspectionPerson, bone: string, local: MotionAction.Vec3): MotionAction.Vec3 {
    const carrier: THREE.Group | undefined = person.drawing.bones.get(bone);
    if (!carrier) throw new Error(`Missing drawn effector ${bone}`);
    person.object.updateWorldMatrix(true, true);
    return carrier.localToWorld(new THREE.Vector3(...local)).toArray();
  }

  /** Original exact baseline FK landmark, copied without evaluating a new pose.
   * @evidence contracts/common.md#implementation-and-ownership Reads the original same-body FK by exact canonical identity; a later displayed pose cannot replace that reference.
   * @evidence contracts/common.md#authoring-interface Returns an owned evaluator-frame metre tuple and refuses a missing baseline landmark.
   */
  export function basePoint(initial: AutoMovieHumanSkeleton.IOutput, bone: string): MotionAction.Vec3 {
    const result: AutoMovieHumanSkeleton.IPlacement | undefined = initial.posed.find((placement: AutoMovieHumanSkeleton.IPlacement): boolean => placement.bone === bone);
    if (!result) throw new Error(`Missing baseline landmark ${bone}`);
    return [...result.position];
  }

  /**
   * Read every loaded relationship from the actual displayed matrices.
   * @evidence contracts/common.md#implementation-and-ownership Foot and general contacts retain their original WORLD goals and carrier identities. Every positive share needs its own hard retained point within .25mm of both goal and fixed ground; a free trajectory cannot supply support.
   * @evidence contracts/common.md#authoring-interface Airborne produces no loaded checks. This method never mutates a solver result or translates an achieved witness into a replacement goal.
   */
  export function loads(person: InspectionPerson, support: MotionAction.Support, feet: readonly MotionAction.SupportPatch[]): LoadCheck[] {
    const groups: { side: string; weight: number; patches: readonly { bone: string; localPoint: MotionAction.Vec3; world: MotionAction.Vec3; mode: string }[] }[] = support.kind === "airborne" ? [] : support.kind === "contacts" ? support.contacts.map((contact: MotionAction.GroundContact): { side: string; weight: number; patches: MotionAction.GroundContact[] } => ({ side: contact.id, weight: contact.share, patches: [contact] })) : (["left", "right"] as const).filter((side: MotionAction.Side): boolean => support[side] > 0).map((side: MotionAction.Side): { side: string; weight: number; patches: MotionAction.SupportPatch[] } => ({ side, weight: support[side], patches: feet.filter((patch: MotionAction.SupportPatch): boolean => patch.side === side && MotionAction.supportConstraint(patch) === "hard") }));
    return groups.filter((group: { weight: number }): boolean => group.weight > 0).map((group: (typeof groups)[number]): LoadCheck => {
      const points: LoadCheck["points"] = group.patches.filter((patch: { mode: string }): boolean => patch.mode !== "free").map((patch: (typeof group.patches)[number]): LoadCheck["points"][number] => {
        const carrier: THREE.Group | undefined = person.drawing.bones.get(patch.bone);
        if (!carrier) throw new Error(`Missing actual loaded carrier ${patch.bone}`);
        const actual: THREE.Vector3 = carrier.localToWorld(new THREE.Vector3(...patch.localPoint));
        return { bone: patch.bone, world: [...patch.world], actual: actual.toArray(), error: actual.distanceTo(new THREE.Vector3(...patch.world)) };
      });
      return { side: group.side, weight: group.weight, points, grounded: points.some((point: LoadCheck["points"][number]): boolean => Math.abs(point.actual[1]) <= .00025 && point.error <= .00025) };
    });
  }

  /**
   * Capture the same retained original point from the currently displayed body.
   * @evidence contracts/common.md#implementation-and-ownership Copies actual world position and actual carrier rotation relative to its original FK reference. The requested source object remains unchanged; foot and general contacts use this one transform path.
   * @evidence contracts/common.md#authoring-interface The result is a stopped state for recovery, never replacement input for the original fitting oracle. The original fixed heading and initial same-body skeleton define the quaternion frame.
   */
  export function stopped<T extends MotionAction.SupportPoint>(person: InspectionPerson, initial: AutoMovieHumanSkeleton.IOutput, yaw: number, point: T): T {
    const carrier: THREE.Group | undefined = person.drawing.bones.get(point.bone);
    if (!carrier) throw new Error(`Missing stopped original carrier ${point.bone}`);
    const actual: T = { ...structuredClone(point), world: carrier.localToWorld(new THREE.Vector3(...point.localPoint)).toArray() };
    if (point.frameRotation || point.yawDegrees !== undefined) {
      const reference: AutoMovieHumanSkeleton.IPlacement | undefined = initial.posed.find((placement: AutoMovieHumanSkeleton.IPlacement): boolean => placement.bone === point.bone);
      if (!reference) throw new Error(`Missing stopped original frame ${point.bone}`);
      const first: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiply(new THREE.Quaternion(...reference.rotation));
      actual.frameRotation = carrier.getWorldQuaternion(new THREE.Quaternion()).multiply(first.invert()).toArray();
      delete actual.yawDegrees;
    }
    return actual;
  }

  /**
   * Capture a nonmutating planner using the final host's original physical problem.
   * @evidence contracts/common.md#implementation-and-ownership A public analytical leg seed initializes actual plantar targets, preserving authored distal controls, then one public joint/full-foot Grounding solve uses the host's unchanged16-update, .25mm/1micrometre bounds. Original WORLD tasks stay fixed; no retries or new solver participate.
   * @evidence contracts/common.md#authoring-interface The returned closure owns captured geometry, root frame and original FK. Its output is realized pose/root with unchanged support goals; failure retains the raw native solver outcome and original hard mapping. Each invocation is bounded and creates no actor or renderer.
   */
  export function planner(evaluate: AutoMovieHumanSkeleton.PoseEvaluator, neutral: AutoMovieHumanSkeleton.IOutput, initial: AutoMovieHumanSkeleton.IOutput, origin: MotionAction.Vec3, yaw: number, feet: Cloud, observe?: (cost: PlanningCost) => void): NonNullable<MotionAction.Context["prepareSupport"]> {
    const prepared: AutoMovieHumanGrounding.IPrepared = AutoMovieHumanGrounding.prepare(evaluate, feet);
    const heading: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    return (plan: MotionAction.BodyPlacement): MotionAction.BodyPlacement => {
      const started: number = performance.now();
      MotionAction.validateSupport(plan.support);
      MotionAction.validateRootRotation(plan.rootRotation);
      if (plan.support.kind === "contacts" || plan.support.kind === "airborne") throw new Error("Foot support planning requires the foot-support branch");
      const patches: MotionAction.SupportPatch[] = structuredClone(plan.support.patches ?? []) as MotionAction.SupportPatch[];
      for (const patch of patches) requireVertex(feet.filter((point: AutoMovieHumanSupportFrame.IPoint): boolean => point.bone.startsWith(patch.side)), patch);
      const raw: AutoMovieHumanClinicalIk.ITarget[] = patches.filter((patch: MotionAction.SupportPatch): boolean => MotionAction.supportConstraint(patch) === "hard").flatMap((patch: MotionAction.SupportPatch): AutoMovieHumanClinicalIk.ITarget[] => labSupportTargets(initial, yaw, feet, patch));
      const hard: ReturnType<typeof LabFitPlan.hardTargets> = LabFitPlan.hardTargets(raw);
      const root: AutoMovieHumanGrounding.IRoot = { translation: new THREE.Vector3(...plan.rootOffset).applyQuaternion(heading).add(new THREE.Vector3(...origin)).toArray(), rotation: heading.clone().multiply(new THREE.Quaternion(...(plan.rootRotation ?? [0, 0, 0, 1]))).toArray() };
      const sample: MotionAction.Sample = { pose: structuredClone(plan.pose), rootOffset: [...plan.rootOffset], rootRotation: plan.rootRotation ? [...plan.rootRotation] : undefined, preservedChannels: plan.preservedChannels, support: structuredClone(plan.support) as MotionAction.Support, effectors: [], phase: "preparation", elapsed: 0, progress: 0 };
      const selection: LabFitPlan.Selection = LabFitPlan.select(sample, neutral, hard.targets.map((target: AutoMovieHumanClinicalIk.ITarget): string => target.bone));
      const request: AutoMovieHumanGrounding.IRequest = { targets: hard.targets, channels: selection.channels, rootAxes: ["y"], iterations: 16, tolerance: .00025, floorTolerance: .000001 };
      const authored: AutoMovieHumanGrounding.IResult = prepared.inspect(sample.pose, root, request);
      const pose: IAutoMovieHumanPose = authored.status === "admitted" ? sample.pose : geometricSeed(evaluate, sample.pose, root, hard.targets, plan.preservedChannels);
      const result: AutoMovieHumanGrounding.IResult = authored.status === "admitted" ? authored : prepared(pose, root, request);
      const output: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(result.output.posed.map((placement: AutoMovieHumanSkeleton.IPlacement): [string, AutoMovieHumanSkeleton.IPlacement] => [placement.bone, placement]));
      observe?.({ milliseconds: performance.now() - started, iterations: result.iterations, reason: result.reason, status: result.status, worldTargets: structuredClone(hard.targets), actual: hard.targets.map((target: AutoMovieHumanClinicalIk.ITarget): MotionAction.Vec3 => { const carrier: AutoMovieHumanSkeleton.IPlacement = output.get(target.bone)!; return new THREE.Vector3(...(target.localPoint ?? [0, 0, 0])).applyQuaternion(new THREE.Quaternion(...carrier.rotation)).add(new THREE.Vector3(...carrier.position)).applyQuaternion(new THREE.Quaternion(...result.root.rotation)).add(new THREE.Vector3(...result.root.translation)).toArray(); }), error: result.supportError, floorMinimum: result.floorMinimum, requestedRoot: structuredClone(root), appliedRoot: structuredClone(result.root), clamped: structuredClone(result.output.clamped) });
      if (result.status !== "admitted") throw new Error(`Support planning unresolved: ${result.reason}, hard ${result.supportError}, floor ${result.floorMinimum}`, { cause: structuredClone({ requested: plan, seed: pose, hardGoals: hard, selection, result }) });
      return MotionAction.snapshotBodyPlacement({ ...plan, pose: result.pose, rootOffset: new THREE.Vector3(...result.root.translation).sub(new THREE.Vector3(...origin)).applyQuaternion(heading.clone().invert()).toArray() });
    };
  }

  /**
   * Initialize each original foot reach through the existing analytical Human API.
   * @evidence contracts/common.md#implementation-and-ownership Uses the original point's exact inverse requested root, retaining every authored distal control and explicit lock. Its output initializes the same final physical tasks rather than changing them.
   * @evidence contracts/common.md#authoring-interface This performs two analytical seeds at most and is not a convergence or floor certificate. Explicit preserved channels are restored from the input before the final public fit.
   */
  export function geometricSeed(evaluate: AutoMovieHumanSkeleton.PoseEvaluator, input: IAutoMovieHumanPose, root: AutoMovieHumanGrounding.IRoot, targets: readonly AutoMovieHumanClinicalIk.ITarget[], preserved: readonly AutoMovieHumanRigControls.DegreeChannel[] = []): IAutoMovieHumanPose {
    let pose: IAutoMovieHumanPose = structuredClone(input);
    for (const side of ["left", "right"] as const) {
      const target: AutoMovieHumanClinicalIk.ITarget | undefined = targets.find((point: AutoMovieHumanClinicalIk.ITarget): boolean => point.bone.startsWith(side) && /(?:Foot|Subtalar|Midfoot|Toe|Hallux|Second|Third|Fourth|Fifth)/u.test(point.bone));
      if (!target) continue;
      const foot: IAutoMovieHumanPose["legs"] = structuredClone(pose.legs);
      pose = AutoMovieHumanLegIk.seedPoint(evaluate, pose, side, { ...target, position: new THREE.Vector3(...target.position).sub(new THREE.Vector3(...root.translation)).applyQuaternion(new THREE.Quaternion(...root.rotation).invert()).toArray() }, true);
      if (foot?.[side].foot) pose.legs![side].foot = foot[side].foot;
    }
    for (const channel of preserved) {
      const path: string[] = channel.split(".");
      let source: unknown = input;
      let destination: object = pose;
      for (const part of path.slice(0, -1)) {
        source = source !== null && typeof source === "object" ? Reflect.get(source, part) : undefined;
        const child: unknown = Reflect.get(destination, part);
        if (child === null || typeof child !== "object") Reflect.set(destination, part, {});
        destination = Reflect.get(destination, part) as object;
      }
      const value: unknown = source !== null && typeof source === "object" ? Reflect.get(source, path.at(-1)!) : undefined;
      if (value === undefined) Reflect.deleteProperty(destination, path.at(-1)!); else Reflect.set(destination, path.at(-1)!, value);
    }
    return pose;
  }
}
