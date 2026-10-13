

/**
 * A point of a wall outline: u along the wall axis, y the world height.
 *
 * @evidence spaces/07-boundary-assembly.md Cut wall panels retain their planar boundary trace.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions The trace supports continuous room corners and door heads.
 * @evidence principles/core/source-units.md#source-scope-preservation Coordinates describe the caller's wall only.
 * @evidence principles/core/source-units.md#source-substantive-completion Both running distance and height locate each outline vertex.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership fixes the partition's full height, interior-boundary-junctions fixes its door cuts, and exterior-boundary-junctions carries sloped wall contacts; IWallPoint records their run and height vertices.
 *
 *
 * @author Samchon
 */
export interface IWallPoint {
  /**
 * @evidence spaces/07-boundary-assembly.md This point locates a vertex along the wall run.
 * @evidence principles/core/source-units.md#source-scope-preservation The value uses the assigned wall's local running axis.
 * @evidence principles/core/source-units.md#source-substantive-completion The outline can order corners and door notches.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-building-extent and attached-garage-extent set outer wall runs, roof-mass-allocation sets the gable and ridge stations, chimney-roof-interface locates the left-wall split, and interior-boundary-junctions assigns door cuts to partition runs. u carries these outline stations; window intervals remain in IWallHole.
 */
  u: number;

  /**
 * @evidence spaces/07-boundary-assembly.md This point locates a vertex at world height.
 * @evidence principles/core/source-units.md#source-scope-preservation The height follows the assigned wall datum.
 * @evidence principles/core/source-units.md#source-substantive-completion Head, sill and top vertices are explicit.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Ground-support-handoff sets the displayed exterior wall bottom, roof-wall-head-junctions and roof-mass-allocation govern sloped wall tops, and storey-datums fixes partition levels; interior-boundary-junctions keeps room-owned door heads aligned with their partition notches. y carries those outline heights, while enclosed window heads remain in IWallHole.top.
 */
  y: number;
}
