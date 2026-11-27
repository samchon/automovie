import { AutoMovieEngineDefaultSubjectHeight, AutoMovieEngineFilm } from "@automovie/engine";
import {
  IAutoMovieCompiledFormation,
  IAutoMovieFormationMotion,
  type IAutoMovieResolvedCamera,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, vclose } from "../../internal/predicates";

/** A line 100 m across and 20 m deep, with a half-metre member radius. */
const UNIT: IAutoMovieCompiledFormation = {
  version: 1,
  id: "line",
  count: 2_000,
  anonymousCount: 2_000,
  model: "member",
  layout: {
    kind: "line",
    ranks: 20,
    files: 100,
    spacing: { lateral: 1, depth: 1 },
  },
  anchor: { x: 0, y: 0, z: 0 },
  ground: [],
  facingDeg: 0,
  seed: 1,
  bounds: { min: { x: -50, y: 0, z: 0 }, max: { x: 50, y: 0, z: 20 } },
  centroid: { x: 0, y: 0, z: 10 },
  projectionRadius: 0.5,
  chunks: [],
  heroes: [],
  lod: [],
  phase: { seed: 1 },
  digest: "sha256:line",
};

/**
 * One member, measured rather than assumed.
 *
 * Deliberately unlike the stand-in {@link formationMemberExtent} falls back to
 * and unlike the flat `y` of the unit's own bounds, so the box below can only
 * carry these two numbers by having read THIS member: a solve that ignored the
 * supplied extent would raise the box to 1.7 or leave it flat, and either shows
 * up as a different number rather than as the same one.
 */
const MEMBER: { min: number; max: number } = { min: 0.2, max: 2.4 };

/** The unit marches 500 m to its right over the first second. */
const MARCH: IAutoMovieFormationMotion[] = [
  {
    id: "march",
    formation: "line",
    action: "advance",
    start: 0,
    end: 1,
    from: {
      translation: { x: 0, y: 0, z: 0 },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
    to: {
      translation: { x: 500, y: 0, z: 0 },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
    easing: "linear",
  },
];

const boxAt: (
  seconds: number,
  motions?: IAutoMovieFormationMotion[],
) => ReturnType<typeof AutoMovieEngineFilm.formationSubjectBox> = (
  seconds: number,
  motions: IAutoMovieFormationMotion[] = [],
): ReturnType<typeof AutoMovieEngineFilm.formationSubjectBox> =>
  AutoMovieEngineFilm.formationSubjectBox({
    formation: UNIT,
    motions,
    member: MEMBER,
    seconds,
  });

const HALF_Y: number = Math.tan((40 * Math.PI) / 360);
const ASPECT: number = 16 / 9;

/** A camera at `position`, looking down world −Z (glTF identity). */
const lens: (position: IAutoMovieVector3) => IAutoMovieResolvedCamera = (
  position: IAutoMovieVector3,
): IAutoMovieResolvedCamera => ({
  position,
  rotation: { x: 0, y: 0, z: 0, w: 1 },
});

const sees: (
  camera: IAutoMovieResolvedCamera,
  box: ReturnType<typeof AutoMovieEngineFilm.formationSubjectBox>,
  far?: number,
) => boolean = (
  camera: IAutoMovieResolvedCamera,
  box: { min: IAutoMovieVector3; max: IAutoMovieVector3 },
  far: number = 200,
): boolean =>
  AutoMovieEngineFilm.intersectsPerspectiveFrustumBox({
    camera,
    min: box.min,
    max: box.max,
    near: 0.1,
    far,
    halfY: HALF_Y,
    aspect: ASPECT,
  });

/** The old check: a 1.7 m segment standing at the unit's centroid. */
const seesCentroid: (
  camera: IAutoMovieResolvedCamera,
  far?: number,
) => boolean = (camera: IAutoMovieResolvedCamera, far: number = 200): boolean =>
  AutoMovieEngineFilm.intersectsPerspectiveFrustumSegment({
    camera,
    from: UNIT.centroid,
    to: {
      x: UNIT.centroid.x,
      y: UNIT.centroid.y + AutoMovieEngineDefaultSubjectHeight,
      z: UNIT.centroid.z,
    },
    near: 0.1,
    far,
    halfY: HALF_Y,
    aspect: ASPECT,
  });

/**
 * A formation is a subject with an extent: the box its members occupy, taken
 * from the unit's own transformed bounds, and judged for readability as that
 * box rather than as a segment at its centroid.
 *
 * A compiled formation stores where its members STAND, so its bounds are a
 * footprint: flat, and one member's body-width narrower than the unit really
 * is. The member's own extent supplies the height and the builder's projection
 * radius the overhang, which is why the box below is `[-50.5, 50.5] × [0.2,
 * 2.4] × [-0.5, 20.5]` for a line designed `[-50, 50] × [0, 20]` whose member
 * occupies `[0.2, 2.4]`.
 *
 * The readability consequence is the reason this matters. A hundred-meter line
 * cannot be inside a frame the way a person is; it reads when the frame holds
 * any part of it. The old segment answered for one point, so it called a unit
 * absent whenever the shot framed a flank, and the fix must find the flank
 * without merely calling everything readable.
 *
 * Scenarios:
 *
 * 1. The box is the transformed bounds, padded by a member's radius and raised by
 *    a member's height; reduced for the solve it gives the unit's bottom
 *    centre, its member height, and half its horizontal diagonal.
 * 2. A member with no supplied model takes the documented stand-in height, so a
 *    unit is never framed as a flat carpet.
 * 3. A camera aimed at the line's right flank reads the unit, while the segment at
 *    its centroid — 45 m off the lens axis — reports it absent. That gap IS the
 *    defect.
 * 4. A camera standing inside the line, seeing nothing but members, reads it too:
 *    the short frustum intersects the box while the centroid segment does not.
 * 5. A camera pointed away from the unit still reads nothing, so widening the test
 *    did not make a formation unconditionally present.
 * 6. A cue moves the box: the unit that marched 500 m to its right is no longer
 *    read by the camera that framed it at rest, because the box is measured
 *    under the cue playing at that instant.
 * 7. A group's box is the union of what its members occupy, so a node standing
 *    behind the line widens the same subject.
 */
export function test_engine_film_camera_formation_subject_extent(): void {
  const rest: ReturnType<typeof AutoMovieEngineFilm.formationSubjectBox> = boxAt(0);
  TestValidator.equals(
    "the box is the unit's transformed bounds, padded and raised",
    namedFacts([
      // The unit's bounds are level at `y` of 0, so every vertical number below
      // is the member's own extent and nothing else could have supplied it.
      [
        "min",
        (): boolean => vclose(rest.min, { x: -50.5, y: MEMBER.min, z: -0.5 }),
      ],
      [
        "max",
        (): boolean => vclose(rest.max, { x: 50.5, y: MEMBER.max, z: 20.5 }),
      ],
      [
        "base",
        (): boolean =>
          vclose(AutoMovieEngineFilm.framedBoxOf(rest).base, { x: 0, y: MEMBER.min, z: 10 }),
      ],
      [
        "height",
        (): boolean =>
          nclose(AutoMovieEngineFilm.framedBoxOf(rest).height, MEMBER.max - MEMBER.min),
      ],
      [
        "radius",
        (): boolean =>
          nclose(AutoMovieEngineFilm.framedBoxOf(rest).radius, Math.hypot(101, 21) / 2),
      ],
    ]),
    { min: true, max: true, base: true, height: true, radius: true },
  );

  const fallback: ReturnType<typeof AutoMovieEngineFilm.formationMemberExtent> =
    AutoMovieEngineFilm.formationMemberExtent(UNIT, []);
  // The whole extent is compared, so any field beside the two bounds is a
  // difference: the stand-in stands from the ground to its documented height.
  TestValidator.equals(
    "an unsupplied member model takes the documented stand-in height",
    fallback,
    { min: 0, max: AutoMovieEngineDefaultSubjectHeight },
  );

  TestValidator.equals(
    "the frame that holds a flank reads the unit the centroid cannot",
    namedFacts([
      ["theUnitReads", (): boolean => sees(lens({ x: 45, y: 1, z: 30 }), rest)],
      [
        "theCentroidDoesNot",
        (): boolean => seesCentroid(lens({ x: 45, y: 1, z: 30 })),
      ],
    ]),
    { theUnitReads: true, theCentroidDoesNot: false },
  );

  TestValidator.equals(
    "a camera standing inside the unit reads it",
    namedFacts([
      [
        "theUnitReads",
        (): boolean => sees(lens({ x: 0, y: 0.85, z: 10 }), rest, 5),
      ],
      [
        "theCentroidDoesNot",
        (): boolean => seesCentroid(lens({ x: 0, y: 0.85, z: 10 }), 5),
      ],
    ]),
    { theUnitReads: true, theCentroidDoesNot: false },
  );

  TestValidator.predicate(
    "a camera pointed away from the unit reads nothing",
    sees(lens({ x: 0, y: 1, z: -100 }), rest) === false,
  );

  const marched: ReturnType<typeof AutoMovieEngineFilm.formationSubjectBox> = boxAt(1, MARCH);
  TestValidator.equals(
    "a cue moves the box the camera is graded against",
    namedFacts([
      ["marched", (): boolean => nclose(marched.min.x, rest.min.x + 500)],
      ["heldItsDepth", (): boolean => nclose(marched.max.z, rest.max.z)],
      ["atRestItReads", (): boolean => sees(lens({ x: 0, y: 1, z: 60 }), rest)],
      [
        "marchedItDoesNot",
        (): boolean => sees(lens({ x: 0, y: 1, z: 60 }), marched),
      ],
    ]),
    {
      marched: true,
      heldItsDepth: true,
      atRestItReads: true,
      marchedItDoesNot: false,
    },
  );

  const withScout: ReturnType<typeof AutoMovieEngineFilm.unionSubjectBoxes> = AutoMovieEngineFilm.unionSubjectBoxes([
    rest,
    AutoMovieEngineFilm.pointSubjectBox({ x: 0, y: 0, z: -30 }, MEMBER),
  ]);
  TestValidator.equals(
    "a group's box is the union of what its members occupy",
    namedFacts([
      ["union", (): boolean => withScout !== null],
      ["reachedTheScout", (): boolean => nclose(withScout!.min.z, -30)],
      ["keptTheLine", (): boolean => nclose(withScout!.max.x, 50.5)],
      [
        "widerThanTheLineAlone",
        (): boolean =>
          AutoMovieEngineFilm.framedBoxOf(withScout!).radius > AutoMovieEngineFilm.framedBoxOf(rest).radius,
      ],
    ]),
    {
      union: true,
      reachedTheScout: true,
      keptTheLine: true,
      widerThanTheLineAlone: true,
    },
  );
}
