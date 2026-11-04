import { TestValidator } from "@nestia/e2e";

import type { AutoMovieHumanFootSurface as Foot } from "../../../../packages/human/src/generation/AutoMovieHumanFootSurface";
import { AutoMovieHumanSkeleton as Skeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HumanPeople } from "../internal/HumanPeople";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Foot exterior opt-in changes display data while preserving the exact public rig.
 *
 * Scenarios:
 *
 * 1. The same calibrated male/female body with and without foot opt-in returns
 * identical rest joints, posed transforms and clamp results at neutral and
 * bilateral ankle/subtalar/midfoot/toe articulation, including exceeded limits.
 * 2. One opted-in evaluator shares deeply frozen small source data while each
 * FK result retains independent mutable bone/placement tuples.
 * 3. Mutating a returned FK placement cannot change a later result or source
 * course; no source descriptor is emitted when not requested.
 *
 * @evidence contracts/testing.md#behavioral-verification Prepares actual Human evaluators from the identical existing calibration with and without the new display port, evaluates neutral and an articulated foot pose, and reads all rest/posed numbers and clamp results. It catches accidental rig, clinical-neutral, range, unit or ownership changes introduced by display preparation.
 * @evidence contracts/testing.md#independent-expectations A display-only exterior cannot change the body's physical joint frames or admitted clinical pose, and a caller-owned mutable FK snapshot cannot mutate another result. Runtime frozen source data is the explicit reusable lifetime contract, distinct from those mutable snapshots. No source mesh or expected pose coordinate is copied into the fixture.
 * @evidence contracts/testing.md#distinguishing-cases Covers opted-in and absent data, two body identities, neutral and bilateral articulated feet/toes, repeated evaluation, immutable descriptor sharing and a changed public output tuple. Surface anatomy and emitted actual support remain the foot-surface test and Viewer/operator responsibilities.
 * @evidence contracts/testing.md#execution-ownership This discoverable synchronous CPU unit supplies HumanPeople's already calibrated body to the real public Skeleton preparation; it invokes no BodySurface, renderer, GPU, process or installation.
 */
export function test_human_foot_preparation(): void {
  const defects: string[] = [];
  for (const name of ["f1", "m1"]) {
    const person: HumanPeople.IPerson = HumanPeople.person(name);
    const plain: Skeleton.PoseEvaluator = Skeleton.prepare(person.params, { calibration: person.body });
    const exterior: Skeleton.PoseEvaluator = Skeleton.prepare(person.params, { calibration: person.body, footSurface: true });
    const poses: IAutoMovieHumanPose[] = [{}, { legs: { left: { ankle: { dorsiflexion: 8 }, foot: { subtalarInversion: 3, midfootSupination: 8, hallux: { mtpFlexion: 10 } } }, right: { ankle: { dorsiflexion: -12 }, foot: { subtalarInversion: -3, midfootSupination: -5, second: { mtpFlexion: 12 } } } } }, { legs: { left: { ankle: { dorsiflexion: 100 }, foot: { subtalarInversion: 8 } }, right: { foot: { midfootSupination: 100 } } } }];
    for (const pose of poses) {
      const before: Skeleton.IOutput = plain(pose);
      const after: Skeleton.IOutput = exterior(pose);
      if (before.footSurface !== undefined || after.footSurface === undefined) defects.push(`${name}: explicit opt-in admission`);
      for (let index: number = 0; index < before.bones.length; index++) {
        const a: Skeleton.IBone = before.bones[index]!;
        const b: Skeleton.IBone = after.bones[index]!;
        if (a.bone !== b.bone || a.parent !== b.parent || !nclose(a.radius, b.radius, 0)) defects.push(`${name}/${a.bone}: changed rest rig identity`);
        for (let axis: number = 0; axis < 3; axis++)
          if (!nclose(a.position[axis]!, b.position[axis]!, 0) || a.tip !== null && (b.tip === null || !nclose(a.tip[axis]!, b.tip[axis]!, 0))) defects.push(`${name}/${a.bone}: changed rest geometry`);
      }
      for (let index: number = 0; index < before.posed.length; index++) {
        const a: Skeleton.IPlacement = before.posed[index]!;
        const b: Skeleton.IPlacement = after.posed[index]!;
        for (let axis: number = 0; axis < 3; axis++)
          if (!nclose(a.position[axis]!, b.position[axis]!, 0)) defects.push(`${name}/${a.bone}: changed clinical placement`);
        for (let axis: number = 0; axis < 4; axis++)
          if (!nclose(a.rotation[axis]!, b.rotation[axis]!, 0)) defects.push(`${name}/${a.bone}: changed clinical rotation`);
      }
      if (after.clamped.length !== before.clamped.length) defects.push(`${name}: changed clamp population`);
      before.clamped.forEach((clamp: Skeleton.IClamp, index: number): void => {
        const actual: Skeleton.IClamp | undefined = after.clamped[index];
        if (actual === undefined || actual.path !== clamp.path || !nclose(actual.requested, clamp.requested, 0) || !nclose(actual.applied, clamp.applied, 0)) defects.push(`${name}: changed clinical clamp`);
      });
    }
    const first: Skeleton.IOutput = exterior({});
    const second: Skeleton.IOutput = exterior({});
    const source: Readonly<Foot.IOutput> = first.footSurface!;
    if (source !== second.footSurface || !Object.isFrozen(source) || !Object.isFrozen(source.left.hindfoot.courses[0]!.points[0])) defects.push(`${name}: source exterior is not safely reusable`);
    if (!throwsError((): void => { source.left.hindfoot.courses[0]!.points[0]![0] += 1; })) defects.push(`${name}: caller could mutate shared source data`);
    const original: number = second.posed[0]!.position[0];
    first.posed[0]!.position[0] = original + 1;
    if (!nclose(exterior({}).posed[0]!.position[0], original, 0) || !nclose(second.posed[0]!.position[0], original, 0)) defects.push(`${name}: aliased FK snapshot`);
  }
  TestValidator.equals("foot exterior preserves clinical rig and bounded ownership", defects, []);
}
