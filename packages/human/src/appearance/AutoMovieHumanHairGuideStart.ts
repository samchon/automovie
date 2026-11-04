import type { IAutoMovieHumanScalpHair } from "../structures/appearance/IAutoMovieHumanScalpHair";
import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanHairBending } from "./AutoMovieHumanHairBending";
import { AutoMovieHumanHairCutLevel } from "./AutoMovieHumanHairCutLevel";
import { AutoMovieHumanHairEnvelope } from "./AutoMovieHumanHairEnvelope";
import { AutoMovieHumanHairExitAngle } from "./AutoMovieHumanHairExitAngle";
import { AutoMovieHumanHairFlow } from "./AutoMovieHumanHairFlow";
import { AutoMovieHumanHairOcclusion } from "./AutoMovieHumanHairOcclusion";
import type { AutoMovieHumanHairRoots } from "./AutoMovieHumanHairRoots";
import { AutoMovieHumanHairStrandBase } from "./AutoMovieHumanHairStrandBase";
import { AutoMovieHumanHairStrandDynamics } from "./AutoMovieHumanHairStrandDynamics";
import { AutoMovieHumanHairStrandLocks } from "./AutoMovieHumanHairStrandLocks";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import type { AutoMovieHumanShoulderField } from "./AutoMovieHumanShoulderField";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanHairGuideContext } from "./IAutoMovieHumanHairGuideContext";
import type { IAutoMovieHumanHairGuideState } from "./IAutoMovieHumanHairGuideState";

/**
 * The start of one guide, centred on its root: the strand's fixed numbers
 * (length, cut level, step, coefficients, layer clearance, hanging or lying)
 * and its first point, heading and normal.
 *
 * The root sits a layer above the surface its strand is held to (the
 * envelope, and for a hanging cut the draped head too) where that lies
 * higher than the skin (beside the auricle): rooted on the skin there, the
 * first step climbed the rise and stood the strand off the head. The layer
 * clearance is a common base with a jitter of 0.4 mm, below the stack
 * gained between neighbouring roots, so a strand lies over the strands whose
 * roots it has passed (the upstream hair on top) and the mass stays one
 * continuous surface, while side-by-side cards never share a depth. Steps are
 * at most 10 mm and at least three; the head chart keeps strands outside the
 * head down to the menton, below it the body field does.
 */
export namespace AutoMovieHumanHairGuideStart {
  /** The context and first state of one guide. */
  export interface IStart {
    /** What stays fixed. */
    context: IAutoMovieHumanHairGuideContext;

    /** The state at the root. */
    state: IAutoMovieHumanHairGuideState;
  }

  /**
   * Begin a guide at its root.
   *
   * @param field Head chart
   * @param envelope Smooth envelope of the hair mass
   * @param shoulders Body surface heights under the head
   * @param hair Scalp hair input
   * @param root The root
   * @param feather Share of the length grown at the hairline's edge, 0 to 1
   * @returns The context and the first state
   */
  export function create(
    field: AutoMovieHumanHeadField.IField,
    envelope: AutoMovieHumanHairEnvelope.IEnvelope,
    shoulders: AutoMovieHumanShoulderField.IField,
    hair: IAutoMovieHumanScalpHair,
    root: AutoMovieHumanHairRoots.IRoot,
    feather: number,
  ): IStart {
    const style: AutoMovieHumanHairStyle = hair.style;
    const u: AutoMovieHumanSkinVector.Vec3 = root.u;

    // The strand law: this root's length is its style's base profile, varied
    // between locks, and grown only as far as its feather in the transition
    // zone; a bob also ends at its level cut.
    const length: number =
      feather *
      AutoMovieHumanHairStrandLocks.vary(u) *
      AutoMovieHumanHairStrandBase.base(style, hair.length, u);
    const cut: number = AutoMovieHumanHairCutLevel.level(
      field.top,
      hair.length,
      u,
    );
    const steps: number = Math.min(40, Math.max(3, Math.ceil(length / 10)));
    const { adherence, gravity, stack } =
      AutoMovieHumanHairStrandDynamics.coefficients(style);
    const layer: number =
      1.2 + 0.4 * AutoMovieHumanAppearanceNoise.hash(7, root.seed);

    // A bob hangs: below each azimuth's widest draped point it falls as a
    // vertical curtain from that point, and shades as one; the shorter cuts
    // lie on the head down to the nape.
    const hang: boolean = style === AutoMovieHumanHairStyle.Bob;
    const start: number =
      Math.max(
        AutoMovieHumanHeadField.radius(field, u),
        AutoMovieHumanHairEnvelope.radius(envelope, u, hang),
      ) + layer;
    const p: AutoMovieHumanSkinVector.Vec3 = AutoMovieHumanSkinVector.scale(
      u,
      start,
    );

    // The hair leaves the scalp at its exit angle over the surface, along the
    // head's normal (the chart direction) as it grows: short hair stands,
    // long hair falls within millimetres of its root
    // (`AutoMovieHumanHairBending`, applied by the clearance). The measured
    // angles act at the hairline and fade into the mass with the feather.
    const exit: number = AutoMovieHumanHairExitAngle.angle(
      (Math.atan2(u[2], u[0]) * 180) / Math.PI,
      feather,
    );
    return {
      context: {
        field,
        envelope,
        shoulders,
        style,
        u,
        length,
        cut,
        menton: field.top - field.height,
        steps,
        step: length / steps,
        adherence,
        gravity,
        stack,
        layer,
        hang,
        exit,
        bending: AutoMovieHumanHairBending.length(
          AutoMovieHumanHairOcclusion.DIAMETER,
        ),
        reach:
          AutoMovieHumanHairStrandLocks.vary(u) *
          AutoMovieHumanHairStrandBase.physical(style, hair.length, u),
      },
      state: {
        p,
        heading: AutoMovieHumanHairFlow.tangent(
          AutoMovieHumanHairFlow.field(style, u),
          u,
        ),
        travelled: 0,
        surface: null,
        resting: null,
        points: [p],
        normals: [AutoMovieHumanHairEnvelope.normal(envelope, u, hang)],
      },
    };
  }
}
