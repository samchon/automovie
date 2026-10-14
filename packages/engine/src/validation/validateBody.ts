import { IAutoMovieBody, IAutoMovieVector3 } from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";

/**
 * Require finite positive mass, inclusive[0,1] friction/restitution and finite optional center-of-mass coordinates.
 *
 * @evidence contracts/common.md#principled-implementation Require finite positive mass, inclusive[0,1] friction/restitution and finite optional center-of-mass coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Body metadata owns these scalar policies and the collector owns range reporting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Passing scalars does not certify a simulated body, fitted inertia tensor or measured center of mass.
 * @evidence contracts/common.md#meaningful-documentation Null centerOfMass means omitted metadata; field paths and append-only errors are explicit.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of scalars costs constant arithmetic plus failure text.
 * @evidence contracts/performance.md#reuse-equivalent-work Collector range semantics are shared, without caching mutable body metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned diagnostics remain; no physics body or native geometry is acquired.
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
  collector.range(`${path}.friction`, body.friction, 0, 1, "friction");
  collector.range(`${path}.restitution`, body.restitution, 0, 1, "restitution");
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
