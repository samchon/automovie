import {
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
 * places a cutter's probe on its course's middle station and lists every probe
 * required by the supplied families.
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
 * 4. The supplied listing names the single cutter, both copies of the reflected
 *    cutter, the leg gap and the adjacent finger gaps on both hands. Each probe
 *    has exactly one of a point and a reason.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanEmptyProbes.between`, `middle` and `list` on closed-form families and checks the placement and ordered listing.
 * @evidence contracts/development/testing.md#independent-expectations Wall points and gaps follow from circles. The expected names follow from cutter mirroring and finger order.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes a gap above and one below the requirement, a cutter and a listing with both mirrored and independent entries.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit on authored circles without a realized skin.
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

  const probes: P.IProbe[] = P.list({
    cutters: [
      { family: made("lacuna", 0), mirrored: false, cut: (family) => family },
      { family: made("nostril", 22), mirrored: true, cut: (family) => family },
    ],
    leg: made("leg", 32),
    fingers: [
      made("finger.index", 0),
      made("finger.middle", 40),
      made("finger.ring", 80),
    ],
  });
  const names: string[] = probes.map((probe: P.IProbe): string => probe.name);
  const fingers: string[] = ["finger.index-middle", "finger.middle-ring"];
  const expected: string[] = [
    "lacuna",
    "nostril",
    "nostril.mirror",
    "legs",
    ...fingers,
    ...fingers.map((n: string): string => `${n}.mirror`),
  ];
  if (JSON.stringify(names) !== JSON.stringify(expected))
    failures.push(
      `listing gives [${names.join(", ")}] instead of [${expected.join(", ")}]`,
    );
  for (const probe of probes) {
    const point: boolean = "point" in probe;
    const reason: boolean = "reason" in probe;
    if (point === reason)
      failures.push(`${probe.name}: needs exactly one of a point and a reason`);
    if (!(probe.derivation.length > 0))
      failures.push(`${probe.name}: no derivation`);
  }

  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
