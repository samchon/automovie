import { IAutoMovieBuiltEnvironment, IAutoMoviePropBox, IAutoMovieVector3 } from "@automovie/interface";
import { builtEnvironmentContainsPoint } from "../architecture/builtEnvironmentContainsPoint";
import { builtSpaceStatesVolume } from "../architecture/builtSpaceStatesVolume";

/**
 * Whether a world volume lies inside a logical space or any space below it.
 *
 * A space whose subtree states no volume at all locates nothing, so it excludes
 * nothing and the answer is `true`: a purely semantic container ("the west
 * wing") is a name, not a boundary, and refusing props inside it would invent a
 * geometric claim the author never made. Throws when the space is not declared,
 * exactly as {@link builtEnvironmentContainsPoint} does.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance propSpaceContainsBounds checks that the entire staged use volume remains within the addressed logical-space subtree.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement propSpaceContainsBounds realizes furnishing placement clearance: Whether a world volume lies inside a logical space or any space below it. A space whose subtree states no volume at all locates nothing, so it excludes nothing and the answer is `true`: a purely semantic container ("the west wing") is a name, not a boundary, and refusing props inside it would invent a geometric claim the author never made. Throws when the space is not declared, exactly as {@link builtEnvironmentContainsPoint} does.
 */
export const propSpaceContainsBounds = (props: {
  environment: IAutoMovieBuiltEnvironment;
  space: string;
  bounds: IAutoMoviePropBox;
}): boolean => {
  const inside = boxCorners(props.bounds).map((point) =>
    builtEnvironmentContainsPoint(props.environment, props.space, point),
  );
  const included = descendantSpaces(props.environment, props.space);
  const locates = props.environment.spaces.some(
    (space) => included.has(space.id) && builtSpaceStatesVolume(space),
  );
  if (!locates) return true;
  return inside.every((value) => value);
};

/** Every logical space at or below `root`, by declared parent links. */
const descendantSpaces = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
): Set<string> => {
  const included = new Set([root]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const space of environment.spaces)
      if (
        space.parent !== null &&
        included.has(space.parent) &&
        !included.has(space.id)
      ) {
        included.add(space.id);
        changed = true;
      }
  }
  return included;
};

const boxCorners = (box: IAutoMoviePropBox): IAutoMovieVector3[] =>
  [box.min.x, box.max.x].flatMap((x) =>
    [box.min.y, box.max.y].flatMap((y) =>
      [box.min.z, box.max.z].map((z) => ({ x, y, z })),
    ),
  );
