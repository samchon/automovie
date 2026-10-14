import { validateBuiltEnvironment } from "@automovie/engine";
import type {
  IAutoMovieSpaceShell,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtSpaceShellTestBoxShell as boxShell } from "./builtSpaceShellTestBoxShell";
import { builtSpaceShellTestWork as work } from "./builtSpaceShellTestWork";
import { hasViolation, namedFacts } from "./predicates";

/** Validate the existing whole, malformed and inward box shell cases.
 *
 * Run the actual built-environment validator on the existing whole, malformed and inward shell cases. Its assertions must complete through the existing parent entry.
 * A watertight outward cube is valid; schema index ranges, nondegenerate facets, paired edges and signed outward orientation independently determine located type/range failures. The helper requires the shell path but permits other validation findings.
 * Whole cube contrasts with simultaneous spellings, too few vertices/faces, ragged/fractional/unknown indices, repeated/degenerate facets, unmatched edges, inward winding and a nonfinite vertex. The parent owns point containment, volume and drawing behavior.
 */
export const assertBuiltSpaceShellTestRefusals: (
  cube: IAutoMovieSpaceShell,
) => void = (cube: IAutoMovieSpaceShell): void => {
  const refuse: (shell: IAutoMovieSpaceShell) => boolean = (
    shell: IAutoMovieSpaceShell,
  ): boolean =>
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
      ["aWholeCubePasses", (): boolean => refuse(cube) === false],
      [
        "bothSpellingsAtOnce",
        (): boolean =>
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
        (): boolean =>
          refuse({
            vertices: cube.vertices.slice(0, 3),
            triangles: [0, 1, 2, 0, 2, 1, 1, 2, 0, 2, 1, 0],
          }),
      ],
      [
        "tooFewTriangles",
        (): boolean =>
          refuse({ ...cube, triangles: cube.triangles.slice(0, 9) }),
      ],
      [
        "aRaggedIndexCount",
        (): boolean => refuse({ ...cube, triangles: [...cube.triangles, 0] }),
      ],
      [
        "anIndexNamingNoVertex",
        (): boolean =>
          refuse({
            ...cube,
            triangles: cube.triangles.map(
              (index: number, at: number): number => (at === 0 ? 99 : index),
            ),
          }),
      ],
      [
        "aFractionalIndex",
        (): boolean =>
          refuse({
            ...cube,
            triangles: cube.triangles.map(
              (index: number, at: number): number => (at === 0 ? 0.5 : index),
            ),
          }),
      ],
      [
        "aDegenerateFacet",
        (): boolean =>
          refuse({
            ...cube,
            triangles: cube.triangles.map(
              (index: number, at: number): number => (at === 1 ? 0 : index),
            ),
          }),
      ],
      [
        "anUnmatchedEdge",
        (): boolean =>
          refuse({ ...cube, triangles: cube.triangles.slice(0, 33) }),
      ],
      [
        "aDoubledFacet",
        (): boolean =>
          refuse({
            ...cube,
            triangles: [...cube.triangles, ...cube.triangles.slice(0, 3)],
          }),
      ],
      [
        "aShellWoundInsideOut",
        (): boolean =>
          refuse(boxShell({ x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 }, false)),
      ],
      [
        "aNonFiniteVertex",
        (): boolean =>
          refuse({
            ...cube,
            vertices: cube.vertices.map(
              (vertex: IAutoMovieVector3, at: number): IAutoMovieVector3 =>
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
