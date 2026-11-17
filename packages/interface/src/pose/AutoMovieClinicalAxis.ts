/**
 * Clinical angle coordinate shared by joint poses and their rest-frame offsets.
 * Angle values are degrees; jointToQuaternionOnBasis admits finite values or
 * null and maps null to no rig rotation on that axis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the clinical coordinate vocabulary and its angle consumer.
 * @evidence contracts/development/design.md#principled-representation The closed union permits exactly the three coordinates accepted by joint articulation and rest frames; numeric admission belongs to jointToQuaternionOnBasis.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the common axis keys used by jointToQuaternion and jointToQuaternionOnBasis.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Coordinate names are independent of bone identity and contain no implementation or platform dependency.
 */
export type AutoMovieClinicalAxis = "flexion" | "abduction" | "twist";
