# src/geometry/IAutoMovieQuaternion.ts#IAutoMovieQuaternion

## @evidence contracts/development/design.md#principled-representation

A unit quaternion represents rotation and composes by the Hamilton product in glTF component order. validateTransformScalars checks finite components and norm within 1e-6 for consumers that apply that gate; direct numerical helper calls still carry their own admitted-input premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four plain numbers in the order glTF and `three.js` store, so the engine, viewer and imported clips exchange rotations without reordering or a wrapper class.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Transform validation refuses out-of-domain rotations without repairing them and does not promise automatic normalization for admitted values. Quaternion.normalize's zero-input identity is its explicit degeneracy convention, while direct multiplication, vector rotation and matrix composition retain their stated unit-input premises.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes semantic joint authoring from direct quaternion placement, identifies conversion readers, gives component and multiplication order, validation tolerance, explicit normalization behavior and sign ambiguity; members identify each component.
