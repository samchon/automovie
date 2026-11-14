import { AutoMovieHumanSegmentFrame as F } from "../frame/AutoMovieHumanSegmentFrame";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Landmarks } from "./AutoMovieHumanF1Landmarks";
import { AutoMovieHumanF1Placing } from "./AutoMovieHumanF1Placing";

/**
 * f1's segment-frame tree in its reference pose: every segment's parent, its frame built from f1's own joint centres and landmarks
 * (`AutoMovieHumanF1Joints`, `AutoMovieHumanF1Landmarks`) by the rule written beside it, and the chain of reference rotations that
 * returns it.
 *
 * The chain is stored (`AutoMovieHumanF1Placing.CHAIN`, written from these rules by `test/src/reference-conics/FamilyConicRebase.ts
 * --tables`) and is the one definition every part is placed by: `joints` and `world` read it. The rules here are its written
 * definition: `segments` applies them to the landmarks, which at the reference pose are themselves read through the stored chain, and a
 * unit test holds that the rules return that chain within rounding, so a rule and the stored chain cannot part unnoticed.
 *
 * The tree: pelvis (root) > thorax > head > ear and nose; thorax > breast; thorax > humerus > forearm > hand > each finger's proximal,
 * middle and distal phalanges, and hand > the thumb's metacarpal, proximal and distal phalanges; pelvis > femur > tibia > foot > each
 * toe's phalanges. Pelvis, thorax and head are distinct frames although one trunk family carries all three, so the ear, the nose and the
 * breast have their anatomical parents; they are rigid to each other for now.
 *
 * Handedness: every frame is right-handed with X forward, Y by ISB and Z = X x Y, which points along +Z for the stored side, the side
 * whose datums the joint table holds. Under ISB's convention that side plays the right limb (the reference rig's `_r` joints), while the
 * repository's views label it left; the figure is mirror-symmetric, so this is a naming difference, not geometry. The twin is the
 * reflection in z = 0, `AutoMovieHumanSegmentFrame.mirror`, whose joint rotations are `D R D` with `D = diag(1, 1, -1)`.
 *
 * Origins: every articulated segment's origin is its proximal joint centre, the joint the chain pivots it about. Where ISB puts its own
 * origin elsewhere (the forearm at US, the tibia at IM, a phalanx midway between its base and head), that is a constant translation inside
 * the segment that changes no axis and no joint angle. Rigid parts keep the origins named in their rules.
 *
 * Two readings of the reference pose that look unanatomical are the definitions' own, and no frame is tuned to mend them:
 * - The elbow reads 27.0 degrees of flexion, while the lines through the joint centres (GH to the elbow centre, the elbow centre to the
 *   wrist centre) stand 36.6 degrees apart. ISB's long axes are not those lines: the humerus's runs from the epicondyles' midpoint to
 *   GH and the forearm's from the ulnar styloid to that midpoint, and US stands on the wrist's ulnar side, off the wrist centre, so the
 *   two ISB axes stand 27.4 degrees apart (`FamilyConicFrames.ts`).
 * - The wrist reads -19.8 degrees of axial rotation. The forearm's Z comes from the plane of the two styloids and the epicondyles'
 *   midpoint, the hand's from the line across the knuckles (the fifth metacarpal head to the second), a declared substitute for the
 *   third metacarpal's unpalpable sagittal plane; the two substitutes are different lines of the wrist and the hand, and their angle
 *   about the long axis is the reading.
 */
export namespace AutoMovieHumanF1Frames {
  /** One segment: its name, parent, rule and reference frame. */
  export interface ISegment {
    /** Name, such as `humerus` or `index.middle`. */
    name: string;

    /** Parent segment; null for the root. */
    parent: string | null;

    /** The written definition of its origin and axes, with its source or its declared substitute. */
    rule: string;

    /** The frame in the reference pose, figure frame, mm. */
    frame: F.IFrame;
  }

  /** A joint ISB writes angles for: the segment it moves and the angle sequence. */
  export interface IAngles {
    /** Joint name. */
    joint: string;

    /** The child segment, whose rotation relative to its parent the angles read. */
    segment: string;

    /** ISB's sequence: Y-X-Y Euler (shoulder, Wu et al. 2005 2.4.7) or Z-X-Y Cardan (the joint coordinate systems of the others). */
    sequence: "YXY" | "ZXY";

    /** The meaning of the three angles, in order. */
    names: [string, string, string];
  }

  /**
   * The joints ISB writes angles for, with their sequences, each angle named for its positive sense.
   *
   * Read in the published text (2026-11-14): the shoulder, Wu et al. 2005 2.4.7, "plane of elevation, 0 degrees is abduction, 90 degrees
   * is forward flexion", "elevation (negative)" and axial rotation "endo- or internal-rotation (positive)"; the elbow, 3.4.1, "flexion
   * (positive) and hyperextension (negative)", the carrying angle, "pronation (positive) and supination (negative)"; the ankle, Wu et
   * al. 2002 3.5, "dorsiflexion (positive)", "inversion (positive)", "internal rotation (positive)". For the hip, Wu et al. 2002 4.5
   * names "flexion or extension", "adduction or abduction" and "internal or external rotation" without a sign, and the paper has no knee
   * section (ankle, hip and spine only): the hip's and the knee's names are the sense of a positive rotation about the axes ISB defines
   * (about the parent's Z to the right, a positive turn carries the femur's distal end forward, flexion, and the tibia's forward too,
   * extension), since Grood and Suntay 1983, whom the knee follows, could not be reached. The wrist's section was not read.
   */
  export const ANGLES: readonly IAngles[] = [
    { joint: "shoulder", segment: "humerus", sequence: "YXY", names: ["plane of elevation", "elevation", "axial rotation"] },
    { joint: "elbow", segment: "forearm", sequence: "ZXY", names: ["flexion", "carrying angle", "pronation"] },
    { joint: "wrist", segment: "hand", sequence: "ZXY", names: ["flexion", "ulnar deviation", "axial rotation"] },
    { joint: "hip", segment: "femur", sequence: "ZXY", names: ["flexion", "adduction", "internal rotation"] },
    { joint: "knee", segment: "tibia", sequence: "ZXY", names: ["extension", "adduction", "internal rotation"] },
    { joint: "ankle", segment: "foot", sequence: "ZXY", names: ["dorsiflexion", "inversion", "internal rotation"] },
  ];

  /**
   * The auricle's plane normal, from the least-squares plane `z = 26.36 - 0.651 x + 0.041 y` of the auricle read by
   * `FamilyConicScan.ts helix 79 7 ridges` (recorded on `AutoMovieHumanF1Joints.antihelix`): `(0.651, -0.041, 1)`, pointing out (+Z).
   */
  export const AURICLE: F.V3 = [0.651, -0.041, 1];

  /** How far the breast's course root stands inside the chest behind the dome's top along its normal, mm (`AutoMovieHumanF1Joints.breastRoot`). */
  export const BREAST_DEPTH: number = 30;

  /**
   * Every segment parent-first, in the reference pose, by its rule.
   *
   * @param J The joint table the rules read; absent, f1's own at the reference pose.
   * @param L The landmark table the rules read; absent, f1's own at the reference pose.
   */
  export function segments(J: typeof AutoMovieHumanF1Joints = AutoMovieHumanF1Joints, L: typeof AutoMovieHumanF1Landmarks = AutoMovieHumanF1Landmarks): ISegment[] {
    const out: ISegment[] = [];
    const add = (name: string, parent: string | null, rule: string, frame: F.IFrame): F.IFrame => {
      out.push({ name, parent, rule, frame });
      return frame;
    };

    // The trunk's three frames: ISB's pelvis needs the iliac spines and its thorax the xiphoid, T8 and C7, none of which the skin shows.
    const pelvis: F.IFrame = add("pelvis", null, "Origin the hip centres' midpoint (de Leva's MIDH; ISB's own origin, the hip centre of one side, lies half the hip-centre separation along Z). Axes parallel to the figure's frame: ISB (Wu et al. 2002 2.3.1) sets them from the ASIS and PSIS, which the skin does not show, so the standing pelvic tilt is not measured.", F.parallel([J.thigh[0], J.thigh[1], 0], { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] }));
    const thorax: F.IFrame = add("thorax", "pelvis", "Origin IJ (Wu et al. 2005 2.3.1). Axes parallel to the pelvis's: ISB's Y runs from the PX/T8 midpoint to the IJ/C7 midpoint, and the skin shows neither PX, T8 nor C7 (C7's reading was refused at -6.3 SD of ANSUR II cervicale height, below IJ), so the thoracic inclination is not measured.", F.parallel(L.suprasternale, pelvis));
    add("head", "thorax", "Origin the bitragion midpoint (Farkas 1994), tragion read at the tragus's crest. Axes parallel to the thorax's: the Frankfort plane needs orbitale, which the skin does not show, so the Frankfort plane is not measured.", F.parallel([L.tragion[0], L.tragion[1], 0], thorax));
    add("ear", "head", "Origin tragion. Y the auricle's long axis, from the plate course's first centre below the lobule to its last above the helix (`AutoMovieHumanF1Joints.plate`); Z the auricle's plane normal (AURICLE) made square to Y, out; X = Y x Z, forward.", F.fromYZ(L.tragion, F.sub(J.plate[J.plate.length - 1]!, J.plate[0]!), AURICLE));
    add("nose", "head", "Origin subnasale. Y from subnasale to nasion (Farkas's nose height); Z the normal of the plane through nasion, subnasale and pronasale, (prn - sn) x (n - sn), to the right; X = Y x Z, forward.", F.fromYZ(L.subnasale, F.sub(L.nasion, L.subnasale), F.cross(F.sub(L.pronasale, L.subnasale), F.sub(L.nasion, L.subnasale))));
    const normal: F.V3 = F.unit(F.sub(J.breastTip, J.breastRoot));
    add("breast", "thorax", "Origin the dome's top, BREAST_DEPTH along the skin's normal from the course's root (`AutoMovieHumanF1Joints.breastRoot`). X that normal, out; Y the thorax's Y made square to X; Z = X x Y.", F.fromXY(F.add(J.breastRoot, F.scale(normal, BREAST_DEPTH)), normal, thorax.axes[1]));

    // The arm: ISB humerus option 1 and forearm from the read epicondyles and styloids; the hand from the third metacarpal.
    add("humerus", "thorax", "Wu et al. 2005 2.3.4 option 1: origin GH (`upperarm`); Y from the epicondyles' midpoint to GH; X the normal of the GH-EL-EM plane, forward; Z = X x Y.", F.humerus(J.upperarm, L.epicondyleLateral, L.epicondyleMedial));
    add("forearm", "humerus", "Wu et al. 2005 2.3.6: Y from US to the epicondyles' midpoint; X the normal of the US-RS-midpoint plane, forward; Z = X x Y. Origin the elbow centre (`lowerarm`); ISB's origin US is a translation inside the segment.", F.forearm(J.lowerarm, L.styloidUlnar, L.styloidRadial, L.epicondyleLateral, L.epicondyleMedial));
    const hand: F.IFrame = add("hand", "forearm", "Wu et al. 2005 4.3.4, third metacarpal: Y from its head (`middle1`) to its base (`metacarpalBase`), proximal. Its sagittal plane is not palpable, so Z is the radial direction across the knuckles, from the fifth metacarpal head (`pinky1`) to the second (`index1`), made square to Y; X = Y x Z, volar. Origin the wrist centre (`hand`); ISB's origin is a translation inside the segment.", F.fromYZ(J.hand, F.sub(L.metacarpalBase, J.middle1), F.sub(J.index1, J.pinky1)));
    const fingers: [string, F.V3[]][] = [
      ["index", [J.index1, J.index2, J.index3, J.indexPad]],
      ["middle", [J.middle1, J.middle2, J.middle3, J.middlePad]],
      ["ring", [J.ring1, J.ring2, J.ring3, J.ringPad]],
      ["pinky", [J.pinky1, J.pinky2, J.pinky3, J.pinkyPad]],
    ];
    for (const [finger, points] of fingers) {
      let parent: string = "hand";
      let z: F.V3 = hand.axes[2];
      for (const [k, bone] of (["proximal", "middle", "distal"] as const).entries()) {
        const name: string = finger + "." + bone;
        const frame: F.IFrame = add(name, parent, "Wu et al. 2005 4.3.5: origin the proximal joint (" + finger + (k + 1) + "); Y from the distal joint (" + (k === 2 ? finger + "Pad, the pad's far point" : finger + (k + 2)) + ") to it, proximal; Z the parent's Z made square to Y (the bone's sagittal plane is not palpable); X = Y x Z, volar. ISB's origin midway between base and head is a translation inside the segment.", F.fromYZ(points[k]!, F.sub(points[k]!, points[k + 1]!), z));
        parent = name;
        z = frame.axes[2];
      }
    }
    const thumb: F.V3[] = [J.thumb1, J.thumb2, J.thumb3, J.thumbPad];
    let thumbParent: string = "hand";
    let thumbX: F.V3 = F.scale(hand.axes[2], -1);
    for (const [k, bone] of (["metacarpal", "proximal", "distal"] as const).entries()) {
      const name: string = "thumb." + bone;
      const frame: F.IFrame = add(name, thumbParent, "Origin the proximal joint (thumb" + (k + 1) + "); Y from the distal joint (" + (k === 2 ? "thumbPad" : "thumb" + (k + 2)) + ") to it, proximal; X " + (k === 0 ? "the hand's ulnar direction (-Z) made square to Y, so the volar face turns toward the palm (Gray 1918: the first metacarpal's palmar surface faces medially)" : "the parent's X made square to Y") + "; Z = X x Y.", F.fromYX(thumb[k]!, F.sub(thumb[k]!, thumb[k + 1]!), thumbX));
      thumbParent = name;
      thumbX = frame.axes[0];
    }

    // The leg: ISB femur from the read femoral epicondyles; the tibia and the foot by declared substitutes for the unread malleoli.
    add("femur", "pelvis", "Wu et al. 2002 4.4: origin the hip centre (`thigh`); Y from the femoral epicondyles' midpoint to it; Z the medial-to-lateral epicondyle direction made square to Y; X = Y x Z.", F.femur(J.thigh, L.femoralEpicondyleLateral, L.femoralEpicondyleMedial));
    add("tibia", "femur", "Wu et al. 2002 3.3 with substitutes: the malleoli are refused, so IM is the ankle centre (`foot`), IC the knee centre (`calf`) and Z the femoral epicondyle line made square to the long axis (zero tibial torsion, as the removed leg frames declared). Y from the ankle centre to the knee centre; X = Y x Z. Origin the knee centre; ISB's origin IM is a translation inside the segment.", F.fromYZ(J.calf, F.sub(J.calf, J.foot), F.sub(L.femoralEpicondyleLateral, L.femoralEpicondyleMedial)));
    const foot: F.IFrame = add("foot", "tibia", "Wu et al. 2002 3.4 sets the calcaneus frame equal to the tibia's at neutral; from the foot's own landmarks: origin the ankle centre (`foot`); Y the floor's normal (the sole stands flat on the floor in the reference); X from pternion to the second toe's MTP joint (`indextoe1`) made square to Y; Z = X x Y.", F.fromYX(J.foot, [0, 1, 0], F.sub(J.indextoe1, L.pternion)));
    const toes: [string, F.V3[]][] = [
      ["bigtoe", [J.bigtoe1, J.bigtoe2, J.bigtoePad]],
      ["indextoe", [J.indextoe1, J.indextoe2, J.indextoePad]],
      ["middletoe", [J.middletoe1, J.middletoe2, J.middletoePad]],
      ["ringtoe", [J.ringtoe1, J.ringtoe2, J.ringtoePad]],
      ["littletoe", [J.littletoe1, J.littletoe2, J.littletoePad]],
    ];
    for (const [toe, points] of toes) {
      let parent: string = "foot";
      let y: F.V3 = foot.axes[1];
      for (const [k, bone] of (["proximal", "distal"] as const).entries()) {
        const name: string = toe + "." + bone;
        const frame: F.IFrame = add(name, parent, "Origin the proximal joint (" + toe + (k + 1) + "); X along the bone to " + (k === 1 ? toe + "Pad (the rig has two joints per toe, so the small toes' middle and distal phalanges are one segment)" : toe + "2") + ", distal; Y the parent's Y made square to X, dorsal; Z = X x Y. X forward and Y up as the foot's, so the toes' zero lies in line with the foot.", F.fromXY(points[k]!, F.sub(points[k + 1]!, points[k]!), y));
        parent = name;
        y = frame.axes[1];
      }
    }
    return out;
  }

  /** The chain of reference rotations, parent-first: the stored chain, which the rules of `segments` return within rounding. */
  export function joints(): F.IJoint[] {
    return AutoMovieHumanF1Placing.CHAIN;
  }

  /** The frames for a pose given as one rotation per joint by segment name; a joint the pose leaves undefined keeps its reference rotation. */
  export function world(pose: (name: string) => F.M3 | undefined): Map<string, F.IFrame> {
    return F.world(joints(), pose);
  }
}
