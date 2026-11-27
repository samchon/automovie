import { AutoMovieHumanFeatureTemplate as T } from "./AutoMovieHumanFeatureTemplate";
import { AutoMovieHumanSegmentFrame as F } from "./AutoMovieHumanSegmentFrame";
import type { AutoMovieVector3Tuple } from "@automovie/interface";

/**
 * The body's surface features below the head as laws: which landmarks place each, what length sizes it, and its sizes as shares of that
 * length, so one constructor makes every feature's template for any person.
 *
 * Every feature of the catalogue stands in exactly one of three lists:
 *
 * - `LAWS`: a template. Its landmarks give its place (a centre, or the two ends it runs between), a named length of the person gives
 *   its size, and three shares of that length give its half extents and its height.
 * - `WALL`: a form the wall itself carries (a furrow, a corner, a section's extreme, a mound wider than any rim), so no template.
 * - `ABSENT`: a feature the prior's person does not show and no published size states a height for; it has no template until a source
 *   or a person's reading gives one.
 *
 * Basis of the shares. Published sizes for these features are bone and tendon dimensions (a patella's width, a clavicle's length, a
 * tendon's thickness); how far a feature stands out of the skin round it was found published for none of them. So every share here is
 * a prior read on one person, f1, by `test/src/reference-conics/FamilyConicBodyFeatures.ts` (reading `features-2`): the feature's
 * height is its residual over the surrounding skin continued across its window, its half extent is its half width at half height over
 * 0.4542 (the radius at which the template's bump is at half height), each divided by the length named in `scale` on f1 and rounded
 * to two figures. A line's height is its greatest station's. They are shares so that no law holds f1's millimetres; each is replaced
 * when a source states the size it stands for.
 *
 * The three lengths: `stature`; `knee`, the skin breadth over the femoral epicondyles; `ankle`, the skin breadth through the ankle's
 * centre along the knee's flexion axis.
 */
export namespace AutoMovieHumanFeatureLaws {
  /** The length a law's shares are of. */
  export type Scale = "stature" | "knee" | "ankle";

  /** One feature's law. */
  export interface ILaw {
    /** The feature's name. */
    name: string;

    /** What makes it, which decides what moves its height (`AutoMovieHumanFeatureTemplate.Class`). */
    class: T.Class;

    /** The segment whose frame it is placed in. */
    segment: string;

    /** The landmarks that place it: one, its centre, or two, the ends it runs between. */
    landmarks: readonly [string] | readonly [string, string];

    /** The length its shares are of. */
    scale: Scale;

    /** Its half extent along its long direction as a share of the scale; absent for a feature between two landmarks, whose length is theirs. */
    along?: number;

    /** Its half extent across as a share of the scale. */
    across: number;

    /** Its height at the centre as a share of the scale: positive a mound, negative a hollow. */
    height: number;
  }

  /** A catalogue feature that has no template, and why. */
  export interface INone {
    /** The feature's name. */
    name: string;

    /** Why it has none. */
    why: string;
  }

  /** What a law is given to make its template: points and directions in its segment's frame. */
  export interface IDatums {
    /** Its centre's landmark, or the landmark it starts at, mm. */
    from: AutoMovieVector3Tuple;

    /** The landmark it ends at, for a law of two landmarks. */
    to?: AutoMovieVector3Tuple;

    /** The direction out of the skin there; it need not be unit. */
    outward: AutoMovieVector3Tuple;

    /** The segment's long direction, for a law of one landmark; it need not be unit nor square to `outward`. */
    along?: AutoMovieVector3Tuple;
  }

  /** The features that are templates. Every share is f1's reading as the namespace states; the comment gives the millimetres it was read at. */
  export const LAWS: readonly ILaw[] = [
    // Omphalion's hollow: 8.14 mm deep, half widths at half height 6.2 to 12.0 along and 8.2 across, at 0.6165 of a stature of 1,699.7 mm.
    { name: "navel", class: "pad", segment: "pelvis", landmarks: ["omphalion"], scale: "stature", along: 0.012, across: 0.011, height: -0.0048 },
    // The jugular notch's hollow: 3.64 mm deep, half widths 11.7 to 14.4 along the median and 8.9 across.
    { name: "sternal-notch", class: "bone", segment: "thorax", landmarks: ["suprasternale"], scale: "stature", along: 0.017, across: 0.012, height: -0.0021 },
    // The seventh cervical spine's mound: 0.88 mm, against a floor of 0.75 mm, half widths 8.3 to 11.5 mm; a marginal reading.
    { name: "cervicale", class: "bone", segment: "thorax", landmarks: ["cervicale"], scale: "stature", along: 0.013, across: 0.012, height: 0.00052 },
    // The clavicle's ridge: found over 86 of 120 mm, 3.37 mm at its greatest station (1.96 mean), half width at half height 10.6 mm.
    { name: "clavicle", class: "bone", segment: "thorax", landmarks: ["sternoclavicular", "acromion"], scale: "stature", across: 0.014, height: 0.002 },
    // The sternocleidomastoid's ridge: found over 108 of 114 mm, 4.45 mm at its greatest station (2.00 mean), half width 9.9 mm. A
    // muscle's belly does not thicken with fat, so its height is a tendon's class.
    { name: "sternocleidomastoid", class: "tendon", segment: "neck", landmarks: ["mastoid", "sternoclavicular"], scale: "stature", across: 0.013, height: 0.0026 },
    // The patella's mound: 1.72 mm, half widths 6.9 to 16.7 mm along the femur; across, 13.2 mm on the one side that closed inside the
    // window. Knee breadth 107.8 mm.
    { name: "patella", class: "bone", segment: "tibia", landmarks: ["midpatella"], scale: "knee", along: 0.24, across: 0.27, height: 0.016 },
    // The lateral malleolus's mound: 2.22 mm, half widths 9.6 to 12.3 along the shank and 9.2 to 10.5 mm across. Ankle breadth 53.6 mm.
    { name: "malleolus-lateral", class: "bone", segment: "tibia", landmarks: ["malleolusLateral"], scale: "ankle", along: 0.45, across: 0.4, height: 0.042 },
    // The medial malleolus's mound: 1.84 mm, half widths 6.0 to 11.4 along and 4.9 to 5.9 mm across, the last under one facet of the
    // reference (8.9 mm), so its breadth is a lower bound.
    { name: "malleolus-medial", class: "bone", segment: "tibia", landmarks: ["malleolusMedial"], scale: "ankle", along: 0.36, across: 0.22, height: 0.034 },
    // The hollow between the medial malleolus and the Achilles tendon: 2.34 mm deep, half widths 13.2 to 21.1 along and 5.0 mm across.
    { name: "retromalleolar-hollow-medial", class: "pad", segment: "tibia", landmarks: ["retromalleolarMedial"], scale: "ankle", along: 0.7, across: 0.21, height: -0.044 },
  ];

  /** The catalogue's forms the wall carries. */
  export const WALL: readonly INone[] = [
    { name: "spinal-furrow", why: "a groove of 6.6 mm mean and 10.9 mm greatest depth along the whole back median: the wall's own inflection line" },
    { name: "sternal-channel", why: "a groove of 4.7 mm mean depth from the notch down, made by the thorax's wall and the two breasts' mounds" },
    { name: "acromion", why: "a convex corner of the shoulder's top profile, 12.2 mm above its chord, with no rim round it" },
    { name: "humeral-epicondyles", why: "the elbow section's two extremes along the flexion axis; under 0.8 mm over their surroundings" },
    { name: "styloids", why: "the wrist section's diameter's ends; under 0.8 mm over their surroundings" },
    { name: "achilles-tendon", why: "the shank's back itself above the heel, not a ridge on a wider surface" },
    { name: "thenar", why: "a mound as wide as the palm's side it stands on: its window has no rim on the hand" },
    { name: "hypothenar", why: "as the thenar, on the ulnar side" },
  ];

  /** The catalogue's features f1 does not show over its reading's floor and no opened source states a height for. */
  export const ABSENT: readonly INone[] = [
    { name: "sternoclavicular-head", why: "0.92 mm against a floor of 2.66 mm" },
    { name: "scapular-spine", why: "no station of 61 over 0.5 mm" },
    { name: "scapula-medial-border", why: "no station of 61 over 0.5 mm" },
    { name: "scapula-inferior-angle", why: "0.79 mm at the window's edge against a floor of 1.15 mm" },
    { name: "iliac-crest", why: "iliocristale 1.33 mm at the window's edge against 1.85 mm; the anterior superior iliac spine 0.37 mm against 0.51 mm" },
    { name: "sacral-dimples", why: "0.54 mm against a floor of 0.62 mm" },
    { name: "olecranon", why: "1.48 mm with 1.31 mm of the opposite sign beside it, against a floor of 1.92 mm: a baseline's misfit" },
    { name: "parapatellar-hollows", why: "0.46 and 0.32 mm against floors of 1.12 and 0.56 mm" },
    { name: "tibial-tuberosity", why: "0.39 mm against a floor of 0.86 mm" },
    { name: "retromalleolar-hollow-lateral", why: "0.79 mm against a floor of 0.81 mm" },
    { name: "extensor-tendons", why: "six stations of 244 over 0.5 mm; a tendon is 4.39 (0.71) mm wide and 1.29 (0.19) mm thick (Meng et al. 2010, ultrasound), which bounds a ridge and states none" },
    { name: "mastoid", why: "0.88 mm against a floor of 1.90 mm, behind the auricle" },
  ];

  /**
   * A law's template for a person.
   *
   * @param law The feature's law.
   * @param datums Its landmarks and directions in its segment's frame.
   * @param scale The person's length the law names, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A feature of one landmark is centred on it, long along the segment's direction made square to the outward direction and short along `outward x along`, so its height stands along the outward direction; a feature of two landmarks is `AutoMovieHumanFeatureTemplate.between` of them. Every size is the law's share times the person's length. Premise: `outward` is not along the long direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on the number of landmarks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No feature is named in the constructor; a nonpositive length, a missing end, a missing long direction and a missing share are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the units and where each number of the result comes from.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The span's construction is the template record's own `between`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function template(law: ILaw, datums: IDatums, scale: number): T.ITemplate {
    if (!(Number.isFinite(scale) && scale > 0)) throw new Error("feature law: the length of " + law.name + " must be finite and positive");
    if (law.landmarks.length === 2) {
      if (datums.to === undefined) throw new Error("feature law: " + law.name + " runs between two landmarks and was given one");
      return T.between(datums.from, datums.to, { name: law.name, class: law.class, segment: law.segment, outward: datums.outward, half: law.across * scale, height: law.height * scale });
    }
    if (datums.along === undefined || law.along === undefined) throw new Error("feature law: " + law.name + " has one landmark and needs a long direction and a share along it");
    const outward: AutoMovieVector3Tuple = F.unit(datums.outward);
    const along: AutoMovieVector3Tuple = F.perpendicular(datums.along, outward);
    return { name: law.name, class: law.class, segment: law.segment, centre: [...datums.from], along, across: F.unit(F.cross(outward, along)), extent: { along: law.along * scale, across: law.across * scale }, height: law.height * scale };
  }
}
