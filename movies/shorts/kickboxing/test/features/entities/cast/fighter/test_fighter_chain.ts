import type { AutoMovieComposition, IAutoMovieIntent } from "@automovie/engine";
import assert from "node:assert/strict";

import { KickboxingAction } from "../../../../../src/laws/kickboxing/KickboxingAction";
import { polygonCast } from "../../../../internal/polygonCast";

/**
 * A fighter's capabilities emit intent records only, within his settings
 * repertoire, and his habits answer their triggers.
 *
 * Scenarios: `a.jab().cross().hook()` emits three strikes of A in order with
 * each punch following the previous one; a feint breaks the chain; a punch
 * after a kick starts afresh; A cannot throw B's switch kick nor B A's
 * Brazilian kick; B's tell answers A's rising knee with the elbow block and
 * A's with the check to the drag feint; a habit with no trigger refuses; a
 * movement needs two whole steps; no capability returns a position.
 */
export function test_fighter_chain(): void {
  const { a, b } = polygonCast();
  const actions = (node: AutoMovieComposition): KickboxingAction.IAction[] =>
    flatten(node).map((i: IAutoMovieIntent) => {
      assert.ok(!("position" in (i.parameters ?? {})));
      return KickboxingAction.read(i);
    });
  assert.deepEqual(actions(a.jab().cross().hook().node), [
    { kind: "strike", technique: "jab" },
    { kind: "strike", technique: "cross", follows: "jab" },
    { kind: "strike", technique: "hook", follows: "cross" },
  ]);
  assert.deepEqual(actions(a.feintJab().jab().node)[1], {
    kind: "strike",
    technique: "jab",
  });
  assert.deepEqual(actions(a.lowKick().jab().node)[1], {
    kind: "strike",
    technique: "jab",
  });
  assert.throws(() => a.switchKick());
  assert.throws(() => b.brazilianKick());
  assert.deepEqual(actions(b.tell("brazilian-kick").node), [
    { kind: "defend", answer: "elbow-block" },
  ]);
  assert.deepEqual(actions(a.tell("feint-low-kick").node), [
    { kind: "defend", answer: "check" },
  ]);
  assert.throws(() => a.tell("high-kick"));
  assert.throws(() => a.move("circle", 1));
  assert.equal(flatten(a.move("circle", 2).node)[0]!.subject, "a");
}

function flatten(node: AutoMovieComposition): IAutoMovieIntent[] {
  if (node.kind === "intent") return [node.intent];
  if (node.kind === "at") return flatten(node.part);
  return node.parts.flatMap(flatten);
}
