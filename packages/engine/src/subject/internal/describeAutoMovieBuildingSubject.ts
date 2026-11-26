import {
  IAutoMovieBuildingUnit,
  IAutoMovieBuiltEnvironment,
  IAutoMovieSubjectBox,
  IAutoMovieSubjectDescription,
} from "@automovie/interface";

import { builtInstanceSetPlacementBounds } from "../../architecture/builtInstanceSetPlacementBounds";
import { builtSpaceSubtree } from "../../architecture/builtSpaceSubtree";
import { unionSubjectBoxes } from "../../film/unionSubjectBoxes";
import { autoMovieSubjectAddress } from "./autoMovieSubjectAddress";
import { autoMovieSubjectMemberSummary } from "./autoMovieSubjectMemberSummary";

/**
 * Describe one building unit of a built environment as a subject.
 *
 * The unit's content box, in world metres, unions the part boxes of every
 * element its root element owns at any depth, because a room-by-room union
 * would leave out the envelope that makes a building readable from outside, and
 * the placement bounds of every population in its root space or below, because
 * a unit whose only content is a population would otherwise measure nothing. A
 * transform-only element contributes no box, and the content is null when
 * nothing contributes. Its members are the two roots a walk starts from, the
 * root element and the root space. It has no owner, model, transform or
 * materials.
 *
 * @param environment Environment the unit belongs to.
 * @param building Unit to describe.
 * @param boxes Part boxes of every drawn element of `environment` by element
 *   id, as `builtEnvironmentPartBoxes` returns them.
 * @param revision Revision of the artifact being described.
 * @param memberOffset Rank of the first member to name, a whole number from 0.
 * @returns The unit's description.
 */
export const describeAutoMovieBuildingSubject = (
  environment: IAutoMovieBuiltEnvironment,
  building: IAutoMovieBuildingUnit,
  boxes: ReadonlyMap<string, readonly IAutoMovieSubjectBox[]>,
  revision: string,
  memberOffset: number,
): IAutoMovieSubjectDescription => {
  const children: Map<string, string[]> = new Map();
  for (const element of environment.elements) {
    if (element.parent === null) continue;
    const siblings: string[] | undefined = children.get(element.parent);
    if (siblings === undefined) children.set(element.parent, [element.id]);
    else siblings.push(element.id);
  }
  const content: IAutoMovieSubjectBox[] = [];
  const owned: Set<string> = new Set([building.element]);
  const queue: string[] = [building.element];
  for (let index: number = 0; index < queue.length; ++index) {
    for (const box of boxes.get(queue[index]!) ?? []) content.push(box);
    for (const child of children.get(queue[index]!) ?? [])
      if (!owned.has(child)) {
        owned.add(child);
        queue.push(child);
      }
  }
  const rooms: Set<string> = builtSpaceSubtree(
    environment.spaces,
    building.space,
  );
  for (const population of environment.populations ?? [])
    if (rooms.has(population.space))
      content.push(
        builtInstanceSetPlacementBounds(
          population.set,
          population.prototypeBounds,
        ),
      );
  const address: string = autoMovieSubjectAddress(
    "building",
    environment.id,
    building.id,
  );
  return {
    version: 1,
    revision,
    id: address,
    kind: "building",
    semanticKind: "building",
    name: building.id,
    prototype: null,
    placement: address,
    owner: null,
    model: null,
    space: null,
    transform: null,
    bounds: {
      declared: null,
      content: unionSubjectBoxes(content),
      coordinateSpace: "world",
    },
    materials: [],
    members: autoMovieSubjectMemberSummary(
      [
        autoMovieSubjectAddress(
          "element",
          `${environment.id}/${building.element}`,
        ),
        autoMovieSubjectAddress("space", environment.id, building.space),
      ],
      memberOffset,
    ),
  };
};
