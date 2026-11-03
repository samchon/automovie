import { HumanDebugPieceChains } from "./HumanDebugPieceChains";
import { HumanDebugPieceRegion } from "./HumanDebugPieceRegion";
import { HumanDebugPieceTiming } from "./HumanDebugPieceTiming";
import { HumanDebugPieceWeb } from "./HumanDebugPieceWeb";
import { HumanDebugPieceFootArcs } from "./foot/HumanDebugPieceFootArcs";
import { HumanDebugPieceFootBody } from "./foot/HumanDebugPieceFootBody";
import { HumanDebugPieceFootCentres } from "./foot/HumanDebugPieceFootCentres";
import { HumanDebugPieceFootGuides } from "./foot/HumanDebugPieceFootGuides";
import { HumanDebugPieceFootKnots } from "./foot/HumanDebugPieceFootKnots";
import { HumanDebugPieceFootLoft } from "./foot/HumanDebugPieceFootLoft";
import { HumanDebugPieceShoulderOutline } from "./shoulder/HumanDebugPieceShoulderOutline";
import { HumanDebugPieceShoulderOval } from "./shoulder/HumanDebugPieceShoulderOval";
import { HumanDebugPieceTrunkChains } from "./trunk/HumanDebugPieceTrunkChains";
import { HumanDebugPieceTrunkLandmarks } from "./trunk/HumanDebugPieceTrunkLandmarks";
import { HumanDebugPieceWebSaddle } from "./web/HumanDebugPieceWebSaddle";
import type { IHumanDebugPiece } from "./IHumanDebugPiece";

/**
 * Every registered piece: the generic chain and region lofts first, then each region's pieces from
 * its centres outward to its loft. A new piece is one file exporting one `IHumanDebugPiece` and one
 * entry here; the page's piece menu, the index route and the batch render read this list.
 */
export const HUMAN_DEBUG_PIECES: readonly IHumanDebugPiece[] = [
  HumanDebugPieceChains,
  HumanDebugPieceRegion,
  HumanDebugPieceWeb,
  HumanDebugPieceTiming,
  HumanDebugPieceTrunkLandmarks,
  HumanDebugPieceTrunkChains,
  HumanDebugPieceShoulderOutline,
  HumanDebugPieceShoulderOval,
  HumanDebugPieceFootCentres,
  HumanDebugPieceFootKnots,
  HumanDebugPieceFootGuides,
  HumanDebugPieceFootArcs,
  HumanDebugPieceFootBody,
  HumanDebugPieceFootLoft,
  HumanDebugPieceWebSaddle,
];
