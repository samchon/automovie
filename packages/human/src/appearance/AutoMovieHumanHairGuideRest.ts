import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairContact } from "./AutoMovieHumanHairContact";
import { AutoMovieHumanHairContactDescent } from "./AutoMovieHumanHairContactDescent";
import { AutoMovieHumanHairEnvelope } from "./AutoMovieHumanHairEnvelope";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanHairGuideContext } from "./IAutoMovieHumanHairGuideContext";
import type { IAutoMovieHumanHairGuideState } from "./IAutoMovieHumanHairGuideState";
import type { IAutoMovieHumanHairSettled } from "./IAutoMovieHumanHairSettled";

/**
 * Where a strand reaches the body below the head, centred on the shoulders:
 * it settles on the body (`AutoMovieHumanHairContact`) and from then on rests
 * along it, descending its surface, never climbing. A strand reaching the
 * body rests there: it settles at a clearance above the skin and descends the
 * surface in its vertical plane through the head's axis, out from the neck,
 * down and off the shoulders and the upper back, instead of stopping where
 * it touched. A bob rests along the body for the drop it still had to its
 * level cut, at most {@link RESTING} mm; other cuts for the rest of their
 * length. It shades as halfway between the hanging mass and the body under
 * it, so the hair keeps its tone where it meets the shoulders instead of
 * turning into a separately lit shelf.
 */
export namespace AutoMovieHumanHairGuideRest {
  /**
   * Longest arc a bob lays along the body, mm (convention). Laid for its
   * whole remaining drop, a bob's back and sides slid out over the shoulders
   * and the upper back and splayed into a bristly band below the cut.
   */
  export const RESTING: number = 10;

  /** The settled point and normal, and whether the strand ends. */
  export interface IRest {
    /** Whether the strand ends here. */
    ended: boolean;

    /** The point after settling. */
    next: AutoMovieHumanSkinVector.Vec3;

    /** The hair mass's normal there. */
    normal: AutoMovieHumanSkinVector.Vec3;
  }

  /**
   * Settle the next point against the body; writes the state's surface,
   * heading and resting arc.
   *
   * @param context What stays fixed
   * @param state The state, written
   * @param held The next point after the clearance hold
   * @returns The settled point and normal, or the strand's end
   */
  export function settle(
    context: IAutoMovieHumanHairGuideContext,
    state: IAutoMovieHumanHairGuideState,
    held: AutoMovieHumanSkinVector.Vec3,
  ): IRest {
    const {
      field,
      envelope,
      shoulders,
      style,
      hang,
      layer,
      step,
      cut,
      length,
    } = context;
    let next: AutoMovieHumanSkinVector.Vec3 = held;
    let normal: AutoMovieHumanSkinVector.Vec3 =
      AutoMovieHumanHairEnvelope.normal(envelope, next, hang);

    // Reaching the body: the strand settles on it and slides along it.
    const contact: IAutoMovieHumanHairSettled | null =
      AutoMovieHumanHairContact.settle(
        field,
        shoulders,
        next,
        layer + 1.5,
        step,
        state.resting !== null,
      );
    if (contact === null) return { ended: true, next, normal };

    state.surface = contact.normal;
    if (contact.normal !== null) {
      // The settling displacement is not the strand's motion; from here it
      // descends the body's surface, never climbing.
      next = contact.point;
      state.heading = AutoMovieHumanHairContactDescent.descend(
        contact.normal,
        next,
      );
      normal = AutoMovieHumanSkinVector.normalize(
        AutoMovieHumanSkinVector.add(
          AutoMovieHumanHairEnvelope.normal(envelope, next, hang),
          contact.normal,
        ),
      );
      if (state.resting === null) {
        state.resting =
          style === AutoMovieHumanHairStyle.Bob
            ? Math.min(
                length - state.travelled,
                next[1] + field.centre[1] - cut,
                RESTING,
              )
            : length - state.travelled;
        if (state.resting <= 0) return { ended: true, next, normal };
      }
    }
    return { ended: false, next, normal };
  }
}
