import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadNeckCurves } from "./IAutoMovieHumanHeadNeckCurves";

/**
 * The placed head layout and original lower-neck definition, with explicit closure demand and elapsed observations.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadNeckLayout in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The placed head layout and original lower-neck definition, with explicit closure demand and elapsed observations. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IOutput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IOutput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanHeadNeckLayout exchanges the named IOutput contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanHeadNeckLayout {
  /** The same placed layout and original neck declarations, with observed stage costs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The same placed layout and original neck declarations, with observed stage costs.
   * @evidence contracts/development/design.md#principled-representation `layout`: Existing head datums plus the original lower-neck curves, calibration mm. `definition`: Independently available normal source and unresolved lower-family inputs. `lowerClosure`: Successful lower closure owned by this exact definition; absent before that explicit request.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadNeckLayout.create, AutoMovieHumanHeadNeckLayout.define, AutoMovieHumanHeadNeckLayout.close. Read by AutoMovieHumanHeadCanonical.of, AutoMovieHumanHeadCanonical.prepare, AutoMovieHumanHeadNeckLayout.close. Also types AutoMovieHumanHeadCanonical.authored, AutoMovieHumanHeadPose.neck.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `lowerClosure`: Successful lower closure owned by this exact definition; absent before that explicit request.
   */
  export interface IOutput {
    /** Existing head datums plus the original lower-neck curves, calibration mm. */
    readonly layout: IAutoMovieHumanHeadLayout;

    /** Independently available normal source and unresolved lower-family inputs. */
    readonly definition: IAutoMovieHumanHeadNeckCurves.IDefinition | null;

    /** Successful lower closure owned by this exact definition; absent before that explicit request. */
    readonly lowerClosure?: {
      /** Same actual normal declaration and lower constraint inputs. */
      readonly definition: IAutoMovieHumanHeadNeckCurves.IDefinition;

      /** Identical lower source published in layout.neck.curves. */
      readonly curves: IAutoMovieHumanHeadNeckCurves.IOutput;
    };

    /** Synchronous elapsed observations, excluding later head work and lazy queries. */
    readonly milliseconds: Readonly<{
      /** Existing selected-tragion placement, elapsed ms. */
      placement: number;

      /** Complete unchanged normal/base-neck solves and source declarations, elapsed ms. */
      neckOriginal: number;

      /** Actual normal/native/base subintervals and query counts, or null without a supplied base course. */
      neckWork: Readonly<IAutoMovieHumanHeadNeckCurves.IWork> | null;
    }>;
  }
}
