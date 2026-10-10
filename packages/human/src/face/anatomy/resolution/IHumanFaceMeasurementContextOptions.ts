import type { IHumanFaceBrowAssembly } from "../brow/IHumanFaceBrowAssembly";
import type { IHumanFaceOpticalAssembly } from "../eye/structures/IHumanFaceOpticalAssembly";
import type { IHumanFaceLashRow } from "../lash/structures/IHumanFaceLashRow";
import type { IHumanFaceOralMeasurementRegistration } from "../oral/IHumanFaceOralMeasurementRegistration";

/**
 * Other actual geometry states consumed by one face measurement context.
 * Independent optics share the performed build; reference positions are the
 * source owner's evaluated shape-only state, never the basis neutral table.
 *
 * @author Samchon
 */
export interface IHumanFaceMeasurementContextOptions {
  /** Independent optical surfaces evaluated with this performed build. */
  optics?: readonly IHumanFaceOpticalAssembly[];

  /** Evaluated source shape-only coordinates of the same identity. */
  reference?: ReadonlyMap<string, readonly number[]>;

  /** Actual emitted shaft rows, including deliberate empty populations. */
  lashes?: readonly IHumanFaceLashRow[];

  /** Actual oral correspondence; absent native crowns never supply point readings. */
  oral?: IHumanFaceOralMeasurementRegistration;

  /** Actual generated brows replace card vertices; old card metrics cannot remain current. */
  brows?: Pick<IHumanFaceBrowAssembly, "replacements">;
}
