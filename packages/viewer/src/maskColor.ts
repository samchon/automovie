import * as THREE from "three";

/**
 * The deterministic flat color of mask index `i`: golden-angle hue stepping,
 * full saturation, mid lightness. Adjacent nodes land far apart on the hue
 * wheel, and the same scene always gets the same colors.
 */
export const maskColor = (index: number): THREE.Color =>
  new THREE.Color().setHSL(((index * 137.508) % 360) / 360, 1, 0.5);
