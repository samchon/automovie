import type {
  IAutoMovieQuaternion,
  IAutoMovieSphere,
  IAutoMovieSpringDriver,
  IAutoMovieSpringState,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Matrix4 } from "../../math/Matrix4";
import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { readLocal } from "./readLocal";
import { readWorld } from "./readWorld";

/**
 * Advance non-root spring joints with Verlet inertia, gravity, stiffness and
 * length projection, then sphere collision projection. Caller state and world
 * positions mutate in place; joint rotation/scale remain unchanged. Each
 * centre/ordered-chain tuple transports its own previous translation, and
 * collision projection can stretch the length projected earlier in the step.
 */
export const stepSpring: (
  d: IAutoMovieSpringDriver,
  world: Map<string, number[]>,
  state: IAutoMovieSpringState,
  dt: number,
  localById: Map<string, IAutoMovieTransform>,
  colliders?: readonly IAutoMovieSphere[],
) => void = (
  d: IAutoMovieSpringDriver,
  world: Map<string, number[]>,
  state: IAutoMovieSpringState,
  dt: number,
  localById: Map<string, IAutoMovieTransform>,
  colliders: readonly IAutoMovieSphere[] = [],
): void => {
  validateSpringInputs(d, dt);
  validateSpringColliders(colliders);
  const centerDelta: IAutoMovieVector3 = readCenterDelta(d, world, state);
  const gravity: IAutoMovieVector3 = Vector3.scale(
    Vector3.normalize(d.gravityDir),
    d.gravityPower * dt * dt,
  );
  for (let i: number = 1; i < d.chain.length; ++i) {
    const id: string = d.chain[i]!;
    const parentId: string = d.chain[i - 1]!;
    const parentM: number[] = readWorld(
      world,
      parentId,
      "parent",
      "spring driver",
    );
    const parentPos: IAutoMovieVector3 = Matrix4.position(parentM);
    const currentM: number[] = readWorld(world, id, "joint", "spring driver");
    const cur: IAutoMovieVector3 = Matrix4.position(currentM);
    const prev: IAutoMovieVector3 = Vector3.add(
      state.prev.get(id) ?? cur,
      centerDelta,
    );

    const local: IAutoMovieTransform = readLocal(
      localById,
      id,
      "spring driver local transform",
    );
    const boneDir: IAutoMovieVector3 = Vector3.normalize(local.translation);
    const boneLength: number = Vector3.length(local.translation);

    // rest target: the bone at its parent-relative rest direction, in world
    const restDir: IAutoMovieVector3 = Quaternion.rotateVector(
      Matrix4.decompose(parentM).rotation,
      boneDir,
    );
    const restPos: IAutoMovieVector3 = Vector3.add(
      parentPos,
      Vector3.scale(restDir, boneLength),
    );

    // verlet: inertia + gravity, then a stiffness pull toward rest
    const inertia: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(cur, prev),
      1 - d.drag,
    );
    let next: IAutoMovieVector3 = Vector3.add(
      Vector3.add(cur, inertia),
      gravity,
    );
    next = Vector3.add(
      next,
      Vector3.scale(Vector3.subtract(restPos, next), d.stiffness * dt),
    );

    // hard length constraint against the (already-updated) parent
    next = Vector3.add(
      parentPos,
      Vector3.scale(
        Vector3.normalize(Vector3.subtract(next, parentPos)),
        boneLength,
      ),
    );

    // collision: push the joint out of every penetrated sphere (VRM order:
    // after the length constraint, so a hit stretches rather than tunnels)
    for (const sphere of colliders) {
      const minimum: number = sphere.radius + d.hitRadius;
      const away: IAutoMovieVector3 = Vector3.subtract(next, sphere.center);
      const distance: number = Vector3.length(away);
      if (distance < minimum)
        next = Vector3.add(
          sphere.center,
          Vector3.scale(
            distance < 1e-12 ? { x: 0, y: 1, z: 0 } : Vector3.normalize(away),
            minimum,
          ),
        );
    }

    state.prev.set(id, cur);
    state.sprung.set(id, next);
    const dec: {
      position: IAutoMovieVector3;
      rotation: IAutoMovieQuaternion;
      scale: IAutoMovieVector3;
    } = Matrix4.decompose(currentM);
    world.set(id, Matrix4.compose(next, dec.rotation, dec.scale));
  }
};

const readCenterDelta: (
  d: IAutoMovieSpringDriver,
  world: Map<string, number[]>,
  state: IAutoMovieSpringState,
) => IAutoMovieVector3 = (
  d: IAutoMovieSpringDriver,
  world: Map<string, number[]>,
  state: IAutoMovieSpringState,
): IAutoMovieVector3 => {
  if (d.center === null) return Vector3.create();

  const center: IAutoMovieVector3 = Matrix4.position(
    readWorld(world, d.center, "center", "spring driver"),
  );
  const key: string = JSON.stringify([d.center, d.chain]);
  const prev: IAutoMovieVector3 = state.centers.get(key) ?? center;
  state.centers.set(key, center);
  return Vector3.subtract(center, prev);
};

const validateSpringInputs: (d: IAutoMovieSpringDriver, dt: number) => void = (
  d: IAutoMovieSpringDriver,
  dt: number,
): void => {
  if (dt <= 0)
    throw new Error(`spring driver time step must be > 0, but was ${dt}`);

  if (d.stiffness < 0)
    throw new Error(
      `spring driver stiffness must be non-negative, but was ${d.stiffness}`,
    );
  if (d.drag < 0)
    throw new Error(
      `spring driver drag must be between 0 and 1, but was ${d.drag}`,
    );
  if (d.drag > 1)
    throw new Error(
      `spring driver drag must be between 0 and 1, but was ${d.drag}`,
    );
  if (d.hitRadius <= 0)
    throw new Error(
      `spring driver hitRadius must be > 0, but was ${d.hitRadius}`,
    );
  if (d.gravityPower < 0)
    throw new Error(
      `spring driver gravityPower must be non-negative, but was ${d.gravityPower}`,
    );
  if (Vector3.length(d.gravityDir) === 0)
    throw new Error("spring driver gravityDir must be non-zero");
};

const validateSpringColliders: (
  colliders: readonly IAutoMovieSphere[],
) => void = (colliders: readonly IAutoMovieSphere[]): void => {
  colliders.forEach((sphere: IAutoMovieSphere, i: number): void => {
    if (sphere.radius <= 0)
      throw new Error(
        `spring driver colliders[${i}].radius must be > 0, but was ${sphere.radius}`,
      );
  });
};
