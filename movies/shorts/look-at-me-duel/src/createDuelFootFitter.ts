import { AutoMovieHumanLegIk, type AutoMovieHumanClinicalIk, type AutoMovieHumanGrounding, type AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type AutoMovieHumanSupportFrame, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { createDuelActor } from "./createDuelActor";
import { createDuelGrounding } from "./createDuelGrounding";

/** An emitted sole vertex and its neutral evaluator-frame position. */
interface Witness {
  point: AutoMovieHumanSupportFrame.IPoint;
  position: THREE.Vector3;
}

/** Exact solver arguments and the separately authored body placement. */
interface FittedSupport extends AutoMovieHumanGrounding.IResult {
  input: { authored: IAutoMovieHumanPose; seed: IAutoMovieHumanPose; seedKind: "authored-analytic" | "admitted-leg-continuation" | "current-ankle-analytic"; predictor: "initial-oriented" | "selective-positional" | "planned-ankle"; root: AutoMovieHumanGrounding.IRoot; request: AutoMovieHumanGrounding.IRequest };
  bodyPlan: { root: [number, number, number]; hip: [number, number, number]; ankles?: Record<"left" | "right", [number, number, number]>; horizontalReachFeasible: boolean };
  preparation: { totalIterations: number; passes: { seed: IAutoMovieHumanPose; root: AutoMovieHumanGrounding.IRoot; result: Omit<AutoMovieHumanGrounding.IResult, "output"> }[] };
}

/**
 * Fit one coherent sole, ankle orientation and body-height plan through public Human.
 *
 * @evidence contracts/common.md#implementation-and-ownership Actual sole paths, full Human/shoe floor and clinical ROM remain hard. Fixed-xz placement owns horizontal location and permits only vertical root correction; hips height is an authored soft goal, not a canonical3mm gate. Its public planar leg seed uses the same planned ankle points as the body-height plan, rather than translating a posed sole then discarding its foot orientation. Admitted prior knees supply soft continuity only. Opening's hard-hips/continuation policy is preserved. One16-update fit retains raw inputs/results; no failed seed, previous-root accumulation or post-solve smoothing is promoted. All actual heights, poses and temporal changes still require inspection.
 * @evidence contracts/common.md#authoring-interface Supply world front goals, heading, authored pose, optional admitted predecessor, optional actual settling heel points and explicit placement policy. Default hard-hips preserves opening behavior; fixed-xz keeps authored horizontal placement while preferring body height. Ball/lowest require planted endpoints; rolling/transfer keep front paths hard and heel direction soft. Settling uses actual rigid lines for ankle/body planning. supportHeight and ankle seeds are proposals, not admission. Only canonical forward preparation owns history; inspect uses identical goals and actual resulting root. Recreate for changed geometry.
 */
export function createDuelFootFitter(actor: ReturnType<typeof createDuelActor>): {
  reference: { left: THREE.Vector3; right: THREE.Vector3 };
  ballReference: { left: THREE.Vector3; right: THREE.Vector3 };
  fit: (seed: IAutoMovieHumanPose, left: THREE.Vector3, right: THREE.Vector3, mode?: "ball" | "lowest" | "rolling" | "transfer" | "settling", heading?: number, heelTilt?: number, continuation?: IAutoMovieHumanPose, heelTargets?: { left: THREE.Vector3; right: THREE.Vector3 }, placement?: "hard-hips" | "fixed-xz") => FittedSupport;
  inspect: (pose: IAutoMovieHumanPose, left: THREE.Vector3, right: THREE.Vector3, mode?: "ball" | "lowest" | "rolling" | "transfer" | "settling", heading?: number, heelTilt?: number, authored?: IAutoMovieHumanPose, heelTargets?: { left: THREE.Vector3; right: THREE.Vector3 }, placement?: "hard-hips" | "fixed-xz") => AutoMovieHumanGrounding.IResult;
  heelVectors: (output: Pick<AutoMovieHumanSkeleton.IOutput, "posed">, heading: number) => { left: THREE.Vector3; right: THREE.Vector3 };
  flatHeelVectors: (heading: number) => { left: THREE.Vector3; right: THREE.Vector3 };
  heelMinima: () => { left: number; right: number };
} {
  const grounding: ReturnType<typeof createDuelGrounding> = createDuelGrounding(actor.drawing, actor.evaluate, actor.shoes.points);
  const neutral: AutoMovieHumanSkeleton.IOutput = actor.evaluate({});
  const placements: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(neutral.posed.map((row: AutoMovieHumanSkeleton.IPlacement): [string, AutoMovieHumanSkeleton.IPlacement] => [row.bone, row]));

  /** Place the actual rigid vertex through this body's neutral public FK. */
  function at(point: AutoMovieHumanSupportFrame.IPoint): THREE.Vector3 {
    const placement: AutoMovieHumanSkeleton.IPlacement = placements.get(point.bone)!;
    return new THREE.Vector3(...point.localPoint).applyQuaternion(new THREE.Quaternion(...placement.rotation)).add(new THREE.Vector3(...placement.position));
  }

  const heels: Record<"left" | "right", Witness> = { left: { point: actor.shoes.heel.left, position: at(actor.shoes.heel.left) }, right: { point: actor.shoes.heel.right, position: at(actor.shoes.heel.right) } };
  const fronts: Record<"left" | "right", Witness> = { left: { point: actor.shoes.ball.left, position: at(actor.shoes.ball.left) }, right: { point: actor.shoes.ball.right, position: at(actor.shoes.ball.right) } };
  const channels: AutoMovieHumanRigControls.DegreeChannel[] = [];
  for (const side of ["left", "right"] as const)
    channels.push(`legs.${side}.hip.flexion`, `legs.${side}.hip.abduction`, `legs.${side}.hip.rotation`, `legs.${side}.knee.flexion`, `legs.${side}.ankle.dorsiflexion`, `legs.${side}.foot.subtalarInversion`);

  /** Author both sole endpoints and the body's shared world placement from those same feet. */
  function plan(seed: IAutoMovieHumanPose, left: THREE.Vector3, right: THREE.Vector3, mode: "ball" | "lowest" | "rolling" | "transfer" | "settling", heading: number, heelTilt: number, heelTargets?: { left: THREE.Vector3; right: THREE.Vector3 }, placement: "hard-hips" | "fixed-xz" = "hard-hips"): {
    hard: AutoMovieHumanClinicalIk.ITarget[];
    soft: AutoMovieHumanClinicalIk.ITarget[];
    primary: AutoMovieHumanClinicalIk.ITarget[];
    root: AutoMovieHumanGrounding.IRoot;
    bodyPlan: FittedSupport["bodyPlan"];
  } {
    if (mode === "settling" && heelTargets === undefined) throw new Error("Heel settling requires its actual continuous rigid targets");
    const current: AutoMovieHumanSkeleton.IOutput = actor.evaluate(seed);
    const rotation: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), heading);
    const hard: AutoMovieHumanClinicalIk.ITarget[] = [];
    const soft: AutoMovieHumanClinicalIk.ITarget[] = [];
    const primary: AutoMovieHumanClinicalIk.ITarget[] = [];
    const ankles: AutoMovieHumanLegIk.ISupport[] = [];
    const ankleGoals: Record<"left" | "right", [number, number, number]> = { left: [0, 0, 0], right: [0, 0, 0] };
    const centre: THREE.Vector3 = new THREE.Vector3();
    for (const side of ["left", "right"] as const) {
      const goal: THREE.Vector3 = side === "left" ? left : right;
      const witness: Witness = mode === "lowest" ? heels[side] : fronts[side];
      const secondary: Witness = mode === "lowest" ? fronts[side] : heels[side];
      const pitch: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(mode === "lowest" ? 0 : -heelTilt));
      const orientation: THREE.Quaternion = rotation.clone().multiply(pitch);
      const other: THREE.Vector3 = mode === "settling" ? heelTargets![side] : secondary.position.clone().sub(witness.position).applyQuaternion(orientation).add(goal);
      if (mode === "settling") {
        const flat: THREE.Vector3 = secondary.position.clone().sub(witness.position).applyQuaternion(rotation).normalize();
        const actual: THREE.Vector3 = other.clone().sub(goal).normalize();
        orientation.copy(new THREE.Quaternion().setFromUnitVectors(flat, actual).multiply(rotation));
      }
      const first: AutoMovieHumanClinicalIk.ITarget = { ...witness.point, position: [goal.x, goal.y, goal.z] };
      primary.push(first);
      hard.push(first);
      // Transfer direction is expressive; actual material travel and the entire registered floor remain mandatory.
      (mode === "rolling" || mode === "transfer" || mode !== "settling" && goal.y > 0.00001 ? soft : hard).push({ ...secondary.point, position: [other.x, other.y, other.z] });
      const ankleNeutral: THREE.Vector3 = new THREE.Vector3(...placements.get(`${side}Foot`)!.position);
      const ankle: THREE.Vector3 = ankleNeutral.clone().sub(witness.position).applyQuaternion(orientation).add(goal);
      centre.add(ankle.clone().sub(ankleNeutral.applyQuaternion(rotation)));
      ankles.push({ side, position: [ankle.x, ankle.y, ankle.z], kneeFlexion: seed.legs?.[side].knee?.flexion ?? 5 });
      ankleGoals[side] = [ankle.x, ankle.y, ankle.z];
    }
    centre.multiplyScalar(0.5);
    centre.y = 0;
    const root: AutoMovieHumanGrounding.IRoot = { translation: [centre.x, 0, centre.z], rotation: [rotation.x, rotation.y, rotation.z, rotation.w] };
    const reach: ReturnType<typeof AutoMovieHumanLegIk.supportHeight> = AutoMovieHumanLegIk.supportHeight(current, neutral, root, ankles);
    root.translation[1] = reach.height;
    const hip: THREE.Vector3 = new THREE.Vector3(...current.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === "hips")!.position).applyQuaternion(rotation).add(new THREE.Vector3(...root.translation));
    (placement === "hard-hips" ? hard : soft).push({ bone: "hips", position: [hip.x, hip.y, hip.z] });
    return { hard, soft, primary, root, bodyPlan: { root: [...root.translation], hip: [hip.x, hip.y, hip.z], ...(placement === "fixed-xz" ? { ankles: ankleGoals } : {}), horizontalReachFeasible: reach.feasible } };
  }

  /** Read the actual current scene frame once, without composing a second root. */
  function root(): AutoMovieHumanGrounding.IRoot {
    const position: THREE.Vector3 = actor.object.getWorldPosition(new THREE.Vector3());
    const rotation: THREE.Quaternion = actor.object.getWorldQuaternion(new THREE.Quaternion());
    return { translation: [position.x, position.y, position.z], rotation: [rotation.x, rotation.y, rotation.z, rotation.w] };
  }

  return {
    reference: { left: heels.left.position, right: heels.right.position },
    ballReference: { left: fronts.left.position, right: fronts.right.position },
    fit: (seed: IAutoMovieHumanPose, left: THREE.Vector3, right: THREE.Vector3, mode: "ball" | "lowest" | "rolling" | "transfer" | "settling" = "lowest", heading: number = 0, heelTilt: number = 0, continuation?: IAutoMovieHumanPose, heelTargets?: { left: THREE.Vector3; right: THREE.Vector3 }, placement: "hard-hips" | "fixed-xz" = "hard-hips"): FittedSupport => {
      const goals: ReturnType<typeof plan> = plan(seed, left, right, mode, heading, heelTilt, heelTargets, placement);
      actor.object.position.set(...goals.root.translation);
      actor.object.quaternion.set(...goals.root.rotation);
      actor.object.updateWorldMatrix(true, false);
      let prepared: IAutoMovieHumanPose = structuredClone(seed);
      const continuity: AutoMovieHumanClinicalIk.ITarget[] = [];
      if (continuation?.legs !== undefined) {
        prepared.legs = structuredClone(continuation.legs);
        for (const side of ["left", "right"] as const)
          if (seed.legs?.[side].foot !== undefined) prepared.legs[side].foot = { ...prepared.legs[side].foot, ...structuredClone(seed.legs[side].foot) };
        const current: AutoMovieHumanSkeleton.IOutput = actor.evaluate(prepared);
        for (const side of ["left", "right"] as const) {
          const bone: "leftLowerLeg" | "rightLowerLeg" = `${side}LowerLeg`;
          const point: AutoMovieHumanSkeleton.IPlacement = current.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === bone)!;
          const goal: THREE.Vector3 = actor.object.localToWorld(new THREE.Vector3(...point.position));
          continuity.push({ bone, position: [goal.x, goal.y, goal.z] });
          if (placement === "fixed-xz") continue;
          const target: AutoMovieHumanClinicalIk.ITarget = goals.primary[side === "left" ? 0 : 1]!;
          const local: THREE.Vector3 = actor.object.worldToLocal(new THREE.Vector3(...target.position));
          const proposal: IAutoMovieHumanPose = AutoMovieHumanLegIk.seedPoint(actor.evaluate, prepared, side, { ...target, position: [local.x, local.y, local.z] }, false);
          // The public proposal replaces a leg. Merge only positional controls; its zero twist/ankle and absent foot must not replace continuation.
          prepared.legs[side].hip = { ...prepared.legs[side].hip, flexion: proposal.legs![side].hip?.flexion ?? 0, abduction: proposal.legs![side].hip?.abduction ?? 0 };
          prepared.legs[side].knee = { ...prepared.legs[side].knee, flexion: proposal.legs![side].knee?.flexion ?? 0 };
        }
      }
      if (placement === "fixed-xz" || continuation?.legs === undefined) {
        if (placement === "fixed-xz") prepared = structuredClone(seed);
        for (const side of ["left", "right"] as const) {
          const target: AutoMovieHumanClinicalIk.ITarget = goals.primary[side === "left" ? 0 : 1]!;
          if (placement === "fixed-xz") {
            const local: THREE.Vector3 = actor.object.worldToLocal(new THREE.Vector3(...goals.bodyPlan.ankles![side]));
            prepared = AutoMovieHumanLegIk.seed(prepared, side, [local.x, local.y, local.z], actor.evaluate(prepared), neutral, false);
          } else {
            const local: THREE.Vector3 = actor.object.worldToLocal(new THREE.Vector3(...target.position));
            prepared = AutoMovieHumanLegIk.seedPoint(actor.evaluate, prepared, side, { ...target, position: [local.x, local.y, local.z] }, true);
          }
          if (seed.legs?.[side].foot !== undefined) prepared.legs![side].foot = structuredClone(seed.legs[side].foot);
        }
      }
      const request: AutoMovieHumanGrounding.IRequest = { targets: goals.hard, softTargets: [...goals.soft, ...continuity], channels, preferred: { "legs.left.knee.flexion": seed.legs?.left.knee?.flexion ?? 5, "legs.right.knee.flexion": seed.legs?.right.knee?.flexion ?? 5 }, rootAxes: placement === "fixed-xz" ? ["y"] : ["x", "y", "z"], iterations: 16, tolerance: 0.003, floorTolerance: 0.00001 };
      const input: FittedSupport["input"] = structuredClone<FittedSupport["input"]>({ authored: seed, seed: prepared, seedKind: placement === "fixed-xz" ? "current-ankle-analytic" : continuation?.legs === undefined ? "authored-analytic" : "admitted-leg-continuation", predictor: placement === "fixed-xz" ? "planned-ankle" : continuation?.legs === undefined ? "initial-oriented" : "selective-positional", root: goals.root, request });
      const result: AutoMovieHumanGrounding.IResult = grounding.solve(prepared, goals.root, request);
      const { output: _firstOutput, ...first } = result;
      const preparation: FittedSupport["preparation"] = { totalIterations: result.iterations, passes: [structuredClone({ seed: prepared, root: goals.root, result: first })] };
      return { ...result, input, bodyPlan: goals.bodyPlan, preparation };
    },
    inspect: (pose: IAutoMovieHumanPose, left: THREE.Vector3, right: THREE.Vector3, mode: "ball" | "lowest" | "rolling" | "transfer" | "settling" = "lowest", heading: number = 0, heelTilt: number = 0, authored: IAutoMovieHumanPose = {}, heelTargets?: { left: THREE.Vector3; right: THREE.Vector3 }, placement: "hard-hips" | "fixed-xz" = "hard-hips"): AutoMovieHumanGrounding.IResult => {
      const goals: ReturnType<typeof plan> = plan(authored, left, right, mode, heading, heelTilt, heelTargets, placement);
      return grounding.solve.inspect(pose, root(), { targets: goals.hard, softTargets: goals.soft, channels: [], rootAxes: [], tolerance: 0.003, floorTolerance: 0.00001 });
    },
    heelVectors: (output: Pick<AutoMovieHumanSkeleton.IOutput, "posed">, heading: number): { left: THREE.Vector3; right: THREE.Vector3 } => {
      const rows: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(output.posed.map((row: AutoMovieHumanSkeleton.IPlacement): [string, AutoMovieHumanSkeleton.IPlacement] => [row.bone, row]));
      const result: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(), right: new THREE.Vector3() };
      for (const side of ["left", "right"] as const) {
        const carrier: AutoMovieHumanSkeleton.IPlacement = rows.get(heels[side].point.bone)!;
        if (heels[side].point.bone !== fronts[side].point.bone) throw new Error("Rigid shoe endpoints require one shared actual carrier");
        result[side].fromArray(heels[side].point.localPoint).sub(new THREE.Vector3(...fronts[side].point.localPoint)).applyQuaternion(new THREE.Quaternion(...carrier.rotation)).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
      }
      return result;
    },
    flatHeelVectors: (heading: number): { left: THREE.Vector3; right: THREE.Vector3 } => ({ left: heels.left.position.clone().sub(fronts.left.position).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading), right: heels.right.position.clone().sub(fronts.right.position).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading) }),
    heelMinima: (): { left: number; right: number } => {
      const result: { left: number; right: number } = { left: Infinity, right: Infinity };
      for (const side of ["left", "right"] as const) {
        const mesh: THREE.Mesh = actor.shoes.parts.get(side)!;
        const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
        for (let index: number = 0; index < 12; index++) {
          const point: THREE.Vector3 = mesh.localToWorld(new THREE.Vector3(attribute.getX(index), attribute.getY(index), attribute.getZ(index)));
          result[side] = Math.min(result[side], point.y);
        }
      }
      return result;
    },
  };
}
