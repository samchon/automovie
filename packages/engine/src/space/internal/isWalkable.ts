import {
  type IAutoMoviePreparedSpace,
  IAutoMovieSpace,
} from "@automovie/interface";

import { heightAt } from "./heightAt";
import { prepareSpace } from "./prepareSpace";

/*
 * Answer whether the canonical walking-height query returns a height.
 */
export const isWalkable: (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared?: IAutoMoviePreparedSpace,
) => boolean = (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared: IAutoMoviePreparedSpace = prepareSpace(space),
): boolean => heightAt(space, x, z, prepared) !== null;
