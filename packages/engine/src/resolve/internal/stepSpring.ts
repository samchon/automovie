import type {
  IAutoMovieQuaternion,
  IAutoMovieSphere,
  IAutoMovieSpringDriver,
  IAutoMovieSpringState,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineMatrix4 } from "../../math/AutoMovieEngineMatrix4";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { readLocal } from "./readLocal";
import { readWorld } from "./readWorld";

/*
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
  const gravity: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
    AutoMovieEngineVector3.normalize(d.gravityDir),
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
    const parentPos: IAutoMovieVector3 = AutoMovieEngineMatrix4.position(parentM);
    const currentM: number[] = readWorld(world, id, "joint", "spring driver");
    const cur: IAutoMovieVector3 = AutoMovieEngineMatrix4.position(currentM);
    const prev: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      state.prev.get(id) ?? cur,
      centerDelta,
    );

    const local: IAutoMovieTransform = readLocal(
      localById,
      id,
      "spring driver local transform",
    );
    const boneDir: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(local.translation);
    const boneLength: number = AutoMovieEngineVector3.length(local.translation);

    // rest target: the bone at its parent-relative rest direction, in world
    const restDir: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineMatrix4.decompose(parentM).rotation,
      boneDir,
    );
    const restPos: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      parentPos,
      AutoMovieEngineVector3.scale(restDir, boneLength),
    );

    // verlet: inertia + gravity, then a stiffness pull toward rest
    const inertia: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.subtract(cur, prev),
      1 - d.drag,
    );
    let next: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.add(cur, inertia),
      gravity,
    );
    next = AutoMovieEngineVector3.add(
      next,
      AutoMovieEngineVector3.scale(AutoMovieEngineVector3.subtract(restPos, next), d.stiffness * dt),
    );

    // hard length constraint against the (already-updated) parent
    next = AutoMovieEngineVector3.add(
      parentPos,
      AutoMovieEngineVector3.scale(
        AutoMovieEngineVector3.normalize(AutoMovieEngineVector3.subtract(next, parentPos)),
        boneLength,
      ),
    );

    // collision: push the joint out of every penetrated sphere (VRM order:
    // after the length constraint, so a hit stretches rather than tunnels)
    for (const sphere of colliders) {
      const minimum: number = sphere.radius + d.hitRadius;
      const away: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(next, sphere.center);
      const distance: number = AutoMovieEngineVector3.length(away);
      if (distance < minimum)
        next = AutoMovieEngineVector3.add(
          sphere.center,
          AutoMovieEngineVector3.scale(
            distance < 1e-12 ? { x: 0, y: 1, z: 0 } : AutoMovieEngineVector3.normalize(away),
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
    } = AutoMovieEngineMatrix4.decompose(currentM);
    world.set(id, AutoMovieEngineMatrix4.compose(next, dec.rotation, dec.scale));
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
  if (d.center === null) return AutoMovieEngineVector3.create();

  const center: IAutoMovieVector3 = AutoMovieEngineMatrix4.position(
    readWorld(world, d.center, "center", "spring driver"),
  );
  const key: string = JSON.stringify([d.center, d.chain]);
  const prev: IAutoMovieVector3 = state.centers.get(key) ?? center;
  state.centers.set(key, center);
  return AutoMovieEngineVector3.subtract(center, prev);
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
  if (AutoMovieEngineVector3.length(d.gravityDir) === 0)
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
