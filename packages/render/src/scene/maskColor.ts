import * as THREE from "three";

/**
 * The deterministic flat color of mask index `i`: golden-angle hue stepping, full saturation, mid lightness. Adjacent nodes land far apart on the hue wheel, and the same scene always gets the same colors.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Uses the existing conventional golden-angle hue step with full saturation and mid lightness to deterministically distinguish traversal mask indices.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The colour helper owns index-to-colour conversion while scene traversal and semantic identity remain with mask consumers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 137.508-degree constant is a conventional visual palette choice, not anatomical data, and nearby hue separation does not certify unique 24-bit colour codes for unbounded indices.
 * @evidence contracts/development/common.md#meaningful-documentation Documentation states deterministic hue stepping and palette purpose rather than interpreting the colour as a physical material measurement.
 * @evidence contracts/development/implementation.md#efficient-algorithms One modular hue calculation and Three colour conversion require fixed work and one Color allocation per supported index.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Equal indices compute equal colours but mutable Color instances are fresh, so one caller cannot mutate a shared palette result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned Color is caller-owned, contains no GPU texture/program and this helper retains no palette cache.
 */
export const maskColor: (index: number) => THREE.Color = (
  index: number,
): THREE.Color =>
  new THREE.Color().setHSL(((index * 137.508) % 360) / 360, 1, 0.5);
