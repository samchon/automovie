import { HumanDebugPieceChains } from "./HumanDebugPieceChains";
import { HumanDebugPieceRegion } from "./HumanDebugPieceRegion";
import { HumanDebugPieceWeb } from "./HumanDebugPieceWeb";
import { HumanDebugPieceFootArcs } from "./foot/HumanDebugPieceFootArcs";
import { HumanDebugPieceFootBody } from "./foot/HumanDebugPieceFootBody";
import { HumanDebugPieceFootCentres } from "./foot/HumanDebugPieceFootCentres";
import { HumanDebugPieceFootGuides } from "./foot/HumanDebugPieceFootGuides";
import { HumanDebugPieceFootKnots } from "./foot/HumanDebugPieceFootKnots";
import { HumanDebugPieceFootLoft } from "./foot/HumanDebugPieceFootLoft";
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
  HumanDebugPieceFootCentres,
  HumanDebugPieceFootKnots,
  HumanDebugPieceFootGuides,
  HumanDebugPieceFootArcs,
  HumanDebugPieceFootBody,
  HumanDebugPieceFootLoft,
  HumanDebugPieceWebSaddle,
];
