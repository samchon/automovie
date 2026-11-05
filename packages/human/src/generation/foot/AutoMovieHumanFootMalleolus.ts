import type { IAutoMovieLoftRelief } from "@automovie/engine";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import type { AutoMovieHumanFootBody } from "./AutoMovieHumanFootBody";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootMalleolusBump } from "./AutoMovieHumanFootMalleolusBump";
import { AutoMovieHumanFootMalleolusWindow } from "./AutoMovieHumanFootMalleolusWindow";

/**
 * A malleolus: a relief window on the body's chain, centred where its border's
 * guide stands at the malleolus's height, moving skin outward along its side's
 * direction by the bump of its prominence and radius
 * ({@link AutoMovieHumanFootMalleolusBump}, the prior's `malleoli`):
 *
 * - lateral: on the fibula's distal end, 1 lateral malleolus height over the
 *   floor (the input's published site), its axis the foot's lateral direction;
 * - medial: on the tibia's distal end, 1.1 lateral malleolus heights (Gray: the
 *   medial one stands higher), its axis the foot's medial direction.
 *
 * The right foot's window is the left's reflected: phases reversed, axis
 * mirrored.
 */
export namespace AutoMovieHumanFootMalleolus {
  /**
   * A malleolus's window.
   *
   * @param which The lateral or the medial malleolus.
   * @param frame The foot's frame.
   * @param body The foot's body.
   * @param sign 1 for the left foot, -1 for the right.
   * @param side Which foot.
   * @returns The relief window.
   */
  export function of(
    which: "lateral" | "medial",
    frame: AutoMovieHumanFootFrame.IFrame,
    body: AutoMovieHumanFootBody.IBody,
    sign: 1 | -1,
    side: "left" | "right",
  ): IAutoMovieLoftRelief {
    const m: { height: number; prominence: number; radius: number } = AutoMovieHumanFootPrior.PRIOR.malleoli[which];
    const place: AutoMovieHumanFootMalleolusWindow.IPlace = AutoMovieHumanFootMalleolusWindow.of({
      frame,
      body,
      which,
      height: m.height,
      radius: m.radius,
      sign,
    });
    const bump: AutoMovieHumanFootMalleolusBump.IBump = AutoMovieHumanFootMalleolusBump.of(m.prominence);
    const outward: G.Vec3 = which === "lateral" ? frame.lateral : G.scale(frame.lateral, -1);
    return {
      name: `foot.${side}.malleolus.${which}`,
      stations: place.stations,
      phases: place.phases,
      axis: G.sided(outward, sign),
      rows: bump.rows,
      columns: bump.columns,
      heights: bump.heights,
    };
  }
}
