/**
 * One published landmark set, carried with its origin. Face and body sets
 * name some of the same joint cubes in different published frames, so they
 * stay separate rather than being merged by name.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationLandmarks {
  origin: "face" | "body";
  ids: string[];
  positions: number[];
  targets: Record<string, number[]>;
}
