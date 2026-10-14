import * as THREE from "three";

/**
 * The deterministic flat color of mask index `i`: golden-angle hue stepping, full saturation, mid lightness. Adjacent nodes land far apart on the hue wheel, and the same scene always gets the same colors.
 *
 * @evidence contracts/common.md#principled-implementation Uses the existing conventional golden-angle hue step with full saturation and mid lightness to deterministically distinguish traversal mask indices.
 * @evidence contracts/common.md#clear-and-simple-design The colour helper owns index-to-colour conversion while scene traversal and semantic identity remain with mask consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 137.508-degree constant is a conventional visual palette choice, not anatomical data, and nearby hue separation does not certify unique 24-bit colour codes for unbounded indices.
 * @evidence contracts/common.md#meaningful-documentation Documentation states deterministic hue stepping and palette purpose rather than interpreting the colour as a physical material measurement.
 * @evidence contracts/performance.md#efficient-algorithms One modular hue calculation and Three colour conversion require fixed work and one Color allocation per supported index.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal indices compute equal colours but mutable Color instances are fresh, so one caller cannot mutate a shared palette result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned Color is caller-owned, contains no GPU texture/program and this helper retains no palette cache.
 */
export const maskColor: (index: number) => THREE.Color = (
  index: number,
): THREE.Color =>
  new THREE.Color().setHSL(((index * 137.508) % 360) / 360, 1, 0.5);
