import type {
  IAutoMovieEffectRecipe,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";
import * as THREE from "three";

import type { AutoMoviePhysicsCache as Cache } from "../../../../packages/engine/src/physics/AutoMoviePhysicsCache";
import { compileImpactEffects } from "../../../../packages/engine/src/physics/compileImpactEffects";
import { sampleContactSurfaceResponse } from "../../../../packages/engine/src/physics/sampleContactSurfaceResponse";
import { AutoMovieHumanContactAppearance as Appearance } from "../../../../packages/human/src/appearance/AutoMovieHumanContactAppearance";
import { createAutoMoviePerformanceOverlay } from "../../../../packages/viewer/src/createAutoMoviePerformanceOverlay";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Every contact consumer retains geometric versus solved impulse authority.
 *
 * Scenarios:
 * 1. Legitimate geometric contacts require explicit formula estimates.
 * 2. Numeric aggregate or sample fields cannot bypass that boundary.
 * 3. The actual drawable overlay emits force lines only for positive solver samples.
 */
export function test_physical_receipt_authority(): void {
  const receipt: Receipt = {
    id: "touch",
    source: "geometric",
    seconds: 1,
    endSeconds: 1,
    a: { body: "person", bone: "root", shape: "surface", material: "solid" },
    b: { body: "other", bone: "root", shape: "surface", material: "solid" },
    point: { x: 0.1, y: 1, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    impulse: null,
    separation: 0,
    compression: 0,
  };
  const recipe: IAutoMovieEffectRecipe = {
    id: "formula-spray",
    kind: "spray",
    seed: 1,
    emission: { rate: 0, burst: 1, duration: 0.1 },
    particle: {
      lifetime: { min: 1, max: 1 },
      size: { min: 0.01, max: 0.01 },
      color: "#335577",
      opacity: { min: 1, max: 1 },
    },
    motion: { wind: { x: 0, y: 0, z: 0 }, rise: 0, turbulence: 0 },
    budget: { maxParticles: 10, lodDistance: 100 },
    blend: "alpha",
  };
  const emit: (
    value: Receipt,
    estimates: Record<string, number>,
  ) => ReturnType<typeof compileImpactEffects> = (
    value: Receipt,
    estimates: Record<string, number>,
  ): ReturnType<typeof compileImpactEffects> =>
    compileImpactEffects({
      contacts: [value],
      geometricImpulses: estimates,
      recipe,
      endSeconds: 3,
      fixedStepSeconds: 1 / 120,
      particlesPerImpulse: 1,
      speedPerImpulse: 1,
      upwardFraction: 0,
      maximumEffects: 4,
    });
  const surface: (
    value: Receipt,
    estimates: Record<string, number>,
  ) => number = (value: Receipt, estimates: Record<string, number>): number =>
    sampleContactSurfaceResponse({
      contacts: [value],
      seconds: 1,
      point: receipt.point,
      center: (event: Receipt): Receipt["point"] => event.point,
      radius: 0.2,
      weightPerImpulse: 0.1,
      decaySeconds: Infinity,
      geometricImpulses: estimates,
    });
  const skin: (
    value: Receipt,
    estimates: Record<string, number>,
  ) => Appearance.ISample = (
    value: Receipt,
    estimates: Record<string, number>,
  ): Appearance.ISample =>
    Appearance.prepare({
      body: "person",
      contacts: [value],
      frameAt: (): ReturnType<
        typeof PhysicalFixtures.sphere
      >["segments"][number]["neutral"] =>
        PhysicalFixtures.sphere().segments[0]!.neutral,
      materials: ["solid"],
      radius: 0.2,
      weightPerImpulse: 0.1,
      color: [0.5, 0.5, 0.5],
      decaySeconds: Infinity,
      compressionSeconds: 0.1,
      geometricImpulses: estimates,
    })("root", { x: 0.1, y: 0, z: 0 }, 1);
  const consumers: ((
    value: Receipt,
    estimates: Record<string, number>,
  ) => unknown)[] = [emit, surface, skin];
  const estimates: Record<string, number> = { touch: 1 };
  TestValidator.predicate(
    "formula-only geometry still produces declared appearance",
    emit(receipt, estimates).length === 1 &&
      surface(receipt, estimates) > 0 &&
      skin(receipt, estimates).color[0] < 1,
  );
  for (const consume of consumers)
    assert.throws((): unknown => consume(receipt, {}), /impulse/);
  const numeric: Receipt = { ...structuredClone(receipt), impulse: 100 };
  const sampled: Receipt = {
    ...structuredClone(receipt),
    samples: [
      {
        seconds: 1,
        duration: 1 / 120,
        impulse: 100,
        point: { ...receipt.point },
        normal: { ...receipt.normal },
        separation: 0,
        compression: 0,
      },
    ],
  };
  for (const invalid of [numeric, sampled])
    for (const consume of consumers)
      assert.throws((): unknown => consume(invalid, estimates), /Geometric/);
  const overlay: ReturnType<typeof createAutoMoviePerformanceOverlay> =
    createAutoMoviePerformanceOverlay({
      bodies: [
        { id: "person", profile: PhysicalFixtures.sphere() },
        { id: "other", profile: PhysicalFixtures.sphere() },
      ],
      maximumContacts: 4,
      metresPerNewton: 0.01,
    });
  const segment: Cache.ISegment = {
    position: { x: 0, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
  };
  const frame: Cache.IFrame = {
    seconds: 1,
    bodies: {
      person: { root: segment },
      other: {
        root: { ...structuredClone(segment), position: { x: 0.2, y: 1, z: 0 } },
      },
    },
  };
  const drawnLines: () => number = (): number => {
    let vertices: number = 0;
    overlay.object.traverse((object: THREE.Object3D): void => {
      if (object instanceof THREE.LineSegments)
        vertices += Math.min(
          object.geometry.drawRange.count,
          object.geometry.getAttribute("position").count,
        );
    });
    return vertices;
  };
  try {
    overlay.update(frame, [sampled]);
    TestValidator.equals(
      "geometric numeric samples draw no force",
      drawnLines(),
      0,
    );
    const solved: Receipt = {
      ...structuredClone(sampled),
      source: "solver",
      impulse: 100,
    };
    overlay.update(frame, [solved]);
    TestValidator.equals(
      "positive solved sample draws a real force line",
      drawnLines(),
      2,
    );
  } finally {
    overlay.dispose();
  }
  const policy: Parameters<typeof Appearance.prepare>[0] = {
    body: "person",
    contacts: [receipt],
    frameAt: (): ReturnType<
      typeof PhysicalFixtures.sphere
    >["segments"][number]["neutral"] =>
      PhysicalFixtures.sphere().segments[0]!.neutral,
    materials: ["solid"],
    radius: 0.2,
    weightPerImpulse: 0.1,
    color: [0.5, 0.5, 0.5],
    decaySeconds: Infinity,
    compressionSeconds: 0.1,
    geometricImpulses: { touch: 1 },
  };
  for (const color of [
    [],
    [1, 1],
    [1, 1, 1, 1],
    new Array<number>(3),
    [1, NaN, 1],
  ])
    assert.throws(
      (): ReturnType<typeof Appearance.prepare> =>
        Appearance.prepare({
          ...policy,
          color: color as [number, number, number],
        }),
      /appearance policy/,
    );
  const prepared: ReturnType<typeof Appearance.prepare> =
    Appearance.prepare(policy);
  const before: Appearance.ISample = prepared(
    "root",
    { x: 0.1, y: 0, z: 0 },
    1,
  );
  policy.color[0] = NaN;
  policy.radius = NaN;
  policy.weightPerImpulse = NaN;
  policy.decaySeconds = NaN;
  policy.compressionSeconds = NaN;
  assert.equal(
    JSON.stringify(prepared("root", { x: 0.1, y: 0, z: 0 }, 1)),
    JSON.stringify(before),
  );
}
