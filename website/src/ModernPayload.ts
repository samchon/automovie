/**
 * Erased Website payload boundary derived from the modern production's scene uploader parameter. It preserves that producer's house and inspection shape instead of authoring a second schema; the Website wrapper separately requires physical lighting.
 */
import { buildScene } from "modern-suburban-house/viewer/scene";

/**
 * Parameter type of the production's shared scene uploader; the website uses that existing contract rather than defining a parallel payload shape.
 *
 * @evidence contracts/common.md#principled-implementation TypeScript Parameters derives the accepted payload from the actual buildScene function, preserving its evolving item and lighting structure without a separate website schema.
 * @evidence contracts/common.md#clear-and-simple-design A single erased alias connects modernScene and loadTourScene to the production uploader's input owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias retains the real function contract and introduces no consumer-specific payload substitutions.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the source declaration and explains why the website derives its boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased alias runs no algorithm or validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This alias shares a type contract rather than runtime work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This alias owns no mesh, lighting or texture resources.
 */
export type ModernPayload = Parameters<typeof buildScene>[0];
