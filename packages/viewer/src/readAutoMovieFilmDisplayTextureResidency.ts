import type * as THREE from "three";

import {AutoMovieFadeCompositorState} from "./AutoMovieFadeCompositorState.js";
import {AutoMovieDissolveCompositorState} from "./AutoMovieDissolveCompositorState.js";

/**
 * Current renderer-owned beauty compositor storage for render-budget hosts.
 *
 * Only acquired lifetimes appear. Each row bounds its three RGBA8/no-mipmap
 * display copies; source sampling state or scene assets do not change that
 * extent. A released lifetime disappears immediately, including a release
 * whose resource listener fails. Returned records are owned copies.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Reports the live display-copy closure separately from authored texture assets.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Exposes current renderer-owned display storage for host preflight accounting.
 */
export const readAutoMovieFilmDisplayTextureResidency=(renderer:THREE.WebGLRenderer):Array<{owner:"film-fade"|"film-dissolve";width:number;height:number;copies:3}>=>{
  const rows:Array<{owner:"film-fade"|"film-dissolve";width:number;height:number;copies:3}>=[];
  const fade=AutoMovieFadeCompositorState.get(renderer);
  const dissolve=AutoMovieDissolveCompositorState.get(renderer);
  if(fade!==undefined)rows.push({owner:"film-fade",...fade.describeTextureResidency()});
  if(dissolve!==undefined)rows.push({owner:"film-dissolve",...dissolve.describeTextureResidency()});
  return rows;
};
