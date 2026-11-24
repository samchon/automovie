import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanRefusal,
  operateLongInsertStaff,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a distance and a half length, metres. */
const ROUNDING: number = 1e-12;

/**
 * `operateLongInsertStaff` reads the run a hand regrips along a long staff: the
 * longest bar or handle's middle distance from the working point, less and more
 * its half length, and its aperture as the width.
 *
 * Scenarios, a rammer whose tip lies at its origin:
 *
 * 1. A 1.2 m bar centred 1.5 m from the tip, 0.04 m across, runs from 0.9 to 2.1
 *    m, 0.04 m wide; a shorter 0.2 m handle beside it is not the run.
 * 2. A staff with no bar or handle with a length is refused on `mechanism.prop`.
 */
export function test_unit_motions_affordance_operate_long_insert_staff(): void {
  const site: (
    id: string,
    kind: IAutoMovieAffordance["kind"],
    at: IAutoMovieVector3,
    length?: number,
  ) => IAutoMovieAffordance = (
    id: string,
    kind: IAutoMovieAffordance["kind"],
    at: IAutoMovieVector3,
    length?: number,
  ): IAutoMovieAffordance => ({
    id,
    kind,
    frame: {
      translation: at,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
    ...(length === undefined ? {} : { length, aperture: 0.04 }),
  });
  const staff: (
    affordances: IAutoMovieAffordance[],
  ) => Parameters<typeof operateLongInsertStaff>[0] = (
    affordances: IAutoMovieAffordance[],
  ): Parameters<typeof operateLongInsertStaff>[0] => ({
    prop: () => ({ prop: { affordances } }),
  });
  const run: operateLongInsertStaff.IRun = operateLongInsertStaff(
    staff([
      site("tip", "socket", { x: 0, y: 0, z: 0 }),
      site("shaft", "bar", { x: 0, y: 0, z: 1.5 }, 1.2),
      site("grip", "handle", { x: 0, y: 0, z: 0.3 }, 0.2),
    ]),
    { prop: "rammer" },
  );
  TestValidator.predicate(
    "the run",
    nclose(run.lo, 0.9, ROUNDING) &&
      nclose(run.hi, 2.1, ROUNDING) &&
      nclose(run.width, 0.04, ROUNDING),
  );
  let refused: boolean = false;
  try {
    operateLongInsertStaff(
      staff([site("tip", "socket", { x: 0, y: 0, z: 0 })]),
      {
        prop: "rammer",
      },
    );
  } catch (error: unknown) {
    refused = error instanceof HumanRefusal && error.axis === "mechanism.prop";
  }
  TestValidator.predicate("no run", refused);
}
