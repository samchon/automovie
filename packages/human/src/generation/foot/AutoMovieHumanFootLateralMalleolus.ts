import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import type { AutoMovieHumanFootBody } from "./AutoMovieHumanFootBody";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootMalleolusBump } from "./AutoMovieHumanFootMalleolusBump";
import { AutoMovieHumanFootMalleolusWindow } from "./AutoMovieHumanFootMalleolusWindow";

/**
 * The lateral malleolus: a relief window on the body's chain, centred where the
 * lateral border's guide stands at the lateral malleolus height (the input's
 * published site), moving skin outward along the foot's lateral direction by
 * the bump of its prominence and radius
 * ({@link AutoMovieHumanFootMalleolusBump}). Own centre: the lateral
 * malleolus's, on the fibula's distal end, 1 lateral malleolus height over the
 * floor; its axis is the foot's lateral direction. The right foot's window is
 * the left's reflected: phases reversed, axis mirrored.
 */
export namespace AutoMovieHumanFootLateralMalleolus {
  /** The lateral malleolus's window for a side. */
  export function of(
    frame: AutoMovieHumanFootFrame.IFrame,
    body: AutoMovieHumanFootBody.IBody,
    sign: 1 | -1,
    side: "left" | "right",
  ): IAutoMovieHumanRelief {
    const m: { height: number; prominence: number; radius: number } = AutoMovieHumanFootPrior.PRIOR.malleoli.lateral;
    const place: AutoMovieHumanFootMalleolusWindow.IPlace = AutoMovieHumanFootMalleolusWindow.of({
      frame,
      body,
      which: "lateral",
      height: m.height,
      radius: m.radius,
      sign,
    });
    const bump: AutoMovieHumanFootMalleolusBump.IBump = AutoMovieHumanFootMalleolusBump.of(m.prominence);

    return {
      name: `foot.${side}.malleolus.lateral`,
      stations: place.stations,
      phases: place.phases,
      axis: G.sided(frame.lateral, sign),
      rows: bump.rows,
      columns: bump.columns,
      heights: bump.heights,
    };
  }
}
