import type { IAutoMovieSpaceShell } from "@automovie/interface";

import { builtSpaceShellTestBoxShell as boxShell } from "./builtSpaceShellTestBoxShell";

/** One shell holding two, the inner one wound inward so it reads as a void. */
const merge: (outer: IAutoMovieSpaceShell, inner: IAutoMovieSpaceShell) => IAutoMovieSpaceShell = (
  outer: IAutoMovieSpaceShell,
  inner: IAutoMovieSpaceShell,
): IAutoMovieSpaceShell => ({
  vertices: [...outer.vertices, ...inner.vertices],
  triangles: [
    ...outer.triangles,
    ...inner.triangles.map((index: number): number => index + outer.vertices.length),
  ],
});

/** A 10x4x10 hall with a 4x4x4 atrium void standing in the middle of it.
 *
 * Supply the authored hall shell with an inward atrium void. Constructing or locating this fixture alone is not a product behavior proof; its consumers own assertions.
 * An outer 10x4x10 box minus an inner 4x4x4 box gives the independent 336m3 volume; translated triangle indices retain the two separately authored windings.
 * Outer hall points contrast with atrium points and shell boundaries; consumers own signed-volume/solid-angle interpretation, while this constant contains no product query output.
 */
export const BUILT_SPACE_SHELL_TEST_HALL: IAutoMovieSpaceShell = merge(
  boxShell({ x: 0, y: 0, z: 0 }, { x: 10, y: 4, z: 10 }),
  boxShell({ x: 3, y: 0, z: 3 }, { x: 7, y: 4, z: 7 }, false),
);
