import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  IAutoMovieMountBinding,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM } from "../../internal/fixtures";
import {
  hasViolation,
  validationHasNoWarnings,
  validationHasWarning,
} from "../../internal/predicates";

/**
 * `validateContinuity` compares a beat's opening state with the previous beat's
 * end state; drift is advisory (a cut may intend a jump), only a nonsensical
 * tolerance is an error.
 *
 * Fixture: one-actor end states, the actor at x along the floor facing +z,
 * mounted on the horse's spine where stated.
 *
 * Scenarios:
 *
 * 1. The same position, facing and mount passes with no warning at all.
 * 2. A 1 m drift warns at `...[node=hero].transform.translation`; facing +x
 *    instead of +z at `...facing`; a dropped mount, another parent and another
 *    bone each at `...[node=rider].mount`; an actor missing from the opening at
 *    `$input.opening.actors`.
 * 3. A 3 m drift under tolerance 5 passes quietly.
 * 4. Position tolerance -1 and facing tolerance 400 degrees are range findings at
 *    their option paths.
 */
export function test_engine_validation_validate_continuity(): void {
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const saddle: IAutoMovieMountBinding = { parent: "horse", bone: "spine" };
  const actor = (
    node: string,
    x: number = 0,
    facing: IAutoMovieVector3 = forward,
    mount: IAutoMovieMountBinding | null = null,
  ): IAutoMovieBeatEndActorState => ({
    node,
    transform: { ...IDENTITY_TRANSFORM, translation: { x, y: 0, z: 0 } },
    facing,
    pose: null,
    motion: null,
    localTime: 0,
    gaitPhase: null,
    rootVelocity: null,
    footPlants: null,
    mount,
  });
  const state = (a: IAutoMovieBeatEndActorState): IAutoMovieBeatEndState => ({
    beat: "b",
    shot: "shot:b",
    actors: [a],
  });
  const compare = (
    previous: IAutoMovieBeatEndActorState,
    opening: IAutoMovieBeatEndActorState,
    options: { positionTolerance?: number; facingToleranceDeg?: number } = {},
  ): IAutoMovieValidation =>
    AutoMovieEngineValidation.validateContinuity({
      previous: state(previous),
      opening: state(opening),
      ...options,
    });

  // 1.
  TestValidator.equals(
    "clean",
    compare(
      actor("rider", 2, forward, saddle),
      actor("rider", 2, forward, saddle),
    ),
    { success: true },
  );

  // 2.
  const base: string = "$input.opening.actors";
  for (const [label, result, path] of [
    [
      "drift",
      compare(actor("hero", 0), actor("hero", 1)),
      `${base}[node=hero].transform.translation`,
    ],
    [
      "facing",
      compare(actor("hero"), actor("hero", 0, { x: 1, y: 0, z: 0 })),
      `${base}[node=hero].facing`,
    ],
    [
      "dropped",
      compare(actor("rider", 0, forward, saddle), actor("rider")),
      `${base}[node=rider].mount`,
    ],
    [
      "reparented",
      compare(
        actor("rider", 0, forward, saddle),
        actor("rider", 0, forward, { parent: "cart", bone: "spine" }),
      ),
      `${base}[node=rider].mount`,
    ],
    [
      "rebound",
      compare(
        actor("rider", 0, forward, saddle),
        actor("rider", 0, forward, { parent: "horse", bone: "hips" }),
      ),
      `${base}[node=rider].mount`,
    ],
    ["missing", compare(actor("hero"), actor("extra")), base],
  ] satisfies [string, IAutoMovieValidation, string][])
    TestValidator.predicate(
      label,
      validationHasWarning(label, result, "physics", path),
    );

  // 3.
  TestValidator.predicate(
    "tolerant",
    validationHasNoWarnings(
      "tolerant",
      compare(actor("hero", 0), actor("hero", 3), { positionTolerance: 5 }),
    ),
  );

  // 4.
  TestValidator.predicate(
    "negative position tolerance",
    hasViolation(
      compare(actor("hero", 0), actor("hero", 9), { positionTolerance: -1 }),
      "range",
      "$input.positionTolerance",
    ),
  );
  TestValidator.predicate(
    "facing tolerance 400",
    hasViolation(
      compare(actor("hero"), actor("hero"), { facingToleranceDeg: 400 }),
      "range",
      "$input.facingToleranceDeg",
    ),
  );
}
