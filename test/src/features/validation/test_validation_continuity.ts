import { validateContinuity } from "@automovie/engine";
import {
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  IAutoMovieMountBinding,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM } from "../internal/fixtures";
import {
  hasViolation,
  validationHasNoWarnings,
  validationHasWarning,
} from "../internal/predicates";

const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

const actor: (props: {
  node: string;
  x?: number;
  facing?: IAutoMovieVector3;
  mount?: IAutoMovieMountBinding | null;
}) => IAutoMovieBeatEndActorState = (props: {
  node: string;
  x?: number;
  facing?: IAutoMovieVector3;
  mount?: IAutoMovieMountBinding | null;
}): IAutoMovieBeatEndActorState => ({
  node: props.node,
  transform: {
    ...IDENTITY_TRANSFORM,
    translation: { x: props.x ?? 0, y: 0, z: 0 },
  },
  facing: props.facing ?? FORWARD,
  pose: null,
  motion: null,
  localTime: 0,
  gaitPhase: null,
  rootVelocity: null,
  footPlants: null,
  mount: props.mount ?? null,
});

const state: (
  actors: IAutoMovieBeatEndActorState[],
) => IAutoMovieBeatEndState = (
  actors: IAutoMovieBeatEndActorState[],
): IAutoMovieBeatEndState => ({ beat: "b", shot: "shot:b", actors });

const saddle: IAutoMovieMountBinding = { parent: "horse", bone: "spine" };

/**
 * The cut-boundary continuity linter (#1172): the incoming beat's opening state
 * against the previous beat's recorded end-state. Drift is advisory (a warning,
 * never a gate; a cut may intend a jump), so a success carries warnings, and
 * only a nonsensical tolerance is an error.
 *
 * Scenarios:
 *
 * 1. A clean resume (same position, same facing, mount preserved) passes with no
 *    warnings (position/facing within tolerance and mount unchanged: every
 *    negative branch).
 * 2. Position drift past the tolerance warns at the translation path.
 * 3. Facing drift past the tolerance warns at the facing path.
 * 4. A dropped mount (rider unmounted), a changed parent, and a changed bone each
 *    warn at the mount path: the "props disappear" failure.
 * 5. An actor that ended the prior beat but is absent from the incoming opening
 *    warns rather than silently skipping.
 * 6. A generous position tolerance suppresses a large drift (provided tolerance
 *    honored, drift-within-bound branch).
 * 7. A negative position tolerance and an out-of-band facing tolerance are each
 *    range errors at their option paths.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateContinuity on boundary records and checks clean success, advisory physics findings at actor-qualified translation/facing/mount paths, a missing-actor warning, tolerance suppression, and invalid-option range findings.
 * @evidence contracts/testing.md#independent-expectations An unchanged rider is continuous, metre-scale displacement exceeds the default 0.05 m, a quarter turn exceeds 5 degrees, and a persistent mount requires equal parent and bone. Explicit tolerance 5 admits drift 3; negative metres and facing 400 violate the tolerance domain. Warning predicates check severity and paths, not exact magnitude or every emitted row.
 * @evidence contracts/testing.md#distinguishing-cases Seven scenarios cover unchanged state, separate spatial/angular drift, each mount identity component and null, absence, an accepting override, and two invalid tolerance fields. Exact threshold equality, new actors, and film-wide continuity are outside this pairwise test.
 * @evidence contracts/testing.md#execution-ownership The named test_validation_continuity entry compares portable in-memory beat snapshots through the public validator, with no rendering host or dynamically registered cases.
 */
export function test_validation_continuity(): void {
  // 1. clean resume with a preserved mount: no warnings.
  const clean: IAutoMovieValidation = validateContinuity({
    previous: state([actor({ node: "rider", x: 2, mount: saddle })]),
    opening: state([actor({ node: "rider", x: 2, mount: saddle })]),
  });
  TestValidator.equals("clean resume passes", clean, { success: true });

  // 2. position drift.
  const drift: IAutoMovieValidation = validateContinuity({
    previous: state([actor({ node: "hero", x: 0 })]),
    opening: state([actor({ node: "hero", x: 1 })]),
  });
  TestValidator.predicate(
    "position drift warns",
    validationHasWarning(
      "actor position continuity",
      drift,
      "physics",
      "$input.opening.actors[node=hero].transform.translation",
    ),
  );

  // 3. facing drift (90 degrees off forward).
  const spun: IAutoMovieValidation = validateContinuity({
    previous: state([actor({ node: "hero", facing: FORWARD })]),
    opening: state([actor({ node: "hero", facing: { x: 1, y: 0, z: 0 } })]),
  });
  TestValidator.predicate(
    "facing drift warns",
    validationHasWarning(
      "actor facing continuity",
      spun,
      "physics",
      "$input.opening.actors[node=hero].facing",
    ),
  );

  // 4. mount discontinuity: dropped, changed parent, changed bone.
  const dropped: IAutoMovieValidation = validateContinuity({
    previous: state([actor({ node: "rider", mount: saddle })]),
    opening: state([actor({ node: "rider", mount: null })]),
  });
  const reparent: IAutoMovieValidation = validateContinuity({
    previous: state([actor({ node: "rider", mount: saddle })]),
    opening: state([
      actor({ node: "rider", mount: { parent: "cart", bone: "spine" } }),
    ]),
  });
  const rebone: IAutoMovieValidation = validateContinuity({
    previous: state([actor({ node: "rider", mount: saddle })]),
    opening: state([
      actor({ node: "rider", mount: { parent: "horse", bone: "hips" } }),
    ]),
  });
  TestValidator.predicate(
    "dropped mount warns",
    validationHasWarning(
      "dropped mount continuity",
      dropped,
      "physics",
      "$input.opening.actors[node=rider].mount",
    ),
  );
  TestValidator.predicate(
    "reparented mount warns",
    validationHasWarning(
      "reparented mount continuity",
      reparent,
      "physics",
      "$input.opening.actors[node=rider].mount",
    ),
  );
  TestValidator.predicate(
    "rebound mount warns",
    validationHasWarning(
      "rebound mount continuity",
      rebone,
      "physics",
      "$input.opening.actors[node=rider].mount",
    ),
  );

  // 5. actor missing from the incoming opening.
  const missing: IAutoMovieValidation = validateContinuity({
    previous: state([actor({ node: "hero" })]),
    opening: state([actor({ node: "extra" })]),
  });
  TestValidator.predicate(
    "absent actor warns",
    validationHasWarning(
      "missing actor continuity",
      missing,
      "physics",
      "$input.opening.actors",
    ),
  );

  // 6. a generous tolerance suppresses a large drift: no warning.
  const tolerant: IAutoMovieValidation = validateContinuity({
    previous: state([actor({ node: "hero", x: 0 })]),
    opening: state([actor({ node: "hero", x: 3 })]),
    positionTolerance: 5,
  });
  TestValidator.predicate(
    "tolerance suppresses drift",
    validationHasNoWarnings("tolerant continuity", tolerant),
  );

  // 7. nonsensical tolerances are range errors that short-circuit.
  const badPos: IAutoMovieValidation = validateContinuity({
    previous: state([actor({ node: "hero", x: 0 })]),
    opening: state([actor({ node: "hero", x: 9 })]),
    positionTolerance: -1,
  });
  TestValidator.predicate(
    "negative position tolerance is a range error",
    hasViolation(badPos, "range", "$input.positionTolerance"),
  );
  const badFacing: IAutoMovieValidation = validateContinuity({
    previous: state([actor({ node: "hero" })]),
    opening: state([actor({ node: "hero" })]),
    facingToleranceDeg: 400,
  });
  TestValidator.predicate(
    "out-of-band facing tolerance is a range error",
    hasViolation(badFacing, "range", "$input.facingToleranceDeg"),
  );
}
