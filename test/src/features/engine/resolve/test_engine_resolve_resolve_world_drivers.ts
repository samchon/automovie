import { AutoMovieEngineMatrix4, AutoMovieEngineResolve } from "@automovie/engine";
import type {
  IAutoMovieDriver,
  IAutoMovieNode,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { resolveScene } from "../../internal/resolveScene";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** Rounding of a few rotations of unit offsets. */
const ROUNDING: number = 1e-9;

/**
 * A fully stretched two-bone IK stops a hair short of straight: its reach
 * clamp.
 */
const STRETCHED: number = 1e-4;

/** The composed world of the scene, and what resolving needs of it. */
const prepare: () => {
  world: Map<string, number[]>;
  local: Map<string, IAutoMovieTransform>;
  children: Map<string, string[]>;
} = (): {
  world: Map<string, number[]>;
  local: Map<string, IAutoMovieTransform>;
  children: Map<string, string[]>;
} => {
  const nodes: IAutoMovieNode[] = resolveScene();
  return {
    world: AutoMovieEngineResolve.composeScene(nodes, new Map()),
    local: new Map(
      nodes.map((node: IAutoMovieNode): [string, IAutoMovieTransform] => [
        node.id,
        node.transform,
      ]),
    ),
    children: AutoMovieEngineResolve.childrenIndex(nodes),
  };
};

/** The world place of a node. */
const at: (world: Map<string, number[]>, id: string) => IAutoMovieVector3 = (
  world: Map<string, number[]>,
  id: string,
): IAutoMovieVector3 => AutoMovieEngineMatrix4.position(world.get(id)!);

/** Root aims its +X axis at the goal, keeping +Z as its up. */
const AIM: IAutoMovieDriver = {
  type: "aim",
  owner: "root",
  target: "goal",
  aimAxis: { x: 1, y: 0, z: 0 },
  upAxis: { x: 0, y: 0, z: 1 },
  worldUp: { x: 0, y: 0, z: 1 },
  influence: 1,
};

/**
 * `resolveWorldDrivers` applies the drivers that act on the composed world
 * (aim, parent and IK) and returns the ones it leaves, the springs.
 *
 * Scenarios, on the arm scene (root -> mid -> tip along +X, goal at (0, 2, 0),
 * ball at (0, 0, 3)):
 *
 * 1. An aim of the root's +X axis at the goal, up kept on +Z, turns the arm a
 *    quarter turn about Z: mid at (0, 1, 0), tip at (0, 2, 0), the ball (0, 0,
 *    3) unmoved.
 * 2. A parent driver taking the goal's translation puts the ball at the goal's
 *    place (0, 2, 0).
 * 3. A two-bone IK of the arm to the goal at distance 2 lands the tip on the goal
 *    and keeps both segments 1 m.
 * 4. A spring driver is returned, untouched.
 * 5. An aim influence outside [0, 1] and an IK chain through a node that is not
 *    there are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names world-space aim, parenting and IK, deferred springs, and invalid influence or chain nodes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `resolveWorldDrivers` for typed arm and ball fixtures with one active driver at a time. It reads the mutated world maps and compares the deferred spring identity and refusal cases.
 * @evidence contracts/development/testing.md#independent-expectations The quarter turn around Z moves the arm from +X to +Y and leaves the ball at (0, 0, 3). Copying the goal translation moves the ball to (0, 2, 0). To reach that same point the two-bone solver must preserve two 1 m segments.
 */
export function test_engine_resolve_resolve_world_drivers(): void {
  const aimed = prepare();
  AutoMovieEngineResolve.resolveWorldDrivers([AIM], aimed.world, aimed.local, aimed.children);
  TestValidator.predicate(
    "an aim at the goal",
    vclose(at(aimed.world, "mid"), { x: 0, y: 1, z: 0 }, ROUNDING) &&
      vclose(at(aimed.world, "tip"), { x: 0, y: 2, z: 0 }, ROUNDING) &&
      vclose(at(aimed.world, "ball"), { x: 0, y: 0, z: 3 }, ROUNDING),
  );
  const parented = prepare();
  AutoMovieEngineResolve.resolveWorldDrivers(
    [
      {
        type: "parent",
        owner: "ball",
        parent: "goal",
        translation: true,
        rotation: false,
        scale: false,
      },
    ],
    parented.world,
    parented.local,
    parented.children,
  );
  TestValidator.predicate(
    "a parent driver",
    vclose(at(parented.world, "ball"), { x: 0, y: 2, z: 0 }, ROUNDING),
  );
  const bent = prepare();
  AutoMovieEngineResolve.resolveWorldDrivers(
    [
      {
        type: "ik",
        chain: ["root", "mid", "tip"],
        goal: "goal",
        pole: null,
        solver: "twoBone",
        iterations: null,
        influence: 1,
      },
    ],
    bent.world,
    bent.local,
    bent.children,
  );
  const mid: IAutoMovieVector3 = at(bent.world, "mid");
  const tip: IAutoMovieVector3 = at(bent.world, "tip");
  TestValidator.predicate(
    "a two-bone IK",
    vclose(tip, { x: 0, y: 2, z: 0 }, STRETCHED) &&
      Math.abs(Math.hypot(mid.x, mid.y, mid.z) - 1) <= STRETCHED &&
      Math.abs(Math.hypot(tip.x - mid.x, tip.y - mid.y, tip.z - mid.z) - 1) <=
        STRETCHED,
  );
  const spring: IAutoMovieDriver = {
    type: "spring",
    chain: ["mid", "tip"],
    stiffness: 0,
    drag: 0,
    gravityPower: 0,
    gravityDir: { x: 0, y: -1, z: 0 },
    hitRadius: 0.1,
    center: null,
  };
  const scene = prepare();
  TestValidator.predicate(
    "the spring is returned",
    AutoMovieEngineResolve.resolveWorldDrivers(
      [spring],
      scene.world,
      scene.local,
      scene.children,
    )[0] === spring,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      (): unknown =>
        AutoMovieEngineResolve.resolveWorldDrivers(
          [{ ...AIM, influence: 2 } as IAutoMovieDriver],
          scene.world,
          scene.local,
          scene.children,
        ),
      "influence",
    ) &&
      throwsError(
        (): unknown =>
          AutoMovieEngineResolve.resolveWorldDrivers(
            [
              {
                type: "ik",
                chain: ["root", "mid", "missing"],
                goal: "goal",
                pole: null,
                solver: "twoBone",
                iterations: null,
                influence: 1,
              },
            ],
            scene.world,
            scene.local,
            scene.children,
          ),
        "was not provided",
      ),
  );
}
