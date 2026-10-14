import { TestValidator } from "@nestia/e2e";
import type { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import type { IAutoMovieActionTarget, IAutoMovieClip, IAutoMovieConstraintViolation, IAutoMovieVector3 } from "@automovie/interface";

import type { FilmLaunchPerformer } from "./FilmLaunchPerformer";
import { namedFacts } from "./predicates";

/**
 * Run the launch entry's existing volley identities and live-bone handoff cases through its performer. Authored projectile order determines unique clip names and callback data distinguishes available, later-unavailable and unstaged bones; these checks establish admission and resulting clip population without independently solving an intercept. The owning unit discovers and executes these existing cases with no process or renderer.
 */
export function assertFilmLaunchTargetHandoffs(
  perform: FilmLaunchPerformer,
): void {
  // 10. a volley: two launches of one projectile bake unique flight ids
  const volley: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "archer",
      start: 0.2,
      duration: 0.5,
      projectile: "arrow",
      at: { kind: "node", node: "foe" },
      speed: 22,
    },
    {
      verb: "launch",
      actor: "archer",
      start: 1.2,
      duration: 0.5,
      projectile: "arrow",
      at: { kind: "node", node: "foe" },
      speed: 22,
    },
  ]);
  TestValidator.equals("the volley performs", volley.success, true);
  if (volley.success === true)
    TestValidator.equals(
      "volley flights carry unique draft-ordered ids",
      volley.shot.objectMotions
        .map((c: IAutoMovieClip): string => c.id)
        .sort((a: string, b: string): number => a.localeCompare(b)),
      ["trajectory:arrow", "trajectory:arrow:2"],
    );

  const liveBone: IAutoMoviePerformedShot = perform(
    [
      {
        verb: "launch",
        actor: "archer",
        start: 0.2,
        duration: "auto",
        projectile: "arrow",
        at: { kind: "bone", node: "foe", bone: "leftHand" },
        speed: 22,
        onHit: { force: 0.6 },
      },
    ],
    (_target: IAutoMovieActionTarget, seconds: number): IAutoMovieVector3 => ({ x: 6 - seconds, y: 1.2, z: 0 }),
  );
  TestValidator.equals(
    "a launch samples its live bone target while solving the intercept",
    namedFacts([
      ["refused", (): boolean => liveBone.success === true],
      [
        "violated",
        (): boolean =>
          liveBone.success === true && liveBone.shot.objectMotions.length === 1,
      ],
    ]),
    { refused: true, violated: true },
  );

  const unavailableBone: IAutoMoviePerformedShot = perform(
    [
      {
        verb: "launch",
        actor: "archer",
        start: 0.2,
        duration: "auto",
        projectile: "arrow",
        at: { kind: "bone", node: "foe", bone: "leftHand" },
        speed: 22,
        onHit: { force: 0.6 },
      },
    ],
    (_target: IAutoMovieActionTarget, seconds: number): IAutoMovieVector3 | null => (seconds === 0 ? { x: 6, y: 1.2, z: 0 } : null),
  );
  TestValidator.equals(
    "a missing live bone sample falls back to the validated target",
    namedFacts([
      ["refused", (): boolean => unavailableBone.success === true],
      [
        "violated",
        (): boolean =>
          unavailableBone.success === true &&
          unavailableBone.shot.objectMotions.length === 1,
      ],
    ]),
    { refused: true, violated: true },
  );

  const unstagedBone: IAutoMoviePerformedShot = perform(
    [
      {
        verb: "launch",
        actor: "archer",
        start: 0.2,
        duration: "auto",
        projectile: "arrow",
        at: { kind: "bone", node: "ghost", bone: "leftHand" },
        speed: 22,
      },
    ],
    (): IAutoMovieVector3 => ({ x: 6, y: 1.2, z: 0 }),
  );
  TestValidator.equals(
    "launch refuses a bone target outside the staged scene",
    namedFacts([
      ["refused", (): boolean => unstagedBone.success === false],
      [
        "violated",
        (): boolean =>
          unstagedBone.success === false &&
          unstagedBone.violations.some(
            (violation: IAutoMovieConstraintViolation): boolean =>
              violation.path.endsWith(".at.node") &&
              violation.expected.includes("staged scene node"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
}
