import type { IAutoMovieMesh } from "@automovie/interface";
import assert from "node:assert/strict";
import * as THREE from "three";

import { displayedSurface } from "../../../src/displayedSurface";
import { FilmExchange } from "../../../src/film/FilmExchange";
import { FilmPlan } from "../../../src/film/FilmPlan";
import { measureFilmImpact } from "../../../src/film/measureFilmImpact";
import { LabActor } from "../../../src/motion-lab/LabActor";
import type { MotionAction } from "../../../src/motion/core/MotionAction";
import { ContactTrace } from "../../../src/motion/interaction/ContactTrace";

/**
 * Pin original first-witness admission independently from strict overlap.
 * Scenarios:
 * 1. A translated original convex tip touches a closed face with no strict crossing.
 * 2. The original last-clear sample and inconsistent witness clock refuse.
 * 3. A clearly separated display refuses even with a retained old witness.
 * 4. Bounded0.1mm overlap is distinguished from excessive1mm depth without rewriting the witness.
 * @evidence contracts/testing.md#observable-behavior Runs the actual ContactTrace producer and public Engine-backed measured-pair consumer on native box meshes. It checks mere-touch acceptance, exact original clock requirements, separation and signed-depth refusal rather than replacing production methods or asserting a nominal hit label.
 * @evidence contracts/testing.md#independent-cases A closed octahedron's dyadic0.0625m tip and the closed receiver's x=.625 face place first contact at x=.5625. Native strict crossing excludes that mere tip touch. Original buffers translated by0.1mm and1mm exercise either side of the unchanged0.25mm depth budget; a62.5mm display gap is geometrically separate. No Human, browser or force approval follows.
 */
export function test_film_impact(): void {
  const options: ContactTrace.Options = {
    actionId: "film-boundary",
    actorId: "a",
    targetId: "b",
    start: 0,
    end: 1,
    stepSeconds: 1,
    refinementSteps: 4,
    maximumCaptures: 32,
    grazeCosine: 0.2,
    stopAt: "first-witness",
    capture: (seconds: number): ContactTrace.Frame => ({
      sample: sample(seconds),
      attacks: [{ id: "a:leftLowerLeg", role: "strike", mesh: tip(seconds) }],
      receivers: [{ id: "b:head", relation: "head", mesh: box(0.75, 0.25) }],
    }),
  };
  const trace: ContactTrace.Result = ContactTrace.resolve(options);
  assert.ok(trace.event);
  assert.equal(trace.event.time, 0.5625);
  const strike: IAutoMovieMesh = tip(0.5625);
  const head: IAutoMovieMesh = box(0.75, 0.25);
  const point: MotionAction.Vec3 = [...trace.event.point];
  const touching: measureFilmImpact.Receipt = measureFilmImpact(
    strike,
    head,
    trace,
  );
  assert.equal(touching.classification, "touching");
  assert.equal(touching.crossings.length, 0);
  assert.equal(touching.surfaceGapUpperBoundMetres, 0);
  const conservative: ContactTrace.Result = ContactTrace.resolve({
    ...options,
    stopAt: "last-clear",
  });
  assert.throws(
    () => measureFilmImpact(tip(conservative.stopTime!), head, conservative),
    /first-witness/,
  );
  const inconsistent: ContactTrace.Result = structuredClone(trace);
  inconsistent.receipt.reactionTime = trace.event.time + 0.001;
  assert.throws(
    () => measureFilmImpact(strike, head, inconsistent),
    /first-witness/,
  );
  assert.throws(
    () => measureFilmImpact(tip(0.5), head, trace),
    /separated|depth/,
  );
  const bounded: measureFilmImpact.Receipt = measureFilmImpact(
    tip(0.5626),
    head,
    trace,
  );
  assert.equal(bounded.classification, "bounded-overlap");
  assert.ok(bounded.maximumStrikerVertexPenetrationMetres <= 0.00025);
  assert.throws(() => measureFilmImpact(tip(0.5635), head, trace), /depth/);
  assert.deepEqual(trace.event.point, point);
}

/**
 * Reject finishing requests at the ordinary-exchange boundary before actor adoption.
 * Scenarios:
 * 1. The actual authored finishing plan and a finite adjacent impact time both refuse through FilmFinish ownership.
 * 2. Both real actor poses, roots, headings, original patches and observations retain their entry identities.
 *
 * @evidence contracts/testing.md#observable-behavior Constructs FilmExchange with its actual finishing plan and a real Human actor pair. The ownership error must arise before adoption or contact compilation and leave both actors unchanged; no last-clear receipt or nominal impact time may publish knockout state. This unit exercises constructor admission, while FilmFinish and the moving Viewer own actual finishing contact acceptance.
 * @evidence contracts/testing.md#independent-cases The commissioned finishing plan is explicitly marked impactSeconds150; changing that marker to149.9 must still select the same unsupported ownership boundary. Exact retained pose/patch/sample identities and independent root values catch actor mutation before refusal. Native first-witness geometry is covered separately by test_film_impact; ordinary exchange execution remains in the actual module-consumer suite.
 */
export function test_film_exchange_finishing_refusal(): void {
  const a: LabActor = new LabActor("a", "a", -0.64, 0);
  let b: LabActor | undefined;
  try {
    b = new LabActor("b", "b", 0.64, Math.PI);
    const actors: Record<"a" | "b", LabActor> = { a, b };
    const before: {
      actor: LabActor;
      pose: LabActor["basePose"];
      sample: LabActor["sample"];
      patches: LabActor["patches"];
      origin: MotionAction.Vec3;
      yaw: number;
      position: MotionAction.Vec3;
    }[] = [];
    for (const actor of Object.values(actors))
      before.push({
        actor,
        pose: actor.basePose,
        sample: actor.sample,
        patches: actor.patches,
        origin: actor.origin.toArray(),
        yaw: actor.yaw,
        position: actor.person.object.position.toArray(),
      });
    const finish: Readonly<FilmPlan.Exchange> = FilmPlan.exchanges.at(-1)!;
    for (const impactSeconds of [150, 149.9]) {
      assert.throws(
        (): FilmExchange =>
          new FilmExchange({ ...finish, impactSeconds }, actors),
        /Finishing impact requests require FilmFinish/,
      );
      for (const entry of before) {
        assert.equal(entry.actor.basePose, entry.pose);
        assert.equal(entry.actor.sample, entry.sample);
        assert.equal(entry.actor.patches, entry.patches);
        assert.deepEqual(entry.actor.origin.toArray(), entry.origin);
        assert.equal(entry.actor.yaw, entry.yaw);
        assert.deepEqual(
          entry.actor.person.object.position.toArray(),
          entry.position,
        );
      }
    }
  } finally {
    b?.dispose();
    a.dispose();
  }
}

/** Native closed box generation supplies independent WORLD geometry, with no renderer. */
function box(x: number, size: number): IAutoMovieMesh {
  return geometryMesh(new THREE.BoxGeometry(size, size, size), x);
}
/** A closed exact-axis convex tip supplies point contact rather than coplanar face overlap. */
function tip(x: number): IAutoMovieMesh {
  return geometryMesh(new THREE.OctahedronGeometry(0.0625, 0), x);
}
/** Snapshot and release one native CPU-generated fixture surface. */
function geometryMesh(
  geometry: THREE.BufferGeometry,
  x: number,
): IAutoMovieMesh {
  const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  const object: THREE.Mesh = new THREE.Mesh(geometry, material);
  try {
    object.position.x = x;
    return displayedSurface.mesh(object);
  } finally {
    geometry.dispose();
    material.dispose();
  }
}
/** A detached timing sample is geometry-fixture metadata rather than a Human pose claim. */
function sample(seconds: number): MotionAction.Sample {
  return {
    pose: {},
    rootOffset: [seconds, 0, 0],
    support: { left: 0.5, right: 0.5 },
    effectors: [],
    elapsed: seconds,
    phase: "delivery",
    progress: seconds,
  };
}
