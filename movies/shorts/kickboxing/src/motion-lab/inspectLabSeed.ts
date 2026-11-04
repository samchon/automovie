import type { AutoMovieHumanClinicalIk, AutoMovieHumanGrounding, AutoMovieHumanSkeleton, AutoMovieHumanSupportFrame } from "@automovie/human";
import * as THREE from "three";
import type { InspectionPerson } from "../InspectionPerson";
import type { MotionAction } from "../motion/core/MotionAction";

/**
 * Inspect the exact authored clinical seed against the same immutable world tasks as the final fit.
 * @evidence contracts/common.md#implementation-and-ownership One public FK of the requested pose supplies every raw hard point and complete original foot minimum before Grounding. Original initial bone quaternions and bone-local axis witnesses remain explicit; no achieved final pose replaces the seed or raw world objective.
 * @evidence contracts/common.md#authoring-interface Requires the same body, initial frame and complete original foot population as the actor. This read-only diagnostic creates owned scalar/tuple records and mutates no scene, floor, target or clinical control; unresolved seed residuals remain visible.
 */
export function inspectLabSeed(person: InspectionPerson, sample: MotionAction.Sample | undefined, root: AutoMovieHumanGrounding.IRoot | undefined, initial: AutoMovieHumanSkeleton.IOutput, raw: readonly AutoMovieHumanClinicalIk.ITarget[], feet: Record<MotionAction.Side, readonly AutoMovieHumanSupportFrame.IPoint[]>): object | undefined {
  if (!sample || !root) return undefined;
  const output: AutoMovieHumanSkeleton.IOutput = person.evaluate(sample.pose);
  const posed: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(output.posed.map((point: AutoMovieHumanSkeleton.IPlacement): [string, AutoMovieHumanSkeleton.IPlacement] => [point.bone, point]));
  const baseline: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(initial.posed.map((point: AutoMovieHumanSkeleton.IPlacement): [string, AutoMovieHumanSkeleton.IPlacement] => [point.bone, point]));
  const rotation: THREE.Quaternion = new THREE.Quaternion(...root.rotation);
  const translation: THREE.Vector3 = new THREE.Vector3(...root.translation);
  const world: (bone: string, localPoint: MotionAction.Vec3) => THREE.Vector3 = (bone: string, localPoint: MotionAction.Vec3): THREE.Vector3 => {
    const point: AutoMovieHumanSkeleton.IPlacement | undefined = posed.get(bone);
    if (!point) throw new Error(`Missing authored seed bone ${bone}`);
    return new THREE.Vector3(...localPoint).applyQuaternion(new THREE.Quaternion(...point.rotation)).add(new THREE.Vector3(...point.position)).applyQuaternion(rotation).add(translation);
  };
  return {
    clamped: structuredClone(output.clamped),
    points: raw.map((target: AutoMovieHumanClinicalIk.ITarget, rawIndex: number): object => {
      const actual: THREE.Vector3 = world(target.bone, target.localPoint ?? [0, 0, 0]);
      const first: AutoMovieHumanSkeleton.IPlacement | undefined = baseline.get(target.bone);
      if (!first) throw new Error(`Missing initial seed frame ${target.bone}`);
      return { rawIndex, ...structuredClone(target), actual: actual.toArray(), errorMetres: actual.distanceTo(new THREE.Vector3(...target.position)), initialWorldRotation: rotation.clone().multiply(new THREE.Quaternion(...first.rotation)).toArray(), seedWorldRotation: rotation.clone().multiply(new THREE.Quaternion(...posed.get(target.bone)!.rotation)).toArray() };
    }),
    feet: (["left", "right"] as const).map((side: MotionAction.Side): object => {
      const points: { point: AutoMovieHumanSupportFrame.IPoint; world: THREE.Vector3 }[] = feet[side].map((point: AutoMovieHumanSupportFrame.IPoint): { point: AutoMovieHumanSupportFrame.IPoint; world: THREE.Vector3 } => ({ point, world: world(point.bone, point.localPoint) }));
      const minimum: { point: AutoMovieHumanSupportFrame.IPoint; world: THREE.Vector3 } = points.reduce((best: { point: AutoMovieHumanSupportFrame.IPoint; world: THREE.Vector3 }, point: { point: AutoMovieHumanSupportFrame.IPoint; world: THREE.Vector3 }): { point: AutoMovieHumanSupportFrame.IPoint; world: THREE.Vector3 } => point.world.y < best.world.y ? point : best);
      return { side, count: points.length, minimum: { ...structuredClone(minimum.point), world: minimum.world.toArray() } };
    }),
  };
}
