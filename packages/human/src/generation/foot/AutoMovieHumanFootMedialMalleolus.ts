import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import type { AutoMovieHumanFootBody } from "./AutoMovieHumanFootBody";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootMalleolusBump } from "./AutoMovieHumanFootMalleolusBump";
import { AutoMovieHumanFootMalleolusWindow } from "./AutoMovieHumanFootMalleolusWindow";

/**
 * The medial malleolus: a relief window on the body's chain, centred where the
 * medial border's guide stands at the medial malleolus's height (1.1 lateral
 * malleolus heights, Gray: the medial one stands higher), moving skin outward
 * along the foot's medial direction by the bump of its prominence and radius
 * ({@link AutoMovieHumanFootMalleolusBump}). Own centre: the medial
 * malleolus's, on the tibia's distal end; its axis is the foot's medial
 * direction. The right foot's window is the left's reflected: phases reversed,
 * axis mirrored.
 */
export namespace AutoMovieHumanFootMedialMalleolus {
  /** The medial malleolus's window for a side. */
  export function of(
    frame: AutoMovieHumanFootFrame.IFrame,
    body: AutoMovieHumanFootBody.IBody,
    sign: 1 | -1,
    side: "left" | "right",
  ): IAutoMovieHumanRelief {
    const m: { height: number; prominence: number; radius: number } = AutoMovieHumanFootPrior.PRIOR.malleoli.medial;
    const place: AutoMovieHumanFootMalleolusWindow.IPlace = AutoMovieHumanFootMalleolusWindow.of({
      frame,
      body,
      which: "medial",
      height: m.height,
      radius: m.radius,
      sign,
    });
    const bump: AutoMovieHumanFootMalleolusBump.IBump = AutoMovieHumanFootMalleolusBump.of(m.prominence);

    return {
      name: `foot.${side}.malleolus.medial`,
      stations: place.stations,
      phases: place.phases,
      axis: G.sided(G.scale(frame.lateral, -1), sign),
      rows: bump.rows,
      columns: bump.columns,
      heights: bump.heights,
    };
  }
}
