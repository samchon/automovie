import {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
} from "@automovie/interface";

/**
 * Every texture binding one material declares, in slot order and then each overlay's colour and normal map, nulls dropped.
 *
 * @evidence contracts/common.md#principled-implementation Projects existing material slots followed by ordered overlay colour/normal bindings and drops only null/undefined absent bindings.
 * @evidence contracts/common.md#clear-and-simple-design One enumeration serves texture admission/loading without duplicating full material building or changing sampler/colour-space references.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate actual bindings preserve their positions and are not silently merged by asset text; a binding list does not certify texture bytes or decoded appearance.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies ordinary slot order, overlay order and absence filtering.
 * @evidence contracts/performance.md#efficient-algorithms Six ordinary slots plus two slots per L overlays are scanned once, costing O(L) time and result references without decoding images.
 * @evidence contracts/performance.md#reuse-equivalent-work Loading/cache owners decide equivalent assets and variants; this pure ordered projection does not reuse or coalesce texture effects itself.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned binding references borrow the material document and retain no decoded image or GPU wrapper; loaders/cache owners acquire and retire those resources.
 */
export const materialTextureBindings: (
  material: IAutoMovieMaterial,
) => AutoMovieTextureBinding[] = (
  material: IAutoMovieMaterial,
): AutoMovieTextureBinding[] =>
  [
    material.baseColorTexture,
    material.metallicRoughnessTexture,
    material.normalTexture,
    material.detailNormalTexture,
    material.occlusionTexture,
    material.emissiveTexture,
    ...(material.overlays ?? []).flatMap(
      (
        overlay: NonNullable<IAutoMovieMaterial["overlays"]>[number],
      ): (AutoMovieTextureBinding | null | undefined)[] => [
        overlay.baseColorTexture,
        overlay.normalTexture,
      ],
    ),
  ].filter(
    (
      value: AutoMovieTextureBinding | null | undefined,
    ): value is AutoMovieTextureBinding =>
      value !== null && value !== undefined,
  );
