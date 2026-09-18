/**
 * The synthetic node above a lowered bone hierarchy that carries the motion's
 * root transform. `"root"` is not a humanoid bone name (the closed
 * `AutoMovieHumanoidBone` union has no such member), so it can never collide
 * with a lowered bone node id.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rest-bind-deformation Reserves the node that separates motion-root state from the skeleton's rest hierarchy.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-skin-rigid-morph-deformation Defines the non-colliding root identity used to preserve the deformation basis.
 */
export const MOTION_ROOT_NODE_ID = "root";

const IDENTITY = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
