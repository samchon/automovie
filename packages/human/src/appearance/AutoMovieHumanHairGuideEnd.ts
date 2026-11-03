import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanHairGuideContext } from "./IAutoMovieHumanHairGuideContext";
import type { IAutoMovieHumanHairGuideState } from "./IAutoMovieHumanHairGuideState";

/**
 * Where a strand ends, centred on its level cut or its resting arc: a hanging
 * bob ends at its level cut, stopping at the crossing of that plane; a
 * resting strand ends when it has laid its remaining arc; any other step
 * grows the strand by its advance and moves on.
 */
export namespace AutoMovieHumanHairGuideEnd {
  /**
   * Grow the strand by one step or end it; writes the state.
   *
   * @param context What stays fixed
   * @param state The state, written
   * @param next The settled next point
   * @param normal The hair mass's normal there
   * @returns True when the strand ends with this step
   */
  export function advance(
    context: IAutoMovieHumanHairGuideContext,
    state: IAutoMovieHumanHairGuideState,
    next: AutoMovieHumanSkinVector.Vec3,
    normal: AutoMovieHumanSkinVector.Vec3,
  ): boolean {
    const { field, style, cut } = context;
    const p: AutoMovieHumanSkinVector.Vec3 = state.p;

    // A hanging bob ends at its level cut: stop at the crossing of that
    // plane.
    const model: number = next[1] + field.centre[1];
    if (
      state.resting === null &&
      style === AutoMovieHumanHairStyle.Bob &&
      model < cut
    ) {
      const above: number = p[1] + field.centre[1] - cut;
      const below: number = cut - model;
      const t: number = above / Math.max(above + below, 1e-9);
      const crossing: AutoMovieHumanSkinVector.Vec3 =
        AutoMovieHumanSkinVector.add(
          p,
          AutoMovieHumanSkinVector.scale(
            AutoMovieHumanSkinVector.sub(next, p),
            t,
          ),
        );
      state.travelled += AutoMovieHumanSkinVector.norm(
        AutoMovieHumanSkinVector.sub(crossing, p),
      );
      state.points.push(crossing);
      state.normals.push(normal);
      return true;
    }

    // A resting strand ends when it has laid its remaining arc.
    const advance: number = AutoMovieHumanSkinVector.norm(
      AutoMovieHumanSkinVector.sub(next, p),
    );
    if (state.resting !== null) {
      if (advance >= state.resting) {
        state.points.push(
          AutoMovieHumanSkinVector.add(
            p,
            AutoMovieHumanSkinVector.scale(
              AutoMovieHumanSkinVector.sub(next, p),
              state.resting / Math.max(advance, 1e-9),
            ),
          ),
        );
        state.travelled += state.resting;
        state.normals.push(normal);
        return true;
      }
      state.resting -= advance;
    }

    state.travelled += advance;
    state.points.push(next);
    state.normals.push(normal);
    state.p = next;
    return false;
  }
}
