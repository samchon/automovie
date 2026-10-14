import {
  assertAutoMovieAnalysisSolids,
  autoMovieSolidBlocks,
  validateAutoMovieEnvironmentContext,
} from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContext,
  IAutoMovieHalfSpacePlane,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { boxSolid } from "./analysisFixtures";
import { hasViolation, namedFacts, throwsError } from "./predicates";

/** Execute the next ordered assertions of test_analysis_environment_context.
 *
 * Scenarios:
 * 1. a sun under the horizon may not declare a beam, and the same sun without one may.
 * 2. no context id may collide with a building-owned id.
 * 3. an occluder that bounds nothing is refused, and the assertion form throws.
 * 4. the slab test answers hand geometry on every side of the interval.
 *
 * A positive sun-up dot product permits a beam and a nonpositive one does not; independently authored reserved ids define ownership collisions. Unit-box inequalities determine inside/ahead/behind, parallel, tangent and finite-distance ray outcomes. Plane-field checks establish numeric admission, not nonempty bounded closure of every arbitrary plane set.
 * Below-horizon beam/no beam and above-horizon beam separate the horizon rule. Context/instant/occluder collisions, too few planes, zero normals and nonfinite offsets contrast with the valid box; ray starts and distance boundaries separate clipping decisions. Part3 owns scaled normals and sampling.
 */
export function assertAnalysisEnvironmentContextPart2(
  context: IAutoMovieEnvironmentContext,
  neighbour: { id: string; planes: IAutoMovieHalfSpacePlane[] },
  occluded: IAutoMovieEnvironmentContext,
  broken: (
    overrides: Partial<IAutoMovieEnvironmentContext>,
  ) => ReturnType<typeof validateAutoMovieEnvironmentContext>,
  instantOf: (
    index: number,
    patch: Partial<IAutoMovieEnvironmentContext["instants"][number]>,
  ) => IAutoMovieEnvironmentContext["instants"],
): {
  cube: { id: string; planes: IAutoMovieHalfSpacePlane[] };
  rising: IAutoMovieVector3;
} {
  TestValidator.equals(
    "a sun under the horizon may not declare a beam, and the same sun without one may",
    {
      beamBelow: hasViolation(
        broken({
          instants: instantOf(2, { directNormalIlluminance: 700 }),
        }),
        "range",
        "instants[2].directNormalIlluminance",
      ),
      // The night instant already declares a sun below the horizon and no beam;
      // it is the negative twin of the case above and must stay clean.
      darkBelow: validateAutoMovieEnvironmentContext({ context }).success,
      // A zero ground direction must report itself rather than produce a second
      // complaint about the beam that reads it.
      unusableGround: hasViolation(
        broken({
          ground: { up: { x: 0, y: 0, z: 0 }, elevation: 0 },
          instants: instantOf(2, { directNormalIlluminance: 700 }),
        }),
        "range",
        "instants[2].directNormalIlluminance",
      ),
    },
    { beamBelow: true, darkBelow: true, unusableGround: false },
  );

  TestValidator.equals(
    "no context id may collide with a building-owned id",
    {
      site: hasViolation(
        validateAutoMovieEnvironmentContext({
          context,
          reserved: ["site"],
        }),
        "type",
        "$input.id",
      ),
      instant: hasViolation(
        validateAutoMovieEnvironmentContext({
          context,
          reserved: ["noon"],
        }),
        "type",
        "instants[0].id",
      ),
      occluder: hasViolation(
        validateAutoMovieEnvironmentContext({
          context: occluded,
          reserved: ["neighbour"],
        }),
        "type",
        "occluders[0].id",
      ),
      unrelated: validateAutoMovieEnvironmentContext({
        context: occluded,
        reserved: ["tower/hall-wall", "space:tower/hall"],
      }).success,
    },
    { site: true, instant: true, occluder: true, unrelated: true },
  );

  TestValidator.equals(
    "an occluder that bounds nothing is refused, and the assertion form throws",
    namedFacts([
      [
        "blank occluder id",
        (): boolean =>
          hasViolation(
            broken({
              occluders: [{ id: " ", kind: "mass", planes: neighbour.planes }],
            }),
            "type",
            "occluders[0].id",
          ),
      ],
      [
        "blank occluder kind",
        (): boolean =>
          hasViolation(
            broken({
              occluders: [{ id: "a", kind: "", planes: neighbour.planes }],
            }),
            "type",
            "occluders[0].kind",
          ),
      ],
      [
        "duplicate occluder id",
        (): boolean =>
          hasViolation(
            broken({
              occluders: [
                { id: "a", kind: "mass", planes: neighbour.planes },
                { id: "a", kind: "mass", planes: neighbour.planes },
              ],
            }),
            "type",
            "occluders[1].id",
          ),
      ],
      [
        "three half-spaces",
        (): boolean =>
          hasViolation(
            broken({
              occluders: [
                {
                  id: "a",
                  kind: "mass",
                  planes: neighbour.planes.slice(0, 3),
                },
              ],
            }),
            "range",
            "occluders[0].planes",
          ),
      ],
      [
        "zero plane normal",
        (): boolean =>
          hasViolation(
            broken({
              occluders: [
                {
                  id: "a",
                  kind: "mass",
                  planes: [
                    { normal: { x: 0, y: 0, z: 0 }, offset: 1 },
                    ...neighbour.planes.slice(1),
                  ],
                },
              ],
            }),
            "range",
            "occluders[0].planes[0]",
          ),
      ],
      [
        "non-finite plane offset",
        (): boolean =>
          hasViolation(
            broken({
              occluders: [
                {
                  id: "a",
                  kind: "mass",
                  planes: [
                    { normal: { x: 1, y: 0, z: 0 }, offset: Number.NaN },
                    ...neighbour.planes.slice(1),
                  ],
                },
              ],
            }),
            "range",
            "occluders[0].planes[0].offset",
          ),
      ],
      [
        "assertion accepts the declared mass",
        (): true => {
          assertAutoMovieAnalysisSolids([neighbour], "shading solid");
          return true;
        },
      ],
      [
        "assertion refuses a blank id",
        (): boolean =>
          throwsError(
            (): void =>
              assertAutoMovieAnalysisSolids(
                [{ ...neighbour, id: "" }],
                "shading solid",
              ),
            "non-blank id",
          ),
      ],
      [
        "assertion refuses a duplicate id",
        (): boolean =>
          throwsError(
            (): void =>
              assertAutoMovieAnalysisSolids(
                [neighbour, neighbour],
                "shading solid",
              ),
            "declared twice",
          ),
      ],
      [
        "assertion refuses a malformed plane",
        (): boolean =>
          throwsError(
            (): void =>
              assertAutoMovieAnalysisSolids(
                [
                  {
                    id: "flat",
                    planes: [{ normal: { x: 0, y: 0, z: 0 }, offset: 0 }],
                  },
                ],
                "shading solid",
              ),
            "is malformed at",
          ),
      ],
    ]),
    {
      "blank occluder id": true,
      "blank occluder kind": true,
      "duplicate occluder id": true,
      "three half-spaces": true,
      "zero plane normal": true,
      "non-finite plane offset": true,
      "assertion accepts the declared mass": true,
      "assertion refuses a blank id": true,
      "assertion refuses a duplicate id": true,
      "assertion refuses a malformed plane": true,
    },
  );

  // A unit cube from (0,0,0) to (1,1,1), read from points whose relationship to
  // it is decided by hand rather than by running the routine.
  const cube: { id: string; planes: IAutoMovieHalfSpacePlane[] } = boxSolid(
    "cube",
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1 },
  );
  const shoot: (
    origin: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    maxDistance?: number,
  ) => boolean = (
    origin: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    maxDistance: number = Infinity,
  ): boolean =>
    autoMovieSolidBlocks({
      origin,
      direction,
      planes: cube.planes,
      maxDistance,
    });
  TestValidator.equals(
    "the slab test answers hand geometry on every side of the interval",
    {
      inside: shoot({ x: 0.5, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }),
      ahead: shoot({ x: -1, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }),
      behind: shoot({ x: -1, y: 0.5, z: 0.5 }, { x: -1, y: 0, z: 0 }),
      parallelOutside: shoot({ x: 0.5, y: 2, z: 0.5 }, { x: 1, y: 0, z: 0 }),
      parallelInside: shoot({ x: -1, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }),
      // The near face sits at t = 1 and the ray is only half that long.
      tooShort: shoot({ x: -1, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 0.5),
      // Exactly long enough to touch the near face.
      justLongEnough: shoot({ x: -1, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 1),
      // Leaves the box exactly at the origin: an exit parameter of zero is not
      // an obstruction.
      tangentAtOrigin: shoot({ x: 1, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }),
      diagonalMiss: shoot({ x: -1, y: -1, z: 0.5 }, { x: 0, y: 1, z: 0 }),
    },
    {
      inside: true,
      ahead: true,
      behind: false,
      parallelOutside: false,
      parallelInside: true,
      tooShort: false,
      justLongEnough: true,
      tangentAtOrigin: false,
      diagonalMiss: false,
    },
  );

  // A slab from z = 1e-12 m upward, bounded to a 20 m box, whose floor plane is
  // written once with a unit normal and once with the same normal scaled to
  // 1e-6. A ray from the origin rising at a slope of 1e-9 crosses that floor
  // 1 mm away, so both spellings of the same solid must block it.
  const rising: IAutoMovieVector3 = { x: 1, y: 0, z: 1e-9 };
  return { cube, rising };
}
