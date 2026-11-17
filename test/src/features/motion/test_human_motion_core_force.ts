import type { IAutoMovieMotionHumanForce, IAutoMovieInteractionEvent, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "@automovie/engine";

import { HumanForce } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Forces as performance input and hits as impulses (#3429): `HumanForce`.
 *
 * Scenarios:
 * 1. A blast's record carrying its own impulse yields that impulse unchanged,
 *    on the struck person, at the record's second and region.
 * 2. A stick (exit zero) delivers the striker's whole momentum `m v`; a
 *    pass delivers what the striker lost, `m (v - exit)`; within 1e-12.
 * 3. With no exit, a record with the struck surface's outward normal yields
 *    the two-mass normal impulse with no restitution, `closing / (1/m_a +
 *    1/m_b)` into the surface, for a 3 kg fist at 8 m/s on a 76 kg receiver
 *    at rest, a receiver walking toward the fist and one moving away; a
 *    striker leaving the surface delivers nothing.
 * 4. A record naming no person, or one with neither its own impulse nor a
 *    velocity and a mass, yields nothing.
 * 5. `within` keeps the impulses inside a span and the sustained forces that
 *    overlap it, for the named person only, both ends included.
 * 6. `at` reads a constant and a function force inside its span and nothing
 *    outside it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Converts hit records and filters forces through the public namespace; a blast's impulse altered, a lost momentum misread, an impulse pointing out of the surface, a force leaking to another person or outside its span fails.
 * @evidence contracts/development/testing.md#independent-expectations Momentum conservation of the striker for a stick and a pass, the perfectly inelastic two-mass impulse in closed form, and the spans' own definitions.
 * @evidence contracts/development/testing.md#distinguishing-cases A blast, a stick, a pass, three closing speeds, a separating striker, two empty records, inside and outside spans, two people and both force kinds; the balance outcome they lead to belongs to `test_engine_balance_outcome`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of pure functions on in-memory records, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and their closed forms.
 */
export function test_human_motion_core_force(): void {
  const findings: string[] = [];
  const near = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    Vector3.length(Vector3.subtract(a, b)) <=
    1e-12 * Math.max(1, Vector3.length(b));
  const record = (
    extra: Partial<IAutoMovieInteractionEvent>,
  ): IAutoMovieInteractionEvent => ({
    id: "hit",
    kind: "hit",
    source: "collisionSolver",
    time: 1.25,
    actor: "a",
    target: "b",
    object: null,
    point: null,
    actionIndex: null,
    reaction: null,
    region: "chestLeft",
    ...extra,
  });
  const still: IAutoMovieMotionHumanForce.IReceiver = {
    mass: 76,
    velocity: { x: 0, y: 0, z: 0 },
  };

  // 1. A blast's own impulse.
  const blast: IAutoMovieMotionHumanForce.IImpulse | null = HumanForce.ofHit(
    record({ source: "impactOutput", impulse: { x: 40, y: 10, z: -5 } }),
    still,
  );
  if (
    blast === null ||
    !near(blast.impulse, { x: 40, y: 10, z: -5 }) ||
    blast.subject !== "b" ||
    blast.seconds !== 1.25 ||
    blast.at !== "chestLeft"
  )
    findings.push(`blast: ${JSON.stringify(blast)}`);

  // 2. A stick and a pass.
  const v: IAutoMovieVector3 = { x: 0, y: 0, z: 8 };
  const stick: IAutoMovieMotionHumanForce.IImpulse | null = HumanForce.ofHit(
    record({
      mass: 3,
      velocity: v,
      outcome: "stick",
      exit: { x: 0, y: 0, z: 0 },
    }),
    still,
  );
  if (stick === null || !near(stick.impulse, { x: 0, y: 0, z: 24 }))
    findings.push(`stick: ${JSON.stringify(stick?.impulse)} for 3 kg at 8 m/s`);
  const pass: IAutoMovieMotionHumanForce.IImpulse | null = HumanForce.ofHit(
    record({
      mass: 0.01,
      velocity: { x: 0, y: 0, z: 400 },
      outcome: "pass",
      exit: { x: 0, y: 0, z: 250 },
    }),
    still,
  );
  if (pass === null || !near(pass.impulse, { x: 0, y: 0, z: 1.5 }))
    findings.push(
      `pass: ${JSON.stringify(pass?.impulse)} for 10 g losing 150 m/s`,
    );

  // 3. The two-mass impulse into the surface.
  const normal: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  for (const receiver of [-1.5, 0, 1.5]) {
    const closing: number = 8 - receiver;
    const read: IAutoMovieMotionHumanForce.IImpulse | null = HumanForce.ofHit(
      record({ mass: 3, velocity: v, normal }),
      { mass: 76, velocity: { x: 0, y: 0, z: receiver } },
    );
    const expected: number = closing / (1 / 3 + 1 / 76);
    if (read === null || !near(read.impulse, { x: 0, y: 0, z: expected }))
      findings.push(
        `receiver at ${receiver} m/s: ${JSON.stringify(read?.impulse)}, expected ${expected.toFixed(4)} along +z`,
      );
  }
  const leaving: IAutoMovieMotionHumanForce.IImpulse | null = HumanForce.ofHit(
    record({ mass: 3, velocity: { x: 0, y: 0, z: -2 }, normal }),
    still,
  );
  if (leaving === null || Vector3.length(leaving.impulse) !== 0)
    findings.push(
      `a striker leaving the surface delivers ${JSON.stringify(leaving?.impulse)}`,
    );

  // 4. Records that carry nothing.
  if (
    HumanForce.ofHit(
      record({ target: null, impulse: { x: 1, y: 0, z: 0 } }),
      still,
    ) !== null
  )
    findings.push("a record naming no person yields an impulse");
  if (HumanForce.ofHit(record({ velocity: v }), still) !== null)
    findings.push("a record with no mass yields an impulse");

  // 5. Forces within a span.
  const constant: IAutoMovieMotionHumanForce.ISustained = {
    kind: "sustained",
    subject: "b",
    at: "palmLeft",
    from: 2,
    to: 3,
    force: { x: 0, y: -50, z: 0 },
  };
  const varying: IAutoMovieMotionHumanForce.ISustained = {
    ...constant,
    from: 0,
    to: 1,
    force: (s: number): IAutoMovieVector3 => ({ x: 10 * s, y: 0, z: 0 }),
  };
  const forces: IAutoMovieMotionHumanForce.IForce[] = [
    { kind: "impulse", subject: "b", at: "chestLeft", seconds: 1, impulse: v },
    { kind: "impulse", subject: "a", at: "chestLeft", seconds: 1, impulse: v },
    constant,
    varying,
  ];
  const inside: IAutoMovieMotionHumanForce.IForce[] = HumanForce.within(forces, "b", 1, 2);
  if (inside.length !== 3)
    findings.push(
      `within [1, 2] for b keeps ${inside.length} of the 3 that touch it`,
    );
  if (HumanForce.within(forces, "b", 1.1, 1.9).length !== 0)
    findings.push("within (1.1, 1.9) keeps a force that lies outside it");
  if (HumanForce.within(forces, "a", 0, 5).length !== 1)
    findings.push("within keeps another person's forces");

  // 6. A force's value inside and outside its span.
  if (!near(HumanForce.at(constant, 2.5), { x: 0, y: -50, z: 0 }))
    findings.push("a constant force is not read inside its span");
  if (!near(HumanForce.at(varying, 0.5), { x: 5, y: 0, z: 0 }))
    findings.push("a varying force is not read at its second");
  if (Vector3.length(HumanForce.at(constant, 3.5)) !== 0)
    findings.push("a force is read after its span");

  TestValidator.predicate(
    `forces and hits: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
