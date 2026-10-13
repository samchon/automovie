import { IAutoMovieSpace } from "@automovie/interface";

import { IAutoMoviePreparedSpace } from "./IAutoMoviePreparedSpace";
import { heightAt } from "./heightAt";
import { prepareSpace } from "./prepareSpace";

/** May an actor stand at `(x, z)`? Exactly `heightAt(...) !== null`. */
export const isWalkable = (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared: IAutoMoviePreparedSpace = prepareSpace(space),
): boolean => heightAt(space, x, z, prepared) !== null;
