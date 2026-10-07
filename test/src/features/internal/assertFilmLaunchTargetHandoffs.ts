import { TestValidator } from "@nestia/e2e";

import type { FilmLaunchPerformer } from "./FilmLaunchPerformer";
import { namedFacts } from "./predicates";

/** Run the existing volley identity and live bone target handoff assertions. */
export function assertFilmLaunchTargetHandoffs(
  perform: FilmLaunchPerformer,
): void {
  // 10. a volley: two launches of one projectile bake unique flight ids
  const volley = perform([
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
        .map((c) => c.id)
        .sort((a, b) => a.localeCompare(b)),
      ["trajectory:arrow", "trajectory:arrow:2"],
    );

  const liveBone = perform(
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
    (_target, seconds) => ({ x: 6 - seconds, y: 1.2, z: 0 }),
  );
  TestValidator.equals(
    "a launch samples its live bone target while solving the intercept",
    namedFacts([
      ["refused", () => liveBone.success === true],
      [
        "violated",
        () =>
          liveBone.success === true && liveBone.shot.objectMotions.length === 1,
      ],
    ]),
    { refused: true, violated: true },
  );

  const unavailableBone = perform(
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
    (_target, seconds) => (seconds === 0 ? { x: 6, y: 1.2, z: 0 } : null),
  );
  TestValidator.equals(
    "a missing live bone sample falls back to the validated target",
    namedFacts([
      ["refused", () => unavailableBone.success === true],
      [
        "violated",
        () =>
          unavailableBone.success === true &&
          unavailableBone.shot.objectMotions.length === 1,
      ],
    ]),
    { refused: true, violated: true },
  );

  const unstagedBone = perform(
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
    () => ({ x: 6, y: 1.2, z: 0 }),
  );
  TestValidator.equals(
    "launch refuses a bone target outside the staged scene",
    namedFacts([
      ["refused", () => unstagedBone.success === false],
      [
        "violated",
        () =>
          unstagedBone.success === false &&
          unstagedBone.violations.some(
            (violation) =>
              violation.path.endsWith(".at.node") &&
              violation.expected.includes("staged scene node"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
}
