/**
 * Logical selections and material/binding ownership on original profile pieces.
 *
 * pieces names existing family charts. An omitted domain uses the retained family interval in metres; omitted or null trim selects complete referenced charts, while a trim key resolves an original-source membership function. Material and binding identities express ownership, not optical values or a guarantee that touching charts are sewn.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit piece and optional original membership references assign logical and material/binding regions without duplicating geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Profile preparation and mesh selection consume one region identity across the original source charts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Touching sheets may retain different material and binding owners; a logical name cannot create a shared physical boundary.
 * @evidence contracts/development/common.md#meaningful-documentation Defines chart references, metre domain defaults, trim absence and ownership identities.
 */
export interface IAutoMovieConstructionProfileRegion {
  /** Region identity, separate from a loop or generating stream. */
  id: string;

  /** Logical names selecting this actual source region. */
  logicalParts: string[];

  /** Existing piece identities composing the region. */
  pieces: string[];

  /** Optional active station interval, metres; omitted means the family's retained interval. */
  domain?: [number, number];

  /** Same-original region membership owner key; null or absent means the complete referenced piece charts. */
  trim?: string | null;

  /** Material chart owner; touching sheets may keep distinct references. */
  material: string;

  /** Binding field owner, shared only by an actually sewn physical boundary. */
  binding: string;
}
