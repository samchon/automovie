import type { IAutoMovieTransform } from "@automovie/interface";

/**
 * The one shared mutable identity TRS used by the existing building and scene fixtures.
 *
 * @evidence contracts/testing.md#behavioral-verification Building elements, scene nodes and both lights refer to this same object, preserving the original fixture aliasing observed by production consumers.
 * @evidence contracts/testing.md#independent-expectations Zero translation, the unit identity quaternion and unit scale independently define an unchanged local frame; this object is not a measured engine result.
 * @evidence contracts/testing.md#distinguishing-cases Sharing remains deliberate across returned fixture calls, so callers needing isolated transform mutation must replace their field; no clone, freeze or reset was added by the split.
 * @evidence contracts/testing.md#execution-ownership One module-owned numerical object reused by existing test inputs, with no case registration or physical resource lifetime.
 */
export const renderFixtureIdentity: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
