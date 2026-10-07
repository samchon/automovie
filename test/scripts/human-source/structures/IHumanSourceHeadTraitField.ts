import type { AutoMovieHumanPersonHeadShapeField } from "@automovie/human/human/structures/AutoMovieHumanPersonHeadShapeField";

import type { IHumanSourceHeadTraitEndpoint } from "./IHumanSourceHeadTraitEndpoint.ts";

/** One explicitly sampled anatomical source difference and its qualification.
 * @author Samchon
 */
export interface IHumanSourceHeadTraitField {
  id: AutoMovieHumanPersonHeadShapeField;
  unit: "mm" | "degree";
  samplingDifference: number;
  supportQualification: string;
  endpoints: IHumanSourceHeadTraitEndpoint[];
}
