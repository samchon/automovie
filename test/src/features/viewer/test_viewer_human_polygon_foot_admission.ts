import { AutoMovieHumanSkeleton as Skeleton } from "@automovie/human";
import { type AutoMovieHumanPolygon as Polygon, buildHumanPolygon } from "@automovie/viewer/human-polygon";
import { TestValidator } from "@nestia/e2e";

import { HumanPeople } from "../internal/HumanPeople";
import { throwsError } from "../internal/predicates";

/**
 * Broken source foot handoffs refuse instead of repairing geometry or labels.
 *
 * Scenarios:
 * 1. A side bound to the wrong existing bone and a nonfinite source point refuse.
 * 2. Missing courses, inconsistent ring populations and an altered shared seam refuse.
 * 3. Out-of-range anatomical addresses and false source height observations refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Copies one real public Human Skeleton foot descriptor and sends independently corrupted variants through the actual public polygon builder, requiring every malformed handoff to throw.
 * @evidence contracts/testing.md#independent-expectations Side identity, finite metre points, consistent closed ring populations, exact copied seam and bounded source addresses are explicit handoff requirements; a wrong source point cannot be relabeled or geometrically repaired. Each case changes a different required relation rather than duplicating source validation code.
 * @evidence contracts/testing.md#distinguishing-cases Covers wrong binding, NaN, insufficient courses, inconsistent point count, altered seam, invalid anatomical address and incorrect source support metadata. Successful real geometry, default omission, articulation and actual emitted support are tested independently.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit uses existing calibrated HumanPeople and public Skeleton/Viewer entries, creates no renderer/browser/process and disposes any unexpectedly admitted drawing before reporting all findings.
 */
export function test_viewer_human_polygon_foot_admission(): void {
  const person: HumanPeople.IPerson = HumanPeople.person("m1");
  const input: Polygon.IInput = Skeleton.prepare(person.params, { calibration: person.body, neckSurface: true, footSurface: true })({});
  const changes: [string, (value: NonNullable<Polygon.IInput["footSurface"]>) => void][] = [
    ["wrong source unit", (value: NonNullable<Polygon.IInput["footSurface"]>): void => { Reflect.set(value, "units", "millimetres"); }],
    ["wrong side bone", (value: NonNullable<Polygon.IInput["footSurface"]>): void => { value.left.hindfoot.bone = "rightSubtalar"; }],
    ["zero winding axis", (value: NonNullable<Polygon.IInput["footSurface"]>): void => { value.left.hindfoot.axis = [0, 0, 0]; }],
    ["nonfinite source point", (value: NonNullable<Polygon.IInput["footSurface"]>): void => { value.left.hindfoot.courses[0]!.points[0]![0] = NaN; }],
    ["missing course population", (value: NonNullable<Polygon.IInput["footSurface"]>): void => { value.left.hindfoot.courses.length = 1; }],
    ["inconsistent ring", (value: NonNullable<Polygon.IInput["footSurface"]>): void => { value.left.hindfoot.courses[1]!.points.pop(); }],
    ["changed shared seam", (value: NonNullable<Polygon.IInput["footSurface"]>): void => { value.left.forefoot.courses[0]!.points[0]![0] += 0.001; }],
    ["out of range landmark", (value: NonNullable<Polygon.IInput["footSurface"]>): void => { value.left.landmarks.plantarHeel.point = 100000; }],
    ["false source height", (value: NonNullable<Polygon.IInput["footSurface"]>): void => { value.left.support.landmarkHeights.medialBall += 0.001; }],
    ["false source minimum", (value: NonNullable<Polygon.IInput["footSurface"]>): void => { value.right.support.minimumHeight -= 0.001; }],
  ];
  const admitted: string[] = [];
  for (const [name, change] of changes) {
    const footSurface: NonNullable<Polygon.IInput["footSurface"]> = structuredClone(input.footSurface!);
    change(footSurface);
    if (!throwsError((): void => { buildHumanPolygon({ ...input, footSurface }).dispose(); })) admitted.push(name);
  }
  TestValidator.equals("malformed original foot sources refuse", admitted, []);
}
