import { Quaternion, SOFT_MAX_PARTICLES, Vector3, AutoMovieEngineSoftBody } from "@automovie/engine";
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

/** Build a one-wide, world-space soft body from a model's declared span. */
export function HumanObjectCord(
  model: IAutoMovieMotionHumanObject.ISpanModel,
  id: string,
  props: IAutoMovieMotionHumanObject.ICord,
): IAutoMovieMotionHumanProp {
  const declaration:
    | IAutoMovieMotionHumanObject.ISpanModel["spans"][number]
    | undefined = model.spans.find(
    (span: IAutoMovieMotionHumanObject.ISpanModel["spans"][number]): boolean =>
      span.id === id,
  );
  if (
    declaration === undefined ||
    declaration.length === null ||
    !(declaration.length > 0)
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "span",
      value: id,
      reason: `the span "${id}" has no positive declared rest length`,
      fix: "name a span with a positive rest length",
    });
  if (
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
      reason:
        "the cord and the prop that carries its endpoints need distinct subjects",
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
  const leftLinks: number = Math.floor(props.links / 2);
  const rightLinks: number = props.links - leftLinks;
  const leftMass: number = props.mass / 2 / leftLinks;
  const rightMass: number = props.mass / 2 / rightLinks;
  const rest: number[] = HumanObjectCord.rest(
    id,
    { from, to },
    length,
    props.links,
    props.solver.gravity,
  );
  const mass: number[] = [];
  for (let particle: number = 0; particle <= props.links; ++particle) {
    const preceding: number =
      particle === 0 ? 0 : particle <= leftLinks ? leftMass : rightMass;
    const following: number =
      particle === props.links
        ? 0
        : particle < leftLinks
          ? leftMass
          : rightMass;
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
  const validation: IAutoMovieValidation = AutoMovieEngineSoftBody.validateSoftBodyDomain({ domain });
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
    softSpan: { owner: props.owner.subject, id, length },
  };
}

/** The span cord's seed construction, shared by authoring and placement. */
export namespace HumanObjectCord {
  /**
   * Sample a two-leg rest polyline at the supplied world-space endpoints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the world frame and its two equal rest legs.
   * @evidence contracts/development/implementation.md#principled-implementation Pythagoras gives the height of two half-length legs over the endpoint chord. Projected gravity chooses the plane.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the chord, compute its midpoint and sag, then sample the two legs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An invalid or overextended chord refuses except for rounding of the world-space transform.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in links, with one point per joint.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The result uses this placement's endpoints and has no cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only its new flat coordinate buffer.
   */
  export function rest(
    id: string,
    { from, to }: IAutoMovieMotionHumanObject.ISpanEnds,
    length: number,
    links: number,
    gravity: IAutoMovieVector3,
  ): number[] {
    const chord: IAutoMovieVector3 = Vector3.subtract(to, from);
    const distance: number = Math.hypot(chord.x, chord.y, chord.z);
    const precision: number =
      Number.EPSILON *
      Math.max(
        Math.abs(from.x),
        Math.abs(from.y),
        Math.abs(from.z),
        Math.abs(to.x),
        Math.abs(to.y),
        Math.abs(to.z),
        length,
      );
    if (
      !(length > 0) ||
      !(distance > 0) ||
      distance - length > precision
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "span",
        value: id,
        reason: `the starting endpoints must leave a positive span no longer than its ${length} m rest length`,
        fix: "start with distinct endpoints within the declared cord length",
      });

    const fraction: number = Math.min(1, distance / length);
    const sag: number =
      (length / 2) * Math.sqrt((1 - fraction) * (1 + fraction));
    const axis: IAutoMovieVector3 = {
      x: chord.x / distance,
      y: chord.y / distance,
      z: chord.z / distance,
    };
    const middle: IAutoMovieVector3 = Vector3.add(
      Vector3.lerp(from, to, 0.5),
      Vector3.scale(sagDirection(axis, gravity), sag),
    );
    const leftLinks: number = Math.floor(links / 2);
    const rightLinks: number = links - leftLinks;
    const out: number[] = [from.x, from.y, from.z];
    for (let particle: number = 1; particle < links; ++particle) {
      const point: IAutoMovieVector3 =
        particle <= leftLinks
          ? Vector3.lerp(from, middle, particle / leftLinks)
          : Vector3.lerp(middle, to, (particle - leftLinks) / rightLinks);
      out.push(point.x, point.y, point.z);
    }
    out.push(to.x, to.y, to.z);
    return out;
  }
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
