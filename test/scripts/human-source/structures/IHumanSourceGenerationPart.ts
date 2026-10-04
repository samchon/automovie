import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceGenerationPartBinding } from "./IHumanSourceGenerationPartBinding.ts";

/**
 * An attached face part of the generation, stored whole so the generation is
 * self-contained.
 *
 * `surface` is the published part with its face-channel rows; face endpoints
 * that now alias a body macro are removed from it, as from the skin.
 * `bodyTargets` holds one row set per body endpoint, keyed by the body
 * endpoint and indexed by part vertex, in the neutral face frame relative to
 * the head anchor exactly like the skin's head-only rows: the evaluator applies
 * them with the body's own endpoint state. They are regenerated from the skin
 * through `binding`, so a body control moves the part with the head it
 * reshapes.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationPart {
  id: string;
  basis: string;
  basisSha256: string;
  vertices: number;
  endpoints: number;
  provenance: string;
  surface: IAutoMovieHumanFaceBasis["surfaces"][number];
  binding: IHumanSourceGenerationPartBinding | null;
  bodyTargets: Record<string, number[]>;
}
