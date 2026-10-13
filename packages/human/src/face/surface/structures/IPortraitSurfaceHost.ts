/**
 * The final connected skin before surface detail. Positions use construction millimetres and normals are unit vectors. Bindings retain original vertex identities after subdivision, while newly inserted vertices resolve detail. The layer coordinator borrows position/index arrays and computes area normals; callback purity is required because these arrays are not runtime-frozen.
 *
 * @evidence contracts/common.md#principled-implementation One unchanged connected-skin basis gives all layer factories consistent native attachments and area-normal directions before their fields compose.
 * @evidence contracts/common.md#clear-and-simple-design The host provides geometry only; layers derive fields and their coordinator separately owns attachment masks and optional sampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readonly access is a producer purity obligation, not a runtime freeze or anatomical detail/embeddedness certificate.
 * @evidence contracts/common.md#meaningful-documentation Members specify millimetre XYZ, oriented indices and flat normal directions, with explicit borrowed-array purity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Readonly geometry fields select no normal algorithm, refinement rule or field evaluation strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shared-host layout implements no geometry cache or repeated layer-work coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration allocates no borrowed geometry or computed normal buffers; the layer coordinator owns their actual call lifetime.
 * @author Samchon
 */
export interface IPortraitSurfaceHost {
  /** Borrowed pre-layer shared skin positions; readers must not mutate them. */
  positions: readonly (readonly number[])[];

  /** Oriented shared triangle indices. */
  indices: readonly number[];

  /** Flat XYZ normal buffer over the complete shared surface. */
  normals: readonly number[];
}
