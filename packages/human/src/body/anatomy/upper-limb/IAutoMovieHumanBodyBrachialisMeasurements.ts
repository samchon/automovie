import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Brachialis beneath biceps, crossing humerus to proximal ulna.
 *
 * It is an elbow flexor with a separate muscle belly; its volume must not be counted as biceps or inferred uniquely from relaxed upper-arm girth.
 *
 * @evidence contracts/common.md#principled-implementation Brachialis preserves independently supplied belly volume and MRI fat fraction through the shared muscle contract.
 * @evidence contracts/common.md#clear-and-simple-design Upper-arm ownership distinguishes this deep elbow flexor from biceps while common types own quantity provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Relaxed arm girth cannot uniquely infer brachialis volume or count it as biceps tissue.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies deep humerus-to-ulna ownership and the separate flexor belly.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Brachialis quantity typing computes no deep upper-arm segmentation or elbow-flexion boundary.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This deep flexor alias stores no completed brachialis anatomy result to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Brachialis inputs retain no deep tissue mesh or elbow-flexor task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyBrachialisMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
