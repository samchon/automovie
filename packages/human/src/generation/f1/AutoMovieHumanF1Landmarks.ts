import type { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's bony and facial landmarks on the stored side (+Z) in its reference pose: the points the segment frames need that the joint table
 * lacks.
 *
 * Frame: millimetres, forward +X, up +Y, +Z the stored side, the side whose datums the joint table holds (the reference rig's `_r`
 * joints). Its twin is the reflection in z = 0, because the reference is mirror-symmetric.
 *
 * Each value was read once from the reference skin at its palpation site by the written definition in its comment, with
 * `test/src/reference-conics/FamilyConicLandmarks.ts` (from `test/`: `pnpm conic:build`, then
 * `node .shots/esbuild/FamilyConicLandmarks.cjs`), reading of 2026-11-14 `test/.shots/family-conic-landmarks/2026-11-14T08-08-13.033Z`,
 * rounded to 0.01 mm. A skin reading stands on the soft tissue over the bone, so a breadth between two of them is a skin breadth and
 * reads wider than the caliper's bony breadth (Heinz et al. 2003, women, per side, `docs/sources/heinz-2003-body-dimensions.md`).
 *
 * Not stored, because the reference skin does not show them unambiguously:
 * - the anterior and posterior superior iliac spines, the xiphoid process, T8, orbitale and the scapular points: no mark on the skin;
 * - the malleoli: over sections square to the shank from 25 mm below to 25 mm above the ankle centre, the lateral extreme stands within
 *   0.33 mm of the slab's end (no prominence), and the skin bimalleolar breadth (61.3 mm) falls below the bony mean (65.2 +- 4.4 mm);
 * - the vertebra prominens: on the back median profile the point farthest behind the chord from the cervical lordosis's apex
 *   (1,510 mm) to the thoracic kyphosis's apex (1,283 mm) stands 6.6 mm behind it but at 1,384 mm, 0.814 of stature (ANSUR II women
 *   cervicale 0.857 +- 0.007, -6.3 SD) and 31.5 mm below suprasternale, where cervicale stands 0.0405 +- 0.0071 of stature above it.
 *
 * The frame each would set takes a declared substitute in the frame tree.
 */
export namespace AutoMovieHumanF1Landmarks {
  /** A point in the figure's frame, mm. */
  export type V3 = AutoMovieHumanF1Joints.V3;

  /**
   * EL, the lateral humeral epicondyle (Wu et al. 2005, 2.3.4): on the skin's section through the elbow centre (`lowerarm_r`) square to
   * the humerus's long axis (`upperarm_r` to `lowerarm_r`), the extreme along the elbow's flexion axis, the normal of the plane the
   * humerus and the forearm span (the reference's elbow stands flexed 37 degrees, so that plane is defined), on the lateral side.
   */
  export const epicondyleLateral: V3 = [-0.08, 1160.08, 330.62];

  /** EM, the medial humeral epicondyle: the same section's extreme on the medial side (skin breadth EL to EM 75.0 mm; bony 61.9 +- 4.2 mm). */
  export const epicondyleMedial: V3 = [-2.48, 1114.56, 271.09];

  /**
   * RS, the radial styloid (Wu et al. 2005, 2.3.6): on the skin's section through the wrist centre (`hand_r`) square to the forearm's
   * long axis (`lowerarm_r` to `hand_r`), the end of the section's diameter nearer the thumb's carpometacarpal joint (`thumb_01_r`).
   * The bistyloid breadth is the wrist's greatest breadth, so the diameter runs between the styloids.
   */
  export const styloidRadial: V3 = [163.58, 1001.55, 408.85];

  /** US, the ulnar styloid: the other end of that diameter (skin bistyloid breadth 55.7 mm; bony 49.4 +- 3.3 mm). */
  export const styloidUlnar: V3 = [120.05, 979.18, 435.36];

  /**
   * The lateral femoral epicondyle (Wu et al. 2002, 4.4): on the skin's section through the knee centre (`calf_r`) square to the femur's
   * long axis (`thigh_r` to `calf_r`), the extreme along the hip centres' line (+Z) made square to the femur, on the lateral side. The
   * reference's knee stands extended, so its flexion axis is not read from a bend; the hip centres' line stands for it.
   */
  export const femoralEpicondyleLateral: V3 = [5.64, 469.11, 160.68];

  /** The medial femoral epicondyle: the same section's medial extreme (skin biepicondylar breadth 107.8 mm; bony 90.5 +- 6.0 mm). */
  export const femoralEpicondyleMedial: V3 = [12.7, 463.94, 53.23];

  /**
   * Pternion, the heel's back: the skin vertex farthest behind the ankle centre along the foot's level long axis (the ankle centre to the
   * second toe's metatarsophalangeal joint, `indextoe_01_r`), below the ankle centre, within 30 mm of the foot's sagittal plane through the
   * ankle centre and 150 mm of it; 46.6 mm behind the ankle centre.
   */
  export const pternion: V3 = [-45.89, 21.09, 133.97];

  /**
   * IJ, suprasternale, the deepest point of the jugular notch (Wu et al. 2005, 2.3.1): on the median section (z = 0), the front profile's
   * most posterior point between 1,330 and 1,430 mm high, the pit where the neck's front meets the manubrium, 3.2 mm deeper than the
   * profile at the nearer window end. Its height is 0.833 of stature (the skin's highest point, 1,699.7 mm), against ANSUR II women's
   * 0.8164 +- 0.0071 (+2.3 SD).
   */
  export const suprasternale: V3 = [43.15, 1415.5, 0];

  /** Pronasale, the nose's tip: on the head's median section, the front profile's most anterior point between 1,535 and 1,575 mm high. */
  export const pronasale: V3 = [136.59, 1556.75, 0];

  /** Nasion, the root of the nose: the front profile's most posterior point from 15 to 50 mm above pronasale. */
  export const nasion: V3 = [115.74, 1598.5, 0];

  /** Subnasale, where the columella meets the upper lip: the front profile's most posterior point from 22 to 4 mm below pronasale. */
  export const subnasale: V3 = [120.58, 1538, 0];

  /**
   * Tragion, read at the tragus's crest: on the head's level section through the concha's deepest point (1,563 mm,
   * `AutoMovieHumanF1Joints.conchaRoot`), the outline point farthest out (+Z) from 0 to 20 mm in front of that point. Farkas's tragion is
   * the notch at the tragus's upper margin, a few millimetres above this crest; the head frame reads it only for its origin, the
   * bitragion midpoint.
   */
  export const tragion: V3 = [21.55, 1563, 73.44];
}
