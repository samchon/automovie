import {
  IAutoMovieBody,
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Require finite positive mass, declared restitution in inclusive [0,1], optional static and kinetic friction, finite optional center-of-mass coordinates and the declared drag and contact ranges. A missing restitution remains unknown and does not invalidate kinematic model construction.
 */
export const validateBody: (
  body: IAutoMovieBody,
  path: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  body: IAutoMovieBody,
  path: string,
  collector: IAutoMovieViolationCollector,
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
  if (body.restitution !== undefined)
    collector.range(
      `${path}.restitution`,
      body.restitution,
      0,
      1,
      "restitution",
    );
  if (body.drag !== undefined)
    for (const field of ["coefficient", "area"] as const)
      if (!(Number.isFinite(body.drag[field]) && body.drag[field] > 0))
        collector.push(
          "range",
          `${path}.drag.${field}`,
          `drag ${field} must be a finite number > 0, but was ${body.drag[field]}`,
          body.drag[field],
        );
  if (
    body.contact?.embed !== undefined &&
    !(Number.isFinite(body.contact.embed) && body.contact.embed >= 0)
  )
    collector.push(
      "range",
      `${path}.contact.embed`,
      `contact embed must be a finite depth >= 0, but was ${body.contact.embed}`,
      body.contact.embed,
    );
  if (body.contact?.rolling !== undefined)
    collector.range(
      `${path}.contact.rolling`,
      body.contact.rolling,
      0,
      1,
      "rolling resistance",
    );
  if (
    body.contact?.fracture !== undefined &&
    !(Number.isFinite(body.contact.fracture) && body.contact.fracture > 0)
  )
    collector.push(
      "range",
      `${path}.contact.fracture`,
      `contact fracture must be a finite energy > 0, but was ${body.contact.fracture}`,
      body.contact.fracture,
    );
  if (body.contact?.passLoss !== undefined)
    collector.range(
      `${path}.contact.passLoss`,
      body.contact.passLoss,
      0,
      1,
      "pass loss",
    );
  if (body.contact?.glance !== undefined)
    collector.range(
      `${path}.contact.glance`,
      body.contact.glance,
      0,
      90,
      "glance angle",
    );
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
