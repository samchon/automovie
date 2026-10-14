/**
 * The fixed preview envelope persisted by the numerical cache: the canonical producer's model and numerical readings. Display/reference fields are omitted from this outer envelope; shallow admission does not independently certify the content of arbitrary nested model members.
 *
 * @evidence contracts/common.md#principled-implementation Names the fixed numerical preview envelope persisted by encoder/upload/decoder with model and optional owner readings only.
 * @evidence contracts/common.md#clear-and-simple-design Separates cacheable preview fields from display/reference data and construction/export outputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shared guard requires operation preview and a non-null non-array object model; nested schema/admission is not certified by that shallow gate.
 * @evidence contracts/common.md#meaningful-documentation Documents unknown ingress fields, absent optional readings and actual guarded model requirement rather than claiming this broad interface admits itself.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no codec work; serialization/decoding scale with model values and the shared guard uses fixed envelope checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Preview equivalence still requires selected document/basis/source/AO key; matching envelope shape or object identity cannot authorize cache reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Persistence owns one active/one pending preview and full encoded payload bytes until settlement, with no byte cap; the type acquires no worker or photograph.
 *
 * @author Samchon
 */
export interface IHumanViewerPreviewProjection {
  /** Always `preview` for a cached result. */
  operation: string;

  /** Unknown ingress model; encoder/upload/decoder admission requires a non-null non-array object without certifying nested model schema. */
  model?: unknown;

  /** Face articulation reading. */
  articulation?: unknown;

  /** Face contact reading. */
  contact?: unknown;

  /** Surface crossing reading. */
  crossings?: unknown;

  /** Body extras (bones and readings). */
  extras?: unknown;

  /** Body anatomy reading. */
  anatomy?: unknown;
}
