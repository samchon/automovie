import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";

import type { IHumanFaceContactBounds } from "./IHumanFaceContactBounds";

/**
 * One compiled rest or performed contact sheet and its pruning bounds.
 * The engine query owns nearest features, signed distance and open-sheet rims.
 *
 * @author Samchon
 */
export interface IHumanFaceContactGeometry extends IHumanFaceContactBounds {
  /** Signed query compiled from this state's actual collider coordinates. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
}
