import type { WallFace } from "../../geometry/WallFace";
import { gradeTopFaces } from "./gradeTopFaces";
import { templeSitePieces } from "./templeSitePieces";


/** Top faces of every site ground piece, following the grade. */
export const templeSiteGroundFaces = (): WallFace[] => templeSitePieces().flatMap((piece) => gradeTopFaces(piece.rect, `surface.site.${piece.surface}`));
