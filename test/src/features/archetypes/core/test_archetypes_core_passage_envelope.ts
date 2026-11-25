import {
  AutoMovieArchetype,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypePassage,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** A coordinate bound of 20 m times sixteen rounding operations. */
const ROUNDING: number = 320 * Number.EPSILON;

/** The unrotated box and starting course heading. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** Unit scale on the carrier and its primitive. */
const SCALE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/** A full-size 2 by 1 by 4 metre box posed at a supplied model-local centre. */
function box(at: IAutoMovieVector3): IAutoMovieModelPart {
  return {
    id: "body",
    name: null,
    geometry: {
      type: "primitive",
      shape: { type: "box", width: 2, height: 1, depth: 4 },
    },
    material: null,
    attachedBone: null,
    transform: { translation: at, rotation: IDENTITY, scale: SCALE },
  };
}

/** A prepared carrier snapshot with its authored box or no portable part. */
function snapshot(
  centre: IAutoMovieVector3,
  parts: IAutoMovieModelPart[],
): AutoMovieArchetype<string, string> {
  return new AutoMovieArchetype({
    archetype: "carrier",
    id: "carrier",
    name: "carrier",
    parts,
    affordances: [],
    materials: [],
    properties: {
      mass: 12,
      centerOfMass: centre,
      inertia: { xx: 17, yy: 20, zz: 5, xy: 0, xz: 0, yz: 0 },
    },
    friction: null,
    kineticFriction: null,
    material: null,
    restitution: null,
    surfaces: {},
    drag: null,
    contact: null,
    fractures: [],
    masses: { body: 12 },
    dimensions: {},
    provenance: { bands: {}, models: {}, figures: {}, units: {} },
    spans: [],
  });
}

/** The carrier translates along X and turns a quarter turn in its last second. */
function state(seconds: number): AutoMovieArchetypeCourse.IState {
  const t: number = Math.min(2, Math.max(0, seconds));
  return {
    distance: 2 * t,
    progress: 2 * t,
    speed: 2,
    curvature: 0,
    reverse: false,
    placement: {
      translation: { x: 8 + 2 * t, y: 2, z: 20 },
      rotation: Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        90 * Math.max(0, t - 1),
      ),
      scale: SCALE,
    },
  };
}

/** A read-only ride over two supplied poses, with no animal or rider planner. */
function ride(
  first: AutoMovieArchetype<string, string>,
  last: AutoMovieArchetype<string, string>,
): AutoMovieArchetypeRide.IRide<string, string> {
  return {
    plan: {
      kind: "plan",
      course: {
        kind: "timed",
        samples: [
          { seconds: 0, x: 8, y: 2, z: 20 },
          { seconds: 2, x: 12, y: 2, z: 20 },
        ],
      },
      duration: 2,
      length: 4,
      peak: 2,
      bends: [],
      instants: [],
      legSpans: [],
      at: state,
      when: (metres: number): number => Math.min(2, Math.max(0, metres / 2)),
    },
    duration: 2,
    instants: [],
    at: (seconds: number): AutoMovieArchetypeRide.ISample<string, string> => {
      const course: AutoMovieArchetypeCourse.IState = state(seconds);
      return {
        archetype: seconds <= 1 ? first : last,
        course,
        placement: course.placement,
      };
    },
    frame: () => {
      throw new Error("this carrier snapshot has no affordance");
    },
  };
}

/** Whether the footprint has precisely the four independently derived corners. */
function corners(
  footprint: AutoMovieArchetypePassage.IFootprint,
  expected: readonly IAutoMovieVector3[],
): boolean {
  return (
    footprint.radius === 0 &&
    footprint.outline.length === expected.length &&
    expected.every((corner: IAutoMovieVector3): boolean =>
      footprint.outline.some((point: IAutoMovieVector3): boolean =>
        vclose(point, corner, ROUNDING),
      ),
    )
  );
}

/**
 * A passage encloses the posed carrier and its carried points in the
 * carrier's own frame.
 *
 * Scenarios:
 *
 * 1. The carrier's last pose moves its box by -1 m along X and +1 m along Z
 *    in its own frame. The bare rectangle contains both poses.
 * 2. One carried point extends the first pose's positive X and negative Z
 *    edges. Another extends the positive Z edge after the quarter turn. The
 *    negative X edge still comes from the posed carrier.
 * 3. A window containing no portable part or carried point refuses.
 */
export function test_archetypes_core_passage_envelope(): void {
  const first: IAutoMovieVector3 = { x: 0, y: 0.5, z: 0 };
  const last: IAutoMovieVector3 = { x: -1, y: 0.5, z: 1 };
  const carrier: AutoMovieArchetypeRide.IRide<string, string> = ride(
    snapshot(first, [box(first)]),
    snapshot(last, [box(last)]),
  );
  TestValidator.predicate(
    "the union includes both box poses in the carrier frame",
    corners(AutoMovieArchetypePassage.envelope(carrier, 1, 2, 1), [
      { x: -2, y: 0, z: -2 },
      { x: 1, y: 0, z: -2 },
      { x: 1, y: 0, z: 3 },
      { x: -2, y: 0, z: 3 },
    ]),
  );
  TestValidator.predicate(
    "the world points extend the rectangle while it keeps the carrier edge",
    corners(
      AutoMovieArchetypePassage.envelope(
        carrier,
        1,
        2,
        1,
        (seconds: number): IAutoMovieVector3[] => [
          seconds === 1 ? { x: 12, y: 5, z: 17 } : { x: 16, y: 5, z: 20 },
        ],
      ),
      [
        { x: -2, y: 0, z: -3 },
        { x: 2, y: 0, z: -3 },
        { x: 2, y: 0, z: 4 },
        { x: -2, y: 0, z: 4 },
      ],
    ),
  );

  const empty: AutoMovieArchetype<string, string> = snapshot(first, []);
  let refusal: AutoMovieArchetypeRefusal | undefined;
  try {
    AutoMovieArchetypePassage.envelope(ride(empty, empty), 1, 2, 1);
  } catch (error: unknown) {
    if (error instanceof AutoMovieArchetypeRefusal) refusal = error;
    else throw error;
  }
  TestValidator.predicate(
    "a ride window without a portable extent refuses on the ride",
    refusal?.axis === "ride",
  );
}
