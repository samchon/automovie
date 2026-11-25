import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionManner,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  AutoMovieMotionManner,
  ballCourtClock,
  ballCourtHand,
  ballCourtSphere,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_sport_ball_court_clock`. */
namespace ScenarioBallCourtClock {
  /**
   * `ballCourtClock` times a court phrase: its preparation and attack, a 0.22 s
   * follow-through, the finish held 0.85 s for a release or 0.24 s for a contest,
   * and a 0.34 s return; the manner's tempo stretches the moving spans and its
   * hold the held finish.
   *
   * Scenarios:
   *
   * 1. A chest pass (0.37 s, 0.24 s) under the neutral manner releases at 0.61 s,
   *    finishes its follow-through at 0.83 s, relaxes at 1.68 s and ends at 2.02
   *    s.
   * 2. A contest's finish holds 0.24 s.
   * 3. Twice as slow, the chest pass releases at 1.22 s and still holds its finish
   *    0.85 s.
   */
  export function test_unit_motions_sport_ball_court_clock(): void {
    const pass: IAutoMovieMotionClock = ballCourtClock(
      { prepare: 0.37, attack: 0.24 },
      false,
      AutoMovieMotionManner.NEUTRAL,
    );
    TestValidator.predicate(
      "the chest pass",
      nclose(pass.at("stroke"), 0.61, 1e-12) &&
        nclose(pass.at("strokeEnd"), 0.83, 1e-12) &&
        nclose(pass.at("relax"), 1.68, 1e-12) &&
        nclose(pass.duration, 2.02, 1e-12),
    );
    const contest: IAutoMovieMotionClock = ballCourtClock(
      { prepare: 0.34, attack: 0.55 },
      true,
      AutoMovieMotionManner.NEUTRAL,
    );
    TestValidator.predicate(
      "the contest's hold",
      nclose(contest.at("relax") - contest.at("strokeEnd"), 0.24, 1e-12),
    );
    const slow: IAutoMovieMotionManner.IModifiers = {
      ...AutoMovieMotionManner.NEUTRAL,
      tempo: 2,
    };
    const late: IAutoMovieMotionClock = ballCourtClock(
      { prepare: 0.37, attack: 0.24 },
      false,
      slow,
    );
    TestValidator.predicate(
      "the slow pass",
      nclose(late.at("stroke"), 1.22, 1e-12) &&
        nclose(late.at("relax") - late.at("strokeEnd"), 0.85, 1e-12),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_ball_court_hand`. */
namespace ScenarioBallCourtHand {
  /** The shoulder half width, the arm's length and the ball's radius, metres. */
  const WIDTH: number = 0.2;
  const ARM: number = 0.6;
  const RADIUS: number = 0.12;

  /**
   * `ballCourtHand` places a court phrase's hand in the performer's frame (+X
   * left) from the shoulders' midpoint, by the stroke's and the follow-through's
   * progress, in arm lengths.
   *
   * Scenarios:
   *
   * 1. A right-hand chest pass starts on the ball's side 0.2 arms below and 0.31
   *    ahead, palm toward the ball, and ends 0.84 arms ahead pushing forward.
   * 2. A bounce pass ends 0.47 arms below, aiming down.
   * 3. A contest's left hand at an eighth of the stroke is at its first wave's
   *    crest, 0.13 arms out.
   * 4. A set shot's left hand releases 0.85 arms up, the palm turned up.
   */
  export function test_unit_motions_sport_ball_court_hand(): void {
    const at = (
      kind: ballCourtHand.Kind,
      side: "left" | "right",
      u: number,
      follow: number,
    ): ballCourtHand.ITarget =>
      ballCourtHand(kind, side, u, follow, WIDTH, ARM, RADIUS);
    const pass0: ballCourtHand.ITarget = at("chestPass", "right", 0, 0);
    const pass1: ballCourtHand.ITarget = at("chestPass", "right", 1, 1);
    TestValidator.predicate(
      "the chest pass",
      vclose(
        pass0.offset,
        { x: -RADIUS, y: -0.2 * ARM, z: 0.31 * ARM },
        1e-12,
      ) &&
        vclose(pass0.facing, { x: 1, y: 0, z: 0 }, 1e-12) &&
        vclose(
          pass1.offset,
          { x: -(RADIUS + 0.06 * ARM), y: -0.25 * ARM, z: 0.84 * ARM },
          1e-12,
        ) &&
        vclose(pass1.facing, { x: 1, y: 0, z: 1 }, 1e-12),
    );
    TestValidator.predicate(
      "the bounce pass aims down",
      vclose(
        at("bouncePass", "right", 1, 0).offset,
        {
          x: -RADIUS,
          y: -0.47 * ARM,
          z: 0.76 * ARM,
        },
        1e-12,
      ) &&
        vclose(
          at("bouncePass", "right", 1, 0).facing,
          { x: 1, y: -0.4, z: 1 },
          1e-12,
        ),
    );
    TestValidator.predicate(
      "the contest's wave crest",
      vclose(
        at("highHandContest", "left", 0.125, 0).offset,
        { x: WIDTH + 0.23 * ARM, y: 0.52 * ARM, z: 0.21 * ARM },
        1e-12,
      ),
    );
    TestValidator.predicate(
      "the set shot's release",
      vclose(
        at("setShot", "left", 1, 0).offset,
        {
          x: RADIUS,
          y: 0.85 * ARM,
          z: 0.42 * ARM,
        },
        1e-12,
      ) &&
        vclose(
          at("setShot", "left", 1, 0).facing,
          { x: 0, y: 1, z: 0.4 },
          1e-12,
        ),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_ball_court_sphere`. */
namespace ScenarioBallCourtSphere {
  /** A basketball's 0.12 m sphere collider, its centre 1 cm above the origin. */
  const SPHERE: IAutoMoviePhysicalShape = {
    id: "ball",
    material: "rubber",
    transform: {
      position: { x: 0, y: 0.01, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    kind: "sphere",
    radius: 0.12,
  };

  /** A court ball with its colliders and body. */
  const ball = (
    more: Partial<IAutoMovieMotionHumanProp> = {},
  ): IAutoMovieMotionHumanProp => ({
    subject: "ball",
    frame: {
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    shapes: [SPHERE],
    ...more,
  });

  /** A context whose hands hold what is given, reading the one ball. */
  const context = (
    prop: IAutoMovieMotionHumanProp,
    right: string | undefined,
  ): Parameters<typeof ballCourtSphere>[0] => ({
    prop: (): IAutoMovieMotionHumanPropReader => ({
      prop,
      frame: (): IAutoMovieRigidTransform => prop.frame,
    }),
    entry: { holds: right === undefined ? {} : { right } },
  });

  /**
   * `ballCourtSphere` reads the one spherical ball a court release moves: held by
   * a releasing hand, portable, with one sphere collider whose radius and centre
   * the launch carries; a ball with restitution and no friction launches with no
   * tangential loss.
   *
   * Scenarios:
   *
   * 1. Held in the right hand, the ball's sphere is its 0.12 m collider about its 1
   *    cm offset.
   * 2. With a restitution and no friction its sphere carries no tangential friction
   *    loss.
   * 3. A ball no releasing hand holds, a fixed ball or one of two colliders is
   *    refused.
   */
  export function test_unit_motions_sport_ball_court_sphere(): void {
    TestValidator.equals(
      "the held ball's sphere",
      ballCourtSphere(context(ball(), "ball"), "ball", ["right"]).sphere,
      { radius: 0.12, centre: { x: 0, y: 0.01, z: 0 } },
    );
    TestValidator.equals(
      "a lossless bounce",
      ballCourtSphere(
        context(
          ball({ body: { mass: 0.6, centerOfMass: null, restitution: 0.8 } }),
          "ball",
        ),
        "ball",
        ["right"],
      ).sphere,
      { radius: 0.12, centre: { x: 0, y: 0.01, z: 0 }, tangentialFriction: 0 },
    );
    TestValidator.predicate(
      "unheld, fixed, or not one sphere",
      throwsError(() =>
        ballCourtSphere(context(ball(), undefined), "ball", ["right"]),
      ) &&
        throwsError(() =>
          ballCourtSphere(context(ball({ fixed: true }), "ball"), "ball", [
            "right",
          ]),
        ) &&
        throwsError(() =>
          ballCourtSphere(
            context(ball({ shapes: [SPHERE, SPHERE] }), "ball"),
            "ball",
            ["right"],
          ),
        ),
    );
  }
}

/**
 * The `ball_court` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export function test_unit_motions_sport_ball_court(): void {
  ScenarioBallCourtClock.test_unit_motions_sport_ball_court_clock();
  ScenarioBallCourtHand.test_unit_motions_sport_ball_court_hand();
  ScenarioBallCourtSphere.test_unit_motions_sport_ball_court_sphere();
}
