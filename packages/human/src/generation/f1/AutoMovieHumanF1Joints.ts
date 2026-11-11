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

  /** Foot of the vertical axis the trunk is read about, below the crotch on the median line. */
  export const axisFloor: V3 = [0, 780, 0];

  /** Top of the trunk's axis, above the crown. */
  export const axisCrown: V3 = [0, 1705, 0];

  /** Where the leg's course ends past the ankle, in the ball of the foot. */
  export const footBall: V3 = [133, 20, 157];

  /** Station along the upper arm, from `upperarm` toward `lowerarm`, of the plane square to the arm through the armpit's crease: the trunk owns the skin above that plane, the arm the skin below it. */
  export const armscye: number = 67;

  /** Side distance of the armpit's crease from the median plane. */
  export const armpit: number = 151;

  /** The point `length` millimetres past `b` on the line from `a` through `b`: where a digit's course ends beyond its last joint. */
  export function beyond(a: V3, b: V3, length: number): V3 {
    const d: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    return [b[0] + ((b[0] - a[0]) * length) / d, b[1] + ((b[1] - a[1]) * length) / d, b[2] + ((b[2] - a[2]) * length) / d];
  }
}
