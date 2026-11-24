import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieFlameCue } from "../cinematics/IAutoMovieFlameCue";
import type { IAutoMovieSurfaceGraphicTrack } from "../cinematics/IAutoMovieSurfaceGraphicTrack";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieCompiledEffect } from "../production/IAutoMovieCompiledEffect";
import type { IAutoMovieCompiledFormation } from "../production/IAutoMovieCompiledFormation";
import type { IAutoMovieCompiledInstanceSet } from "../production/IAutoMovieCompiledInstanceSet";
import type { IAutoMovieScene } from "../scene/IAutoMovieScene";
import type { IAutoMovieFontSource } from "../typography/IAutoMovieFontSource";
import type { IAutoMovieRenderFilm } from "./IAutoMovieRenderFilm";
import type { IAutoMovieRenderPlanting } from "./IAutoMovieRenderPlanting";
import type { IAutoMovieRenderSoftPanel } from "./IAutoMovieRenderSoftPanel";
import type { IAutoMovieRenderTextureResidency } from "./IAutoMovieRenderTextureResidency";
import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";
import type { IAutoMovieRenderWaterBody } from "./IAutoMovieRenderWaterBody";

/**
 * Everything one drawn frame is made of, in one record.
 *
 * The semantic mask and the render inventory read the same subject, which is
 * the only reason a colour in the mask and a cost in the report can name the
 * same owner. Two functions that each reached into the compiled artifact their
 * own way would drift the first time one of them learned about a new kind of
 * drawable, and the report's owner ids would stop resolving in the mask without
 * anything going red.
 */
export interface IAutoMovieRenderSubject {
  /** Staged scene: ordinary nodes, lights, and the render environment. */
  scene: IAutoMovieScene;

  /** Every runtime model cited by a scene node or an instance prototype. */
  models: readonly IAutoMovieModel[];

  /** Structured buildings retained by the compiled shot, if any. */
  environments?: readonly IAutoMovieBuiltEnvironment[];

  /** Compact general instance runtimes placed by the production world. */
  instanceSets?: readonly IAutoMovieCompiledInstanceSet[];

  /**
   * Compact character formations drawn as camera-selected instanced batches.
   *
   * Heroes already occur as ordinary scene nodes; this list carries the
   * anonymous population that no node expansion is allowed to materialize.
   */
  formations?: readonly IAutoMovieCompiledFormation[];

  /** Bounded builder-owned particle effects drawn as instanced billboards. */
  effects?: readonly IAutoMovieCompiledEffect[];

  /**
   * Water bodies the production declares.
   *
   * A body bound to a {@link IAutoMovieRenderWaterBody.domain fluid domain} is
   * measured from that record; one carrying only hand-supplied counts is taken
   * at its word; one carrying neither makes the fluid metrics `unsupported`
   * rather than zero.
   */
  waterBodies?: readonly IAutoMovieRenderWaterBody[];

  /**
   * Cloth panels the production hangs.
   *
   * A soft-body panel is drawn geometry that no scene node holds, so a subject
   * that omitted it would report a triangle count for a room the curtain is
   * missing from. The panel's cost is a property of the domain's lattice alone
   * and needs no solve: the drawn mesh is one vertex per particle and two
   * triangles per lattice quad at every step.
   */
  softBodies?: readonly IAutoMovieRenderSoftPanel[];

  /**
   * Planting clusters the production grows.
   *
   * Like a panel, a bed of ferns is drawn geometry no scene node holds; unlike
   * a panel, its per-instance shape is chosen by the renderer, which is why the
   * batching cost is exact here and the geometry cost is only as exact as the
   * {@link IAutoMovieRenderPlanting.branch prototype cost} the caller supplies.
   */
  plantings?: readonly IAutoMovieRenderPlanting[];

  /**
   * Pictures the shot shows on `surface` affordances of placed props.
   *
   * Each track paints its whole face rectangle in the mask under
   * `surface-graphic:<node>/<surface>`, owned by `node:<node>`, whatever its
   * layers hold. Shot admission keeps one track per node and surface, so the id
   * is unique within the subject.
   */
  surfaceGraphics?: readonly IAutoMovieSurfaceGraphicTrack[];

  /**
   * Flames the shot draws. Each paints its flame mesh in the mask under
   * `flame:<node>/<id>`, owned by `node:<node>`; shot admission keeps cue ids
   * unique, so the id is unique within the subject.
   */
  flames?: readonly IAutoMovieFlameCue[];

  /** Font sources the surface graphics' text layers name; omitted means none. */
  fonts?: readonly IAutoMovieFontSource[];

  /**
   * Decoded dimensions of texture assets, when the caller knows them.
   *
   * An asset a material binds but this list omits makes `textureBytes`
   * `not-run`: an invented byte count is exactly the kind of number a budget
   * would then approve.
   */
  textures?: readonly IAutoMovieRenderTextureSource[];

  /**
   * Other live shots and retained texture storage in the same graphics context.
   * Omission describes a fresh context containing only this subject.
   */
  textureResidency?: IAutoMovieRenderTextureResidency;

  /**
   * The directly rendered film's optics and shading at its most demanding
   * second, whose film stage targets the inventory counts at the drawing
   * buffer's raster. Omitted describes a frame drawn without optics, which
   * allocates no film stage target.
   */
  film?: IAutoMovieRenderFilm;
}
