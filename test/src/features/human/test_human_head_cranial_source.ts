import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanHeadCranialImplicitSection as I } from "../../../../packages/human/src/generation/AutoMovieHumanHeadCranialImplicitSection";
import { AutoMovieHumanHeadCranialSupport as C } from "../../../../packages/human/src/generation/AutoMovieHumanHeadCranialSupport";
import { AutoMovieHumanHeadCranialSupportDeformation as D } from "../../../../packages/human/src/generation/AutoMovieHumanHeadCranialSupportDeformation";
import { nclose } from "../internal/nclose";

/**
 * Actual cranial source roots, rejected skins and exact reuse retain their
 * numerical meaning independently of any generated person's anatomy.
 *
 * Scenarios:
 * 1. Convex and mixed-body source rays agree with primal-only bisection.
 * 2. A C2 flat point is regular; negative and reversed curvature stay red.
 * 3. Invalid roots retain their exact fallback and reason even with zero support.
 * 4. Exhaustion reports 64 actual requests; exact repeated rays execute none.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the production source root, polar support consumer and deformation adapter. A prescribed 1e-4 mm radius defect fails the independent source observer, a genuine flat source stays green, and actual negative curvature, reversed support and invalid roots remain rejected without replacing skin. Exhausted and cached work are observed through callback counts as well as returned diagnostics.
 * @evidence contracts/testing.md#independent-expectations A separate scalar primal evaluates the prescribed Lamé body union and a bracketed bisection observes its level set without production gradients, Newton, support code or radius output. The 1e-10 mm coordinate allowance is over 500 coordinate epsilons at the fixture scale and far below the independently made 1e-4 mm defect. Exact legacy compatibility uses a small authored reference for the specified twelve fixed-point plus forty bisection steps, not a source snapshot. That reference tests numerical preservation, not anatomy. Kappa=0 is regular because this polar parameter has no inverse curvature; negative signed curvature and a reversed transformed tangent are invalid by geometry. The callback budget is 64 requests, and identical query reuse requires zero new callbacks.
 * @evidence contracts/testing.md#distinguishing-cases Covers an offset origin, a C2 flat point, a genuine nonconvex mixed-body source, an excessive support coefficient, an outside source origin, zero width, exhausted work, identical cached results and a changed coefficient. Zero support preserves healthy root acceptance and failed root rejection; repeated failed neutral results retain their reasons with no work. The back-body test owns anterior/posterior/breadth independence; head closure and landmark tests own their solvers and readers. Whole-person anatomy and curve audits still own all supported people, final skin, clinical landmarks and tape identity. No clinical minimum frontal-width claim is made.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by --include human_head_cranial_source. Its local scalar fixtures and callbacks generate no people and start no process, native host, renderer or GPU. All findings are collected before one final assertion.
 */
export function test_human_head_cranial_source(): void {
  const findings: string[] = [];

  /** Retain the complete inspection round before raising any assertion. */
  const check: (name: string, accepted: boolean) => void = (name: string, accepted: boolean): void => {
    if (!accepted) findings.push(name);
  };

  const ellipse: I.Inputs = { station: 200, tilt: 0, t: 3.25, handed: 0.7, handover: 2.5, axis: 0, front: 120, back: -100, width: 80, waist: 100, face: 80, shield: 0, powerBack: 2, powerFace: 2, power: 5 };
  const flat: I.Inputs = { ...ellipse, back: -105, width: 82, powerBack: 2.2 };
  const mixed: I.Inputs = { ...ellipse, axis: -8, front: 95, back: -100, width: 78, waist: 20, face: 61, shield: 1, powerBack: 2.08, powerFace: 3.8 };

  // Oblique rays expose a source root too coarse for the outer ray criterion;
  // cardinal intercept independence already belongs to the back-body unit.
  for (const section of [flat, mixed]) {
    const origin: number = (section.front + section.back) / 2;
    for (const theta of [0, Math.PI / 8, Math.PI / 3, Math.PI / 2, 5 * Math.PI / 6]) {
      const observed: ReturnType<typeof C.sourceRadius> = C.sourceRadius(section, origin, theta);
      const expected: number = primalRadius(section, origin, theta);
      check(`source root at ${theta}`, observed.healthy && nclose(observed.radius, expected, 1e-10));
      check(`known radius defect at ${theta}`, !nclose(observed.radius + 1e-4, expected, 1e-10));
      check(`source root work at ${theta}`, observed.iterations > 0 && observed.iterations <= 64 && observed.evaluations >= observed.iterations && !observed.fallbackUsed);
    }
  }

  // A flat normal is regular in the actual polar parameter, without 1/kappa.
  const flatOrigin: number = (flat.front + flat.back) / 2;
  const flatRadius: ReturnType<typeof C.sourceRadius> = C.sourceRadius(flat, flatOrigin, 0);
  const flatPoint: [number, number] = [flatOrigin + flatRadius.radius, 0];
  const flatOperator: I.Operator = I.operator(flat);
  const flatJet: I.PolarJet = I.differential(flatPoint, flatOperator.evaluate(...flatPoint), flatOrigin, 0);
  const flatQuery: C.IPrepared = C.prepare(flat, flatOrigin, (theta: number): ReturnType<typeof C.sourceRadius> => C.sourceRadius(flat, flatOrigin, theta));
  const flatChanged: C.IRadius = flatQuery(0, 2);
  check("flat source is genuinely C2 with zero curvature", flatOperator.spatialC2 && nclose(flatJet.curvature, 0, 0));
  check("flat source remains a regular unchanged cardinal point", flatChanged.healthy && nclose(flatChanged.radius, flatRadius.radius, 0) && flatChanged.angularResidual === 0);

  // Select an actual negative-curvature source point rather than inventing a
  // convex hull or a negative curvature unconnected to the physical primitive.
  const mixedOrigin: number = (mixed.front + mixed.back) / 2;
  const mixedOperator: I.Operator = I.operator(mixed);
  let negativeTheta: number = NaN;
  for (let i: number = 1; i < 32; i++) {
    const theta: number = Math.PI * i / 32;
    const radius: number = primalRadius(mixed, mixedOrigin, theta);
    const point: [number, number] = [mixedOrigin + radius * Math.cos(theta), radius * Math.sin(theta)];
    if (I.differential(point, mixedOperator.evaluate(...point), mixedOrigin, theta).curvature < 0) {
      negativeTheta = theta;
      break;
    }
  }
  check("mixed primitive contains a real concave source point", Number.isFinite(negativeTheta));
  if (Number.isFinite(negativeTheta)) {
    const query: C.IPrepared = C.prepare(mixed, mixedOrigin, (theta: number): ReturnType<typeof C.sourceRadius> => C.sourceRadius(mixed, mixedOrigin, theta));
    const rejected: C.IRadius = query(negativeTheta, 2);
    check("negative source curvature rejects without moving skin", !rejected.healthy && nclose(rejected.radius, C.sourceRadius(mixed, mixedOrigin, negativeTheta).radius, 0));
  }

  const ellipseQuery: C.IPrepared = C.prepare(ellipse, 10, (theta: number): ReturnType<typeof C.sourceRadius> => C.sourceRadius(ellipse, 10, theta));
  const reversed: C.IRadius = ellipseQuery(Math.PI / 4, 100);
  check("reversed support rejects without clamping or changing skin", !reversed.healthy && nclose(reversed.radius, C.sourceRadius(ellipse, 10, Math.PI / 4).radius, 0) && reversed.iterations > 0);

  // The compatibility reference is intentionally limited to source rejection:
  // a rejected Newton iterate must not become an invented physical radius.
  for (const sample of [
    { section: ellipse, origin: 1000, theta: 0.4 },
    { section: { ...ellipse, width: 0 }, origin: 10, theta: 0.7 },
  ]) {
    const expected: number = legacyRadius(sample.section, sample.origin, sample.theta);
    const actual: ReturnType<typeof C.sourceRadius> = C.sourceRadius(sample.section, sample.origin, sample.theta);
    const query: C.IPrepared = C.prepare(sample.section, sample.origin, (theta: number): ReturnType<typeof C.sourceRadius> => C.sourceRadius(sample.section, sample.origin, theta));
    const rejected: C.IRadius = query(sample.theta, 2);
    check(`invalid source preserves its exact legacy radius at origin ${sample.origin}`, !actual.healthy && actual.fallbackUsed && nclose(actual.radius, expected, 0) && actual.fallbackEvaluations > 0 && actual.fallbackEvaluations <= 52);
    check(`invalid source cannot accept a support result at origin ${sample.origin}`, !rejected.healthy && nclose(rejected.radius, expected, 0) && rejected.iterations > 0);
    const neutral: C.IRadius = query(sample.theta, 0);
    const repeatedNeutral: C.IRadius = query(sample.theta, 0);
    check(`zero support preserves source failure at origin ${sample.origin}`, !neutral.healthy && !neutral.sourceChecked && nclose(neutral.radius, expected, 0) && neutral.reason === actual.reason && neutral.reason !== undefined && neutral.sourceResidual === actual.fieldResidual && neutral.iterations === 0);
    check(`cached zero support preserves source failure at origin ${sample.origin}`, !repeatedNeutral.healthy && repeatedNeutral.resultCacheHit && repeatedNeutral.reason === actual.reason && nclose(repeatedNeutral.radius, expected, 0) && repeatedNeutral.iterations === 0 && repeatedNeutral.sourceQueries === 0 && repeatedNeutral.sourceRadiusCalls === 0);
  }

  const neutralRoot: ReturnType<typeof C.sourceRadius> = C.sourceRadius(ellipse, 10, 0.7);
  const healthyNeutral: C.IRadius = ellipseQuery(0.7, 0);
  check("zero support retains a healthy source without claiming a differential", neutralRoot.healthy && healthyNeutral.healthy && !healthyNeutral.sourceChecked && nclose(healthyNeutral.radius, neutralRoot.radius, 0) && healthyNeutral.reason === undefined && healthyNeutral.iterations === 0 && healthyNeutral.sourceResidual === neutralRoot.fieldResidual);

  // A constant polar callback deliberately cannot reach the target ray. Its
  // externally counted requests expose hidden iterations and an unused sample.
  const ellipseOperator: I.Operator = I.operator(ellipse);
  const point: [number, number] = [10 + C.sourceRadius(ellipse, 10, 0).radius, 0];
  const constant: I.PolarJet = I.differential(point, ellipseOperator.evaluate(...point), 10, 0);
  let requests: number = 0;
  const exhausted: D.RayResult = D.radial((): I.PolarJet => { requests++; return constant; }, 10, 0.7, 2, true);
  check("exhaustion exposes exactly 64 real requests", !exhausted.ok && exhausted.iterations === 64 && exhausted.sourceQueries === 64 && requests === 64);

  let calls: number = 0;
  const cached: C.IPrepared = C.prepare(ellipse, 10, (theta: number): ReturnType<typeof C.sourceRadius> => {
    calls++;
    return C.sourceRadius(ellipse, 10, theta);
  });
  const first: C.IRadius = cached(0.7, 2);
  const before: number = calls;
  const repeated: C.IRadius = cached(0.7, 2);
  check("first changed source uses visible real work", first.healthy && first.iterations > 0 && first.sourceRadiusCalls === before && before > 0 && first.angularResidual < 1e-12);
  check("exact repeated query performs no work and retains its result", repeated.healthy && repeated.resultCacheHit && repeated.iterations === 0 && repeated.sourceQueries === 0 && repeated.sourceRadiusCalls === 0 && repeated.solveIterations === first.solveIterations && calls === before && nclose(repeated.radius, first.radius, 0));
  const changed: C.IRadius = cached(0.7, -2);
  check("changed coefficient invalidates the exact result", changed.healthy && !changed.resultCacheHit && !nclose(changed.radius, first.radius, 0.01));

  TestValidator.predicate(findings.join("\n"), findings.length === 0);
}

/**
 * Scalar Lamé primal, independent of the production differential and root.
 * The optional literal zero product preserves the historical fallback's NaN
 * arithmetic; the source observer instead omits the absent shield exactly.
 */
function primal(section: I.Inputs, x: number, z: number, literalZeroProduct: boolean = false): number {
  const raw: number = Math.min(1, Math.max(0, (section.handover - section.t) / (section.handover - section.handed)));
  const neck: number = raw * raw * (3 - 2 * raw);
  const anterior: number = neck * (section.axis - section.back) + (1 - neck) * (section.waist - section.axis);
  const g: number = (Math.abs((x - section.axis) / Math.max(1, x < section.axis ? section.axis - section.back : anterior)) ** section.powerBack + Math.abs(z / section.width) ** section.powerBack) ** (1 / section.powerBack);
  if (section.shield === 0 && !literalZeroProduct) return g;
  const f: number = (Math.abs((x - section.waist) / Math.max(1, section.front - section.waist)) ** section.powerFace + Math.abs(z / section.face) ** section.powerFace) ** (1 / section.powerFace);
  return (g ** -section.power + section.shield * f ** -section.power) ** (-1 / section.power);
}

/** Observe an actual scalar level-set crossing by bisection, without Newton. */
function primalRadius(section: I.Inputs, origin: number, theta: number): number {
  let lo: number = 0;
  let hi: number = 3 * Math.max(10, section.front - section.back);
  for (let i: number = 0; i < 80; i++) {
    const middle: number = (lo + hi) / 2;
    if (middle === lo || middle === hi) break;
    if (primal(section, origin + middle * Math.cos(theta), middle * Math.sin(theta)) < 1) lo = middle;
    else hi = middle;
  }
  return (lo + hi) / 2;
}

/**
 * Independent reference for the explicitly preserved historical numerical
 * fallback: twelve radial rescalings, then forty bounded bisection steps.
 * This compatibility oracle is deliberately not an anatomical expectation.
 */
function legacyRadius(section: I.Inputs, origin: number, theta: number): number {
  let radius: number = (section.front - section.back) / 2 || 1;
  for (let i: number = 0; i < 12; i++) {
    const next: number = radius / primal(section, origin + radius * Math.cos(theta), radius * Math.sin(theta), true);
    if (Math.abs(next - radius) < 1e-6) return next;
    radius = next;
  }
  let lo: number = 0;
  let hi: number = 3 * Math.max(10, section.front - section.back);
  for (let i: number = 0; i < 40; i++) {
    const middle: number = (lo + hi) / 2;
    if (primal(section, origin + middle * Math.cos(theta), middle * Math.sin(theta), true) < 1) lo = middle;
    else hi = middle;
  }
  return lo;
}
