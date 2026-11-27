import {
  type IAutoMoviePreparedSpace,
  IAutoMovieSpace,
} from "@automovie/interface";

import { heightAt } from "./heightAt";
import { prepareSpace } from "./prepareSpace";

/*
 * Prepare a space once and expose its walking height as a ground callback.
 */
export const spaceGround: (
  space: IAutoMovieSpace,
  fallback?: number,
) => (x: number, z: number) => number = (
  space: IAutoMovieSpace,
  fallback: number = 0,
): ((x: number, z: number) => number) => {
  const prepared: IAutoMoviePreparedSpace = prepareSpace(space);
  return (x: number, z: number): number =>
    heightAt(space, x, z, prepared) ?? fallback;
};
