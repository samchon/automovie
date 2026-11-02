import { HumanAnatomy as A } from "../internal/HumanAnatomy";
import { HumanObservedGirthMinimum as M } from "../internal/HumanObservedGirthMinimum";

/**
 * A closed model section does not prove the observed final-surface minimum.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads final triangle sections over a complete declared domain. A misplaced waist and a designated neck course above a smaller base fail, while the independently specified true waist remains green.
 * @evidence contracts/testing.md#independent-expectations Three independently prescribed 128-sided circular rows with radii 20/15/20 mm have a 30*pi mm middle minimum within the explicitly bounded polygon deficit. No production landmark or target radius is read by the measurement helper.
 * @evidence contracts/testing.md#distinguishing-cases Covers the true and misplaced waist, a neck with smaller base, non-finite domain and an artificially tiny out-of-domain exact reference. All compared sections share one normal.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test selected by --include human_observed_girth_minimum, using only synthetic triangle skin and the independent section reader without person generation or a host.
 */
export function test_human_observed_girth_minimum(): void {
  const skin: A.ISkin = tube([20, 15, 20]);
  const wrong: M.IReading = section(skin, 75);
  const sound: M.IReading = section(skin, 50);
  const minimum: M.IReading = M.read(skin, [0, 0, 0], [0, 100, 0], [0, 1, 0], wrong);
  const correct: M.IReading = M.read(skin, [0, 0, 0], [0, 100, 0], [0, 1, 0], sound);
  check("a closed model section can still miss the true minimum", wrong.girth - minimum.girth > 9);
  check("correct minimum stays green", Math.abs(sound.girth - correct.girth) < 1e-8);
  check("independent waist-circle perimeter", Math.abs(minimum.girth - 30 * Math.PI) < 0.02);
  const neck: A.ISkin = tube([19, 20, 30]);
  const neckCourse: M.IReading = section(neck, 50);
  const neckLeast: M.IReading = M.read(neck, [0, 0, 0], [0, 100, 0], [0, 1, 0], neckCourse);
  check("a smaller base cannot be hidden by a designated neck course", neckCourse.girth - neckLeast.girth > 4);
  check("a missing domain cannot inherit a green reference", !Number.isFinite(M.read(neck, [NaN, 0, 0], [0, 100, 0], [0, 1, 0], neckCourse).girth));
  const outside: M.IReading = { girth: 1, origin: [0, -10, 0], points: [] };
  check("an out-of-domain reference cannot manufacture a minimum", M.read(skin, [0, 0, 0], [0, 100, 0], [0, 1, 0], outside).girth > 90);
  console.log(JSON.stringify({ status: "PASS", peopleGenerated: 0, misplacedWaistAboveMinimum: wrong.girth - minimum.girth, soundWaistAboveMinimum: sound.girth - correct.girth, neckCourseAboveMinimum: neckCourse.girth - neckLeast.girth }, null, 2));
}

/** Three independently prescribed circular rows; linear skin between rows. */
function tube(radii: readonly [number, number, number]): A.ISkin {
  const positions: number[] = [];
  const indices: number[] = [];
  const phases: number = 128;
  for (let row: number = 0; row < 3; row++) for (let phase: number = 0; phase < phases; phase++) {
    const angle: number = 2 * Math.PI * phase / phases;
    positions.push(radii[row]! * Math.cos(angle), 50 * row, radii[row]! * Math.sin(angle));
    if (row === 2) continue;
    const a: number = row * phases + phase;
    const b: number = row * phases + (phase + 1) % phases;
    indices.push(a, b, a + phases, b, b + phases, a + phases);
  }
  return { name: "independent minimum fixture", P: Float64Array.from(positions), I: Uint32Array.from(indices), tri: new Int32Array(indices.length / 3), chains: ["fixture"], joints: new Map() };
}

/** Read the actual section, with no target girth in the oracle. */
function section(skin: A.ISkin, height: number): M.IReading {
  const origin: A.V3 = [0, height, 0];
  const cut: A.ICut | null = A.cut(skin, origin, [0, 1, 0], origin);
  if (cut === null) throw new Error("Fixture section is missing");
  return { girth: cut.girth, origin, points: cut.points };
}

/** Assertion of independent shape-reader behavior. */
function check(label: string, value: boolean): void {
  if (!value) throw new Error(label);
}

