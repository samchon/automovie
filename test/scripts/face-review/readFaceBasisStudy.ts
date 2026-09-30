import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

import type { IFaceBasisRevisionIo } from "./IFaceBasisRevisionIo";
import type { IFaceStudyFile } from "./IFaceStudyFile";
import { readFaceStudyFile } from "./readFaceStudyFile";

/**
 * Read the three files every basis revision starts from: the published
 * `basis.json.gz`, the subjects' `subjects.json` and the `simple-controls.json`
 * control map of a global-face study directory.
 *
 * A revision entry reads its whole input through this, so the digests its
 * receipt records are those of the files it was given. Nothing is validated
 * here; the preparation function that receives the values does.
 */
export function readFaceBasisStudy(
  io: IFaceBasisRevisionIo,
  directory: string,
): {
  basis: IFaceStudyFile<IAutoMovieHumanFaceBasis>;
  subjects: IFaceStudyFile<IAutoMovieHumanFaceBasisDocument[]>;
  controls: IFaceStudyFile<IAutoMovieHumanFaceControlMap>;
} {
  return {
    basis: readFaceStudyFile(io, directory, "basis.json.gz"),
    subjects: readFaceStudyFile(io, directory, "subjects.json"),
    controls: readFaceStudyFile(io, directory, "simple-controls.json"),
  };
}
