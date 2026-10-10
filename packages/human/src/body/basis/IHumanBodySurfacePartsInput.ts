import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { createHumanBodyAppearance } from "./appearance/createHumanBodyAppearance";
import type { evaluateHumanBodyShape } from "./evaluateHumanBodyShape";
import type { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * Evaluation state of one document consumed by the existing surface/material projector. Every callback belongs to that same document and source.
 *
 * @author Samchon
 */
export interface IHumanBodySurfacePartsInput {
  /** Admitted document whose appearance and motion are evaluated. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** Shaped source skin and joint landmarks. */
  shaped: ReturnType<typeof evaluateHumanBodyShape>;

  /** Whether performed filtering, sag and relief are active. */
  posed: boolean;

  /** Existing world rest/posed frame map. */
  transforms: Parameters<typeof skinHumanBodySurface>[3];

  /** Lazily evaluate document rest once. */
  restAll: () => ReturnType<typeof evaluateHumanBodyShape>;

  /** Lazily evaluate a source surface's matching lean skin. */
  leanOf: (index: number) => number[];

  /** Existing appearance owner's evaluated site colours. */
  coloured: ReturnType<
    ReturnType<typeof createHumanBodyAppearance>
  >["coloured"];
}
