/** Source-family nasal normal-cone fit in native Blender XYZ. It supplies a
 * projected-contour chart, not a physiological or clinical nasal axis.
 * @author Samchon
 */
export interface IHumanSourceNasalAxis {
  side: "left" | "right";
  outwardAxisBlender: number[];
}
