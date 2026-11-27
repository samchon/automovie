import { AutoMovieEngineSequence, AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieCompileAttach,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../internal/createSkeleton";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * Allow 40 rounded terms at world coordinates within 4 m through FK,
 * composition and interpolation.
 */
const OFFSET_ROUNDING: number = 160 * Number.EPSILON;

/**
 * A child offset composes in the parent's posed bone before world placement.
 *
 * Scenarios:
 *
 * 1. Yawing the parent +90° takes local +X to world −Z, and the authored X quarter
 *    turn composes before the Y quarter turn. Both clip ends agree.
 * 2. A ridden parent's current frame replaces the staged frame at each key.
 * 3. A key count without an exact integer representation refuses before any reader
 *    is called.
 */
export function test_engine_film_attachment_local_offset(): void {
  const parent: IAutoMovieTransform = {
    translation: { x: 3, y: 0, z: 0 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const input: IAutoMovieCompileAttach.IProps = {
    child: "lantern",
    bone: "hips",
    offset: {
      position: { x: 1, y: 0, z: 0 },
      rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
    },
    parentTransform: parent,
    parentSkeleton: createSkeleton(),
    start: 0.5,
    duration: 1,
    fps: 1,
    shotDuration: 2,
  };
  const clip: IAutoMovieClip = AutoMovieEngineFilm.compileAttach(input);
  const matches = (
    values: readonly number[],
    expected: readonly number[],
  ): boolean =>
    values.length === expected.length &&
    values.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, OFFSET_ROUNDING),
    );
  TestValidator.predicate(
    "the bone-local offset is already in the correct world frame at each end",
    [0.5, 1.5].every((seconds: number): boolean => {
      const channels: ReturnType<typeof AutoMovieEngineSequence.sampleClip> = AutoMovieEngineSequence.sampleClip(clip, seconds);
      return (
        matches(channels.get("node:lantern:translation")!.value, [3, 1, -1]) &&
        matches(
          channels.get("node:lantern:rotation")!.value,
          [0.5, 0.5, -0.5, 0.5],
        )
      );
    }),
  );

  const ridden: IAutoMovieClip = AutoMovieEngineFilm.compileAttach({
    ...input,
    parentTransformAt: (seconds: number): IAutoMovieTransform | null =>
      seconds < 1 ? null : { ...parent, translation: { x: 0, y: 2, z: 0 } },
  });
  TestValidator.predicate(
    "a ridden frame replaces the staged parent only where its reader supplies one",
    matches(
      AutoMovieEngineSequence.sampleClip(ridden, 0.5).get("node:lantern:translation")!.value,
      [3, 1, -1],
    ) &&
      matches(
        AutoMovieEngineSequence.sampleClip(ridden, 1.5).get("node:lantern:translation")!.value,
        [0, 3, -1],
      ),
  );
  TestValidator.predicate(
    "an unrepresentable key count refuses before reading the parent frame",
    throwsError(
      (): IAutoMovieClip =>
        AutoMovieEngineFilm.compileAttach({
          ...input,
          duration: Number.MAX_SAFE_INTEGER,
          fps: 2,
          parentTransformAt: (): never => {
            throw new Error("the frame callback must not be evaluated");
          },
        }),
      "key count exceeds the safe integer range",
    ),
  );
}
