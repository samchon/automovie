import type { IAutoMovieHumanFaceOralCrownSupport } from "../../structures/IAutoMovieHumanFaceOralCrownSupport";

/**
 * Native source crown and its exact open cervical boundary. Vertex ordinals
 * retain the original dental surface identity; no clinical CEJ is inferred.
 * @author Samchon
 */
export interface IHumanFaceOralCrown {
  /** Permanent ISO quadrant/position admitted from the publisher's native crown registration. */
  id: IAutoMovieHumanFaceOralCrownSupport["id"];
  /** Original dental-surface vertex ordinals of this component, before render UV separation. */
  vertices: number[];
  /** Oriented native triangle corners in original dental-surface ordinals, not crown-local indices. */
  indices: number[];
  /** Ordered degree-two open root cycle in the same native ordinals; shared source port, not a measured clinical CEJ. */
  cervical: number[];
  /** True for mandibular source components carried by the existing jaw; false for maxillary head-owned components. */
  mandibular: boolean;
}
