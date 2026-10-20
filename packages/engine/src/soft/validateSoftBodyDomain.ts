import {
  IAutoMovieSoftAnchor,
  IAutoMovieSoftAnchorPose,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftCollider,
  IAutoMovieSoftNamedState,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { SOFT_MAX_ANCHORS } from "./constants/SOFT_MAX_ANCHORS";
import { SOFT_MAX_COLLIDERS } from "./constants/SOFT_MAX_COLLIDERS";
import { SOFT_MAX_ITERATIONS } from "./constants/SOFT_MAX_ITERATIONS";
import { SOFT_MAX_PARTICLES } from "./constants/SOFT_MAX_PARTICLES";
import { SOFT_MAX_STATES } from "./constants/SOFT_MAX_STATES";
import { SOFT_MAX_STEPS } from "./constants/SOFT_MAX_STEPS";
import { softBodyTravelNumber } from "./softBodyTravelNumber";
import { validateSoftIdentity as identity } from "./validateSoftIdentity";
import { validateSoftInteger as integer } from "./validateSoftInteger";
import { validateSoftNumeric as numeric } from "./validateSoftNumeric";
import { validateSoftRestCoincidence as coincident } from "./validateSoftRestCoincidence";
import { validateSoftVector as vector } from "./validateSoftVector";

/**
 * Validate typed soft-body fields, structural rest edges, reference joins and the authored travel heuristic.
 *
 * @evidence contracts/common.md#principled-implementation Finite scalar and safe-integer rules enforce lattice/array budgets and anchor/state/collider references. Structural right/down rest edges are checked for squared zero length, and an authored dt*referenceSpeed/shortest-edge ratio above one is refused, including arithmetic overflow.
 * @evidence contracts/common.md#clear-and-simple-design The domain owns admission separately from integration; shared primitive validators keep identical diagnostics while body-capsule world resolution remains with the moving-boundary consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Travel admission is a declared heuristic rather than stability or continuous-collision proof. Structural-edge checks do not certify all particle pairs or shear/bend directions, and direct-square magnitudes retain extreme-input limits.
 * @evidence contracts/common.md#meaningful-documentation States typed-record admission, fixed budgets, static rest embedding, moving-capsule deferral and unproved solver properties; malformed array/container shapes can still throw.
 * @evidence contracts/performance.md#efficient-algorithms For P rest particles, A anchors, R state poses and K colliders, validation scans arrays/structural edges and reference sets, while static embedding is O(P*K); local sets and findings grow with those supplied populations, even when an over-budget input is reported.
 * @evidence contracts/performance.md#reuse-equivalent-work One shortest structural-edge scan supplies the travel measure, and canonical primitive admission helpers replace duplicate rules; mutable rest arrays and references are rescanned rather than cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The collector and reference sets belong to the call; returned findings can retain authored offending values, while no integrated states, actor poses or host resources are retained.
 */
export const validateSoftBodyDomain: (props: {
  domain: IAutoMovieSoftBodyDomain;
}) => IAutoMovieValidation = (props: {
  domain: IAutoMovieSoftBodyDomain;
}): IAutoMovieValidation => {
  const { domain }: typeof props = props;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";

  if (domain.id.trim().length === 0)
    out.push("type", `${root}.id`, "soft body id must be non-empty", domain.id);
  if (domain.version !== 1)
    out.push(
      "type",
      `${root}.version`,
      `soft body schema version must be 1, but was ${String(domain.version)}`,
      domain.version,
    );
  if (domain.units !== "meter")
    out.push(
      "type",
      `${root}.units`,
      `soft body units must be "meter", but was ${String(domain.units)}`,
      domain.units,
    );

  const columns: number = domain.lattice.columns;
  const rows: number = domain.lattice.rows;
  integer(
    out,
    `${root}.lattice.columns`,
    "lattice columns",
    columns,
    1,
    Infinity,
  );
  integer(out, `${root}.lattice.rows`, "lattice rows", rows, 1, Infinity);
  const count: number = columns * rows;
  // Finite rather than a safe integer: a lattice whose particle count has run
  // past the exactly representable integers is the largest lattice anyone can
  // declare, and requiring exactness here let precisely those through the cap
  // that exists to stop them.
  if (Number.isFinite(count) && count > SOFT_MAX_PARTICLES)
    out.push(
      "range",
      `${root}.lattice`,
      `a soft body lattice may hold at most ${SOFT_MAX_PARTICLES} particles, but declared ${count}`,
      count,
      count - SOFT_MAX_PARTICLES,
    );
  if (Number.isSafeInteger(count) && count < 2)
    out.push(
      "range",
      `${root}.lattice`,
      "a soft body lattice must hold at least two particles, or it carries no constraint at all",
      count,
    );

  numeric(
    out,
    `${root}.solver.fixedStepSeconds`,
    "fixed step",
    domain.solver.fixedStepSeconds,
    0,
    true,
    Infinity,
  );
  for (const axis of ["x", "y", "z"] as const)
    numeric(
      out,
      `${root}.solver.gravity.${axis}`,
      `gravity ${axis}`,
      domain.solver.gravity[axis],
      -Infinity,
      false,
      Infinity,
    );
  numeric(
    out,
    `${root}.solver.drag`,
    "drag",
    domain.solver.drag,
    0,
    false,
    Infinity,
  );
  integer(
    out,
    `${root}.solver.iterations`,
    "relaxation iterations",
    domain.solver.iterations,
    1,
    SOFT_MAX_ITERATIONS,
  );
  for (const family of ["structural", "shear", "bend"] as const)
    numeric(
      out,
      `${root}.solver.stiffness.${family}`,
      `${family} stiffness`,
      domain.solver.stiffness[family],
      0,
      false,
      1,
    );
  numeric(
    out,
    `${root}.solver.referenceSpeed`,
    "reference speed",
    domain.solver.referenceSpeed,
    0,
    true,
    Infinity,
  );
  integer(
    out,
    `${root}.solver.maxSteps`,
    "max steps",
    domain.solver.maxSteps,
    1,
    SOFT_MAX_STEPS,
  );

  length(out, `${root}.rest`, "rest", domain.rest.length, count * 3);
  length(out, `${root}.mass`, "mass", domain.mass.length, count);
  domain.rest.forEach((value: number, index: number): void =>
    numeric(
      out,
      `${root}.rest[${index}]`,
      "rest coordinate",
      value,
      -Infinity,
      false,
      Infinity,
    ),
  );
  domain.mass.forEach((value: number, index: number): void =>
    numeric(
      out,
      `${root}.mass[${index}]`,
      "particle mass",
      value,
      0,
      true,
      Infinity,
    ),
  );

  // A coincident pair has no direction to project along, so the constraint
  // between them is silently dropped by the solver. Refusing it here is what
  // keeps a mis-generated rest mesh from reading as a panel that simply will
  // not hold together.
  if (domain.rest.length === count * 3)
    for (let row: number = 0; row < rows; ++row)
      for (let column: number = 0; column < columns; ++column) {
        const particle: number = row * columns + column;
        if (column + 1 < columns)
          coincident(out, root, domain, particle, particle + 1);
        if (row + 1 < rows)
          coincident(out, root, domain, particle, particle + columns);
      }

  const travel: number = softBodyTravelNumber(domain);
  if (travel > 1)
    out.push(
      "range",
      `${root}.solver.fixedStepSeconds`,
      `a position-based step may not travel further than the shortest constraint: dt·referenceSpeed/shortestRestLength <= 1, but the travel number is ${travel}`,
      domain.solver.fixedStepSeconds,
      Number.isFinite(travel) ? travel - 1 : undefined,
    );

  bounded(
    out,
    `${root}.anchors`,
    "anchors",
    domain.anchors.length,
    SOFT_MAX_ANCHORS,
  );
  const anchorIds: Set<string> = new Set<string>();
  const anchoredParticles: Set<number> = new Set<number>();
  domain.anchors.forEach(
    (anchor: IAutoMovieSoftAnchor, index: number): void => {
      const path: string = `${root}.anchors[${index}]`;
      identity(out, path, "anchor", anchor.id, anchorIds);
      integer(
        out,
        `${path}.particle`,
        "anchor particle",
        anchor.particle,
        0,
        count - 1,
      );
      if (anchoredParticles.has(anchor.particle))
        out.push(
          "type",
          `${path}.particle`,
          `particle ${anchor.particle} is already held by another anchor`,
          anchor.particle,
        );
      anchoredParticles.add(anchor.particle);
      if (anchor.position !== null)
        vector(out, `${path}.position`, anchor.position);
      if (anchor.binding !== undefined) {
        if (anchor.position !== null)
          out.push(
            "type",
            `${path}.position`,
            "a moving anchor must leave its static world position null",
            anchor.position,
          );
        if (anchor.binding.kind === "node") {
          if (anchor.binding.node.trim().length === 0)
            out.push(
              "type",
              `${path}.binding.node`,
              "moving anchor node identity must be non-empty",
              anchor.binding.node,
            );
        } else if (anchor.binding.actor.trim().length === 0)
          out.push(
            "type",
            `${path}.binding.actor`,
            "moving anchor actor identity must be non-empty",
            anchor.binding.actor,
          );
        vector(out, `${path}.binding.offset`, anchor.binding.offset);
      }
    },
  );

  bounded(
    out,
    `${root}.states`,
    "named states",
    domain.states.length,
    SOFT_MAX_STATES,
  );
  const stateIds: Set<string> = new Set<string>();
  domain.states.forEach(
    (state: IAutoMovieSoftNamedState, index: number): void => {
      const path: string = `${root}.states[${index}]`;
      identity(out, path, "named state", state.id, stateIds);
      const posed: Set<string> = new Set<string>();
      state.anchors.forEach(
        (pose: IAutoMovieSoftAnchorPose, at: number): void => {
          const posePath: string = `${path}.anchors[${at}]`;
          if (!anchorIds.has(pose.anchor))
            out.push(
              "type",
              `${posePath}.anchor`,
              `named state cites anchor "${pose.anchor}", which the domain does not declare`,
              pose.anchor,
            );
          else if (posed.has(pose.anchor))
            out.push(
              "type",
              `${posePath}.anchor`,
              `named state poses anchor "${pose.anchor}" twice`,
              pose.anchor,
            );
          posed.add(pose.anchor);
          vector(out, `${posePath}.position`, pose.position);
        },
      );
    },
  );

  bounded(
    out,
    `${root}.colliders`,
    "colliders",
    domain.colliders.length,
    SOFT_MAX_COLLIDERS,
  );
  const colliderIds: Set<string> = new Set<string>();
  domain.colliders.forEach(
    (collider: IAutoMovieSoftCollider, index: number): void => {
      const path: string = `${root}.colliders[${index}]`;
      identity(out, path, "collider", collider.id, colliderIds);
      if (collider.kind === "plane") {
        vector(out, `${path}.normal`, collider.normal);
        if (magnitude(collider.normal) === 0)
          out.push(
            "type",
            `${path}.normal`,
            "collider plane normal must be a non-zero vector",
            collider.normal,
          );
        numeric(
          out,
          `${path}.offset`,
          "collider plane offset",
          collider.offset,
          -Infinity,
          false,
          Infinity,
        );
      } else if (collider.kind === "sphere") {
        vector(out, `${path}.center`, collider.center);
        numeric(
          out,
          `${path}.radius`,
          "collider radius",
          collider.radius,
          0,
          true,
          Infinity,
        );
      } else if (collider.kind === "box") {
        vector(out, `${path}.min`, collider.min);
        vector(out, `${path}.max`, collider.max);
        for (const axis of ["x", "y", "z"] as const)
          if (collider.max[axis] <= collider.min[axis])
            out.push(
              "range",
              `${path}.max.${axis}`,
              `collider box max ${axis} must be strictly above its min (${collider.min[axis]})`,
              collider.max[axis],
            );
      } else {
        if (collider.actor.trim().length === 0)
          out.push(
            "type",
            `${path}.actor`,
            "body-capsule actor identity must be non-empty",
            collider.actor,
          );
        if (collider.capsule.from === collider.capsule.to)
          out.push(
            "range",
            `${path}.capsule.to`,
            "body-capsule endpoints must name two distinct bones",
            collider.capsule.to,
          );
        numeric(
          out,
          `${path}.capsule.radius`,
          "body-capsule radius",
          collider.capsule.radius,
          0,
          true,
          Infinity,
        );
      }
    },
  );

  // A panel that starts inside furniture is a panel whose first step teleports.
  if (domain.rest.length === count * 3)
    domain.colliders.forEach(
      (collider: IAutoMovieSoftCollider, index: number): void => {
        for (let particle: number = 0; particle < count; ++particle)
          if (
            embedded(collider, {
              x: domain.rest[particle * 3],
              y: domain.rest[particle * 3 + 1],
              z: domain.rest[particle * 3 + 2],
            })
          ) {
            out.push(
              "type",
              `${root}.colliders[${index}]`,
              `rest particle ${particle} starts inside collider "${collider.id}"`,
              particle,
            );
            return;
          }
      },
    );

  if (domain.wind !== null) {
    vector(out, `${root}.wind.direction`, domain.wind.direction);
    if (magnitude(domain.wind.direction) === 0)
      out.push(
        "type",
        `${root}.wind.direction`,
        "wind direction must be a non-zero vector",
        domain.wind.direction,
      );
    numeric(
      out,
      `${root}.wind.acceleration`,
      "wind acceleration",
      domain.wind.acceleration,
      -Infinity,
      false,
      Infinity,
    );
    numeric(
      out,
      `${root}.wind.gustAcceleration`,
      "wind gust acceleration",
      domain.wind.gustAcceleration,
      0,
      false,
      Infinity,
    );
    numeric(
      out,
      `${root}.wind.gustHz`,
      "wind gust frequency",
      domain.wind.gustHz,
      0,
      false,
      Infinity,
    );
  }

  return out.toValidation();
};

/** Whether a point lies strictly inside one collider. */
const embedded: (
  collider: IAutoMovieSoftCollider,
  point: IAutoMovieVector3,
) => boolean = (
  collider: IAutoMovieSoftCollider,
  point: IAutoMovieVector3,
): boolean => {
  if (collider.kind === "plane") {
    const length: number = magnitude(collider.normal);
    if (length === 0) return false;
    return (
      (collider.normal.x * point.x +
        collider.normal.y * point.y +
        collider.normal.z * point.z) /
        length <
      collider.offset
    );
  }
  if (collider.kind === "sphere") {
    const dx: number = point.x - collider.center.x;
    const dy: number = point.y - collider.center.y;
    const dz: number = point.z - collider.center.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < collider.radius;
  }
  // A body capsule is actor-local until the primary pose is evaluated. Treating
  // its bone labels as world coordinates would invent an origin collider and
  // reject an otherwise valid authored rest mesh.
  if (collider.kind === "body-capsule") return false;
  return (
    point.x > collider.min.x &&
    point.x < collider.max.x &&
    point.y > collider.min.y &&
    point.y < collider.max.y &&
    point.z > collider.min.z &&
    point.z < collider.max.z
  );
};

/** Euclidean length of one authored vector. */
const magnitude: (vector: IAutoMovieVector3) => number = (
  vector: IAutoMovieVector3,
): number =>
  Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);

/** A particle-indexed array whose length must equal the lattice's own. */
const length: (
  out: ViolationCollector,
  path: string,
  label: string,
  actual: number,
  expected: number,
) => void = (
  out: ViolationCollector,
  path: string,
  label: string,
  actual: number,
  expected: number,
): void => {
  if (actual !== expected)
    out.push(
      "type",
      path,
      `${label} must hold exactly ${expected} values, but held ${actual}`,
      actual,
    );
};

/** A declared collection that must stay inside its budget. */
const bounded: (
  out: ViolationCollector,
  path: string,
  label: string,
  actual: number,
  budget: number,
) => void = (
  out: ViolationCollector,
  path: string,
  label: string,
  actual: number,
  budget: number,
): void => {
  if (actual > budget)
    out.push(
      "range",
      path,
      `a soft body may declare at most ${budget} ${label}, but declared ${actual}`,
      actual,
      actual - budget,
    );
};
