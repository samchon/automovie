/**
 * Design relations checked against the current house build. A datum may move;
 * its consumers must still describe the same stair landing and window voids.
 * The authored values live in spaces owners, while this module compares their
 * independently emitted route and room reservation records in world metres.
 */
import { MAIN_OUTLINE } from "../spaces/MAIN_OUTLINE";
import { FRONT_WINDOWS } from "../spaces/envelope/FRONT_WINDOWS";
import * as LEFT_ENVELOPE from "../spaces/envelope/buildLeft";
import * as REAR_ENVELOPE from "../spaces/envelope/buildRear";
import * as RIGHT_ENVELOPE from "../spaces/envelope/buildRight";
import { openingAxis } from "../spaces/openingAxis";
import type { buildHouseEnvironment } from "../spaces/buildHouseEnvironment";
import type { buildHouse } from "../spaces/buildHouse";
import {
  STAIR_OPENING,
} from "../spaces/STAIR_OPENING";
import { STAIR_LANDING_STATION } from "../spaces/STAIR_LANDING_STATION";
import { STAIR_STEPS } from "../spaces/STAIR_STEPS";
import { ceilingOf } from "../spaces/ceilingOf";
import { floorOf } from "../spaces/floorOf";
import { verifyStairLanding } from "./verifyStairLanding";
import { verifyCurtainStrip } from "./verifyCurtainStrip";
import { Window } from "./Window";
import { sameRange } from "./sameRange";

type ExportedWindow = Window & { id: string; bottom: number };

const isWindow = (value: unknown): value is ExportedWindow =>
  typeof value === "object" && value !== null &&
  "id" in value && typeof value.id === "string" && value.id.endsWith("-window") &&
  "from" in value && typeof value.from === "number" &&
  "to" in value && typeof value.to === "number" &&
  "bottom" in value && typeof value.bottom === "number" &&
  "top" in value && typeof value.top === "number";

/** Check every window-backed curtain fixture in the current house census. */
export const verifyHouseSpaceDesign = (
  house: ReturnType<typeof buildHouse>,
  environment: ReturnType<typeof buildHouseEnvironment>,
): void => {
  const stair = environment.connectors.find(
    (connector) => connector.id === "main-stair-connection",
  );
  if (stair === undefined) throw new Error("main stair connector is absent");
  verifyStairLanding(
    stair.route,
    STAIR_OPENING,
    STAIR_STEPS.rise,
    STAIR_LANDING_STATION,
  );
  const exportedValues: unknown[] = [
    ...Object.values(FRONT_WINDOWS),
    ...Object.values(LEFT_ENVELOPE),
    ...Object.values(REAR_ENVELOPE),
    ...Object.values(RIGHT_ENVELOPE),
  ];
  const windows = exportedValues.filter(isWindow);
  for (const room of house.spaces) for (const reservation of room.reservations ?? []) {
    if (reservation.id.endsWith("-curtain")) {
      if (reservation.kind !== "fixture") throw new Error(
        `${reservation.id}: curtain must reserve a fixture`,
      );
      const openingId = reservation.id.replace(/-curtain$/, "-window");
      const window = windows.find((candidate) => candidate.id === openingId);
      if (window === undefined) throw new Error(
        `${reservation.id}: no window export`,
      );
      const { centre, normal } = openingAxis(environment, openingId);
      const axis = Math.abs(normal.z) > Math.abs(normal.x) ? "x" : "z";
      const frontOrRight = axis === "x"
        ? centre.z > (MAIN_OUTLINE.outer.z[0] + MAIN_OUTLINE.outer.z[1]) / 2
        : centre.x > (MAIN_OUTLINE.outer.x[0] + MAIN_OUTLINE.outer.x[1]) / 2;
      const face = axis === "x"
        ? frontOrRight
          ? MAIN_OUTLINE.inner.z[1]
          : MAIN_OUTLINE.inner.z[0]
        : frontOrRight
          ? MAIN_OUTLINE.inner.x[1]
          : MAIN_OUTLINE.inner.x[0];
      const inward: -1 | 1 = frontOrRight ? -1 : 1;
      const bottom = room.id === "primary-bedroom"
        ? window.bottom - 0.75
        : floorOf(room.storey) + 0.1;
      verifyCurtainStrip(
        reservation.id,
        reservation,
        window,
        bottom,
        axis,
        face,
        inward,
      );
    }
    if (reservation.id.endsWith("-curtain-rail")) {
      if (reservation.kind !== "fixture" || !sameRange(reservation.y, [floorOf(room.storey) + 0.6, ceilingOf(room.storey)]))
        throw new Error(
          `${reservation.id}: bathroom curtain rail differs from its floor and ceiling`,
        );
    }
  }
};
