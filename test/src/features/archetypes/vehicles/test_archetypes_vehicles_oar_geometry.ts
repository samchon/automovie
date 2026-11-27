import {
  BoatOars
} from "../../../../../packages/archetypes/src/vehicles/internal/BoatOars";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Angle-to-height arithmetic at the fixture's metre scale. */
const OAR_ROUNDING: number = 128 * Number.EPSILON;

/** The upper blade root sets the rest angle and the lower tip sets lift. */
export function test_archetypes_vehicles_oar_geometry(): void {
  const oar = BoatOars.geometry({
    beam: 1.4,
    depth: 0.42,
    draft: 0.18,
    bladeLength: 0.55,
    bladeWidth: 0.16,
  });
  const pivot: number = 0.29;
  const handle: number = 0.7 + 2 * 0.0254;
  const tip: number = (18 * handle) / 7;
  const bladeRoot: number = tip - 0.55;
  const halfBlade: number = 0.08;
  TestValidator.predicate(
    "oarlock span, height and leverage",
    oar.span === 1.4 &&
      nclose(oar.pivot, pivot, OAR_ROUNDING) &&
      nclose(oar.inboard, handle, OAR_ROUNDING) &&
      nclose(oar.outboard, tip, OAR_ROUNDING),
  );
  const rest: number = (oar.rest * Math.PI) / 180;
  TestValidator.predicate(
    "the resting blade's upper inner corner lies on the waterline",
    nclose(
      pivot - bladeRoot * Math.sin(rest) + halfBlade * Math.cos(rest),
      0,
      OAR_ROUNDING,
    ),
  );
  for (const [lift, height] of [
    [oar.touch, 0],
    [oar.clear, 0.1],
  ] as const) {
    const angle: number = ((oar.rest - lift) * Math.PI) / 180;
    TestValidator.predicate(
      `the blade's lower far corner reaches ${height} m`,
      nclose(
        pivot - tip * Math.sin(angle) - halfBlade * Math.cos(angle),
        height,
        OAR_ROUNDING,
      ),
    );
  }
}
