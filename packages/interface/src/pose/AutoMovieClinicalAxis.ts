/**
 * Clinical angle coordinate shared by joint poses and their rest-frame offsets.
 * Angle values are degrees; jointToQuaternionOnBasis admits finite values or
 * null and maps null to no rig rotation on that axis.
 */
export type AutoMovieClinicalAxis = "flexion" | "abduction" | "twist";
