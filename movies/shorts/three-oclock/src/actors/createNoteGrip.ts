import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanHandPose, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { createHumanActor } from "./createHumanActor";
import { measurePaperContact } from "./measurePaperContact";

/**
 * Fit a bounded set of actual skin pinches and face the paper toward its holder.
 *
 * @evidence contracts/common.md#implementation-and-ownership Inspects ten declared target placements: thumb/index or index/middle actual distal vertices at five centres along their seed gap. Public8/9-channel IK preserves the two-millimetre sheet; selection minimizes actual contact-gap and target error without relaxing admission. A separate25-angle public-FK pronation search faces the sheet horizontally toward its holder rather than rotating it away from the grip. This finite set is not proof of every possible grasp. Owns no borrowed actor/paper resources.
 * @evidence contracts/common.md#authoring-interface Compose returned hand and forearmPronation with this actor's arm action; the relative grip stays fixed under that hand frame. trials/error retain preferred-target diagnostics without relabeling the solve converged. update places the lower short edge between actual skin witnesses and measures both against the actual finite paper faces; that separate1mm contact result owns admission. Coarse contact is not friction, full-hand collision or visual acceptance.
 */
export function createNoteGrip(actor: ReturnType<typeof createHumanActor>): {
  hand: IAutoMovieHumanHandPose;
  error: number;
  forearmPronation: number;
  facingAlignment: number;
  trials: readonly object[];
  anchor: { bone: "rightHand"; localPoint: [number, number, number] };
  update: (paper: THREE.Mesh) => { gap: number; point: THREE.Vector3; contact: ReturnType<typeof measurePaperContact> };
} {
  const hand: IAutoMovieHumanHandPose = {
    index: { mcpFlexion: 30, pipFlexion: 35, dipFlexion: 15 },
    middle: { mcpFlexion: 38, pipFlexion: 40, dipFlexion: 20 },
    ring: { mcpFlexion: 42, pipFlexion: 45, dipFlexion: 20 },
    little: { mcpFlexion: 46, pipFlexion: 50, dipFlexion: 25 },
    thumb: { cmcFlexion: 10, cmcAbduction: 30, cmcOpposition: 35, mcpFlexion: 20, ipFlexion: 20 },
  };
  const seed: IAutoMovieHumanPose = { arms: { left: {}, right: { hand } } };
  const output: AutoMovieHumanSkeleton.IOutput = actor.evaluate(seed);

  /** Transform actual part vertices through the matching public FK. */
  function vertices(bone: string): { local: THREE.Vector3; position: THREE.Vector3 }[] {
    const mesh: THREE.Mesh | undefined = actor.drawing.parts.get(bone);
    const placement: AutoMovieHumanSkeleton.IPlacement | undefined = output.posed.find((entry: AutoMovieHumanSkeleton.IPlacement): boolean => entry.bone === bone);
    if (mesh === undefined || placement === undefined) throw new Error(`Grip needs actual distal skin ${bone}`);
    const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
    const values: { local: THREE.Vector3; position: THREE.Vector3 }[] = [];
    for (let index: number = 0; index < attribute.count; index++) {
      const local: THREE.Vector3 = new THREE.Vector3(attribute.getX(index), attribute.getY(index), attribute.getZ(index));
      values.push({ local, position: local.clone().applyQuaternion(new THREE.Quaternion(...placement.rotation)).add(new THREE.Vector3(...placement.position)) });
    }
    return values;
  }
  const indexPoints: ReturnType<typeof vertices> = vertices("rightIndexDistal");
  const trials: object[] = [];
  let best: { fit: AutoMovieHumanClinicalIk.IResult; index: THREE.Vector3; other: THREE.Vector3; bone: string; error: number } | undefined;

  /** Measure an original skin witness from the exact fitted FK. */
  function placed(result: AutoMovieHumanSkeleton.IOutput, bone: string, point: THREE.Vector3): THREE.Vector3 {
    const row: AutoMovieHumanSkeleton.IPlacement = result.posed.find((entry: AutoMovieHumanSkeleton.IPlacement): boolean => entry.bone === bone)!;
    return point.clone().applyQuaternion(new THREE.Quaternion(...row.rotation)).add(new THREE.Vector3(...row.position));
  }

  // Inspect the complete declared candidate set rather than repeatedly changing
  // one failed midpoint. The bounded alternatives move the contact centre along
  // the original gap while retaining the same two-millimetre sheet and gate.
  for (const digit of ["thumb", "middle"] as const) {
    const bone: string = digit === "thumb" ? "rightThumbDistal" : "rightMiddleDistal";
    const others: ReturnType<typeof vertices> = vertices(bone);
    let distance: number = Infinity;
    let first: (typeof indexPoints)[number] = indexPoints[0]!;
    let second: (typeof others)[number] = others[0]!;
    for (const index of indexPoints) for (const other of others) {
      const value: number = index.position.distanceToSquared(other.position);
      if (value < distance) { distance = value; first = index; second = other; }
    }
    const normal: THREE.Vector3 = second.position.clone().sub(first.position).normalize();
    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
      const midpoint: THREE.Vector3 = first.position.clone().lerp(second.position, fraction);
      const indexGoal: THREE.Vector3 = midpoint.clone().addScaledVector(normal, -0.001);
      const otherGoal: THREE.Vector3 = midpoint.clone().addScaledVector(normal, 0.001);
      const fit: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(actor.evaluate, seed, {
        channels: [...AutoMovieHumanRigControls.chain({ region: "finger", side: "right", digit: "index" }), ...AutoMovieHumanRigControls.chain({ region: "finger", side: "right", digit })],
        targets: [
          { bone: AutoMovieHumanRigControls.joint("rightIndexDistal"), localPoint: first.local.toArray() as [number, number, number], position: indexGoal.toArray() as [number, number, number] },
          { bone: AutoMovieHumanRigControls.joint(bone), localPoint: second.local.toArray() as [number, number, number], position: otherGoal.toArray() as [number, number, number] },
        ], iterations: 16, tolerance: 0.0015,
      });
      const gap: number = placed(fit.output, "rightIndexDistal", first.local).distanceTo(placed(fit.output, bone, second.local));
      const error: number = Math.max(fit.error, Math.abs(gap - 0.002));
      trials.push({ digit, contactFraction: fraction, targetError: fit.error, actualGap: gap, error });
      if (best === undefined || error < best.error) best = { fit, index: first.local, other: second.local, bone, error };
    }
  }
  const chosen: NonNullable<typeof best> = best!;
  const handFrame: AutoMovieHumanSkeleton.IPlacement = chosen.fit.output.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === "rightHand")!;
  const anchor: THREE.Vector3 = placed(chosen.fit.output, "rightIndexDistal", chosen.index).add(placed(chosen.fit.output, chosen.bone, chosen.other)).multiplyScalar(0.5)
    .sub(new THREE.Vector3(...handFrame.position)).applyQuaternion(new THREE.Quaternion(...handFrame.rotation).invert());
  let forearmPronation: number = 0;
  let facingAlignment: number = -1;
  const range: { minimum: number; maximum: number } = AutoMovieHumanRigControls.bounds(AutoMovieHumanRigControls.channel("arms.right.forearm.pronation"));
  for (let index: number = 0; index <= 24; index++) {
    const angle: number = range.minimum + (range.maximum - range.minimum) * index / 24;
    const result: AutoMovieHumanSkeleton.IOutput = actor.evaluate({ arms: { left: {}, right: { shoulder: { flexion: 48 }, elbow: { flexion: 68 }, forearm: { pronation: angle }, hand: chosen.fit.pose.arms!.right.hand } } });
    const first: THREE.Vector3 = placed(result, "rightIndexDistal", chosen.index);
    const second: THREE.Vector3 = placed(result, chosen.bone, chosen.other);
    const normal: THREE.Vector3 = second.clone().sub(first).normalize();
    const head: THREE.Vector3 = new THREE.Vector3(...result.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === "head")!.position);
    const towardHolder: THREE.Vector3 = head.sub(first.clone().add(second).multiplyScalar(0.5)).setY(0).normalize();
    const alignment: number = Math.abs(normal.dot(towardHolder));
    if (alignment > facingAlignment) { facingAlignment = alignment; forearmPronation = angle; }
  }
  return {
    hand: chosen.fit.pose.arms!.right.hand!, error: chosen.error, forearmPronation, facingAlignment, trials, anchor: { bone: "rightHand", localPoint: anchor.toArray() as [number, number, number] },
    update: (paper: THREE.Mesh): { gap: number; point: THREE.Vector3; contact: ReturnType<typeof measurePaperContact> } => {
      const index: THREE.Vector3 = actor.point("rightIndexDistal", chosen.index);
      const middle: THREE.Vector3 = actor.point(chosen.bone, chosen.other);
      const point: THREE.Vector3 = index.clone().add(middle).multiplyScalar(0.5);
      const x: THREE.Vector3 = middle.clone().sub(index).normalize();
      const y: THREE.Vector3 = new THREE.Vector3(0, 1, 0).addScaledVector(x, -x.y).normalize();
      const z: THREE.Vector3 = new THREE.Vector3().crossVectors(x, y).normalize();
      paper.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
      paper.position.copy(point).addScaledVector(y, 0.075);
      return { gap: index.distanceTo(middle), point, contact: measurePaperContact(paper, index, middle) };
    },
  };
}
