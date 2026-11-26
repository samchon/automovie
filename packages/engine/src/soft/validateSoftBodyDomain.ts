import {
  IAutoMovieSoftCollider,
  type IAutoMovieValidateSoftBodyDomain,
  IAutoMovieValidation,
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { SOFT_MAX_COLLIDERS } from "./constants/SOFT_MAX_COLLIDERS";
import { SOFT_MAX_ITERATIONS } from "./constants/SOFT_MAX_ITERATIONS";
import { SOFT_MAX_PARTICLES } from "./constants/SOFT_MAX_PARTICLES";
import { SOFT_MAX_STEPS } from "./constants/SOFT_MAX_STEPS";
import { softBodyTravelNumber } from "./softBodyTravelNumber";
import { validateSoftAnchors } from "./validateSoftAnchors";
import { validateSoftBounded as bounded } from "./validateSoftBounded";
import { validateSoftCompliance } from "./validateSoftCompliance";
import { validateSoftIdentity as identity } from "./validateSoftIdentity";
import { validateSoftInteger as integer } from "./validateSoftInteger";
import { validateSoftNumeric as numeric } from "./validateSoftNumeric";
import { validateSoftRestCoincidence as coincident } from "./validateSoftRestCoincidence";
import { validateSoftVector as vector } from "./validateSoftVector";

/**
 * Validate typed soft-body fields, structural rest edges, reference joins and
 * the authored travel heuristic.
 *
 * A travel ratio that overflows still exceeds the travel limit. Its violation
 * has no measured overshoot.
 */
export function validateSoftBodyDomain(
  props: IAutoMovieValidateSoftBodyDomain.IProps,
): IAutoMovieValidation {
  const { domain }: typeof props = props;
  const out: IAutoMovieViolationCollector = new ViolationCollector();
  const root: string = "$input";

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
  if (count > SOFT_MAX_PARTICLES)
    out.push(
      "range",
      `${root}.lattice`,
      `a soft body lattice may hold at most ${SOFT_MAX_PARTICLES} particles, but declared ${count}`,
      count,
      count - SOFT_MAX_PARTICLES,
    );
  if (count < 2)
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

  validateSoftCompliance(out, root, domain);
  const travel: number = softBodyTravelNumber(domain);
  if (travel > 1)
    out.push(
      "range",
      `${root}.solver.fixedStepSeconds`,
      `a position-based step may not travel further than the shortest constraint: dt·referenceSpeed/shortestRestLength <= 1, but the travel number is ${travel}`,
      domain.solver.fixedStepSeconds,
      travel === Infinity ? undefined : travel - 1,
    );

  validateSoftAnchors(out, root, domain, count);

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
}

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
  out: IAutoMovieViolationCollector,
  path: string,
  label: string,
  actual: number,
  expected: number,
) => void = (
  out: IAutoMovieViolationCollector,
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
