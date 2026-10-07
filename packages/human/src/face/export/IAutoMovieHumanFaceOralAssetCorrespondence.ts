import type { IAutoMovieHumanStaticPartCorrespondence } from "../../common/export/IAutoMovieHumanStaticPartCorrespondence";
import type { IAutoMovieHumanFaceOralExportQualification } from "./IAutoMovieHumanFaceOralExportQualification";

/** Exact actual static geometry intervals and separate coarse oral qualification.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralAssetCorrespondence {
  /** Accessor-bound generic source members, admitted by the common reader. */
  geometry: IAutoMovieHumanStaticPartCorrespondence;
  /** Original source rights/clinical limits, without reconstructing edit fields. */
  qualification: IAutoMovieHumanFaceOralExportQualification;
}
