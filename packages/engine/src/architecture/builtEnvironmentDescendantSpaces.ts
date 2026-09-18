import { IAutoMovieBoundaryFace, IAutoMovieBuiltConnector, IAutoMovieBuiltEnvironment, IAutoMovieBuiltOpening, IAutoMovieBuiltPopulation, IAutoMovieBuiltSpace, IAutoMovieConnectorSection, IAutoMovieInstanceSetDesign, IAutoMovieOpeningProfile, IAutoMoviePlanarPoint, IAutoMovieQuaternion, IAutoMovieSpaceShell, IAutoMovieTravelMotion, IAutoMovieVector3 } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { ViolationCollector } from "../validation/ViolationCollector";
import { PLANAR_EPSILON } from "../geometry/PLANAR_EPSILON";
import { outlineHull } from "./outlineHull";
import { polygonDoubleArea } from "./polygonDoubleArea";
import { polygonInside } from "./polygonInside";
import { polygonIsSimple } from "./polygonIsSimple";
import { polygonShortestEdge } from "./polygonShortestEdge";
import { builtEnvironmentContainsPoint } from "./builtEnvironmentContainsPoint";
import { builtSpaceShellVolume } from "./builtSpaceShellVolume";
import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";

/**
 * Every logical space under one space, including that space itself.
 *
 * The containment fold every other query here performs, exposed once rather
 * than copied. A caller asking what a storey holds, what a building unit owns,
 * or which rooms a derived review population must charge for was otherwise
 * rewriting this walk, and two walks over one hierarchy are two answers that
 * eventually disagree.
 *
 * Sorted, because a population is compared and printed rather than only tested
 * for membership.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtEnvironmentDescendantSpaces` names every logical space under one space. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtEnvironmentDescendantSpaces` resolves the descendant space population the engine folds ownership, topology, and geometry over inside one building-interior boundary.
 * @author Samchon
 */
export const builtEnvironmentDescendantSpaces = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): string[] => {
  requireSpace(environment, spaceId);
  return [...descendantSpaces(environment.spaces, spaceId)].sort(
    compareAutoMovieRenderIds,
  );
};

const descendantSpaces = (
  spaces: readonly IAutoMovieBuiltSpace[],
  root: string,
): Set<string> => {
  const included = new Set([root]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const space of spaces)
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

/**
 * Check exactly what a building owns about a population it stages.
 *
 * The whole instance-set design is the production builder's to validate, and
 * it validates it again when the lowered set reaches the world. What is checked
 * here is the subset this record answers for on its own: the slot count and the
 * placement law {@link builtInstanceSetPlacementBounds} has to be total over,
 * because a space query that cannot bound a population it was handed would have
 * to return either a lie or nothing at all.
 */
const validatePopulationPrototypeBounds = (
  bounds: IAutoMovieBuiltPopulation["prototypeBounds"],
  path: string,
  collector: ViolationCollector,
): void => {
  finiteVector(
    bounds.min,
    `${path}.min`,
    "population prototype minimum",
    collector,
  );
  finiteVector(
    bounds.max,
    `${path}.max`,
    "population prototype maximum",
    collector,
  );
  for (const axis of ["x", "y", "z"] as const)
    if (
      Number.isFinite(bounds.min[axis]) &&
      Number.isFinite(bounds.max[axis]) &&
      bounds.min[axis] > bounds.max[axis]
    )
      collector.push(
        "range",
        `${path}.${axis}`,
        `population prototype ${axis} bounds must be ordered, but ${bounds.min[axis]} is above ${bounds.max[axis]}`,
        { min: bounds.min[axis], max: bounds.max[axis] },
      );
};

const validatePopulationSet = (
  set: IAutoMovieInstanceSetDesign,
  path: string,
  collector: ViolationCollector,
): void => {
  positiveInteger(
    set.count,
    `${path}.count`,
    "population slot count",
    collector,
  );
  finiteVector(set.anchor, `${path}.anchor`, "population anchor", collector);
  if (!Number.isFinite(set.facingDeg))
    collector.push(
      "range",
      `${path}.facingDeg`,
      `population heading must be finite, but was ${set.facingDeg}`,
      set.facingDeg,
    );
  positive(
    set.variation.scale.min,
    `${path}.variation.scale.min`,
    "population minimum scale",
    collector,
  );
  positive(
    set.variation.scale.max,
    `${path}.variation.scale.max`,
    "population maximum scale",
    collector,
  );
  if (
    Number.isFinite(set.variation.scale.min) &&
    Number.isFinite(set.variation.scale.max) &&
    set.variation.scale.min > set.variation.scale.max
  )
    collector.push(
      "range",
      `${path}.variation.scale`,
      `population scale range must be ordered, but ${set.variation.scale.min} is above ${set.variation.scale.max}`,
      set.variation.scale,
    );
  if (set.variation.scale3 !== undefined)
    for (const axis of ["x", "y", "z"] as const) {
      const range = {
        min: set.variation.scale3.min[axis],
        max: set.variation.scale3.max[axis],
      };
      positive(
        range.min,
        `${path}.variation.scale3.min.${axis}`,
        `population minimum ${axis} scale`,
        collector,
      );
      positive(
        range.max,
        `${path}.variation.scale3.max.${axis}`,
        `population maximum ${axis} scale`,
        collector,
      );
      if (
        Number.isFinite(range.min) &&
        Number.isFinite(range.max) &&
        range.min > range.max
      )
        collector.push(
          "range",
          `${path}.variation.scale3.${axis}`,
          `population ${axis} scale range must be ordered, but ${range.min} is above ${range.max}`,
          range,
        );
    }
  if (set.variation.rotationDeg !== undefined)
    for (const axis of ["x", "y", "z"] as const) {
      const range = set.variation.rotationDeg[axis];
      if (!Number.isFinite(range.min))
        collector.push(
          "range",
          `${path}.variation.rotationDeg.${axis}.min`,
          `population minimum ${axis} rotation must be finite, but was ${range.min}`,
          range.min,
        );
      if (!Number.isFinite(range.max))
        collector.push(
          "range",
          `${path}.variation.rotationDeg.${axis}.max`,
          `population maximum ${axis} rotation must be finite, but was ${range.max}`,
          range.max,
        );
      if (
        Number.isFinite(range.min) &&
        Number.isFinite(range.max) &&
        range.min > range.max
      )
        collector.push(
          "range",
          `${path}.variation.rotationDeg.${axis}`,
          `population ${axis} rotation range must be ordered, but ${range.min} is above ${range.max}`,
          range,
        );
    }
  const layout = set.layout;
  if (layout.kind === "along-route") {
    collector.push(
      "type",
      `${path}.layout.kind`,
      'a building population may not use the "along-route" layout: a route is a production-world fact this record carries no field for, so such a population belongs to the world rather than to a building space',
      layout.kind,
    );
    return;
  }
  if (layout.kind === "scatter") {
    positive(
      layout.radius,
      `${path}.layout.radius`,
      "population scatter radius",
      collector,
    );
    return;
  }
  if (layout.kind === "explicit") {
    if (layout.transforms.length < set.count)
      collector.push(
        "range",
        `${path}.layout.transforms`,
        `an explicit population needs one transform per slot, but ${layout.transforms.length} were stated for ${set.count} slots`,
        layout.transforms.length,
      );
    layout.transforms.forEach((transform, index) => {
      finiteVector(
        transform.translation,
        `${path}.layout.transforms[${index}].translation`,
        "population slot translation",
        collector,
      );
      unitQuaternion(
        transform.rotation,
        `${path}.layout.transforms[${index}].rotation`,
        "population slot rotation",
        collector,
      );
      for (const axis of ["x", "y", "z"] as const)
        positive(
          transform.scale[axis],
          `${path}.layout.transforms[${index}].scale.${axis}`,
          `population slot ${axis} scale`,
          collector,
        );
    });
    return;
  }
  positiveInteger(
    layout.rows,
    `${path}.layout.rows`,
    "population layout rows",
    collector,
  );
  positiveInteger(
    layout.columns,
    `${path}.layout.columns`,
    "population layout columns",
    collector,
  );
  positive(
    layout.spacing.x,
    `${path}.layout.spacing.x`,
    "population layout x spacing",
    collector,
  );
  positive(
    layout.spacing.z,
    `${path}.layout.spacing.z`,
    "population layout z spacing",
    collector,
  );
  if (layout.kind === "lattice") {
    positiveInteger(
      layout.layers,
      `${path}.layout.layers`,
      "population layout layers",
      collector,
    );
    positive(
      layout.spacing.y,
      `${path}.layout.spacing.y`,
      "population layout y spacing",
      collector,
    );
  }
  const capacity =
    layout.kind === "lattice"
      ? layout.rows * layout.columns * layout.layers
      : layout.rows * layout.columns;
  if (Number.isSafeInteger(capacity) && capacity < set.count)
    collector.push(
      "range",
      `${path}.layout`,
      `a ${layout.kind} population's own lattice holds ${capacity} slots, which cannot carry its ${set.count}`,
      capacity,
    );
};

const positiveInteger = (
  value: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isSafeInteger(value) || value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be an integer > 0, but was ${value}`,
      value,
    );
};

const nonEmpty = (
  value: string,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value.trim().length === 0)
    collector.push("type", path, `${label} must be non-empty`, value);
};

const finiteVector = (
  value: IAutoMovieVector3,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(value[axis]))
      collector.push(
        "range",
        `${path}.${axis}`,
        `${label} ${axis} must be finite, but was ${value[axis]}`,
        value[axis],
      );
};

const positive = (
  value: number | undefined,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value === undefined || !Number.isFinite(value) || value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be a finite number > 0, but was ${value}`,
      value ?? null,
    );
};

const unitQuaternion = (
  value: IAutoMovieQuaternion,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  const norm = Math.hypot(value.x, value.y, value.z, value.w);
  if (!Number.isFinite(norm) || Math.abs(norm - 1) > UNIT_QUATERNION_EPSILON)
    collector.push(
      "range",
      path,
      `${label} must be a unit quaternion, but its norm was ${norm}`,
      value,
    );
};

/**
 * Whether a closed planar outline names distinct, finite corners.
 *
 * The minimum corner count differs by what the outline may carry: a straight
 * face needs three, while an outline whose edges may bulge needs only two,
 * because a full circle is two half-turn arcs and demanding a third corner
 * would outlaw a round oculus for no geometric reason.
 */
const closedOutline = (
  outline: readonly IAutoMoviePlanarPoint[],
  least: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): boolean => {
  if (outline.length < least) {
    collector.push(
      "range",
      path,
      `${label} needs at least ${least} points, but had ${outline.length}`,
      outline.length,
    );
    return false;
  }
  let finite = true;
  outline.forEach((point, index) => {
    for (const axis of ["x", "y"] as const)
      if (!Number.isFinite(point[axis])) {
        finite = false;
        collector.push(
          "range",
          `${path}[${index}].${axis}`,
          `${label} ${axis} must be finite, but was ${point[axis]}`,
          point[axis],
        );
      }
  });
  if (!finite) return false;
  if (polygonShortestEdge(outline) <= PLANAR_EPSILON) {
    collector.push(
      "range",
      path,
      `${label} must not repeat a point at consecutive corners`,
      outline,
    );
    return false;
  }
  return true;
};

/**
 * Whether a closed region is one an inside test can be run against.
 *
 * Real area and no self-crossing are not stylistic demands: without them
 * "inside this region" has no answer, and every later containment or separation
 * result would be arbitrary rather than merely wrong.
 */
const closedRegion = (
  region: readonly IAutoMoviePlanarPoint[],
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (Math.abs(polygonDoubleArea(region)) <= PLANAR_EPSILON)
    collector.push("range", path, `${label} encloses no area`, region);
  else if (polygonIsSimple(region) === false)
    collector.push("type", path, `${label} must not cross itself`, region);
};

/** Whether a boundary's face is complete enough to place an opening on. */
const faceIsUsable = (
  face: IAutoMovieBoundaryFace,
  path: string,
  collector: ViolationCollector,
): boolean => {
  const before = collector.items.length;
  finiteVector(
    face.origin,
    `${path}.face.origin`,
    "boundary face origin",
    collector,
  );
  unitQuaternion(
    face.rotation,
    `${path}.face.rotation`,
    "boundary face rotation",
    collector,
  );
  positive(
    face.thickness,
    `${path}.face.thickness`,
    "boundary thickness",
    collector,
  );
  if (
    closedOutline(
      face.outline,
      3,
      `${path}.face.outline`,
      "boundary face outline",
      collector,
    )
  )
    closedRegion(
      face.outline,
      `${path}.face.outline`,
      "boundary face outline",
      collector,
    );
  return collector.items.length === before;
};

/** Whether an opening's void is complete enough to be located and bounded. */
const profileIsUsable = (
  profile: IAutoMovieOpeningProfile,
  path: string,
  collector: ViolationCollector,
): boolean => {
  const before = collector.items.length;
  closedOutline(
    profile.outline,
    2,
    `${path}.outline`,
    "opening outline",
    collector,
  );
  if (profile.bulges !== undefined) {
    if (profile.bulges.length !== profile.outline.length)
      collector.push(
        "type",
        `${path}.bulges`,
        `an opening states ${profile.bulges.length} bulges for ${profile.outline.length} edges`,
        profile.bulges.length,
      );
    profile.bulges.forEach((bulge, index) => {
      if (!Number.isFinite(bulge) || Math.abs(bulge) > 1)
        collector.push(
          "range",
          `${path}.bulges[${index}]`,
          `an edge bulge must be a finite number within [-1, 1], because an arc longer than a half turn is authored as two edges, but was ${bulge}`,
          bulge,
        );
    });
  }
  // The region an arc encloses is the hull's, not the corner polygon's: two
  // corners and two half turns are a circle, which the corners alone call flat.
  if (collector.items.length === before)
    closedRegion(
      outlineHull(profile),
      `${path}.outline`,
      "opening outline",
      collector,
    );
  return collector.items.length === before;
};

/** Validate the movable panels, named states, and hardware of one opening. */
const validateOpeningOperation = (props: {
  opening: IAutoMovieBuiltOpening;
  path: string;
  elements: ReadonlySet<string>;
  environment: IAutoMovieBuiltEnvironment;
  /** Which panel already drives an element, across the whole work. */
  driven: Map<string, string>;
  collector: ViolationCollector;
}): void => {
  const { opening, path, collector } = props;
  const operation = opening.operation;
  if (operation === undefined) return;
  const base = `${path}.operation`;
  if (opening.fill === null)
    collector.push(
      "type",
      `${path}.fill`,
      `opening "${opening.id}" declares movable panels, so it must name the element they belong to`,
      null,
    );
  if (operation.panels.length === 0)
    collector.push(
      "range",
      `${base}.panels`,
      `opening "${opening.id}" declares an operation with no movable panel`,
      operation.panels.length,
    );
  const panelIds = collectIds(
    operation.panels,
    `${base}.panels`,
    "panel",
    collector,
  );
  const owned = descendantElements(
    props.environment,
    opening.fill === null ? [] : [opening.fill],
  );
  operation.panels.forEach((panel, index) => {
    const panelPath = `${base}.panels[${index}]`;
    if (!props.elements.has(panel.element))
      collector.push(
        "type",
        `${panelPath}.element`,
        `panel element "${panel.element}" does not resolve`,
        panel.element,
      );
    else if (opening.fill !== null && !owned.has(panel.element))
      collector.push(
        "type",
        `${panelPath}.element`,
        `panel element "${panel.element}" must be the filling element "${opening.fill}" of opening "${opening.id}" or descend from it`,
        panel.element,
      );
    // One element carries one displacement, so a second panel claiming it
    // would not add a degree of freedom: it would silently lose whichever
    // travel was written first, and the record would say a thing the render
    // never does.
    const already = props.driven.get(panel.element);
    if (already !== undefined)
      collector.push(
        "type",
        `${panelPath}.element`,
        `panel element "${panel.element}" is already driven by ${already}`,
        panel.element,
      );
    else
      props.driven.set(
        panel.element,
        `panel "${panel.id}" of opening "${opening.id}"`,
      );
    positive(panel.width, `${panelPath}.width`, "panel width", collector);
    positive(panel.height, `${panelPath}.height`, "panel height", collector);
    validateTravelMotion(
      panel.motion,
      `${panelPath}.motion`,
      "panel",
      collector,
    );
  });
  if (operation.states.length === 0)
    collector.push(
      "range",
      `${base}.states`,
      `opening "${opening.id}" declares an operation with no named state`,
      operation.states.length,
    );
  collectIds(operation.states, `${base}.states`, "operating state", collector);
  operation.states.forEach((state, index) => {
    const statePath = `${base}.states[${index}]`;
    const seen = new Set<string>();
    state.panels.forEach((entry, valueIndex) => {
      const valuePath = `${statePath}.panels[${valueIndex}]`;
      if (!panelIds.has(entry.panel))
        collector.push(
          "type",
          `${valuePath}.panel`,
          `operating state "${state.id}" drives unknown panel "${entry.panel}"`,
          entry.panel,
        );
      if (seen.has(entry.panel))
        collector.push(
          "type",
          `${valuePath}.panel`,
          `operating state "${state.id}" drives panel "${entry.panel}" twice`,
          entry.panel,
        );
      seen.add(entry.panel);
      const panel = operation.panels.find(
        (candidate) => candidate.id === entry.panel,
      );
      if (panel === undefined) return;
      if (
        !Number.isFinite(entry.value) ||
        entry.value < panel.motion.min ||
        entry.value > panel.motion.max
      )
        collector.push(
          "range",
          `${valuePath}.value`,
          `operating state "${state.id}" drives panel "${panel.id}" to ${entry.value}, outside its travel [${panel.motion.min}, ${panel.motion.max}]`,
          entry.value,
        );
    });
    for (const panel of operation.panels)
      if (!seen.has(panel.id))
        collector.push(
          "type",
          `${statePath}.panels`,
          `operating state "${state.id}" gives panel "${panel.id}" no value`,
          panel.id,
        );
  });
  if (!operation.states.some((state) => state.id === operation.state))
    collector.push(
      "type",
      `${base}.state`,
      `current operating state "${operation.state}" does not resolve`,
      operation.state,
    );
  collectIds(operation.hardware, `${base}.hardware`, "hardware", collector);
  operation.hardware.forEach((piece, index) => {
    const piecePath = `${base}.hardware[${index}]`;
    nonEmpty(piece.kind, `${piecePath}.kind`, "hardware kind", collector);
    if (piece.element !== null && !props.elements.has(piece.element))
      collector.push(
        "type",
        `${piecePath}.element`,
        `hardware element "${piece.element}" does not resolve`,
        piece.element,
      );
  });
};

/**
 * Validate the one degree of freedom a moving member travels on.
 *
 * The label names what is moving so the refusal reads as the author wrote it: a
 * door leaf and a lift car share this arithmetic, and a message that called a
 * car a panel would send its author looking through the openings for it.
 */
const validateTravelMotion = (
  motion: IAutoMovieTravelMotion,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  finiteVector(motion.axis, `${path}.axis`, `${label} travel axis`, collector);
  if (Vector3.length(motion.axis) <= PLANE_NORMAL_EPSILON)
    collector.push(
      "range",
      `${path}.axis`,
      `${label} travel axis must be non-zero`,
      motion.axis,
    );
  if (motion.kind === "revolute")
    finiteVector(motion.pivot, `${path}.pivot`, `${label} pivot`, collector);
  if (!Number.isFinite(motion.min) || motion.min > 0)
    collector.push(
      "range",
      `${path}.min`,
      `${label} travel is measured from its rest pose, so the lowest value must be a finite number <= 0, but was ${motion.min}`,
      motion.min,
    );
  if (!Number.isFinite(motion.max) || motion.max < 0)
    collector.push(
      "range",
      `${path}.max`,
      `${label} travel is measured from its rest pose, so the highest value must be a finite number >= 0, but was ${motion.max}`,
      motion.max,
    );
  else if (motion.max <= motion.min)
    collector.push(
      "range",
      `${path}.max`,
      `a movable ${label} needs travel, but its range was [${motion.min}, ${motion.max}]`,
      motion.max,
    );
  else if (
    motion.kind === "revolute" &&
    motion.max - motion.min > 2 * Math.PI + FULL_TURN_EPSILON
  )
    collector.push(
      "range",
      `${path}.max`,
      `a turning ${label} may travel at most a full turn, but its range spanned ${motion.max - motion.min} radians`,
      motion.max,
    );
};

/**
 * Validate the further spaces a run serves along its own route.
 *
 * A landing is a stop, and a stop stated twice, stated at an end the run
 * already names, or stated out of order is a stop later work cannot place. The
 * fraction is strictly inside `(0, 1)` because both ends are already served by
 * the run's own `from` and `to`.
 */
const validateConnectorLandings = (
  connector: IAutoMovieBuiltConnector,
  path: string,
  spaces: ReadonlySet<string>,
  collector: ViolationCollector,
): void => {
  const landings = connector.landings;
  if (landings === undefined) return;
  const seen = new Set<string>();
  landings.forEach((landing, index) => {
    const landingPath = `${path}.landings[${index}]`;
    if (!spaces.has(landing.space))
      collector.push(
        "type",
        `${landingPath}.space`,
        `connector landing space "${landing.space}" does not resolve`,
        landing.space,
      );
    if (landing.space === connector.from || landing.space === connector.to)
      collector.push(
        "type",
        `${landingPath}.space`,
        `connector landing "${landing.space}" restates an endpoint of connector "${connector.id}"`,
        landing.space,
      );
    if (seen.has(landing.space))
      collector.push(
        "type",
        `${landingPath}.space`,
        `connector landing "${landing.space}" is stated twice`,
        landing.space,
      );
    seen.add(landing.space);
    if (!Number.isFinite(landing.at) || landing.at <= 0 || landing.at >= 1)
      collector.push(
        "range",
        `${landingPath}.at`,
        `a connector landing stops between the run's own ends, so its arc-length fraction must be within (0, 1), but was ${landing.at}`,
        landing.at,
      );
    else if (index > 0 && !(landing.at > landings[index - 1]!.at))
      collector.push(
        "range",
        `${landingPath}.at`,
        `connector landings must strictly increase along the route, but ${landing.at} followed ${landings[index - 1]!.at}`,
        landing.at,
      );
  });
};

/** Validate the travelling carriages, named states, and stops of one run. */
const validateConnectorOperation = (props: {
  connector: IAutoMovieBuiltConnector;
  path: string;
  elements: ReadonlySet<string>;
  environment: IAutoMovieBuiltEnvironment;
  /** Which member already drives an element, across the whole work. */
  driven: Map<string, string>;
  collector: ViolationCollector;
}): void => {
  const { connector, path, collector } = props;
  const operation = connector.operation;
  if (operation === undefined) return;
  const base = `${path}.operation`;
  if (connector.elements.length === 0)
    collector.push(
      "type",
      `${path}.elements`,
      `connector "${connector.id}" drives a carriage, so it must name the elements it is built from`,
      connector.elements,
    );
  if (operation.carriages.length === 0)
    collector.push(
      "range",
      `${base}.carriages`,
      `connector "${connector.id}" declares an operation with no carriage`,
      operation.carriages.length,
    );
  const carriageIds = collectIds(
    operation.carriages,
    `${base}.carriages`,
    "carriage",
    collector,
  );
  const owned = descendantElements(props.environment, connector.elements);
  operation.carriages.forEach((carriage, index) => {
    const carriagePath = `${base}.carriages[${index}]`;
    if (!props.elements.has(carriage.element))
      collector.push(
        "type",
        `${carriagePath}.element`,
        `carriage element "${carriage.element}" does not resolve`,
        carriage.element,
      );
    else if (connector.elements.length !== 0 && !owned.has(carriage.element))
      collector.push(
        "type",
        `${carriagePath}.element`,
        `carriage element "${carriage.element}" must be one of the elements connector "${connector.id}" is built from, or descend from one`,
        carriage.element,
      );
    // One element carries one displacement, and doors and runs draw from the
    // same table, so a leaf that is also a lift car would lose whichever travel
    // was written first rather than gaining a second degree of freedom.
    const already = props.driven.get(carriage.element);
    if (already !== undefined)
      collector.push(
        "type",
        `${carriagePath}.element`,
        `carriage element "${carriage.element}" is already driven by ${already}`,
        carriage.element,
      );
    else
      props.driven.set(
        carriage.element,
        `carriage "${carriage.id}" of connector "${connector.id}"`,
      );
    validateTravelMotion(
      carriage.motion,
      `${carriagePath}.motion`,
      "carriage",
      collector,
    );
  });
  const stops = new Set(connectorStops(connector));
  if (operation.states.length === 0)
    collector.push(
      "range",
      `${base}.states`,
      `connector "${connector.id}" declares an operation with no named state`,
      operation.states.length,
    );
  collectIds(operation.states, `${base}.states`, "operating state", collector);
  operation.states.forEach((state, index) => {
    const statePath = `${base}.states[${index}]`;
    if (!CONNECTOR_DRIVES.includes(state.drive))
      collector.push(
        "type",
        `${statePath}.drive`,
        `unknown connector drive "${String(state.drive)}"`,
        state.drive,
      );
    else if (state.drive === "reverse" && connector.bidirectional === false)
      collector.push(
        "type",
        `${statePath}.drive`,
        `operating state "${state.id}" drives connector "${connector.id}" in reverse, but the run is one-way`,
        state.drive,
      );
    const seen = new Set<string>();
    state.carriages.forEach((entry, valueIndex) => {
      const valuePath = `${statePath}.carriages[${valueIndex}]`;
      if (!carriageIds.has(entry.carriage))
        collector.push(
          "type",
          `${valuePath}.carriage`,
          `operating state "${state.id}" drives unknown carriage "${entry.carriage}"`,
          entry.carriage,
        );
      if (seen.has(entry.carriage))
        collector.push(
          "type",
          `${valuePath}.carriage`,
          `operating state "${state.id}" drives carriage "${entry.carriage}" twice`,
          entry.carriage,
        );
      seen.add(entry.carriage);
      if (entry.serves !== null && !stops.has(entry.serves))
        collector.push(
          "type",
          `${valuePath}.serves`,
          `operating state "${state.id}" has carriage "${entry.carriage}" serve "${entry.serves}", which is neither an endpoint nor a landing of connector "${connector.id}"`,
          entry.serves,
        );
      const carriage = operation.carriages.find(
        (candidate) => candidate.id === entry.carriage,
      );
      if (carriage === undefined) return;
      if (
        !Number.isFinite(entry.value) ||
        entry.value < carriage.motion.min ||
        entry.value > carriage.motion.max
      )
        collector.push(
          "range",
          `${valuePath}.value`,
          `operating state "${state.id}" drives carriage "${carriage.id}" to ${entry.value}, outside its travel [${carriage.motion.min}, ${carriage.motion.max}]`,
          entry.value,
        );
    });
    for (const carriage of operation.carriages)
      if (!seen.has(carriage.id))
        collector.push(
          "type",
          `${statePath}.carriages`,
          `operating state "${state.id}" gives carriage "${carriage.id}" no value`,
          carriage.id,
        );
  });
  if (!operation.states.some((state) => state.id === operation.state))
    collector.push(
      "type",
      `${base}.state`,
      `current operating state "${operation.state}" does not resolve`,
      operation.state,
    );
};

/**
 * Refuse a carriage that does not stand in the space its state says it serves.
 *
 * A named stop is a claim about geometry, so it is settled against geometry:
 * the state is applied, the element the carriage drives is placed, and its own
 * origin has to land inside the space. A space that bounds nothing is skipped
 * rather than failed, because a purely semantic container has no inside for the
 * car to be in and refusing it would outlaw a run through an unbounded region.
 *
 * Every other member stands where the environment's current state puts it, the
 * same rule the swept envelope follows, so a state is measured as the one
 * change it makes rather than against a configuration nothing declared.
 */
const validateCarriageService = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: ViolationCollector,
): void => {
  const staged = operationDeltas(environment);
  environment.connectors.forEach((connector, index) => {
    const operation = connector.operation;
    if (operation === undefined) return;
    operation.states.forEach((state, stateIndex) => {
      const claims: Array<{ space: string; carriage: string; at: number }> = [];
      state.carriages.forEach((entry, valueIndex) => {
        if (
          entry.serves === null ||
          !spaceSubtreeIsBounded(environment, entry.serves)
        )
          return;
        claims.push({
          space: entry.serves,
          carriage: entry.carriage,
          at: valueIndex,
        });
      });
      // Placing every element of the work is the expensive half, so a state
      // that claims no bounded space never pays for it.
      if (claims.length === 0) return;
      const deltas = new Map(staged);
      applyCarriageState(operation.carriages, state, deltas);
      const matrices = worldMatricesOf(environment, deltas);
      for (const claim of claims) {
        const carriage = operation.carriages.find(
          (candidate) => candidate.id === claim.carriage,
        )!;
        const world = matrices.get(carriage.element)!;
        const point: IAutoMovieVector3 = {
          x: world[12]!,
          y: world[13]!,
          z: world[14]!,
        };
        if (
          builtEnvironmentContainsPoint(environment, claim.space, point) ===
          false
        )
          collector.push(
            "range",
            `${root}.connectors[${index}].operation.states[${stateIndex}].carriages[${claim.at}].serves`,
            `operating state "${state.id}" stands carriage "${carriage.id}" at (${point.x}, ${point.y}, ${point.z}), which is outside the space "${claim.space}" it serves`,
            claim.space,
          );
      }
    });
  });
};

/**
 * Refuse a configuration the scene could not stage, in any state the record
 * names.
 *
 * A staged node is world TRS, so a composed hierarchy carrying shear cannot be
 * lowered without silently dropping it. Checking only the state the record
 * currently stands in would let a door pass shut and lie open: the same
 * revolute leaf below a non-uniformly scaled ancestor is a clean rigid frame at
 * rest and a sheared one a quarter turn later, and both the staged set and the
 * placement queries would answer with a decomposition that never existed.
 *
 * Only the subtree a state actually moves is re-checked. A delta rides down
 * from the element it drives, so nothing above or beside it can change, and
 * measuring the untouched remainder once per state would be the same answer
 * paid for again.
 */
const validateStagedConfigurations = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: ViolationCollector,
): void => {
  const staged = operationDeltas(environment);
  const base = worldMatricesOf(environment, staged);
  environment.elements.forEach((element, index) => {
    if (isSheared(base.get(element.id)!))
      collector.push(
        "type",
        `${root}.elements[${index}].transform`,
        "the composed hierarchy contains shear, which cannot be lowered to the scene's world TRS; keep rotated descendants below uniformly scaled ancestors",
        element.transform,
      );
  });

  /** Report the elements one alternative configuration would shear. */
  const alternative = (props: {
    path: string;
    state: string;
    moved: readonly string[];
    deltas: Map<string, number[]>;
  }): void => {
    const touched = descendantElements(environment, props.moved);
    const matrices = worldMatricesOf(environment, props.deltas);
    for (const id of touched)
      if (isSheared(matrices.get(id)!)) {
        collector.push(
          "type",
          props.path,
          `operating state "${props.state}" composes shear into element "${id}", which cannot be lowered to the scene's world TRS; keep rotated descendants below uniformly scaled ancestors`,
          props.state,
        );
        return;
      }
  };
  environment.openings.forEach((opening, index) => {
    const operation = opening.operation;
    if (operation === undefined) return;
    operation.states.forEach((state, stateIndex) => {
      if (state.id === operation.state) return;
      const deltas = new Map(staged);
      applyPanelState(operation.panels, state, deltas);
      alternative({
        path: `${root}.openings[${index}].operation.states[${stateIndex}]`,
        state: state.id,
        moved: operation.panels.map((panel) => panel.element),
        deltas,
      });
    });
  });
  environment.connectors.forEach((connector, index) => {
    const operation = connector.operation;
    if (operation === undefined) return;
    operation.states.forEach((state, stateIndex) => {
      if (state.id === operation.state) return;
      const deltas = new Map(staged);
      applyCarriageState(operation.carriages, state, deltas);
      alternative({
        path: `${root}.connectors[${index}].operation.states[${stateIndex}]`,
        state: state.id,
        moved: operation.carriages.map((carriage) => carriage.element),
        deltas,
      });
    });
  });
};

/** Whether a world matrix carries more than a position, rotation, and scale. */
const isSheared = (world: number[]): boolean => {
  const decomposed = Matrix4.decompose(world);
  const recomposed = Matrix4.compose(
    decomposed.position,
    Quaternion.normalize(decomposed.rotation),
    decomposed.scale,
  );
  const magnitude = Math.max(1, ...world.map((value) => Math.abs(value)));
  const difference = Math.max(
    ...world.map((value, index) => Math.abs(value - recomposed[index]!)),
  );
  return difference > magnitude * MATRIX_ROUND_TRIP_EPSILON;
};

/** Whether a logical space or any space under it bounds a volume at all. */
const spaceSubtreeIsBounded = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): boolean => {
  const included = descendantSpaces(environment.spaces, spaceId);
  return environment.spaces.some(
    (space) => included.has(space.id) && builtSpaceStatesVolume(space),
  );
};

/**
 * A closed boundary, held to exactly what makes its inside a fact.
 *
 * Three things are checked and nothing is repaired. Every index must name a
 * vertex the shell carries, and every face must have area, because a face
 * nobody can look up or that is a line contributes a solid angle of nothing to
 * a query that would then answer confidently. The surface must be **closed**:
 * each directed edge appears exactly once and its own reverse exactly once, so
 * a missing facet is a hole through which inside leaks into outside, and a
 * duplicated one is a facet counted twice. And the enclosed volume must be
 * positive, which is how "wound counter-clockwise seen from outside" is
 * actually checked: a shell turned inside out passes every local test and
 * answers the exact opposite of the truth for every point in the building.
 */
const validateSpaceShell = (
  shell: IAutoMovieSpaceShell,
  path: string,
  collector: ViolationCollector,
): void => {
  shell.vertices.forEach((vertex, index) => {
    finiteVector(
      vertex,
      `${path}.vertices[${index}]`,
      "shell vertex",
      collector,
    );
  });
  if (shell.vertices.length < 4)
    collector.push(
      "range",
      `${path}.vertices`,
      `a closed shell needs at least 4 vertices, but had ${shell.vertices.length}`,
      shell.vertices.length,
    );
  if (shell.triangles.length < 12 || shell.triangles.length % 3 !== 0) {
    collector.push(
      "range",
      `${path}.triangles`,
      `a closed shell needs at least 4 triangles as whole index triples, but had ${shell.triangles.length} indices`,
      shell.triangles.length,
    );
    return;
  }
  const bad = shell.triangles.findIndex(
    (index) =>
      Number.isSafeInteger(index) === false ||
      index < 0 ||
      index >= shell.vertices.length,
  );
  if (bad !== -1) {
    collector.push(
      "range",
      `${path}.triangles[${bad}]`,
      `shell triangle index must name one of the ${shell.vertices.length} vertices, but was ${shell.triangles[bad]}`,
      shell.triangles[bad],
    );
    return;
  }
  const edges = new Map<string, number>();
  for (let face = 0; face < shell.triangles.length; face += 3) {
    const corners = [
      shell.triangles[face]!,
      shell.triangles[face + 1]!,
      shell.triangles[face + 2]!,
    ];
    const a = shell.vertices[corners[0]!]!;
    const b = shell.vertices[corners[1]!]!;
    const c = shell.vertices[corners[2]!]!;
    if (
      Vector3.length(
        Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)),
      ) <= PLANE_NORMAL_EPSILON
    ) {
      collector.push(
        "range",
        `${path}.triangles[${face}]`,
        `shell triangle ${face / 3} encloses no area, so it bounds nothing`,
        corners,
      );
      return;
    }
    for (let corner = 0; corner < 3; ++corner) {
      const key = `${corners[corner]}>${corners[(corner + 1) % 3]}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  const open = [...edges.entries()].find(
    ([key, count]) =>
      count !== 1 || edges.get(key.split(">").reverse().join(">")) !== 1,
  );
  if (open !== undefined) {
    collector.push(
      "type",
      `${path}.triangles`,
      `shell is not closed: directed edge ${open[0]} is not matched by exactly one facet and one opposite facet`,
      open[0],
    );
    return;
  }
  const volume = builtSpaceShellVolume(shell);
  if (volume <= 0)
    collector.push(
      "range",
      `${path}.triangles`,
      "shell encloses no positive volume: wind its facets counter-clockwise seen from outside the solid",
      volume,
    );
};

/** The spaces one run serves, in the order its own route reaches them. */
const connectorStops = (connector: IAutoMovieBuiltConnector): string[] => [
  connector.from,
  ...(connector.landings ?? []).map((landing) => landing.space),
  connector.to,
];

/** The named elements and every element below them. */
const descendantElements = (
  environment: IAutoMovieBuiltEnvironment,
  roots: readonly string[],
): Set<string> => {
  const owned = new Set<string>(roots);
  if (owned.size === 0) return owned;
  let changed = true;
  while (changed) {
    changed = false;
    for (const element of environment.elements)
      if (
        element.parent !== null &&
        owned.has(element.parent) &&
        !owned.has(element.id)
      ) {
        owned.add(element.id);
        changed = true;
      }
  }
  return owned;
};

/** Validate a connector's stations, section spelling, slope, and steps. */
const validateConnectorShape = (
  connector: IAutoMovieBuiltConnector,
  path: string,
  collector: ViolationCollector,
): void => {
  const measurable =
    connector.route.length >= 2 &&
    connector.route.every((point) =>
      [point.x, point.y, point.z].every(Number.isFinite),
    );
  if (measurable)
    for (let index = 0; index + 1 < connector.route.length; ++index)
      if (
        Vector3.length(
          Vector3.subtract(
            connector.route[index + 1]!,
            connector.route[index]!,
          ),
        ) <= ROUTE_EPSILON
      )
        collector.push(
          "range",
          `${path}.route[${index + 1}]`,
          "consecutive connector route stations must be distinct",
          connector.route[index + 1],
        );
  if (connector.orientations !== undefined) {
    if (connector.orientations.length !== connector.route.length)
      collector.push(
        "type",
        `${path}.orientations`,
        `a connector states ${connector.orientations.length} station facings for ${connector.route.length} route points`,
        connector.orientations.length,
      );
    connector.orientations.forEach((rotation, index) =>
      unitQuaternion(
        rotation,
        `${path}.orientations[${index}]`,
        "connector station facing",
        collector,
      ),
    );
  }

  const scalar =
    connector.width !== undefined || connector.clearHeight !== undefined;
  if (connector.sections !== undefined && scalar)
    collector.push(
      "type",
      `${path}.sections`,
      "a connector states a constant width and clear height or a varying section, never both",
      connector.sections.length,
    );
  else if (connector.sections === undefined && !scalar)
    collector.push(
      "range",
      `${path}.width`,
      "a connector must state a constant width and clear height, or a varying section",
      null,
    );
  else if (scalar) {
    positive(connector.width, `${path}.width`, "connector width", collector);
    positive(
      connector.clearHeight,
      `${path}.clearHeight`,
      "connector clear height",
      collector,
    );
  } else
    validateConnectorSections(
      connector.sections!,
      `${path}.sections`,
      collector,
    );

  const metrics = measurable ? routeMetrics(connector.route) : null;
  if (connector.slope !== undefined) {
    if (
      !Number.isFinite(connector.slope) ||
      connector.slope < 0 ||
      connector.slope > Math.PI / 2
    )
      collector.push(
        "range",
        `${path}.slope`,
        `connector slope must be a finite number within [0, PI / 2], but was ${connector.slope}`,
        connector.slope,
      );
    else if (
      metrics !== null &&
      Math.abs(connector.slope - metrics.slope) > SLOPE_TOLERANCE
    )
      collector.push(
        "range",
        `${path}.slope`,
        `connector states a slope of ${connector.slope} radians, but its own route rises at ${metrics.slope}`,
        connector.slope,
      );
  }
  if (connector.steps !== undefined) {
    const steps = connector.steps;
    const before = collector.items.length;
    if (!Number.isSafeInteger(steps.count) || steps.count < 1)
      collector.push(
        "range",
        `${path}.steps.count`,
        `a stepped connector needs a safe integer step count >= 1, but had ${steps.count}`,
        steps.count,
      );
    positive(steps.rise, `${path}.steps.rise`, "step rise", collector);
    positive(steps.run, `${path}.steps.run`, "step run", collector);
    if (collector.items.length === before && metrics !== null) {
      if (
        Math.abs(steps.count * steps.rise - Math.abs(metrics.rise)) >
        STEP_TOLERANCE
      )
        collector.push(
          "range",
          `${path}.steps.rise`,
          `${steps.count} steps of ${steps.rise} m climb ${steps.count * steps.rise} m, but the route climbs ${Math.abs(metrics.rise)} m`,
          steps.rise,
        );
      if (Math.abs(steps.count * steps.run - metrics.run) > STEP_TOLERANCE)
        collector.push(
          "range",
          `${path}.steps.run`,
          `${steps.count} steps of ${steps.run} m run ${steps.count * steps.run} m, but the route runs ${metrics.run} m`,
          steps.run,
        );
    }
  }
};

/** Validate a connector's varying section stations. */
const validateConnectorSections = (
  sections: readonly IAutoMovieConnectorSection[],
  path: string,
  collector: ViolationCollector,
): void => {
  if (sections.length < 2) {
    collector.push(
      "range",
      path,
      `a varying connector section needs at least 2 stations, but had ${sections.length}`,
      sections.length,
    );
    return;
  }
  if (sections[0]!.at !== 0)
    collector.push(
      "range",
      `${path}[0].at`,
      `a varying connector section must begin at 0, but began at ${sections[0]!.at}`,
      sections[0]!.at,
    );
  const last = sections.length - 1;
  if (sections[last]!.at !== 1)
    collector.push(
      "range",
      `${path}[${last}].at`,
      `a varying connector section must end at 1, but ended at ${sections[last]!.at}`,
      sections[last]!.at,
    );
  sections.forEach((section, index) => {
    if (index > 0 && !(section.at > sections[index - 1]!.at))
      collector.push(
        "range",
        `${path}[${index}].at`,
        `connector section stations must strictly increase, but ${section.at} followed ${sections[index - 1]!.at}`,
        section.at,
      );
    positive(
      section.width,
      `${path}[${index}].width`,
      "section width",
      collector,
    );
    positive(
      section.clearHeight,
      `${path}[${index}].clearHeight`,
      "section clear height",
      collector,
    );
  });
};

/** Cumulative 3D arc length at each route station, starting at zero. */
const cumulativeRouteLengths = (
  route: readonly IAutoMovieVector3[],
): number[] => {
  const lengths = [0];
  for (let index = 0; index + 1 < route.length; ++index)
    lengths.push(
      lengths[index]! +
        Vector3.length(Vector3.subtract(route[index + 1]!, route[index]!)),
    );
  return lengths;
};

/**
 * The point one arc-length fraction reaches along a route polyline.
 *
 * Measuring by arc length rather than by point index is what keeps a landing on
 * an unevenly spaced route where its author put it, exactly as a connector
 * section is placed. Only {@link builtConnectorGeometry} calls this, and it has
 * already refused a route with no measurable length, so the segment the
 * fraction falls in always exists.
 */
const routePointAt = (
  route: readonly IAutoMovieVector3[],
  cumulative: readonly number[],
  total: number,
  at: number,
): IAutoMovieVector3 => {
  const target = at * total;
  let index = 0;
  while (index + 2 < route.length && cumulative[index + 1]! < target)
    index += 1;
  const span = cumulative[index + 1]! - cumulative[index]!;
  const ratio = span <= 0 ? 0 : (target - cumulative[index]!) / span;
  const from = route[index]!;
  const to = route[index + 1]!;
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
    z: from.z + (to.z - from.z) * ratio,
  };
};

/** Climb, horizontal run, 3D length, and slope of one route polyline. */
const routeMetrics = (
  route: readonly IAutoMovieVector3[],
): { rise: number; run: number; length: number; slope: number } => {
  let run = 0;
  let length = 0;
  for (let index = 0; index + 1 < route.length; ++index) {
    const delta = Vector3.subtract(route[index + 1]!, route[index]!);
    run += Math.hypot(delta.x, delta.z);
    length += Vector3.length(delta);
  }
  const rise = route[route.length - 1]!.y - route[0]!.y;
  return { rise, run, length, slope: Math.atan2(Math.abs(rise), run) };
};

/**
 * Refuse a closed leaf that does not fit the void it fills.
 *
 * The leaf is measured where it actually rests, projected into the host
 * boundary's own frame, so a leaf and a void authored in unrelated coordinates
 * disagree here instead of at render time. Nothing is said about a leaf smaller
 * than its void: two leaves sharing one opening, or a sash inside a frame, are
 * ordinary designs, while a leaf larger than its own hole is not a design at
 * all.
 *
 * Only the two in-plane coordinates are compared. How far the leaf sits in
 * front of or behind the face is a design freedom, not an error: a leaf in a
 * rebate, a storm sash outside the frame, and a surface-mounted sliding leaf
 * all rest off the face's own plane on purpose.
 *
 * Containment is the same test a void gets against its face, so a leaf that
 * spans the notch of a concave void is refused even though each of its corners
 * is inside.
 */
const validatePanelFit = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  faces: ReadonlyMap<string, IAutoMovieBoundaryFace>,
  hulls: ReadonlyMap<number, IAutoMoviePlanarPoint[]>,
  collector: ViolationCollector,
): void => {
  const matrices = worldMatricesOf(environment);
  environment.openings.forEach((opening, index) => {
    const operation = opening.operation;
    const hull = hulls.get(index);
    const face = faces.get(opening.boundary);
    if (operation === undefined || hull === undefined || face === undefined)
      return;
    const inverse = Quaternion.inverse(face.rotation);
    operation.panels.forEach((panel, panelIndex) => {
      const world = matrices.get(panel.element)!;
      const corners: IAutoMovieVector3[] = [
        { x: 0, y: 0, z: 0 },
        { x: panel.width, y: 0, z: 0 },
        { x: panel.width, y: panel.height, z: 0 },
        { x: 0, y: panel.height, z: 0 },
      ];
      const planar = corners.map((corner) => {
        const local = Quaternion.rotateVector(
          inverse,
          Vector3.subtract(applyMatrix(world, corner), face.origin),
        );
        return { x: local.x, y: local.y };
      });
      if (polygonInside(planar, hull) === false)
        collector.push(
          "range",
          `${root}.openings[${index}].operation.panels[${panelIndex}]`,
          `panel "${panel.id}" does not fit inside the void of opening "${opening.id}" when it rests closed`,
          { width: panel.width, height: panel.height },
        );
    });
  });
};

/** Apply a column-major matrix to a point. */
const applyMatrix = (
  matrix: readonly number[],
  point: IAutoMovieVector3,
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

/** Apply a column-major matrix's linear part to a direction. */
const applyDirection = (
  matrix: readonly number[],
  vector: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: matrix[0]! * vector.x + matrix[4]! * vector.y + matrix[8]! * vector.z,
  y: matrix[1]! * vector.x + matrix[5]! * vector.y + matrix[9]! * vector.z,
  z: matrix[2]! * vector.x + matrix[6]! * vector.y + matrix[10]! * vector.z,
});

/** The world bounds one leaf corner reaches across a panel's whole travel. */
const sweptCornerBounds = (
  base: readonly number[],
  motion: IAutoMovieTravelMotion,
  corner: IAutoMovieVector3,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
  const axis = Vector3.normalize(motion.axis);
  if (motion.kind === "prismatic") {
    const ends = [motion.min, motion.max].map((value) =>
      applyMatrix(base, Vector3.add(corner, Vector3.scale(axis, value))),
    );
    return boundsOf(ends);
  }
  const offset = Vector3.subtract(corner, motion.pivot);
  const along = Vector3.scale(axis, Vector3.dot(axis, offset));
  const center = applyMatrix(base, Vector3.add(motion.pivot, along));
  const cosine = applyDirection(base, Vector3.subtract(offset, along));
  const sine = applyDirection(base, Vector3.cross(axis, offset));
  const reach = (component: "x" | "y" | "z"): { low: number; high: number } => {
    const phase = Math.atan2(sine[component], cosine[component]);
    const angles = [motion.min, motion.max];
    const first = Math.ceil((motion.min - phase) / Math.PI);
    const last = Math.floor((motion.max - phase) / Math.PI);
    for (let step = first; step <= last; ++step)
      angles.push(phase + step * Math.PI);
    const values = angles.map(
      (angle) =>
        center[component] +
        cosine[component] * Math.cos(angle) +
        sine[component] * Math.sin(angle),
    );
    return { low: Math.min(...values), high: Math.max(...values) };
  };
  const x = reach("x");
  const y = reach("y");
  const z = reach("z");
  return {
    min: { x: x.low, y: y.low, z: z.low },
    max: { x: x.high, y: y.high, z: z.high },
  };
};

/**
 * The axis-aligned box containing every given point.
 *
 * Folded rather than spread through `Math.min`, because the callers are no
 * longer only the four corners of a leaf: measuring a space's contents hands
 * this every vertex the space draws, and a spread of that many arguments is a
 * stack overflow rather than a slow answer.
 */
const boundsOf = (
  points: readonly IAutoMovieVector3[],
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const point of points) {
    min.x = Math.min(min.x, point.x);
    min.y = Math.min(min.y, point.y);
    min.z = Math.min(min.z, point.z);
    max.x = Math.max(max.x, point.x);
    max.y = Math.max(max.y, point.y);
    max.z = Math.max(max.z, point.z);
  }
  return { min, max };
};

  "passage",
  "stair",
  "ramp",
  "lift",
  "escalator",
  "moving-walk",
  "ladder",
  "bridge",
  "other",
] as const;
/** The three ways a powered run may stand: driven either way, or not at all. */
const CONNECTOR_DRIVES = ["forward", "reverse", "still"] as const;

const MATRIX_ROUND_TRIP_EPSILON = 1e-8;

/** Largest deviation from unit norm a stated quaternion may carry. */
const UNIT_QUATERNION_EPSILON = 1e-6;

/** Shortest distance, in metres, two consecutive route stations may sit apart. */
const ROUTE_EPSILON = 1e-9;

/** Largest disagreement, in metres, between a stated step run and its route. */
const STEP_TOLERANCE = 1e-3;

/** Largest disagreement, in radians, between a stated slope and its route. */
const SLOPE_TOLERANCE = 1e-6;

const positiveInteger = (
  value: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isSafeInteger(value) || value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be an integer > 0, but was ${value}`,
      value,
    );
};

const unitQuaternion = (
  value: IAutoMovieQuaternion,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  const norm = Math.hypot(value.x, value.y, value.z, value.w);
  if (!Number.isFinite(norm) || Math.abs(norm - 1) > UNIT_QUATERNION_EPSILON)
    collector.push(
      "range",
      path,
      `${label} must be a unit quaternion, but its norm was ${norm}`,
      value,
    );
};

/**
 * Whether a closed planar outline names distinct, finite corners.
 *
 * The minimum corner count differs by what the outline may carry: a straight
 * face needs three, while an outline whose edges may bulge needs only two,
 * because a full circle is two half-turn arcs and demanding a third corner
 * would outlaw a round oculus for no geometric reason.
 */
const closedOutline = (
  outline: readonly IAutoMoviePlanarPoint[],
  least: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): boolean => {
  if (outline.length < least) {
    collector.push(
      "range",
      path,
      `${label} needs at least ${least} points, but had ${outline.length}`,
      outline.length,
    );
    return false;
  }
  let finite = true;
  outline.forEach((point, index) => {
    for (const axis of ["x", "y"] as const)
      if (!Number.isFinite(point[axis])) {
        finite = false;
        collector.push(
          "range",
          `${path}[${index}].${axis}`,
          `${label} ${axis} must be finite, but was ${point[axis]}`,
          point[axis],
        );
      }
  });
  if (!finite) return false;
  if (polygonShortestEdge(outline) <= PLANAR_EPSILON) {
    collector.push(
      "range",
      path,
      `${label} must not repeat a point at consecutive corners`,
      outline,
    );
    return false;
  }
  return true;
};

/**
 * Whether a closed region is one an inside test can be run against.
 *
 * Real area and no self-crossing are not stylistic demands: without them
 * "inside this region" has no answer, and every later containment or separation
 * result would be arbitrary rather than merely wrong.
 */
const closedRegion = (
  region: readonly IAutoMoviePlanarPoint[],
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (Math.abs(polygonDoubleArea(region)) <= PLANAR_EPSILON)
    collector.push("range", path, `${label} encloses no area`, region);
  else if (polygonIsSimple(region) === false)
    collector.push("type", path, `${label} must not cross itself`, region);
};

/**
 * Validate the one degree of freedom a moving member travels on.
 *
 * The label names what is moving so the refusal reads as the author wrote it: a
 * door leaf and a lift car share this arithmetic, and a message that called a
 * car a panel would send its author looking through the openings for it.
 */
const validateTravelMotion = (
  motion: IAutoMovieTravelMotion,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  finiteVector(motion.axis, `${path}.axis`, `${label} travel axis`, collector);
  if (Vector3.length(motion.axis) <= PLANE_NORMAL_EPSILON)
    collector.push(
      "range",
      `${path}.axis`,
      `${label} travel axis must be non-zero`,
      motion.axis,
    );
  if (motion.kind === "revolute")
    finiteVector(motion.pivot, `${path}.pivot`, `${label} pivot`, collector);
  if (!Number.isFinite(motion.min) || motion.min > 0)
    collector.push(
      "range",
      `${path}.min`,
      `${label} travel is measured from its rest pose, so the lowest value must be a finite number <= 0, but was ${motion.min}`,
      motion.min,
    );
  if (!Number.isFinite(motion.max) || motion.max < 0)
    collector.push(
      "range",
      `${path}.max`,
      `${label} travel is measured from its rest pose, so the highest value must be a finite number >= 0, but was ${motion.max}`,
      motion.max,
    );
  else if (motion.max <= motion.min)
    collector.push(
      "range",
      `${path}.max`,
      `a movable ${label} needs travel, but its range was [${motion.min}, ${motion.max}]`,
      motion.max,
    );
  else if (
    motion.kind === "revolute" &&
    motion.max - motion.min > 2 * Math.PI + FULL_TURN_EPSILON
  )
    collector.push(
      "range",
      `${path}.max`,
      `a turning ${label} may travel at most a full turn, but its range spanned ${motion.max - motion.min} radians`,
      motion.max,
    );
};

/** Whether a world matrix carries more than a position, rotation, and scale. */
const isSheared = (world: number[]): boolean => {
  const decomposed = Matrix4.decompose(world);
  const recomposed = Matrix4.compose(
    decomposed.position,
    Quaternion.normalize(decomposed.rotation),
    decomposed.scale,
  );
  const magnitude = Math.max(1, ...world.map((value) => Math.abs(value)));
  const difference = Math.max(
    ...world.map((value, index) => Math.abs(value - recomposed[index]!)),
  );
  return difference > magnitude * MATRIX_ROUND_TRIP_EPSILON;
};

/** Whether a logical space or any space under it bounds a volume at all. */
const spaceSubtreeIsBounded = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): boolean => {
  const included = descendantSpaces(environment.spaces, spaceId);
  return environment.spaces.some(
    (space) => included.has(space.id) && builtSpaceStatesVolume(space),
  );
};

/** The named elements and every element below them. */
const descendantElements = (
  environment: IAutoMovieBuiltEnvironment,
  roots: readonly string[],
): Set<string> => {
  const owned = new Set<string>(roots);
  if (owned.size === 0) return owned;
  let changed = true;
  while (changed) {
    changed = false;
    for (const element of environment.elements)
      if (
        element.parent !== null &&
        owned.has(element.parent) &&
        !owned.has(element.id)
      ) {
        owned.add(element.id);
        changed = true;
      }
  }
  return owned;
};

/** Validate a connector's varying section stations. */
const validateConnectorSections = (
  sections: readonly IAutoMovieConnectorSection[],
  path: string,
  collector: ViolationCollector,
): void => {
  if (sections.length < 2) {
    collector.push(
      "range",
      path,
      `a varying connector section needs at least 2 stations, but had ${sections.length}`,
      sections.length,
    );
    return;
  }
  if (sections[0]!.at !== 0)
    collector.push(
      "range",
      `${path}[0].at`,
      `a varying connector section must begin at 0, but began at ${sections[0]!.at}`,
      sections[0]!.at,
    );
  const last = sections.length - 1;
  if (sections[last]!.at !== 1)
    collector.push(
      "range",
      `${path}[${last}].at`,
      `a varying connector section must end at 1, but ended at ${sections[last]!.at}`,
      sections[last]!.at,
    );
  sections.forEach((section, index) => {
    if (index > 0 && !(section.at > sections[index - 1]!.at))
      collector.push(
        "range",
        `${path}[${index}].at`,
        `connector section stations must strictly increase, but ${section.at} followed ${sections[index - 1]!.at}`,
        section.at,
      );
    positive(
      section.width,
      `${path}[${index}].width`,
      "section width",
      collector,
    );
    positive(
      section.clearHeight,
      `${path}[${index}].clearHeight`,
      "section clear height",
      collector,
    );
  });
};

/** Apply a column-major matrix's linear part to a direction. */
const applyDirection = (
  matrix: readonly number[],
  vector: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: matrix[0]! * vector.x + matrix[4]! * vector.y + matrix[8]! * vector.z,
  y: matrix[1]! * vector.x + matrix[5]! * vector.y + matrix[9]! * vector.z,
  z: matrix[2]! * vector.x + matrix[6]! * vector.y + matrix[10]! * vector.z,
});
