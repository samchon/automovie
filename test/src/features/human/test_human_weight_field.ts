import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanWeightField as F } from "../../../../packages/human/src/skeleton/AutoMovieHumanWeightField";
import { AutoMovieHumanArmClearance } from "../../../../packages/human/src/skeleton/AutoMovieHumanArmClearance";

/**
 * Influence values, derivatives and support widths obey the same continuous
 * partition before the mesh's four-influence representation.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates an isolated hinge and overlapping child gates, comparing field values and analytic derivatives with closed-form cubic partitions and independent central differences; catches rounded weight staircases, mass lost at overlapping branches and a hinge width sized by the nearest instead of the outer skin radius.
 * @evidence contracts/testing.md#independent-expectations The cubic polynomial supplies the hinge weight and derivative. A two-bone equal-centre DQ rotation has angle 2 atan2(w sin(theta/2),1-w+w cos(theta/2)), evaluated independently here to measure the outer cylinder's stretch. The legacy 1.5 inner-radius width is red above stretch two; the derived width is green at two. An intentionally quantized field is red against the derivative oracle while the continuous field is green. This fixture proves the field mathematics, not anatomical joint form or nonlocal contact.
 * @evidence contracts/testing.md#distinguishing-cases Empty, single and overlapping child partitions, endpoints outside compact support, an interior non-round weight, three spatial derivatives, and sufficient versus insufficient anatomical support length. Whole-person pose, skin contact and export wiring are owned by their anatomy and binding tests.
 * @evidence contracts/testing.md#execution-ownership A portable synchronous unit discoverable as test_human_weight_field, using synthetic fields with no person generation, process, browser or GPU.
 */
export function test_human_weight_field(): void {
  const child: F.ILimb = limb(1);
  child.planes = [{ at: [0, 0, 0], normal: [0, 1, 0], half: 0.1 }];
  const root: F.ILimb = limb(0, [child]);
  const tree: F.ITree = { root, arms: [], chest: 0 };
  const p: F.Vector = [0.01, 0.012345, 0.002];
  const u: number = (p[1] / 0.1 + 1) / 2;
  const expected: number = 3 * u ** 2 - 2 * u ** 3;
  const derivative: number = 3 * u * (1 - u) / 0.1;
  const field: F.IInfluence[] = F.evaluate(p, tree, true);
  const own: F.IInfluence = field.find((row: F.IInfluence): boolean => row.slot === 1)!;
  TestValidator.predicate("cubic weight", Math.abs(own.weight - expected) < 1e-12);
  TestValidator.predicate("cubic derivative", Math.abs(own.gradient[1] - derivative) < 1e-12);
  TestValidator.predicate("unrounded gradient is observable", difference(tree, p, 1, false) > 1);
  TestValidator.predicate("legacy thousandth rounding loses the derivative", difference(tree, p, 1, true) === 0);

  for (const y of [-0.2, -0.1, 0, 0.012345, 0.1, 0.2])
    partition(tree, [p[0], y, p[2]]);
  const sibling: F.ILimb = limb(2);
  sibling.planes = [{ at: [0, 0, 0], normal: [1, 0, 0], half: 0.1 }];
  root.kids.push(sibling);
  for (const x of [-0.2, 0, 0.2])
    for (const y of [-0.2, 0, 0.2]) partition(tree, [x, y, 0.01]);
  partition({ root: limb(0), arms: [], chest: 0 }, [0, 0, 0]);
  const axial: F.ILimb = limb(0);
  axial.from = [0, -0.2, 0];
  axial.to = [0, 0.3, 0];
  axial.near = 0.1;
  axial.far = 0.1;
  const arms: F.IArm[] = [-1, 1].map((side: number, index: number): F.IArm => {
    const girdle: F.ILimb = limb(index + 1);
    girdle.side = side;
    girdle.from = [0, 0.1, 0];
    girdle.to = [0, 0.1, side * 0.15];
    girdle.rivals = [axial];
    const humerus: F.ILimb = limb(index + 3);
    humerus.from = girdle.to;
    humerus.to = [0, -0.2, side * 0.3];
    humerus.planes = [{ at: girdle.to, normal: [0, -1, 0], half: 0.15 }];
    girdle.kids = [humerus];
    return { limb: girdle, carrier: girdle.slot, own: [girdle, humerus], contest: 0.2 };
  });
  const armed: F.ITree = { root: axial, arms, chest: 0 };
  for (const z of [-0.22, -0.14, 0.001, 0.14, 0.22]) partition(armed, [0.04, 0.08, z]);
  let degenerate: boolean = false;
  try { F.evaluate([0, 0.05, 0], armed, true); }
  catch { degenerate = true; }
  TestValidator.predicate("undefined centreline radial derivative is refused", degenerate);

  const radius: number = 0.063;
  const theta: number = 139.8 * Math.PI / 180;
  const half: number = F.halfWidth(radius, theta, 0.4, 1);
  TestValidator.predicate("nearest-skin width tears the outer skin", cylinderStretch(radius, theta, 1.5 * 0.045) > 2);
  TestValidator.predicate("outer-radius DQ width respects stretch two", Math.abs(cylinderStretch(radius, theta, half) - 2) < 1e-7);
  const capacity: F.ISupport = F.support(radius, theta, 0.03, 1);
  TestValidator.predicate("insufficient capacity is explicit", !capacity.supported && capacity.required > capacity.available && capacity.stretchBound! > 2);
  const capped: number = capacity.half;
  TestValidator.predicate("anatomical length cap stays explicit", capped === 0.03 && cylinderStretch(radius, theta, capped) > 2);

  const arm: AutoMovieHumanArmClearance.IArm = { shoulder: [0, 1000, 130], upperLength: 300, foreLength: 250, upperRadius: 40, foreRadius: 30, side: 1 };
  const skin: AutoMovieHumanArmClearance.Vector[] = [[0, 900, 100], [0, 600, 20]];
  const angle: number = AutoMovieHumanArmClearance.angle(arm, skin) * Math.PI / 180;
  TestValidator.predicate("forearm-only legacy clearance misses the chest", AutoMovieHumanArmClearance.angle(arm, skin.slice(1)) === 0 && angle > 0);
  const gap: number = 100 * Math.sin(angle) - (-30) * Math.cos(angle) - 40;
  TestValidator.predicate("upper-arm contact closes by geometry", Math.abs(gap) < 1e-10);
  const reflected: AutoMovieHumanArmClearance.IArm = { ...arm, shoulder: [0, 1000, -130], side: -1 };
  const reflectedSkin: AutoMovieHumanArmClearance.Vector[] = skin.map((p: AutoMovieHumanArmClearance.Vector): AutoMovieHumanArmClearance.Vector => [p[0], p[1], -p[2]]);
  TestValidator.predicate("clearance respects reflection", Math.abs(AutoMovieHumanArmClearance.angle(reflected, reflectedSkin) - angle * 180 / Math.PI) < 1e-12);
  const broader: AutoMovieHumanArmClearance.IArm = { shoulder: [0, 1000, 0], upperLength: 300, foreLength: 250, upperRadius: 40, foreRadius: 80, side: 1 };
  const nearElbow: AutoMovieHumanArmClearance.Vector[] = [[0, 710, 100]];
  const solved: number = AutoMovieHumanArmClearance.angle(broader, nearElbow) * Math.PI / 180;
  const legacy: number = Math.atan2(100, 290) + Math.asin(40 / Math.hypot(100, 290));
  const gapAt = (angle: number): number => {
    const along: number = Math.max(300, Math.min(550, 100 * Math.sin(angle) + 290 * Math.cos(angle)));
    return Math.hypot(100 - along * Math.sin(angle), 290 - along * Math.cos(angle)) - 80;
  };
  TestValidator.predicate("vertical-depth radius selection is red", gapAt(legacy) < -39.9);
  TestValidator.predicate("larger forearm endpoint closes without penetration", Math.abs(gapAt(solved)) < 1e-9);
  TestValidator.predicate("empty skin imposes no abduction", AutoMovieHumanArmClearance.angle(broader, []) === 0);
  for (const degrees of [30, 90, 139.8, 180])
    for (const strain of [1, 2]) {
      const angle: number = degrees * Math.PI / 180;
      const width: number = F.halfWidth(radius, angle, 1, strain);
      for (let station: number = -1; station <= 1; station += 0.02)
        TestValidator.predicate("isolated bound covers the complete cubic ramp", cylinderStretch(radius, angle, width, station * width) <= 1 + strain + 1e-6);
    }
  const unproved: number = 3 * radius / 0.5;
  TestValidator.predicate("a small budget can peak away from the middle", cylinderStretch(radius, Math.PI, unproved, 0.2 * unproved) > 1.5);
  let refusedBudget: boolean = false;
  try { F.support(radius, Math.PI, 1, 0.5); }
  catch { refusedBudget = true; }
  TestValidator.predicate("unsupported small stretch budgets are explicit", refusedBudget);
}

/** An inert branch; a test adds only the gates it exercises. */
function limb(slot: number, kids: F.ILimb[] = []): F.ILimb {
  return { slot, from: [0, 0, 0], to: [0, 1, 0], near: 0.05, far: 0.05, planes: [], lips: null, midline: 0, clear: null, side: 0, rivals: [], own: [], contest: 0, kids };
}

/** Central difference of the exported or intentionally quantized child weight. */
function difference(tree: F.ITree, p: F.Vector, axis: number, quantized: boolean): number {
  const step: number = 1e-8;
  const read = (sign: number): number => {
    const q: F.Vector = [...p];
    q[axis]! += sign * step;
    const weight: number = F.evaluate(q, tree, false).find((row: F.IInfluence): boolean => row.slot === 1)?.weight ?? 0;
    return quantized ? Math.round(weight * 1000) / 1000 : weight;
  };
  return (read(1) - read(-1)) / (2 * step);
}

/** Check conservation of values and jets, and all independently differentiated entries. */
function partition(tree: F.ITree, p: F.Vector): void {
  const rows: F.IInfluence[] = F.evaluate(p, tree, true);
  TestValidator.predicate("nonnegative partition", rows.every((row: F.IInfluence): boolean => row.weight >= 0 && Number.isFinite(row.weight)));
  TestValidator.predicate("partition sums to one", Math.abs(rows.reduce((sum: number, row: F.IInfluence): number => sum + row.weight, 0) - 1) < 1e-12);
  for (let axis: number = 0; axis < 3; axis++) {
    const total: number = rows.reduce((sum: number, row: F.IInfluence): number => sum + row.gradient[axis]!, 0);
    TestValidator.predicate("partition derivative sums to zero", Math.abs(total) < 1e-12);
    for (const row of rows) {
      const step: number = 1e-7;
      const read = (sign: number): number => {
        const q: F.Vector = [...p];
        q[axis]! += sign * step;
        return F.evaluate(q, tree, false).find((entry: F.IInfluence): boolean => entry.slot === row.slot)?.weight ?? 0;
      };
      const expected: number = (read(1) - read(-1)) / (2 * step);
      TestValidator.predicate("analytic gradient matches independent difference", Math.abs(expected - row.gradient[axis]!) < 1e-4);
    }
  }
}

/** Outer cylinder's axial stretch under a two-rotation DQ blend. */
function cylinderStretch(radius: number, theta: number, half: number, at: number = 0): number {
  const step: number = 1e-7;
  const point = (y: number): [number, number] => {
    const u: number = Math.max(0, Math.min(1, (y / half + 1) / 2));
    const w: number = 3 * u ** 2 - 2 * u ** 3;
    const angle: number = 2 * Math.atan2(w * Math.sin(theta / 2), 1 - w + w * Math.cos(theta / 2));
    return [radius * Math.cos(angle) - y * Math.sin(angle), radius * Math.sin(angle) + y * Math.cos(angle)];
  };
  const a: [number, number] = point(at - step);
  const b: [number, number] = point(at + step);
  return Math.hypot(b[0] - a[0], b[1] - a[1]) / (2 * step);
}
