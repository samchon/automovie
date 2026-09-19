import { AutoMovieBuiltPlacementBodyLocator, IAutoMovieBuiltEnvironment, IAutoMovieBuiltPlacementBounds, IAutoMovieBuiltPlacementOverlapResult, IAutoMovieVector3 } from "@automovie/interface";
import { propBoundsOverlap } from "../film/propBoundsOverlap";
import { builtEnvironmentElementPartBounds } from "./builtEnvironmentElementPartBounds";
import { builtEnvironmentPlacementBounds } from "./builtEnvironmentPlacementBounds";

/** Whether any part of one body shares positive volume with any part of another. */
const partsMeet = (
  left: readonly IWorldBox[],
  right: readonly IWorldBox[],
): boolean =>
  left.some((leftPart) =>
    right.some((rightPart) => propBoundsOverlap(leftPart, rightPart)),
  );

/**
 * The boxes a locator's body actually fills, one per drawn part where it has
 * them and the reported box otherwise.
 *
 * An element resolves to its parts, because a multi-part body's union box is
 * mostly air and a test written against it answers about the box rather than
 * the body. Every other locator has no part structure to consult and keeps the
 * one box it reports, and so does an element that draws nothing.
 *
 * The parts arrive through `lookup` rather than from a fixed source, because
 * one caller asks about a single pair and another has already resolved the whole
 * building. The rule about what to do with the answer is the same either way,
 * and writing it twice is how the two stop agreeing.
 */
const solidBoxes = (
  locator: AutoMovieBuiltPlacementBodyLocator,
  reported: IAutoMovieBuiltPlacementBounds,
  lookup: (id: string) => readonly IWorldBox[] | null | undefined,
): readonly IWorldBox[] => {
  if (locator.kind !== "element") return [reported];
  const parts = lookup(locator.id);
  return parts === null || parts === undefined || parts.length === 0
    ? [reported]
    : parts;
};

/** The single-pair lookup: one element's parts, resolved on the spot. */
const partsOfElement =
  (environment: IAutoMovieBuiltEnvironment) =>
  (id: string): readonly IWorldBox[] | null =>
    builtEnvironmentElementPartBounds(environment, id);

/**
 * Test two named building bodies for positive-volume world-bounds overlap.
 *
 * The comparison delegates to the placement kernel that treats exact face
 * contact as contact rather than intrusion. Population operands stay compact,
 * and every operand's basis remains explicit in the answer, which is what keeps
 * a `separate` verdict readable: a body the record carries no vertices for is
 * an extent-free point that clears almost everything, and the basis is how the
 * caller tells that from a measured miss.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Lets authoring source check one placement against a named neighbour before relying on rendered pixels.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Implements the named-neighbour positive-volume overlap result and preserves unresolved operands and measurement bases.
 * @author Samchon
 */
export const builtEnvironmentPlacementOverlap = (props: {
  environment: IAutoMovieBuiltEnvironment;
  left: AutoMovieBuiltPlacementBodyLocator;
  right: AutoMovieBuiltPlacementBodyLocator;
}): IAutoMovieBuiltPlacementOverlapResult => {
  const left = builtEnvironmentPlacementBounds({
    environment: props.environment,
    target: props.left,
  });
  const right = builtEnvironmentPlacementBounds({
    environment: props.environment,
    target: props.right,
  });
  const parts = partsOfElement(props.environment);
  const unresolved: ("left" | "right")[] = [];
  if (left === null) unresolved.push("left");
  if (right === null) unresolved.push("right");
  return {
    status:
      left === null || right === null
        ? "unresolved"
        : partsMeet(
              solidBoxes(props.left, left, parts),
              solidBoxes(props.right, right, parts),
            )
          ? "overlapping"
          : "separate",
    unresolved,
    leftBasis: left?.basis ?? null,
    rightBasis: right?.basis ?? null,
  };
};

/** Whether two boxes share footprint area, exact contact excluded. */
/**
 * A world-space box, whichever resolution produced it.
 *
 * The measuring helpers read six numbers and nothing else, so a part box is
 * admissible wherever a body's reported bounds are. Keeping them typed as the
 * reported bounds would have forced a fabricated `basis` onto every part, which
 * is a claim about how the part was resolved that nobody made.
 */
type IWorldBox = { min: IAutoMovieVector3; max: IAutoMovieVector3 };
