import {
  Quaternion,
  SOFT_MAX_PARTICLES,
  Vector3,
  validateSoftBodyDomain,
} from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieSoftBodyDomain,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Build a one-wide, world-space soft body from a model's declared span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cord inherits the line's radius, length and moving endpoints. The rest shape is a symmetric two-leg polyline with the supplied length.
 * @evidence contracts/development/implementation.md#principled-implementation The sag is the altitude of an isosceles triangle with legs of half the rest length and a base of the endpoint distance. Projected gravity or a perpendicular basis fixes its plane. Each segment contributes half its mass to each adjoining particle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the span, place its endpoints, discretize its rest shape, then apply the engine's domain admission.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown line, missing declared length, overextended starting pose or invalid soft domain is refused. The seed shape establishes rest distances without claiming equilibrium or disabling the caller's bend settings.
 * @evidence contracts/development/implementation.md#efficient-algorithms One model span lookup and one O(links) discretization plus the engine's lattice and collider admission. No pose, time integration or search is run here.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The model resolves both endpoints together and the engine owns soft-body admission.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only the domain, its prop placement and span identities, with one particle more than the link count.
 */
export function HumanObjectCord(
  model: IAutoMovieMotionHumanObject.ISpanModel,
  id: string,
  props: IAutoMovieMotionHumanObject.ICord,
): IAutoMovieMotionHumanProp {
  const declaration: IAutoMovieMotionHumanObject.ISpanModel["spans"][number] | undefined =
    model.spans.find(
      (span: IAutoMovieMotionHumanObject.ISpanModel["spans"][number]): boolean =>
        span.id === id,
    );
  if (
    declaration === undefined ||
    declaration.length === null ||
    !Number.isFinite(declaration.length) ||
    declaration.length <= 0
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "span",
      value: id,
      reason: `the span "${id}" has no positive declared rest length`,
      fix: "name a span with a positive rest length",
    });
  if (
    !Number.isSafeInteger(props.links) ||
    props.links < 2 ||
    props.links >= SOFT_MAX_PARTICLES
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "links",
      value: props.links,
      feasible: {
        kind: "range",
        minimum: 2,
        maximum: SOFT_MAX_PARTICLES - 1,
        unit: "links",
        whole: true,
      },
      reason: "the cord needs at least two links and one particle per joint",
      fix: "choose a link count within the engine's particle budget",
    });
  if (props.subject === props.owner.subject)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "subject",
      value: props.subject,
      reason: "the cord and the prop that carries its endpoints need distinct subjects",
      fix: "give the cord its own subject id",
    });

  const ends: IAutoMovieMotionHumanObject.ISpanEnds = model.span(id);
  const frame: IAutoMovieRigidTransform =
    props.owner.motion?.(0) ?? props.owner.frame;
  const from: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, ends.from),
  );
  const to: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, ends.to),
  );
  const length: number = declaration.length;
  const chord: IAutoMovieVector3 = Vector3.subtract(ends.to, ends.from);
  const distance: number = Vector3.length(chord);
  if (!(distance > 0 && distance <= length))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "span",
      value: id,
      reason: `the starting endpoints must leave a positive span no longer than its ${length} m rest length`,
      fix: "start with distinct endpoints within the declared cord length",
    });

  // The line's declared rest length is the sum of two equal sides. Use
  // gravity projected into the chord's normal plane to lay the bend below it.
  const half: number = length / 2;
  const fraction: number = distance / length;
  const sag: number = half * Math.sqrt((1 - fraction) * (1 + fraction));
  const axis: IAutoMovieVector3 = Vector3.normalize(
    Quaternion.rotateVector(frame.rotation, chord),
  );
  const middle: IAutoMovieVector3 = Vector3.add(
    Vector3.lerp(from, to, 0.5),
    Vector3.scale(sagDirection(axis, props.solver.gravity), sag),
  );
  const leftLinks: number = Math.floor(props.links / 2);
  const rightLinks: number = props.links - leftLinks;
  const leftMass: number = props.mass / 2 / leftLinks;
  const rightMass: number = props.mass / 2 / rightLinks;
  const rest: number[] = [];
  const mass: number[] = [];
  for (let particle: number = 0; particle <= props.links; ++particle) {
    const point: IAutoMovieVector3 =
      particle === props.links
        ? to
        : particle <= leftLinks
          ? Vector3.lerp(from, middle, particle / leftLinks)
          : Vector3.lerp(middle, to, (particle - leftLinks) / rightLinks);
    rest.push(point.x, point.y, point.z);
    const preceding: number =
      particle === 0 ? 0 : particle <= leftLinks ? leftMass : rightMass;
    const following: number =
      particle === props.links ? 0 : particle < leftLinks ? leftMass : rightMass;
    mass.push(preceding / 2 + following / 2);
  }

  const domain: IAutoMovieSoftBodyDomain = {
    version: 1,
    id: props.subject,
    units: "meter",
    lattice: { columns: 1, rows: props.links + 1 },
    solver: props.solver,
    rest,
    mass,
    anchors: [
      {
        id: "from",
        particle: 0,
        position: null,
        binding: { kind: "node", node: props.owner.subject, offset: ends.from },
      },
      {
        id: "to",
        particle: props.links,
        position: null,
        binding: { kind: "node", node: props.owner.subject, offset: ends.to },
      },
    ],
    states: [],
    colliders: [...(props.colliders ?? [])],
    wind: null,
    selfCollision: props.selfCollision ?? false,
    contact: { thickness: declaration.radius, friction: props.friction },
  };
  const validation: IAutoMovieValidation = validateSoftBodyDomain({ domain });
  if (!validation.success)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "cord",
      value: props.subject,
      reason: validation.violations
        .map(
          (violation: IAutoMovieConstraintViolation): string =>
            `${violation.path}: ${violation.expected}`,
        )
        .join(". "),
      fix: "adjust the cord settings to meet the soft-body domain requirements",
    });
  return {
    subject: props.subject,
    frame,
    points: {},
    soft: domain,
    softSpan: { owner: props.owner.subject, id },
  };
}

/** Use projected gravity, or the least parallel basis axis when it vanishes. */
function sagDirection(
  chord: IAutoMovieVector3,
  gravity: IAutoMovieVector3,
): IAutoMovieVector3 {
  const normal: IAutoMovieVector3 = Vector3.cross(
    Vector3.normalize(gravity),
    chord,
  );
  if (Vector3.length(normal) > 0)
    return Vector3.normalize(Vector3.cross(chord, normal));
  const perpendicular: IAutoMovieVector3 =
    Math.abs(chord.x) <= Math.abs(chord.y) &&
    Math.abs(chord.x) <= Math.abs(chord.z)
      ? { x: 1, y: 0, z: 0 }
      : Math.abs(chord.y) <= Math.abs(chord.z)
        ? { x: 0, y: 1, z: 0 }
        : { x: 0, y: 0, z: 1 };
  return Vector3.normalize(
    Vector3.cross(chord, Vector3.cross(perpendicular, chord)),
  );
}
