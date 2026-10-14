import {
  computeModelRestExtent,
  framedBoxOf,
  nodeSubjectExtent,
} from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieModel,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmCameraClearanceBox } from "../internal/IFilmCameraClearanceBox";
import type { IFilmFacadeGrade } from "../internal/IFilmFacadeGrade";
import { createFilmCameraWidthFixture } from "../internal/createFilmCameraWidthFixture";
import { createFilmFacadeTransform as transform } from "../internal/createFilmFacadeTransform";
import { createFilmFacadeYaw as yaw } from "../internal/createFilmFacadeYaw";
import { performFilmFacade } from "../internal/performFilmFacade";
import { namedFacts, nclose, vclose } from "../internal/predicates";

const NODE: string = "civic/west-facade";

/** The facade runs 60 m along +X, stands 24 m, and is 2 m thick. */
const WIDTH: number = 60;
const HEIGHT: number = 24;
const DEPTH: number = 2;

const FOV_Y: number = 40;
const ASPECT: number = 16 / 9;
const HALF_Y: number = Math.tan(((FOV_Y / 2) * Math.PI) / 180);
const HALF_X: number = HALF_Y * ASPECT;

const {
  facade,
  meshFacade,
  worldBox,
  solve,
  grade,
  framesPoint,
  solvedDistance,
}: ReturnType<typeof createFilmCameraWidthFixture> =
  createFilmCameraWidthFixture({
    node: NODE,
    width: WIDTH,
    height: HEIGHT,
    depth: DEPTH,
    fovY: FOV_Y,
    aspect: ASPECT,
    halfY: HALF_Y,
  });

/**
 * A required node subject is framed and graded on the width its geometry
 * actually fills, at the place that geometry actually stands.
 *
 * The fixture's authored dimensions determine its corners and diagonal. A
 * full framing shows 1.15 extents, giving independently computed vertical and
 * horizontal pinhole fits. Pole-only framing is the negative control; the
 * real performShot consumer is also exercised through performFilmFacade.
 *
 * Scenarios:
 *
 * 1. The fixture draws where it claims: the model's rest box runs
 *    `x 0…60, y 0…24, z −1…1`, so every number below is about a 60 m width and
 *    a 2 m depth measured off a 24 m height.
 * 2. Restated for the framing grammar, that box has its base at the middle of
 *    the mass and a radius of half its horizontal diagonal — not a base at the
 *    element origin and a radius of zero.
 * 3. A yawed element is boxed where it stands: a 90° set piece placed at
 *    `(100, 0, 5)` fills `x 99…101, z −55…5`, which a vertical segment at a
 *    point could not express at all.
 * 4. The width decides the distance exactly where it demands the further stand.
 *    The measured solve stands at the horizontal fit rather than the smaller
 *    height-only fit, and it aims at the middle of the mass
 *    rather than at its corner.
 * 5. Sampled frustum intersection holds ten-centimetre probes near both ends
 *    of the facade; the height-only camera loses the far probe.
 * 6. Solve and grade agree. The facade reads at every contract sample under the
 *    camera the measured subject produced.
 * 7. The grade moved to where the geometry is rather than merely growing around
 *    the origin: a facade authored entirely away from its element origin is
 *    refused under the camera the height-only solve produced — that camera
 *    delivers a frame with none of the subject in it — and reads under the
 *    measured one.
 * 8. A wall delivered as an ingested mesh rather than as a generated primitive
 *    draws the same box, because the measurement reads vertices either way.
 * 9. `performShot` itself resolves the subject on those terms, so what is
 *    pinned is the builder's own reading rather than one rebuilt beside it.
 * 10. Boundaries. A node with nothing to measure keeps the horizontally
 *    degenerate stand-in segment it always had, and a slab too thin to measure
 *    vertically keeps its real width while taking the stand-in height.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures primitive and mesh bounds, boxes a yawed node, compiles measured and pole-only cameras, grades required-subject readability, and calls performShot through the existing facade fixture.
 * @evidence contracts/testing.md#independent-expectations Authored 60-by-24-by-2 metre dimensions fix the expected corners and half diagonal; literal full-framing fractions 1.15 and 0.5 determine independent pinhole distance and aim oracles. Fixed end probes and a remote facade distinguish the resulting views.
 * @evidence contracts/testing.md#distinguishing-cases Width must increase the solved distance beyond the height-only fit and preserve the far probe. Quarter-turn placement, an off-origin facade, mesh representation, missing geometry, rig-only height, and a thin slab distinguish transforms, measurement, and fallback policies.
 * @evidence contracts/testing.md#execution-ownership Runs synchronous engine compilation, staging, and numerical grading on local records. The facade helper injects the existing synthesizer fixture through the product seam; no renderer, filesystem, clock, or dependency replacement is involved, and sampled probe intersection establishes neither full enclosure nor rendered pixels.
 */
export function test_film_camera_node_subject_width(): void {
  const model: IAutoMovieModel = facade("facade-model", WIDTH / 2);
  const origin: IAutoMovieTransform = transform(0, 0, 0);
  const extent: ReturnType<typeof computeModelRestExtent> =
    computeModelRestExtent(model);

  // 1. the fixture draws what it claims.
  TestValidator.equals(
    "the fixture draws a sixty metre facade two metres thick",
    {
      present: extent !== null,
      keys:
        extent === null
          ? []
          : Object.keys(extent).sort((a: string, b: string): number =>
              a < b ? -1 : a > b ? 1 : 0,
            ),
      minKeys:
        extent === null
          ? []
          : Object.keys(extent.min).sort((a: string, b: string): number =>
              a < b ? -1 : a > b ? 1 : 0,
            ),
      maxKeys:
        extent === null
          ? []
          : Object.keys(extent.max).sort((a: string, b: string): number =>
              a < b ? -1 : a > b ? 1 : 0,
            ),
      min: extent !== null && vclose(extent.min, { x: 0, y: 0, z: -DEPTH / 2 }),
      max:
        extent !== null &&
        vclose(extent.max, { x: WIDTH, y: HEIGHT, z: DEPTH / 2 }),
    },
    {
      present: true,
      keys: ["max", "min"],
      minKeys: ["x", "y", "z"],
      maxKeys: ["x", "y", "z"],
      min: true,
      max: true,
    },
  );

  // 2. restated for the framing grammar.
  const measured: ReturnType<typeof framedBoxOf> = framedBoxOf(
    worldBox(model, origin),
  );
  const RADIUS: number = Math.hypot(WIDTH, DEPTH) / 2;
  TestValidator.equals(
    "the framed box centres on the mass and carries its half diagonal",
    namedFacts([
      [
        "baseAtTheMiddleOfTheMass",
        (): boolean => vclose(measured.base, { x: WIDTH / 2, y: 0, z: 0 }),
      ],
      ["heightUnchanged", (): boolean => nclose(measured.height, HEIGHT)],
      [
        "radiusIsHalfTheHorizontalDiagonal",
        (): boolean => nclose(measured.radius, RADIUS),
      ],
      [
        "andTheOldReadWasThirtyMetresOff",
        (): boolean => nclose(measured.base.x, 30),
      ],
    ]),
    {
      baseAtTheMiddleOfTheMass: true,
      heightUnchanged: true,
      radiusIsHalfTheHorizontalDiagonal: true,
      andTheOldReadWasThirtyMetresOff: true,
    },
  );

  // 3. a yawed element is boxed where it stands.
  const yawed: IFilmCameraClearanceBox = worldBox(
    model,
    transform(100, 0, 5, yaw(90)),
  );
  TestValidator.equals(
    "a quarter-turned set piece fills the footprint its yaw gives it",
    {
      keys: Object.keys(yawed).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      minKeys: Object.keys(yawed.min).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      maxKeys: Object.keys(yawed.max).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      min: vclose(yawed.min, { x: 100 - DEPTH / 2, y: 0, z: 5 - WIDTH }, 1e-6),
      max: vclose(yawed.max, { x: 100 + DEPTH / 2, y: HEIGHT, z: 5 }, 1e-6),
    },
    {
      keys: ["max", "min"],
      minKeys: ["x", "y", "z"],
      maxKeys: ["x", "y", "z"],
      min: true,
      max: true,
    },
  );

  // 4. the width decides the distance, and the aim moves to the mass.
  const measuredMove: IAutoMovieClip = solve(measured);
  const poleMove: IAutoMovieClip = solve({
    base: { x: 0, y: 0, z: 0 },
    height: HEIGHT,
  });
  const AIM_FRACTION_FULL: number = 0.5;
  const measuredAim: IAutoMovieVector3 = {
    x: WIDTH / 2,
    y: HEIGHT * AIM_FRACTION_FULL,
    z: 0,
  };
  const poleAim: IAutoMovieVector3 = {
    x: 0,
    y: HEIGHT * AIM_FRACTION_FULL,
    z: 0,
  };
  const verticalFit: number = (HEIGHT * 1.15) / 2 / HALF_Y;
  const horizontalFit: number = (RADIUS * 2 * 1.15) / 2 / HALF_X;
  TestValidator.equals(
    "the measured solve stands at the horizontal fit and the pole at the vertical one",
    namedFacts([
      ["horizontalIsTheFurther", (): boolean => horizontalFit > verticalFit],
      [
        "measuredStandsAtTheHorizontalFit",
        (): boolean =>
          nclose(
            solvedDistance(measuredMove, measuredAim),
            horizontalFit,
            1e-6,
          ),
      ],
      [
        "poleStandsAtTheVerticalFit",
        (): boolean =>
          nclose(solvedDistance(poleMove, poleAim), verticalFit, 1e-6),
      ],
    ]),
    {
      horizontalIsTheFurther: true,
      measuredStandsAtTheHorizontalFit: true,
      poleStandsAtTheVerticalFit: true,
    },
  );

  // 5. the delivered frame is the difference.
  const nearEnd: IAutoMovieVector3 = { x: 0.5, y: HEIGHT / 2, z: 0 };
  const farEnd: IAutoMovieVector3 = { x: WIDTH - 0.5, y: HEIGHT / 2, z: 0 };
  TestValidator.equals(
    "the measured camera holds both ends and the height-only camera loses the far one",
    namedFacts([
      [
        "measuredHoldsTheNearEnd",
        (): boolean => framesPoint(measuredMove, nearEnd),
      ],
      [
        "measuredHoldsTheFarEnd",
        (): boolean => framesPoint(measuredMove, farEnd),
      ],
      ["poleHoldsTheNearEnd", (): boolean => framesPoint(poleMove, nearEnd)],
      [
        "poleLosesTheFarEnd",
        (): boolean => framesPoint(poleMove, farEnd) === false,
      ],
    ]),
    {
      measuredHoldsTheNearEnd: true,
      measuredHoldsTheFarEnd: true,
      poleHoldsTheNearEnd: true,
      poleLosesTheFarEnd: true,
    },
  );

  // 6. solve and grade agree on the subject that was framed.
  const graded: IFilmFacadeGrade = grade(model, origin, measuredMove);
  TestValidator.equals(
    "the facade reads at every contract sample under the camera solved for it",
    namedFacts([
      [
        "readEverySample",
        (): boolean =>
          graded.readable.every((count: number): boolean => count === 1),
      ],
      ["sampledThrice", (): boolean => graded.readable.length === 3],
      ["notRefused", (): boolean => graded.refused === false],
    ]),
    { readEverySample: true, sampledThrice: true, notRefused: true },
  );

  // 7. the grade follows the geometry rather than growing around the origin.
  const remote: IAutoMovieModel = facade("remote-facade-model", 100);
  const remoteMeasured: ReturnType<typeof framedBoxOf> = framedBoxOf(
    worldBox(remote, origin),
  );
  const remotePole: IFilmFacadeGrade = grade(
    remote,
    origin,
    solve({ base: { x: 0, y: 0, z: 0 }, height: HEIGHT }),
  );
  const remoteSolved: IFilmFacadeGrade = grade(
    remote,
    origin,
    solve(remoteMeasured),
  );
  TestValidator.equals(
    "a facade built away from its origin is refused where it is not, and reads where it is",
    namedFacts([
      [
        "drawnAwayFromTheOrigin",
        (): boolean => nclose(remoteMeasured.base.x, 100),
      ],
      [
        "poleReadsAtNoSample",
        (): boolean =>
          remotePole.readable.every((c: number): boolean => c === 0),
      ],
      ["poleIsRefused", (): boolean => remotePole.refused],
      [
        "measuredReadsEverySample",
        (): boolean =>
          remoteSolved.readable.every((c: number): boolean => c === 1),
      ],
      ["measuredIsNotRefused", (): boolean => remoteSolved.refused === false],
    ]),
    {
      drawnAwayFromTheOrigin: true,
      poleReadsAtNoSample: true,
      poleIsRefused: true,
      measuredReadsEverySample: true,
      measuredIsNotRefused: true,
    },
  );

  // 8. an ingested mesh is measured on the same terms as a generated primitive.
  const meshExtent: ReturnType<typeof computeModelRestExtent> =
    computeModelRestExtent(meshFacade("mesh-facade-model", WIDTH / 2));
  TestValidator.equals(
    "a mesh wall draws the same box its primitive twin does",
    {
      present: meshExtent !== null,
      keys:
        meshExtent === null
          ? []
          : Object.keys(meshExtent).sort((a: string, b: string): number =>
              a < b ? -1 : a > b ? 1 : 0,
            ),
      minKeys:
        meshExtent === null
          ? []
          : Object.keys(meshExtent.min).sort((a: string, b: string): number =>
              a < b ? -1 : a > b ? 1 : 0,
            ),
      maxKeys:
        meshExtent === null
          ? []
          : Object.keys(meshExtent.max).sort((a: string, b: string): number =>
              a < b ? -1 : a > b ? 1 : 0,
            ),
      min:
        meshExtent !== null &&
        vclose(meshExtent.min, { x: 0, y: 0, z: -DEPTH / 2 }),
      max:
        meshExtent !== null &&
        vclose(meshExtent.max, { x: WIDTH, y: HEIGHT, z: DEPTH / 2 }),
    },
    {
      present: true,
      keys: ["max", "min"],
      minKeys: ["x", "y", "z"],
      maxKeys: ["x", "y", "z"],
      min: true,
      max: true,
    },
  );

  // 9. the shot builder itself resolves the subject that way.
  const performed: ReturnType<typeof performFilmFacade> = performFilmFacade(
    model,
    FOV_Y,
  );
  TestValidator.equals(
    "performShot frames a set piece from the box it draws",
    namedFacts([
      ["performs", (): boolean => performed !== null],
      [
        "standsAtTheHorizontalFit",
        (): boolean =>
          performed !== null &&
          nclose(solvedDistance(performed, measuredAim), horizontalFit, 1e-6),
      ],
      [
        "holdsTheFarEnd",
        (): boolean => performed !== null && framesPoint(performed, farEnd),
      ],
    ]),
    { performs: true, standsAtTheHorizontalFit: true, holdsTheFarEnd: true },
  );

  // 10. boundaries: nothing to measure, and nothing vertical to measure.
  const standIn: ReturnType<typeof nodeSubjectExtent> = nodeSubjectExtent(
    null,
    null,
  );
  TestValidator.equals(
    "a node with nothing to measure keeps the degenerate stand-in segment",
    {
      keys: Object.keys(standIn).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      minKeys: Object.keys(standIn.min).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      maxKeys: Object.keys(standIn.max).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      min: vclose(standIn.min, { x: 0, y: 0, z: 0 }),
      max: vclose(standIn.max, { x: 0, y: 1.7, z: 0 }),
    },
    {
      keys: ["max", "min"],
      minKeys: ["x", "y", "z"],
      maxKeys: ["x", "y", "z"],
      min: true,
      max: true,
    },
  );
  const rigOnly: ReturnType<typeof nodeSubjectExtent> = nodeSubjectExtent(
    null,
    1.9,
  );
  TestValidator.equals(
    "a rig span stands in for a height without inventing a width",
    {
      keys: Object.keys(rigOnly).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      minKeys: Object.keys(rigOnly.min).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      maxKeys: Object.keys(rigOnly.max).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      min: vclose(rigOnly.min, { x: 0, y: 0, z: 0 }),
      max: vclose(rigOnly.max, { x: 0, y: 1.9, z: 0 }),
    },
    {
      keys: ["max", "min"],
      minKeys: ["x", "y", "z"],
      maxKeys: ["x", "y", "z"],
      min: true,
      max: true,
    },
  );
  const thin: ReturnType<typeof nodeSubjectExtent> = nodeSubjectExtent(
    {
      min: { x: 0, y: 4, z: -WIDTH / 2 },
      max: { x: WIDTH, y: 4.02, z: WIDTH / 2 },
    },
    null,
  );
  TestValidator.equals(
    "a slab too thin to measure vertically keeps the width it draws",
    {
      keys: Object.keys(thin).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      minKeys: Object.keys(thin.min).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      maxKeys: Object.keys(thin.max).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      min: vclose(thin.min, { x: 0, y: 4, z: -WIDTH / 2 }),
      max: vclose(thin.max, { x: WIDTH, y: 5.7, z: WIDTH / 2 }),
    },
    {
      keys: ["max", "min"],
      minKeys: ["x", "y", "z"],
      maxKeys: ["x", "y", "z"],
      min: true,
      max: true,
    },
  );
}
