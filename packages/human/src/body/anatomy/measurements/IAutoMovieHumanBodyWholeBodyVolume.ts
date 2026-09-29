import type { IAutoMovieHumanBodyMeasuredVolume } from "./IAutoMovieHumanBodyMeasuredVolume";

/**
 * Target whole-body tissue volume or tomography with complete body coverage.
 *
 * An L3 slice, abdomen-only CT or limb MRI is not a whole-body volume even
 * when it contains the same tissue label. The scanner record must declare
 * full anatomical coverage; runtime acquisition validation must verify it.
 * @author Samchon
 */
export type IAutoMovieHumanBodyWholeBodyVolume =
  | { readonly kind: "target"; readonly millilitres: number }
  | (IAutoMovieHumanBodyMeasuredVolume & {
      readonly coverage: "whole-body";
    });
