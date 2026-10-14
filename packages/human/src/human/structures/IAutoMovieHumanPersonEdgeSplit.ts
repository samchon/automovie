/**
 * One directed triangle edge's actual boundary subdivision: resident mesh from/to indices and inserted boundary indices ordered along that direction. These are render-mesh indices, not canonical source IDs or coordinate-derived lineage. The stitch owner constructs/refuses actual insertions and validates local triangle orientation; this carrier adds no global manifold/clearance proof.
 *
 * @evidence contracts/common.md#principled-implementation Explicit resident endpoint direction and ordered inserted indices preserve the stitch producer's actual edge subdivision.
 * @evidence contracts/common.md#clear-and-simple-design Three index fields expose local split incidence while source identity, interpolation and geometry admission remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inserted render indices do not invent physical source registration or certify global surface embedding.
 * @evidence contracts/common.md#meaningful-documentation Prose states render-index domain, directed order and local/global qualification boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This split record performs no boundary search or subdivision; stitch consumers execute the operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sharing edge splits across incident triangles is producer behavior rather than caching in this schema.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no mesh or task; actual producer/caller values own inserted-index array retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonEdgeSplit {
  /** Mesh vertex the directed edge leaves. */
  from: number;

  /** Mesh vertex the directed edge reaches. */
  to: number;

  /** Inserted boundary vertices, ordered from `from` to `to`. */
  added: number[];
}
