import { IAutoMovieModel } from "@automovie/interface";

import { IAutoMoviePrimitivePropProps } from "./IAutoMoviePrimitivePropProps";

/**
 * Produce the catalogue's static prop: one skeletonless model group of a single primitive part.
 *
 * The part is centred on the model root with no bone and no local transform. Shape dimensions pass through unchanged; engine model admission owns their positivity and finiteness, as it does for any authored primitive.
 *
 * @param props Id, primitive shape and the material the part wears.
 * @returns A fresh generated model with no skeleton, one part named `primitive`, and `props.material` as its only material.
 * @throws Error naming the correction when the id is blank.
 *
 * @evidence contracts/common.md#principled-implementation The typed shape union already selects the primitive and its dimensions, so the producer copies the shape into one unskinned part instead of decoding a string-keyed parameter map.
 * @evidence contracts/common.md#clear-and-simple-design One producer returns the whole `IAutoMovieModel` group films reference, with no registry, parameter plan or materializer between the author and the prop.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dimension domains are left to engine model admission rather than restated here, and no shape or id is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the single-part layout, the unbound root placement, who admits dimensions, material adoption and the blank-id refusal.
 * @evidence contracts/performance.md#efficient-algorithms Constant work: one shape copy, one part and one model record per call.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call must hand its caller an unshared mutable model, so equal props are rebuilt rather than served from a cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The producer retains nothing; the returned model, which references the caller's material record, transfers to the caller at return.
 * @author Samchon
 */
export const createAutoMoviePrimitiveProp: (
  props: IAutoMoviePrimitivePropProps,
) => IAutoMovieModel = (
  props: IAutoMoviePrimitivePropProps,
): IAutoMovieModel => {
  if (props.id.trim().length === 0)
    throw new Error(
      "A primitive prop model id must contain non-whitespace text. Give the prop the id its scene nodes cite.",
    );
  return {
    id: props.id,
    name: null,
    origin: "generated",
    parts: [
      {
        id: "primitive",
        name: "primitive",
        geometry: { type: "primitive", shape: { ...props.shape } },
        material: props.material.id,
        attachedBone: null,
        transform: null,
      },
    ],
    skeleton: null,
    body: null,
    materials: [props.material],
    asset: null,
  };
};
