import type { IAutoMovieHumanPersonBandAttachment } from "./IAutoMovieHumanPersonBandAttachment";

/**
 * Source face target/corrective rows and attachment fields continued onto body-partition neck-band vertices. Packed target rows are [bodyVertex,dx,dy,dz] in shared source metres, excluding canonical shared samples whose absolute fields already exist on both halves. Attachments carry dimensionless gains through their canonical schema. Head-side body effects separately use endpoint drivers; no duplicate head band field is stored here.
 *
 * The band-view compiler selects touching body triangles and readdresses source rows for face evaluation, then the forming owner transports actual band displacement through body skinning. Producer owns resident row ordering/support and source anatomical qualification; this carrier does not enforce them or guarantee field continuity/global geometry.
 *
 * @evidence contracts/common.md#principled-implementation Explicit body source rows let one face field/attachment definition continue across the source partition without independent reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design Target row dictionary and canonical attachment list separate displacement and articulation while transient view/rig transport remain concrete owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared samples do not receive duplicated band rows, head effects stay in registered drivers, and typed row arrays alone cannot invent resident source support or clinical continuity.
 * @evidence contracts/common.md#meaningful-documentation Prose states packed stride, metre/dimensionless domains, source ownership and transient remapping/transport boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This source row schema runs no band selection, remapping or skinning; compiler/face/forming owners perform those traversals.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared field registration is correspondence rather than an evaluated-band cache implemented here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring band rows acquires no mesh task or renderer; actual producer/compiled source contexts own row storage and lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationBand {
  /** Face endpoint rows on body vertices. */
  bodyFaceTargets: Record<string, number[]>;

  /** Face attachment fields continued onto body vertices. */
  bodyAttachments: IAutoMovieHumanPersonBandAttachment[];
}
