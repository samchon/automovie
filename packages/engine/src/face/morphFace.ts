import { IAutoMovieFace, IAutoMovieFaceTemplate } from "@automovie/interface";

import { flattenFace } from "./flattenFace";

/**
 * Apply an {@link IAutoMovieFace}'s parameter weights to a face template, the
 * deterministic core of the face editor.
 *
 * Plain linear blendshape math, `positions + Σ weight·delta`, evaluated by the
 * engine so every renderer and every run produces identical vertices from the
 * same document. The result is a new flat position array the length of the
 * template's; the template is not modified. The face is assumed validated
 * (`validateFace`); structural mismatches against the _template_ are not a
 * validation concern but a broken asset, so they throw: a present trait
 * without a matching target, or a target whose delta length disagrees with
 * the template.
 *
 * @evidence contracts/common.md#principled-implementation Linear blendshape composition: each trait from `flattenFace` adds `weight * delta[i]` to every component in trait order, which is the standard morph-target model glTF defines and is exact up to floating-point summation order, fixed here by the projection's order.
 * @evidence contracts/common.md#clear-and-simple-design Reads traits through `flattenFace`, the same mapping `validateFace` uses, so morphing owns only the arithmetic and the asset consistency checks; the template type is imported from `@automovie/interface`, its owner, without an engine re-export.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing target or a length mismatch throws instead of being skipped or truncated, so a broken asset never yields a partially morphed face; weights are not re-clamped because range checking belongs to `validateFace`.
 * @evidence contracts/common.md#meaningful-documentation States the formula, that the result is a new array and the template is untouched, the validation precondition, and both asset failures that throw.
 * @evidence contracts/performance.md#efficient-algorithms `O(V + T * V)` for V position components and T present traits: one copy of the positions and one fused multiply-add pass per trait, with no intermediate arrays.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of the template and document per call; the face editor calls it once per edit, and no morphed result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates one output array of the template's length, owned by the caller, plus the small trait list released on return; it keeps no reference to the template.
 * @author Samchon
 */
export const morphFace = (props: {
  template: IAutoMovieFaceTemplate;
  face: IAutoMovieFace;
}): number[] => {
  const out: number[] = props.template.positions.slice();
  for (const { parameter, weight } of flattenFace(props.face)) {
    const delta: readonly number[] | undefined =
      props.template.targets[parameter];
    if (delta === undefined)
      throw new Error(`face template has no morph target "${parameter}"`);
    if (delta.length !== out.length)
      throw new Error(
        `morph target "${parameter}" has ${delta.length} components, expected ${out.length}`,
      );
    for (let i: number = 0; i < out.length; i++) out[i] += weight * delta[i];
  }
  return out;
};
