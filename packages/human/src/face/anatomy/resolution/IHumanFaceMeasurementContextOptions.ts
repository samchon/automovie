import type { IHumanFaceBrowAssembly } from "../brow/IHumanFaceBrowAssembly";
import type { IHumanFaceOpticalAssembly } from "../eye/structures/IHumanFaceOpticalAssembly";
import type { IHumanFaceLashRow } from "../lash/structures/IHumanFaceLashRow";
import type { IHumanFaceOralMeasurementRegistration } from "../oral/IHumanFaceOralMeasurementRegistration";

/**
 * Other actual geometry states consumed by one face measurement context.
 * Independent optics share the performed build; reference positions are the
 * source owner's evaluated shape-only state, never the basis neutral table.
 *
 * @evidence contracts/common.md#principled-implementation Paired measurement states preserve their actual evaluated identity and coordinate frame.
 * @evidence contracts/common.md#clear-and-simple-design One named options record carries generated optics and the homologous reference state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing reference is replaced with neutral source positions.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the performed optical surfaces and shape-only reference.
 * @evidence contracts/modeling.md#spatial-conventions All inputs are canonical head-frame metre coordinates; the context supplies Float32 readings.
 * @evidenceExclude contracts/anatomy.md#anatomical-source State transport introduces no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Stage owners admit the states.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring control.
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
