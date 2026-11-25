import {
  prepareAutoMovieMassModel as M,
  resolveAutoMovieMomentum as P,
  physicalInertiaTensor,
} from "@automovie/engine";
import type {
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * Prepared interval momentum retains only endpoint-rotation algebra; current
 * seconds, mass, centres and inertia still determine each requested momentum.
 *
 * Scenarios:
 *
 * 1. One part turns Z90 while translating (2,-1,0.5). Its spin is Iz*pi/2 divided
 *    by the interval; changing only 0.5 to 1 second halves it and the linear
 *    momentum without a changed endpoint quaternion.
 * 2. Editing the same principal moment, endpoint quaternion, total mass and centre
 *    in place changes the respective physical answer. Returned vectors remain
 *    independent after caller mutation and later reads.
 * 3. Two equal point masses move oppositely along Y from X=-1 and X=1. Their
 *    orbital momentum is -2 about Z, doubles when their displacement doubles
 *    and doubles again when each actual part mass doubles.
 * 4. One origin-centred part has principal moments(2,3,4). The outer X1rad
 *    interval over1s gives angular momentum2X; one getter-triggered nested
 *    Z0.5rad interval over0.25s gives8Z. The same fixture exercises the
 *    prepared tensor's spin, prepared intervals and mass-model consumer. Each
 *    outer result survives its nested query; an owned getter exception
 *    propagates unchanged and the next query retains the numeric answer without
 *    more live-moment reads than its ordinary positive baseline.
 */
export function test_unit_engine_physics_resolve_momentum_intervals(): void {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 3,
    segments: [
      {
        bone: "hips",
        mass: 3,
        point: { x: 0, y: 0, z: 0 },
        inertia: { x: 2, y: 3, z: 5 },
        axes: { ...identity },
      },
    ],
  };
  const before: P.IPosed = {
    centre: { x: 0, y: 0, z: 0 },
    parts: [part(3, { x: 0, y: 0, z: 0 }, { x: 2, y: 3, z: 5 }, identity)],
  };
  const after: P.IPosed = {
    centre: { x: 2, y: -1, z: 0.5 },
    parts: [
      part(
        3,
        { x: 2, y: -1, z: 0.5 },
        { x: 2, y: 3, z: 5 },
        { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
      ),
    ],
  };
  const read: ReturnType<typeof P.prepareIntervals> = P.prepareIntervals();
  const first: P.IMomentum = read(model, before, after, 0.5);
  TestValidator.predicate(
    "translation plus cardinal spin over half a second",
    vclose(first.velocity, { x: 4, y: -2, z: 1 }, 1e-12) &&
      vclose(first.linear, { x: 12, y: -6, z: 3 }, 1e-12) &&
      vclose(first.angular, { x: 0, y: 0, z: 5 * Math.PI }, 1e-12),
  );
  const slower: P.IMomentum = read(model, before, after, 1);
  TestValidator.predicate(
    "same endpoint pair obeys the current duration",
    vclose(slower.velocity, { x: 2, y: -1, z: 0.5 }, 1e-12) &&
      vclose(slower.linear, { x: 6, y: -3, z: 1.5 }, 1e-12) &&
      vclose(slower.angular, { x: 0, y: 0, z: 2.5 * Math.PI }, 1e-12),
  );
  before.parts[0]!.inertia.z = 7;
  after.parts[0]!.inertia.z = 7;
  model.segments[0]!.inertia.z = 7;
  TestValidator.predicate(
    "changed inertia remains a current spin input",
    nclose(read(model, before, after, 1).angular.z, 3.5 * Math.PI, 1e-12),
  );
  after.parts[0]!.inertiaRotation.z = 1;
  after.parts[0]!.inertiaRotation.w = 0;
  TestValidator.predicate(
    "mutated same endpoint quaternion invalidates its turn",
    nclose(read(model, before, after, 1).angular.z, 7 * Math.PI, 1e-12),
  );
  model.mass = 6;
  model.segments[0]!.mass = 6;
  before.parts[0]!.mass = 6;
  after.parts[0]!.mass = 6;
  after.centre.x = 4;
  after.parts[0]!.centerOfMass.x = 4;
  TestValidator.predicate(
    "current total mass and endpoint centre determine linear momentum",
    vclose(read(model, before, after, 1).linear, { x: 24, y: -6, z: 3 }, 1e-12),
  );
  first.angular.z = 123;
  first.linear.x = 456;
  read(model, before, after, 1);
  TestValidator.predicate(
    "earlier output remains owned and other outputs remain independent",
    nclose(first.angular.z, 123, 0) &&
      nclose(first.linear.x, 456, 0) &&
      vclose(slower.angular, { x: 0, y: 0, z: 2.5 * Math.PI }, 1e-12),
  );

  const pair: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 2,
    segments: ["hips", "chest"].map(
      (bone: string): IAutoMovieResolveCenterOfMass.ISegment => ({
        bone: bone as "hips" | "chest",
        mass: 1,
        point: { x: 0, y: 0, z: 0 },
        inertia: { x: 0, y: 0, z: 0 },
        axes: { ...identity },
      }),
    ),
  };
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const start: P.IPosed = {
    centre: { ...zero },
    parts: [
      part(1, { x: -1, y: 0, z: 0 }, zero, identity),
      part(1, { x: 1, y: 0, z: 0 }, zero, identity),
    ],
  };
  const end: P.IPosed = {
    centre: { ...zero },
    parts: [
      part(1, { x: -1, y: 1, z: 0 }, zero, identity),
      part(1, { x: 1, y: -1, z: 0 }, zero, identity),
    ],
  };
  TestValidator.predicate(
    "opposite point-mass travel has physical orbital momentum",
    vclose(read(pair, start, end, 1).angular, { x: 0, y: 0, z: -2 }, 1e-12),
  );
  end.parts[0]!.centerOfMass.y = 2;
  end.parts[1]!.centerOfMass.y = -2;
  TestValidator.predicate(
    "changed centres cannot reuse orbital momentum",
    vclose(read(pair, start, end, 1).angular, { x: 0, y: 0, z: -4 }, 1e-12),
  );
  pair.mass = 4;
  for (let i: number = 0; i < 2; i++) {
    pair.segments[i]!.mass = 2;
    start.parts[i]!.mass = 2;
    end.parts[i]!.mass = 2;
  }
  TestValidator.predicate(
    "changed actual part masses cannot reuse orbital momentum",
    vclose(read(pair, start, end, 1).angular, { x: 0, y: 0, z: -8 }, 1e-12),
  );
  reentrantReaders();
}

/**
 * Share one independent spin model across the three real synchronous workspace
 * owners.
 */
function reentrantReaders(): void {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const moments: IAutoMovieVector3 = { x: 2, y: 3, z: 4 };
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 1,
    segments: [
      {
        bone: "hips",
        mass: 1,
        point: origin,
        inertia: moments,
        axes: identity,
      },
    ],
  };
  let enter: (() => void) | undefined;
  let momentReads: number = 0;
  const first: IAutoMovieCombinePhysicalMassProperties.IPart = {
    get mass(): number {
      const callback: (() => void) | undefined = enter;
      enter = undefined;
      callback?.();
      return 1;
    },
    centerOfMass: origin,
    inertiaRotation: identity,
    inertia: {
      get x(): number {
        momentReads++;
        return 2;
      },
      y: 3,
      z: 4,
    },
  };
  const before: P.IPosed = { centre: origin, parts: [first] };
  const after: P.IPosed = {
    centre: origin,
    parts: [
      part(1, origin, moments, {
        x: Math.sin(0.5),
        y: 0,
        z: 0,
        w: Math.cos(0.5),
      }),
    ],
  };
  const nestedBefore: P.IPosed = {
    centre: origin,
    parts: [part(1, origin, moments, identity)],
  };
  const nestedAfter: P.IPosed = {
    centre: origin,
    parts: [
      part(1, origin, moments, {
        x: 0,
        y: 0,
        z: Math.sin(0.25),
        w: Math.cos(0.25),
      }),
    ],
  };
  const tensor: ReturnType<typeof physicalInertiaTensor.prepare> =
    physicalInertiaTensor.prepare();
  const interval: ReturnType<typeof P.prepareIntervals> = P.prepareIntervals();
  const prepared: M.IPrepared = M(model);
  const findings: string[] = [];
  const readers: readonly {
    name: string;
    outer: () => IAutoMovieVector3;
    nested: () => IAutoMovieVector3;
  }[] = [
    {
      name: "tensor spin",
      outer: (): IAutoMovieVector3 =>
        tensor.spin(
          before.parts,
          0,
          { x: Math.sin(0.25), y: 0, z: 0, w: Math.cos(0.25) },
          { x: 1, y: 0, z: 0 },
        ),
      nested: (): IAutoMovieVector3 =>
        tensor.spin(
          nestedBefore.parts,
          0,
          { x: 0, y: 0, z: Math.sin(0.125), w: Math.cos(0.125) },
          { x: 0, y: 0, z: 2 },
        ),
    },
    {
      name: "momentum interval",
      outer: (): IAutoMovieVector3 => interval(model, before, after, 1).angular,
      nested: (): IAutoMovieVector3 =>
        interval(model, nestedBefore, nestedAfter, 0.25).angular,
    },
    {
      name: "mass model",
      outer: (): IAutoMovieVector3 =>
        M.between(prepared, before, after, 1).angular,
      nested: (): IAutoMovieVector3 =>
        M.between(prepared, nestedBefore, nestedAfter, 0.25).angular,
    },
  ];
  try {
    for (const reader of readers) {
      let baseline: number = 0;
      try {
        momentReads = 0;
        const ordinary: IAutoMovieVector3 = reader.outer();
        baseline = momentReads;
        if (!(baseline > 0 && vclose(ordinary, { x: 2, y: 0, z: 0 }, 1e-12)))
          findings.push(
            `${reader.name}: ordinary positive-work control is wrong`,
          );
        let visits: number = 0;
        let nested: IAutoMovieVector3 | undefined;
        enter = (): void => {
          visits++;
          nested = reader.nested();
        };
        const outer: IAutoMovieVector3 = reader.outer();
        if (
          !(
            visits === 1 &&
            nested !== undefined &&
            vclose(nested, { x: 0, y: 0, z: 8 }, 1e-12) &&
            vclose(outer, { x: 2, y: 0, z: 0 }, 1e-12)
          )
        )
          findings.push(
            `${reader.name}: nested and outer physical spins interfered`,
          );
      } catch (error) {
        findings.push(
          `${reader.name}: nested public query failed: ${String(error)}`,
        );
      } finally {
        enter = undefined;
      }
      const failure: Error = new Error(
        `owned ${reader.name} input getter failure`,
      );
      let thrown: unknown;
      enter = (): void => {
        throw failure;
      };
      try {
        reader.outer();
      } catch (error) {
        thrown = error;
      } finally {
        enter = undefined;
      }
      if (thrown !== failure)
        findings.push(`${reader.name}: lost the owned getter failure identity`);
      try {
        momentReads = 0;
        const recovered: IAutoMovieVector3 = reader.outer();
        if (
          !(
            vclose(recovered, { x: 2, y: 0, z: 0 }, 1e-12) &&
            momentReads > 0 &&
            momentReads <= baseline
          )
        )
          findings.push(
            `${reader.name}: post-throw result/work did not recover, live reads ${momentReads}, ordinary ${baseline}`,
          );
      } catch (error) {
        findings.push(
          `${reader.name}: post-throw public query failed: ${String(error)}`,
        );
      }
    }
  } finally {
    enter = undefined;
    M.release(prepared);
  }
  TestValidator.equals(
    "all three prepared consumers retain reentrant and post-throw semantics",
    findings,
    [],
  );
}

/** Copy owned rigid-part SI data into one posed endpoint. */
function part(
  mass: number,
  centre: IAutoMovieVector3,
  inertia: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
): IAutoMovieCombinePhysicalMassProperties.IPart {
  return {
    mass,
    centerOfMass: { ...centre },
    inertia: { ...inertia },
    inertiaRotation: { ...rotation },
  };
}
