import * as THREE from "three";

/**
 * The deterministic flat color of mask index `i`: golden-angle hue stepping,
 * full saturation, mid lightness. Adjacent nodes land far apart on the hue
 * wheel, and the same scene always gets the same colors.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Keeps this surface explicit about beauty versus structural output.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that distinction as a reversible render-product pass.
 */
export const maskColor = (index: number): THREE.Color =>
  new THREE.Color().setHSL(((index * 137.508) % 360) / 360, 1, 0.5);
