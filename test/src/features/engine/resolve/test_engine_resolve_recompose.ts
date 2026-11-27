import { Matrix4, AutoMovieEngineResolve } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one matrix product of unit rotations. */
const ROUNDING: number = 1e-12;

/** A pure translation. */
const move: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * `recompose` writes each descendant's world matrix as its parent's world
 * matrix times its own local matrix, walking the children map.
 *
 * Scenarios:
 *
 * 1. A child at (1, 2, 3) of an identity root lands at (1, 2, 3).
 * 2. A grandchild at (0, 1, 0) of that child lands at (1, 3, 3).
 */
export function test_engine_resolve_recompose(): void {
  const world: Map<string, number[]> = new Map([["root", Matrix4.identity()]]);
  AutoMovieEngineResolve.recompose(
    "root",
    world,
    new Map([
      ["child", move(1, 2, 3)],
      ["grand", move(0, 1, 0)],
    ]),
    new Map([
      ["root", ["child"]],
      ["child", ["grand"]],
    ]),
  );
  const child: number[] = world.get("child")!;
  const grand: number[] = world.get("grand")!;
  TestValidator.predicate(
    "child translation",
    nclose(child[12]!, 1, ROUNDING) &&
      nclose(child[13]!, 2, ROUNDING) &&
      nclose(child[14]!, 3, ROUNDING),
  );
  TestValidator.predicate(
    "grandchild translation",
    nclose(grand[12]!, 1, ROUNDING) &&
      nclose(grand[13]!, 3, ROUNDING) &&
      nclose(grand[14]!, 3, ROUNDING),
  );
}
