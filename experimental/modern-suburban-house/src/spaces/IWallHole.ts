

/**
 * A rectangular void cut through a wall panel, in the panel's (u, y).
 *
 * @evidence spaces/06-openings.md Door and window sites are actual wall voids before model fills.
 * @evidence spaces/06-openings.md#external-opening-interface Exterior openings keep their structural host distinct from door/window models.
 * @evidence principles/core/source-units.md#source-scope-preservation This record cuts the assigned wall only and does not supply a model leaf.
 * @evidence principles/core/source-units.md#source-substantive-completion Id and four bounds locate a real rectangular cut.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface assigns the rough door/window cut to its wall source and leaves frames/leaves to models; IWallHole carries only that four-bound wall cut.
 *
 *
 * @author Samchon
 */
export interface IWallHole {
  /**
 * @evidence spaces/06-openings.md The opening retains one house-wide id shared by its wall and room bindings.
 * @evidence principles/core/source-units.md#source-scope-preservation This names a void, not its later model fill.
 * @evidence principles/core/source-units.md#source-substantive-completion The environment can connect a compiled opening to its cut.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The entry plan names front-door and garage-front-opening names garage-front-door; id preserves those authored addresses through wall and environment assembly.
 */
  id: string;

  /**
 * @evidence spaces/06-openings.md The void starts at a position along its host wall.
 * @evidence principles/core/source-units.md#source-scope-preservation The start lies in the existing wall coordinate frame.
 * @evidence principles/core/source-units.md#source-substantive-completion The left edge participates in a measurable opening width.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes the garage door's left X=6.10 and entry-plan fixes the entry door's left X=0.40; from carries each caller's first running coordinate into its host cut.
 */
  from: number;

  /**
 * @evidence spaces/06-openings.md The void ends at a position along its host wall.
 * @evidence principles/core/source-units.md#source-scope-preservation The end remains within the assigned wall run.
 * @evidence principles/core/source-units.md#source-substantive-completion Together with from, it fixes the cut width.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes the garage door's right X=11.10 and entry-plan fixes the entry door's right X=1.40; to carries each caller's second running coordinate into its host cut.
 */
  to: number;

  /**
 * @evidence spaces/06-openings.md The opening has a sill or threshold height.
 * @evidence principles/core/source-units.md#source-scope-preservation The lower edge describes a wall cut, not a separate threshold object.
 * @evidence principles/core/source-units.md#source-substantive-completion A floor-reaching opening can become a true bottom notch.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Ground-threshold-junctions extends floor-reaching door voids into their base while living-front-window fixes its own sill above the floor; bottom carries that opening-specific lower edge.
 */
  bottom: number;

  /**
 * @evidence spaces/06-openings.md The opening has an explicit head height.
 * @evidence principles/core/source-units.md#source-scope-preservation The top edge belongs to the host wall cut.
 * @evidence principles/core/source-units.md#source-substantive-completion Header clearance can be checked against the wall top.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes its door head Y=2.15 and living-front-window fixes its window head; top carries each host's upper cut limit.
 */
  top: number;
}
