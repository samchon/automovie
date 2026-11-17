import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanMouthPrior } from "./IAutoMovieHumanMouthPrior";

/** Type contracts exchanged by AutoMovieHumanMouth; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanMouthConstruction {
  /** One person's mouth.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One person's mouth.
   * @evidence contracts/development/design.md#principled-representation `stomion`: Stomion's height. `width`: Half width, midline to cheilion. `upper`: Upper vermilion height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanMouth.contactAt, AutoMovieHumanMouth.slitAt, AutoMovieHumanMouth.aperture. Also types AutoMovieHumanMouth.mouth.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `stomion`, `width`, `upper`, `lower`, `subnasale`, `menton`, `contact`, `slit`, `front`, `teeth`, `edge`, `cant`, `vestibule`, `molars`, `oropharynx`, `pharynx`, `ridge`, `palate`, `tongue`; callers supply the complete record.
   */
  export interface IMouth {
    /** Stomion's height. */
    stomion: number;

    /** Half width, midline to cheilion. */
    width: number;

    /** Upper vermilion height. */
    upper: number;

    /** Lower vermilion height. */
    lower: number;

    /** Subnasale's height. */
    subnasale: number;

    /** Menton's height. */
    menton: number;

    /** Contact line's height at shares 0, 1/16 .. 1 of the half width. */
    contact: number[];

    /** Half-height of the slit at the midline. */
    slit: number;

    /** Forward place of the lips at the stomion on the midline. */
    front: number;

    /** Teeth, upper then lower, left then right, from the midline back. */
    teeth: ITooth[];

    /** Upper incisal edge at the midline, `[x, y]`. */
    edge: [number, number];

    /** Rise of the occlusal plane per millimetre backward. */
    cant: number;

    /** The lining's front wall, round the outside of the front teeth and gums. */
    vestibule: ISection;

    /** The lining's section over the first molars. */
    molars: ISection;

    /** The lining's section at the oropharynx, round the tongue's base. */
    oropharynx: ISection;

    /** The pharynx's back wall, where the lining closes behind the oropharynx, `[x, y]`. */
    pharynx: [number, number];

    /** Alveolar ridge behind the upper incisors, where a tip touches for /t/, `[x, y]`. */
    ridge: [number, number];

    /** Palate's vault over the molars, `[x, y]`. */
    palate: [number, number];

    /** Tongue at rest. */
    tongue: ITongue;
  }

  /** One placed tooth.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One placed tooth.
   * @evidence contracts/development/design.md#principled-representation `name`: Part name: `upper|lower.left|right.<tooth>`. `crown`: Crown's dimensions. `jaw`: Jaw that carries it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanMouthArch.place. Also types AutoMovieHumanMouth.teeth, AutoMovieHumanMouth.canine.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `crown`, `jaw`, `neck`, `axis`, `along`, `out`; callers supply the complete record.
   */
  export interface ITooth {
    /** Part name: `upper|lower.left|right.<tooth>`. */
    name: string;

    /** Crown's dimensions. */
    crown: IAutoMovieHumanMouthPrior.ITooth;

    /** Jaw that carries it. */
    jaw: "upper" | "lower";

    /** Crown's centre at its cervical line, mm. */
    neck: [number, number, number];

    /** Unit direction from the cervical line to the incisal edge or cusps. */
    axis: [number, number, number];

    /** Unit direction along the arch, away from the midline. */
    along: [number, number, number];

    /** Unit direction across the arch, outward (labial or buccal). */
    out: [number, number, number];
  }

  /** One coronal section of the cavity's lining, an ellipse about a centre.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One coronal section of the cavity's lining, an ellipse about a centre.
   * @evidence contracts/development/design.md#principled-representation `x`: Forward place of the section at the midline. `y`: Height of its centre. `width`: Half width.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanMouth.sweepAt. Also types AutoMovieHumanMouth.vestibule, AutoMovieHumanMouth.molars.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `x`, `y`, `width`, `up`, `down`, `sweep`; callers supply the complete record.
   */
  export interface ISection {
    /** Forward place of the section at the midline. */
    x: number;

    /** Height of its centre. */
    y: number;

    /** Half width. */
    width: number;

    /** Rise of its top over the centre. */
    up: number;

    /** Fall of its bottom under the centre. */
    down: number;

    /** Recession of its sides behind the midline, mm per squared share of the half width. */
    sweep: number;
  }

  /** The tongue at rest.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The tongue at rest.
   * @evidence contracts/development/design.md#principled-representation `tip`: Forward place of the tip, behind the lower incisors. `back`: Forward place of the back, inside the pharynx. `tipTop`: Height of the tip's upper face.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanMouth.tongue.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `tip`, `back`, `tipTop`, `dorsum`, `floor`, `width`, `molars`; callers supply the complete record.
   */
  export interface ITongue {
    /** Forward place of the tip, behind the lower incisors. */
    tip: number;

    /** Forward place of the back, inside the pharynx. */
    back: number;

    /** Height of the tip's upper face. */
    tipTop: number;

    /** Height of the dorsum's top, over the molars. */
    dorsum: number;

    /** Height of the floor it rests on. */
    floor: number;

    /** Half width over the molars, inside the lower arch. */
    width: number;

    /** Forward place of the molars, where the dorsum is highest. */
    molars: number;
  }

  /** What the head hands the mouth.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the head hands the mouth.
   * @evidence contracts/development/design.md#principled-representation `stomion`: Height of the stomion. `width`: Half the mouth's width, midline to cheilion. `upper`: Upper vermilion height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanMouth.create, AutoMovieHumanMouth.aperture.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `stomion`, `width`, `upper`, `lower`, `gap`, `subnasale`, `menton`, `sex`, `gonion`; callers supply the complete record.
   */
  export interface IInputs {
    /** Height of the stomion. */
    stomion: number;

    /** Half the mouth's width, midline to cheilion. */
    width: number;

    /** Upper vermilion height. */
    upper: number;

    /** Lower vermilion height. */
    lower: number;

    /** Rest gap of the lips. */
    gap: number;

    /** Height of the subnasale. */
    subnasale: number;

    /** Height of the menton. */
    menton: number;

    /** Masculine (-1) to feminine (1). */
    sex: number;

    /** Forward place of the mandible's angles, the gonia. */
    gonion: number;

    /** Height of the lips' contact line at a share of the half width from the midline. */
    contact(u: number): number;

    /** Forward coordinate of the skin at a height and a lateral place. */
    front(y: number, z: number): number;
  }

  /** Mouth and the fissure cut into the skin.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Mouth and the fissure cut into the skin.
   * @evidence contracts/development/design.md#principled-representation `mouth`: The mouth. `aperture`: The slit along the contact line, cut by position like the nostrils.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanMouth.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `mouth`, `aperture`; callers supply the complete record.
   */
  export interface IOutput {
    /** The mouth. */
    mouth: IMouth;

    /** The slit along the contact line, cut by position like the nostrils. */
    aperture: IAutoMovieHumanLoftAperture;
  }
}
