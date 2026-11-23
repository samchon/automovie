import type { IAutoMovieFilmDisplayTextureResidency } from "@automovie/interface";
import type * as THREE from "three";

import { AutoMovieDissolveCompositorState } from "./AutoMovieDissolveCompositorState.js";
import { AutoMovieFadeCompositorState } from "./AutoMovieFadeCompositorState.js";

/**
 * Current renderer-owned beauty compositor storage for render-budget hosts.
 *
 * Only acquired lifetimes appear. Each row bounds its three RGBA8/no-mipmap
 * display copies; source sampling state or scene assets do not change that
 * extent. Successful release removes its row; a failed terminal compositor
 * remains reachable through its renderer key with the retained extent and
 * original failure. These rows bound retained copy extents and do not prove
 * freed native bytes. Returned records are owned copies.
 */
export const readAutoMovieFilmDisplayTextureResidency: (
  renderer: THREE.WebGLRenderer,
) => Array<IAutoMovieFilmDisplayTextureResidency> = (
  renderer: THREE.WebGLRenderer,
): Array<IAutoMovieFilmDisplayTextureResidency> => {
  const rows: Array<{
    owner: "film-fade" | "film-dissolve";
    width: number;
    height: number;
    copies: 3;
  }> = [];
  const fade: ReturnType<typeof AutoMovieFadeCompositorState.get> =
    AutoMovieFadeCompositorState.get(renderer);
  const dissolve: ReturnType<typeof AutoMovieDissolveCompositorState.get> =
    AutoMovieDissolveCompositorState.get(renderer);
  if (fade !== undefined)
    rows.push({ owner: "film-fade", ...fade.describeTextureResidency() });
  if (dissolve !== undefined)
    rows.push({
      owner: "film-dissolve",
      ...dissolve.describeTextureResidency(),
    });
  return rows;
};
