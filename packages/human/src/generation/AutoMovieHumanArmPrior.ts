import type { AutoMovieHumanLoftParameter } from "../lofting/AutoMovieHumanLoftParameter";

/**
 * Named constants of the arm construction: the population's arm and hand, and
 * the lines that read a person's lengths and tapes.
 *
 * The hand is held in its own axes: `a` along it from the origin past the
 * wrist, `b` across it toward the thumb, `c` through it toward the palm. The
 * rows of a star are harmonics of the skin's radius about a point inside it,
 * measured in the section's own half extents so a flat section keeps its ends.
 */
export namespace AutoMovieHumanArmPrior {
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
    rule: AutoMovieHumanLoftParameter.Rule;

    /** Heights of the layers above the hand: 0 at the wrist, 1 at the shoulder. */
    heights: readonly number[];

    /** Stations `a` of the layers in the hand and over the wrist, from the bottom. */
    heel: readonly number[];

    /** Unit direction of the upper arm. */
    upper: readonly number[];

    /** Unit direction of the forearm. */
    lower: readonly number[];

    /** The walk's start off the shoulder, across the upper arm, world mm. */
    bias: readonly number[];

    /** Shoulder to elbow: world offset, share of the upper arm input, and per unit of the masculine-feminine control. */
    upperLength: readonly number[];

    /** Elbow to wrist: world offset, share of the lower arm input, and per unit of the masculine-feminine control. */
    lowerLength: readonly number[];

    /** Half the length over which the heading turns at the elbow, per unit of the elbow's radius. */
    softness: number;

    /** The wrist ring's mean circle per unit of the hand tape. */
    heelUnit: number;

    /** Wrist tape. */
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

    /** The hand's origin from the wrist, per unit of the wrist's size. */
    heelOffset: readonly number[];
  }

  /** Skin as a radius about an inner point, along `a`. */
  export interface IStar {
    /** Stations `a`, increasing. */
    stations: readonly number[];

    /** Per station, the inner point `[b, c]`, the half extents, then the mean radius in those extents and its harmonics `[cos 1, sin 1, ...]`. */
    series: readonly (readonly number[])[];
  }

  /** The thenar eminence where the thumb leaves the palm: an ellipse across the hand. */
  export interface IThenar {
    /** Its centre across the hand. */
    b: number;

    /** Its centre through the hand. */
    c: number;

    /** Half width. */
    width: number;

    /** Half depth. */
    depth: number;

    /** Length back from the branch over which the heel becomes palm and thenar, mm. */
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
    /** Length past its root before which its anchors still hold its root's own shape, mm. */
    blend: number;

    /** Chain name; `{side}` stands for the side. */
    name: string;

    /** The tip's apex. */
    pole: readonly [number, number, number];

    /** From the tip, `[a, b, c, half width, half depth]`. */
    anchors: readonly (readonly number[])[];
  }

  /** The mean hand's measures, mm. */
  export interface ISize {
    /** Wrist to the longest fingertip. */
    length: number;

    /** Wrist to the middle finger's root. */
    palm: number;

    /** Thumb. */
    thumb: number;

    /** Hand tape. */
    circumference: number;
  }

  /** The hand. */
  export interface IHandPrior {
    /** Mean measures. */
    size: ISize;

    /** Unit axis along the hand, left side. */
    along: readonly [number, number, number];

    /** Unit axis across the palm. */
    across: readonly [number, number, number];

    /** Unit axis through the palm. */
    through: readonly [number, number, number];

    /** Softness of the change at the finger roots, mm. */
    handover: number;

    /** Hand measure per hand length input. */
    lengthRatio: number;

    /** Palm measure per palm length input. */
    palmRatio: number;

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

    /** Where the finger roots' curve leaves the hand, `[b, a]`, ulnar then radial. */
    ends: readonly (readonly number[])[];

    /** The palm chain. */
    palmSection: ISection;

    /** Thumb, index, middle, ring, little. */
    digits: readonly IDigit[];
  }

  /** Hand inputs of a person without measures: lines in `[1, stature, hand tape]`. */
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

  /** The law's constants. */
  export const PRIOR: IPrior = {arm: {order: 128,samples: 136,rule: "arclength",heights: [0.22,0.28606,0.35971,0.43261,0.50439,0.53982,0.57412,0.6401,0.70726,0.77637,0.84648,0.93958,1],upper: [0.05234,-0.79451,0.60499],lower: [0.63338,-0.58863,0.50234],bias: [-2.38,-1.63,-1.94],upperLength: [9.4635,0.527,5.5908],lowerLength: [-41.1157,1.1059,2.393],softness: 0.9,heelUnit: 1.1474,wrist: {station: 1,ratio: 1.0476},forearm: {station: 0.5044,ratio: 0.9299},elbow: {station: 0.4018,ratio: 1.0296},bicep: {station: 0.12,ratio: 0.9565},aspect: [1.313,1.087,1.127,1.083],phase:-0.0484,sense: 1,heelOffset: [1.1328,-1.0428,0.5607],heel: [8,4,0,-6,-12,-18,-24,-30,-36,-43,-50,-57,-65,-72,-80,-95,-110]},hand: {size: {length: 121.579,palm: 55.554,thumb: 39.248,circumference: 204.647},along: [0.54377,-0.77447,0.32329],across: [0.8379,0.52272,-0.15713],through: [0.0473,-0.35633,-0.93316],handover: 8,lengthRatio: 0.76571,palmRatio: 0.66727,whole: {stations: [-75,-60,-45,-30,-15,0,10],series: [[-16.998,-7.272,29.622,24.171,1.001,0.023,0.371,-0.003,0.017,0.028,-0.006,-0.014,0.002,0,-0.002,-0.001,0],[-11.908,-7.725,31.001,23.045,0.974,-0.032,0.339,-0.019,0.056,-0.013,0.001,-0.014,-0.002,0.003,-0.004,0,0],[-8.552,-8.532,35.161,24.772,0.942,-0.034,0.363,-0.03,0.076,-0.046,0.015,-0.022,-0.012,0.005,-0.008,0.002,0],[-5.693,-10.81,41.418,28.285,0.9,-0.038,0.412,-0.036,0.095,-0.076,0.021,-0.026,-0.028,0.009,-0.013,0.003,0.002],[-3.274,-13.311,46.172,30.418,0.853,-0.022,0.38,0.003,0.115,-0.109,0.045,-0.035,-0.054,0.02,-0.02,0.005,0.005],[-0.528,-16.128,49.172,31.586,0.776,-0.023,0.292,0.057,0.121,-0.135,0.071,-0.049,-0.073,0.023,-0.031,0.01,0.002],[0.731,-18.088,50.462,32.734,0.712,-0.033,0.219,0.099,0.103,-0.129,0.08,-0.041,-0.067,0.014,-0.03,0.012,-0.003]]},palm: {stations: [0,25,50],series: [[-2.754,-16.128,46.947,20.423,0.925,-0.064,0.271,-0.042,0.039,-0.051,0.048,-0.045,-0.031,0.017,-0.027,0.007,0.005],[-6.599,-19.933,43.866,17.153,0.927,0.06,0.197,0.041,-0.028,-0.025,0.103,-0.037,-0.016,0.002,-0.022,0.007,-0.004],[-8.59,-18.05,46.942,16.628,0.808,0.064,-0.075,0.159,-0.071,0.02,0.175,-0.072,-0.002,0.006,0,-0.01,0.002]]},branch: 8,thenar: {b: 33,c: 14,width: 14,depth: 14,reach: 14,soft: 8,valley: 0.7,valleyWidth: 6,valleySpan: 12},webs: [{a: 45,b: 15.4,c: -12,depth: 0.72,width: 5,reach: 16},{a: 47,b: -7.6,c: -17,depth: 0.72,width: 5,reach: 16},{a: 38,b: -30,c: -13,depth: 0.72,width: 5,reach: 16}],ends: [[-62,26],[42,42]],palmSection: {order: 96,samples: 120},digits: [{name: "thumb.{side}",order: 32,samples: 40,blend: 12,pole: [54.085,46.892,35.197],anchors: [[54.1,47,35,0.4,0.4],[50.1,46.4,31.8,6.8,7.1],[46.3,45.7,30.3,8.2,8.5],[36.9,44.6,28.1,8,9.9],[27.7,44.5,26,10.4,10.1],[17,41.3,23.6,15,9.5]]},{name: "finger.{side}.index",order: 32,samples: 40,blend: 16,pole: [111.157,26.724,5.085],anchors: [[111.1,26.8,5.1,0.1,0.1],[105.5,28.5,3.7,6.4,4.7],[94.2,29.6,-1,8.1,6.7],[81.3,29.7,-5.8,8.9,7.5],[65.4,29,-10.4,10.7,9.1],[51.7,27.9,-12.3,11.7,9.9]]},{name: "finger.{side}.middle",order: 32,samples: 40,blend: 16,pole: [121.288,-0.058,-0.071],anchors: [[121.2,0,0,0.3,0.4],[118,1,-0.2,4.8,4.1],[107.5,3.1,-4.8,8.1,6.5],[96.5,3.9,-11.3,8.7,7.2],[72.3,4,-21.4,10.3,9.5],[63.2,4.2,-22.2,10.5,10.4],[55.5,3.6,-22.3,10.8,10.3]]},{name: "finger.{side}.ring",order: 32,samples: 40,blend: 16,pole: [109.046,-34.071,3.597],anchors: [[108.8,-34.1,3.8,0.7,0.7],[108.5,-34,3.8,1.5,1.6],[103.4,-31.2,2.3,6.3,5],[98.5,-30.2,-0.2,7.3,5.7],[88.2,-28.7,-7,7.6,6.5],[77.6,-27.3,-12.6,7.9,7.6],[67,-25.6,-17.9,8.6,8.1],[46.3,-22,-20.2,8.7,9.7]]},{name: "finger.{side}.little",order: 32,samples: 40,blend: 16,pole: [82.706,-55.727,10.394],anchors: [[83.1,-55,9.7,1.5,1.4],[78.9,-53,8.4,5.1,4.3],[69,-51.3,2.2,6.7,6],[58.3,-49.5,-4,6.8,6.6],[48,-47.1,-9,7.3,7.5],[36.9,-44.1,-11.8,8,8.2],[30.2,-41.3,-12.3,10.2,9]]}]},expected: {length: [21.86,0.0479,0.23733],palm: [21.847,0.01624,0.15005],breadth: [1.977,0.00028,0.29488],thumb: [9.013,0.01912,0.14324]}};
}
