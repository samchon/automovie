import type { IHumanFaceOpticalAssembly } from "../anatomy/eye/structures/IHumanFaceOpticalAssembly";
import type { IHumanFaceNativePose } from "./IHumanFaceNativePose";

/** Source reference and its optical support, completed at the assembly's existing stage boundary.
 *
 * @author Samchon
 */
export interface IHumanFaceReferencePreparation {
  /** Independent optics with the exact rest exterior used by source attachment metrics. */
  optics?: IHumanFaceOpticalAssembly[];

  /** Owned shape-only arrays after lid seating and before persistent skin relief. */
  shaped?: IHumanFaceNativePose["shaped"];

  /** Same shape-only skin after lid seating, retained before persistent relief for material-guide registration. */
  materialReference?: ReadonlyMap<string, readonly number[]>;

  /** Apply persistent relief and final source replay once, returning owned head-frame metre arrays. */
  complete(): Map<string, number[]> | undefined;
}
