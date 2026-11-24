import { sequenceTimeline } from "@automovie/engine";
import type {
  IAutoMoviePlaybackLayer,
  IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import {
  type IAutoMovieDrawScene,
  planAutoMovieDrawLayers,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../../internal/predicates";

/** An authored empty-motion shot of the given id and length. */
function shot(id: string, duration: number): IAutoMovieShot {
  return {
    id,
    name: null,
    scene: "scene-room",
    camera: "cam-main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration,
  };
}

/** Shot A, then shot B through a one-second transition of `kind` at 2 s. */
function cut(kind: "crossDissolve" | "fade"): {
  sequence: IAutoMovieSequence;
  cut: IAutoMoviePlaybackTimeline;
} {
  const sequence: IAutoMovieSequence = {
    id: "seq",
    name: null,
    fps: 24,
    shots: [
      { shot: "shot:a", trim: null, transition: null },
      { shot: "shot:b", trim: null, transition: { kind, duration: 1 } },
    ],
  };
  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(sequence, [
    shot("shot:a", 3),
    shot("shot:b", 4),
  ]);
  return { sequence, cut: timeline };
}

/** A shot placement that records nothing; the plan only checks it exists. */
const SEEK_SHOT: NonNullable<
  IAutoMovieDrawScene["seekShot"]
> = async (): Promise<void> => {};

/**
 * The draw page and the viewer plan a film picture's transition layers from the
 * subject's sequence, draw a picture outside every transition exactly as
 * before, and refuse a transition whose outgoing shot the subject cannot
 * place.
 *
 * Scenarios:
 *
 * 1. A subject without a sequence plans nothing, so its pictures draw as before.
 * 2. Outside the transition, at 1 s and 3.5 s, the plan is null.
 * 3. A cross dissolve's midpoint, 2.5 s, plans the outgoing shot A and the live
 *    shot B at weight 0.5 each.
 * 4. A fade's first quarter, 2.25 s, plans shot A alone at weight 0.5, and its
 *    third quarter, 2.75 s, shot B alone at weight 0.5.
 * 5. Without `seekShot`, the dissolve's midpoint and the fade's first quarter are
 *    refused naming the subject, the entry and `seekShot`; the fade's third
 *    quarter, which draws only the live shot, is planned.
 */
export function test_unit_render_draw_plan_draw_layers(): void {
  const placed: (
    kind: "crossDissolve" | "fade",
  ) => ReturnType<typeof cut> & Pick<IAutoMovieDrawScene, "seekShot"> = (
    kind: "crossDissolve" | "fade",
  ): ReturnType<typeof cut> & Pick<IAutoMovieDrawScene, "seekShot"> => ({
    ...cut(kind),
    seekShot: SEEK_SHOT,
  });
  const dissolve: ReturnType<typeof placed> = placed("crossDissolve");
  const fade: ReturnType<typeof placed> = placed("fade");
  const shots: (
    layers: IAutoMoviePlaybackLayer[] | null,
  ) => [string, number, boolean][] | null = (
    layers: IAutoMoviePlaybackLayer[] | null,
  ): [string, number, boolean][] | null =>
    layers?.map((layer: IAutoMoviePlaybackLayer): [string, number, boolean] => [
      layer.shot,
      layer.weight,
      layer.live,
    ]) ?? null;
  const same: (
    actual: [string, number, boolean][] | null,
    expected: [string, number, boolean][],
  ) => boolean = (
    actual: [string, number, boolean][] | null,
    expected: [string, number, boolean][],
  ): boolean =>
    actual !== null &&
    actual.length === expected.length &&
    actual.every(
      (
        [name, weight, live]: [string, number, boolean],
        index: number,
      ): boolean =>
        name === expected[index]![0] &&
        live === expected[index]![2] &&
        nclose(weight, expected[index]![1]),
    );

  // 1-2. Direct pictures.
  TestValidator.equals(
    "a subject without a sequence plans nothing",
    planAutoMovieDrawLayers("film", { cut: dissolve.cut }, 2.5),
    null,
  );
  TestValidator.equals(
    "outside the transition the plan is null",
    [
      planAutoMovieDrawLayers("film", dissolve, 1),
      planAutoMovieDrawLayers("film", dissolve, 3.5),
    ],
    [null, null],
  );

  // 3-4. Inside each kind.
  TestValidator.predicate(
    "a dissolve's midpoint mixes both shots",
    same(shots(planAutoMovieDrawLayers("film", dissolve, 2.5)), [
      ["shot:a", 0.5, false],
      ["shot:b", 0.5, true],
    ]),
  );
  TestValidator.predicate(
    "a fade draws one shot at a time",
    same(shots(planAutoMovieDrawLayers("film", fade, 2.25)), [
      ["shot:a", 0.5, false],
    ]) &&
      same(shots(planAutoMovieDrawLayers("film", fade, 2.75)), [
        ["shot:b", 0.5, true],
      ]),
  );

  // 5. Without a shot placement.
  const placeless: (
    subject: ReturnType<typeof placed>,
  ) => ReturnType<typeof cut> = (
    subject: ReturnType<typeof placed>,
  ): ReturnType<typeof cut> => ({
    sequence: subject.sequence,
    cut: subject.cut,
  });
  TestValidator.predicate(
    "an outgoing shot without seekShot is refused by name",
    throwsError(
      (): unknown => planAutoMovieDrawLayers("film", placeless(dissolve), 2.5),
      'Subject "film" draws a crossDissolve into sequence entry 1',
    ) &&
      throwsError(
        (): unknown => planAutoMovieDrawLayers("film", placeless(fade), 2.25),
        "seekShot",
      ),
  );
  TestValidator.predicate(
    "a fade's second half draws the live shot without seekShot",
    same(shots(planAutoMovieDrawLayers("film", placeless(fade), 2.75)), [
      ["shot:b", 0.5, true],
    ]),
  );
}
