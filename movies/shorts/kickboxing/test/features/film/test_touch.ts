import assert from "node:assert/strict";
import * as THREE from "three";

import { FilmTouch } from "../../../src/film/FilmTouch";
import { LabActor } from "../../../src/motion-lab/LabActor";

/**
 * The cooperative gesture has a causal clock and complete fixed ending.
 * Scenarios: 1. Original onset and delivery. 2. Actual interception and small recoil. 3. Full return and invalid clocks.
 * @evidence contracts/testing.md#observable-behavior Calls the real pure clock, checks that future contact cannot alter earlier delivery and that recoil and recovery join continuously at their declared boundaries. No actor or geometry result is replaced.
 * @evidence contracts/testing.md#independent-cases The .75-second film slot, original .32-second approach and four-percent gesture recoil are explicit authored decisions. Invalid timestamps and contact outside the delivery interval refuse. Actual FK and interception belong to the separate original-Human case.
 */
export function test_touch_clock(): void {
  assert.equal(FilmTouch.duration, 0.75);
  assert.equal(FilmTouch.clock(0).weight, 0);
  assert.equal(FilmTouch.clock(0.1, 0.2).weight, FilmTouch.clock(0.1).weight);
  assert.equal(FilmTouch.clock(0.2, 0.2).phase, "contact");
  assert.equal(FilmTouch.clock(0.2, 0.2).weight, 1);
  assert.ok(Math.abs(FilmTouch.clock(0.28, 0.2).weight - 0.96) < 1e-12);
  assert.equal(FilmTouch.clock(0.75, 0.2).phase, "complete");
  assert.equal(FilmTouch.clock(0.75, 0.2).weight, 0);
  for (const boundary of [0.22, 0.28])
    assert.ok(
      Math.abs(
        FilmTouch.clock(boundary - 1e-8, 0.2).weight -
          FilmTouch.clock(boundary + 1e-8, 0.2).weight,
      ) < 1e-9,
    );
  for (const value of [-1, 0.751, NaN, Infinity])
    assert.throws((): unknown => FilmTouch.clock(value));
  for (const value of [0, -0.1, 0.321, NaN])
    assert.throws((): unknown => FilmTouch.clock(0.1, value));
  assert.throws((): unknown => FilmTouch.clock(0.5), /actual interception/u);
}

/**
 * Both real lead gloves meet, recover and remain bound to their original supported actors.
 * Scenarios: 1. Actual original-Human contact. 2. Seek-order independence and detached receipt. 3. Complete return with unchanged rear guard and feet.
 * @evidence contracts/testing.md#observable-behavior Constructs the actual film primitive and inspects its native full-surface contact receipt, named left glove pair and local bracket. Reordered seeks must reproduce actual applied poses and WORLD Hand transforms. Final rear guard, root and original feet retain their entry. The test does not establish moving-image quality or continuous articulated collision.
 * @evidence contracts/testing.md#independent-cases The mirrored 1.1-metre ring setup is independent of the algorithm's midpoint. .25mm hard-goal and 1µm floor limits are the existing host specification. Both positive loaded sides require actual native admission; a receipt must identify the two left glove surfaces rather than any nominal jab target.
 */
export function test_touch_actual_original_pair(): void {
  const actors: Record<"a" | "b", LabActor> = {
    a: new LabActor("a", "a", -0.55, 0),
    b: new LabActor("b", "b", 0.55, Math.PI),
  };
  try {
    const rear: Record<"a" | "b", number[]> = {
      a: actors.a
        .glove("right")
        .getWorldPosition(new THREE.Vector3())
        .toArray(),
      b: actors.b
        .glove("right")
        .getWorldPosition(new THREE.Vector3())
        .toArray(),
    };
    const touch: FilmTouch = new FilmTouch(actors);
    const planning: {
      entries: Record<"a" | "b", FilmTouch.Entry>;
      acceptance: FilmTouch.Acceptance;
    } = touch.inspect() as {
      entries: Record<"a" | "b", FilmTouch.Entry>;
      acceptance: FilmTouch.Acceptance;
    };
    const targetDistance: number = new THREE.Vector3(
      ...planning.entries.a.worldTarget,
    ).distanceTo(new THREE.Vector3(...planning.entries.b.worldTarget));
    assert.ok(
      targetDistance > 0.18 && targetDistance < 0.2,
      "Original glove surfaces meet while their centres remain distinct",
    );
    for (const id of ["a", "b"] as const) {
      assert.ok(planning.entries[id].surface.innerRadius > 0.09);
      assert.ok(
        Math.abs(planning.entries[id].surface.outerRadius - 0.105) < 1e-7,
      );
    }
    assert.ok(planning.acceptance.distanceUpperBoundMetres <= 0.00025);
    assert.ok(
      planning.acceptance.maximumVertexDepthMetres.a <= 0.00025 &&
        planning.acceptance.maximumVertexDepthMetres.b <= 0.00025,
    );
    const contacts: ReturnType<FilmTouch["contacts"]> = touch.contacts();
    assert.equal(contacts.length, 1);
    assert.equal(contacts[0]!.actionId, "opening-touch");
    assert.equal(contacts[0]!.relation, "guard");
    assert.deepEqual(
      contacts[0]!.query.pair && [
        contacts[0]!.query.pair.attack,
        contacts[0]!.query.pair.receiver,
      ],
      ["a:left-glove", "b:left-glove"],
    );
    assert.ok(contacts[0]!.seconds > 0.8 && contacts[0]!.seconds <= 1.12);
    const at: (seconds: number) => string = (seconds: number): string => {
      touch.evaluate(seconds);
      for (const actor of Object.values(actors)) {
        assert.equal(actor.support?.status, "admitted");
        assert.ok(actor.support!.supportError <= 0.00025);
        assert.ok(actor.support!.floorMinimum >= -0.000001);
      }
      return JSON.stringify(
        Object.values(actors).map((actor: LabActor): object => ({
          pose: actor.pose,
          root: actor.person.object.position.toArray(),
          hand: actor
            .glove("left")
            .getWorldPosition(new THREE.Vector3())
            .toArray(),
        })),
      );
    };
    const forward: string = at(0.4);
    at(0.75);
    at(0.1);
    assert.equal(at(0.4), forward);
    at(0.75);
    for (const id of ["a", "b"] as const)
      assert.ok(
        actors[id]
          .glove("right")
          .getWorldPosition(new THREE.Vector3())
          .distanceTo(new THREE.Vector3(...rear[id])) <= 0.00025,
      );
    const retained: string = JSON.stringify(touch.contacts());
    contacts[0]!.point[0] = 100;
    assert.equal(JSON.stringify(touch.contacts()), retained);
  } finally {
    for (const actor of Object.values(actors)) actor.dispose();
  }
}
