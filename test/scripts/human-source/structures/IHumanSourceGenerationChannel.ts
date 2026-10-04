/**
 * One shape or expression control of the generation, with the published
 * basis it came from. Endpoint names address `targets`; ranges are the
 * published authoring envelopes, not anatomical ranges.
 */
export interface IHumanSourceGenerationChannel {
  id: string;
  origin: "face" | "body";
  kind: "shape" | "expression";
  minimum: number;
  maximum: number;
  positive: string;
  negative: string | null;
  group: string | null;
  mirror: string | null;
  description: string | null;
}
