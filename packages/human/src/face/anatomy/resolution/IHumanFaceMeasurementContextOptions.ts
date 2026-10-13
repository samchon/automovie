import type { IHumanFaceBrowAssembly } from "../brow/IHumanFaceBrowAssembly";
import type { IHumanFaceOpticalAssembly } from "../eye/structures/IHumanFaceOpticalAssembly";
import type { IHumanFaceLashRow } from "../lash/structures/IHumanFaceLashRow";
import type { IHumanFaceOralMeasurementRegistration } from "../oral/IHumanFaceOralMeasurementRegistration";

/**
 * Other actual geometry states consumed by one face measurement context. Independent optics share the performed build; reference positions are the source owner's evaluated shape-only state, never the basis neutral table.
 *
 * @evidence contracts/common.md#principled-implementation Actual optics, shaft rows, brow replacements, oral correspondence and evaluated shape-only reference qualify one current build.
 * @evidence contracts/common.md#clear-and-simple-design Optional consumers remain distinct from basis-neutral geometry or source-card stand-ins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent generated instruments are not reconstructed from legacy cards and absent crowns stay unavailable in reference reads.
 * @evidence contracts/common.md#meaningful-documentation Every supplied geometry state must belong to the same performed identity/head frame.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Context construction and concrete instruments own array copying/traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same actual state is shared across independent measurement callbacks instead of regenerated per instrument.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns mesh/maps and context closures borrow the options for their lifetime without a second geometry cache.
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
