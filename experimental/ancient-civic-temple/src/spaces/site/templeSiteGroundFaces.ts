import type { WallFace } from "../../geometry/WallFace";
import { gradeTopFaces } from "./gradeTopFaces";
import { templeSitePieces } from "./templeSitePieces";


export const templeSiteGroundFaces = (): WallFace[] => templeSitePieces().flatMap((piece) => gradeTopFaces(piece.rect, `surface.site.${piece.surface}`));
