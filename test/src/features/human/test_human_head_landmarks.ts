import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanHeadLandmarks as L } from "../../../../packages/human/src/generation/AutoMovieHumanHeadLandmarks";
import { nclose } from "../internal/nclose";

/**
 * Model readings distinguish owned anatomical sites from profile surrogates.
 *
 * Scenarios:
 * 1. A piecewise analytic median has independently prescribed facial landmarks.
 * 2. Moving pronasale forward by 25 mm changes its Euclidean protrusion.
 * 3. Independent vault, zygomatic and mandibular rings retain their breadths.
 * 4. An independently enlarged neck circle exposes its known girth error.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures a prescribed median and analytic ellipse rings with the same reader used by head closure. The enlarged nasal defect must fail the intact shape's protrusion while the intact profile passes its independently known distances.
 * @evidence contracts/testing.md#independent-expectations Landmark positions are authored fixture observations. Distances follow the Euclidean norm between those positions; complete ellipse breadths are twice their explicit lateral semiaxes. The 0.4 mm allowance covers the reader's 0.25 mm arc sampling and chord-based landmark selection, independently of any person's shape prior.
 * @evidence contracts/testing.md#distinguishing-cases Separates vault, cheek and gonion search regions and tests an isolated nasal projection defect. Whole-person anatomy tests own smooth skin, all supported people, canthi and mouth topology.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU test reached by --include human_head_landmarks. It evaluates local polylines and ellipses without generating a person or starting a host or GPU.
 */
export function test_human_head_landmarks(): void {
  const findings: string[] = [];
  const check = (name: string, value: number, expected: number): void => {
    if (!nclose(value, expected, 0.4)) findings.push(`${name}: ${value} vs ${expected}`);
  };
  for (const lead of [70, 95]) {
    const median: L.IPoint[] = [[0, 100, 0], [50, 90, 0], [40, 70, 0], [lead, 40, 0], [45, 35, 0], [48, 25, 0], [44, 20, 0], [49, 15, 0], [46, 0, 0], [42, -3, 0], [0, 0, 0]];
    const rings: L.IPoint[][] = [[90, 20], [50, 20], [10, 16]].map(([y, z]: number[]): L.IPoint[] => Array.from({ length: 257 }, (_: unknown, i: number): L.IPoint => [50 * Math.cos(Math.PI * i / 256), y!, z! * Math.sin(Math.PI * i / 256)]));
    const m: L.IMeasures = L.measure(median, rings, { eye: 70, lid: 60, earTop: 60, earMiddle: 45, tragus: -20, stomion: 20 }, undefined, { nasion: [41, 73, 0] });
    check("height from skin menton", m.height, 103);
    check("length from g to op", m.length, Math.hypot(100, 40));
    check("vault breadth", m.breadth, 40);
    check("zygomatic breadth", m.faceWidth, 40);
    check("mandibular breadth", m.mandibularWidth, 32);
    check("nasal height uses the supplied anatomical site", m.noseHeight, Math.hypot(4, 38));
    check("sellion remains a distinct diagnostic", m.sellionY, 70);
    check("projection follows pronasale", m.noseProtrusion, Math.hypot(lead - 45, 5));
    if (nclose(m.noseProtrusion, Math.hypot(25, 5), 0.4) !== (lead === 70)) findings.push(`defect discrimination at lead ${lead}: ${m.noseProtrusion}`);
  }
  for (const radius of [10, 20]) {
    const median: L.IPoint[] = [[0, 100, 0], [50, 90, 0], [40, 70, 0], [70, 40, 0], [45, 35, 0], [48, 25, 0], [44, 20, 0], [49, 15, 0], [46, 0, 0], [42, -3, 0], [0, 0, 0]];
    const ring: L.IPoint[] = Array.from({ length: 257 }, (_: unknown, i: number): L.IPoint => [radius * Math.cos(Math.PI * i / 256), -20, radius * Math.sin(Math.PI * i / 256)]);
    const m: L.IMeasures = L.measure(median, [ring], { eye: 70, lid: 60, earTop: 60, earMiddle: 45, tragus: -20, stomion: 20 });
    check("neck circumference", m.neck, 2 * Math.PI * radius);
    check("neck address height", m.neckY, -20);
    if (nclose(m.neck, 20 * Math.PI, 0.4) !== (radius === 10)) findings.push(`neck defect discrimination: ${m.neck}`);
  }
  const profile: L.IPoint[] = [[0, 100, 0], [50, 90, 0], [40, 70, 0], [70, 40, 0], [45, 35, 0], [48, 25, 0], [44, 20, 0], [49, 15, 0], [46, 0, 0], [42, -3, 0], [0, 0, 0]];
  const circle = (radius: number, y: number): L.IPoint[] => Array.from({ length: 257 }, (_: unknown, i: number): L.IPoint => [radius * Math.cos(Math.PI * i / 256), y, radius * Math.sin(Math.PI * i / 256)]);
  const base: L.IPoint[] = circle(10, -30);
  const course: L.IPoint[] = circle(15, -20);
  const region: L.IRegions = { eye: 70, lid: 60, earTop: 60, earMiddle: 45, tragus: -20, stomion: 20 };
  const global: L.IMeasures = L.measure(profile, [base, course], region);
  const named: L.IMeasures = L.measure(profile, [base, course], region, course);
  check("global minimum cannot equal larger named course", global.neck, 20 * Math.PI);
  check("named course independent of smaller base", named.neck, 30 * Math.PI);
  check("named course keeps its address", named.neckY, -20);
  if (global.neck >= named.neck - 1) findings.push("smaller boundary fails to distinguish global minimum from named course");
  TestValidator.predicate(findings.join("\n"), findings.length === 0);
}
