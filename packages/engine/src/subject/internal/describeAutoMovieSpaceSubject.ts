import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieSubjectDescription,
} from "@automovie/interface";

import { builtConvexCellVertices } from "../../architecture/builtConvexCellVertices";
import { builtEnvironmentSpaceContentBounds } from "../../architecture/builtEnvironmentSpaceContentBounds";
import { builtPointBounds } from "../../architecture/builtPointBounds";
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
