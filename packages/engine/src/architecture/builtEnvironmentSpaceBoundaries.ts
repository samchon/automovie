import { IAutoMovieBuiltBoundary, IAutoMovieBuiltEnvironment, IAutoMovieBuiltPopulation } from "@automovie/interface";

/**
 * Return every boundary that encloses or separates a logical space.
 *
 * {@link builtEnvironmentAdjacentSpaces} already walks these records, and keeps
 * only the far-side space ids. That answers which rooms are next to this one and
 * discards what stands between them — the boundary's identity, its `kind`, and
 * the elements realizing it — so the one record able to state "this room's
 * ceiling is that slab" had no reader. The same pairing
 * {@link builtEnvironmentSpaceConnectors} makes for traversal is the pairing
 * enclosure was missing: adjacency answers which spaces are joined, this answers
 * with what.
 *
 * That absence is not theoretical. On two authored buildings every floor slab
 * was assigned to a storey rather than to the rooms it covers, which is what the
 * record asks for — a slab between two storeys belongs to neither room alone,
 * and {@link IAutoMovieBuiltPopulation.space} states that a room's contents are
 * what stands in it and not what covers it. Every rule involved behaved as
 * designed, and a reviewer still could not ask either building what enclosed a
 * room, so a room whose ceiling was owned elsewhere on purpose read exactly like
 * a room with no ceiling at all.
 *
 * Matched exactly rather than through containment, which is the rule
 * {@link builtEnvironmentAdjacentSpaces} and {@link builtEnvironmentSpaceConnectors}
 * already follow: asking a storey returns the storey's own enclosure and not
 * every partition standing inside its rooms. Boundaries are handed back whole,
 * because `kind` is the part that distinguishes a ceiling from a wall and
 * `elements` is the part that says whether anything visible realizes it — a
 * boundary with an empty `elements` is a separation the design declares and
 * nothing builds, and reducing these to ids would hide both facts.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtEnvironmentSpaceBoundaries` returns every boundary enclosing or separating a logical space, so the authored enclosure of a room stays reviewable rather than being reachable only as an anonymous adjacency.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtEnvironmentSpaceBoundaries` collects the boundaries a logical space is named on within one building-interior boundary, preserving each boundary's kind and realizing elements.
 * @author Samchon
 */
export const builtEnvironmentSpaceBoundaries = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieBuiltBoundary[] => {
  requireSpace(environment, spaceId);
  return environment.boundaries.filter((boundary) =>
    boundary.spaces.includes(spaceId),
  );
};
