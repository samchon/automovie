import assert from "node:assert/strict";

import { ImpactEffects } from "../../../src/film/ImpactEffects";

/**
 * Landed blows throw sweat and blood, stain the canvas, flush the struck skin and squash the glove, identically on every evaluation.
 *
 * @evidence contracts/testing.md#observable-behavior Configures real ImpactEffects instances and reads the drawn counts from `update`, plus the public `spray`, `flush` and `squash` answers.
 * @evidence contracts/testing.md#independent-cases Expectations come from what the blows are: nothing flies before a blow and nothing is airborne a second and a half later; a face blow bleeds and a body blow does not; blood that fell stays on the canvas; every clean face blow leaves the face redder than before and the mark never vanishes; the striking glove is flattest at contact; two instances given the same blows draw the same spray (seek equals playback).
 */
export function test_impact_effects(): void {
  const face: ImpactEffects.Impact = {
    id: "x001-a-cross",
    seconds: 10,
    attacker: "a",
    receiver: "b",
    relation: "head",
    side: "left",
    weapon: "right",
    point: [0, 1.6, 0],
    direction: [1, 0, 0],
    strength: 1,
    finish: false,
  };
  const body: ImpactEffects.Impact = {
    ...face,
    id: "x002-b-body-cross",
    seconds: 20,
    attacker: "b",
    receiver: "a",
    relation: "body",
    point: [0, 1.1, 0],
    direction: [-1, 0, 0],
  };
  const second: ImpactEffects.Impact = {
    ...face,
    id: "x003-a-jab",
    seconds: 30,
  };

  // Face blows bleed, body blows only sweat; the same blow sprays the same droplets.
  assert.ok(ImpactEffects.spray(face).some((d) => d.kind === "blood"));
  assert.ok(ImpactEffects.spray(body).every((d) => d.kind === "sweat"));
  assert.deepEqual(ImpactEffects.spray(face), ImpactEffects.spray(face));

  const one: ImpactEffects = new ImpactEffects();
  const two: ImpactEffects = new ImpactEffects();
  one.configure([face, body, second]);
  two.configure([face, body, second]);
  try {
    assert.deepEqual(one.update(9.9), { sweat: 0, blood: 0, stains: 0 });
    const flying = one.update(10.15);
    assert.ok(
      flying.sweat > 0 && flying.blood > 0,
      "spray just after the blow",
    );
    assert.deepEqual(two.update(10.15), flying);
    const later = one.update(11.5);
    assert.equal(later.sweat + later.blood, 0, "nothing airborne 1.5 s later");
    assert.ok(later.stains > 0, "blood that fell stains the canvas");
    assert.ok(one.update(179).stains >= later.stains, "stains stay");
  } finally {
    one.dispose();
    two.dispose();
  }

  // Each clean face blow leaves the face redder; the mark settles but never vanishes.
  const impacts: ImpactEffects.Impact[] = [face, body, second];
  const before: number = ImpactEffects.flush(impacts, "b", 9.9).face;
  const afterFirst: number = ImpactEffects.flush(impacts, "b", 11).face;
  const settled: number = ImpactEffects.flush(impacts, "b", 29.9).face;
  const afterSecond: number = ImpactEffects.flush(impacts, "b", 31).face;
  assert.equal(before, 0);
  assert.ok(afterFirst > 0 && settled > 0 && settled <= afterFirst);
  assert.ok(afterSecond > settled);
  assert.equal(ImpactEffects.flush(impacts, "a", 25).face, 0);
  assert.ok(ImpactEffects.flush(impacts, "a", 25).left > 0);

  // The striking glove is flattest at contact and whole again shortly after.
  const peak: number = ImpactEffects.squash(impacts, "a", "right", 10);
  assert.ok(peak > 0.9);
  assert.equal(ImpactEffects.squash(impacts, "a", "right", 10.3), 0);
  assert.equal(ImpactEffects.squash(impacts, "a", "left", 10), 0);
}
