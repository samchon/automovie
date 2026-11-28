import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanPropFrame
} from "../../../../../packages/motions/src/perform/internal/HumanPropFrame";
import { TestValidator } from "@nestia/e2e";

/**
 * How far a composed or inverted frame may stand from its hand-computed value:
 * a few products and sums of unit quaternions and metre offsets, far above
 * their rounding.
 */
const FRAME: number = 1e-12;

/** A point. */
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/** A quarter turn about `+Y`, taking `+X` to `-Z`. */
const QUARTER: IAutoMovieQuaternion = {
  x: 0,
  y: Math.SQRT1_2,
  z: 0,
  w: Math.SQRT1_2,
};

/** A half turn about `+Y`. */
const HALF: IAutoMovieQuaternion = { x: 0, y: 1, z: 0, w: 0 };

/** No turn. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/**
 * `HumanPropFrame` composes a local frame into its parent's, takes a world
 * frame into a parent's, solves the parent that places a local frame at a world
 * frame, and reads a resolved bone's frame.
 *
 * Scenarios, for a parent at (1, 2, 3) turned a quarter about `+Y` and a local
 * frame one metre along its `+X`, turned a quarter more:
 *
 * 1. `compose` lays the offset along the parent's turned `+X`, world `-Z`, at (1,
 *    2, 2), and adds the child's quarter turn to the parent's quarter turn
 *    about the same axis.
 * 2. `relative` of the composed frame returns the local frame, and of the parent
 *    itself the identity at the origin: it subtracts the parent's place before
 *    undoing its turn.
 * 3. `parent` of the composed frame and the local frame returns the parent, and
 *    composing it with the local frame lands back on the world frame.
 * 4. A local frame with an offset and no turn under a parent with no turn adds
 *    the offset.
 * 5. `bone` keeps a bone's world place and turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names composition, relative frame, solved parent including a rotated offset, unturned translation, and world bone frames.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `HumanPropFrame` with typed local and world transforms, then compares coordinates and quaternion rotations up to sign. A direct bone read provides a separate case.
 * @evidence contracts/development/testing.md#independent-expectations A +Y quarter turn maps local +X to world -Z, so parent (1, 2, 3) and unit offset compose to (1, 2, 2). Two same-axis quarters give a half turn. Rotating (0.5, -1, 2) gives (2, -1, -0.5), which is subtracted to obtain the second solved parent.
 */
export function test_motions_perform_prop_frame(): void {
  const parent: IAutoMovieRigidTransform = {
    position: P(1, 2, 3),
    rotation: QUARTER,
  };
  const local: IAutoMovieRigidTransform = {
    position: P(1, 0, 0),
    rotation: QUARTER,
  };

  // 1. Compose.
  const world: IAutoMovieRigidTransform = HumanPropFrame.compose(parent, local);
  TestValidator.predicate(
    "compose lays the offset along the parent's turned axis",
    near(world.position, P(1, 2, 2)) && same(world.rotation, HALF),
  );

  // 2. Relative.
  const back: IAutoMovieRigidTransform = HumanPropFrame.relative(parent, world);
  const self: IAutoMovieRigidTransform = HumanPropFrame.relative(
    parent,
    parent,
  );
  TestValidator.predicate(
    "relative inverts compose",
    near(back.position, local.position) &&
      same(back.rotation, local.rotation) &&
      near(self.position, P(0, 0, 0)) &&
      same(self.rotation, IDENTITY),
  );

  // 3. Parent.
  const solved: IAutoMovieRigidTransform = HumanPropFrame.parent(world, local);
  const again: IAutoMovieRigidTransform = HumanPropFrame.compose(solved, local);
  TestValidator.predicate(
    "parent solves parent times local equals world",
    near(solved.position, parent.position) &&
      same(solved.rotation, parent.rotation) &&
      near(again.position, world.position) &&
      same(again.rotation, world.rotation),
  );
  const offset: IAutoMovieRigidTransform = {
    position: P(0.5, -1, 2),
    rotation: IDENTITY,
  };
  const lifted: IAutoMovieRigidTransform = HumanPropFrame.parent(
    { position: P(3, 1, 4), rotation: QUARTER },
    offset,
  );
  TestValidator.predicate(
    "parent subtracts the offset turned by the solved turn",
    // The quarter turn takes (0.5, -1, 2) to (2, -1, -0.5).
    near(lifted.position, P(1, 2, 4.5)) && same(lifted.rotation, QUARTER),
  );

  // 4. No turn.
  const shifted: IAutoMovieRigidTransform = HumanPropFrame.compose(
    { position: P(1, 2, 3), rotation: IDENTITY },
    offset,
  );
  TestValidator.predicate(
    "an unturned parent adds the offset",
    near(shifted.position, P(1.5, 1, 5)) && same(shifted.rotation, IDENTITY),
  );

  // 5. Bone.
  const bone: IAutoMovieRigidTransform = HumanPropFrame.bone({
    worldPosition: P(0.1, 1.4, -0.2),
    worldRotation: QUARTER,
  });
  TestValidator.predicate(
    "bone keeps its world frame",
    near(bone.position, P(0.1, 1.4, -0.2)) && same(bone.rotation, QUARTER),
  );
}

/** Whether two points agree within the frame bound. */
function near(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return (
    Math.abs(a.x - b.x) <= FRAME &&
    Math.abs(a.y - b.y) <= FRAME &&
    Math.abs(a.z - b.z) <= FRAME
  );
}

/** Whether two unit quaternions are the same turn, either sign. */
function same(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): boolean {
  const dot: number = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  return Math.abs(Math.abs(dot) - 1) <= FRAME;
}
