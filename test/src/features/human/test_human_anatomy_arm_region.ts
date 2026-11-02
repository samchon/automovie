import { TestValidator } from "@nestia/e2e";

import { HumanAnatomy as A } from "../internal/HumanAnatomy";
import { nclose } from "../internal/nclose";

/**
 * Whole-arm selection preserves a bent elbow's complete tape ring.
 *
 * Scenarios:
 * 1. Straight and bowed intact tubes enclose their axes on both sides.
 * 2. A tube displaced 45 mm leaves its axis 25 mm outside the skin.
 * 3. Opposite-side and similarly named chains contribute no triangles.
 *
 * @evidence contracts/testing.md#behavioral-verification Cuts analytic round tubes through the same armRegion selection used by the skin anatomy audit. A straight or bowed intact tube must keep its whole circumference and contain its axis; a displaced tube must still expose the displacement. With the previous 90 mm shoulder-to-knuckle capsule the bowed case has no cut, so it fails the same positive assertion.
 * @evidence contracts/testing.md#independent-expectations A 20 mm circle has circumference 40 pi and a 45 mm translation puts its original centre 25 mm outside it. A 0.1 mm allowance covers the 128-sided circle's less than 0.013 mm perimeter deficit and linear interpolation of a 130 sin(pi t) centre line at 5 mm row pitch; its second-derivative chord bound is under 0.045 mm. The unmodified local proof reads 125.651 mm and zero outside for the intact bowed tube, and 24.996 mm outside after translation. No generated person's prior enters.
 * @evidence contracts/testing.md#distinguishing-cases Covers left and right, straight and bent, intact and displaced, and excludes the opposite arm plus the leftish/rightish name boundary. Whole-person tape values, poses and skin health remain with the anatomy and curve tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU test reached by --include human_anatomy_arm_region. It creates only local typed arrays and invokes the maintained plane cutter; no process, host or GPU is started.
 */
export function test_human_anatomy_arm_region(): void {
  for (const side of ["left", "right"] as const) {
    for (const bow of [0, 130]) {
      for (const offset of [0, 45]) {
        const skin: A.ISkin = tube(bow, offset, side);
        const origin: A.V3 = [bow, 150.123, 0];
        const cut: A.ICut | null = A.cut(skin, origin, [0, 1, 0], origin, A.armRegion(skin, side));
        TestValidator.predicate(`${side} ${bow} ${offset}: full ring`, cut !== null);
        if (cut === null) continue;
        TestValidator.predicate("round circumference", nclose(cut.girth, 40 * Math.PI, 0.1));
        TestValidator.predicate("axis containment", nclose(cut.outside, offset === 0 ? 0 : 25, 0.1));
        TestValidator.predicate("contained flag", cut.contained === (offset === 0));
      }
    }
    const skin: A.ISkin = tube(130, 0, side);
    skin.chains[0] = `arm.${side === "left" ? "right" : "left"}`;
    TestValidator.predicate("opposite arm excluded", A.armRegion(skin, side).length === 0);
    skin.chains[0] = `arm.${side}ish`;
    TestValidator.predicate("chain boundary", A.armRegion(skin, side).length === 0);
  }
}

/** Round sections perpendicular to a sinusoidal axis, before any skin generator. */
function tube(bow: number, offset: number, side: "left" | "right"): A.ISkin {
  const positions: number[] = [];
  const indices: number[] = [];
  const owners: number[] = [];
  const rows: number = 60;
  const phases: number = 128;
  for (let k: number = 0; k <= rows; k++) {
    const t: number = k / rows;
    const x: number = offset + bow * Math.sin(Math.PI * t);
    const dx: number = bow * Math.PI * Math.cos(Math.PI * t);
    const norm: number = Math.hypot(300, dx);
    for (let j: number = 0; j < phases; j++) {
      const p: number = (2 * Math.PI * j) / phases;
      positions.push(x + 6000 * Math.cos(p) / norm, 300 * (1 - t) + 20 * Math.cos(p) * dx / norm, 20 * Math.sin(p));
    }
    if (k === rows) continue;
    for (let j: number = 0; j < phases; j++) {
      const a: number = k * phases + j;
      const b: number = k * phases + (j + 1) % phases;
      indices.push(a, b, a + phases, b, b + phases, a + phases);
      owners.push(0, 0);
    }
  }
  return { name: "analytic arm", P: Float64Array.from(positions), I: Uint32Array.from(indices), tri: Int32Array.from(owners), chains: [`arm.${side}`], joints: new Map() };
}
