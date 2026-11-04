import { AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import { rigidTransformVelocity } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";
import * as THREE from "three";
import { MotionAction } from "../motion/core/MotionAction";
import type { PunchAction } from "../motion/punch/PunchAction";
import type { LabActualMotion } from "./LabActualMotion";
import { LabBodyStage } from "./LabBodyStage";

/**
 * Author one finite actual-body continuation into the original cross body trajectory.
 * @evidence contracts/common.md#implementation-and-ownership A Hermite correction joins actual entry clinical/root values and measured rates to the unchanged cross trajectory with zero correction and tangent at its original impact endpoint. Original cross WORLD foot tasks are never averaged or replaced. Load intent is separately connected before the original unloading marker so a free frame cannot carry positive load.
 * @evidence contracts/common.md#authoring-interface This is the single body/support owner during overlap, not a second action mixer. It requires an admitted actual entry and known h/h2 rates; final body, bounds, full floor and each loaded foot still require the native consumer and actual tangent checks.
 */
export namespace LabSharedBody {
  /**
   * Fixed entry and terminal trajectory with independently owned sample output.
   * @evidence contracts/common.md#implementation-and-ownership Captures only detached actual entry data and the already placed original cross definition/context. No last-frame or evolving actor result changes later goals.
   * @evidence contracts/common.md#authoring-interface sample takes cross-local seconds starting at zero. inspect discloses the actual entry, finite endpoint and body/load joining limits; sampling alone is not physical admission.
   */
  export interface Instance {
    /**
     * Author the original anchors on the fixed cross clock or its explicit contact branch.
     * @evidence contracts/common.md#implementation-and-ownership Samples the immutable entry correction before impact and the original cross path afterwards; a supplied cross contact delegates to that action's original recovery. This request does not imply native support admission.
     * @evidence contracts/common.md#authoring-interface Seconds are cross-local. Contact belongs to this cross and retains its original lifetime. Optional bodyResponse is the same actor-local metre vector passed to that cross's arm sample, composed once before fitting. Every result owns pose, root and support without retaining caller mutations.
     */
    sample(seconds: number, contact?: MotionAction.ContactState, bodyResponse?: Readonly<MotionAction.Vec3>): MotionAction.BodyPlacement;
    /**
     * Inspect the fixed entry and terminal contract without evaluating the actor.
     * @evidence contracts/common.md#implementation-and-ownership Returns a detached entry, join interval and original terminal request from the captured immutable construction. It reports finite sampling limits rather than granting physical or visual acceptance.
     * @evidence contracts/common.md#authoring-interface The receipt separates actual entry measurements from authored load and endpoint decisions; callers must still verify fitted geometry and tangents in the real host.
     */
    inspect(): object;
  }

  /**
   * Place the body bridge once from actual entry to the original cross impact path.
   * @evidence contracts/common.md#implementation-and-ownership Entry uses final applied pose/root and fixed-time rates. Nominal cross values and their one-sided authored tangent are sampled before any fit; the compact correction preserves that original path exactly after impact. Retained entry ground identities must match the original initial cross anchors.
   * @evidence contracts/common.md#authoring-interface Context is the same original actor frame and immutable WORLD support provider. This does not alter strike targets, contact IDs or durations. Unknown rates, incompatible anchors, out-of-range load or invalid intervals refuse explicitly.
   */
  export function create(entry: LabActualMotion.Measurement, cross: PunchAction.Instance, context: MotionAction.Context): Instance {
    const actual: LabActualMotion.Measurement = structuredClone(entry);
    const end: number = cross.timing.preparation + cross.timing.delivery;
    const loadEnd: number = cross.timing.preparation * .3;
    const h: number = actual.provenance.h2;
    if (end <= h || loadEnd <= 0 || !context.frame) throw new Error("Shared body needs explicit finite cross preparation and original actor frame");
    const nominal: MotionAction.BodyPlacement = cross.planBody(0, context);
    const next: MotionAction.BodyPlacement = cross.planBody(h, context);
    const initial: MotionAction.BodyPlacement = MotionAction.snapshotBodyPlacement(actual.entry.placement);
    if (Math.hypot(actual.velocity.root.angular.x, actual.velocity.root.angular.y, actual.velocity.root.angular.z) > 1e-10) throw new Error("This fixed-heading body continuation cannot consume nonzero actual root angular velocity");
    const frames: Map<string, FrameCorrection> = frameCorrections(actual, nominal, next, context, h);
    for (const patch of nominal.support.patches ?? []) {
      if (patch.mode === "free") continue;
      if (!(initial.support.patches ?? []).some((source: MotionAction.Immutable<MotionAction.SupportPatch>): boolean => source.mode !== "free" && source.side === patch.side && source.bone === patch.bone && JSON.stringify(source.localPoint) === JSON.stringify(patch.localPoint) && JSON.stringify(source.world) === JSON.stringify(patch.world))) throw new Error("Cross body cannot replace an active entry ground anchor");
    }
    const rootRate: THREE.Vector3 = new THREE.Vector3(actual.velocity.root.linear.x, actual.velocity.root.linear.y, actual.velocity.root.linear.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), -context.frame.yawRadians);
    const rates: LabActualMotion.Measurement["rates"] = actual.rates.filter((rate: LabActualMotion.Measurement["rates"][number]): boolean => !rate.channel.startsWith("arms."));
    return {
      sample: (seconds: number, contact?: MotionAction.ContactState, bodyResponse?: Readonly<MotionAction.Vec3>): MotionAction.BodyPlacement => {
        if (contact && seconds >= contact.event.time) return MotionAction.snapshotBodyPlacement(cross.planBody(seconds, { ...context, contact }, bodyResponse));
        if (bodyResponse?.some((value: number): boolean => value !== 0)) throw new Error("Cross body response requires its own observed contact branch");
        const planned: MotionAction.BodyPlacement = cross.planBody(seconds, context);
        if (seconds < 0 || seconds >= end) return MotionAction.snapshotBodyPlacement(planned);
        const pose: IAutoMovieHumanPose = structuredClone(planned.pose);
        const u: number = seconds / end;
        const a: number = 1 - 3 * u ** 2 + 2 * u ** 3;
        const b: number = u - 2 * u ** 2 + u ** 3;
        for (const rate of rates) {
          const first: number = AutoMovieHumanRigControls.readApplied(initial.pose, rate.channel, []);
          const baseline: number = AutoMovieHumanRigControls.readApplied(nominal.pose, rate.channel, []);
          const authoredRate: number = (AutoMovieHumanRigControls.readApplied(next.pose, rate.channel, []) - baseline) / h;
          const current: number = AutoMovieHumanRigControls.readApplied(planned.pose, rate.channel, []);
          write(pose, rate.channel, current + a * (first - baseline) + b * end * (rate.degreesPerSecond - authoredRate));
        }
        const rootOffset: MotionAction.Vec3 = [0, 1, 2].map((index: number): number => planned.rootOffset[index]! + a * (initial.rootOffset[index]! - nominal.rootOffset[index]!) + b * end * (rootRate.getComponent(index) - (next.rootOffset[index]! - nominal.rootOffset[index]!) / h)) as MotionAction.Vec3;
        const support: MotionAction.Support = LabBodyStage.sample(planned).support;
        if (seconds < loadEnd) {
          const p: number = seconds / loadEnd;
          const correction: number = (1 - 3 * p ** 2 + 2 * p ** 3) * (initial.support.left - nominal.support.left) + (p - 2 * p ** 2 + p ** 3) * loadEnd * (actual.loadRates.left.perSecond - (next.support.left - nominal.support.left) / h);
          support.left += correction; support.right = 1 - support.left;
          if (support.left < 0 || support.right < 0 || !Number.isFinite(support.left)) throw new Error("Shared body load continuation is infeasible");
          support.patches = support.patches?.map((patch: MotionAction.SupportPatch): MotionAction.SupportPatch => {
            if (patch.mode !== "free") return patch;
            const correction: FrameCorrection | undefined = frames.get(identity(patch));
            if (!correction) throw new Error("New free support identity cannot appear inside the entry bridge");
            const a: number = 1 - 3 * p ** 2 + 2 * p ** 3;
            const b: number = p - 2 * p ** 2 + p ** 3;
            const world: MotionAction.Vec3 = patch.world.map((value: number, index: number): number => value + a * correction.position[index]! + b * loadEnd * correction.velocity[index]!) as MotionAction.Vec3;
            if (!patch.frameRotation) return { ...patch, world };
            const start: THREE.Quaternion = new THREE.Quaternion(...correction.rotation);
            const angular: THREE.Vector3 = new THREE.Vector3(...correction.angular);
            const angle: number = angular.length() * loadEnd / 3;
            const first: THREE.Quaternion = angle === 0 ? start.clone() : new THREE.Quaternion().setFromAxisAngle(angular.normalize(), angle).multiply(start);
            const end: THREE.Quaternion = new THREE.Quaternion();
            const ab: THREE.Quaternion = start.clone().slerp(first, p);
            const bc: THREE.Quaternion = first.clone().slerp(end, p);
            const cd: THREE.Quaternion = end.clone();
            const rotation: THREE.Quaternion = ab.slerp(bc, p).slerp(bc.clone().slerp(cd, p), p).multiply(new THREE.Quaternion(...patch.frameRotation));
            return { ...patch, world, frameRotation: rotation.toArray() };
          });
        }
        return MotionAction.snapshotBodyPlacement({ pose, rootOffset, support, rootRotation: planned.rootRotation, preservedChannels: planned.preservedChannels });
      },
      inspect: (): object => structuredClone({ entry: actual, endSeconds: end, loadJoinSeconds: loadEnd, terminal: cross.planBody(end, context), authority: "one actual-entry-to-original-cross body path; original WORLD support goals retained", limits: "Authored scalar load is not force; actual post-fit body/arm tangent, original foot floor/load and endpoint still require verification" }),
    };
  }
}

/** Fixed source-point position and world-axis rotation correction, authored before fitting. */
interface FrameCorrection { position: MotionAction.Vec3; velocity: MotionAction.Vec3; rotation: [number,number,number,number]; angular: MotionAction.Vec3 }

/** Preserve original bone/local identity when connecting a newly declared free frame. */
function identity(patch: MotionAction.Immutable<MotionAction.SupportPatch>): string { return JSON.stringify([patch.side, patch.bone, patch.localPoint, patch.frameRotation !== undefined]); }

/** Use the already sampled native foot frames; no achieved late pose can move the original targets. */
function frameCorrections(actual: LabActualMotion.Measurement, nominal: MotionAction.BodyPlacement, next: MotionAction.BodyPlacement, context: MotionAction.Context, h: number): Map<string, FrameCorrection> {
  if (!context.evaluatePose || !context.frame) throw new Error("Body support continuation requires the original public FK/frame");
  const initial: ReturnType<NonNullable<MotionAction.Context["evaluatePose"]>> = context.evaluatePose(context.basePose);
  const heading: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), context.frame.yawRadians);
  const result: Map<string, FrameCorrection> = new Map();
  for (const patch of nominal.support.patches ?? []) {
    if (patch.mode !== "free") continue;
    const current: LabActualMotion.Snapshot["feet"][string] | undefined = actual.entry.feet[patch.bone];
    const previous: LabActualMotion.Snapshot["feet"][string] | undefined = actual.samples.half.feet[patch.bone];
    const base: AutoMovieHumanSkeleton.IPlacement | undefined = initial.posed.find((item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === patch.bone);
    const following: MotionAction.Immutable<MotionAction.SupportPatch> | undefined = next.support.patches?.find((item: MotionAction.Immutable<MotionAction.SupportPatch>): boolean => identity(item) === identity(patch));
    if (!current || !previous || !base || !following || actual.provenance.oneSided !== "before") throw new Error("Missing actual original foot frame or supported one-sided entry branch");
    const point: (frame: LabActualMotion.Snapshot["feet"][string]) => THREE.Vector3 = (frame: LabActualMotion.Snapshot["feet"][string]): THREE.Vector3 => new THREE.Vector3(...patch.localPoint).applyQuaternion(new THREE.Quaternion(frame.rotation.x,frame.rotation.y,frame.rotation.z,frame.rotation.w)).add(new THREE.Vector3(frame.translation.x,frame.translation.y,frame.translation.z));
    const actualPoint: THREE.Vector3 = point(current);
    const velocity: THREE.Vector3 = actualPoint.clone().sub(point(previous)).divideScalar(h).sub(new THREE.Vector3(...following.world).sub(new THREE.Vector3(...patch.world)).divideScalar(h));
    const baseline: THREE.Quaternion = heading.clone().multiply(new THREE.Quaternion(...base.rotation));
    const start: THREE.Quaternion = new THREE.Quaternion(current.rotation.x,current.rotation.y,current.rotation.z,current.rotation.w).multiply(baseline.clone().invert()).multiply(new THREE.Quaternion(...(patch.frameRotation ?? [0,0,0,1])).invert());
    const zero: {x:number;y:number;z:number} = {x:0,y:0,z:0};
    const plannedFrame: (patch: MotionAction.Immutable<MotionAction.SupportPatch>) => Pick<IAutoMovieTransform,"translation"|"rotation"> = (patch: MotionAction.Immutable<MotionAction.SupportPatch>): Pick<IAutoMovieTransform,"translation"|"rotation"> => { const q: THREE.Quaternion = new THREE.Quaternion(...(patch.frameRotation ?? [0,0,0,1])).multiply(baseline); return {translation:zero,rotation:{x:q.x,y:q.y,z:q.z,w:q.w}}; };
    const plannedAngular: ReturnType<typeof rigidTransformVelocity>["angular"] = rigidTransformVelocity(plannedFrame(patch), plannedFrame(following), h).angular;
    const actualAngular: ReturnType<typeof rigidTransformVelocity>["angular"] = rigidTransformVelocity(previous, current, h).angular;
    const angular: THREE.Vector3 = new THREE.Vector3(actualAngular.x,actualAngular.y,actualAngular.z).sub(new THREE.Vector3(plannedAngular.x,plannedAngular.y,plannedAngular.z).applyQuaternion(start));
    result.set(identity(patch), { position: actualPoint.sub(new THREE.Vector3(...patch.world)).toArray(), velocity: velocity.toArray(), rotation: start.toArray(), angular: angular.toArray() });
  }
  return result;
}

/** Apply one canonical body scalar while retaining every other original field. */
function write(pose: IAutoMovieHumanPose, channel: AutoMovieHumanRigControls.DegreeChannel, value: number): void {
  const parts: string[] = channel.split(".");
  let object: object = pose;
  for (const part of parts.slice(0, -1)) { const child: unknown = Reflect.get(object, part); if (child === undefined) Reflect.set(object, part, {}); object = Reflect.get(object, part) as object; }
  Reflect.set(object, parts.at(-1)!, value);
}
