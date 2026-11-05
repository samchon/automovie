import { AutoMovieHumanLegIk, type AutoMovieHumanClinicalIk, type AutoMovieHumanGrounding, type AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type AutoMovieHumanSupportFrame, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { createDuelActor } from "./createDuelActor";
import { createDuelGrounding } from "./createDuelGrounding";
import type { DuelContactPoint } from "./DuelContactPoint";

/** An emitted sole vertex and its neutral evaluator-frame position. */
interface Witness {
  point: AutoMovieHumanSupportFrame.IPoint;
  position: THREE.Vector3;
}

/** Exact solver arguments and the separately authored body placement. */
interface FittedSupport extends AutoMovieHumanGrounding.IResult {
  input: { authored: IAutoMovieHumanPose; seed: IAutoMovieHumanPose; seedKind: "authored-analytic" | "admitted-leg-continuation" | "current-ankle-analytic" | "held-contact"; predictor: "initial-oriented" | "selective-positional" | "planned-ankle" | "world-contact-root"; root: AutoMovieHumanGrounding.IRoot; request: AutoMovieHumanGrounding.IRequest };
  bodyPlan: { root: [number, number, number]; hip: [number, number, number]; ankles?: Record<"left" | "right", [number, number, number]>; horizontalReachFeasible: boolean };
  preparation: { totalIterations: number; passes: { seed: IAutoMovieHumanPose; root: AutoMovieHumanGrounding.IRoot; result: Omit<AutoMovieHumanGrounding.IResult, "output"> }[] };
}

/** Contact-derived root proposal and its actual supported public result. */
interface AnchoredSupport extends FittedSupport {
  anchor: { rootBefore: AutoMovieHumanGrounding.IRoot; achieved: [number, number, number]; target: [number, number, number]; delta: [number, number, number] };
}

/**
 * Fit one coherent sole, ankle orientation and body-height plan through public Human.
 *
 * @evidence contracts/common.md#implementation-and-ownership Actual sole paths, full Human/shoe floor and ROM remain hard. Ordinary fixed-xz fitting permits rootY and soft hips height; authored ankle seeds and admitted knee continuity retain their separate roles. The explicit ending anchor instead derives rootXYZ from actual target-minus-achieved palm, fixes that upper pose and constrains the same palm plus unchanged foot targets in one public Grounding request. The palm fixes absolute body placement, preventing unconstrained XYZ drift. Each distinct fit retains its own16-update request/result. No route constant, failed outgoing continuation or pose smoothing is promoted.
 * @evidence contracts/common.md#authoring-interface Ordinary fit/inspect consume world feet, heading, authored pose, optional admitted predecessor and actual settling heels. Anchor consumes the current bounded pose, original support request, real carrier-local hand point and world target. It proposes rootBefore+target-minus-achieved exactly once; the public solver must restore the original foot/floor/ROM constraints. Returned original body plan is the reserved foot plan, separately from the contact-derived input root. The scene rechecks final contact/wand at the resulting root. Only canonical forward preparation owns history; changed geometry requires a new fitter.
 */
export function createDuelFootFitter(actor: ReturnType<typeof createDuelActor>): {
  reference: { left: THREE.Vector3; right: THREE.Vector3 };
  ballReference: { left: THREE.Vector3; right: THREE.Vector3 };
  fit: (seed: IAutoMovieHumanPose, left: THREE.Vector3, right: THREE.Vector3, mode?: "ball" | "lowest" | "rolling" | "transfer" | "settling", heading?: number, heelTilt?: number, continuation?: IAutoMovieHumanPose, heelTargets?: { left: THREE.Vector3; right: THREE.Vector3 }, placement?: "hard-hips" | "fixed-xz") => FittedSupport;
  anchor: (pose: IAutoMovieHumanPose, prior: Omit<FittedSupport, "output">, point: DuelContactPoint, target: THREE.Vector3) => AnchoredSupport;
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
    anchor: (pose: IAutoMovieHumanPose, prior: Omit<FittedSupport, "output">, point: DuelContactPoint, target: THREE.Vector3): AnchoredSupport => {
      actor.object.updateWorldMatrix(true, true);
      const carrier: THREE.Group | undefined = actor.drawing.bones.get(point.bone);
      if (carrier === undefined) throw new Error("Held-body anchor requires the actual registered carrier");
      const achieved: THREE.Vector3 = carrier.localToWorld(new THREE.Vector3(...point.localPoint));
      const delta: THREE.Vector3 = target.clone().sub(achieved);
      const rootBefore: AutoMovieHumanGrounding.IRoot = root();
      const proposed: AutoMovieHumanGrounding.IRoot = structuredClone(rootBefore);
      proposed.translation = [rootBefore.translation[0] + delta.x, rootBefore.translation[1] + delta.y, rootBefore.translation[2] + delta.z];
      // The fixed upper pose makes the hard palm constrain all three root
      // translations. The original planted/swing witnesses and full floor
      // stay unchanged; public leg controls restore them at that placement.
      const request: AutoMovieHumanGrounding.IRequest = { ...structuredClone(prior.input.request), targets: [...structuredClone(prior.input.request.targets), { ...point, position: [target.x, target.y, target.z] }], rootAxes: ["x", "y", "z"] };
      const seed: IAutoMovieHumanPose = structuredClone(pose);
      const result: AutoMovieHumanGrounding.IResult = grounding.solve(seed, proposed, request);
      const { output: _output, ...raw } = result;
      return { ...result, input: { authored: structuredClone(prior.input.authored), seed, seedKind: "held-contact", predictor: "world-contact-root", root: proposed, request }, bodyPlan: structuredClone(prior.bodyPlan), preparation: { totalIterations: result.iterations, passes: [{ seed: structuredClone(seed), root: structuredClone(proposed), result: raw }] }, anchor: { rootBefore, achieved: achieved.toArray(), target: target.toArray(), delta: delta.toArray() } };
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
