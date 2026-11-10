import {
  Quaternion,
  collectPhysicalSupports as collect,
  physicalNativeShape,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieFootfallPattern as Pattern,
  IAutoMovieContactReceipt as Receipt,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import RAPIER, {
  type Collider,
  type RigidBody,
  type TempContactManifold,
  type World,
} from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Support witnesses must be touching upward native constraints, with the actual solver friction.
 *
 * Scenarios:
 * 1. Both collider insertion orders admit top-floor contacts and refuse underside contacts.
 * 2. A tilted box with touching and predictive points admits only the touching points.
 * 3. A native Max friction rule survives collection instead of becoming a guessed average.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `collectPhysicalSupports`, `physicalNativeShape` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; 3 numbered scenarios (first: Both collider insertion orders admit top-floor contacts and refuse underside contacts.; last: A native Max friction rule survives collection instead of becoming a guessed average.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Both collider insertion orders admit top-floor contacts and refuse underside contacts.; last: A native Max friction rule survives collection instead of becoming a guessed average.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_witnesses`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Both collider insertion orders admit top-floor contacts and refuse underside contacts.).
 */
export async function test_physical_support_witnesses(): Promise<void> {
  await RAPIER.init();
  const findings: string[] = [];
  for (const underside of [false, true])
    for (const floorFirst of [false, true])
      inspect(underside, floorFirst, false);
  inspect(false, true, true);
  TestValidator.equals(
    "actual oriented touching solver witnesses",
    findings,
    [],
  );

  /** Inspect native data outside world.step; no borrowed manifold escapes its callback. */
  function inspect(
    underside: boolean,
    floorFirst: boolean,
    predictive: boolean,
  ): void {
    const profile: P = PhysicalFixtures.sphere();
    const segment: P.ISegment = profile.segments[0]!;
    segment.shapes = [
      {
        id: "box",
        material: "solid",
        kind: "box",
        halfExtents: { x: 0.2, y: 0.1, z: 0.2 },
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
      },
    ];
    segment.inertia = { x: 1 / 60, y: 2 / 75, z: 1 / 60 };
    profile.materials[0]!.friction = 0.9;
    const pattern: Pattern = {
      id: "one-box",
      minimumSupports: 0,
      limbs: [
        {
          bone: "root",
          chain: ["root"],
          localPoint: { x: 0, y: -0.1, z: 0 },
          phase: 0,
          duty: 1,
          offset: { forward: 0, left: 0 },
          stride: [],
        },
      ],
    };
    const world: World = new RAPIER.World({ x: 0, y: 0, z: 0 });
    try {
      world.timestep = 1 / 960;
      world.integrationParameters.normalizedPredictionDistance = predictive
        ? 0.05
        : 0;
      const rigid: RigidBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(0, underside ? -1.099 : predictive ? 0.1 : 0.099, 0)
          .setRotation(
            Quaternion.fromAxisAngle(
              { x: 0, y: 0, z: 1 },
              predictive ? 1.2 : 0,
            ),
          )
          .setAdditionalMassProperties(
            segment.mass,
            segment.centerOfMass,
            segment.inertia,
            segment.inertiaRotation,
          ),
      );
      const floorDescriptor: RAPIER.ColliderDesc = RAPIER.ColliderDesc.cuboid(
        2,
        0.5,
        2,
      )
        .setTranslation(0, -0.5, 0)
        .setFriction(0.7)
        .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Max);
      const sourceDescriptor: RAPIER.ColliderDesc = new RAPIER.ColliderDesc(
        physicalNativeShape(segment.shapes[0]!),
      )
        .setDensity(0)
        .setFriction(0.9);
      const floor: Collider | undefined = floorFirst
        ? world.createCollider(floorDescriptor)
        : undefined;
      const source: Collider = world.createCollider(sourceDescriptor, rigid);
      const ground: Collider = floor ?? world.createCollider(floorDescriptor);
      world.step();
      const points: V[] = [];
      let separated: number = 0;
      let friction: number = 0;
      let manifolds: number = 0;
      world.narrowPhase.contactPair(
        source.handle,
        ground.handle,
        world.bodies,
        (manifold: TempContactManifold, flipped: boolean): void => {
          manifolds++;
          const normalY: number = manifold.normal().y * (flipped ? -1 : 1);
          friction = manifold.friction();
          for (
            let index: number = 0;
            index < manifold.numSolverContacts();
            index++
          ) {
            if (manifold.solverContactDist(index) > 0) {
              separated++;
              continue;
            }
            const point: V | null = manifold.solverContactPoint(index);
            if (normalY < -0.5 && point) points.push({ ...point });
          }
        },
      );
      const identities: Map<number, Receipt["a"]> = new Map([
        [
          source.handle,
          { body: "box", bone: "root", shape: "box", material: "solid" },
        ],
        [
          ground.handle,
          { body: "floor", bone: "floor", shape: "floor", material: "floor" },
        ],
      ]);
      const actual: ReturnType<typeof collect> = collect({
        world,
        body: "box",
        profile,
        pattern,
        segments: new Map([["root", rigid]]),
        colliders: identities,
        contacts: [],
        seconds: 1 / 960,
        dt: 1 / 960,
      });
      const label: string = JSON.stringify({
        underside,
        floorFirst,
        predictive,
      });
      if (!manifolds || (!underside && !points.length))
        findings.push(
          `${label}: native fixture did not establish the intended contact`,
        );
      if (predictive && !separated)
        findings.push(
          `${label}: native fixture did not retain a positive-distance predictive point`,
        );
      const expected: string[] = [
        ...new Set(points.map((point: V): string => JSON.stringify(point))),
      ].sort((a: string, b: string): number => a.localeCompare(b));
      const observed: string[] = actual
        .flatMap((support: (typeof actual)[number]): string[] =>
          support.samples.map(
            (sample: (typeof support.samples)[number]): string =>
              JSON.stringify(sample.point),
          ),
        )
        .sort((a: string, b: string): number => a.localeCompare(b));
      if (JSON.stringify(expected) !== JSON.stringify(observed))
        findings.push(
          `${label}: non-supporting or predictive witnesses admitted ${JSON.stringify({ expected, observed })}`,
        );
      if (
        actual.some((support: (typeof actual)[number]): boolean =>
          support.samples.some(
            (sample: (typeof support.samples)[number]): boolean =>
              Math.abs(sample.friction - friction) > 1e-12,
          ),
        )
      )
        findings.push(
          `${label}: native combined friction ${friction} replaced`,
        );
    } finally {
      world.free();
    }
  }
}
