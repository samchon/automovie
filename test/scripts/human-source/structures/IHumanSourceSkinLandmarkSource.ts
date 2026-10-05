import type { IHumanSourcePublishedBodyVertex } from "./IHumanSourcePublishedBodyVertex.ts";
import type { IHumanSourceSampleVertex } from "./IHumanSourceSampleVertex.ts";

/**
 * Where one named skin point of the body view comes from, with what it
 * means: a vertex of the published body basis (carried by its exact source
 * twin) or a source sample of the generation's skin, read on the right and
 * mirrored when it has a left twin.
 *
 * @author Samchon
 */
export interface IHumanSourceSkinLandmarkSource {
  /** The landmark name the body view declares. */
  name: string;

  /** The vertex the point is read from. */
  from: IHumanSourcePublishedBodyVertex | IHumanSourceSampleVertex;

  /** Name of the left twin built as this point's exact mirror, if any. */
  mirror?: string;

  /** The anatomical definition. */
  definition: string;

  /** The definition of the left twin, when the source definition names the right side. */
  mirrorDefinition?: string;

  /** Source of the definition. */
  citation: string;

  /** How the vertex was determined. */
  status: "carried from the published body" | "definition, read from renders" | "named approximation";

  /** Neighbouring samples the reading compared, nearest alternative first. */
  neighbours: number[];

  /** What the fixed vertex cannot follow and any reading limit. */
  limit: string;

  /** The named ambiguity of the reading (which alternative positions the evidence leaves open, and why), or null when the reading has none beyond the limit. */
  ambiguity: string | null;
}
