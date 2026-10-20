import {
  IAutoMovieBuiltElement,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { IAutoMovieDrawingDesignIndex } from "./IAutoMovieDrawingDesignIndex";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { transformAutoMovieDrawingTriangles } from "./transformAutoMovieDrawingTriangles";

/**
 * World triangles of an element's model, or of a chosen subset of its parts.
 *
 * Each part's model-frame tessellation comes from the index's memo and is
 * placed by the element's world matrix, so the result stands where the staged
 * scene puts the element. The caller resolves `model` from the element first,
 * because a missing model is a gap only the caller can word.
 *
 * @param design Index of the design the element belongs to.
 * @param element Element whose world matrix places the model.
 * @param model The element's environment-owned model.
 * @param parts Parts to include; every part of the model when omitted.
 * @returns New world triangles in metres, part by part in the given order.
 *
 * @evidence contracts/common.md#principled-implementation Places memoized model-frame triangles by the element's world matrix, which is the same composition the renderer stages, so the drawing reads the geometry the scene shows.
 * @evidence contracts/common.md#clear-and-simple-design The single placement step that line drafting, opening fills and feature resolution share, separate from model lookup because each caller reports a missing model differently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No element or part is special-cased; part selection is the caller's explicit argument rather than a filter hidden here.
 * @evidence contracts/common.md#meaningful-documentation The comment states the frames, where tessellation comes from, why the model is resolved by the caller, the part default and the output order.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the selected parts' triangle count: one concatenation and one transform per triangle, with tessellation reused from the index.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses each part's tessellation through `design.partTriangles`, keyed by part identity within one derivation; the world placement is not cached because each element has its own matrix.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a fresh array owned by the caller; the concatenated model-frame list is a temporary.
 */
export const autoMovieDrawingElementTriangles = (
  design: IAutoMovieDrawingDesignIndex,
  element: IAutoMovieBuiltElement,
  model: IAutoMovieModel,
  parts: readonly IAutoMovieModelPart[] = model.parts,
): IAutoMovieDrawingTriangle[] =>
  transformAutoMovieDrawingTriangles(
    design.matrices.get(element.id)!,
    parts.flatMap(
      (part: IAutoMovieModelPart): readonly IAutoMovieDrawingTriangle[] =>
        design.partTriangles(model, part),
    ),
  );
