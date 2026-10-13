

/**
 * A point of a plan polygon in world X/Z metres.
 *
 * @evidence spaces/site/00-access.md House and site use one world plan frame for their extents.
 * @evidence spaces/site/00-access.md#site-access-interface The site assembles the house and exterior zones in the inherited coordinate frame.
 * @evidence principles/core/source-units.md#source-scope-preservation The point is supplied by a design owner, not chosen by this helper.
 * @evidence principles/core/source-units.md#source-substantive-completion Both plan axes are present for closed surface rings.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface keeps house and exterior-zone coordinates in the common frame from settings/00-production.md#coordinate-units; IPlanPoint passes caller-supplied world X/Z metres without borrowing one building's bounds.
 *
 *
 * @author Samchon
 */
export interface IPlanPoint {
  /**
 * @evidence spaces/site/00-access.md World X places a plan point across the site.
 * @evidence principles/core/source-units.md#source-scope-preservation This is the caller's authored X value.
 * @evidence principles/core/source-units.md#source-substantive-completion A horizontal coordinate is available to polygon builders.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface assembles house and exterior zones in the common world frame, whose +X points toward the garage in coordinate-units; x retains the caller's value on that axis.
 */
  x: number;

  /**
 * @evidence spaces/site/00-access.md World Z places a plan point toward or away from the street.
 * @evidence principles/core/source-units.md#source-scope-preservation This is the caller's authored Z value.
 * @evidence principles/core/source-units.md#source-substantive-completion A depth coordinate is available to polygon builders.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface uses the common world frame for building and paving, whose +Z points to the front walk and -Z to the garden in coordinate-units; z retains the caller's depth on that axis.
 */
  z: number;
}
