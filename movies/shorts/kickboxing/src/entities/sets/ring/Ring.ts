import type { IAutoMovieZone } from "@automovie/engine";

import { RingFigure } from "./RingFigure";

/**
 * The ring: its fighting square, ropes and corners as the set's zones and
 * landmarks, so scenes and interactions name places ("the far neutral
 * corner", "the centre") and the set decides where they are. The canvas top
 * is the world floor (y = 0); x and z span the fighting square about its
 * centre; A's red corner and B's cyan corner are diagonally opposite, the two
 * light neutral corners on the other diagonal.
 *
 * ```ts
 * const ring = new Ring();
 * resolveAutoMovieZone(ring.zones, "neutral-corners", "north-east");
 * ```
 *
 * @evidence docs/body/settings/sets/ring.md#canvas A six-metre fighting square inside the ropes on a 6.4-metre canvas; ropes at 40, 70, 100 and 130 cm.
 * @evidence docs/body/settings/sets/ring.md#centre The centre the fighters fight for.
 * @evidence docs/body/settings/sets/ring.md#corners The red and cyan corners, diagonally opposite.
 * @evidence docs/body/settings/sets/ring.md#neutral-corners The two light neutral corners.
 */
export class Ring {
  /** Half the side of the fighting square inside the ropes, metres. */
  public readonly half: number = 3;

  /** Half the side of the canvas, metres. */
  public readonly canvasHalf: number = 3.2;

  /** Canvas height above the arena floor, metres. */
  public readonly platform: number = 1;

  /** Rope heights above the canvas, metres. */
  public readonly ropes: readonly number[] = Object.freeze([0.4, 0.7, 1, 1.3]);

  /** The set's zones: the centre, the fighters' corners and the neutral corners, with corner landmarks at the posts. */
  public readonly zones: readonly IAutoMovieZone[];

  /** Build the ring from its settings. */
  public constructor() {
    const h: number = this.half;
    this.zones = Object.freeze([
      { id: "centre", center: { x: 0, y: 0, z: 0 }, radius: h / 3 },
      { id: "red-corner", center: { x: -h, y: 0, z: h }, radius: 0 },
      { id: "blue-corner", center: { x: h, y: 0, z: -h }, radius: 0 },
      {
        id: "neutral-corners",
        center: { x: 0, y: 0, z: 0 },
        radius: h * Math.SQRT2,
        landmarks: Object.freeze({
          "north-east": { x: h, y: 0, z: h },
          "south-west": { x: -h, y: 0, z: -h },
        }),
      },
    ]);
    Object.freeze(this);
  }

  /**
   * The ring's displayed scenery.
   *
   * @returns A new figure owned by the caller.
   */
  public figure(): RingFigure {
    return new RingFigure(this);
  }
}
