import { resolveBeatEnd } from "@automovie/engine";
import {
  IAutoMovieBeatEndActorState,
  IAutoMovieGaitCycle,
  IAutoMovieMotion,
  IAutoMovieScene,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  IDENTITY_TRANSFORM,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../../internal/fixtures";
import { nclose } from "../../internal/predicates";

const withCycle: (gaitCycle: IAutoMovieGaitCycle) => IAutoMovieMotion = (
  gaitCycle: IAutoMovieGaitCycle,
): IAutoMovieMotion => ({
  ...makeMotion(
    [
      keyframe(0, makePose([joint("leftUpperLeg", { flexion: 0 })])),
      keyframe(1, makePose([joint("leftUpperLeg", { flexion: 20 })])),
    ],
    1,
  ),
  id: "clip",
  gaitCycle,
});

const scene: IAutoMovieScene = {
  id: "scene",
  name: null,
  nodes: [
    {
      id: "hero",
      model: "hero",
      transform: IDENTITY_TRANSFORM,
      motion: null,
      pose: null,
    },
  ],
  cameras: [],
  lights: [],
};

const shot: IAutoMovieShot = {
  id: "shot:beat-1",
  name: null,
  scene: "scene",
  camera: "cam",
  cameraMotion: null,
  performances: [{ node: "hero", motion: "clip", startOffset: 0 }],
  objectMotions: [],
  duration: 0.5,
};

const phaseOf: (
  gaitCycle: IAutoMovieGaitCycle,
  duration?: number,
) => number | null = (
  gaitCycle: IAutoMovieGaitCycle,
  duration: number = shot.duration,
): number | null =>
  resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: { ...shot, duration },
    motions: [withCycle(gaitCycle)],
  }).actors.find(
    (a: IAutoMovieBeatEndActorState): boolean => a.node === "hero",
  )!.gaitPhase;

/**
 * A carried cycle determines beat-end phase and invalid cycle scalars return
 * null.
 *
 * Scenarios:
 *
 * 1. Preserve an in-range phase at zero and one whole period.
 * 2. Wrap the authored .7+.5 time over period .8 to .4.
 * 3. Return null for a zero or negative period.
 */
export function test_engine_film_gait_phase_degenerate(): void {
  TestValidator.predicate(
    "an in-range carried phase is preserved at the opening instant",
    nclose(phaseOf({ period: 1, phaseAt: 0.4 }, 0) ?? Number.NaN, 0.4),
  );
  TestValidator.predicate(
    "a whole-cycle carry preserves the phase",
    nclose(phaseOf({ period: 1, phaseAt: 0.4 }, 1) ?? Number.NaN, 0.4),
  );
  const phase: number | null = phaseOf({ period: 0.8, phaseAt: 0.7 });
  TestValidator.predicate(
    "valid cycle: (0.7 + 0.5) mod 0.8 = 0.4",
    (): boolean => phase !== null && nclose(phase, 0.4),
  );

  TestValidator.equals(
    "zero period answers null",
    phaseOf({ period: 0, phaseAt: 0 }),
    null,
  );
  TestValidator.equals(
    "negative period answers null",
    phaseOf({ period: -1, phaseAt: 0 }),
    null,
  );
}
