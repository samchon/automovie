import { Matrix4, resolveWorldDrivers } from "@automovie/engine";
import {
  type IAutoMovieDriver,
  IAutoMovieParentDriver,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../internal/qclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

const W: (
  pos: IAutoMovieVector3,
  rot?: IAutoMovieQuaternion,
  scl?: IAutoMovieVector3,
) => number[] = (
  pos: IAutoMovieVector3,
  rot: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 },
  scl: IAutoMovieVector3 = { x: 1, y: 1, z: 1 },
): number[] => Matrix4.compose(pos, rot, scl);

const parent: (
  over: Partial<IAutoMovieParentDriver>,
) => IAutoMovieParentDriver = (
  over: Partial<IAutoMovieParentDriver>,
): IAutoMovieParentDriver => ({
  type: "parent",
  owner: "o",
  parent: "p",
  translation: false,
  rotation: false,
  scale: false,
  ...over,
});

const trs: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * A parent driver inherits selected parent world components and recomposes descendants; disabled components retain the owner's values.
 *
 * Scenarios:
 *
 * 1. All flags on: the owner snaps to the parent's full world frame in position,
 *    rotation (90° about Y), and scale (×2), and its child recomposes off the
 *    new frame.
 * 2. All flags off: the owner's position stays at (3,4,5). This assertion
 *    does not separately check retained rotation and scale.
 * 3. Malformed component flags reject before truthy/falsy coercion can change
 *    which parent frame components are inherited.
 *
 * @evidence contracts/testing.md#behavioral-verification Applies resolveWorldDrivers parent descriptors and observes inherited world TRS, descendant movement, unchanged owner position with all flags off and malformed/missing-input refusals.
 * @evidence contracts/testing.md#independent-expectations The parent's authored (10,0,0), quarter-turn Y rotation and uniform scale2 are the copied expectations; all-off position retains (3,4,5). The child assertion detects movement but does not independently calculate its full new world transform.
 * @evidence contracts/testing.md#distinguishing-cases All-on/all-off flags contrast inheritance with preservation, with non-boolean flags and missing owner/parent negatives; mixed flags and nonuniform-scale shear are not established by these cases.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_parent_driver entry executes synchronous CPU driver and matrix semantics directly, using existing portable node records without a live scene host or foreign replacement.
 */
export function test_resolve_parent_driver(): void {
  const s: number = Math.SQRT1_2;
  const parentRot: IAutoMovieQuaternion = { x: 0, y: s, z: 0, w: s };
  const parentScale: IAutoMovieVector3 = { x: 2, y: 2, z: 2 };

  // 1. inherit the whole frame, child follows
  const world: Map<string, number[]> = new Map<string, number[]>([
    ["o", W({ x: 0, y: 0, z: 0 })],
    ["c", W({ x: 0, y: 1, z: 0 })],
    ["p", W({ x: 10, y: 0, z: 0 }, parentRot, parentScale)],
  ]);
  const localById: Map<string, IAutoMovieTransform> = new Map<
    string,
    IAutoMovieTransform
  >([["c", trs(0, 1, 0)]]);
  const children: Map<string, string[]> = new Map<string, string[]>([
    ["o", ["c"]],
  ]);
  resolveWorldDrivers(
    [parent({ translation: true, rotation: true, scale: true })],
    world,
    localById,
    children,
  );
  const own: {
    position: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
    scale: IAutoMovieVector3;
  } = Matrix4.decompose(world.get("o")!);
  TestValidator.predicate(
    "owner inherits parent position",
    vclose(own.position, { x: 10, y: 0, z: 0 }, 1e-5),
  );
  TestValidator.predicate(
    "owner inherits parent scale",
    vclose(own.scale, parentScale, 1e-5),
  );
  TestValidator.predicate(
    "owner inherits parent rotation",
    qclose(own.rotation, parentRot, 1e-5),
  );
  TestValidator.predicate(
    "child recomposed off the new owner frame",
    !vclose(Matrix4.position(world.get("c")!), { x: 0, y: 1, z: 0 }, 1e-3),
  );

  // 2. all flags off → owner unchanged
  const world2: Map<string, number[]> = new Map<string, number[]>([
    ["o", W({ x: 3, y: 4, z: 5 })],
    ["p", W({ x: 10, y: 0, z: 0 }, parentRot, parentScale)],
  ]);
  resolveWorldDrivers([parent({})], world2, new Map(), new Map());
  TestValidator.predicate(
    "all flags off leaves the owner put",
    vclose(Matrix4.position(world2.get("o")!), { x: 3, y: 4, z: 5 }, 1e-5),
  );

  TestValidator.predicate(
    "parent driver rejects non-boolean component flag",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveWorldDrivers(
          [
            parent({
              translation: "yes" as unknown as boolean,
            }),
          ],
          new Map([
            ["o", W({ x: 0, y: 0, z: 0 })],
            ["p", W({ x: 10, y: 0, z: 0 })],
          ]),
          new Map(),
          new Map(),
        ),
      ["world driver parent translation", "boolean", "yes"],
    ),
  );

  TestValidator.predicate(
    "missing parent-driver owner rejects incomplete world map",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveWorldDrivers(
          [parent({ owner: "missing", translation: true })],
          new Map([["p", W({ x: 10, y: 0, z: 0 })]]),
          new Map(),
          new Map(),
        ),
      'world driver parent owner node "missing" was not provided',
    ),
  );
  TestValidator.predicate(
    "missing parent-driver parent rejects incomplete world map",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveWorldDrivers(
          [parent({ parent: "missing", translation: true })],
          new Map([["o", W({ x: 0, y: 0, z: 0 })]]),
          new Map(),
          new Map(),
        ),
      'world driver parent parent node "missing" was not provided',
    ),
  );
}
