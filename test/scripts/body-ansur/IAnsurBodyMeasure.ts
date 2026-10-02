/**
 * One rest-body instrument compared with one ANSUR II survey column.
 *
 * The registry owns protocol interpretation; the census reads the named
 * instrument in metres and converts it to millimetres before its formatter
 * reports residuals. This descriptor changes neither the body nor the survey.
 * @author Samchon
 */
export interface IAnsurBodyMeasure {
  /** Report name, distinct from the survey column and body channel identity. */
  name: string;

  /** Named rest-body channel or rig-landmark height above the lowest skin. */
  read:
    | { kind: "channel"; id: string }
    | { kind: "landmarkHeight"; landmark: string };

  /** Lower-cased ANSUR II column whose lengths are millimetres. */
  column: string;

  /**
   * Whether anatomical site, plane, side and acquisition posture agree.
   * Comparable anatomical purpose alone is insufficient. Even an identical
   * protocol leaves individual variation and measurement uncertainty in a
   * residual; a nonzero difference alone does not prove an anatomical defect.
   */
  sameDefinition: boolean;

  /** The checked agreement or difference, with the survey's conditions. */
  reason: string;
}
