/** One driving side of a combination corrective, as published. */
export interface IHumanSourceGenerationCorrectiveInput {
  channel: string;
  side: "positive" | "negative";
  peak?: number;
  between?: [number, number];
}
