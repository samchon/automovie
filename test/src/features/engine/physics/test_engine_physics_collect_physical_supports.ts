import {
  type AutoMovieEngineXpbdBody,
  type AutoMovieEngineXpbdCollider,
  AutoMovieEngineXpbdWorld,
  AutoMovieEnginePhysicalSupportCollector as Collector,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieFootfallPattern as Pattern,
  IAutoMovieContactReceipt as Receipt,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../internal/PhysicalFixtures";
import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * Floor friction of these cases: unlike the binding's 0.7, so a guessed
 * coefficient cannot pass.
 */
const FLOOR_FRICTION: number = 0.3;

/** Friction of the box's material. */
const BOX_FRICTION: number = 0.9;

/**
 * `AutoMovieEnginePhysicalSupportCollector` reads a body's supports from one solver step: the
 * floor points that step's manifold found pressing under a downward-facing
 * normal, with the pair's own combined friction, and a support loaded only by a
 * positive floor impulse.
 *
 * Scenarios, one step of 1/960 s:
 *
 * 1. Both collider creation orders admit contacts on the floor's top face and
 *    refuse contacts on its underside.
 * 2. A box a kinematic lifter turns during the step keeps every floor point the
 *    step found pressing, read where the contact was found.
 * 3. Every sample carries the pair's combined friction, the mean of 0.9 and 0.3.
 * 4. A sphere resting half the allowed error deep under an upward force that
 *    cancels gravity is collected unloaded; without the force it is loaded.
 */
export async function test_engine_physics_collect_physical_supports(): Promise<void> {
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
  TestValidator.equals("loaded only by a positive impulse", landing(), [
    false,
    true,
  ]);

  /** Step one world and compare the collected samples with its floor manifold. */
  function inspect(
    underside: boolean,
    floorFirst: boolean,
    lifted: boolean,
  ): void {
    const profile: P = PhysicalFixtures.sphere();
    const segment: IAutoMoviePhysicalSegment = profile.segments[0]!;
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
    profile.materials[0]!.friction = BOX_FRICTION;
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
    const world: AutoMovieEngineXpbdWorld = new AutoMovieEngineXpbdWorld({
      x: 0,
      y: 0,
      z: 0,
    });
    world.timestep = 1 / 960;
    world.contactFrequency = 240;
    const rigid: AutoMovieEngineXpbdBody = world.createBody(true, {
      // The lifted box starts 10 mm into the floor, so the floor and the lifter
      // both act on it in the same step.
      position: { x: 0, y: underside ? -1.099 : lifted ? 0.09 : 0.099, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    });
    rigid.setMass(
      segment.mass,
      segment.centerOfMass,
      segment.inertia,
      segment.inertiaRotation,
    );
    const ground: () => AutoMovieEngineXpbdCollider = (): AutoMovieEngineXpbdCollider =>
      world.createCollider(
        world.createBody(false, {
          position: { x: 0, y: -0.5, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        }),
        box("floor", { x: 2, y: 0.5, z: 2 }),
        FLOOR_FRICTION,
        0,
        false,
      );
    const early: AutoMovieEngineXpbdCollider | undefined = floorFirst
      ? ground()
      : undefined;
    const source: AutoMovieEngineXpbdCollider = world.createCollider(
      rigid,
      segment.shapes[0]!,
      BOX_FRICTION,
      0,
      false,
    );
    const floor: AutoMovieEngineXpbdCollider = early ?? ground();

    // A kinematic lifter under the box's +x end pushes that end up, which
    // turns the box about z and presses its -x end into the floor.
    if (lifted)
      world.createCollider(
        world.createBody(false, {
          position: { x: 0.15, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        }),
        box("lifter", { x: 0.05, y: 0.05, z: 0.25 }),
        0,
        0,
        false,
      );
    world.step();
    const manifold: AutoMovieEngineXpbdWorld.IManifold | undefined = world
      .manifolds()
      .find(
        (candidate: AutoMovieEngineXpbdWorld.IManifold): boolean =>
          (candidate.a === source && candidate.b === floor) ||
          (candidate.a === floor && candidate.b === source),
      );
    const downward: boolean =
      manifold !== undefined &&
      manifold.normal.y * (manifold.a === source ? 1 : -1) < -0.5;
    const pressing: V[] =
      manifold && downward
        ? manifold.points
            .filter(
              (point: AutoMovieEngineXpbdWorld.IManifoldPoint): boolean =>
                point.separation <= 0,
            )
            .map((point: AutoMovieEngineXpbdWorld.IManifoldPoint): V => point.point)
        : [];
    const identities: Map<number, Receipt["a"]> = new Map([
      [
        source.handle,
        { body: "box", bone: "root", shape: "box", material: "solid" },
      ],
      [
        floor.handle,
        { body: "floor", bone: "floor", shape: "floor", material: "floor" },
      ],
    ]);
    const actual: ReturnType<typeof Collector.collect> = Collector.collect({
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
    const label: string = JSON.stringify({ underside, floorFirst, lifted });
    if (!manifold || (!underside && !pressing.length))
      findings.push(
        `${label}: the fixture did not establish the intended contact ${JSON.stringify(
          {
            normal: manifold?.normal,
            separations: manifold?.points.map(
              (point: AutoMovieEngineXpbdWorld.IManifoldPoint): number =>
                point.separation,
            ),
            points: manifold?.points.map(
              (point: AutoMovieEngineXpbdWorld.IManifoldPoint): V => point.point,
            ),
          },
        )}`,
      );
    const expected: string[] = [
      ...new Set(pressing.map((point: V): string => JSON.stringify(point))),
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
        `${label}: non-supporting witnesses admitted or pressing ones dropped ${JSON.stringify({ expected, observed })}`,
      );
    const combined: number = (BOX_FRICTION + FLOOR_FRICTION) / 2;
    for (const support of actual)
      for (const sample of support.samples)
        if (Math.abs(sample.friction - combined) > PhysicalTolerance.ROUNDING)
          findings.push(
            `${label}: combined friction ${combined} replaced by ${sample.friction}`,
          );
  }
}

/** Contact depth the world leaves uncorrected in the landing case, metres. */
const ALLOWED: number = 1e-5;

/**
 * Whether a resting sphere's one support is loaded, with gravity cancelled by
 * an upward force and then without it.
 */
function landing(): boolean[] {
  const profile: P = PhysicalFixtures.sphere(0.125);
  profile.segments[0]!.neutral.position.y = 0.125;
  profile.centerOfMass.y = 0.125;
  const pattern: Pattern = {
    id: "one-carrier",
    minimumSupports: 0,
    limbs: [
      {
        bone: "root",
        chain: ["root"],
        localPoint: { x: 0, y: -0.125, z: 0 },
        phase: 0,
        duty: 1,
        offset: { forward: 0, left: 0 },
        stride: [],
      },
    ],
  };
  const world: AutoMovieEngineXpbdWorld = new AutoMovieEngineXpbdWorld({
    x: 0,
    y: -9.81,
    z: 0,
  });
  world.timestep = 1 / 960;
  world.allowedError = ALLOWED;
  const rigid: AutoMovieEngineXpbdBody = world.createBody(true, {
    position: { x: 0, y: 0.125 - ALLOWED / 2, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  rigid.setMass(
    1,
    { x: 0, y: 0, z: 0 },
    profile.segments[0]!.inertia,
    profile.segments[0]!.inertiaRotation,
  );
  const source: AutoMovieEngineXpbdCollider = world.createCollider(
    rigid,
    profile.segments[0]!.shapes[0]!,
    0,
    0,
    false,
  );
  const floor: AutoMovieEngineXpbdCollider = world.createCollider(
    world.createBody(false, {
      position: { x: 0, y: -0.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    }),
    box("floor", { x: 2, y: 0.5, z: 2 }),
    0.7,
    0,
    false,
  );
  const colliders: Map<number, Receipt["a"]> = new Map([
    [
      source.handle,
      { body: "assembly", bone: "root", shape: "surface", material: "solid" },
    ],
    [
      floor.handle,
      { body: "floor", bone: "floor", shape: "floor", material: "floor" },
    ],
  ]);
  rigid.addForce({ x: 0, y: 9.81, z: 0 });
  const loaded: boolean[] = [];
  for (const tick of [1, 2]) {
    if (tick === 2) rigid.resetForces();
    world.step();
    const supports = Collector.collect({
      world,
      body: "assembly",
      profile,
      pattern,
      segments: new Map([["root", rigid]]),
      colliders,
      contacts: [],
      seconds: tick / 960,
      dt: 1 / 960,
    });
    loaded.push(
      supports.length === 1 &&
        supports[0]!.samples.length > 0 &&
        supports[0]!.samples.every((point) => point.carrier === "root") &&
        supports[0]!.loaded,
    );
  }
  return loaded;
}

/** A box shape of the given half extents centred on its body. */
function box(id: string, halfExtents: V): IAutoMoviePhysicalShape {
  return {
    id,
    material: id,
    kind: "box",
    halfExtents,
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  };
}
