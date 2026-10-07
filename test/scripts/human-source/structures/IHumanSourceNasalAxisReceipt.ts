import type { IHumanSourceNasalAxis } from "./IHumanSourceNasalAxis.ts";

/** Frozen source projection normals and their acquisition qualification.
 * @author Samchon
 */
export interface IHumanSourceNasalAxisReceipt {
  axes: IHumanSourceNasalAxis[];
  qualification: string;
}
