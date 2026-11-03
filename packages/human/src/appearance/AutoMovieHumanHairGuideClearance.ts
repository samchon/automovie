import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairBending } from "./AutoMovieHumanHairBending";
import { AutoMovieHumanHairEnvelope } from "./AutoMovieHumanHairEnvelope";
import { AutoMovieHumanHairEnvelopeDrape } from "./AutoMovieHumanHairEnvelopeDrape";
import { AutoMovieHumanHairGuideDrapeEnd } from "./AutoMovieHumanHairGuideDrapeEnd";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanHairGuideContext } from "./IAutoMovieHumanHairGuideContext";
import type { IAutoMovieHumanHairGuideState } from "./IAutoMovieHumanHairGuideState";

/**
 * The clearance a strand keeps over the hair mass, centred on the head's
 * surface under the strand's next point: lying cuts are held to the head,
 * which the chart measures down to the menton (a nape strand reaching below
 * it left the chart and stood off the neck, so it ends there); above it the
 * point is pushed out to the clearance over the smooth envelope, which grows
 * slowly with length as later hair stacks over earlier hair. Short cuts lie
 * on the head everywhere; a bob lies on the vault above the chart centre and
 * hangs freely below it, where it also keeps out of the draped head itself,
 * since the envelope's power mean runs up to 8 mm under the drape's sharpest
 * bump, the auricle, whose rim then showed through the curtain (on the vault
 * the two agree to a millimetre, and holding lying hair to their larger one
 * stepped it up and down; the normals stay the envelope's). The chart is only
 * star-shaped over the vault: where it jumps (an ear, the open neck end, the
 * flare toward the shoulders) a projection can move a point much further than
 * one step; lying hair cannot follow such a jump, so it ends there, while
 * hanging hair is outside the head anyway and keeps its free step. The
 * clearance also holds the strand's standing height over the scalp along the
 * head's normal, from its exit angle and its fibre's bending length
 * (`AutoMovieHumanHairBending`): the hair follows the cranium's shape and sits
 * on top of it at that height.
 */
export namespace AutoMovieHumanHairGuideClearance {
  /** The point held, and whether the strand ends. */
  export interface IHeld {
    /** Whether the strand ends here. */
    ended: boolean;

    /** The point after the hold. */
    next: AutoMovieHumanSkinVector.Vec3;

    /** The heading after the hold. */
    heading: AutoMovieHumanSkinVector.Vec3;
  }

  /**
   * Hold the next point over the head.
   *
   * @param context What stays fixed
   * @param state The state before the step
   * @param next The candidate next point, head-local millimetres
   * @returns The held point and heading, or the strand's end
   */
  export function hold(
    context: IAutoMovieHumanHairGuideContext,
    state: IAutoMovieHumanHairGuideState,
    next: AutoMovieHumanSkinVector.Vec3,
  ): IHeld {
    const { field, envelope, style, menton, hang, layer, stack, step } =
      context;
    const ended: IHeld = { ended: true, next, heading: state.heading };
    if (!hang && next[1] + field.centre[1] <= menton) return ended;
    if (!(state.resting === null && next[1] + field.centre[1] > menton))
      return { ended: false, next, heading: state.heading };

    // Push out to the clearance over the envelope.
    const dir: AutoMovieHumanSkinVector.Vec3 =
      AutoMovieHumanSkinVector.normalize(next);
    const over: number = AutoMovieHumanHairEnvelope.radius(envelope, dir);

    // Only head skin above the menton drapes: below it the chart measures the
    // neck the head chains loft.
    const skin: number = AutoMovieHumanHeadField.radius(field, dir);
    const draped: number =
      AutoMovieHumanHeadField.covered(field, dir) &&
      field.centre[1] + dir[1] * skin > menton
        ? AutoMovieHumanHairEnvelopeDrape.drape(field, dir)
        : 0;
    const lies: boolean = style !== AutoMovieHumanHairStyle.Bob || next[1] > 0;
    const floor: number =
      (hang
        ? Math.max(
            AutoMovieHumanHairEnvelope.radius(envelope, dir, true),
            lies ? 0 : draped,
          )
        : over) +
      layer +
      stack * (state.travelled + step) +
      AutoMovieHumanHairBending.rise(
        context.exit,
        context.reach,
        context.bending,
        state.travelled + step,
      );
    if (AutoMovieHumanHairGuideDrapeEnd.ends(lies, draped, over, skin))
      return ended;

    let held: AutoMovieHumanSkinVector.Vec3 = next;
    let heading: AutoMovieHumanSkinVector.Vec3 = state.heading;
    if (AutoMovieHumanSkinVector.norm(next) < floor || lies) {
      const projected: AutoMovieHumanSkinVector.Vec3 =
        AutoMovieHumanSkinVector.scale(dir, floor);
      if (
        AutoMovieHumanSkinVector.norm(
          AutoMovieHumanSkinVector.sub(projected, state.p),
        ) >
        2.5 * step
      ) {
        if (lies) return ended;
      } else {
        held = projected;
        heading = AutoMovieHumanSkinVector.normalize(
          AutoMovieHumanSkinVector.sub(held, state.p),
        );
      }
    }
    return { ended: false, next: held, heading };
  }
}
