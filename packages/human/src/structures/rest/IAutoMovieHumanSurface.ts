import { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";
import { IAutoMovieHumanSurfaceArm } from "./IAutoMovieHumanSurfaceArm";
import { IAutoMovieHumanSurfaceEnvelope } from "./IAutoMovieHumanSurfaceEnvelope";
import { IAutoMovieHumanSurfaceLeg } from "./IAutoMovieHumanSurfaceLeg";
import { IAutoMovieHumanSurfaceTrunk } from "./IAutoMovieHumanSurfaceTrunk";

/** Independent section measurements in a declared neutral T-rest, in millimetres. */
export interface IAutoMovieHumanSurface {
  /** Optional horizontal rest observations. */
  trunk?: IAutoMovieHumanSurfaceTrunk;

  /** Optional mid-tube dimensions, perpendicular to the common neck axis. */
  neck?: IAutoMovieHumanSurfaceEnvelope;

  /** Optional independent section dimensions in the limb measurement planes. */
  armPair?: Partial<IAutoMovieHumanPair<IAutoMovieHumanSurfaceArm>>;

  /** Optional independent section dimensions in the limb measurement planes. */
  legPair?: Partial<IAutoMovieHumanPair<IAutoMovieHumanSurfaceLeg>>;
}
