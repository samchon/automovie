import type {
  AutoMovieInteractionEventKind,
  IAutoMovieConstraintViolation,
  IAutoMovieInteractionEvent,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import type { FilmLaunchPerformer } from "./FilmLaunchPerformer";

/**
 * Run the launch entry's existing projectile/target, finite-positive speed, force, reachability, late-contact and self-target cases through its real performer. Authored ids, shot span and input ranges determine located negative expectations, while the point-flight neighbor omits onHit because it identifies no struck actor and checks actual flight/contact with no recoil. The discoverable launch entry owns these portable assertions; launch_camera retains point/group onHit refusal, and this helper supplies no independent ballistic solver or host.
 */
export function assertFilmLaunchAdmission(perform: FilmLaunchPerformer): void {
  // 2. the projectile must be a staged scene object
  const unstaged: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "archer",
      start: 0.2,
      duration: "auto",
      projectile: "ghost",
      at: { kind: "node", node: "foe" },
      speed: 22,
    },
  ]);
  TestValidator.equals("an unstaged projectile fails", unstaged.success, false);
  if (unstaged.success === false)
    TestValidator.predicate(
      "the violation names the projectile",
      unstaged.violations.some((v: IAutoMovieConstraintViolation): boolean =>
        v.path.includes(".projectile"),
      ),
    );

  // 3. the aim must resolve to a point
  const relative: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "archer",
      start: 0.2,
      duration: "auto",
      projectile: "arrow",
      at: { kind: "direction", headingDeg: 90 },
      speed: 22,
    },
  ]);
  TestValidator.equals("an unresolvable target fails", relative.success, false);
  if (relative.success === false)
    TestValidator.predicate(
      "the violation names the target",
      relative.violations.some((v: IAutoMovieConstraintViolation): boolean =>
        v.path.includes(".at"),
      ),
    );

  // 4. the speed itself must be positive
  const stopped: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "archer",
      start: 0.2,
      duration: "auto",
      projectile: "arrow",
      at: { kind: "node", node: "foe" },
      speed: 0,
    },
  ]);
  TestValidator.equals("a stopped launch fails", stopped.success, false);
  if (stopped.success === false)
    TestValidator.predicate(
      "the violation names the non-positive speed",
      stopped.violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.kind === "range" && v.path.includes(".speed"),
      ),
    );

  // 5. the speed itself must be finite
  const infiniteSpeed: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "archer",
      start: 0.2,
      duration: "auto",
      projectile: "arrow",
      at: { kind: "node", node: "foe" },
      speed: Number.POSITIVE_INFINITY,
    },
  ]);
  TestValidator.equals(
    "an infinite-speed launch fails",
    infiniteSpeed.success,
    false,
  );
  if (infiniteSpeed.success === false)
    TestValidator.predicate(
      "the violation requires finite speed",
      infiniteSpeed.violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.kind === "range" &&
          v.path.includes(".speed") &&
          v.expected.includes("finite"),
      ),
    );

  // 6. a launch's scheduled reaction force must already be in range
  const heavyHit: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "archer",
      start: 0.2,
      duration: "auto",
      projectile: "arrow",
      at: { kind: "node", node: "foe" },
      speed: 22,
      onHit: { force: 1.5 },
    },
  ]);
  TestValidator.equals(
    "an oversized onHit force fails",
    heavyHit.success,
    false,
  );
  if (heavyHit.success === false)
    TestValidator.predicate(
      "the violation names the onHit force",
      heavyHit.violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.kind === "range" && v.path.includes(".onHit.force"),
      ),
    );

  // 7. the shot must reach the target at the given speed
  const short: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "archer",
      start: 0.2,
      duration: "auto",
      projectile: "arrow",
      at: { kind: "node", node: "foe" },
      speed: 2,
    },
  ]);
  TestValidator.equals("an out-of-range launch fails", short.success, false);
  if (short.success === false)
    TestValidator.predicate(
      "the violation names the speed",
      short.violations.some((v: IAutoMovieConstraintViolation): boolean =>
        v.path.includes(".speed"),
      ),
    );

  // 8. a bare-point aim flies but schedules no reaction (no actor to recoil)
  const pointed: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "archer",
      start: 0.2,
      duration: "auto",
      projectile: "arrow",
      at: { kind: "point", point: { x: 6, y: 0.2, z: 0 } },
      speed: 22,
    },
  ]);
  TestValidator.equals(
    "a point-aimed launch still performs",
    pointed.success,
    true,
  );
  if (pointed.success === true) {
    TestValidator.equals(
      "the arrow still flies",
      pointed.shot.objectMotions.length,
      1,
    );
    TestValidator.equals(
      "but nobody is scheduled to react",
      pointed.shot.performances.length,
      0,
    );
    TestValidator.equals(
      "the point aim records contact but no hit",
      (pointed.shot.events ?? []).map(
        (event: IAutoMovieInteractionEvent): AutoMovieInteractionEventKind =>
          event.kind,
      ),
      ["contact"],
    );
    TestValidator.equals(
      "the point contact has no target actor",
      pointed.shot.events![0]!.target,
      null,
    );
  }

  // 9. the computed hit must still land inside the shot window
  const late: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "archer",
      start: 1.9,
      duration: "auto",
      projectile: "arrow",
      at: { kind: "node", node: "foe" },
      speed: 22,
      onHit: { force: 0.6 },
    },
  ]);
  TestValidator.equals("a late landing launch fails", late.success, false);
  if (late.success === false)
    TestValidator.predicate(
      "the violation names the speed/timing",
      late.violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.kind === "range" && v.path.includes(".speed"),
      ),
    );

  // 10. the projectile is the flown object, not the launching actor
  const projectileActor: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "arrow",
      start: 0.2,
      duration: "auto",
      projectile: "arrow",
      at: { kind: "node", node: "foe" },
      speed: 22,
    },
  ]);
  TestValidator.equals(
    "projectile-as-actor launch fails",
    projectileActor.success,
    false,
  );
  if (projectileActor.success === false)
    TestValidator.predicate(
      "the violation names the projectile",
      projectileActor.violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.kind === "type" && v.path.includes(".projectile"),
      ),
    );

  // 11. a projectile cannot be aimed at its own staged node
  const selfTarget: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "archer",
      start: 0.2,
      duration: "auto",
      projectile: "arrow",
      at: { kind: "node", node: "arrow" },
      speed: 4,
    },
  ]);
  TestValidator.equals(
    "projectile self-target launch fails",
    selfTarget.success,
    false,
  );
  if (selfTarget.success === false)
    TestValidator.predicate(
      "the violation names the target",
      selfTarget.violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.kind === "type" && v.path.includes(".at"),
      ),
    );
}
