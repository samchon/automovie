import { AutoMovieHumanHairContactDescent } from "./AutoMovieHumanHairContactDescent";
import { AutoMovieHumanHairFlow } from "./AutoMovieHumanHairFlow";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanHairGuideContext } from "./IAutoMovieHumanHairGuideContext";
import type { IAutoMovieHumanHairGuideState } from "./IAutoMovieHumanHairGuideState";

/**
 * One step's heading, centred on the strand's current point: on the body, down
 * its surface, out from the neck, and off the shoulders and the upper back;
 * slid off the body, hanging freely with gravity at least equal to the heading
 * per step so it does not fly out past the hair above it; otherwise the
 * heading relaxes toward the style's field and bends toward gravity in
 * proportion to the distance already grown (short hair stands in its field,
 * long hair falls). This is a kinematic sweep, not a strand simulation: there
 * is no bending energy or collision between strands, and its coefficients are
 * conventions of this prototype (`AutoMovieHumanHairStrandDynamics`).
 */
export namespace AutoMovieHumanHairGuideStep {
  /**
   * The heading of the next step.
   *
   * @param context What stays fixed
   * @param state The state before the step
   * @returns Unit heading
   */
  export function heading(
    context: IAutoMovieHumanHairGuideContext,
    state: IAutoMovieHumanHairGuideState,
  ): AutoMovieHumanSkinVector.Vec3 {
    if (state.surface !== null)
      return AutoMovieHumanHairContactDescent.descend(state.surface, state.p);
    if (state.resting !== null)
      return AutoMovieHumanSkinVector.normalize(
        AutoMovieHumanSkinVector.add(
          state.heading,
          AutoMovieHumanSkinVector.scale(
            AutoMovieHumanHairFlow.DOWN,
            Math.max(context.gravity, 1),
          ),
        ),
      );

    const n: AutoMovieHumanSkinVector.Vec3 = AutoMovieHumanSkinVector.normalize(
      state.p,
    );
    const progress: number = state.travelled / Math.max(context.length, 1);
    const target: AutoMovieHumanSkinVector.Vec3 =
      AutoMovieHumanHairFlow.tangent(
        AutoMovieHumanHairFlow.field(context.style, n),
        n,
      );
    const { adherence, gravity } = context;
    const h: AutoMovieHumanSkinVector.Vec3 = state.heading;
    return AutoMovieHumanSkinVector.normalize([
      h[0] +
        adherence * (1 - progress) * (target[0] - h[0]) +
        gravity * progress * AutoMovieHumanHairFlow.DOWN[0],
      h[1] +
        adherence * (1 - progress) * (target[1] - h[1]) +
        gravity * progress * AutoMovieHumanHairFlow.DOWN[1],
      h[2] +
        adherence * (1 - progress) * (target[2] - h[2]) +
        gravity * progress * AutoMovieHumanHairFlow.DOWN[2],
    ]);
  }
}
