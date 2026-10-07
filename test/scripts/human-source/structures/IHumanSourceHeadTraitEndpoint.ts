/** Actual paired dimensional endpoint files in the provider native frame.
 * @author Samchon
 */
export interface IHumanSourceHeadTraitEndpoint {
  direction: "positive" | "negative";
  difference: number;
  positions: string;
  positionsSha256: string;
  joints: string;
  jointsSha256: string;
}
