import {
  AutoMovieBuiltPlacementBodyLocator,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPlacementBounds,
  IAutoMovieBuiltPlacementOverlapResult,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 * An element operand is tested part by part, because a multi-part body's union
 * box is mostly air; a population or a partless element keeps its one reported
 * box. A missing operand makes the status `unresolved` and is listed by side.
 *
 * @evidence contracts/common.md#principled-implementation Resolves both reported boxes, then tests positive-volume overlap part against part through `propBoundsOverlap`, which counts exact face contact as contact rather than intrusion; either unresolved side yields `unresolved`.
 * @evidence contracts/common.md#clear-and-simple-design Defect: `solidBoxes` and `IWorldBox` are copied into the overlap sweep, the support sweep and support status even though `solidBoxes`'s own comment says writing that rule twice is how copies stop agreeing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Populations stay compact, a partless element keeps its reported box, and both bases come back so an origin-point miss is never mistaken for a measured one; no locator is exempted.
 * @evidence contracts/common.md#meaningful-documentation States the face-contact kernel, the part-by-part test and its reason, the compact population handling, the unresolved status, and why the bases travel with a `separate` verdict.
 * @evidence contracts/performance.md#cost-and-resources Defect: each operand's box restages the whole hierarchy and an element operand stages it again for its parts, up to four `O(E)` stagings per pair plus `O(P_l P_r)` part tests; nothing is memoized, so a caller testing many pairs belongs on the sweep.
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
