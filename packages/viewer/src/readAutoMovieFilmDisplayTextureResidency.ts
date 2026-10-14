import type * as THREE from "three";

import {AutoMovieFadeCompositorState} from "./AutoMovieFadeCompositorState.js";
import {AutoMovieDissolveCompositorState} from "./AutoMovieDissolveCompositorState.js";

/**
 * Current renderer-owned beauty compositor storage for render-budget hosts.
 *
 * Only acquired lifetimes appear. Each row bounds its three RGBA8/no-mipmap display copies; source sampling state or scene assets do not change that extent. Successful release removes its row; a failed terminal compositor remains reachable through its renderer key with the retained extent and original failure. These rows bound retained copy extents and do not prove freed native bytes. Returned records are owned copies.
 *
 * @evidence contracts/common.md#principled-implementation Reads the renderer-keyed fade/dissolve owners and copies each current width/height/copies3 extent, including failed terminal owners still retained by their state maps.
 * @evidence contracts/common.md#clear-and-simple-design This metadata projection follows existing compositor ownership and leaves draw, resize and disposal behavior with those owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed disposal is not treated as freed storage: its extent remains reachable with the original cause until the renderer key is unreachable; reported rows are potential copy bounds rather than actual GLuint or freed-byte proof.
 * @evidence contracts/common.md#meaningful-documentation Documents actual acquired lifetimes, three RGBA8/no-mipmap copies, success-only row removal and failure retention.
 * @evidence contracts/performance.md#efficient-algorithms Two WeakMap lookups and at most two fixed-size copied rows are constant work independent of scene and pixel population.
 * @evidence contracts/performance.md#reuse-equivalent-work Only actual per-renderer owner state is reused; querying does not create an unused compositor or infer storage from arbitrary source sampling settings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned rows are owned scalar copies and acquire no resource; the renderer-keyed compositor owns retained copies and sticky failure, and successful owner disposal removes its map entry.
 */
export const readAutoMovieFilmDisplayTextureResidency: (renderer: THREE.WebGLRenderer) => Array<{owner:"film-fade"|"film-dissolve";width:number;height:number;copies:3}>=(renderer:THREE.WebGLRenderer):Array<{owner:"film-fade"|"film-dissolve";width:number;height:number;copies:3}>=>{
  const rows:Array<{owner:"film-fade"|"film-dissolve";width:number;height:number;copies:3}>=[];
  const fade: ReturnType<typeof AutoMovieFadeCompositorState.get>=AutoMovieFadeCompositorState.get(renderer);
  const dissolve: ReturnType<typeof AutoMovieDissolveCompositorState.get>=AutoMovieDissolveCompositorState.get(renderer);
  if(fade!==undefined)rows.push({owner:"film-fade",...fade.describeTextureResidency()});
  if(dissolve!==undefined)rows.push({owner:"film-dissolve",...dissolve.describeTextureResidency()});
  return rows;
};
