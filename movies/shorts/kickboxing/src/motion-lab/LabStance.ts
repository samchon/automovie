import { AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type AutoMovieHumanSupportFrame, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";
import type { InspectionPerson } from "../InspectionPerson";
import type { MotionAction } from "../motion/core/MotionAction";

/**
 * Measure original stance geometry without owning actor transactions or fitting.
 * @evidence contracts/common.md#implementation-and-ownership Extracts the existing original polygon measurement unchanged: complete source vertices, actual lowest points, authored roll reference and initial bone frames. No alternate floor geometry or solver is introduced.
 * @evidence contracts/common.md#authoring-interface Inputs describe the same applied person and baseline FK. Returned tuples and arrays belong to the actor that requested them; another actor never shares mutable stance state.
 */
export namespace LabStance {
  /**
   * Original foot witnesses and complete floor population from one actor.
   * @evidence contracts/common.md#implementation-and-ownership Keeps low and roll witnesses distinct and preserves every original vertex for final full-foot inspection.
   * @evidence contracts/common.md#authoring-interface Patches and pivotStarts use world metres; plantarPoints retain canonical bone-local metres. vertices supplies the unchanged public Grounding preparation.
   */
  export interface Result {
    /** Actual retained and rolled source points. */ patches: Record<MotionAction.Side, { low: MotionAction.SupportPatch; pivot: MotionAction.SupportPatch }>;
    /** Initial location of the same rolled point. */ pivotStarts: Record<MotionAction.Side, MotionAction.Vec3>;
    /** Complete per-side source population. */ plantarPoints: Record<MotionAction.Side, AutoMovieHumanSupportFrame.IPoint[]>;
    /** Combined original source population. */ vertices: AutoMovieHumanSupportFrame.IPoint[];
  }

  /**
   * Read native vertex matrices and the same borrowed public FK reference.
   * @evidence contracts/common.md#implementation-and-ownership The original method is separated solely to retain the actor file's focused transaction and fitting responsibilities. Authored roll and selected source identities are unchanged.
   * @evidence contracts/common.md#authoring-interface The person must already display basePose and its world root. This function neither applies a pose nor changes a root, target or geometry.
   */
  export function measure(person: InspectionPerson, basePose: IAutoMovieHumanPose, guardOutput: AutoMovieHumanSkeleton.IOutput): Result {
    const plantarPoints: Record<MotionAction.Side, AutoMovieHumanSupportFrame.IPoint[]> = { left: [], right: [] };
    const vertices: AutoMovieHumanSupportFrame.IPoint[] = [];
    const patches: Partial<Record<MotionAction.Side, { low: MotionAction.SupportPatch; pivot: MotionAction.SupportPatch }>> = {};
    const pivotStarts: Partial<Record<MotionAction.Side, MotionAction.Vec3>> = {};
    for (const side of ["left", "right"] as const) {
      let lowest: { point: AutoMovieHumanSupportFrame.IPoint; world: THREE.Vector3 } | undefined;
      for (const [bone, mesh] of person.drawing.parts) {
        if (!bone.startsWith(side) || !/(Foot|Subtalar|Midfoot|Toe|Hallux|Second|Third|Fourth|Fifth)/u.test(bone)) continue;
        const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
        for (let index: number = 0; index < attribute.count; index++) {
          const local: THREE.Vector3 = new THREE.Vector3().fromBufferAttribute(attribute, index);
          const point: AutoMovieHumanSupportFrame.IPoint = { bone: AutoMovieHumanRigControls.joint(bone), localPoint: local.toArray() };
          vertices.push(point);
          const world: THREE.Vector3 = local.applyMatrix4(mesh.matrixWorld);
          if (!lowest || world.y < lowest.world.y) lowest = { point, world };
        }
      }
      if (!lowest) throw new Error(`Missing actual ${side} plantar witnesses`);
      plantarPoints[side] = vertices.filter((point: AutoMovieHumanSupportFrame.IPoint): boolean => point.bone.startsWith(side)).map((point: AutoMovieHumanSupportFrame.IPoint): AutoMovieHumanSupportFrame.IPoint => structuredClone(point));
      const rollPose: IAutoMovieHumanPose = structuredClone(basePose);
      rollPose.legs![side].ankle = { ...rollPose.legs![side].ankle, dorsiflexion: (rollPose.legs![side].ankle?.dorsiflexion ?? 0) - 12 };
      rollPose.legs![side].foot = { ...rollPose.legs![side].foot, hallux: { mtpFlexion: -20 }, second: { mtpFlexion: -20 }, third: { mtpFlexion: -20 }, fourth: { mtpFlexion: -20 }, fifth: { mtpFlexion: -20 } };
      const rolled: AutoMovieHumanSkeleton.IOutput = person.evaluate(rollPose);
      const placements: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(rolled.posed.map((item: AutoMovieHumanSkeleton.IPlacement): [string, AutoMovieHumanSkeleton.IPlacement] => [item.bone, item]));
      const transformed: (point: AutoMovieHumanSupportFrame.IPoint) => THREE.Vector3 = (point: AutoMovieHumanSupportFrame.IPoint): THREE.Vector3 => {
        const placement: AutoMovieHumanSkeleton.IPlacement | undefined = placements.get(point.bone);
        if (!placement) throw new Error(`Missing rolled foot bone ${point.bone}`);
        return person.object.localToWorld(new THREE.Vector3(...point.localPoint).applyQuaternion(new THREE.Quaternion(...placement.rotation)).add(new THREE.Vector3(...placement.position)));
      };
      const candidates: AutoMovieHumanSupportFrame.IPoint[] = plantarPoints[side];
      const chosen: AutoMovieHumanSupportFrame.IPoint = candidates.reduce((best: AutoMovieHumanSupportFrame.IPoint, point: AutoMovieHumanSupportFrame.IPoint): AutoMovieHumanSupportFrame.IPoint => transformed(point).y < transformed(best).y ? point : best, candidates[0]!);
      const source: THREE.Mesh = person.drawing.parts.get(chosen.bone)!;
      const pivot: THREE.Vector3 = new THREE.Vector3(...chosen.localPoint);
      const pivotWorld: THREE.Vector3 = transformed(chosen);
      pivotWorld.y = 0;
      pivotStarts[side] = source.localToWorld(pivot.clone()).toArray();
      const initialRotation: AutoMovieHumanSkeleton.IPlacement | undefined = guardOutput.posed.find((item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === chosen.bone);
      const rolledRotation: AutoMovieHumanSkeleton.IPlacement | undefined = placements.get(chosen.bone);
      if (!initialRotation || !rolledRotation) throw new Error("Missing original and rolled forefoot frames");
      const rootRotation: THREE.Quaternion = person.object.quaternion.clone();
      const frameRotation: THREE.Quaternion = rootRotation.clone().multiply(new THREE.Quaternion(...rolledRotation.rotation)).multiply(new THREE.Quaternion(...initialRotation.rotation).invert()).multiply(rootRotation.clone().invert());
      patches[side] = {
        low: { side, bone: lowest.point.bone, localPoint: [...lowest.point.localPoint], world: [lowest.world.x, 0, lowest.world.z], mode: "planted" },
        pivot: { side, bone: chosen.bone, localPoint: pivot.toArray(), world: pivotWorld.toArray(), initialWorld: pivotStarts[side]!, mode: "pivot", frameRotation: frameRotation.toArray() },
      };
    }
    return { patches: patches as LabStance.Result["patches"], pivotStarts: pivotStarts as LabStance.Result["pivotStarts"], plantarPoints, vertices };
  }
}

