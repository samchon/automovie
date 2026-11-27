import {
  IAutoMovieBuiltElement,
  type IAutoMovieDrawingDesignIndex,
  type IAutoMovieDrawingTriangle,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { transformAutoMovieDrawingTriangles } from "./transformAutoMovieDrawingTriangles";

/*
 * World triangles of an element's model, or of a chosen subset of its parts.
 *
 * Each part's model-frame tessellation comes from the index's memo and is
 * placed by the element's world matrix, so the result stands where the staged
 * scene puts the element. The caller resolves `model` from the element first,
 * because a missing model is a gap only the caller can word.
 * Parameter design: Index of the design the element belongs to.
 * Parameter element: Element whose world matrix places the model.
 * Parameter model: The element's environment-owned model.
 * Parameter parts: Parts to include; every part of the model when omitted.
 * Returns: New world triangles in metres, part by part in the given order.
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
