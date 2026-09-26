/**
 * Design relations checked against the current house build. A datum may move;
 * its consumers must still describe the same stair landing and window voids.
 * The authored values live in spaces owners, while this module compares their
 * independently emitted route and room reservation records in world metres.
 */
import { MAIN } from "../spaces/building";
import { FRONT_WINDOWS } from "../spaces/envelope/front-windows";
import { LIVING_LEFT_WINDOW } from "../spaces/envelope/left";
import { FAMILY_REAR_WINDOW } from "../spaces/envelope/rear";
import { FAMILY_RIGHT_WINDOW } from "../spaces/envelope/right";
import type { buildHouseEnvironment } from "../spaces/environment";
import type { buildHouse } from "../spaces/house";
import { STAIR_OPENING, STAIR_STEPS } from "../spaces/stair";
import { floorOf } from "../spaces/storeys";

type Range = readonly [number, number];
export type Box = { x: Range; y?: Range; z: Range };
type Window = { from: number; to: number; top: number };

const same = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;
const sameRange = (a: Range | undefined, b: Range): boolean =>
  a !== undefined && same(a[0], b[0]) && same(a[1], b[1]);

/** The route's turn must sit at the physical landing centre and eighth rise. */
export const verifyStairLanding = (
  route: readonly { x: number; y: number; z: number }[],
  opening: { west: number; turnX: number; back: number; turnZ: number },
  rise: number,
): void => {
  const turn = route[3];
  if (
    turn === undefined ||
    !same(turn.x, (opening.west + opening.turnX) / 2) ||
    !same(turn.y, rise * 8) ||
    !same(turn.z, (opening.back + opening.turnZ) / 2)
  )
    throw new Error(
      "stair connector turn differs from landing centre and eighth rise",
    );
};

/** Six room strips use the same void margin, head/floor margin and inner-face depth. */
export const verifyCurtainStrip = (
  id: string,
  actual: Box | undefined,
  window: Window,
  floor: number,
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
    !sameRange(actual.y, [floor + 0.1, window.top + 0.12])
  )
    throw new Error(
      `${id}: curtain strip differs from its window void or floor`,
    );
};

/** Check all current-source consumers; new curtain reservations must join this census. */
export const verifyHouseSpaceDesign = (
  house: ReturnType<typeof buildHouse>,
  environment: ReturnType<typeof buildHouseEnvironment>,
): void => {
  const stair = environment.connectors.find(
    (connector) => connector.id === "main-stair-connection",
  );
  if (stair === undefined) throw new Error("main stair connector is absent");
  verifyStairLanding(stair.route, STAIR_OPENING, STAIR_STEPS.rise);
  const strips = [
    [
      "living-front-curtain",
      FRONT_WINDOWS.living,
      "ground-storey",
      "x",
      MAIN.inner.z[1],
      -1,
    ],
    [
      "living-left-curtain",
      LIVING_LEFT_WINDOW,
      "ground-storey",
      "z",
      MAIN.inner.x[0],
      1,
    ],
    [
      "family-rear-curtain",
      FAMILY_REAR_WINDOW,
      "ground-storey",
      "x",
      MAIN.inner.z[0],
      1,
    ],
    [
      "family-right-curtain",
      FAMILY_RIGHT_WINDOW,
      "ground-storey",
      "z",
      MAIN.inner.x[1],
      -1,
    ],
    [
      "bedroom-two-front-curtain",
      FRONT_WINDOWS.bedroomTwo,
      "upper-storey",
      "x",
      MAIN.inner.z[1],
      -1,
    ],
    [
      "bedroom-three-front-curtain",
      FRONT_WINDOWS.bedroomThree,
      "upper-storey",
      "x",
      MAIN.inner.z[1],
      -1,
    ],
  ] as const;
  for (const [id, window, storey, axis, face, inward] of strips) {
    const room = house.spaces.find((space) =>
      space.reservations?.some((reservation) => reservation.id === id),
    );
    const reservation = room?.reservations?.find((item) => item.id === id);
    verifyCurtainStrip(
      id,
      reservation,
      window,
      floorOf(storey),
      axis,
      face,
      inward,
    );
  }
};
