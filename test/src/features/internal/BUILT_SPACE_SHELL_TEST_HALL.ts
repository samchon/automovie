import type { IAutoMovieSpaceShell } from "@automovie/interface";
import { builtSpaceShellTestBoxShell as boxShell } from "./builtSpaceShellTestBoxShell";


/** One shell holding two, the inner one wound inward so it reads as a void. */
const merge = (
  outer: IAutoMovieSpaceShell,
  inner: IAutoMovieSpaceShell,
): IAutoMovieSpaceShell => ({
  vertices: [...outer.vertices, ...inner.vertices],
  triangles: [
    ...outer.triangles,
    ...inner.triangles.map((index) => index + outer.vertices.length),
  ],
});


/** A 10x4x10 hall with a 4x4x4 atrium void standing in the middle of it. */
export const BUILT_SPACE_SHELL_TEST_HALL = merge(
  boxShell({ x: 0, y: 0, z: 0 }, { x: 10, y: 4, z: 10 }),
  boxShell({ x: 3, y: 0, z: 3 }, { x: 7, y: 4, z: 7 }, false),
);
