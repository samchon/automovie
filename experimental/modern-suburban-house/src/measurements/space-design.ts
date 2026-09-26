/**
 * Design relations checked against the current house build. A datum may move;
 * its consumers must still describe the same stair landing and window voids.
 * The authored values live in spaces owners, while this module compares their
 * independently emitted route and room reservation records in world metres.
 */
import { MAIN } from "../spaces/building";
import { FRONT_WINDOWS } from "../spaces/envelope/front-windows";
import * as LEFT_ENVELOPE from "../spaces/envelope/left";
import * as REAR_ENVELOPE from "../spaces/envelope/rear";
import * as RIGHT_ENVELOPE from "../spaces/envelope/right";
import { openingAxis, type buildHouseEnvironment } from "../spaces/environment";
import type { buildHouse } from "../spaces/house";
import {
  STAIR_LANDING_STATION,
  STAIR_OPENING,
  STAIR_STEPS,
} from "../spaces/stair";
import { ceilingOf, floorOf } from "../spaces/storeys";

type Range = readonly [number, number];
export type Box = { x: Range; y?: Range; z: Range };
type Window = { from: number; to: number; top: number };
type ExportedWindow = Window & { id: string; bottom: number };

const isWindow = (value: unknown): value is ExportedWindow =>
  typeof value === "object" && value !== null &&
  "id" in value && typeof value.id === "string" && value.id.endsWith("-window") &&
  "from" in value && typeof value.from === "number" &&
  "to" in value && typeof value.to === "number" &&
  "bottom" in value && typeof value.bottom === "number" &&
  "top" in value && typeof value.top === "number";

const same = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;
const sameRange = (a: Range | undefined, b: Range): boolean =>
  a !== undefined && same(a[0], b[0]) && same(a[1], b[1]);

/** The approach, turn, departure, and upper arrival follow one landing station. */
export const verifyStairLanding = (
  route: readonly { x: number; y: number; z: number }[],
  opening: { west: number; turnX: number; east: number; back: number; turnZ: number },
  rise: number,
  station: number,
): void => {
  const x = (opening.west + opening.turnX) / 2;
  const z = (opening.back + opening.turnZ) / 2;
  const expected = [
    { x, y: rise * 8, z: opening.turnZ },
    { x, y: rise * 8, z },
    { x: opening.turnX, y: rise * 8, z },
    { x: opening.east, y: rise * 18, z },
  ];
  for (const [offset, point] of expected.entries()) {
    const actual = route[station - 1 + offset];
    if (actual === undefined || !same(actual.x, point.x) || !same(actual.y, point.y) || !same(actual.z, point.z))
      throw new Error(
        `stair connector station ${station - 1 + offset} differs from landing or upper arrival`,
      );
  }
};

/** Each window-backed strip uses its host span, authored bottom, head margin, and inward depth. */
export const verifyCurtainStrip = (
  id: string,
  actual: Box | undefined,
  window: Window,
  bottom: number,
  axis: "x" | "z",
  innerFace: number,
  inward: -1 | 1,
): void => {
  const span: Range = [window.from - 0.1, window.to + 0.1];
  const depth: Range =
    inward === 1
      ? [innerFace, innerFace + 0.12]
      : [innerFace - 0.12, innerFace];
  if (
    actual === undefined ||
    !sameRange(actual[axis], span) ||
    !sameRange(actual[axis === "x" ? "z" : "x"], depth) ||
    !sameRange(actual.y, [bottom, window.top + 0.12])
  )
    throw new Error(
      `${id}: curtain strip differs from its window void or floor`,
    );
};

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
        ? centre.z > (MAIN.outer.z[0] + MAIN.outer.z[1]) / 2
        : centre.x > (MAIN.outer.x[0] + MAIN.outer.x[1]) / 2;
      const face = axis === "x"
        ? frontOrRight
          ? MAIN.inner.z[1]
          : MAIN.inner.z[0]
        : frontOrRight
          ? MAIN.inner.x[1]
          : MAIN.inner.x[0];
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
