/**
 * An explicit clinical rotation order for one bone-local joint basis.
 *
 * Flexion turns about the proximal axis, abduction turns about the floating
 * axis, and twist turns about the moved bone's distal axis. This follows the
 * relative axis order in the ISB hip joint coordinate recommendation
 * (https://www.isbweb.org/standards/hip.pdf). Directions, handedness and units
 * still come from the rig's basis and angle contract.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three axes in order, their moving frames and the source of the convention.
 * @evidence contracts/development/design.md#principled-representation A literal selects one supported composition of the three clinical angles about the rig's validated directions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The joint-axis record carries the order for the engine's composers, inverse readers and prepared rigs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Omission preserves the two existing placement orders. Validation refuses conflicting proximal placement and unknown order values.
 */
export type AutoMovieJointRotationOrder = "flexion-abduction-twist";
