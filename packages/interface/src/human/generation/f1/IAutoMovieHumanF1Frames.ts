import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanSegmentFrame } from "../frame/IAutoMovieHumanSegmentFrame";

/**
 * Reference joint and skin-landmark tables, segment frames and the clinical
 * angle sequences they define.
 *
 * The interface package owns these declarations; AutoMovieHumanF1Frames in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanF1Frames {
  /** One segment: its name, parent, rule and reference frame. */
  export interface ISegment {
    /** Name, such as `humerus` or `index.middle`. */
    name: string;

    /** Parent segment; null for the root. */
    parent: string | null;

    /**
     * The written definition of its origin and axes, with its source or its
     * declared substitute.
     */
    rule: string;

    /** The frame in the reference pose, figure frame, mm. */
    frame: IAutoMovieHumanSegmentFrame;
  }

  /** A joint ISB writes angles for: the segment it moves and the angle sequence. */
  export interface IAngles {
    /** Joint name. */
    joint: string;

    /** The child segment, whose rotation relative to its parent the angles read. */
    segment: string;

    /**
     * ISB's sequence: Y-X-Y Euler (shoulder, Wu et al. 2005 2.4.7) or Z-X-Y
     * Cardan (the joint coordinate systems of the others).
     */
    sequence: "YXY" | "ZXY";

    /** The meaning of the three angles, in order. */
    names: [string, string, string];
  }

  /**
   * The J argument of AutoMovieHumanF1Frames.segments. Every segment
   * parent-first, in the reference pose, by its rule.
   *
   * @param J The joint table the rules read; absent, f1's own at the reference
   *   pose.
   * @param L The landmark table the rules read; absent, f1's own at the
   *   reference pose.
   */
  export type IJointLandmarks = {
    /** Reference joint `upperarm_r`. */
    upperarm: AutoMovieVector3Tuple;

    /** Reference joint `lowerarm_r`. */
    lowerarm: AutoMovieVector3Tuple;

    /** Reference joint `hand_r`. */
    hand: AutoMovieVector3Tuple;

    /** Reference joint `thigh_r`. */
    thigh: AutoMovieVector3Tuple;

    /** Reference joint `calf_r`. */
    calf: AutoMovieVector3Tuple;

    /** Reference joint `foot_r`. */
    foot: AutoMovieVector3Tuple;

    /** Reference joint `index_01_r`. */
    index1: AutoMovieVector3Tuple;

    /** Reference joint `index_02_r`. */
    index2: AutoMovieVector3Tuple;

    /** Reference joint `index_03_r`. */
    index3: AutoMovieVector3Tuple;

    /** Reference joint `middle_01_r`. */
    middle1: AutoMovieVector3Tuple;

    /** Reference joint `middle_02_r`. */
    middle2: AutoMovieVector3Tuple;

    /** Reference joint `middle_03_r`. */
    middle3: AutoMovieVector3Tuple;

    /** Reference joint `ring_01_r`. */
    ring1: AutoMovieVector3Tuple;

    /** Reference joint `ring_02_r`. */
    ring2: AutoMovieVector3Tuple;

    /** Reference joint `ring_03_r`. */
    ring3: AutoMovieVector3Tuple;

    /** Reference joint `pinky_01_r`. */
    pinky1: AutoMovieVector3Tuple;

    /** Reference joint `pinky_02_r`. */
    pinky2: AutoMovieVector3Tuple;

    /** Reference joint `pinky_03_r`. */
    pinky3: AutoMovieVector3Tuple;

    /** Reference joint `thumb_01_r`. */
    thumb1: AutoMovieVector3Tuple;

    /** Reference joint `thumb_02_r`. */
    thumb2: AutoMovieVector3Tuple;

    /** Reference joint `thumb_03_r`. */
    thumb3: AutoMovieVector3Tuple;

    /** Reference joint `bigtoe_01_r`. */
    bigtoe1: AutoMovieVector3Tuple;

    /** Reference joint `bigtoe_02_r`. */
    bigtoe2: AutoMovieVector3Tuple;

    /** Reference joint `indextoe_01_r`. */
    indextoe1: AutoMovieVector3Tuple;

    /** Reference joint `indextoe_02_r`. */
    indextoe2: AutoMovieVector3Tuple;

    /** Reference joint `middletoe_01_r`. */
    middletoe1: AutoMovieVector3Tuple;

    /** Reference joint `middletoe_02_r`. */
    middletoe2: AutoMovieVector3Tuple;

    /** Reference joint `ringtoe_01_r`. */
    ringtoe1: AutoMovieVector3Tuple;

    /** Reference joint `ringtoe_02_r`. */
    ringtoe2: AutoMovieVector3Tuple;

    /** Reference joint `littletoe_01_r`. */
    littletoe1: AutoMovieVector3Tuple;

    /** Reference joint `littletoe_02_r`. */
    littletoe2: AutoMovieVector3Tuple;

    /**
     * The far point of the index finger's pad: the skin's farthest point along
     * its last segment, within 6 mm of that segment's line. Its course aims at
     * it.
     */
    indexPad: AutoMovieVector3Tuple;

    /**
     * The far point of the middle finger's pad: the skin's farthest point along
     * its last segment, within 6 mm of that segment's line. Its course aims at
     * it.
     */
    middlePad: AutoMovieVector3Tuple;

    /**
     * The far point of the ring finger's pad: the skin's farthest point along
     * its last segment, within 6 mm of that segment's line. Its course aims at
     * it.
     */
    ringPad: AutoMovieVector3Tuple;

    /**
     * The far point of the pinky finger's pad: the skin's farthest point along
     * its last segment, within 6 mm of that segment's line. Its course aims at
     * it.
     */
    pinkyPad: AutoMovieVector3Tuple;

    /**
     * The far point of the thumb's pad: the skin's farthest point along its
     * last segment, within 6 mm of that segment's line. Its course aims at it.
     */
    thumbPad: AutoMovieVector3Tuple;

    /**
     * The far point of the big toe's pad: the skin's farthest point along its
     * last segment, within 6 mm of that segment's line. Its course aims at it.
     */
    bigtoePad: AutoMovieVector3Tuple;

    /**
     * The far point of the index toe's pad: the skin's farthest point along its
     * last segment, within 6 mm of that segment's line. Its course aims at it.
     */
    indextoePad: AutoMovieVector3Tuple;

    /**
     * The far point of the middle toe's pad: the skin's farthest point along
     * its last segment, within 6 mm of that segment's line. Its course aims at
     * it.
     */
    middletoePad: AutoMovieVector3Tuple;

    /**
     * The far point of the ring toe's pad: the skin's farthest point along its
     * last segment, within 6 mm of that segment's line. Its course aims at it.
     */
    ringtoePad: AutoMovieVector3Tuple;

    /**
     * The far point of the little toe's pad: the skin's farthest point along
     * its last segment, within 6 mm of that segment's line. Its course aims at
     * it.
     */
    littletoePad: AutoMovieVector3Tuple;

    /**
     * The ear's plate's course, along the auricle's long axis from below the
     * lobule to above the helix's top, through the middle of the plate's lens
     * at each station: the lens is the auricle's cranial skin and the floor of
     * its hollows, read off the reference's sections square to the course
     * (`FamilyConicBody.ts plate --kernels`, which also gives each lens's
     * centroid in its chart). Laid through those centroids where it can be,
     * with the turn at 1,566 mm 2 mm farther back than they stand, since there
     * the lens is 4 mm thin and the course fell on its floor, and its last leg
     * aimed 5 mm behind the top lenses' centroids: on the leg through them (to
     * [13, 1600, 80.5]) the planes leaned 30 degrees forward and three of them
     * cut the helix's front limb with the plate, a lens three times as long.
     * The last centre stands under the helix's top (its course 88.6 mm out at
     * 1,599.3 mm), so the plate's top cap closes into the tube: ended at [8,
     * 1602, 80.5] the cap closed 8 mm inside the tube's line and its square end
     * showed under the helix's arch (`ear.left`). Every section holds the
     * course.
     */
    plate: AutoMovieVector3Tuple[];

    /**
     * Where the breast's course starts, inside the chest 30 mm behind the
     * dome's top along the skin's normal there: the top is the skin's point
     * farthest along that normal, and the normal the vector area of the skin
     * within 12 mm of the top.
     */
    breastRoot: AutoMovieVector3Tuple;

    /** Where the breast's course ends, along the same normal 8 mm past the top. */
    breastTip: AutoMovieVector3Tuple;
  };

  /**
   * The L argument of AutoMovieHumanF1Frames.segments. Every segment
   * parent-first, in the reference pose, by its rule.
   *
   * @param J The joint table the rules read; absent, f1's own at the reference
   *   pose.
   * @param L The landmark table the rules read; absent, f1's own at the
   *   reference pose.
   */
  export type ILandmarks = {
    /**
     * EL, the lateral humeral epicondyle (Wu et al. 2005, 2.3.4): on the skin's
     * section through the elbow centre (`lowerarm_r`) square to the humerus's
     * long axis (`upperarm_r` to `lowerarm_r`), the extreme along the elbow's
     * flexion axis, the normal of the plane the humerus and the forearm span
     * (the reference's elbow stands flexed 37 degrees, so that plane is
     * defined), on the lateral side.
     */
    epicondyleLateral: AutoMovieVector3Tuple;

    /**
     * EM, the medial humeral epicondyle: the same section's extreme on the
     * medial side (skin breadth EL to EM 75.0 mm; bony 61.9 +- 4.2 mm).
     */
    epicondyleMedial: AutoMovieVector3Tuple;

    /**
     * RS, the radial styloid (Wu et al. 2005, 2.3.6): on the skin's section
     * through the wrist centre (`hand_r`) square to the forearm's long axis
     * (`lowerarm_r` to `hand_r`), the end of the section's diameter nearer the
     * thumb's carpometacarpal joint (`thumb_01_r`). The bistyloid breadth is
     * the wrist's greatest breadth, so the diameter runs between the styloids.
     */
    styloidRadial: AutoMovieVector3Tuple;

    /**
     * US, the ulnar styloid: the other end of that diameter (skin bistyloid
     * breadth 55.7 mm; bony 49.4 +- 3.3 mm).
     */
    styloidUlnar: AutoMovieVector3Tuple;

    /**
     * The lateral femoral epicondyle (Wu et al. 2002, 4.4): on the skin's
     * section through the knee centre (`calf_r`) square to the femur's long
     * axis (`thigh_r` to `calf_r`), the extreme along the hip centres' line
     * (+Z) made square to the femur, on the lateral side. The reference's knee
     * stands extended, so its flexion axis is not read from a bend; the hip
     * centres' line stands for it.
     */
    femoralEpicondyleLateral: AutoMovieVector3Tuple;

    /**
     * The medial femoral epicondyle: the same section's medial extreme (skin
     * biepicondylar breadth 107.8 mm; bony 90.5 +- 6.0 mm).
     */
    femoralEpicondyleMedial: AutoMovieVector3Tuple;

    /**
     * Pternion, the heel's back: the skin vertex farthest behind the ankle
     * centre along the foot's level long axis (the ankle centre to the second
     * toe's metatarsophalangeal joint, `indextoe_01_r`), below the ankle
     * centre, within 30 mm of the foot's sagittal plane through the ankle
     * centre and 150 mm of it; 46.6 mm behind the ankle centre.
     */
    pternion: AutoMovieVector3Tuple;

    /**
     * IJ, suprasternale, the deepest point of the jugular notch (Wu et al.
     * 2005, 2.3.1): on the median section (z = 0), the front profile's most
     * posterior point between 1,330 and 1,430 mm high, the pit where the neck's
     * front meets the manubrium, 3.2 mm deeper than the profile at the nearer
     * window end. Its height is 0.833 of stature (the skin's highest point,
     * 1,699.7 mm), against ANSUR II women's 0.8164 +- 0.0071 (+2.3 SD).
     */
    suprasternale: AutoMovieVector3Tuple;

    /**
     * Pronasale, the nose's tip: on the head's median section, the front
     * profile's most anterior point between 1,535 and 1,575 mm high.
     */
    pronasale: AutoMovieVector3Tuple;

    /**
     * Nasion, the root of the nose: the front profile's most posterior point
     * from 15 to 50 mm above pronasale.
     */
    nasion: AutoMovieVector3Tuple;

    /**
     * Subnasale, where the columella meets the upper lip: the front profile's
     * most posterior point from 22 to 4 mm below pronasale.
     */
    subnasale: AutoMovieVector3Tuple;

    /**
     * The base of the third metacarpal, Wu et al. 2005 4.3.4's proximal
     * landmark of the hand's frame: the reference rig's bind joint
     * `middle_metacarpal_r`, read like the joint table
     * (`FamilyConicSource.load`, native centimetres to the figure's frame),
     * rounded to 0.01 mm. The metacarpal's head is the joint table's
     * `middle1`.
     */
    metacarpalBase: AutoMovieVector3Tuple;

    /**
     * Tragion, read at the tragus's crest: on the head's level section through
     * the concha's deepest point (1,563 mm,
     * `AutoMovieHumanF1Joints.conchaRoot`), the outline point farthest out (+Z)
     * from 0 to 20 mm in front of that point. Farkas's tragion is the notch at
     * the tragus's upper margin, a few millimetres above this crest; the head
     * frame reads it only for its origin, the bitragion midpoint.
     */
    tragion: AutoMovieVector3Tuple;
  };
}
