import type {
  IAutoMovieCompiledFormation,
  IAutoMovieFormationSlotMotion,
  IAutoMovieQuaternion,
} from "@automovie/interface";

/** Formation and banner inputs for the existing compiled shot scenarios.
 *
 * @author Samchon
 */
export interface IGeometryFormationTestCompiledShotProps {
  /** Shot identity, also used to name its compiled scene. */
  id: string;

  /** Current materialized formation, or an intentionally absent runtime. */
  runtime: IAutoMovieCompiledFormation | null;

  /** Camera quaternion; omission keeps the camera facing the unit. */
  cameraRotation?: IAutoMovieQuaternion;

  /** Selected camera identity; omission selects the authored camera. */
  cameraId?: string;

  /** Banner representation; omission keeps its static node. */
  banner?: "static" | "performed" | "absent";

  /** Authored per slot motions; omission keeps all slots present. */
  slotMotions?: IAutoMovieFormationSlotMotion[];
}
