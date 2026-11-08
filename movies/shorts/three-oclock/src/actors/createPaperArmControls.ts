import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { createHumanActor } from "./createHumanActor";
import type { createStudentNoteGrip } from "./createStudentNoteGrip";

/**
 * Reach with material-derived grip markers and coarse opposed-face directions.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reads the actual prepared index/thumb skin addresses through their fixed closed pose, retaining their Hand-local rigid markers. A guide asks for the index marker at the actual positive paper face plus1mm, independently of any unadmitted bilateral profile; a closed pinch asks for both. Ten-millimetre normal probes express the public line-offset interval for opposed surface directions instead of an uncommissioned150mm exact six-degree frame. Seven public arm channels preserve body/support/fingers. Open-finger markers are explicitly virtual: actual original skin/finite paper still owns contact/custody. No geometry, ROM, root, finger solve or physical allowance changes.
 * @evidence contracts/common.md#authoring-interface Apply the actual post-support root before supplying a rigid world-metre profile frame and guide/pinch role. Marker targets and interval normals are converted into that actual body frame. Sixteen updates request1mm point precision; the caller separately measures its essential3mm point and all physical guards. Returns the complete original request/seed/result, never contact or ownership. worldFrame reads actual Hand FK without moving the drawing. Borrowed geometry and actor remain caller-owned.
 */
export function createPaperArmControls(actor: ReturnType<typeof createHumanActor>, grip: ReturnType<typeof createStudentNoteGrip>): {
  anchor: ReturnType<typeof createStudentNoteGrip>["anchor"];
  worldFrame: (pose: IAutoMovieHumanPose) => THREE.Matrix4;
  fit: (pose: IAutoMovieHumanPose, paperWorld: THREE.Matrix4, mode?: "guide" | "pinch") => AutoMovieHumanClinicalIk.IResult & { request: AutoMovieHumanClinicalIk.IRequest; seed: IAutoMovieHumanPose };
} {
  const reference: AutoMovieHumanSkeleton.IOutput = actor.evaluate({ arms: { left: {}, right: { hand: grip.hand } } });
  const hand: AutoMovieHumanSkeleton.IPlacement = reference.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === "rightHand")!;
  const inverse: THREE.Matrix4 = new THREE.Matrix4().compose(new THREE.Vector3(...hand.position), new THREE.Quaternion(...hand.rotation), new THREE.Vector3(1, 1, 1)).invert();
  const inverseFrame: THREE.Matrix4 = grip.frameInHand.clone().invert();
  const markers: { point: THREE.Vector3; normal: THREE.Vector3; frame: THREE.Vector3; sign: number }[] = [grip.index, grip.thumb].map((address: typeof grip.index, index: number): { point: THREE.Vector3; normal: THREE.Vector3; frame: THREE.Vector3; sign: number } => {
    const at: AutoMovieHumanSkeleton.IPlacement = reference.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === address.bone)!;
    const matrix: THREE.Matrix4 = inverse.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(...at.position), new THREE.Quaternion(...at.rotation), new THREE.Vector3(1, 1, 1)));
    const point: THREE.Vector3 = address.point.clone().applyMatrix4(matrix);
    return { point, normal: address.normal.clone().transformDirection(matrix), frame: point.clone().applyMatrix4(inverseFrame), sign: index === 0 ? -1 : 1 };
  });
  const channels: AutoMovieHumanRigControls.DegreeChannel[] = ["shoulder.flexion", "shoulder.abduction", "shoulder.rotation", "elbow.flexion", "forearm.pronation", "wrist.flexion", "wrist.radialDeviation"].map((part: string): AutoMovieHumanRigControls.DegreeChannel => AutoMovieHumanRigControls.channel("arms.right." + part));
  return { anchor: grip.anchor,
    worldFrame: (pose: IAutoMovieHumanPose): THREE.Matrix4 => {
      const output: AutoMovieHumanSkeleton.IOutput = actor.evaluate(pose);
      const row: AutoMovieHumanSkeleton.IPlacement = output.posed.find((entry: AutoMovieHumanSkeleton.IPlacement): boolean => entry.bone === "rightHand")!;
      actor.object.updateWorldMatrix(true, false);
      return actor.object.matrixWorld.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(...row.position), new THREE.Quaternion(...row.rotation), new THREE.Vector3(1, 1, 1))).multiply(grip.frameInHand);
    },
    fit: (pose: IAutoMovieHumanPose, paperWorld: THREE.Matrix4, mode: "guide" | "pinch" = "pinch"): AutoMovieHumanClinicalIk.IResult & { request: AutoMovieHumanClinicalIk.IRequest; seed: IAutoMovieHumanPose } => {
      const scale: THREE.Vector3 = new THREE.Vector3();
      paperWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);
      if (!paperWorld.elements.every(Number.isFinite) || Math.abs(paperWorld.determinant() - 1) > 1e-6 || scale.toArray().some((value: number): boolean => Math.abs(value - 1) > 1e-6)) throw new Error("A finite-note carrier needs a rigid world-metre paper frame");
      actor.object.updateWorldMatrix(true, false);
      const rows: typeof markers = mode === "guide" ? markers.slice(0, 1) : markers;
      const axis: THREE.Vector3 = new THREE.Vector3(1, 0, 0).transformDirection(paperWorld).transformDirection(actor.object.matrixWorld.clone().invert());
      const targets: AutoMovieHumanClinicalIk.ITarget[] = rows.map((marker: (typeof markers)[number]): AutoMovieHumanClinicalIk.ITarget => {
        const goal: THREE.Vector3 = marker.frame.clone();
        // A unilateral guide addresses the real top face even when the
        // diagnostic bilateral profile has not yet been admitted.
        if (mode === "guide") goal.x = grip.guideX;
        return { bone: "rightHand", localPoint: marker.point.toArray() as [number, number, number], position: actor.object.worldToLocal(goal.applyMatrix4(paperWorld)).toArray() as [number, number, number] };
      });
      const constraints: NonNullable<AutoMovieHumanClinicalIk.IRequest["constraints"]>[number][] = rows.map((marker: (typeof markers)[number]): NonNullable<AutoMovieHumanClinicalIk.IRequest["constraints"]>[number] => {
        const tangent: THREE.Vector3 = marker.normal.clone().cross(Math.abs(marker.normal.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
        return { kind: "line-offset", point: { bone: "rightHand", localPoint: marker.point.clone().addScaledVector(marker.normal, 0.01).toArray() as [number, number, number] },
          line: { origin: { bone: "rightHand", localPoint: marker.point.toArray() as [number, number, number] }, end: { bone: "rightHand", localPoint: marker.point.clone().addScaledVector(tangent, 0.01).toArray() as [number, number, number] } },
          normal: axis.toArray() as [number, number, number], ...(marker.sign === -1 ? { maximum: -0.0025 } : { minimum: 0.0025 }) };
      });
      const request: AutoMovieHumanClinicalIk.IRequest = { channels, targets, constraints, iterations: 16, tolerance: 0.001 };
      return { ...AutoMovieHumanClinicalIk.solve(actor.evaluate, pose, request), request, seed: pose };
    } };
}
