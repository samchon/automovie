/**
 * Semantic surfaces emitted by the independent optical assembly.
 * The interior backing is a rendering surface and names no retinal tissue.
 *
 * @evidence contracts/common.md#principled-implementation Four semantic names identify the independent optical assembly's actual emitted surface roles.
 * @evidence contracts/common.md#clear-and-simple-design Sclera, cornea, iris and aperture backing remain distinct from tissue/anatomical generation owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts ApertureBacking names a rendering surface and cannot imply retinal tissue or a physiological optical simulation.
 * @evidence contracts/common.md#meaningful-documentation The introduction states independent assembly ownership and the interior backing's limited interpretation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms AutoMovieHumanFaceOpticalSurface is an erased TypeScript contract and performs no geometry or numeric algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work AutoMovieHumanFaceOpticalSurface declares source inputs/results; concrete producing/consuming operations own copying and equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources AutoMovieHumanFaceOpticalSurface acquires no runtime task, state or handle; actual array and callback lifetimes stay with their owners.
 */
export type AutoMovieHumanFaceOpticalSurface =
  | "sclera"
  | "cornea"
  | "iris"
  | "apertureBacking";
