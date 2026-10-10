/**
 * One figure instance's physical sample registration for a connected surface.
 *
 * `samples` holds one canonical sample ID per connected-surface vertex, in
 * vertex order, captured before any UV split. The region gatherer maps them
 * through the same source-to-UV table as positions, so attribute aliases of a
 * source point keep one identity. `domain` names the current figure instance
 * and registered generation (`humanPhysicalSourceDomain`), not a normal island
 * or the generation alone.
 *
 * @author Samchon
 */
export interface IHumanPhysicalSampleRegistration {
  /** Nonblank instance-and-generation domain of every sample. */
  domain: string;

  /** Non-negative safe-integer sample ID per connected-surface vertex. */
  samples: readonly number[];
}
