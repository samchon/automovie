import type {
  IAutoMovieMotionHumanBlast,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanImpulse,
  IAutoMovieMotionHumanSustainedForce,
} from "@automovie/interface";
import { HumanBlast, HumanForce } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * `HumanForce.within` gives the forces on a person within a span: impulses at
 * an instant inside it and sustained forces overlapping it; `HumanForce.at`
 * reads a sustained force at a second, zero outside its span; and
 * `HumanBlast.impulse` is a blast's reference impulse within its reference
 * distance and its inverse square beyond.
 *
 * Scenarios:
 *
 * 1. Of an impulse at 1 s and a push from 2 to 3 s on Ann and a push on Bob, the
 *    span 0.5 to 2.5 s takes both of Ann's, 1.2 to 1.8 s none.
 * 2. A constant push reads its force inside its span and zero after; a varying one
 *    reads its function.
 * 3. A 40 N·s blast gives 40 within a metre and 10 at 2 m.
 */
export function test_unit_motions_perform_force(): void {
  const kick: IAutoMovieMotionHumanImpulse = {
    kind: "impulse",
    subject: "ann",
    at: { bone: "chest", point: { x: 0, y: 0, z: 0 } },
    seconds: 1,
    impulse: { x: 0, y: 0, z: -20 },
  };
  const push: IAutoMovieMotionHumanSustainedForce = {
    kind: "sustained",
    subject: "ann",
    at: { bone: "chest", point: { x: 0, y: 0, z: 0 } },
    from: 2,
    to: 3,
    force: { x: 5, y: 0, z: 0 },
  };
  const other: IAutoMovieMotionHumanSustainedForce = {
    ...push,
    subject: "bob",
  };
  const all: readonly IAutoMovieMotionHumanForce[] = [kick, push, other];

  // 1. Within a span.
  TestValidator.predicate(
    "a span's forces on one person",
    HumanForce.within(all, "ann", 0.5, 2.5).length === 2 &&
      HumanForce.within(all, "ann", 1.2, 1.8).length === 0,
  );

  // 2. A sustained force's value.
  const varying: IAutoMovieMotionHumanSustainedForce = {
    ...push,
    force: (seconds: number) => ({ x: seconds, y: 0, z: 0 }),
  };
  TestValidator.predicate(
    "a sustained force inside and outside its span",
    vclose(HumanForce.at(push, 2.5), { x: 5, y: 0, z: 0 }, 0) &&
      vclose(HumanForce.at(push, 3.5), { x: 0, y: 0, z: 0 }, 0) &&
      vclose(HumanForce.at(varying, 2.5), { x: 2.5, y: 0, z: 0 }, 0),
  );

  // 3. A blast's fall-off.
  const blast: IAutoMovieMotionHumanBlast.IBlast = {
    id: "bang",
    point: { x: 0, y: 0, z: 0 },
    at: 0,
    radius: 5,
    impulse: 40,
  };
  TestValidator.predicate(
    "within a metre the reference, beyond its inverse square",
    HumanBlast.impulse(blast, 0.5) === 40 &&
      nclose(HumanBlast.impulse(blast, 2), 10, 1e-12),
  );
}
