import type { AutoMovieFurnishingWall, IAutoMovieVector3 } from "@automovie/interface";

export namespace FurnishRoomData {
  /*
   * Room-frame point on each wall's inner face and its unit normal into the room.
   */
  export const WALL_FACES: Readonly<
    Record<
      AutoMovieFurnishingWall,
      (
        width: number,
        depth: number,
      ) => readonly [point: IAutoMovieVector3, normal: IAutoMovieVector3]
    >
  > = {
    "-z": (_w: number, d: number) => [
      { x: 0, y: 0, z: -d / 2 },
      { x: 0, y: 0, z: 1 },
    ],
    "+z": (_w: number, d: number) => [
      { x: 0, y: 0, z: d / 2 },
      { x: 0, y: 0, z: -1 },
    ],
    "-x": (w: number) => [
      { x: -w / 2, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ],
    "+x": (w: number) => [
      { x: w / 2, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
    ],
  };
}
