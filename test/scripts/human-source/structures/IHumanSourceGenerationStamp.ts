/**
 * A derivative's dependency on this generation: what it is, which basis it
 * was authored on, and whether it is carried by an exact vertex map,
 * regenerated here, or stale until its producer runs on this generation.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationStamp {
  derivative: string;
  authoredOn: string;
  status: "carried-by-map" | "regenerated" | "stale";
  note: string;
}
