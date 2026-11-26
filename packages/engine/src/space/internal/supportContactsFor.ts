import {
  type IAutoMoviePreparedSpace,
  IAutoMovieSpace,
  IAutoMovieSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareSpace } from "./prepareSpace";
import { surfaceAt } from "./surfaceAt";
import { surfaceHeightAt } from "./surfaceHeightAt";

/** Project supplied footprint points onto the topmost authored support surface. */
export const supportContactsFor: (
  space: IAutoMovieSpace,
  footprint: readonly IAutoMovieVector3[],
) => IAutoMovieVector3[] = (
  space: IAutoMovieSpace,
  footprint: readonly IAutoMovieVector3[],
): IAutoMovieVector3[] => {
  const contacts: IAutoMovieVector3[] = [];
  const prepared: IAutoMoviePreparedSpace = prepareSpace(space);
  for (const point of footprint) {
    const surface: IAutoMovieSurface | null = surfaceAt(
      space,
      point.x,
      point.z,
      prepared,
    );
    if (surface === null) continue;
    contacts.push({
      x: point.x,
      y: surfaceHeightAt(surface, point.x, point.z),
      z: point.z,
    });
  }
  return contacts;
};
