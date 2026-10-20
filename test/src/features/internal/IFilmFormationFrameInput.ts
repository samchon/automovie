/**
 * The formation-framing unit's optional node/formation ids and static/follow choice. Its authored group lists isolate node, compact formation and union extents; the owning entry supplies the layout arithmetic and cued/uncued expectations, and this fixture type proves no camera result itself.
 */
export interface IFilmFormationFrameInput {
  /** Staged node ids, defaulting to an empty list in the frame constructor. */
  nodes?: string[];

  /** Compact formation ids; absence omits the formation subject field. */
  formations?: string[];

  /** Camera move, defaulting to static in the frame constructor. */
  move?: "static" | "follow";
}
