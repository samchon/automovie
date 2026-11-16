import {
  type combinePhysicalMassProperties,
  type resolveAutoMovieCenterOfMass,
  resolveAutoMovieMomentum as P,
} from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * Prepared interval momentum retains only endpoint-rotation algebra; current
 * seconds, mass, centres and inertia still determine each requested momentum.
 *
 * Scenarios:
 * 1. One part turns Z90 while translating (2,-1,0.5). Its spin is Iz*pi/2
 *    divided by the interval; changing only 0.5 to 1 second halves it and
 *    the linear momentum without a changed endpoint quaternion.
 * 2. Editing the same principal moment, endpoint quaternion, total mass and
 *    centre in place changes the respective physical answer. Returned
 *    vectors remain independent after caller mutation and later reads.
 * 3. Two equal point masses move oppositely along Y from X=-1 and X=1.
 *    Their orbital momentum is -2 about Z, doubles when their displacement
 *    doubles and doubles again when each actual part mass doubles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives SI frame/interval units, the independently derived spin and orbital equations, mutable dependencies and output ownership across three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public prepared interval reader on owned posed endpoints and model records, checking actual velocity/linear/angular vectors under independent mutations of seconds, inertia, quaternion, mass and centre, plus old-result isolation.
 * @evidence contracts/development/testing.md#independent-expectations The one-part centre eliminates orbital momentum and a cardinal Z turn has angular rate angle/seconds, so spin is Iz times that rate. Each point-mass cross product (-1,0.5,0) cross (0,1,0) contributes -1 about Z, giving the literal orbital answers. No ordinary momentum output provides an oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers same quaternion pair at changed intervals, same-record moment/quaternion/mass/centre mutations, returned-vector mutation, singleton versus two-part endpoints, pure spin versus pure orbit and changing the assembly population. General airborne integration error remains owned by existing physical tests.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns its physical models, endpoint parts and reader. It starts no process, viewer or compiler, replaces no foreign method and changes no accepted Human momentum, delta or contact bound.
 */
export function test_physics_prepared_momentum_intervals(): void {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const model: resolveAutoMovieCenterOfMass.IModel = {
    mass: 3,
    segments: [{ bone: "hips", mass: 3, point: { x: 0, y: 0, z: 0 },
      inertia: { x: 2, y: 3, z: 5 }, axes: { ...identity } }],
  };
  const before: P.IPosed = {
    centre: { x: 0, y: 0, z: 0 },
    parts: [part(3, { x: 0, y: 0, z: 0 }, { x: 2, y: 3, z: 5 }, identity)],
  };
  const after: P.IPosed = {
    centre: { x: 2, y: -1, z: 0.5 },
    parts: [part(3, { x: 2, y: -1, z: 0.5 }, { x: 2, y: 3, z: 5 },
      { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 })],
  };
  const read: ReturnType<typeof P.prepareIntervals> = P.prepareIntervals();
  const first: P.IMomentum = read(model, before, after, 0.5);
  TestValidator.predicate("translation plus cardinal spin over half a second",
    vclose(first.velocity, { x: 4, y: -2, z: 1 }, 1e-12) &&
    vclose(first.linear, { x: 12, y: -6, z: 3 }, 1e-12) &&
    vclose(first.angular, { x: 0, y: 0, z: 5 * Math.PI }, 1e-12),
  );
  const slower: P.IMomentum = read(model, before, after, 1);
  TestValidator.predicate("same endpoint pair obeys the current duration",
    vclose(slower.velocity, { x: 2, y: -1, z: 0.5 }, 1e-12) &&
    vclose(slower.linear, { x: 6, y: -3, z: 1.5 }, 1e-12) &&
    vclose(slower.angular, { x: 0, y: 0, z: 2.5 * Math.PI }, 1e-12),
  );
  before.parts[0]!.inertia.z = 7;
  after.parts[0]!.inertia.z = 7;
  model.segments[0]!.inertia.z = 7;
  TestValidator.predicate("changed inertia remains a current spin input",
    nclose(read(model, before, after, 1).angular.z, 3.5 * Math.PI, 1e-12),
  );
  after.parts[0]!.inertiaRotation.z = 1;
  after.parts[0]!.inertiaRotation.w = 0;
  TestValidator.predicate("mutated same endpoint quaternion invalidates its turn",
    nclose(read(model, before, after, 1).angular.z, 7 * Math.PI, 1e-12),
  );
  model.mass = 6;
  model.segments[0]!.mass = 6;
  before.parts[0]!.mass = 6;
  after.parts[0]!.mass = 6;
  after.centre.x = 4;
  after.parts[0]!.centerOfMass.x = 4;
  TestValidator.predicate("current total mass and endpoint centre determine linear momentum",
    vclose(read(model, before, after, 1).linear, { x: 24, y: -6, z: 3 }, 1e-12),
  );
  first.angular.z = 123;
  first.linear.x = 456;
  read(model, before, after, 1);
  TestValidator.predicate("earlier output remains owned and other outputs remain independent",
    nclose(first.angular.z, 123, 0) && nclose(first.linear.x, 456, 0) &&
    vclose(slower.angular, { x: 0, y: 0, z: 2.5 * Math.PI }, 1e-12),
  );

  const pair: resolveAutoMovieCenterOfMass.IModel = {
    mass: 2,
    segments: ["hips", "chest"].map((bone: string): resolveAutoMovieCenterOfMass.ISegment => ({
      bone: bone as "hips" | "chest", mass: 1, point: { x: 0, y: 0, z: 0 },
      inertia: { x: 0, y: 0, z: 0 }, axes: { ...identity },
    })),
  };
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const start: P.IPosed = { centre: { ...zero }, parts: [
    part(1, { x: -1, y: 0, z: 0 }, zero, identity),
    part(1, { x: 1, y: 0, z: 0 }, zero, identity),
  ] };
  const end: P.IPosed = { centre: { ...zero }, parts: [
    part(1, { x: -1, y: 1, z: 0 }, zero, identity),
    part(1, { x: 1, y: -1, z: 0 }, zero, identity),
  ] };
  TestValidator.predicate("opposite point-mass travel has physical orbital momentum",
    vclose(read(pair, start, end, 1).angular, { x: 0, y: 0, z: -2 }, 1e-12),
  );
  end.parts[0]!.centerOfMass.y = 2;
  end.parts[1]!.centerOfMass.y = -2;
  TestValidator.predicate("changed centres cannot reuse orbital momentum",
    vclose(read(pair, start, end, 1).angular, { x: 0, y: 0, z: -4 }, 1e-12),
  );
  pair.mass = 4;
  for (let i: number = 0; i < 2; i++) {
    pair.segments[i]!.mass = 2;
    start.parts[i]!.mass = 2;
    end.parts[i]!.mass = 2;
  }
  TestValidator.predicate("changed actual part masses cannot reuse orbital momentum",
    vclose(read(pair, start, end, 1).angular, { x: 0, y: 0, z: -8 }, 1e-12),
  );
}

/** Copy owned rigid-part SI data into one posed endpoint. */
function part(mass: number, centre: IAutoMovieVector3, inertia: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion): combinePhysicalMassProperties.IPart {
  return { mass, centerOfMass: { ...centre }, inertia: { ...inertia }, inertiaRotation: { ...rotation } };
}
