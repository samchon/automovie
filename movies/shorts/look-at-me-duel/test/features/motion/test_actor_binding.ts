import assert from "node:assert/strict";
import { AutoMovieHumanSex, type AutoMovieHumanGrounding, type AutoMovieHumanSkeleton, type AutoMovieHumanSupportFrame, type IAutoMovieHumanPose } from "@automovie/human";
import { readFileSync } from "node:fs";
import * as THREE from "three";

import { createDuelActor } from "../../../src/createDuelActor";
import { createDuelHumanParameters } from "../../../src/createDuelHumanParameters";
import { createDuelFootFitter } from "../../../src/createDuelFootFitter";
import { createDuelGrounding } from "../../../src/createDuelGrounding";
import { evaluateDuelExchange } from "../../../src/evaluateDuelExchange";
import { evaluateDuelOpening } from "../../../src/evaluateDuelOpening";
import { selectDuelPalmPoint } from "../../../src/selectDuelPalmPoint";
import { solveDuelArmContact } from "../../../src/solveDuelArmContact";
import { solveDuelWandAim } from "../../../src/solveDuelWandAim";

/** Typed fixed inputs extracted from the retained actual raised-wand failure. */
interface RaisedWandRegression {
  root: [number, number, number];
  yaw: number;
  seed: IAutoMovieHumanPose;
  wrist: [number, number, number];
  aim: [number, number, number];
}

/** Original admitted-leg inputs preceding every failed actor state in the retained whole round. */
interface RollingBranchInputs {
  cases: { role: "Carina" | "Harry"; frame: number; previousFrame: number; legs: IAutoMovieHumanPose["legs"] }[];
}

/**
 * @evidence contracts/testing.md#observable-behavior Both actual1700-female and1780-male bodies test wand binding, wrist triangles, palm IK, closed toes, full-foot floor refusal and opening hard-hips recovery. Observed turns and54→55 exercise actual support. Opening continuation preserves twist/ankle/foot; exchange uses planned-ankle seeds, hard actual front paths, fixedXZ and soft body height. All16 historical incoming-leg cases exercise current goals. The retired exact-height/heel-direction gates are not screenplay requirements; floor/ROM/tolerances remain. Raised-wand input retains its actual budget. No full-film approval is inferred.
 * @evidence contracts/testing.md#independent-cases The commissioned wand is0.30m; three arm poses expose double transforms and a fresh neutral evaluation checks seeking. Independent public FK supplies a reachable actual palm target within3mm. Actual closed triangles/ray parity inspect every sampled toe; containment failures accumulate without skipping floor-negative, recovery or actual observed turn regression cases, and both casts are attempted. Carina frame379 and Harry312/400 exercise source goal integration with real feet/hips/floor rather than assert a preferred angle as success. Attachment tolerance is1e-8m; nonfinite targets refuse.
 */
export function test_actor_binding(): void {
  const failures: string[] = [];
  for (const [height, sex] of [[1700, AutoMovieHumanSex.Female], [1780, AutoMovieHumanSex.Male]] as const) {
    try { inspectActor(height, sex); }
    catch (error: unknown) { failures.push(`${height}/${sex}: ${String(error)}`); }
  }
  assert.deepEqual(failures, []);
}

/** Run the complete binding/footwear/support population for one actual cast body. */
function inspectActor(height: number, sex: AutoMovieHumanSex): void {
  const actor: ReturnType<typeof createDuelActor> = createDuelActor(createDuelHumanParameters(height, sex), { hair: 0xe5d3a1, house: 0x245d48, glasses: sex === AutoMovieHumanSex.Male, smirk: sex === AutoMovieHumanSex.Female, skirt: sex === AutoMovieHumanSex.Female });
  try {
    actor.object.position.set(2, 0, -3);
    actor.object.rotation.y = 0.7;
    for (const angle of [0, 65, 140]) {
      const output: AutoMovieHumanSkeleton.IOutput = actor.pose({ arms: { left: {}, right: { shoulder: { flexion: angle }, elbow: { flexion: 60 } } } });
      assert.equal(output.clamped.length, 0);
      actor.object.updateMatrixWorld(true);
      const hand: THREE.Vector3 = actor.point("rightHand");
      assert.ok(Math.abs(hand.distanceTo(actor.wandTip()) - 0.30) < 1e-8);
      const tipFromBinding: THREE.Vector3 = actor.drawing.bones.get("rightHand")!.localToWorld(new THREE.Vector3(...actor.wandTipLocal));
      assert.ok(tipFromBinding.distanceTo(actor.wandTip()) < 1e-8);
      assert.ok(output.posed.every((bone: AutoMovieHumanSkeleton.IPlacement): boolean => [...bone.position, ...bone.rotation].every(Number.isFinite)));
    }
    const fresh: AutoMovieHumanSkeleton.IOutput = actor.evaluate({});
    actor.pose({ arms: { left: {}, right: { elbow: { flexion: 85 } } } });
    assert.deepEqual(actor.pose({}).posed, fresh.posed);
    for (const side of ["left", "right"] as const) {
      const wrist: THREE.Vector3 = actor.point(`${side}Hand`);
      const hit: THREE.Vector3 = actor.wristContact(side, wrist.clone().add(new THREE.Vector3(1, 0.3, 0.2)));
      assert.ok(hit.toArray().every(Number.isFinite));
      assert.ok(hit.distanceTo(wrist) > 0.001 && hit.distanceTo(wrist) < 0.15);
    }
    const palm: [number, number, number] = selectDuelPalmPoint(actor.drawing.parts.get("leftHand")!);
    actor.pose({ arms: { left: { shoulder: { flexion: 35 }, elbow: { flexion: 50 } }, right: {} } });
    const target: THREE.Vector3 = actor.drawing.bones.get("leftHand")!.localToWorld(new THREE.Vector3(...palm));
    const contact: ReturnType<typeof solveDuelArmContact> = solveDuelArmContact(actor.evaluate, { arms: { left: { elbow: { flexion: 30 } }, right: {} } }, actor.object, "left", target, palm);
    assert.ok(contact.error <= 0.003);
    assert.equal(contact.output.clamped.length, 0);
    actor.drawing.setPose(contact.output);
    assert.ok(actor.drawing.bones.get("leftHand")!.localToWorld(new THREE.Vector3(...palm)).distanceTo(target) <= 0.003);
    assert.throws((): void => { actor.wristContact("right", new THREE.Vector3(NaN, 0, 0)); });
    assert.throws((): void => { solveDuelArmContact(actor.evaluate, {}, actor.object, "left", new THREE.Vector3(Infinity, 0, 0)); });
    actor.object.position.set(0, 0, 0);
    actor.object.rotation.set(0, 0, 0);
    actor.pose({});
    const footwearFailures: string[] = assertClosedToeCoverage(actor);

    // Bare-foot placement intentionally leaves the real shoe sole below the floor.
    const bare: ReturnType<typeof createDuelGrounding> = createDuelGrounding(actor.drawing, actor.evaluate);
    let minimum: { point: AutoMovieHumanSupportFrame.IPoint; world: THREE.Vector3 } | undefined;
    for (const point of bare.points) {
      const world: THREE.Vector3 = actor.drawing.bones.get(point.bone)!.localToWorld(new THREE.Vector3(...point.localPoint));
      if (minimum === undefined || world.y < minimum.world.y) minimum = { point, world };
    }
    assert.ok(minimum !== undefined);
    actor.object.position.y = -minimum.world.y;
    const targetWorld: THREE.Vector3 = actor.drawing.bones.get(minimum.point.bone)!.localToWorld(new THREE.Vector3(...minimum.point.localPoint));
    const clothed: ReturnType<typeof createDuelGrounding> = createDuelGrounding(actor.drawing, actor.evaluate, actor.shoes.points);
    const below: AutoMovieHumanGrounding.IResult = clothed.solve.inspect({}, { translation: [0, actor.object.position.y, 0], rotation: [0, 0, 0, 1] }, { targets: [{ ...minimum.point, position: [targetWorld.x, targetWorld.y, targetWorld.z] }], channels: [], rootAxes: [], tolerance: 0.001, floorTolerance: 0.00001 });
    try {
      assert.ok(below.supportError < 1e-6);
      assert.ok(below.floorMinimum < -0.003);
      assert.equal(below.status, "unresolved");
    } catch (error: unknown) { footwearFailures.push(`Floor negative control: ${String(error)}`); }

    const feet: ReturnType<typeof createDuelFootFitter> = createDuelFootFitter(actor);
    actor.object.position.y = -Math.min(feet.reference.left.y, feet.reference.right.y);
    const left: THREE.Vector3 = feet.reference.left.clone();
    const right: THREE.Vector3 = feet.reference.right.clone();
    left.y = 0;
    right.y = 0;
    actor.object.position.y -= 0.4;
    actor.pose({ legs: { left: { knee: { flexion: 80 } }, right: { knee: { flexion: 80 } } } });
    const recovered: ReturnType<typeof feet.fit> = feet.fit({ legs: { left: { knee: { flexion: 5 } }, right: { knee: { flexion: 5 } } } }, left, right, "lowest", 0, 0);
    try {
      assert.equal(recovered.input.request.preferred?.["legs.left.knee.flexion"], 5);
      assert.equal(recovered.status, "admitted");
      assert.ok(recovered.root.translation[1] > -0.02, "Neutral ready stance must not inherit a deep numerical crouch");
      assert.ok(recovered.input.request.targets.some((target: AutoMovieHumanGrounding.IRequest["targets"][number]): boolean => target.bone === "hips"));
      actor.object.position.set(...recovered.root.translation);
      actor.pose(recovered.pose);
      assert.equal(feet.inspect(recovered.pose, left, right, "lowest", 0, 0, { legs: { left: { knee: { flexion: 5 } }, right: { knee: { flexion: 5 } } } }).status, "admitted");
    } catch (error: unknown) { footwearFailures.push(`Physical ready recovery: ${String(error)}`); }
    const lifted: THREE.Vector3 = left.clone();
    lifted.y = 0.04;
    const swing: ReturnType<typeof feet.fit> = feet.fit({ legs: { left: { knee: { flexion: 5 } }, right: { knee: { flexion: 5 } } } }, lifted, right);
    try {
      assert.equal(swing.status, "admitted");
      assert.equal(swing.input.request.softTargets?.length, 1);
      const material: AutoMovieHumanSupportFrame.IPoint = actor.shoes.heel.left;
      assert.ok(swing.input.request.targets.some((target: AutoMovieHumanGrounding.IRequest["targets"][number]): boolean => target.bone === material.bone && JSON.stringify(target.localPoint) === JSON.stringify(material.localPoint) && target.position[1] === 0.04), "Swing's actual sole material point remains a hard path target");
      actor.object.position.set(...swing.root.translation);
      actor.pose(swing.pose);
      const actual: THREE.Vector3 = actor.drawing.bones.get(material.bone)!.localToWorld(new THREE.Vector3(...material.localPoint));
      assert.ok(actual.distanceTo(lifted) <= 0.003);
      assert.ok(swing.floorMinimum >= -0.00001);
    } catch (error: unknown) { footwearFailures.push(`Swing material-point support: ${String(error)}`); }
    const frontLeft: THREE.Vector3 = feet.ballReference.left.clone();
    const frontRight: THREE.Vector3 = feet.ballReference.right.clone();
    frontLeft.y = 0.025;
    frontRight.y = 0;
    const rolled: ReturnType<typeof feet.fit> = feet.fit({ legs: { left: { knee: { flexion: 5 } }, right: { knee: { flexion: 5 } } } }, frontLeft, frontRight, "rolling");
    try {
      assert.equal(rolled.status, "admitted");
      assert.equal(rolled.input.request.targets.length, 3, "Both front paths and hips stay hard during a rolling transfer");
      assert.equal(rolled.input.request.softTargets?.length, 2, "Only secondary heel orientation becomes optional");
      assert.ok(rolled.floorMinimum >= -0.00001);
      for (const material of [actor.shoes.ball.left, actor.shoes.ball.right])
        assert.ok(rolled.input.request.targets.some((target: AutoMovieHumanGrounding.IRequest["targets"][number]): boolean => target.bone === material.bone && JSON.stringify(target.localPoint) === JSON.stringify(material.localPoint)));
    } catch (error: unknown) { footwearFailures.push(`Rolling material-point support: ${String(error)}`); }
    const role: "Carina" | "Harry" = sex === AutoMovieHumanSex.Female ? "Carina" : "Harry";
    for (const frame of sex === AutoMovieHumanSex.Female ? [309, 310, 377, 378, 379] : [261, 312, 384, 400]) {
      const plan: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(frame / 24, role, feet.ballReference);
      actor.object.position.copy(plan.position);
      actor.object.rotation.set(0, plan.yaw, 0);
      const fitted: ReturnType<typeof feet.fit> = feet.fit(plan.pose, plan.left, plan.right, plan.footMode, plan.yaw, plan.heelTilt, undefined, undefined, "fixed-xz");
      try {
        assert.equal(fitted.status, "admitted", `${role} frame${frame}: ${fitted.reason},${fitted.error}m`);
        assert.ok(fitted.error <= 0.003 && fitted.floorMinimum >= -0.00001);
        assert.equal(fitted.output.clamped.length, 0);
        if (role === "Harry" && frame === 261) {
          const readyPose: IAutoMovieHumanPose = structuredClone(plan.pose);
          readyPose.legs = { left: { knee: { flexion: 5 } }, right: { knee: { flexion: 5 } } };
          const ready: ReturnType<typeof feet.fit> = feet.fit(readyPose, plan.left, plan.right, plan.footMode, plan.yaw, plan.heelTilt, undefined, undefined, "fixed-xz");
          assert.ok(fitted.bodyPlan.hip[1] < ready.bodyPlan.hip[1] - 0.005, "Authored engagement changes preferred body height without turning it into a required3mm gate");
        }
      } catch (error: unknown) { footwearFailures.push(`Observed turn regression: ${String(error)}`); }
    }
    const branchInputs: RollingBranchInputs = JSON.parse(readFileSync(new URL("../../fixtures/rolling-branch-inputs.json", import.meta.url), "utf8")) as RollingBranchInputs;
    for (const recorded of branchInputs.cases.filter((row: RollingBranchInputs["cases"][number]): boolean => row.role === role)) {
      const plan: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(recorded.frame / 24, role, feet.ballReference);
      const fitted: ReturnType<typeof feet.fit> = feet.fit(plan.pose, plan.left, plan.right, plan.footMode, plan.yaw, plan.heelTilt, { legs: recorded.legs }, undefined, "fixed-xz");
      try {
        assert.equal(fitted.input.predictor, "planned-ankle");
        assert.equal(fitted.input.seedKind, "current-ankle-analytic");
        assert.equal(fitted.input.request.targets.length, 2, "Both actual front paths stay mandatory; expressive heel direction and body height remain soft");
        assert.deepEqual(fitted.input.request.rootAxes, ["y"]);
        assert.ok(fitted.input.request.softTargets!.some((target: AutoMovieHumanGrounding.IRequest["targets"][number]): boolean => target.bone === "hips"));
        assert.equal(fitted.root.translation[0], fitted.input.root.translation[0], "Fitted height cannot drift the horizontal action path");
        assert.equal(fitted.root.translation[2], fitted.input.root.translation[2]);
        for (const side of ["left", "right"] as const) {
          assert.equal(Math.abs(fitted.input.seed.legs?.[side].hip?.rotation ?? NaN), 0, "Fresh planar proposal cannot carry the historical limit twist");
          assert.equal(fitted.input.seed.legs?.[side].ankle?.dorsiflexion, 0);
          assert.deepEqual(fitted.input.seed.legs?.[side].foot, plan.pose.legs?.[side].foot);
        }
        assert.equal(fitted.status, "admitted", `${role} historical frame${recorded.frame}: ${fitted.reason},${fitted.error}m`);
        assert.ok(fitted.error <= 0.003 && fitted.floorMinimum >= -0.00001);
        assert.equal(fitted.output.clamped.length, 0);
      } catch (error: unknown) { footwearFailures.push(`Rolling branch input: ${String(error)}`); }
    }
    if (sex === AutoMovieHumanSex.Male) {
      const first: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(54 / 24, "Harry", feet.ballReference);
      const next: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(55 / 24, "Harry", feet.ballReference);
      actor.object.rotation.set(0, first.yaw, 0);
      const entry: ReturnType<typeof feet.fit> = feet.fit(first.pose, first.left, first.right, first.footMode, first.yaw, first.heelTilt);
      actor.object.position.set(...entry.root.translation);
      actor.pose(entry.pose);
      const knee: THREE.Vector3 = actor.point("rightLowerLeg");
      actor.object.rotation.set(0, next.yaw, 0);
      const continued: ReturnType<typeof feet.fit> = feet.fit(next.pose, next.left, next.right, next.footMode, next.yaw, next.heelTilt, entry.pose);
      actor.object.position.set(...continued.root.translation);
      actor.pose(continued.pose);
      try {
        assert.equal(entry.status, "admitted");
        assert.equal(continued.status, "admitted");
        assert.equal(continued.input.seedKind, "admitted-leg-continuation");
        assert.equal(continued.input.predictor, "selective-positional");
        assert.equal(continued.input.request.preferred?.["legs.right.knee.flexion"], 5, "Numerical continuation cannot replace the authored preference");
        for (const side of ["left", "right"] as const) {
          assert.equal(continued.input.seed.legs?.[side].hip?.rotation, entry.pose.legs?.[side].hip?.rotation);
          assert.deepEqual(continued.input.seed.legs?.[side].ankle, entry.pose.legs?.[side].ankle);
          assert.deepEqual(continued.input.seed.legs?.[side].foot, entry.pose.legs?.[side].foot);
          const bone: "leftLowerLeg" | "rightLowerLeg" = `${side}LowerLeg`;
          const previousPoint: AutoMovieHumanSkeleton.IPlacement = entry.output.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === bone)!;
          const expected: THREE.Vector3 = new THREE.Vector3(...previousPoint.position).applyQuaternion(new THREE.Quaternion(...continued.input.root.rotation)).add(new THREE.Vector3(...continued.input.root.translation));
          const target: AutoMovieHumanGrounding.IRequest["targets"][number] = continued.input.request.softTargets!.find((point: AutoMovieHumanGrounding.IRequest["targets"][number]): boolean => point.bone === bone)!;
          assert.ok(expected.distanceTo(new THREE.Vector3(...target.position)) < 1e-10, "Knee continuity uses the fresh body frame exactly once");
        }
        assert.equal(continued.preparation.passes.length, 1);
        assert.ok(continued.preparation.totalIterations <= 16);
        assert.ok(actor.point("rightLowerLeg").distanceTo(knee) < 0.08, "Observed168mm frame-local knee jump must not return in this short transfer");
      } catch (error: unknown) { footwearFailures.push(`Admitted lower continuation: ${String(error)}`); }
    }
    if (sex === AutoMovieHumanSex.Female) {
      const regression: RaisedWandRegression = JSON.parse(readFileSync(new URL("../../fixtures/carina-raised-wand-budget.json", import.meta.url), "utf8")) as RaisedWandRegression;
      actor.object.position.set(...regression.root);
      actor.object.rotation.set(0, regression.yaw, 0);
      const fitted: ReturnType<typeof solveDuelWandAim> = solveDuelWandAim(actor.evaluate, regression.seed, actor.object, new THREE.Vector3(...regression.wrist), new THREE.Vector3(...regression.aim), actor.wandTipLocal);
      actor.pose(fitted.pose);
      try {
        assert.ok(fitted.error <= 0.002, `Actual raised-wand regression remains ${fitted.error}m`);
        assert.ok(fitted.preparation.passes.length <= 2 && fitted.preparation.totalIterations <= 32);
        const expected: THREE.Vector3 = new THREE.Vector3(...regression.wrist).add(new THREE.Vector3(...regression.aim).sub(new THREE.Vector3(...regression.wrist)).normalize().multiplyScalar(0.30));
        assert.ok(actor.point("rightHand").distanceTo(new THREE.Vector3(...regression.wrist)) <= 0.002);
        assert.ok(actor.wandTip().distanceTo(expected) <= 0.002);
        assert.equal(fitted.output.clamped.length, 0);
      } catch (error: unknown) { footwearFailures.push(`Observed raised-wand budget: ${String(error)}`); }
    }
    assert.deepEqual(footwearFailures, []);
  } finally {
    actor.dispose();
  }
}

/** Inspect real closed-shell triangles and toe containment in the movie's authored foot range. */
function assertClosedToeCoverage(actor: ReturnType<typeof createDuelActor>): string[] {
  const failures: string[] = [];
  const parents: Map<string, string | null> = new Map(actor.evaluate({}).bones.map((bone: AutoMovieHumanSkeleton.IBone): [string, string | null] => [bone.bone, bone.parent]));
  for (const side of ["left", "right"] as const) {
    const shoe: THREE.Mesh = actor.shoes.parts.get(side)!;
    const index: THREE.BufferAttribute = shoe.geometry.index!;
    const edges: Map<string, number> = new Map();
    for (let triangle: number = 0; triangle < index.count; triangle += 3) {
      const corners: number[] = [index.getX(triangle), index.getX(triangle + 1), index.getX(triangle + 2)];
      for (let edge: number = 0; edge < 3; edge++) {
        const a: number = corners[edge]!;
        const b: number = corners[(edge + 1) % 3]!;
        const key: string = `${Math.min(a, b)}:${Math.max(a, b)}`;
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
    }
    if (![...edges.values()].every((count: number): boolean => count === 2)) failures.push(`${side} shell is not closed`);
    for (const flexion of [0, -5, -15]) {
      const toe: { mtpFlexion: number } = { mtpFlexion: flexion };
      const foot: { hallux: typeof toe; second: typeof toe; third: typeof toe; fourth: typeof toe; fifth: typeof toe } = { hallux: toe, second: toe, third: toe, fourth: toe, fifth: toe };
      actor.pose({ legs: { left: { ankle: { dorsiflexion: 8 }, foot }, right: { ankle: { dorsiflexion: 8 }, foot } } });
      let checked: number = 0;
      for (const [bone, mesh] of actor.drawing.parts) {
        let ancestor: string | null | undefined = parents.get(bone);
        while (ancestor !== undefined && ancestor !== null && ancestor !== `${side}Midfoot`) ancestor = parents.get(ancestor);
        if (ancestor !== `${side}Midfoot`) continue;
        const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
        for (let vertex: number = 0; vertex < attribute.count; vertex++) {
          const world: THREE.Vector3 = mesh.localToWorld(new THREE.Vector3(attribute.getX(vertex), attribute.getY(vertex), attribute.getZ(vertex)));
          if (!insideShoe(shoe, world)) failures.push(`${side} ${bone} toe vertex${vertex},MTP${flexion}`);
          checked++;
        }
      }
      if (checked === 0) failures.push(`${side} MTP${flexion}: no actual toes inspected`);
    }
  }
  actor.pose({});
  return failures;
}

/** Odd intersections against the actual closed triangle shell classify a padded interior point. */
function insideShoe(shoe: THREE.Mesh, world: THREE.Vector3): boolean {
  const origin: THREE.Vector3 = shoe.worldToLocal(world.clone());
  const ray: THREE.Ray = new THREE.Ray(origin, new THREE.Vector3(1, 0.293, 0.173).normalize());
  const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = shoe.geometry.getAttribute("position");
  const index: THREE.BufferAttribute = shoe.geometry.index!;
  const hits: number[] = [];
  for (let triangle: number = 0; triangle < index.count; triangle += 3) {
    const vertices: THREE.Vector3[] = [0, 1, 2].map((corner: number): THREE.Vector3 => {
      const slot: number = index.getX(triangle + corner);
      return new THREE.Vector3(attribute.getX(slot), attribute.getY(slot), attribute.getZ(slot));
    });
    const hit: THREE.Vector3 | null = ray.intersectTriangle(vertices[0]!, vertices[1]!, vertices[2]!, false, new THREE.Vector3());
    if (hit !== null) {
      const distance: number = origin.distanceTo(hit);
      if (!hits.some((value: number): boolean => Math.abs(value - distance) < 1e-7)) hits.push(distance);
    }
  }
  return hits.length % 2 === 1;
}
