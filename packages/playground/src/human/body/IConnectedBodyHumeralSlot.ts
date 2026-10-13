import type { renderBodyHumeralHeadControls } from "./renderBodyHumeralHeadControls";

/**
 * The slot the body panel's earlier closures read the humeral-head controls through: empty until the controls mount, so a refusal or refresh before then skips them instead of reading an uninitialized binding.
 *
 * @evidence contracts/common.md#principled-implementation An optional mounted-control reference models the panel's initialization order explicitly, allowing earlier transaction closures to observe absence before humeral controls exist.
 * @evidence contracts/common.md#clear-and-simple-design The slot contains only the late-bound control handle and derives its type from the renderer, keeping initialization coordination separate from humeral measurements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The absent handle represents a real mounting phase rather than a fabricated neutral control or exception wrapper around an uninitialized binding.
 * @evidence contracts/common.md#meaningful-documentation The comment explains why earlier closures need a slot and why an omitted controls property is expected before mounting.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This optional-reference record runs no mounting, refresh or measurement algorithm and has no input-size traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The slot exposes the one mounted handle but does not compare requests or share numerical evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Control construction and retirement belong to the panel; assigning a reference here acquires no separate DOM or worker resource.
 *
 * @author Samchon
 */
export interface IConnectedBodyHumeralSlot {
  /** The mounted humeral-head controls, once mounted. */
  controls?: ReturnType<typeof renderBodyHumeralHeadControls>;
}
