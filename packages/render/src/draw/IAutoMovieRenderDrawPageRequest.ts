import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawCall,
} from "@automovie/interface";

import type { AutoMovieRenderDrawGlobals } from "./AutoMovieRenderDrawGlobals.js";

/**
 * One request a draw session hands the page's installed draw function, named by
 * `kind` so the page's task and a recording double each read the request it is
 * without inspecting its shape. `name` is the global the draw function is
 * installed under.
 */
export type IAutoMovieRenderDrawPageRequest =
  | IAutoMovieRenderDrawPageRequest.IDescribe
  | IAutoMovieRenderDrawPageRequest.ISpeak
  | IAutoMovieRenderDrawPageRequest.IDraw;

export namespace IAutoMovieRenderDrawPageRequest {
  /** Describe the page's subject and renderer. */
  export interface IDescribe {
    /** The request's kind. */
    kind: "describe";

    /** The draw function's global name. */
    name: typeof AutoMovieRenderDrawGlobals.draw;
  }

  /** Hand the subject the film's dialogue mouths. */
  export interface ISpeak {
    /** The request's kind. */
    kind: "speak";

    /** The draw function's global name. */
    name: typeof AutoMovieRenderDrawGlobals.draw;

    /** The mouths over the film. */
    track: IAutoMovieDialogueMouthTrack;
  }

  /** Draw one call. */
  export interface IDraw {
    /** The request's kind. */
    kind: "draw";

    /** The draw function's global name. */
    name: typeof AutoMovieRenderDrawGlobals.draw;

    /** The call to draw. */
    call: IAutoMovieDrawCall;
  }
}
