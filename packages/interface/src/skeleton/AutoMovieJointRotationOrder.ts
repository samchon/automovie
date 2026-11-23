/**
 * An explicit clinical rotation order for one bone-local joint basis.
 *
 * Flexion turns about the proximal axis, abduction turns about the floating
 * axis, and twist turns about the moved bone's distal axis. This follows the
 * relative axis order in the ISB hip joint coordinate recommendation
 * (https://www.isbweb.org/standards/hip.pdf). Directions, handedness and units
 * still come from the rig's basis and angle contract.
 */
export type AutoMovieJointRotationOrder = "flexion-abduction-twist";
