import type { IAutoMovieLoftParameter } from "../construction/IAutoMovieLoftParameter";
import type { IAutoMovieHumanHandFingerPosture } from "./IAutoMovieHumanHandFingerPosture";
import type { IAutoMovieHumanHandThumbPosture } from "./IAutoMovieHumanHandThumbPosture";

/**
 * Arm and hand priors: tape stations, dimensionless section shapes, digit
 * proportions and anatomical placement inputs.
 *
 * The interface package owns these declarations; AutoMovieHumanArmPrior in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanArmPrior {
  /** A tape's place on the bones and its circle per unit of the tape. */
  export interface IKey {
    /** Arc length from the shoulder as a fraction of the way to the wrist. */
    station: number;

    /** Circumference of the section across the bone per unit of the tape. */
    ratio: number;
  }

  /** The arm: two straight bones and a section about them. */
  export interface IArm {
    /** Control points of a section. */
    order: number;

    /** Uniform phases of the chain's rings. */
    samples: number;

    /** Phase correspondence rule. */
    rule: IAutoMovieLoftParameter.Rule;

    /** Heights of the layers above the hand: 0 at the wrist, 1 at the shoulder. */
    heights: readonly number[];

    /**
     * Stations `a` of the layers in the hand and over the wrist, from the
     * bottom.
     */
    heel: readonly number[];

    /** Unit direction of the upper arm. */
    upper: readonly number[];

    /** Unit direction of the forearm. */
    lower: readonly number[];

    /** The walk's start off the shoulder, across the upper arm, world mm. */
    bias: readonly number[];

    /**
     * Shoulder to elbow: world offset, share of the upper arm input, and per
     * unit of the masculine-feminine control.
     */
    upperLength: readonly number[];

    /**
     * Elbow to wrist: world offset, share of the lower arm input, and per unit
     * of the masculine-feminine control.
     */
    lowerLength: readonly number[];

    /**
     * Half the length over which the heading turns at the elbow, per unit of
     * the elbow's radius.
     */
    softness: number;

    /**
     * Wrist tape. Its ratio is the solve's first guess: the construction scales
     * the wrist's circle until the section at stylion, square to the forearm,
     * measures the tape on its hull.
     */
    wrist: IKey;

    /** Forearm tape. */
    forearm: IKey;

    /** Elbow tape. */
    elbow: IKey;

    /** Biceps tape. */
    bicep: IKey;

    /** Aspect of the section at the wrist, forearm, elbow and biceps. */
    aspect: readonly number[];

    /** Polar angle of phase zero about the axis, radians. */
    phase: number;

    /** Which way phase turns about the axis. */
    sense: number;
  }

  /** Skin as a radius about an inner point, along `a`. */
  export interface IStar {
    /** Stations `a`, increasing. */
    stations: readonly number[];

    /**
     * Per station, the inner point `[b, c]`, the half extents, then the mean
     * radius in those extents and its harmonics `[cos 1, sin 1, ...]`.
     */
    series: readonly (readonly number[])[];
  }

  /**
   * The thenar eminence where the thumb leaves the palm: an ellipse across the
   * hand.
   */
  export interface IThenar {
    /** Its centre across the hand. */
    b: number;

    /** Its centre through the hand. */
    c: number;

    /** Half width. */
    width: number;

    /** Half depth. */
    depth: number;

    /**
     * Length back from the branch over which the heel becomes palm and thenar,
     * mm.
     */
    reach: number;

    /** Difference between the two radii over which their maximum rounds, mm. */
    soft: number;

    /** Share of the bridge's length drawn in at the web. */
    valley: number;

    /** Standard width of that valley across the bridge, mm. */
    valleyWidth: number;

    /** Standard reach of that valley along the bridge, mm. */
    valleySpan: number;
  }

  /** A web between two neighbouring fingers. */
  export interface IWeb {
    /** Its station. */
    a: number;

    /** Its place across the hand. */
    b: number;

    /** Its place through the hand. */
    c: number;

    /** Share of the skin's distance from the web gone at the web. */
    depth: number;

    /** Standard width of the valley across the bridge, mm. */
    width: number;

    /** Length of the valley back from the web, mm. */
    reach: number;
  }

  /** A chain's sampling. */
  export interface ISection {
    /** Control points of a section. */
    order: number;

    /** Uniform phases of the chain's rings. */
    samples: number;
  }

  /** A digit: a curved tube with a rounded tip. */
  export interface IDigit extends ISection {
    /**
     * Length past its root before which its anchors still hold its root's own
     * shape, mm.
     */
    blend: number;

    /** Chain name; `{side}` stands for the side. */
    name: string;

    /** The tip's apex. */
    pole: readonly [number, number, number];

    /** From the tip, `[a, b, c, half width, half depth]`. */
    anchors: readonly (readonly number[])[];
  }

  /**
   * A digit section's palmar depth over its dorsal depth from the bone, by
   * phalanx, read on f1's bone-normal digit sections (the fingers' means): the
   * palmar pad is the fuller half over the proximal and middle phalanges, and
   * over the distal phalanx the dorsal skin thins on the nail bed toward its
   * middle before the tip rounds.
   */
  export interface IPalmar {
    /** Over the proximal phalanx. */
    proximal: number;

    /** Over the middle phalanx, and at the DIP. */
    middle: number;

    /** At the nail bed's middle. */
    nail: number;

    /** Where that is, as a share of the way from the DIP to the tip. */
    nailAt: number;

    /** At the tip. */
    tip: number;
  }

  /** The hand. */
  export interface IHandPrior {
    /** The bind's thumb posture. */
    thumb: IAutoMovieHumanHandThumbPosture;

    /** Palmar over dorsal section depth along a digit. */
    palmar: IPalmar;

    /** Station `a` of the wrist crease in the form. */
    crease: number;

    /**
     * Each finger's PIP and DIP joints from its web as shares of its web-to-tip
     * length, index to little (Buryanov and Kotiuk 2010 Table III).
     */
    joints: readonly (readonly number[])[];

    /**
     * Each finger's external length from its web to its tip over the middle
     * finger's, index to little: Buryanov and Kotiuk 2010, the tip and distal
     * phalanx of Table I over their Table III share. It shares the joint
     * shares' web datum; Greiner 1991 starts at the palmar flexion crease.
     */
    external: readonly number[];

    /**
     * The thumb's proximal phalanx as a share of its MCP-to-tip length
     * (Buryanov and Kotiuk 2010 Table I).
     */
    thumbProximal: number;

    /** The bind's finger posture. */
    posture: IAutoMovieHumanHandFingerPosture;

    /** Unit axis along the hand, left side. */
    along: readonly [number, number, number];

    /** Unit axis across the palm. */
    across: readonly [number, number, number];

    /** Unit axis through the palm. */
    through: readonly [number, number, number];

    /** Heel and thenar together, from the forearm to the thumb's branch. */
    whole: IStar;

    /** Palm alone, from the thumb's branch to the knuckles. */
    palm: IStar;

    /** Station `a` of the thumb's branch. */
    branch: number;

    /** The thumb's own section at its branch. */
    thenar: IThenar;

    /** Webs from the index side. */
    webs: readonly IWeb[];

    /**
     * Where the finger roots' curve leaves the hand, `[b, a]`, ulnar then
     * radial.
     */
    ends: readonly (readonly number[])[];

    /** The palm chain. */
    palmSection: ISection;

    /**
     * Thumb, index, middle, ring, little. The thumb's anchors are its line and
     * sections; a finger's give only its sections' half width and depth along
     * it, its line standing on its bones.
     */
    digits: readonly IDigit[];
  }

  /**
   * Hand inputs of a person without measures: lines in `[1, stature, hand
   * tape]`.
   */
  export interface IExpected {
    /** Hand length. */
    length: readonly number[];

    /** Palm length. */
    palm: readonly number[];

    /** Hand breadth. */
    breadth: readonly number[];

    /** Thumb length. */
    thumb: readonly number[];
  }

  /** The prior. */
  export interface IPrior {
    /** Arm. */
    arm: IArm;

    /** Hand. */
    hand: IHandPrior;

    /** Hand inputs when none are given. */
    expected: IExpected;
  }
}
