import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { FamilyCaseKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * The capture families' shared kit: a joint's clinical angle, a bone's drift
 * from a moving point, an action's event second, the drawn instants, a banded
 * verdict, and a refused case standing in for a refused performance.
 *
 * Scenarios:
 *
 * 1. A shoulder at (30, 45, unset) reads its 45 degree abduction.
 * 2. A hand moving along +X at 1 m/s drifts 0.5 m from the origin over 0 to 0.5 s,
 *    on the 24 Hz grid.
 * 3. A wave over 3 to 4 s peaking a quarter in peaks at 3.25 s; an event no action
 *    has is refused.
 * 4. A one-second performance drawn every 0.25 s with a hit at 0.3 s gives the
 *    0.25 s instant up to the hit.
 * 5. 91 degrees fails a 0 to 90 degree band, shown in degrees.
 * 6. A build that throws yields null and appends its refused case: no figure and
 *    one failing `planned` verdict with the thrown message.
 */
export function test_unit_motions_executable_family_case_kit(): void {
  // 1. An angle.
  TestValidator.equals(
    "the abduction",
    FamilyCaseKit.angle(
      {
        pose: (): IAutoMoviePose => ({
          skeleton: "s",
          root: null,
          joints: [
            { bone: "rightUpperArm", flexion: 30, abduction: 45, twist: null },
          ],
        }),
      },
      "a",
      0,
      "rightUpperArm",
      1,
    ),
    45,
  );

  // 2. A drift.
  const hand: Parameters<typeof FamilyCaseKit.drift>[0] = {
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
    "the worst drift",
    nclose(
      FamilyCaseKit.drift(
        hand,
        "a",
        "rightHand",
        (): IAutoMovieVector3 => ({ x: 0, y: 1, z: 0 }),
        0,
        0.5,
      ),
      0.5,
      1e-9,
    ),
  );

  // 3. An event.
  const waved: Parameters<typeof FamilyCaseKit.event>[0] = {
    segments: () => [
      {
        name: "wave",
        start: 3,
        plan: { duration: 1, events: [{ name: "peak", share: 0.25 }] },
      },
    ],
  };
  TestValidator.predicate(
    "the event's second",
    FamilyCaseKit.event(waved, "peak") === 3.25 &&
      throwsError(() => FamilyCaseKit.event(waved, "jump")),
  );

  // 4. The instants.
  TestValidator.equals(
    "the grid around a named instant",
    FamilyCaseKit.times({ duration: 1 }, 0.25, [[0.3, "hit"]]),
    [
      { seconds: 0, label: "0.00 s" },
      { seconds: 0.3, label: "hit" },
      { seconds: 0.5, label: "0.50 s" },
      { seconds: 0.75, label: "0.75 s" },
      { seconds: 1, label: "1.00 s" },
    ] satisfies IMotionCaptureCase.ITime[],
  );

  // 5. A band.
  TestValidator.equals(
    "outside the band",
    FamilyCaseKit.band("knee", 91, 0, 90, "deg"),
    {
      name: "knee",
      passed: false,
      detail: "91.00 deg (band 0.00 deg to 90.00 deg)",
    },
  );

  // 6. A refused build.
  const out: IMotionCaptureCase[] = [];
  TestValidator.equals(
    "a refused case",
    [
      FamilyCaseKit.attempt(out, "kick", (): number => {
        throw new Error("out of reach");
      }),
      out,
    ],
    [
      null,
      [
        {
          name: "kick",
          times: [{ seconds: 0, label: "refused" }],
          performers: [],
          verdicts: [
            { name: "planned", passed: false, detail: "out of reach" },
          ],
        },
      ],
    ],
  );
}
