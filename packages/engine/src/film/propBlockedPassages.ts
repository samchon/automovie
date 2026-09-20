import { IAutoMovieBuiltConnector, IAutoMovieBuiltEnvironment, IAutoMovieModel, IAutoMoviePropBox, IAutoMovieVector3 } from "@automovie/interface";
import { builtConnectorSection } from "../architecture/builtConnectorSection";
import { tessellate } from "../geometry/tessellate";
import { Matrix4 } from "../math/Matrix4";
import { IAutoMoviePassageBlockage } from "./IAutoMoviePassageBlockage";
import { propBoundsOverlap } from "./propBoundsOverlap";

/**
 * Every opening and connector a world volume intrudes on.
 *
 * An opening is only measurable through the element that fills it, so an open
 * cut (`fill: null`) and a fill whose model lives outside the record are
 * reported by neither this predicate nor the validator: a passage nothing
 * describes cannot be proven blocked, and guessing where the hole is would be
 * worse than saying nothing. A connector is swept from its own route: each
 * segment widens by half the usable width horizontally and rises by the clear
 * height, which is the volume a body traversing it needs. A connector that
 * declares no section at all is skipped for the same reason as an open cut.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance propBlockedPassages names the exact openings and connectors whose circulation volume a staged prop obstructs.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement propBlockedPassages realizes furnishing placement clearance: Every opening and connector a world volume intrudes on. An opening is only measurable through the element that fills it, so an open cut (`fill: null`) and a fill whose model lives outside the record are reported by neither this predicate nor the validator: a passage nothing describes cannot be proven blocked, and guessing where the hole is would be worse than saying nothing. A connector is swept from its own route: each segment widens by half the usable width horizontally and rises by the clear height, which is the volume a body traversing it needs. A connector that declares no section at all is skipped for the same reason as an open cut.
 */
export const propBlockedPassages = (props: {
  environment: IAutoMovieBuiltEnvironment;
  bounds: IAutoMoviePropBox;
}): IAutoMoviePassageBlockage[] => {
  const blocked: IAutoMoviePassageBlockage[] = [];
  for (const opening of props.environment.openings) {
    const reveal = openingRevealBounds(props.environment, opening.id);
    if (reveal !== null && propBoundsOverlap(props.bounds, reveal))
      blocked.push({ kind: "opening", id: opening.id });
  }
  for (const connector of props.environment.connectors)
    if (
      connectorCorridors(connector).some((corridor) =>
        propBoundsOverlap(props.bounds, corridor),
      )
    )
      blocked.push({ kind: "connector", id: connector.id });
  return blocked;
};

/**
 * The world matrix of one element, or `null` when it or an ancestor is missing
 * or its parent chain closes on itself. A cyclic record is refused by
 * `validateBuiltEnvironment`, and answering `null` here rather than recursing
 * forever is what lets both gates report their own defect in one run.
 */
const elementWorldMatrix = (
  environment: IAutoMovieBuiltEnvironment,
  id: string,
): number[] | null => {
  const byId = new Map(
    environment.elements.map((element) => [element.id, element]),
  );
  const trail = new Set<string>();
  const read = (current: string): number[] | null => {
    if (trail.has(current)) return null;
    trail.add(current);
    const element = byId.get(current);
    if (element === undefined) return null;
    const local = Matrix4.compose(
      element.transform.translation,
      element.transform.rotation,
      element.transform.scale,
    );
    if (element.parent === null) return local;
    const parent = read(element.parent);
    return parent === null ? null : Matrix4.multiply(parent, local);
  };
  return read(id);
};

/** World bounds of the element filling an opening, or `null` when unmeasurable. */
const openingRevealBounds = (
  environment: IAutoMovieBuiltEnvironment,
  id: string,
): IAutoMoviePropBox | null => {
  const opening = environment.openings.find((candidate) => candidate.id === id);
  const fill = opening?.fill ?? null;
  if (fill === null) return null;
  const element = environment.elements.find(
    (candidate) => candidate.id === fill,
  );
  const model = environment.models.find(
    (candidate) => candidate.id === element?.model,
  );
  if (model === undefined) return null;
  const matrix = elementWorldMatrix(environment, fill);
  return matrix === null ? null : transformedModelBounds(model, matrix);
};

/**
 * Axis-aligned volumes a connector's route sweeps at its usable size.
 *
 * A connector that states no section at all sweeps nothing here, and a prop
 * standing in it is therefore reported by neither this predicate nor the
 * validator, for the same reason an open cut is: an unstated width is not a
 * width of zero, and a passage whose size nobody declared cannot be proven
 * blocked. `validateBuiltEnvironment` refuses that record on its own path, so
 * the missing declaration is reported where it can be fixed rather than guessed
 * at here.
 *
 * A varying section is read where the segment actually is, and each segment
 * takes the widest section it spans. The box is already an outer bound of the
 * segment it sweeps, so widening it to the segment's most generous station
 * keeps the answer on the conservative side rather than letting a prop hide in
 * the narrow half of a tapering corridor.
 */
const connectorCorridors = (
  connector: IAutoMovieBuiltConnector,
): IAutoMoviePropBox[] => {
  const cumulative = [0];
  for (let index = 0; index + 1 < connector.route.length; ++index) {
    const from = connector.route[index]!;
    const to = connector.route[index + 1]!;
    cumulative.push(
      cumulative[index]! +
        Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z),
    );
  }
  const total = cumulative[cumulative.length - 1]!;
  // Whether a section is stated is a property of the record alone, so one probe
  // settles it for every station read below.
  if (total <= 0 || builtConnectorSection(connector, 0) === null) return [];
  const boxes: IAutoMoviePropBox[] = [];
  for (let index = 0; index + 1 < connector.route.length; ++index) {
    const from = connector.route[index]!;
    const to = connector.route[index + 1]!;
    const start = cumulative[index]! / total;
    const end = cumulative[index + 1]! / total;
    const samples = [start, end];
    for (const section of connector.sections ?? [])
      if (section.at > start && section.at < end) samples.push(section.at);
    const sections = samples.map((at) => builtConnectorSection(connector, at)!);
    const half = Math.max(...sections.map((section) => section.width)) / 2;
    const clearHeight = Math.max(
      ...sections.map((section) => section.clearHeight),
    );
    boxes.push({
      min: {
        x: Math.min(from.x, to.x) - half,
        y: Math.min(from.y, to.y),
        z: Math.min(from.z, to.z) - half,
      },
      max: {
        x: Math.max(from.x, to.x) + half,
        y: Math.max(from.y, to.y) + clearHeight,
        z: Math.max(from.z, to.z) + half,
      },
    });
  }
  return boxes;
};

const transformedModelBounds = (
  model: IAutoMovieModel,
  world: number[],
): IAutoMoviePropBox => {
  const points: IAutoMovieVector3[] = [];
  for (const part of model.parts) {
    const positions =
      part.geometry.type === "primitive"
        ? tessellate(part.geometry.shape).positions
        : part.geometry.mesh.positions;
    const matrix =
      part.transform === null
        ? world
        : Matrix4.multiply(
            world,
            Matrix4.compose(
              part.transform.translation,
              part.transform.rotation,
              part.transform.scale,
            ),
          );
    for (let index = 0; index < positions.length; index += 3)
      points.push(
        transformPoint(
          {
            x: positions[index]!,
            y: positions[index + 1]!,
            z: positions[index + 2]!,
          },
          matrix,
        ),
      );
  }
  if (points.length === 0) {
    const origin = Matrix4.position(world);
    return { min: { ...origin }, max: { ...origin } };
  }
  return boundsOf(points);
};

const transformPoint = (
  point: IAutoMovieVector3,
  matrix: number[],
): IAutoMovieVector3 => ({
  x:
    matrix[0]! * point.x +
    matrix[4]! * point.y +
    matrix[8]! * point.z +
    matrix[12]!,
  y:
    matrix[1]! * point.x +
    matrix[5]! * point.y +
    matrix[9]! * point.z +
    matrix[13]!,
  z:
    matrix[2]! * point.x +
    matrix[6]! * point.y +
    matrix[10]! * point.z +
    matrix[14]!,
});

const boundsOf = (points: readonly IAutoMovieVector3[]): IAutoMoviePropBox => {
  const first = points[0]!;
  const bounds: IAutoMoviePropBox = {
    min: { ...first },
    max: { ...first },
  };
  for (const point of points.slice(1)) {
    bounds.min.x = Math.min(bounds.min.x, point.x);
    bounds.min.y = Math.min(bounds.min.y, point.y);
    bounds.min.z = Math.min(bounds.min.z, point.z);
    bounds.max.x = Math.max(bounds.max.x, point.x);
    bounds.max.y = Math.max(bounds.max.y, point.y);
    bounds.max.z = Math.max(bounds.max.z, point.z);
  }
  return bounds;
};
