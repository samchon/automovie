/**
 * Logical selections and material/binding ownership on original profile pieces.
 *
 * Pieces names existing family charts. An omitted domain uses the retained
 * family interval in metres; omitted or null trim selects complete referenced
 * charts, while a trim key resolves an original-source membership function.
 * Material and binding identities express ownership, not optical values or a
 * guarantee that touching charts are sewn.
 */
export interface IAutoMovieConstructionProfileRegion {
  /** Region identity, separate from a loop or generating stream. */
  id: string;

  /** Logical names selecting this actual source region. */
  logicalParts: string[];

  /** Existing piece identities composing the region. */
  pieces: string[];

  /**
   * Optional active station interval, metres; omitted means the family's
   * retained interval.
   */
  domain?: [number, number];

  /**
   * Same-original region membership owner key; null or absent means the
   * complete referenced piece charts.
   */
  trim?: string | null;

  /** Material chart owner; touching sheets may keep distinct references. */
  material: string;

  /** Binding field owner, shared only by an actually sewn physical boundary. */
  binding: string;
}
