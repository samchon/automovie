import type {
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanForce,
} from "@automovie/interface";
import { HumanForce } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * Catching a juggling ball transfers its lost momentum to the catcher.
 *
 * Scenarios:
 *
 * 1. Evaluate the operation at the interior and the limiting case.
 */
export function test_unit_motions_perform_force_impulse(): void {
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
