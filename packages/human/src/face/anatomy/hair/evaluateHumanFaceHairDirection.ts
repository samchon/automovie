import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairEnvelope } from "./humanFaceHairEnvelope";
import { humanFaceHairFrame } from "./humanFaceHairFrame";

const { perpendicular, direction: requireDirection } = humanFaceHairFrame;

/**
 * Evaluate a dimensionless static styling field for the metric curve integrator.
 * Inputs use the neutral head frame and metres; the caller supplies unit surface
 * normals and admitted layer parameters. Parting depends on root position and
 * decays along the lock. Outward lift then augments the normalized comb field;
 * wave or helical modulation rotates that axis by the authored angular field.
 * Contact projection belongs to the integrator and may change this desired
 * direction. This is a kinematic field, without an elastic energy or gravity
 * simulation. A cancelled direction refuses instead of choosing a random comb.
 * Inputs remain unchanged and the returned unit vector is independently owned.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Defines shared styling arithmetic for every numerical face.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Evaluates parting, lift and curl from scalar fields rather than authored personal curves.
 */
export function evaluateHumanFaceHairDirection(props: {
  layer: IAutoMovieHumanFaceHair.Layer;
  root: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  distance: number;
  phase: number;
}): IAutoMovieVector3 {
  const { layer, root, normal, distance } = props;
  let aim = Vector3.create(...layer.flow);
  const part = layer.part;
  if (part !== undefined) {
    const axis = Vector3.normalize(Vector3.create(...part.normal));
    const side = Math.tanh(
      (Vector3.dot(root, axis) - part.offset) / part.transitionWidth,
    );
    const comb = Vector3.add(
      Vector3.scale(axis, side),
      Vector3.create(...part.bias),
    );
    const tangent = Vector3.subtract(
      comb,
      Vector3.scale(normal, Vector3.dot(comb, normal)),
    );
    const influence = humanFaceHairEnvelope(root, part.region);
    aim = Vector3.add(
      aim,
      Vector3.scale(
        tangent,
        influence * part.strength * Math.exp(-distance / part.reach),
      ),
    );
  }
  // Remove only inward comb velocity. An exactly cancelled field is a real
  // singularity; outward lift can resolve it if the author supplied that bias.
  aim = Vector3.subtract(
    aim,
    Vector3.scale(normal, Math.min(0, Vector3.dot(aim, normal))),
  );
  aim = Vector3.add(
    Vector3.normalize(aim),
    Vector3.scale(
      normal,
      layer.lift.strength * Math.exp(-distance / layer.lift.reach),
    ),
  );
  const axis = requireDirection(aim);
  const across = perpendicular(axis, normal);
  const up = Vector3.cross(axis, across);
  const angle = layer.curl.angle * (1 - Math.exp(-distance / layer.curl.reach));
  const turn = props.phase + (2 * Math.PI * distance) / layer.curl.wavelength;
  if (layer.curl.mode === "helix")
    return requireDirection(
      Vector3.add(
        Vector3.scale(axis, Math.cos(angle)),
        Vector3.scale(
          Vector3.add(
            Vector3.scale(across, Math.cos(turn)),
            Vector3.scale(up, Math.sin(turn)),
          ),
          Math.sin(angle),
        ),
      ),
    );
  const bend = angle * Math.sin(turn);
  return requireDirection(
    Vector3.add(
      Vector3.scale(axis, Math.cos(bend)),
      Vector3.scale(across, Math.sin(bend)),
    ),
  );
}
