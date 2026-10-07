import { validateBuiltEnvironment } from "@automovie/engine";
import type { IAutoMovieSpaceShell } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtSpaceShellTestBoxShell as boxShell } from "./builtSpaceShellTestBoxShell";
import { builtSpaceShellTestWork as work } from "./builtSpaceShellTestWork";
import { hasViolation, namedFacts } from "./predicates";

/** Validate the existing whole, malformed and inward box shell cases. */
export const assertBuiltSpaceShellTestRefusals = (
  cube: IAutoMovieSpaceShell,
): void => {
  const refuse = (shell: IAutoMovieSpaceShell): boolean =>
    hasViolation(
      validateBuiltEnvironment({ environment: work({ shell }) }),
      "range",
      ".shell",
    ) ||
    hasViolation(
      validateBuiltEnvironment({ environment: work({ shell }) }),
      "type",
      ".shell",
    );

  TestValidator.equals(
    "a shell is held to what makes its inside a fact",
    namedFacts([
      ["aWholeCubePasses", () => refuse(cube) === false],
      [
        "bothSpellingsAtOnce",
        () =>
          hasViolation(
            validateBuiltEnvironment({
              environment: work({
                cells: [
                  {
                    id: "box",
                    planes: [
                      { normal: { x: 1, y: 0, z: 0 }, offset: 1 },
                      { normal: { x: -1, y: 0, z: 0 }, offset: 0 },
                      { normal: { x: 0, y: 1, z: 0 }, offset: 1 },
                      { normal: { x: 0, y: -1, z: 0 }, offset: 0 },
                    ],
                  },
                ],
              }),
            }),
            "type",
            ".shell",
          ),
      ],
      [
        "tooFewVertices",
        () =>
          refuse({
            vertices: cube.vertices.slice(0, 3),
            triangles: [0, 1, 2, 0, 2, 1, 1, 2, 0, 2, 1, 0],
          }),
      ],
      [
        "tooFewTriangles",
        () => refuse({ ...cube, triangles: cube.triangles.slice(0, 9) }),
      ],
      [
        "aRaggedIndexCount",
        () => refuse({ ...cube, triangles: [...cube.triangles, 0] }),
      ],
      [
        "anIndexNamingNoVertex",
        () =>
          refuse({
            ...cube,
            triangles: cube.triangles.map((index, at) =>
              at === 0 ? 99 : index,
            ),
          }),
      ],
      [
        "aFractionalIndex",
        () =>
          refuse({
            ...cube,
            triangles: cube.triangles.map((index, at) =>
              at === 0 ? 0.5 : index,
            ),
          }),
      ],
      [
        "aDegenerateFacet",
        () =>
          refuse({
            ...cube,
            triangles: cube.triangles.map((index, at) =>
              at === 1 ? 0 : index,
            ),
          }),
      ],
      [
        "anUnmatchedEdge",
        () => refuse({ ...cube, triangles: cube.triangles.slice(0, 33) }),
      ],
      [
        "aDoubledFacet",
        () =>
          refuse({
            ...cube,
            triangles: [...cube.triangles, ...cube.triangles.slice(0, 3)],
          }),
      ],
      [
        "aShellWoundInsideOut",
        () =>
          refuse(boxShell({ x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 }, false)),
      ],
      [
        "aNonFiniteVertex",
        () =>
          refuse({
            ...cube,
            vertices: cube.vertices.map((vertex, at) =>
              at === 0 ? { ...vertex, y: Number.NaN } : vertex,
            ),
          }),
      ],
    ]),
    {
      aWholeCubePasses: true,
      bothSpellingsAtOnce: true,
      tooFewVertices: true,
      tooFewTriangles: true,
      aRaggedIndexCount: true,
      anIndexNamingNoVertex: true,
      aFractionalIndex: true,
      aDegenerateFacet: true,
      anUnmatchedEdge: true,
      aDoubledFacet: true,
      aShellWoundInsideOut: true,
      aNonFiniteVertex: true,
    },
  );
};
