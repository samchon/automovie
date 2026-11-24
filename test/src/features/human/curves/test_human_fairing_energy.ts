import type { AutoMovieVector3Tuple } from "@automovie/interface";

import { FamilyConicFairing } from "../../../reference-conics/FamilyConicFairing";

/**
 * The minimum-variation energy the junction fairing minimizes.
 *
 * The made junction is a tube along x from a circle of radius 10 mm to one of 6 mm over 40 mm, sampled in 64 phases and 41 stations.
 *
 * Scenarios:
 * 1. A straight blend of the radius: every ring is a circle and every phase line a straight segment, so the energy is zero.
 * 2. A bump `b sin^2(pi s / 40)` on the blend raises the energy, a half bump less than a whole one, so fairing it toward the straight
 *    blend lowers it.
 * 3. The bumped tube doubled in size has the same energy (the energy is scale-free).
 * 4. A ring's signed curvature in its plane: a convex ellipse `(2 cos t, sin t, 0)` has the same energy signed (normal `+z`) and
 *    unsigned, since every turn has one sign; a peanut `r = 1 + 0.8 cos 2t`, concave about `t = pi / 2` (`r^2 + 2 r'^2 - r r''` is
 *    `-0.6` there), has more signed than unsigned, since each inflection's step of curvature through zero counts in full.
 * 5. A ring weighted by its share of the window has its energy multiplied by that share.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `FamilyConicFairing.energy` on rings and phase lines as the junction fairing samples them.
 * @evidence contracts/development/testing.md#independent-expectations Circles and straight lines have constant curvature, so their variation is zero; the cube of the length cancels the scale.
 * @evidence contracts/development/testing.md#distinguishing-cases A curvature without the half-edge measure, or without the length's cube, fails scenario 1 or 3.
 * @evidence contracts/development/testing.md#execution-ownership Made tubes only.
 * @evidence contracts/development/common.md#meaningful-documentation Names the made tube, its bump and its doubling.
 */
export function test_human_fairing_energy(): void {
  const failures: string[] = [];
  const tube = (bump: number, size: number): { points: AutoMovieVector3Tuple[]; closed: boolean }[] => {
    const radius = (s: number): number => size * (10 + (6 - 10) * (s / 40) + bump * Math.sin((Math.PI * s) / 40) ** 2);
    const stations: number[] = Array.from({ length: 41 }, (_, i: number): number => i);
    const phases: number[] = Array.from({ length: 64 }, (_, j: number): number => (2 * Math.PI * j) / 64);
    const at = (s: number, phi: number): AutoMovieVector3Tuple => [size * s, radius(s) * Math.cos(phi), radius(s) * Math.sin(phi)];
    return [
      ...stations.map((s: number) => ({ points: phases.map((phi: number): AutoMovieVector3Tuple => at(s, phi)), closed: true })),
      ...phases.map((phi: number) => ({ points: stations.map((s: number): AutoMovieVector3Tuple => at(s, phi)), closed: false })),
    ];
  };
  const straight: number = FamilyConicFairing.energy(tube(0, 1));
  const whole: number = FamilyConicFairing.energy(tube(2, 1));
  const half: number = FamilyConicFairing.energy(tube(1, 1));
  const doubled: number = FamilyConicFairing.energy(tube(2, 2));
  if (!(straight <= 1e-12 * whole)) failures.push("the straight blend's energy " + straight + " is not zero against " + whole);
  if (!(whole > half && half > straight)) failures.push("the bump's energy does not fall toward the straight blend: " + [whole, half, straight].join(", "));
  if (!(Math.abs(doubled - whole) <= 1e-9 * whole)) failures.push("the doubled tube's energy " + doubled + " differs from " + whole);

  const ring = (r: (t: number) => [number, number]): AutoMovieVector3Tuple[] =>
    Array.from({ length: 128 }, (_, k: number): AutoMovieVector3Tuple => [...r((2 * Math.PI * k) / 128), 0]);
  const ellipse = ring((t: number): [number, number] => [2 * Math.cos(t), Math.sin(t)]);
  const peanut = ring((t: number): [number, number] => [(1 + 0.8 * Math.cos(2 * t)) * Math.cos(t), (1 + 0.8 * Math.cos(2 * t)) * Math.sin(t)]);
  const up: AutoMovieVector3Tuple = [0, 0, 1];
  const convexSigned: number = FamilyConicFairing.energy([{ points: ellipse, closed: true, plane: up }]);
  const convexBare: number = FamilyConicFairing.energy([{ points: ellipse, closed: true }]);
  if (!(Math.abs(convexSigned - convexBare) <= 1e-9 * convexBare)) failures.push("the convex ring's signed energy " + convexSigned + " differs from its unsigned " + convexBare);
  const inflectedSigned: number = FamilyConicFairing.energy([{ points: peanut, closed: true, plane: up }]);
  const inflectedBare: number = FamilyConicFairing.energy([{ points: peanut, closed: true }]);
  if (!(inflectedSigned > inflectedBare * (1 + 1e-6))) failures.push("the inflected ring's signed energy " + inflectedSigned + " is not above its unsigned " + inflectedBare);
  const weighted: number = FamilyConicFairing.energy([{ points: peanut, closed: true, plane: up, weight: 0.25 }]);
  if (!(Math.abs(weighted - 0.25 * inflectedSigned) <= 1e-9 * inflectedSigned)) failures.push("the weighted ring's energy " + weighted + " is not a quarter of " + inflectedSigned);
  if (failures.length > 0) throw new Error("fairing energy:\n" + failures.join("\n"));
}
