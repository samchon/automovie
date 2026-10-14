import type { IHumanFaceContactColliderState } from "./IHumanFaceContactColliderState";

/**
 * Original query witness retained while a soft vertex's candidate is verified.
 * Losing the sheet's readable side still requires the existing Lipschitz proof.
 *
 * @evidence contracts/common.md#principled-implementation The original signed reading and capped rest floor retain their exact collider identity for candidate-query and distance-Lipschitz verification.
 * @evidence contracts/common.md#clear-and-simple-design One witness keeps scalar requirements with the same collider instead of reconstructing floors after moving a vertex.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Losing readable reach/rim side needs the original outside-distance proof; failed verification cannot silently discard this constraint or certify whole-surface validity.
 * @evidence contracts/common.md#meaningful-documentation Members give original performed distance, rest floor and metre/collider provenance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record implements no verification; resolveHumanFaceContact owns query and travel checks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no requests; direct correction and neighbour spread reuse original witnesses.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; invocation-owned witness maps release their collider references after contact.
 *
 * @author Samchon
 */
export interface IHumanFaceContactWitness {
  /** The same collider whose original signed query supplied this witness. */
  collider: IHumanFaceContactColliderState;

  /** Retained rest-clearance floor, metres. */
  floor: number;

  /** Signed distance at the original performed vertex, metres. */
  signed: number;
}
