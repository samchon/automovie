import {
  Quaternion,
  AutoMoviePhysicalHullFaces,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMoviePhysicalMaterial,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeBounds,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPerformanceRead } from "../HumanPerformanceRead";

/**
 * The scene's solids a simulated window can strike, as kinematic bodies of the
 * window's world: every prop with colliders and every obstacle whose bounds
 * over the window come within the bodies' reach, so a body that falls onto a
 * table or against a wall rests on it instead of passing through.
 *
 * A prop moves as the performance places it at each step
 * (`HumanPerformance.prop`); a prop a simulated performer grips or wears during
 * the window rides that performer's hand or bone and is left out, since a
 * kinematic body cannot follow a solved hand. An obstacle is the prism over its
 * footprint from its bottom to its top, placed by its motion when it moves
 * (`HumanObstacleMotion`). The scene declares no contact material for a prop or
 * an obstacle, so each takes the simulated bodies' own (`material`), and a
 * contact pair then combines that one value. A kinematic body's mass never
 * enters the solve, so each carries a unit mass and inertia only for profile
 * admission.
 *
 * @param state The resolved performance.
 * @param subjects The simulated performers.
 * @param clock The window's first film second, interval count and rate.
 * @param reach The bodies' swept world box over the window, metres.
 * @param material The simulated bodies' contact material.
 * @returns The kinematic bodies and the box widened to contain them.
 * @throws {HumanRefusal} When an obstacle with openings comes within reach: one
 *   convex solid cannot keep its openings open.
 */
export function placeHumanSimulationColliders(
  state: IAutoMovieMotionHumanPerformanceState,
  subjects: ReadonlySet<string>,
  clock: placeHumanSimulationColliders.IClock,
  reach: placeHumanSimulationColliders.IBox,
  material: IAutoMoviePhysicalMaterial,
): placeHumanSimulationColliders.IResult {
  const box: placeHumanSimulationColliders.IBox = {
    minimum: { ...reach.minimum },
    maximum: { ...reach.maximum },
  };
  const bodies: IAutoMoviePhysicalSimulationInput.IBody[] = [];
  const seconds = (step: number): number => clock.from + step / clock.rate;
  for (const prop of state.props.values()) {
    if (prop.shapes === undefined || prop.shapes.length === 0) continue;
    if (prop.soft !== undefined || carried(state, prop, subjects, clock))
      continue;
    const frames: IAutoMovieRigidTransform[] = Array.from(
      { length: clock.count + 1 },
      (_: unknown, step: number): IAutoMovieRigidTransform =>
        HumanPerformanceRead.prop(state, prop.subject, seconds(step)),
    );
    const placed: readonly IAutoMoviePhysicalShape[] = prop.shapes;
    if (!within(frames, placed, reach)) continue;
    grow(box, frames, placed);
    bodies.push(solid(`prop:${prop.subject}`, frames, placed, material));
  }
  for (const obstacle of state.obstacles) {
    const frames: IAutoMovieRigidTransform[] = Array.from(
      { length: clock.count + 1 },
      (_: unknown, step: number): IAutoMovieRigidTransform =>
        frame(obstacle, seconds(step)),
    );
    const prismPoints: IAutoMovieVector3[] = [
      obstacle.bottom,
      obstacle.top,
    ].flatMap((y: number): IAutoMovieVector3[] =>
      obstacle.footprint.map(
        (corner: IAutoMovieVector3): IAutoMovieVector3 => ({
          x: corner.x,
          y,
          z: corner.z,
        }),
      ),
    );
    const prism: IAutoMoviePhysicalShape[] = [
      {
        id: "solid",
        material: material.id,
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: Quaternion.identity(),
        },
        kind: "hull",
        points: prismPoints,
        hull: AutoMoviePhysicalHullFaces.build(prismPoints),
      },
    ];
    if (!within(frames, prism, reach)) continue;
    if (obstacle.apertures !== undefined && obstacle.apertures.length > 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "window",
        value: obstacle.subject,
        feasible: null,
        reason: `the obstacle ${obstacle.subject} has openings within the window's reach, and one convex solid would close them`,
        fix: "simulate a window whose bodies stay clear of the obstacle, or describe its solid parts as obstacles without openings",
      });
    grow(box, frames, prism);
    bodies.push(solid(`obstacle:${obstacle.subject}`, frames, prism, material));
  }
  return { bodies, box };
}

/** Companion types of {@link placeHumanSimulationColliders}. */
export namespace placeHumanSimulationColliders {
  /**
   * A window's grid: its first film second, interval count and intervals per
   * second.
   */
  export interface IClock {
    /** First film second, step zero. */
    from: number;

    /** Intervals in the window. */
    count: number;

    /** Intervals per second. */
    rate: number;
  }

  /** A world-axis box, metres. */
  export interface IBox {
    /** Least corner. */
    minimum: IAutoMovieVector3;

    /** Greatest corner. */
    maximum: IAutoMovieVector3;
  }

  /** The solids within reach and the box that holds them and the reach. */
  export interface IResult {
    /** Kinematic bodies, props then obstacles, in the performance's order. */
    bodies: IAutoMoviePhysicalSimulationInput.IBody[];

    /** The reach widened to the solids' bounds. */
    box: IBox;
  }
}

/**
 * Whether a simulated performer grips or wears the prop at some instant of the
 * window.
 */
function carried(
  state: IAutoMovieMotionHumanPerformanceState,
  prop: IAutoMovieMotionHumanProp,
  subjects: ReadonlySet<string>,
  clock: placeHumanSimulationColliders.IClock,
): boolean {
  if (prop.worn !== undefined && subjects.has(prop.worn.subject)) return true;
  const to: number = clock.from + clock.count / clock.rate;
  return HumanPerformanceRead.grips(state, prop.subject).some(
    (grip: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
      subjects.has(grip.subject) && grip.from <= to && clock.from <= grip.to,
  );
}

/**
 * An obstacle's frame at a film second: its motion's place and heading, or the
 * world frame when it stands still.
 */
function frame(
  obstacle: IAutoMovieMotionHumanObstacle,
  seconds: number,
): IAutoMovieRigidTransform {
  if (obstacle.motion === undefined)
    return {
      position: { x: 0, y: 0, z: 0 },
      rotation: Quaternion.identity(),
    };
  const placed: ReturnType<
    NonNullable<IAutoMovieMotionHumanObstacle["motion"]>
  > = obstacle.motion(seconds);

  // HumanObstacleMotion.footprint turns the own frame by the heading about
  // +Y, x' = x cos h + z sin h and z' = -x sin h + z cos h: the rotation
  // by h about +Y, on the floor.
  return {
    position: { x: placed.position.x, y: 0, z: placed.position.z },
    // The yaw is in degrees, the unit fromAxisAngle takes.
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, placed.yaw),
  };
}

/** Whether any collider comes within the box at any step. */
function within(
  frames: readonly IAutoMovieRigidTransform[],
  shapes: readonly IAutoMoviePhysicalShape[],
  box: placeHumanSimulationColliders.IBox,
): boolean {
  return frames.some((pose: IAutoMovieRigidTransform): boolean =>
    shapes.some((shape: IAutoMoviePhysicalShape): boolean => {
      const bounds: IAutoMoviePhysicalShapeBounds.IResult = AutoMovieEnginePhysics.physicalShapeBounds(
        pose,
        shape,
      );
      return (
        bounds.min.x <= box.maximum.x &&
        box.minimum.x <= bounds.max.x &&
        bounds.min.y <= box.maximum.y &&
        box.minimum.y <= bounds.max.y &&
        bounds.min.z <= box.maximum.z &&
        box.minimum.z <= bounds.max.z
      );
    }),
  );
}

/** Widen the box to every collider at every step. */
function grow(
  box: placeHumanSimulationColliders.IBox,
  frames: readonly IAutoMovieRigidTransform[],
  shapes: readonly IAutoMoviePhysicalShape[],
): void {
  for (const pose of frames)
    for (const shape of shapes) {
      const bounds: IAutoMoviePhysicalShapeBounds.IResult = AutoMovieEnginePhysics.physicalShapeBounds(
        pose,
        shape,
      );
      for (const axis of ["x", "y", "z"] as const) {
        box.minimum[axis] = Math.min(box.minimum[axis], bounds.min[axis]);
        box.maximum[axis] = Math.max(box.maximum[axis], bounds.max[axis]);
      }
    }
}

/** One kinematic single-segment body following its frames. */
function solid(
  id: string,
  frames: readonly IAutoMovieRigidTransform[],
  shapes: readonly IAutoMoviePhysicalShape[],
  material: IAutoMoviePhysicalMaterial,
): IAutoMoviePhysicalSimulationInput.IBody {
  const origin: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const profile: IAutoMoviePhysicalProfile = {
    id,
    mass: 1,
    centerOfMass: { x: 0, y: 0, z: 0 },
    segments: [
      {
        bone: "root",
        mass: 1,
        neutral: origin,
        centerOfMass: { x: 0, y: 0, z: 0 },
        inertia: { x: 1, y: 1, z: 1 },
        inertiaRotation: Quaternion.identity(),
        shapes: shapes.map(
          (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShape => ({
            ...shape,
            material: material.id,
          }),
        ),
      },
    ],
    joints: [],
    materials: [{ ...material }],
    provenance:
      "A scene solid moved kinematically through a simulated window; its unit mass never enters the solve.",
  };
  return {
    id,
    profile,
    mode: { kind: "kinematic" },
    targets: frames.map(
      (
        pose: IAutoMovieRigidTransform,
      ): IAutoMoviePhysicalSimulationInput.ITarget => ({
        strength: 1,
        segments: { root: pose },
      }),
    ),
    rootStiffness: 0,
    rootDamping: 0,
    maximumRootForce: 0,
    complianceSeconds: 0,
    complianceStrength: 1,
  };
}
