import { IAutoMovieBody, IAutoMovieVector3 } from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";

/**
 * Require finite positive mass, inclusive[0,1] restitution, an optional static friction in [0,1], an optional kinetic friction in [0,1] present only with the static one and no greater than it, finite optional center-of-mass coordinates, an optional drag of positive coefficient and area, and an optional contact of a non-negative embedding depth and rolling resistance and pass loss in [0,1].
 *
 * @evidence contracts/development/implementation.md#principled-implementation Require finite positive mass, inclusive[0,1] restitution, an optional static friction in [0,1] (absent when nothing measured it), an optional kinetic friction in [0,1] present only with the static one and no greater than it (sliding never resists more than sticking), finite optional center-of-mass coordinates, a drag whose coefficient and area are positive (a drag of zero is no drag, and absent), and a contact whose depth is not negative and whose rolling resistance and speed loss are shares.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Body metadata owns these scalar policies and the collector owns range reporting.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Passing scalars does not certify a simulated body, fitted inertia tensor or measured center of mass.
 * @evidence contracts/development/common.md#meaningful-documentation Null centerOfMass means omitted metadata; field paths and append-only errors are explicit.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of scalars costs constant arithmetic plus failure text.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Collector range semantics are shared, without caching mutable body metadata.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only caller-owned diagnostics remain; no physics body or native geometry is acquired.
 */
export const validateBody: (
  body: IAutoMovieBody,
  path: string,
  collector: ViolationCollector,
) => void = (
  body: IAutoMovieBody,
  path: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isFinite(body.mass) || body.mass <= 0)
    collector.push(
      "range",
      `${path}.mass`,
      `mass must be a finite number > 0, but was ${body.mass}`,
      body.mass,
    );
  if (body.friction !== undefined)
    collector.range(`${path}.friction`, body.friction, 0, 1, "friction");
  if (body.kineticFriction !== undefined) {
    collector.range(
      `${path}.kineticFriction`,
      body.kineticFriction,
      0,
      1,
      "kinetic friction",
    );
    if (body.friction === undefined)
      collector.push(
        "type",
        `${path}.friction`,
        "kineticFriction needs the static friction it may not exceed, but friction was absent",
        body.friction,
      );
    else if (body.kineticFriction > body.friction)
      collector.push(
        "range",
        `${path}.kineticFriction`,
        `kineticFriction must not exceed the static friction ${body.friction}, but was ${body.kineticFriction}`,
        body.kineticFriction,
      );
  }
  collector.range(`${path}.restitution`, body.restitution, 0, 1, "restitution");
  if (body.drag !== undefined)
    for (const field of ["coefficient", "area"] as const)
      if (!(Number.isFinite(body.drag[field]) && body.drag[field] > 0))
        collector.push(
          "range",
          `${path}.drag.${field}`,
          `drag ${field} must be a finite number > 0, but was ${body.drag[field]}`,
          body.drag[field],
        );
  if (body.contact?.embed !== undefined && !(Number.isFinite(body.contact.embed) && body.contact.embed >= 0))
    collector.push(
      "range",
      `${path}.contact.embed`,
      `contact embed must be a finite depth >= 0, but was ${body.contact.embed}`,
      body.contact.embed,
    );
  if (body.contact?.rolling !== undefined)
    collector.range(`${path}.contact.rolling`, body.contact.rolling, 0, 1, "rolling resistance");
  if (body.contact?.passLoss !== undefined)
    collector.range(`${path}.contact.passLoss`, body.contact.passLoss, 0, 1, "pass loss");
  if (body.centerOfMass !== null) {
    const com: IAutoMovieVector3 = body.centerOfMass;
    for (const axis of ["x", "y", "z"] as const)
      if (!Number.isFinite(com[axis]))
        collector.push(
          "range",
          `${path}.centerOfMass.${axis}`,
          `centerOfMass.${axis} must be finite, but was ${com[axis]}`,
          com[axis],
        );
  }
};
