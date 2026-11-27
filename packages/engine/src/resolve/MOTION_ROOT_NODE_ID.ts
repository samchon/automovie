/**
 * The synthetic node above a lowered bone hierarchy that carries the motion's
 * root transform. `"root"` is not a humanoid bone name (the closed
 * `AutoMovieHumanoidBone` union has no such member), so it can never collide
 * with a lowered bone node id.
 */
export const MOTION_ROOT_NODE_ID = "root";
