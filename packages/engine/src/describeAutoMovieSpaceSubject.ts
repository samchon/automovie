import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieSubjectDescription,
} from "@automovie/interface";

import { builtConvexCellVertices } from "./architecture/builtConvexCellVertices";
import { builtEnvironmentSpaceContentBounds } from "./architecture/builtEnvironmentSpaceContentBounds";
import { builtPointBounds } from "./architecture/builtPointBounds";
import { autoMovieSubjectAddress } from "./autoMovieSubjectAddress";
import { autoMovieSubjectMemberSummary } from "./autoMovieSubjectMemberSummary";

/**
 * Describe one logical space of a built environment as a subject.
 *
 * The space is owned by its parent space and has no model, transform or
 * materials. Its members are its child spaces, the elements assigned to it and
 * the populations placed in it, paged from `memberOffset`. Two boxes are
 * reported in world metres: `declared`, the bounds of the volume the space
 * states, from its shell vertices or the corners of its convex cells by
 * `builtConvexCellVertices`, or null when it states none; and `content`, where
 * its staged content stands, from `builtEnvironmentSpaceContentBounds`.
 *
 * @param environment Environment the space belongs to.
 * @param space Space to describe.
 * @param revision Revision of the artifact being described.
 * @param memberOffset Rank of the first member to name, a whole number from 0.
 * @returns The space's description.
 *
 * @evidence contracts/common.md#principled-implementation The declared box is the bounds of the stated volume's vertices, exact for a shell and for a bounded convex cell whose corners `builtConvexCellVertices` solves from plane triples, and the content box is delegated to the engine's content query so description and framing agree on where a room's content stands.
 * @evidence contracts/common.md#clear-and-simple-design One owner for a space subject, read by the subject describer for both single and inventory description, and it reuses the shared cell-corner solver instead of the private plane intersection the describers each kept.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No space kind is special-cased; a space that states no volume reports a null declared box rather than a guessed one.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the owner, the empty fields, the member classes and paging, and the meaning, source and units of both boxes.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the environment's spaces, elements and populations for the members, O(p³) per cell of p planes for the corner solve, and one staging of the environment inside the content query, which that query performs per call.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Describes one space per call; the describer calls it once per space, and the content query restages the environment each time because it takes no precomputed staging.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a new description the caller owns; the member list and cell corners are released on return.
 */
export const describeAutoMovieSpaceSubject = (
  environment: IAutoMovieBuiltEnvironment,
  space: IAutoMovieBuiltSpace,
  revision: string,
  memberOffset: number,
): IAutoMovieSubjectDescription => {
  const address: string = autoMovieSubjectAddress(
    "space",
    environment.id,
    space.id,
  );
  const members: string[] = [];
  for (const child of environment.spaces)
    if (child.parent === space.id)
      members.push(autoMovieSubjectAddress("space", environment.id, child.id));
  for (const element of environment.elements)
    if (element.space === space.id)
      members.push(
        autoMovieSubjectAddress("element", `${environment.id}/${element.id}`),
      );
  for (const population of environment.populations ?? [])
    if (population.space === space.id)
      members.push(autoMovieSubjectAddress("instance-set", population.set.id));
  return {
    version: 1,
    revision,
    id: address,
    kind: "space",
    semanticKind: space.kind,
    name: space.id,
    prototype: null,
    placement: address,
    owner:
      space.parent === null
        ? null
        : autoMovieSubjectAddress("space", environment.id, space.parent),
    model: null,
    space: null,
    transform: null,
    bounds: {
      declared: builtPointBounds(
        space.shell !== undefined
          ? space.shell.vertices
          : space.cells.flatMap(builtConvexCellVertices),
      ),
      content: builtEnvironmentSpaceContentBounds(environment, space.id),
      coordinateSpace: "world",
    },
    materials: [],
    members: autoMovieSubjectMemberSummary(members, memberOffset),
  };
};
