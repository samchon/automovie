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

  /**
   * The helix's course, along the rim's crest from the front limb over the top and down the back to the lobule. Each inner centre is the
   * crest read by `FamilyConicScan.ts helix` at 70, 90, 110, 130, 160, 200, 240 and 270 degrees round the ear's middle, sunk 1.8 mm toward
   * the head; the two ends lie inside the ear's plate, in front under the front limb and in the lobule.
   *
   * Over the top, the crests at 70, 90 and 110 degrees are carried out from the ear's middle ([9, 1576] in the side view) by 1.3, 1.0 and
   * 1.2 mm and 0.4 to 0.5 mm farther toward the head. Read along rays from that middle (a scratch probe of the leaf with the tube merged, the
   * farthest vertex of each face within 0.6 mm of the ray), the leaf's rim reached 0.6 to 1.4 mm past the tube there, and from above its
   * rim stood behind the tube as a lip of thin facets, the slivers on `ear.high-oblique`; carried out, the tube reaches past the leaf
   * within 0.3 mm all over the top and the lip is gone.
   *
   * On the plate (`plate`) the front limb and the top stood 1.3 to 5.7 mm outside the plate's face (a scratch probe, the signed distance from
   * the course to the plate every millimetre), so the tube hung free over the top with a gap under it and its front end was a capped tube
   * in the air. The two top centres are moved 1.2 mm toward the plate's nearest point, so the tube crosses the plate along the top; the
   * front limb is sunk 2 mm and carried on down the helix's crus into the head, its first centre [16, 1578, 72] under the crus's skin,
   * so its front end is buried in the head. Its lower limb from 1,570 to 1,555 mm stands 1 mm farther out, clear of the antihelix (below).
   */
  export const helix: V3[] = [[16, 1578, 72], [17, 1586, 77], [15.61, 1596.61, 82.01], [6.56, 1598.26, 88.17], [-1.09, 1593.75, 93.0], [-3.8, 1584.8, 94.6], [-3.8, 1575.9, 92.6], [-0.8, 1569.2, 91.9], [2.3, 1563.8, 90.2], [7, 1555.5, 86.3], [13, 1551, 81]];

  /**
   * The ear's plate's course, along the auricle's long axis from below the lobule to above the helix's top, through the middle of the plate's
   * lens at each station: the lens is the auricle's cranial skin and the floor of its hollows, read off the reference's sections square
   * to the course (`FamilyConicBody.ts plate --kernels`, which also gives each lens's centroid in its chart). Laid through those centroids
   * where it can be, with the turn at 1,566 mm 2 mm farther back than they stand, since there the lens is 4 mm thin and the course fell
   * on its floor, and its last leg aimed 5 mm behind the top lenses' centroids: on the leg through them (to [13, 1600, 80.5]) the planes
   * leaned 30 degrees forward and three of them cut the helix's front limb with the plate, a lens three times as long. The last centre
   * stands under the helix's top (its course 88.6 mm out at 1,599.3 mm), so the plate's top cap closes into the tube: ended at
   * [8, 1602, 80.5] the cap closed 8 mm inside the tube's line and its square end showed under the helix's arch (`ear.left`). Every
   * section holds the course.
   */
  export const plate: V3[] = [[22.5, 1538, 69.8], [16, 1550, 72], [-1, 1566, 77.5], [1.5, 1580, 79.5], [7.5, 1605, 87]];

  /**
   * The antihelix's course, along its crest from its lower end at the antitragus up its body and on along its superior crus to the
   * helix's top. Each centre is a crest read by `FamilyConicScan.ts helix 79 7 ridges` (side distance over the auricle's least-squares plane
   * `z = 26.36 - 0.651 x + 0.041 y`, from the concha's middle [13, 1568] and the fossa's [9, 1587]), sunk 2.2 mm, the tube's radius, along
   * that plane's normal `(0.545, -0.034, 0.838)` toward the head, so the tube's top stands on the crest. The upper end stops 3 mm short
   * of the crest's last reading, sunk 1.5 mm more, inside the plate and more than 2.5 mm clear of the helix's tube and blend: carried into
   * the helix's tube, the antihelix's merge curve crossed the helix's blend and no rail stood beside it, so the two tubes' blends must not
   * meet. The lower two are sunk 2 and 1.5 mm more: measured against the plate (a scratch probe, the signed distance from the course to
   * the plate's surface every millimetre), the course runs 0 to 1.2 mm outside the plate's face along the body and 0.1 mm inside it at its
   * lower end, where the merge's walk was lost; sunk, the end stands 2 mm inside. Measured along both whole courses (a scratch probe), the
   * antihelix's body overlapped the helix's lower limb by up to 0.7 mm at 1,563 to 1,570 mm and stood within 2.5 mm of it from 1,561 to
   * 1,577 mm, so their blends met: the lower four centres stand 2 mm farther in along the plate and the helix's lower limb 1 mm farther
   * out, the antihelix 1.5 mm and the helix's limb 2 mm round there, and the two tubes stay at least 2.95 mm apart everywhere.
   */
  export const antihelix: V3[] = [[6.2, 1559.8, 76.9], [6.3, 1562.6, 80.2], [4.6, 1568.1, 85.8], [3.4, 1574.6, 86.8], [3.2, 1582.1, 87.7], [4.8, 1588.1, 85.0], [4.6, 1590.0, 83.4]];

  /** Where the nose's course starts, inside the face 5 mm behind the frontal plane through the alar grooves. */
  export const noseRoot: V3 = [108, 1556, 0];

  /** Where the nose's course ends, straight forward past its tip. */
  export const noseTip: V3 = [140, 1556, 0];

  /**
   * Where the course of the concha's bowl starts, over the bowl's deepest point, 6 mm deeper than read off the leaf: the cutter stood
   * 6 mm shallower than the reference's floor and closed in a rounded cap at 71 mm (EA2), and its walls met the head only inside that cap,
   * where no seed is sought (a scratch probe along its four quarter lines).
   */
  export const conchaRoot: V3 = [16.5, 1563, 84];

  /** Where it ends, square into the head under the bowl. */
  export const conchaTip: V3 = [16.5, 1563, 54];

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
