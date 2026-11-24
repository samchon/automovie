import type {
  AutoMovieHumanSide,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A court phrase's hand target in the performer's own frame (+X left, +Z
 * ahead), from the shoulders' midpoint, at the stroke's progress `u` and the
 * follow-through's `follow`, both in [0, 1], scaled by the arm's length:
 *
 * - A contest's hands raised wide and waving twice over the stroke;
 * - A dribble's hand pressing down outside the hip;
 * - A handball throw's hand cocked behind the shoulder, driven forward and
 *   following down;
 * - A set shot's hands either side of the ball rising to release over the head,
 *   the palms turning up;
 * - A chest or bounce pass's hands either side of the ball pushing forward, the
 *   bounce pass aiming down.
 *
 * The shares are provisional staging values (FIBA WABC Level 2 §1.1.1 for the
 * contest's high hand; Wagner et al. 2011, J Sports Sci Med 10:73, for the
 * grounded handball throw).
 *
 * @param kind The court phrase.
 * @param side The hand.
 * @param u The stroke's progress.
 * @param follow The follow-through's progress.
 * @param width The shoulder half width, metres.
 * @param arm The arm's length, metres.
 * @param radius The ball's radius, metres; none for an empty-handed phrase.
 * @returns The hand's offset and its palm's facing, unnormalised.
 */
export function ballCourtHand(
  kind: ballCourtHand.Kind,
  side: AutoMovieHumanSide,
  u: number,
  follow: number,
  width: number,
  arm: number,
  radius: number,
): ballCourtHand.ITarget {
  const sign: number = side === "left" ? 1 : -1;
  switch (kind) {
    case "highHandContest": {
      const wave: number = Math.sin(4 * Math.PI * u) * arm * 0.13;
      return {
        offset: {
          x: sign * (width + 0.1 * arm + wave),
          y: arm * (0.49 + 0.24 * u),
          z: 0.21 * arm,
        },
        facing: { x: 0, y: 0, z: 1 },
      };
    }
    case "dribbleRelease":
      return {
        offset: {
          x: sign * (width + 0.09 * arm),
          y: -(0.39 + 0.34 * u) * arm,
          z: 0.27 * arm,
        },
        facing: { x: 0, y: -1, z: 0 },
      };
    case "handballThrow":
      return {
        offset: {
          x: sign * (width + (0.37 - 0.19 * u) * arm),
          y: (0.4 + 0.2 * u - 0.36 * follow) * arm,
          z: (-0.2 + 0.71 * u + 0.15 * follow) * arm,
        },
        facing: { x: 0, y: 0, z: 1 },
      };
    case "setShot":
      return {
        offset: {
          x: sign * radius,
          y: (0.18 + 0.67 * u) * arm,
          z: (0.34 + 0.08 * u) * arm,
        },
        facing: { x: -sign * (1 - u), y: u, z: 0.4 * u },
      };
    case "bouncePass":
    case "chestPass":
      return {
        offset: {
          x: sign * (radius + 0.06 * arm * follow),
          y: (-0.2 - (kind === "bouncePass" ? 0.27 : 0.05) * u) * arm,
          z: (0.31 + 0.45 * u + 0.08 * follow) * arm,
        },
        facing: {
          x: -sign,
          y: kind === "bouncePass" ? -0.4 * u : 0,
          z: u,
        },
      };
  }
}

/** The court phrases and their hand targets. */
export namespace ballCourtHand {
  /** The court phrases the ball court plans. */
  export type Kind =
    | "dribbleRelease"
    | "chestPass"
    | "bouncePass"
    | "setShot"
    | "handballThrow"
    | "highHandContest";

  /** A hand's target in the performer's frame. */
  export interface ITarget {
    /** The hand's place from the shoulders' midpoint, metres. */
    offset: IAutoMovieVector3;

    /** The palm's facing, unnormalised. */
    facing: IAutoMovieVector3;
  }
}
