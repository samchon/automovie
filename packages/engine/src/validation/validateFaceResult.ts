import { IAutoMovieFace, IAutoMovieValidation } from "@automovie/interface";

import { validateFace } from "./validateFace";

/** Convenience wrapper returning a finished {@link IAutoMovieValidation}. */
export const validateFaceResult = (
  face: IAutoMovieFace,
): IAutoMovieValidation => validateFace({ face }).toValidation();
