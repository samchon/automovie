import type { IHumanSourcePublishedBodyVertex } from "./IHumanSourcePublishedBodyVertex.ts";
import type { IHumanSourceSampleVertex } from "./IHumanSourceSampleVertex.ts";

/**
 * Where one named skin point of the body view comes from: a vertex of the
 * published body basis (carried by its exact source twin) or a source sample
 * of the generation's skin directly.
 *
 * @author Samchon
 */
export interface IHumanSourceSkinLandmarkSource {
  /** The landmark name the body view declares. */
  name: string;

  /** The vertex the point is read from. */
  from: IHumanSourcePublishedBodyVertex | IHumanSourceSampleVertex;
}
