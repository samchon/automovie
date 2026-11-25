import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidRegion } from "../skeleton/AutoMovieHumanoidRegion";

/**
 * What a directed action aims at: another person's anatomical region, a region
 * of the performer's own body, a named point on a prop, a free point, or
 * nothing at all.
 *
 * - `person`: a region of another subject's body; the action commits to its
 *   position at its commit event and tracks it afterwards.
 * - `self`: a region of the performer's own body (a hand to the chin, to the hip,
 *   to the chest), read on the posture the performer is in.
 * - `prop`: a named point of a prop (a bag's centre, a pad's face, a handle), as
 *   the prop's profile declares it.
 * - `point`: a fixed point in the world or in the performer's own frame (+Z
 *   forward, +X left, +Y up, origin on the floor under the root), in metres, or
 *   in that frame in statures (`stature`), the performer's own measure, so one
 *   point fits every body. Its `normal` says which way the surface at the point
 *   faces (a table top faces up, a wall faces the room); without one the point
 *   faces back at the performer.
 * - `none`: shadow work and drills in the air; the aim point is that of a virtual
 *   opponent of the performer's own measure at `range` metres (default: the
 *   technique's own range), at the `line` height (default `middle`), so contact
 *   checks become extension checks.
 */
export type IAutoMovieMotionTarget =
  | {
      /** Discriminator. */
      kind: "person";
      /** The other subject's id. */
      subject: string;
      /** The region aimed at. */
      region: AutoMovieHumanoidRegion;
    }
  | {
      /** Discriminator. */
      kind: "self";
      /** The region of the performer's own body. */
      region: AutoMovieHumanoidRegion;
    }
  | {
      /** Discriminator. */
      kind: "prop";
      /** The prop subject's id. */
      subject: string;
      /** The prop's named point. */
      point: string;
    }
  | {
      /** Discriminator. */
      kind: "point";
      /**
       * The point: metres in "world" and "performer", statures of the performer
       * in "stature".
       */
      at: IAutoMovieVector3;
      /**
       * The frame the point is stated in: the world's, the performer's own in
       * metres, or the performer's own in statures.
       */
      frame: "world" | "performer" | "stature";
      /**
       * The outward direction of the surface at the point, in the same frame;
       * any non-zero vector. Faces the performer when absent.
       */
      normal?: IAutoMovieVector3;
    }
  | {
      /** Discriminator. */
      kind: "none";
      /** The virtual opponent's height line; `middle` when absent. */
      line?: "low" | "middle" | "high";
      /**
       * Distance to the virtual opponent, metres; the performer's own arm
       * length (upper arm, forearm and hand) when absent
       * ({@link IAutoMovieMotionHumanPerformanceAim.range}).
       */
      range?: number;
    };
