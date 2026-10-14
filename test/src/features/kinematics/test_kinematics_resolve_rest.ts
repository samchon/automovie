import { IAutoMovieResolvedBone } from "../../../../packages/engine/src/kinematics/IAutoMovieResolvedBone";
import { resolvePose } from "../../../../packages/engine/src/kinematics/resolvePose";
import { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createSkeleton } from "../internal/createSkeleton";
import { makePose } from "../internal/makePose";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";
import { type IAutoMovieSkeleton } from "../../../../packages/interface/src/index";
const at: (rs: IAutoMovieResolvedBone[], b: AutoMovieHumanoidBone) => IAutoMovieResolvedBone = (
  rs: IAutoMovieResolvedBone[],
  b: AutoMovieHumanoidBone,
): IAutoMovieResolvedBone => {
  const r: IAutoMovieResolvedBone | undefined = rs.find((x: IAutoMovieResolvedBone): boolean  => x.bone === b);
  if (r === undefined) throw new Error(`bone ${b} not resolved`);
  return r;
};

/**
 * With no articulation, `resolvePose` is pure rest-pose forward kinematics: it
 * walks the bone hierarchy parent-before-child, accumulating each bone's local
 * rest offset into a world position. This fixture has identity rest rotations;
 * representative world positions and the chest's local identity are observed.
 *
 * Scenario (the test skeleton's rest offsets): hips sits at (0,1,0); each spine
 * bone adds +0.2 on Y (spine 1.2, chest 1.4, head 1.7); the left arm chains out
 * along +X (lower arm reaching 0.5). Every bone is resolved, and the chest's
 * local rotation is the identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves an undriven fixture hierarchy and checks complete count, accumulated rest coordinates and chest identity; missing descendants or failing to add a rest offset fails.
 * @evidence contracts/testing.md#independent-expectations Literal fixture translations sum to hips 1, spine 1.2, chest 1.4, head 1.7 and lower-arm X 0.5; identity components are stated directly. These conventional dimensions are not anatomical measurements, and selected coordinate checks do not prove every returned bone value.
 * @evidence contracts/testing.md#distinguishing-cases Owns the undriven baseline and representative trunk/arm accumulation; articulated descendants, root transforms and unreachable/topologically malformed rigs are owned by neighboring entries.
 * @evidence contracts/testing.md#execution-ownership The exported CPU test is discovered by the normal runner and imports actual FK plus existing code fixtures; it needs no renderer, Human asset, browser or native build.
 */
export function test_kinematics_resolve_rest(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const rest: IAutoMovieResolvedBone[] = resolvePose(makePose([]), skeleton);

  TestValidator.equals(
    "all bones resolved",
    rest.length,
    skeleton.bones.length,
  );
  TestValidator.predicate(
    "hips world",
    vclose(at(rest, "hips").worldPosition, { x: 0, y: 1, z: 0 }),
  );
  TestValidator.predicate(
    "spine world",
    vclose(at(rest, "spine").worldPosition, { x: 0, y: 1.2, z: 0 }),
  );
  TestValidator.predicate(
    "chest world",
    vclose(at(rest, "chest").worldPosition, { x: 0, y: 1.4, z: 0 }),
  );
  TestValidator.predicate(
    "head world",
    vclose(at(rest, "head").worldPosition, { x: 0, y: 1.7, z: 0 }),
  );
  TestValidator.predicate(
    "leftLowerArm world",
    vclose(at(rest, "leftLowerArm").worldPosition, { x: 0.5, y: 1.4, z: 0 }),
  );
  TestValidator.predicate(
    "rest local rotation is identity",
    qclose(at(rest, "chest").localRotation, { x: 0, y: 0, z: 0, w: 1 }),
  );
}
