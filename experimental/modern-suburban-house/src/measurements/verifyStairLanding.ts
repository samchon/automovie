import { same } from "./same";

/** The approach, turn, departure, and upper arrival follow one landing station. */

export const verifyStairLanding = (
  route: readonly { x: number; y: number; z: number; }[],
  opening: { west: number; turnX: number; east: number; back: number; turnZ: number; },
  rise: number,
  station: number
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
        `stair connector station ${station - 1 + offset} differs from landing or upper arrival`
      );
  }
};
