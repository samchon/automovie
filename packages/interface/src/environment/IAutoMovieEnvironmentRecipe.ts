import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieEnvironmentItem } from "./IAutoMovieEnvironmentItem";

/** Authoring inputs for composing one prepared environment. */
export interface IAutoMovieEnvironmentRecipe {
  /** Scope id whose slash-separated segments are nonblank. */
  id: string;

  /** Optional seed used to derive stable per-occurrence seeds. */
  seed?: number;

  /** Rigid world frame for the recipe, defaulting to the identity. */
  frame?: IAutoMovieTransform;

  /**
   * Items in source enumeration order, with unique nonblank keys containing no
   * slashes.
   */
  items: Readonly<Record<string, IAutoMovieEnvironmentItem>>;
}
