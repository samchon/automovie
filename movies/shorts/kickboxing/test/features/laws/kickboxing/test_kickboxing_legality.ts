import { AutoMovieComposition } from "@automovie/engine";
import assert from "node:assert/strict";

import { BoutLaws } from "../../../../src/interactions/kickboxing/BoutLaws";
import { exchange } from "../../../../src/interactions/kickboxing/exchange";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * The legality rules catch what the rules and the study forbid and pass a
 * legal exchange.
 *
 * Scenarios: a jab, cross and low kick met by parry, cover and check is
 * legal; a lone low kick stands outside a combination; a slip against a low
 * kick is an unpaired answer; a strike after the opponent's fall follows the
 * knockdown; a clinch knee chained to a punch is not a single knee.
 */
export function test_kickboxing_legality(): void {
  const cast = polygonCast();
  const { a, b } = cast;
  const rules = (part: AutoMovieComposition): string[] =>
    BoutLaws.check(BoutLaws.resolve(cast, part, "test")).map(
      (v) => v.split(":")[0]!,
    );
  assert.deepEqual(
    rules(
      exchange(cast, "x", a.jab().cross().lowKick(), b.parry().cover().check()),
    ),
    [],
  );
  assert.ok(
    rules(exchange(cast, "x", a.lowKick(), b.check())).includes(
      "kick-in-combination",
    ),
  );
  assert.ok(
    rules(exchange(cast, "x", a.jab().lowKick(), b.cover().slip())).includes(
      "paired-answer",
    ),
  );
  const fall = AutoMovieComposition.sequence(
    b.phase("fall", 1.6).node,
    exchange(cast, "x", a.jab(), b.take()),
  );
  assert.ok(rules(fall).includes("no-attack-after-knockdown"));
  assert.ok(
    rules(exchange(cast, "x", a.jab().clinchKnee(), b.cover().take())).includes(
      "single-clinch-knee",
    ),
  );
}
