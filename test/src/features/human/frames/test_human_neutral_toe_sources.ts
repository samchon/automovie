import {
  AutoMovieLoftViewFullSource,
  AutoMovieSolidVector as V,
} from "@automovie/engine";
import { AutoMovieHumanBodyLaw } from "@automovie/human";
import { AutoMovieHumanNeutralParameters } from "@automovie/human/capture";

import { FamilyConicNeutralCases as Cases } from "../../../reference-conics/FamilyConicNeutralCases";

/**
 * The genuine foot source uses the actual phalange cases and separates the five
 * original toe walls in their fixed physical observation planes.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads exactly the local foot and child sources consumed by BodyLane, including the actual retained skin dimensions, without a final skin.
 * @evidence contracts/development/testing.md#independent-expectations The requested case ratio sets each physical root-to-apex distance. The two conic side guides are exact transverse support points in the same fixed foot plane.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides, original and two opposite length overrides, each adjacent pair, floor and axis assertions.
 * @evidence contracts/development/testing.md#execution-ownership The scenario makes only scoped neutral foot source requests.
 */
export function test_human_neutral_toe_sources(): void {
  type Point = [number, number, number];
  const resolve = Cases.prepare(AutoMovieHumanNeutralParameters);
  const scope = (row: Cases.ICase) =>
    AutoMovieHumanBodyLaw.prepareSources(resolve(row)).limbSources();
  const cases = Cases.CASES.filter(
    (row) => row.field === "baseline" || row.field === "phalanges",
  );
  const baseline = scope(cases[0]!);
  const issues: string[] = [];
  // At this fixture's stature binary64 arithmetic loses a few ulps. A
  // micrometre is above that error and below the physical join allowance.
  const tolerance = 1e-6;
  for (const side of ["left", "right"] as const) {
    const original = baseline.leg(side).prepareFoot();
    const foot = original.foot();
    const originalToes = original.toes();
    const horizontal = (point: Point): number =>
      V.dot(V.sub(point, foot.heel), foot.along);
    const outward: Point = V.scale(
      [foot.along[2], 0, -foot.along[0]],
      side === "left" ? -1 : 1,
    );
    if (
      Math.abs(
        Math.max(...originalToes.map(({ toe }) => horizontal(toe.apex))) -
          foot.length,
      ) > tolerance
    )
      issues.push(`${side}: the ordinary foot lost its heel-to-longest tape`);

    for (const row of cases) {
      const toes =
        row.field === "baseline"
          ? originalToes
          : scope(row).leg(side).prepareFoot().toes();
      const readers = toes.map(({ toe, definition }, k) => {
        const start = toe.centres[1]!;
        const before = originalToes[k]!.toe;
        const distance = V.norm(V.sub(toe.apex, start));
        if (V.norm(V.sub(start, before.centres[1]!)) > tolerance)
          issues.push(`${row.id}/${toe.name}: the generated joint root moved`);
        const expected =
          row.ratio * V.norm(V.sub(before.apex, before.centres[1]!));
        if (Math.abs(distance - expected) > tolerance)
          issues.push(
            `${row.id}/${toe.name}: actual skin length ${distance} mm, expected ${expected} mm`,
          );
        const part = definition.part;
        if (part === null)
          throw new Error(JSON.stringify(definition.diagnostics));
        const reader = AutoMovieLoftViewFullSource.create(part);
        const offset = horizontal(toe.centres[0]!);
        for (const station of part.stations)
          if (reader.pointAt(station)(Math.PI)[1] < -tolerance)
            issues.push(
              `${row.id}/${toe.name}: plantar source below the floor at ${station} mm`,
            );
        return { reader, offset, stations: part.stations, name: part.name };
      });
      for (let k = 0; k + 1 < readers.length; ++k) {
        const a = readers[k]!,
          b = readers[k + 1]!;
        const start = Math.max(a.offset, b.offset);
        const end = Math.min(
          a.offset + a.reader.domain[1],
          b.offset + b.reader.domain[1],
        );
        const stations = [
          ...a.stations.map((s) => a.offset + s),
          ...b.stations.map((s) => b.offset + s),
        ].filter((s) => s > start && s < end);
        const outer = side === "left" ? (3 * Math.PI) / 2 : Math.PI / 2;
        const inner = side === "left" ? Math.PI / 2 : (3 * Math.PI) / 2;
        const clearance = Math.min(
          ...stations.map((s) =>
            V.dot(
              outward,
              V.sub(
                b.reader.pointAt(s - b.offset)(inner),
                a.reader.pointAt(s - a.offset)(outer),
              ),
            ),
          ),
        );
        if (!(clearance >= -tolerance))
          issues.push(
            `${row.id}/${a.name}/${b.name}: original transverse overlap ${-clearance} mm`,
          );
      }
    }
  }
  if (issues.length !== 0) throw new Error(issues.join("\n"));
}
