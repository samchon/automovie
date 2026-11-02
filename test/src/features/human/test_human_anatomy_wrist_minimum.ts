import { TestValidator } from "@nestia/e2e";

import { HumanAnatomy as A } from "../internal/HumanAnatomy";
import { HumanGirthMinimum } from "../internal/HumanGirthMinimum";
import { nclose } from "../internal/nclose";

/**
 * The exact stylion section belongs to the wrist's minimum-girth search.
 *
 * Scenarios:
 * 1. A sound wrist at an off-grid station has zero girth above its minimum.
 * 2. Moving the tube's minimum away from stylion still exposes its larger tape.
 * 3. An empty sampled grid retains its exact tape section.
 *
 * @evidence contracts/testing.md#behavioral-verification Cuts two independently defined piecewise conical tubes at an exact tape plane and a one-millimetre grid, then applies the anatomy audit's minimum selector. The intact tube must not acquire a negative tape excess when the grid misses its narrowest section, while translating the narrowing must still report a larger tape. Empty samples retain the known tape.
 * @evidence contracts/testing.md#independent-expectations The intact tube has a 20 mm radius at stylion and increases one millimetre of radius per millimetre from it, so its tape is its minimum with circumference 40 pi. Moving that minimum to 103 mm while stylion stays at 100.25 mm adds 2.75 mm of radius, hence 5.5 pi mm of circumference. A 128-sided section is less than 0.015 mm below either analytic perimeter; the 0.02 mm bound covers only that tessellation deficit.
 * @evidence contracts/testing.md#distinguishing-cases Covers an exact minimum missed by the grid, a real displaced minimum whose tape excess exceeds the existing 4 mm small-girth tolerance, and an empty grid. Complete generated wrists and the permitted anatomical location of their minimum remain with test_human_anatomy_arm.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by --include human_anatomy_wrist_minimum. Local typed arrays define the fixtures; the maintained triangle cutter and shared minimum selector own the operations, with no host, process or GPU.
 */
export function test_human_anatomy_wrist_minimum(): void {
  for (const minimum of [100.25, 103]) {
    const skin: A.ISkin = tube(minimum);
    const read: (station: number) => number = (station: number): number => {
      const origin: A.V3 = [0, station, 0];
      const cut: A.ICut | null = A.cut(skin, origin, [0, 1, 0], origin);
      TestValidator.predicate("fixture has a section", cut !== null);
      return cut!.girth;
    };
    const tape: { station: number; girth: number } = { station: 100.25, girth: read(100.25) };
    const samples: { station: number; girth: number }[] = [];
    for (let station: number = 91; station < 110; station++) samples.push({ station, girth: read(station) });
    const least: { station: number; girth: number } = HumanGirthMinimum(tape, samples);
    TestValidator.predicate("known minimum circumference", nclose(least.girth, 40 * Math.PI, 0.02));
    TestValidator.predicate("known tape excess", nclose(tape.girth - least.girth, minimum === 100.25 ? 0 : 5.5 * Math.PI, 0.02));
    TestValidator.predicate("real defect remains over tolerance", (tape.girth - least.girth > 4) === (minimum !== 100.25));
    const empty: { station: number; girth: number } = HumanGirthMinimum(tape, []);
    TestValidator.predicate("empty grid keeps exact tape", nclose(empty.girth, tape.girth, 0));
  }
}

/** Circular sections of a double cone, whose radius is least at its apex ring. */
function tube(minimum: number): A.ISkin {
  const positions: number[] = [];
  const indices: number[] = [];
  const stations: number[] = [90, minimum, 110];
  const phases: number = 128;
  for (let k: number = 0; k < stations.length; k++) {
    const station: number = stations[k]!;
    const radius: number = 20 + Math.abs(station - minimum);
    for (let j: number = 0; j < phases; j++) {
      const angle: number = (2 * Math.PI * j) / phases;
      positions.push(radius * Math.cos(angle), station, radius * Math.sin(angle));
      if (k === stations.length - 1) continue;
      const a: number = k * phases + j;
      const b: number = k * phases + (j + 1) % phases;
      indices.push(a, b, a + phases, b, b + phases, a + phases);
    }
  }
  return { name: "analytic wrist", P: Float64Array.from(positions), I: Uint32Array.from(indices), tri: new Int32Array(indices.length / 3), chains: ["arm.left"], joints: new Map() };
}
