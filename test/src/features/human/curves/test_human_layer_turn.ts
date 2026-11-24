import { AutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection, AutoMovieHumanLayerTurn } from "@automovie/human";
import type { IAutoMovieHumanConicLoft, IAutoMovieViewLoft } from "@automovie/interface";

/**
 * Layers bounded by their turn along the course, on a made bent tube.
 *
 * The made tube is round, 10 mm in radius, on a course along `+X` from the origin to (100, 0, 0) and on to (100, 100, 0), turned a
 * quarter at the corner over a half length of 30 mm; its rings stand 8 mm apart from station 0 to 176 and at 180.
 *
 * Scenarios:
 * 1. Before refining, some interval round the turn turns by more than 4 degrees between its half chords (the case distinguishes).
 * 2. After refining, no interval turns by more than 4 degrees at any of 192 phases.
 * 3. The straight run before the turn keeps its 8 mm intervals: every given station stays, and none is inserted before station 40.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanLayerTurn.refine` on the made tube's loft and reads the turn on the same loft.
 * @evidence contracts/development/testing.md#independent-expectations A straight tube's chords are collinear, so its run needs no layer; round the turn the chords turn with the course.
 * @evidence contracts/development/testing.md#distinguishing-cases A rule bounding length alone keeps the 8 mm rings and fails scenario 2; a rule that refines everywhere fails scenario 3.
 * @evidence contracts/development/testing.md#execution-ownership One made family.
 * @evidence contracts/development/common.md#meaningful-documentation Names the made tube, its stations and the bound.
 */
export function test_human_layer_turn(): void {
  const failures: string[] = [];
  const ring: number[] = [10, 0, Math.SQRT2 - 1, 0, 10, Math.SQRT2 - 1, -10, 0, Math.SQRT2 - 1, 0, -10, Math.SQRT2 - 1];
  const rho: number = 1 / (1 + 1 / Math.cos(Math.PI / 8));
  const field: number[] = [...ring, ...Array.from({ length: 8 }, (): number => rho)];
  const tube: IAutoMovieHumanConicLoft.IFamily = {
    name: "bent", centres: [[0, 0, 0], [100, 0, 0], [100, 100, 0]], halves: [30], up: [0, 0, 1],
    layout: AutoMovieHumanConicSection.limb(1), knots: [0, 90, 180], values: field.map((x: number): number[] => [x, x, x]),
  };
  const given: number[] = [...Array.from({ length: 23 }, (_, i: number): number => 8 * i), 180];
  const loft: IAutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(tube, given);
  if (loft.chain === null) throw new Error("layer turn: the made tube does not loft");
  const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
  const worst = (stations: readonly number[]): number => {
    let most: number = 0;
    for (let i: number = 1; i < stations.length; ++i) {
      const [a, b] = [stations[i - 1]!, stations[i]!];
      for (let j: number = 0; j < 192; ++j) {
        const phi: number = (2 * Math.PI * j) / 192;
        const [p, q, r] = [a, (a + b) / 2, b].map((s: number): number[] => AutoMovieLoftChain.point(chain, s, phi));
        const u: number[] = [0, 1, 2].map((k: number): number => q![k]! - p![k]!), w: number[] = [0, 1, 2].map((k: number): number => r![k]! - q![k]!);
        const cosine: number = (u[0]! * w[0]! + u[1]! * w[1]! + u[2]! * w[2]!) / (Math.hypot(u[0]!, u[1]!, u[2]!) * Math.hypot(w[0]!, w[1]!, w[2]!));
        most = Math.max(most, (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI);
      }
    }
    return most;
  };
  const before: number = worst(given);
  if (!(before > 4)) failures.push("the 8 mm rings turn by at most " + before + " degrees, so the case does not distinguish");
  const refined: number[] = AutoMovieHumanLayerTurn.refine(chain, given, { turn: 4, phases: 192, least: 0.5 });
  const after: number = worst(refined);
  if (!(after <= 4)) failures.push("after refining an interval still turns by " + after + " degrees");
  if (!given.every((s: number): boolean => refined.includes(s))) failures.push("a given station was dropped");
  if (refined.some((s: number): boolean => s < 40 && !given.includes(s))) failures.push("a layer was inserted on the straight run: " + refined.filter((s) => s < 40).join(", "));
  if (failures.length > 0) throw new Error("layer turn:\n" + failures.join("\n"));
}
