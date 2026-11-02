import { TestValidator } from "@nestia/e2e";

import type { AutoMovieHumanMeasurementProtocol as P } from "../../../../packages/human/src/generation/AutoMovieHumanMeasurementProtocol";
import { HumanAnatomy as A } from "../internal/HumanAnatomy";
import { HumanMeasurementSite as M } from "../internal/HumanMeasurementSite";
import { nclose } from "../internal/nclose";

/**
 * Owned measurement addresses exclude unrelated surface features.
 *
 * Scenarios:
 * 1. A larger abdomen cannot move an independently marked chest section.
 * 2. Forearm bellies at 7, 30 and 65 percent remain eligible in their domain.
 * 3. A displaced crease cannot replace the independently marked wrist section.
 * 4. Planar and non-planar contact courses read the skin, including a changed radius.
 * 5. Uniform scaling and rigid rotation carry the address and its reading together.
 * 6. A missing address or an empty surface cannot produce a finite success.
 *
 * @evidence contracts/testing.md#behavioral-verification Cuts analytically specified tube skins at declared sites and searches their full owned domain. It catches the former abdomen distraction, restricted maximum window and substituted wrist origin, while allowing independently changed neighbouring geometry. Contact courses must respond to actual skin radius rather than the contact points' stored radii.
 * @evidence contracts/testing.md#independent-expectations Circular sections have perimeter 2 pi r. A 128-sided inscribed circle's perimeter deficit is below 0.02 mm for r at most 30. The smooth 5 exp(-((s-b)/20)^2) belly sampled within 1 mm of its maximum loses at most 2 pi times 5 times (1-exp(-1/400)), below 0.079 mm. The 0.1 mm allowance covers both deficits. Non-planar length is independently integrated from analytic speed of the prescribed cubic course, rather than its measured polygon. A 2x similarity must double lengths. No person is generated and no production target is read.
 * @evidence contracts/testing.md#distinguishing-cases Includes enlarged neighbouring abdomen, proximal and distal muscle maxima, displaced wrist crease, radius changes independent of guide contacts, non-planar contacts, rigid rotation plus scaling, absent metadata and empty triangles. Whole-person shape, pose health and the correctness of each owner's anatomical modelling premise remain separate campaign checks.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test test_human_measurement_sites, selected by --include human_measurement_sites. It allocates local typed-array fixtures and calls the maintained independent skin reader; no host, process or GPU is started.
 */
export function test_human_measurement_sites(): void {
  const fixed: P.ISite = site({ kind: "section", origin: [0, 75, 0], normal: [0, 1, 0] });
  const chest: A.ISkin = tube((s: number): number => 20 + 10 * Math.exp(-(((s - 20) / 5) ** 2)));
  const chestRead: M.IReading = M.read(chest, fixed);
  TestValidator.predicate("marked chest survives larger abdomen", nclose(chestRead.girth, 40 * Math.PI, 0.1));
  const global: M.IReading = M.read(chest, site({ kind: "maximum", start: [0, 1, 0], end: [0, 99, 0], normal: [0, 1, 0] }));
  TestValidator.predicate("wrong global chest must be red", !nclose(global.girth, 40 * Math.PI, 0.1));

  for (const belly of [7, 30, 65]) {
    const skin: A.ISkin = tube((s: number): number => 20 + 5 * Math.exp(-(((s - belly) / 20) ** 2)));
    const read: M.IReading = M.read(skin, site({ kind: "maximum", start: [0, 0, 0], end: [0, 100, 0], normal: [0, 1, 0] }));
    TestValidator.predicate(`full muscle domain includes ${belly}% belly`, nclose(read.girth, 50 * Math.PI, 0.1));
    if (belly !== 30) {
      const restricted: M.IReading = M.read(skin, site({ kind: "maximum", start: [0, 10, 0], end: [0, 60, 0], normal: [0, 1, 0] }));
      TestValidator.predicate("old restricted domain is red", !nclose(restricted.girth, 50 * Math.PI, 0.1));
    }
  }

  const wrist: A.ISkin = tube((s: number): number => 20 + 0.2 * Math.abs(s - 40));
  const actual: M.IReading = M.read(wrist, site({ kind: "section", origin: [0, 40, 0], normal: [0, 1, 0] }));
  const substituted: M.IReading = M.read(wrist, site({ kind: "section", origin: [0, 48.5, 0], normal: [0, 1, 0] }));
  TestValidator.predicate("owned wrist plane is green", nclose(actual.girth, 40 * Math.PI, 0.1));
  TestValidator.predicate("displaced crease substitution is red", !nclose(substituted.girth, 40 * Math.PI, 0.1));

  const course: P.ICourse = { kind: "course", origin: [0, 50, 0], normal: [0, 1, 0], front: [1, 0, 0], contacts: [[20, 50, 0], [0, 50, 20], [-20, 50, 0], [0, 50, -20]] };
  const round: A.ISkin = tube((): number => 20);
  const planar: M.IReading = M.read(round, site(course));
  TestValidator.predicate("planar course circumference", nclose(planar.girth, 40 * Math.PI, 0.1));
  const larger: M.IReading = M.read(tube((): number => 25), site(course));
  TestValidator.predicate("course reads skin radius, not guide radius", nclose(larger.girth, 50 * Math.PI, 0.1));
  const nonplanar: P.ICourse = { ...course, contacts: [[20, 40, 0], [0, 50, 20], [-20, 60, 0], [0, 50, -20]] };
  const raised: M.IReading = M.read(round, site(nonplanar));
  const expected: number = nonplanarLength();
  TestValidator.predicate("non-planar course matches independent speed integral", nclose(raised.girth, expected, 0.1));
  TestValidator.predicate("a planar substitution is red", !nclose(planar.girth, expected, 0.1));
  for (let k: number = 0; k < 4; k++)
    TestValidator.predicate("course crosses every contact height", nclose(raised.points[90 * k]![1], nonplanar.contacts[k]![1], 1e-8));

  const transformed: A.ISkin = { ...round, P: Float64Array.from(round.P, (value: number, index: number): number => index % 3 === 0 ? 2 * round.P[index + 1]! : index % 3 === 1 ? -2 * round.P[index - 1]! : 2 * value) };
  const moved: M.IReading = M.read(transformed, site({ kind: "section", origin: [100, 0, 0], normal: [1, 0, 0] }));
  TestValidator.predicate("similarity carries plane and scale", nclose(moved.girth, 80 * Math.PI, 0.1));
  TestValidator.predicate("unestablished site remains unavailable", !Number.isFinite(M.read(round, undefined).girth));
  const empty: A.ISkin = { ...round, I: new Uint32Array(), tri: new Int32Array() };
  TestValidator.predicate("missing skin is not a passing tape", !Number.isFinite(M.read(empty, fixed).girth));
}

/**
 * Four identical quarter-course speed integrals on a 20 mm cylinder. Contact
 * heights -10,0,10,0 give h(t)=-10+20t^2-10t^3 on the first quarter, so the
 * independent speed is hypot(10 pi,40t-30t^2); the next quarter reverses it.
 */
function nonplanarLength(): number {
  const steps: number = 4096;
  let sum: number = 0;
  for (let k: number = 0; k <= steps; k++) {
    const t: number = k / steps;
    const speed: number = Math.hypot(10 * Math.PI, 40 * t - 30 * t * t);
    const weight: number = k === 0 || k === steps ? 1 : k % 2 === 0 ? 2 : 4;
    sum += weight * speed;
  }
  return 4 * sum / (3 * steps);
}

/** A model premise, deliberately independent of all target girths. */
function site(geometry: P.ISite["geometry"]): P.ISite {
  return { owner: "arm", basis: "model-convention", pose: "bind", definition: "Independently prescribed analytic fixture address.", geometry };
}

/** Circular 100 mm tube with independently supplied radius at each millimetre. */
function tube(radius: (s: number) => number): A.ISkin {
  const positions: number[] = [];
  const indices: number[] = [];
  const phases: number = 128;
  for (let s: number = 0; s <= 100; s++) {
    const r: number = radius(s);
    for (let j: number = 0; j < phases; j++) {
      const a: number = 2 * Math.PI * j / phases;
      positions.push(r * Math.cos(a), s, r * Math.sin(a));
      if (s === 100) continue;
      const v: number = s * phases + j;
      const next: number = s * phases + (j + 1) % phases;
      indices.push(v, next, v + phases, next, next + phases, v + phases);
    }
  }
  return { name: "independent measurement fixture", P: Float64Array.from(positions), I: Uint32Array.from(indices), tri: new Int32Array(indices.length / 3), chains: ["fixture"], joints: new Map() };
}
