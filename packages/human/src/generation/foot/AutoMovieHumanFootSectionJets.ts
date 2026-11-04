import { AutoMovieHumanFootArc } from "./AutoMovieHumanFootArc";
import { AutoMovieHumanFootEdgeHandover } from "./AutoMovieHumanFootEdgeHandover";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootJunction } from "./AutoMovieHumanFootJunction";

type Vec2 = G.Vec2;

/**
 * The jets a body section's five guide points own: place, unit tangent in the
 * sense the ring runs (the crest toward the lateral side), and curvature.
 *
 * The crest and the two borders keep their tangent across or along the plane
 * (right at the crest, down at the lateral border, up at the medial border)
 * with the junction's derived curvature ({@link AutoMovieHumanFootJunction}).
 * The two contact edges take their tangent and curvature from the floor's to
 * their neighbours' over the heel corner's height
 * ({@link AutoMovieHumanFootEdgeHandover}). Each jet is what both arcs meeting
 * at the point copy through `AutoMovieHumanSeam.adopt`, so they meet G2.
 */
export namespace AutoMovieHumanFootSectionJets {
  /** A section's five guide points in its plane, `[across, up]`, mm. */
  export interface IPoints {
    /** The instep's crest. */
    crest: Vec2;

    /** The lateral border. */
    lateral: Vec2;

    /** The lateral edge of the plantar contact. */
    contactLateral: Vec2;

    /** The medial edge of the plantar contact. */
    contactMedial: Vec2;

    /** The medial border. */
    medial: Vec2;
  }

  /** What the jets read. */
  export interface IInput {
    /** The five points. */
    points: IPoints;

    /** The lateral and medial contact edges' heights over the floor, mm. */
    heights: { lateral: number; medial: number };

    /** The heel's posterior corner's height, mm. */
    corner: number;
  }

  /** The five jets. */
  export interface IJets {
    /** The crest's. */
    crest: AutoMovieHumanFootArc.IJet;

    /** The lateral border's. */
    lateral: AutoMovieHumanFootArc.IJet;

    /** The lateral contact edge's. */
    contactLateral: AutoMovieHumanFootArc.IJet;

    /** The medial contact edge's. */
    contactMedial: AutoMovieHumanFootArc.IJet;

    /** The medial border's. */
    medial: AutoMovieHumanFootArc.IJet;
  }

  /** The jets of a section's five points. */
  export function of(input: IInput): IJets {
    const p: IPoints = input.points;
    const right: Vec2 = [1, 0];
    const down: Vec2 = [0, -1];
    const up: Vec2 = [0, 1];
    const jet = (point: Vec2, tangent: Vec2, curvature: number): AutoMovieHumanFootArc.IJet => ({ point, tangent, curvature });

    // The contact edges leave the floor round the heel's corner.
    const tl: Vec2 = AutoMovieHumanFootEdgeHandover.tangent(input.heights.lateral, input.corner, p.lateral, p.contactLateral, p.contactMedial);
    const tm: Vec2 = AutoMovieHumanFootEdgeHandover.tangent(input.heights.medial, input.corner, p.contactLateral, p.contactMedial, p.medial);

    return {
      crest: jet(p.crest, right, AutoMovieHumanFootJunction.curvature(p.crest, right, [p.lateral, p.medial])),
      lateral: jet(p.lateral, down, AutoMovieHumanFootJunction.curvature(p.lateral, down, [p.crest, p.contactLateral])),
      medial: jet(p.medial, up, AutoMovieHumanFootJunction.curvature(p.medial, up, [p.contactMedial, p.crest])),
      contactLateral: jet(
        p.contactLateral,
        tl,
        AutoMovieHumanFootEdgeHandover.curvature(
          input.heights.lateral,
          input.corner,
          AutoMovieHumanFootJunction.curvature(p.contactLateral, tl, [p.lateral, p.contactMedial]),
        ),
      ),
      contactMedial: jet(
        p.contactMedial,
        tm,
        AutoMovieHumanFootEdgeHandover.curvature(
          input.heights.medial,
          input.corner,
          AutoMovieHumanFootJunction.curvature(p.contactMedial, tm, [p.contactLateral, p.medial]),
        ),
      ),
    };
  }
}
