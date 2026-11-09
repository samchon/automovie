import type { AutoMovieComposition } from "@automovie/engine";
import assert from "node:assert/strict";

import { KickboxingAction } from "../../../../src/laws/kickboxing/KickboxingAction";
import { KickboxingTechnique } from "../../../../src/laws/kickboxing/KickboxingTechnique";
import { KickboxingTiming } from "../../../../src/laws/kickboxing/KickboxingTiming";
import { RingFootwork } from "../../../../src/laws/kickboxing/RingFootwork";
import { StanceShape } from "../../../../src/laws/kickboxing/StanceShape";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * The stance switch and the shoulder and level feints.
 *
 * Scenarios: a switch holds the stance origin; it starts and ends in the
 * orthodox stance and passes through the mirrored southpaw stance at its
 * half, each foot on its own hip track, landing between hops; the shoulder
 * feint shows the jab's lead-shoulder push and the level feint the body cross for the load
 * share of their delivery; A and B read the level feint with the elbow
 * block and the shoulder feint with the parry, and B throws the body-kick
 * feint.
 */
export function test_stance_switch(): void {
  const { a, b } = polygonCast();
  const measure = a.body.measure;
  const ring: RingFootwork.IRing = { half: 3, margin: 0.5, step: 0.25 };
  assert.deepEqual(
    RingFootwork.move(
      { movement: "switch", steps: 2 },
      { x: 0.4, z: 0.1 },
      { x: 1.6, z: 0.1 },
      ring,
    ),
    { x: 0.4, z: 0.1 },
  );
  const stance = StanceShape.feet(measure);
  for (const share of [0, 1]) {
    const s = StanceShape.switching(measure, share);
    assert.ok(Math.abs(s.feet.left.x - stance.left.x) < 1e-12);
    assert.ok(Math.abs(s.yaw - StanceShape.TURN) < 1e-12);
  }
  const half = StanceShape.switching(measure, 0.5);
  assert.ok(Math.abs(half.feet.left.x + stance.left.x) < 1e-12);
  assert.ok(Math.abs(half.feet.right.x + stance.right.x) < 1e-12);
  assert.ok(Math.abs(half.yaw + StanceShape.TURN) < 1e-12);
  assert.ok(half.lift < 1e-12);
  assert.ok(StanceShape.switching(measure, 0.25).lift > 0.99);
  for (let k = 0; k <= 20; k++) {
    const s = StanceShape.switching(measure, k / 20);
    assert.equal(s.feet.left.z, stance.left.z);
    assert.equal(s.feet.right.z, stance.right.z);
  }
  const t = KickboxingTechnique.table;
  assert.equal(t["feint-shoulder"].shows?.of, "cross");
  assert.equal(t["feint-level"].shows?.of, "body-cross");
  assert.ok(
    Math.abs(
      KickboxingTiming.delivery("feint-shoulder") -
        KickboxingTechnique.LOAD_SHARE * KickboxingTiming.delivery("cross"),
    ) < 1e-12,
  );
  for (const fighter of [a, b]) {
    const read = (seen: KickboxingTechnique.Name): string | undefined => {
      let node: AutoMovieComposition = fighter.tell(seen).node;
      while (node.kind !== "intent")
        node = node.kind === "at" ? node.part : node.parts[0]!;
      const action = KickboxingAction.read(node.intent);
      return action.kind === "defend" ? action.answer : undefined;
    };
    assert.equal(read("feint-level"), "elbow-block");
    assert.equal(read("feint-shoulder"), "parry");
    assert.doesNotThrow(() => fighter.feintShoulder());
    assert.doesNotThrow(() => fighter.feintLevel());
  }
  assert.doesNotThrow(() => b.feintBodyKick());
}
