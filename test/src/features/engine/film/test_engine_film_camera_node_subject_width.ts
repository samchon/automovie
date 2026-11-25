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

import type { IFilmCameraClearanceBox } from "../../internal/IFilmCameraClearanceBox";
import type { IFilmFacadeGrade } from "../../internal/IFilmFacadeGrade";
import { createFilmCameraWidthFixture } from "../../internal/createFilmCameraWidthFixture";
import { createFilmFacadeTransform as transform } from "../../internal/createFilmFacadeTransform";
import { createFilmFacadeYaw as yaw } from "../../internal/createFilmFacadeYaw";
import { namedFacts, nclose, vclose } from "../../internal/predicates";

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
 * The fixture's authored dimensions determine its corners and diagonal. A full
 * framing shows 1.15 extents, giving independently computed vertical and
 * horizontal pinhole fits. Pole-only framing is the negative control.
 *
 * Scenarios:
 *
 * 1. The fixture draws where it claims: the model's rest box runs `x 0…60, y 0…24,
 *    z −1…1`, so every number below is about a 60 m width and a 2 m depth
 *    measured off a 24 m height.
 * 2. Restated for the framing grammar, that box has its base at the middle of the
 *    mass and a radius of half its horizontal diagonal — not a base at the
 *    element origin and a radius of zero.
 * 3. A yawed element is boxed where it stands: a 90° set piece placed at `(100, 0,
 *    5)` fills `x 99…101, z −55…5`, which a vertical segment at a point could
 *    not express at all.
 * 4. The width decides the distance exactly where it demands the further stand.
 *    The measured solve stands at the horizontal fit rather than the smaller
 *    height-only fit, and it aims at the middle of the mass rather than at its
 *    corner.
 * 5. Sampled frustum intersection holds ten-centimetre probes near both ends of
 *    the facade; the height-only camera loses the far probe.
 * 6. Solve and grade agree. The facade reads at every contract sample under the
 *    camera the measured subject produced.
 * 7. The grade moved to where the geometry is rather than merely growing around
 *    the origin: a facade authored entirely away from its element origin is
 *    refused under the camera the height-only solve produced — that camera
 *    delivers a frame with none of the subject in it — and reads under the
 *    measured one.
 * 8. A wall delivered as an ingested mesh rather than as a generated primitive
 *    draws the same box, because the measurement reads vertices either way.
 * 9. Boundaries. A node with nothing to measure keeps the horizontally degenerate
 *    stand-in segment it always had, and a slab too thin to measure vertically
 *    keeps its real width while taking the stand-in height.
 *
 * Every box is compared as a whole record with its coordinates snapped to a
 * micrometre, so a field beside the two corners is a difference.
 */
export function test_engine_film_camera_node_subject_width(): void {
  const model: IAutoMovieModel = facade("facade-model", WIDTH / 2);
  const origin: IAutoMovieTransform = transform(0, 0, 0);
  const extent: ReturnType<typeof computeModelRestExtent> =
    computeModelRestExtent(model);

  // 1. the fixture draws what it claims.
  TestValidator.equals(
    "the fixture draws a sixty metre facade two metres thick",
    extent === null ? null : micrometres(extent),
    FACADE_BOX,
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
    micrometres(yawed),
    {
      min: { x: 100 - DEPTH / 2, y: 0, z: 5 - WIDTH },
      max: { x: 100 + DEPTH / 2, y: HEIGHT, z: 5 },
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
    meshExtent === null ? null : micrometres(meshExtent),
    FACADE_BOX,
  );

  // 9. boundaries: nothing to measure, and nothing vertical to measure.
  const standIn: ReturnType<typeof nodeSubjectExtent> = nodeSubjectExtent(
    null,
    null,
  );
  TestValidator.equals(
    "a node with nothing to measure keeps the degenerate stand-in segment",
    micrometres(standIn),
    { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 1.7, z: 0 } },
  );
  const rigOnly: ReturnType<typeof nodeSubjectExtent> = nodeSubjectExtent(
    null,
    1.9,
  );
  TestValidator.equals(
    "a rig span stands in for a height without inventing a width",
    micrometres(rigOnly),
    { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 1.9, z: 0 } },
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
    micrometres(thin),
    {
      min: { x: 0, y: 4, z: -WIDTH / 2 },
      max: { x: WIDTH, y: 5.7, z: WIDTH / 2 },
    },
  );
}

/** The facade's rest box: `x 0…60, y 0…24, z −1…1`. */
const FACADE_BOX: IFilmCameraClearanceBox = {
  min: { x: 0, y: 0, z: -DEPTH / 2 },
  max: { x: WIDTH, y: HEIGHT, z: DEPTH / 2 },
};

/**
 * The box with every coordinate snapped to a micrometre, keeping every field
 * the box and its corners carry, so a whole-record comparison still sees any
 * field beside the two corners while tolerating rotation round-off.
 */
function micrometres(box: IFilmCameraClearanceBox): IFilmCameraClearanceBox {
  return { ...box, min: snap(box.min), max: snap(box.max) };
}

/** One corner snapped to a micrometre, keeping every field it carries. */
function snap(corner: IAutoMovieVector3): IAutoMovieVector3 {
  return {
    ...corner,
    x: Math.round(corner.x * 1e6) / 1e6,
    y: Math.round(corner.y * 1e6) / 1e6,
    z: Math.round(corner.z * 1e6) / 1e6,
  };
}
