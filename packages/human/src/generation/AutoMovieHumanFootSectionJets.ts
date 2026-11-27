import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanFootArc,
  IAutoMovieHumanFootSectionJets,
} from "@automovie/interface";

import { AutoMovieHumanFootEdgeHandover } from "./AutoMovieHumanFootEdgeHandover";
import { AutoMovieHumanFootJunction } from "./AutoMovieHumanFootJunction";

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
  /** The jets of a section's five points. */
  export function of(
    input: IAutoMovieHumanFootSectionJets.IInput,
  ): IAutoMovieHumanFootSectionJets.IJets {
    const p: IAutoMovieHumanFootSectionJets.IPoints = input.points;
    const right: AutoMovieVector2Tuple = [1, 0];
    const down: AutoMovieVector2Tuple = [0, -1];
    const up: AutoMovieVector2Tuple = [0, 1];
    const jet = (
      point: AutoMovieVector2Tuple,
      tangent: AutoMovieVector2Tuple,
      curvature: number,
    ): IAutoMovieHumanFootArc.IJet => ({ point, tangent, curvature });

    // The contact edges leave the floor round the heel's corner.
    const tl: AutoMovieVector2Tuple = AutoMovieHumanFootEdgeHandover.tangent(
      input.heights.lateral,
      input.corner,
      p.lateral,
      p.contactLateral,
      p.contactMedial,
    );
    const tm: AutoMovieVector2Tuple = AutoMovieHumanFootEdgeHandover.tangent(
      input.heights.medial,
      input.corner,
      p.contactLateral,
      p.contactMedial,
      p.medial,
    );

    return {
      crest: jet(
        p.crest,
        right,
        AutoMovieHumanFootJunction.curvature(p.crest, right, [
          p.lateral,
          p.medial,
        ]),
      ),
      lateral: jet(
        p.lateral,
        down,
        AutoMovieHumanFootJunction.curvature(p.lateral, down, [
          p.crest,
          p.contactLateral,
        ]),
      ),
      medial: jet(
        p.medial,
        up,
        AutoMovieHumanFootJunction.curvature(p.medial, up, [
          p.contactMedial,
          p.crest,
        ]),
      ),
      contactLateral: jet(
        p.contactLateral,
        tl,
        AutoMovieHumanFootEdgeHandover.curvature(
          input.heights.lateral,
          input.corner,
          AutoMovieHumanFootJunction.curvature(p.contactLateral, tl, [
            p.lateral,
            p.contactMedial,
          ]),
        ),
      ),
      contactMedial: jet(
        p.contactMedial,
        tm,
        AutoMovieHumanFootEdgeHandover.curvature(
          input.heights.medial,
          input.corner,
          AutoMovieHumanFootJunction.curvature(p.contactMedial, tm, [
            p.contactLateral,
            p.medial,
          ]),
        ),
      ),
    };
  }
}
