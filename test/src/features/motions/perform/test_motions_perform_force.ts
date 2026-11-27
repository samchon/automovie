import {
  type IAutoMovieInteractionEvent,
  type IAutoMovieMotionHumanBlast,
  type IAutoMovieMotionHumanForce,
  type IAutoMovieMotionHumanImpulse,
  type IAutoMovieMotionHumanSustainedForce,
} from "@automovie/interface";
import { HumanBlast, HumanForce } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

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
function scenario_test_motions_perform_force(): void {
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

/**
 * Catching a juggling ball transfers its lost momentum to the catcher.
 *
 * Scenarios:
 *
 * 1. Evaluate the operation at the interior and the limiting case.
 */
function scenario_test_motions_perform_force_impulse(): void {
  const receiver: IAutoMovieMotionHumanForce.IReceiver = {
    mass: 60,
    velocity: { x: 0, y: 0, z: 0 },
  };
  for (const speed of [-2, 0, 2]) {
    const caught: IAutoMovieInteractionEvent = {
      id: "catch",
      kind: "hit",
      source: "collisionSolver",
      time: 0.5,
      actor: "ball",
      target: "catcher",
      object: null,
      point: null,
      actionIndex: null,
      reaction: null,
      mass: 0.25,
      velocity: { x: speed, y: 0, z: 0 },
      exit: { x: 0, y: 0, z: 0 },
    };
    const delivered = HumanForce.ofHit(caught, receiver);
    TestValidator.predicate(
      "ball momentum is transferred",
      delivered !== null &&
        nclose(delivered.impulse.x, 0.25 * speed) &&
        delivered.seconds === 0.5,
    );
    TestValidator.equals(
      "no receiving contact",
      HumanForce.ofHit({ ...caught, target: null }, receiver),
      null,
    );
  }
}

/** HumanForce, an applied force and its impulse on a body, each scenario below. */
export function test_motions_perform_force(): void {
  scenario_test_motions_perform_force();
  scenario_test_motions_perform_force_impulse();
}
