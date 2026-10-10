import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";

/**
 * A derived metric target and the contact it is walked against.
 *
 * Interpolation can give a strand a length different from its regional
 * length; the integrator and the curve start then walk that length against
 * this contact instead of deriving their own.
 *
 * @author Samchon
 */
export interface IHumanFaceHairMetric {
  /** Target curve length in metres. */
  length: number;

  /** Contact the length is walked against. */
  contact: IHumanFaceHairContact;
}
