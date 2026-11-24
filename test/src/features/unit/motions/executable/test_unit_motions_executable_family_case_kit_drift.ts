import type {
  AutoMovieHumanoidBone,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { FamilyCaseKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `FamilyCaseKit.drift` is the greatest distance of a bone's joint from a
 * moving point over a span, on the 24 Hz grid.
 *
 * The hand moves along +X at 1 m/s from the origin; the point stands still at
 * the origin.
 *
 * Scenarios:
 *
 * 1. Over 0 to 0.5 s the hand drifts at most 0.5 m, at the span's end.
 * 2. A point that follows the hand sees no drift.
 */
export function test_unit_motions_executable_family_case_kit_drift(): void {
  const shown: Parameters<typeof FamilyCaseKit.drift>[0] = {
    bones: (
      _subject: string,
      seconds: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      new Map([
        [
          "rightHand",
          {
            bone: "rightHand",
            localRotation: { x: 0, y: 0, z: 0, w: 1 },
            worldPosition: { x: seconds, y: 1, z: 0 },
            worldRotation: { x: 0, y: 0, z: 0, w: 1 },
          },
        ],
      ]),
  };
  TestValidator.predicate(
    "the worst drift, and none",
    nclose(
      FamilyCaseKit.drift(
        shown,
        "a",
        "rightHand",
        (): IAutoMovieVector3 => ({ x: 0, y: 1, z: 0 }),
        0,
        0.5,
      ),
      0.5,
      1e-9,
    ) &&
      FamilyCaseKit.drift(
        shown,
        "a",
        "rightHand",
        (t: number): IAutoMovieVector3 => ({ x: t, y: 1, z: 0 }),
        0,
        0.5,
      ) === 0,
  );
}
