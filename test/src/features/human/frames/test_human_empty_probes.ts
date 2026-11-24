import {
  AutoMovieHumanF1,
  AutoMovieHumanF1EmptyProbes,
  AutoMovieHumanEmptyProbes as P,
  AutoMovieHumanConicSection as S,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
} from "@automovie/interface";

import { vclose } from "../../internal/predicates";

/**
 * The empty-probe law places a probe midway between two families' facing walls
 * only where they stand at least twice the larger ring phase spacing apart,
 * places a cutter's probe on its course's middle station, and lists f1's every
 * probe from its stored families.
 *
 * The made families are straight courses along +Y with `up` +X, so the chart's
 * `u` is +X and `v = u x t` is +Z, and each section is the circle of radius `R
 * = 48 / pi` mm drawn by four quarter conics of shoulder `sqrt(2) - 1`, an
 * exact circle. Its girth is 96 mm, so the loft's uniform phase count is
 * `max(48, 8 ceil(96 / 4 / 8)) = 48` and the phase spacing is 2 mm: the
 * required wall gap is 4 mm.
 *
 * Scenarios:
 *
 * 1. Two such families with courses `2R + 10` mm apart along +Z: their walls stand
 *    10 mm apart, above 4 mm, and the probe is the midpoint between the walls,
 *    `[0, 20, R + 5]` at the middle station 20 mm, within 1e-9 mm.
 * 2. The same families `2R + 3` mm apart: the walls stand 3 mm apart, below 4 mm,
 *    and the probe is listed with its reason and no point.
 * 3. A made cutter with a straight 40 mm course from `[1, 0, 2]`: its probe stands
 *    at the course's 20 mm station, `[1, 20, 2]`, within 1e-9 mm.
 * 4. F1's own listing names every stored cutter once per side it is mirrored to,
 *    the probe between the legs, and the six probes between adjacent fingers on
 *    both hands, each with exactly one of a point and a reason, and no lip
 *    probe. It reads f1's stored families and realizes no skin.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanEmptyProbes.between`, `middle` and `list` on made and stored families. It catches a probe placed between walls too close for the skin's chords, a probe off the walls' midpoint, a cutter probe off its course's middle, and a listing that misses or repeats a probe or invents a lip gap; it allows any wall gap at or above the required one.
 * @evidence contracts/development/testing.md#independent-expectations The wall points, gaps and phase count follow in closed form from the made circles and courses stated above; the f1 names follow from the stored cutters' mirroring and the four fingers' order.
 * @evidence contracts/development/testing.md#distinguishing-cases A gap above and one below the requirement on the same families, a cutter, and the whole f1 listing. The capture's skin and hull checks belong to the Human capture's inspection, which this unit test does not run.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit on made and stored families; no person, skin or realization.
 * @evidence contracts/development/common.md#meaningful-documentation Numbered scenarios state each made input and its expectation.
 */
export function test_human_empty_probes(): void {
  const failures: string[] = [];
  const R: number = 48 / Math.PI;
  const rho: number = Math.SQRT2 - 1;
  const layout: IAutoMovieHumanConicSection.ILayout = S.limb(0);
  const knots: number[] = [0, 20, 40];
  const values: number[][] = [R, 0, 0, R, -R, 0, 0, -R, rho, rho, rho, rho].map(
    (x: number): number[] => knots.map((): number => x),
  );
  const made: (
    name: string,
    z: number,
    x?: number,
  ) => IAutoMovieHumanConicLoft.IFamily = (
    name: string,
    z: number,
    x: number = 0,
  ): IAutoMovieHumanConicLoft.IFamily => ({
    name,
    centres: [
      [x, 0, z],
      [x, 40, z],
    ],
    halves: [],
    up: [1, 0, 0],
    layout,
    knots,
    values,
  });
  const at: (
    what: string,
    probe: P.IProbe,
    want: AutoMovieVector3Tuple,
  ) => void = (
    what: string,
    probe: P.IProbe,
    want: AutoMovieVector3Tuple,
  ): void => {
    if (!("point" in probe))
      failures.push(`${what}: not placed (${probe.reason})`);
    else if (
      !vclose(
        { x: probe.point[0], y: probe.point[1], z: probe.point[2] },
        { x: want[0], y: want[1], z: want[2] },
        1e-9,
      )
    )
      failures.push(
        `${what}: [${probe.point.join(", ")}] instead of [${want.join(", ")}]`,
      );
  };

  // 1. Walls 10 mm apart, above the required 4 mm.
  at(
    "walls 10 mm apart",
    P.between("wide", made("a", 0), made("b", 2 * R + 10)),
    [0, 20, R + 5],
  );

  // 2. Walls 3 mm apart, below the required 4 mm.
  const narrow: P.IProbe = P.between(
    "narrow",
    made("a", 0),
    made("b", 2 * R + 3),
  );
  if ("point" in narrow || !(narrow.reason.length > 0))
    failures.push("walls 3 mm apart: placed, or listed without a reason");

  // 3. A cutter's probe on its course's middle station.
  at("cutter", P.middle("cutter", made("cutter", 2, 1)), [1, 20, 2]);

  // 4. f1's listing.
  const probes: P.IProbe[] = P.list(AutoMovieHumanF1EmptyProbes);
  const names: string[] = probes.map((probe: P.IProbe): string => probe.name);
  const fingers: string[] = [
    "finger.index-middle",
    "finger.middle-ring",
    "finger.ring-pinky",
  ];
  const expected: string[] = [
    ...AutoMovieHumanF1.CUTTERS.flatMap(
      (c: {
        family: IAutoMovieHumanConicLoft.IFamily;
        mirrored: boolean;
      }): string[] =>
        c.mirrored
          ? [c.family.name, `${c.family.name}.mirror`]
          : [c.family.name],
    ),
    "legs",
    ...fingers,
    ...fingers.map((n: string): string => `${n}.mirror`),
  ];
  if (JSON.stringify(names) !== JSON.stringify(expected))
    failures.push(
      `f1 lists [${names.join(", ")}] instead of [${expected.join(", ")}]`,
    );
  for (const probe of probes) {
    const point: boolean = "point" in probe;
    const reason: boolean = "reason" in probe;
    if (point === reason)
      failures.push(`${probe.name}: needs exactly one of a point and a reason`);
    if (!(probe.derivation.length > 0))
      failures.push(`${probe.name}: no derivation`);
    if (/lip|mouth/.test(probe.name))
      failures.push(`${probe.name}: f1's mouth has no lip gap`);
  }

  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
