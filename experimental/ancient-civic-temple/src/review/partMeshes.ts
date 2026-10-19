import { realizeAutoMovieGeometry } from "@automovie/engine";
import type { IAutoMovieModel, IAutoMovieMesh } from "@automovie/interface";

/** Converts model part recipes through the canonical public engine geometry owner. */

export const partMeshes = (model: IAutoMovieModel): IAutoMovieMesh[] => model.parts.map((part) => realizeAutoMovieGeometry(part.geometry).mesh);
