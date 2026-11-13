/**
 * f1's joint centres on the +Z side in its reference pose: the datums every authored course of the figure runs through.
 *
 * Frame: millimetres, forward +X, up +Y, +Z the reference's left. The values are the reference rig's bind joint centres,
 * read once offline by `test/src/reference-conics/FamilyConicBody.ts --emit-joints`. A family names its course by these
 * datums and holds no joint coordinate of its own, so a law that places the joints from a person's measurements replaces
 * this table and every course follows.
 */
export namespace AutoMovieHumanF1Joints {
  /** A point in the figure's frame, mm. */
  export type V3 = [number, number, number];

  /** Reference joint `upperarm_r`. */
  export const upperarm: V3 = [-16.33, 1353.22, 142.22];

  /** Reference joint `lowerarm_r`. */
  export const lowerarm: V3 = [-9.1, 1140.12, 304.87];

  /** Reference joint `hand_r`. */
  export const hand: V3 = [140.73, 993.53, 427.22];

  /** Reference joint `thigh_r`. */
  export const thigh: V3 = [25.37, 904.79, 96.64];

  /** Reference joint `calf_r`. */
  export const calf: V3 = [16.32, 466.85, 117.13];

  /** Reference joint `foot_r`. */
  export const foot: V3 = [1.21, 74.69, 134.44];

  /** Reference joint `index_01_r`. */
  export const index1: V3 = [209.19, 955.59, 456.61];

  /** Reference joint `index_02_r`. */
  export const index2: V3 = [235.36, 925.06, 464.28];

  /** Reference joint `index_03_r`. */
  export const index3: V3 = [247.22, 907.85, 464.42];

  /** Reference joint `middle_01_r`. */
  export const middle1: V3 = [191.89, 947.98, 468.66];

  /** Reference joint `middle_02_r`. */
  export const middle2: V3 = [217.65, 913.69, 478.57];

  /** Reference joint `middle_03_r`. */
  export const middle3: V3 = [231.1, 890.45, 475.85];

  /** Reference joint `ring_01_r`. */
  export const ring1: V3 = [173.28, 939.91, 466.79];

  /** Reference joint `ring_02_r`. */
  export const ring2: V3 = [189.84, 908.48, 477.48];

  /** Reference joint `ring_03_r`. */
  export const ring3: V3 = [201.12, 881.56, 473.51];

  /** Reference joint `pinky_01_r`. */
  export const pinky1: V3 = [158.63, 929.05, 461.05];

  /** Reference joint `pinky_02_r`. */
  export const pinky2: V3 = [167.21, 904.64, 467.07];

  /** Reference joint `pinky_03_r`. */
  export const pinky3: V3 = [172.44, 888.88, 465.07];

  /** Reference joint `thumb_01_r`. */
  export const thumb1: V3 = [172.24, 984.71, 419.16];

  /** Reference joint `thumb_02_r`. */
  export const thumb2: V3 = [212.65, 969.02, 417.05];

  /** Reference joint `thumb_03_r`. */
  export const thumb3: V3 = [231.55, 952.73, 417.7];

  /** Reference joint `bigtoe_01_r`. */
  export const bigtoe1: V3 = [146.79, 19.12, 132.1];

  /** Reference joint `bigtoe_02_r`. */
  export const bigtoe2: V3 = [174.35, 15.57, 139.54];

  /** Reference joint `indextoe_01_r`. */
  export const indextoe1: V3 = [140.26, 21.2, 155.87];

  /** Reference joint `indextoe_02_r`. */
  export const indextoe2: V3 = [167.61, 16, 163.76];

  /** Reference joint `middletoe_01_r`. */
  export const middletoe1: V3 = [137.36, 19.89, 172.59];

  /** Reference joint `middletoe_02_r`. */
  export const middletoe2: V3 = [158.91, 13.84, 179.13];

  /** Reference joint `ringtoe_01_r`. */
  export const ringtoe1: V3 = [128.78, 18.61, 185.47];

  /** Reference joint `ringtoe_02_r`. */
  export const ringtoe2: V3 = [148.11, 13.95, 192.19];

  /** Reference joint `littletoe_01_r`. */
  export const littletoe1: V3 = [117.3, 14.91, 197.92];

  /** Reference joint `littletoe_02_r`. */
  export const littletoe2: V3 = [131.85, 12.21, 201.42];

  /** The far point of the index finger's pad: the skin's farthest point along its last segment, within 6 mm of that segment's line. Its course aims at it. */
  export const indexPad: V3 = [259.84, 889.34, 462.91];

  /** The far point of the middle finger's pad: the skin's farthest point along its last segment, within 6 mm of that segment's line. Its course aims at it. */
  export const middlePad: V3 = [242.64, 871.88, 474.19];

  /** The far point of the ring finger's pad: the skin's farthest point along its last segment, within 6 mm of that segment's line. Its course aims at it. */
  export const ringPad: V3 = [209.28, 863.9, 470.71];

  /** The far point of the pinky finger's pad: the skin's farthest point along its last segment, within 6 mm of that segment's line. Its course aims at it. */
  export const pinkyPad: V3 = [180.04, 869.22, 461.63];

  /** The far point of the thumb's pad: the skin's farthest point along its last segment, within 6 mm of that segment's line. Its course aims at it. */
  export const thumbPad: V3 = [249.23, 931.95, 420.01];

  /** The far point of the big toe's pad: the skin's farthest point along its last segment, within 6 mm of that segment's line. Its course aims at it. */
  export const bigtoePad: V3 = [199.3, 12.53, 150.53];

  /** The far point of the index toe's pad: the skin's farthest point along its last segment, within 6 mm of that segment's line. Its course aims at it. */
  export const indextoePad: V3 = [192.47, 5.44, 170.29];

  /** The far point of the middle toe's pad: the skin's farthest point along its last segment, within 6 mm of that segment's line. Its course aims at it. */
  export const middletoePad: V3 = [181.06, 4.82, 183.28];

  /** The far point of the ring toe's pad: the skin's farthest point along its last segment, within 6 mm of that segment's line. Its course aims at it. */
  export const ringtoePad: V3 = [166.01, 5.01, 195.29];

  /** The far point of the little toe's pad: the skin's farthest point along its last segment, within 6 mm of that segment's line. Its course aims at it. */
  export const littletoePad: V3 = [148.69, 4.72, 202.41];

  /** Foot of the vertical axis the trunk is read about, below the crotch on the median line. */
  export const axisFloor: V3 = [0, 780, 0];

  /** Top of the trunk's axis, above the crown. */
  export const axisCrown: V3 = [0, 1705, 0];

  /** Where the leg's course ends past the ankle, in the ball of the foot. */
  export const footBall: V3 = [133, 20, 157];

  /**
   * The armpit's crease, where the arm's inner side meets the trunk's side. The armscye is the sagittal plane at its side distance: the trunk
   * owns the skin medial of that plane, the arm the rest.
   */
  export const armpit: V3 = [-25, 1276, 151];

  /**
   * Where the arm's course starts, inside the trunk beside the armscye's plane, 35 mm above the armpit's crease and midway between the
   * shoulder's fore and aft edges. The course leaves it straight to the side, so the arm's first sections lie beside that plane.
   */
  export const armRoot: V3 = [-12, 1300, 121];

  /** The corner the arm's course turns at, round the shoulder, from straight to the side to the line down to the elbow. */
  export const armTurn: V3 = [-12, 1300, 203];

  /** Where the ear's course starts, in the side of the head under the middle of the auricle's root. */
  export const earRoot: V3 = [5, 1582, 74];

  /**
   * Where the ear's course turns from straight out of the head to leaning back with the auricle's shell: the root's sections up to 78 mm out
   * stand in sagittal planes, so the root's ring holds the auricle's whole footprint, the front and the lobule included.
   */
  export const earTurn: V3 = [5, 1582, 82];

  /**
   * Where the ear's course ends, leaning back and up with the auricle's shell past the helix's back: the pole of its closed end stands on
   * the helix's back, the auricle's outermost skin.
   */
  export const earTip: V3 = [-4, 1586, 98];

  /**
   * The helix's course, along the rim's crest from the front limb over the top and down the back to the lobule. Each inner centre is the
   * crest read by `FamilyConicScan.ts helix` at 70, 90, 110, 130, 160, 200, 240 and 270 degrees round the ear's middle, sunk 1.8 mm toward
   * the head; the two ends lie inside the ear's leaf, in front under the front limb and in the lobule.
   *
   * Over the top, the crests at 70, 90 and 110 degrees are carried out from the ear's middle ([9, 1576] in the side view) by 1.3, 1.0 and
   * 1.2 mm and 0.4 to 0.5 mm farther toward the head. Read along rays from that middle (a scratch probe of the leaf with the tube merged, the
   * farthest vertex of each face within 0.6 mm of the ray), the leaf's rim reached 0.6 to 1.4 mm past the tube there, and from above its
   * rim stood behind the tube as a lip of thin facets, the slivers on `ear.high-oblique`; carried out, the tube reaches past the leaf
   * within 0.3 mm all over the top and the lip is gone.
   */
  export const helix: V3[] = [[17, 1586, 79], [16.22, 1597.45, 82.6], [6.91, 1599.3, 88.6], [-1.09, 1593.75, 93.0], [-3.8, 1584.8, 94.6], [-3.8, 1575.9, 92.6], [-0.8, 1569.2, 90.9], [2.3, 1563.8, 89.2], [7, 1555.5, 85.3], [13, 1551, 81]];

  /**
   * The scapha's course, the groove inside the helix: the helix's inner foot on the leaf's outer face, read at 110, 130, 160 and 215
   * degrees round the ear's middle ([9, 1576] in the side view; the probe as for `helix`), moved 2.3 mm toward that middle and 1.2 to 1.4 mm
   * under the face. The reference's scapha floor lies under the rim's overhang, 3 to 6 mm inside the crest (`FamilyConicEar.ts --map`).
   * It ends above the concha's cut, whose back rim runs from x 4 at 1,563 mm to x 6.4 at 1,569 mm: carried on to 1,567 mm, where the
   * helix's foot and that rim stand within a millimetre of each other, it crossed the bowl's cut and the bowl's rail was refused.
   */
  export const scapha: V3[] = [[3.63, 1590.13, 90.9], [1.52, 1584.48, 91.9], [1.57, 1578.54, 91.3], [3.43, 1572.75, 90.2]];

  /**
   * The auricle's course along its long axis, from above the helix's top through the shell's middle down to below the lobule. Each centre is
   * the middle of the shell's piece at its height, read off the reference's sections square to the course (a scratch scan): the piece at
   * 1,590 mm spans x -4 to 22 and 77 to 96 mm out, at 1,572 mm (the concha's height, where the bowl is left to the head) x -5 to 7, at
   * 1,558 mm x 2 to 7 and below it the lobule, x 11 to 21 at 1,544 mm. Every section's hull holds the course.
   */
  export const auricle: V3[] = [[9, 1606, 86], [7, 1590, 86], [2, 1572, 85], [5, 1558, 83], [15.5, 1542, 78.5], [18, 1534, 77]];

  /** Centre of the auricle's root on the sagittal plane it leaves the skull at. */
  export const earBase: V3 = [9.5, 1572, 77];

  /** Half extents of the auricle's root in height and fore and aft. */
  export const earHalf: [number, number] = [29, 10.5];

  /** Where the nose's course starts, inside the face 5 mm behind the frontal plane through the alar grooves. */
  export const noseRoot: V3 = [108, 1556, 0];

  /** Where the nose's course ends, straight forward past its tip. */
  export const noseTip: V3 = [140, 1556, 0];

  /** Where the course of the concha's bowl starts, out past the auricle over the bowl's deepest point. */
  export const conchaRoot: V3 = [16.5, 1563, 90];

  /** Where it ends, square into the head under the bowl. */
  export const conchaTip: V3 = [16.5, 1563, 60];

  /** Where the course of the trough above the concha starts, the cymba's floor behind the helix's crus. */
  export const fossaRoot: V3 = [13.5, 1574, 84];

  /** Where it ends, straight up the triangular fossa under the helix's front limb. */
  export const fossaTip: V3 = [13.5, 1594, 84];

  /**
   * Where the course of the gap under the lobule starts, below the lobule's free edge and in front of the gap's middle, in the air beside the
   * skull: the gap, read in frontal planes (`FamilyConicScan.ts lobule`), is widest at x 14 to 18 low down and narrows back and up to its apex.
   */
  export const lobuleRoot: V3 = [14, 1530, 68];

  /** Where it ends, at the apex of the gap under the lobule's attachment crease (x 6 to 8, 1,555 mm, between the skull at 65 mm and the lobule). */
  export const lobuleTip: V3 = [7.5, 1555.5, 65.5];

  /**
   * Where the breast's course starts, inside the chest 30 mm behind the dome's top along the skin's normal there: the top is the skin's
   * point farthest along that normal, and the normal the vector area of the skin within 12 mm of the top.
   */
  export const breastRoot: V3 = [97.4, 1258.41, 65.14];

  /** Where the breast's course ends, along the same normal 8 mm past the top. */
  export const breastTip: V3 = [134.64, 1261.94, 71.8];

  /** Where a nostril's course starts, below the nose under the middle of the nostril's mouth. */
  export const nostrilRoot: V3 = [127.1, 1540.4, 7.7];

  /** Where a nostril's course ends, straight up inside the nose. */
  export const nostrilTip: V3 = [119.1, 1560.4, 7.7];

  /** The point `length` millimetres past `b` on the line from `a` through `b`: where a digit's course ends beyond its last joint. */
  export function beyond(a: V3, b: V3, length: number): V3 {
    const d: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    return [b[0] + ((b[0] - a[0]) * length) / d, b[1] + ((b[1] - a[1]) * length) / d, b[2] + ((b[2] - a[2]) * length) / d];
  }

  /** The point `length` millimetres past `from` along the mean of the unit directions of `segments`: where a limb's course runs on past its knuckles toward its digits. */
  export function toward(from: V3, segments: [V3, V3][], length: number): V3 {
    const sum: number[] = [0, 0, 0];
    for (const [a, b] of segments) {
      const d: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      for (let c: number = 0; c < 3; ++c) sum[c] = sum[c]! + (b[c]! - a[c]!) / d;
    }
    const l: number = Math.hypot(sum[0]!, sum[1]!, sum[2]!);
    return [from[0] + (sum[0]! * length) / l, from[1] + (sum[1]! * length) / l, from[2] + (sum[2]! * length) / l];
  }
}
