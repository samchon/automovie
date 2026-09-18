import { AutoMovieBuiltPlacementBodyLocator, AutoMovieBuiltPlacementSupportLocator, IAutoMovieBuiltEnvironment, IAutoMovieBuiltPlacementBounds, IAutoMovieBuiltPlacementOverlapResult, IAutoMovieVector3 } from "@automovie/interface";
import { footprintConvexPieces } from "../space/footprintConvexPieces";
import { footprintRing } from "../space/footprintRing";
import { surfaceFootprint } from "../space/surfaceFootprint";
import { builtEnvironmentElementPartBounds } from "./builtEnvironmentElementPartBounds";
import { builtEnvironmentPlacementBounds } from "./builtEnvironmentPlacementBounds";

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

/**
 * The support part a subject bears on, chosen from the parts it stands over.
 *
 * Nearest underside rather than highest: a subject resting on a low board and a
 * subject sunk into a high one are different answers, and choosing the highest
 * part would report the first as floating by the height of the second.
 *
 * A subject over none of the parts gets one of them rather than the union. It is
 * over no part, so any part answers `not-over-support`, which is the truth; the
 * union would have said it stands over the body for the same reason a shelf's
 * box swallows what stands on it, and a notch in an L-shaped body is exactly
 * where that reappears.
 */
const bearingPart = (
  environment: IAutoMovieBuiltEnvironment,
  locator: AutoMovieBuiltPlacementSupportLocator,
  body: IAutoMovieBuiltPlacementBounds,
  subject: IAutoMovieBuiltPlacementBounds | null,
): IWorldBox => {
  if (locator.kind !== "element" || subject === null) return body;
  const parts = builtEnvironmentElementPartBounds(environment, locator.id);
  if (parts === null || parts.length < 2) return body;
  const over = parts.filter(
    (part) =>
      part.min.x < subject.max.x &&
      part.max.x > subject.min.x &&
      part.min.z < subject.max.z &&
      part.max.z > subject.min.z,
  );
  if (over.length === 0) return parts[0]!;
  return over.reduce((best, part) =>
    Math.abs(part.max.y - subject.min.y) < Math.abs(best.max.y - subject.min.y)
      ? part
      : best,
  );
};

/**
 * The face a body bears on, chosen from the parts it is actually over.
 *
 * A support's union box puts the bearing face at the highest point of the whole
 * body, which for a shelf is the back panel rather than the board an object
 * rests on — so a correctly seated object reads as floating by the height of a
 * part it is nowhere near. Where the support has drawn parts, the face is the
 * top of the part nearest the subject's underside among the parts its footprint
 * covers, and where it covers none of them the face comes from a part anyway:
 * standing over no part is what `not-over-support` means, and the union would
 * have answered that the subject stands over the body.
 *
 * A single-part support yields its own box either way.
 */
const resolveSupport = (
  environment: IAutoMovieBuiltEnvironment,
  locator: AutoMovieBuiltPlacementSupportLocator,
  subject: IAutoMovieBuiltPlacementBounds | null,
): IResolvedSupport | null => {
  if (locator.kind === "surface") {
    const entry = environment.surfaces.find(
      (candidate) => candidate.surface.id === locator.id,
    );
    if (entry === undefined) return null;
    const polygon = surfaceFootprint(entry.surface);
    if (footprintConvexPieces(polygon).length === 0) return null;
    return {
      face: { polygon, height: entry.surface },
      basis: "surface-height-rule",
    };
  }
  const body = builtEnvironmentPlacementBounds({
    environment,
    target: locator,
  });
  if (body === null) return null;
  const bearing = bearingPart(environment, locator, body, subject);
  const { min, max } = bearing;
  return {
    face: {
      polygon: {
        outer: footprintRing([
          { x: min.x, y: max.y, z: min.z },
          { x: max.x, y: max.y, z: min.z },
          { x: max.x, y: max.y, z: max.z },
          { x: min.x, y: max.y, z: max.z },
        ]),
        holes: [],
      },
      height: { height: { kind: "constant", value: max.y } },
    },
    basis: body.basis,
  };
};

/**
 * Every body of one building, resolved once with its own extent.
 *
 * A sweep resolves each body exactly once and then works on boxes. That order is
 * what makes a whole-building check affordable: resolving an element means
 * tessellating its model and walking its transform chain, and comparing two boxes
 * is arithmetic, so the resolutions are the cost and repeating them per pair is
 * how a sweep becomes unusable.
 */
const builtEnvironmentBodies = (
  environment: IAutoMovieBuiltEnvironment,
): {
  resolved: {
    body: AutoMovieBuiltPlacementBodyLocator;
    bounds: IAutoMovieBuiltPlacementBounds;
  }[];
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
} => {
  const resolved: {
    body: AutoMovieBuiltPlacementBodyLocator;
    bounds: IAutoMovieBuiltPlacementBounds;
  }[] = [];
  const unresolved: AutoMovieBuiltPlacementBodyLocator[] = [];
  const locators: AutoMovieBuiltPlacementBodyLocator[] = [
    ...environment.elements.map(
      (element): AutoMovieBuiltPlacementBodyLocator => ({
        kind: "element",
        id: element.id,
      }),
    ),
    ...(environment.populations ?? []).map(
      (population): AutoMovieBuiltPlacementBodyLocator => ({
        kind: "population",
        id: population.set.id,
      }),
    ),
  ];
  for (const body of locators) {
    const bounds = builtEnvironmentPlacementBounds({
      environment,
      target: body,
    });
    if (bounds === null) unresolved.push(body);
    else resolved.push({ body, bounds });
  }
  return { resolved, unresolved };
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

const footprintOverlaps = (left: IWorldBox, right: IWorldBox): boolean =>
  left.min.x < right.max.x &&
  left.max.x > right.min.x &&
  left.min.z < right.max.z &&
  left.max.z > right.min.z;

/**
 * The first index of a top-height-descending list at or below one height.
 *
 * A binary search rather than a scan, because the bodies above a subject are the
 * many in a tall building and reading past them is the cost this ordering exists
 * to avoid.
 */
const firstAtOrBelow = (
  descending: readonly { bounds: IWorldBox }[],
  ceiling: number,
): number => {
  let low = 0;
  let high = descending.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (descending[middle]!.bounds.max.y > ceiling) low = middle + 1;
    else high = middle;
  }
  return low;
};

const boxVolume = (box: IWorldBox): number =>
  Math.max(0, box.max.x - box.min.x) *
  Math.max(0, box.max.y - box.min.y) *
  Math.max(0, box.max.z - box.min.z);

/** How much solid a body's parts hold, which is not the volume of its box. */
const solidVolume = (parts: readonly IWorldBox[]): number =>
  parts.reduce((total, part) => total + boxVolume(part), 0);

const sharedVolume = (left: IWorldBox, right: IWorldBox): number =>
  Math.max(
    0,
    Math.min(left.max.x, right.max.x) - Math.max(left.min.x, right.min.x),
  ) *
  Math.max(
    0,
    Math.min(left.max.y, right.max.y) - Math.max(left.min.y, right.min.y),
  ) *
  Math.max(
    0,
    Math.min(left.max.z, right.max.z) - Math.max(left.min.z, right.min.z),
  );

interface IResolvedSupport {
  face: IAutoMoviePropSupportFace;
  basis: AutoMovieBuiltPlacementBasis;
}

/**
 * The support part a subject bears on, chosen from the parts it stands over.
 *
 * Nearest underside rather than highest: a subject resting on a low board and a
 * subject sunk into a high one are different answers, and choosing the highest
 * part would report the first as floating by the height of the second.
 *
 * A subject over none of the parts gets one of them rather than the union. It is
 * over no part, so any part answers `not-over-support`, which is the truth; the
 * union would have said it stands over the body for the same reason a shelf's
 * box swallows what stands on it, and a notch in an L-shaped body is exactly
 * where that reappears.
 */
const bearingPart = (
  environment: IAutoMovieBuiltEnvironment,
  locator: AutoMovieBuiltPlacementSupportLocator,
  body: IAutoMovieBuiltPlacementBounds,
  subject: IAutoMovieBuiltPlacementBounds | null,
): IWorldBox => {
  if (locator.kind !== "element" || subject === null) return body;
  const parts = builtEnvironmentElementPartBounds(environment, locator.id);
  if (parts === null || parts.length < 2) return body;
  const over = parts.filter(
    (part) =>
      part.min.x < subject.max.x &&
      part.max.x > subject.min.x &&
      part.min.z < subject.max.z &&
      part.max.z > subject.min.z,
  );
  if (over.length === 0) return parts[0]!;
  return over.reduce((best, part) =>
    Math.abs(part.max.y - subject.min.y) < Math.abs(best.max.y - subject.min.y)
      ? part
      : best,
  );
};

const boxVolume = (box: IWorldBox): number =>
  Math.max(0, box.max.x - box.min.x) *
  Math.max(0, box.max.y - box.min.y) *
  Math.max(0, box.max.z - box.min.z);
