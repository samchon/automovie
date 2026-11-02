import { TestValidator } from "@nestia/e2e";

import type { AutoMovieHumanMeasurementProtocol as P } from "../../../../packages/human/src/generation/AutoMovieHumanMeasurementProtocol";
import { HumanAnatomy as A } from "../internal/HumanAnatomy";
import { HumanPlanePath } from "../internal/HumanPlanePath";

/**
 * One physical plane family measures wrist minimum and thumb-side health.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads a sound skew circular tube under its complete owned plane family, including its exact crease. The former mixed-horizontal minimum makes that sound crease falsely swollen and is red. A real two-millimetre support bump is also red under the consistent family.
 * @evidence contracts/testing.md#independent-expectations A prescribed 20 mm circular crease has perimeter 40*pi mm; its 128-sided inscribed polygon deficit is below 0.02 mm. Linear radius growth away from the crease has no positive chord bulge. The independently inserted two-millimetre Gaussian bump exceeds the unchanged one-millimetre surface criterion. No production target or fitted radius is read by the helper.
 * @evidence contracts/testing.md#distinguishing-cases Covers normal and 60-degree skew frames, both reflections, reversed plane-normal sign, exact crease inclusion, a real bump, a zero-length interval, absent skin and a domain too short to observe the chord. Missing evidence remains non-finite.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test selected by --include human_wrist_plane_family. It constructs only literal triangle fixtures and invokes independent final-skin cuts, without generating people or starting a host.
 */
export function test_human_wrist_plane_family(): void {
  for (const angle of [0, Math.PI / 3]) for (const reflection of [1, -1]) {
    const origin: A.V3 = [37, 200, -17];
    const normal: A.V3 = [reflection * Math.sin(angle), Math.cos(angle), 0];
    const path: P.IPlanePath = { kind: "plane-path", crease: 1, stations: [-10, 0, 10].map((station: number, k: number): P.IPlaneStation => ({ origin: [origin[0], origin[1] + station, origin[2]], normal: k === 2 ? A.scale(normal, -1) : normal, thumbSide: [0, 0, 1] })) };
    const skin: A.ISkin = tube(origin, angle, reflection, false);
    const result: HumanPlanePath.IResult = HumanPlanePath.read(skin, path);
    TestValidator.predicate("exact crease is actually observed", result.crease !== undefined && result.least !== undefined && result.samples.some((sample: HumanPlanePath.IReading): boolean => sample.station === 0));
    TestValidator.predicate("independent circular crease perimeter", Math.abs(result.crease!.girth - 40 * Math.PI) < .02);
    TestValidator.predicate("one plane family leaves the sound crease green", Math.abs(result.crease!.girth - result.least!.girth) < 1e-8);
    TestValidator.predicate("linear-radius profile has no positive thumb-side bulge", HumanPlanePath.bulge(result.samples) < 1e-8);
    let mixed: number = result.crease!.girth;
    for (let station: number = -10; station <= 10; station++) {
      const point: A.V3 = [origin[0], origin[1] + station, origin[2]];
      const cut: A.ICut | null = A.cut(skin, point, [0, 1, 0], point);
      if (cut !== null) mixed = Math.min(mixed, cut.girth);
    }
    TestValidator.predicate("mixed obliquity creates a distinguishable false excess", angle === 0 ? Math.abs(result.crease!.girth - mixed) < 1e-8 : result.crease!.girth - mixed > 4);
    const defect: HumanPlanePath.IResult = HumanPlanePath.read(tube(origin, angle, reflection, true), path);
    TestValidator.predicate("a real final-skin bump remains red in the same family", HumanPlanePath.bulge(defect.samples) > 1);
    const degenerate: P.IPlanePath = { ...path, stations: [path.stations[1]!, path.stations[1]!], crease: 0 };
    TestValidator.predicate("zero-length family stays unavailable", HumanPlanePath.read(skin, degenerate).least === undefined);
    TestValidator.predicate("absent final skin stays unavailable", HumanPlanePath.read({ ...skin, P: new Float64Array(), I: new Uint32Array(), tri: new Int32Array() }, path).least === undefined);
    TestValidator.predicate("missing chord evidence cannot report green zero", !Number.isFinite(HumanPlanePath.bulge(result.samples.slice(0, 3))));
  }
}

/** Literal circular sections, independent of the Human construction or targets. */
function tube(origin: A.V3, angle: number, reflection: number, bump: boolean): A.ISkin {
  const positions: number[] = [], indices: number[] = [];
  const phases: number = 128, rows: number = 121;
  for (let row: number = 0; row < rows; row++) {
    const station: number = row - 60;
    const radius: number = 20 + .2 * Math.abs(station) + (bump ? 2 * Math.exp(-((station - 5) ** 2) / 2) : 0);
    for (let phase: number = 0; phase < phases; phase++) {
      const t: number = 2 * Math.PI * phase / phases;
      const across: number = radius * Math.cos(t);
      positions.push(origin[0] + reflection * across * Math.cos(angle), origin[1] + station - across * Math.sin(angle), origin[2] + radius * Math.sin(t));
      if (row + 1 === rows) continue;
      const a: number = row * phases + phase, b: number = row * phases + (phase + 1) % phases;
      indices.push(a, b, a + phases, b, b + phases, a + phases);
    }
  }
  return { name: "independent owned wrist family", P: Float64Array.from(positions), I: Uint32Array.from(indices), tri: new Int32Array(indices.length / 3), chains: ["arm.left"], joints: new Map() };
}
