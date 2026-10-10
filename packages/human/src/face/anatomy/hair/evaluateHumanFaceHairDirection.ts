import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairDirectionInput } from "./IHumanFaceHairDirectionInput";
import { humanFaceHairEnvelope } from "./humanFaceHairEnvelope";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import { humanFaceHairPartSide } from "./humanFaceHairPartSide";

const { perpendicular, direction: requireDirection } = humanFaceHairFrame;

/**
 * Evaluate a dimensionless static styling field for the metric curve integrator.
 * Inputs use the neutral head frame and metres; the caller supplies unit surface
 * normals and admitted layer parameters. Parting depends on root position and
 * decays along the lock. An optional fall hands the combed direction over to
 * the head's downward axis by exp(-d / reach) of arc length before the inward
 * part is removed, so a lock still on the head slides down along the scalp.
 * Outward lift then augments the normalized comb field;
 * wave or helical modulation rotates that axis by the authored angular field.
 * Contact projection belongs to the integrator and may change this desired
 * direction. This is a kinematic field, without an elastic energy or gravity
 * simulation. A cancelled direction refuses instead of choosing a random comb.
 * Inputs remain unchanged and the returned unit vector is independently owned.
 */
export function evaluateHumanFaceHairDirection(
  props: IHumanFaceHairDirectionInput,
): IAutoMovieVector3 {
  const { layer, root, normal, distance } = props;
  let aim = Vector3.create(...layer.flow);
  const part = layer.part;
  if (part !== undefined) {
    const axis = Vector3.normalize(Vector3.create(...part.normal));
    const side = humanFaceHairPartSide(root, part);
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
  // The comb hands over to hanging along the head's downward axis.
  if (layer.fall !== undefined) {
    const held = Math.exp(-distance / layer.fall.reach);
    aim = Vector3.add(
      Vector3.scale(Vector3.normalize(aim), held),
      Vector3.create(0, held - 1, 0),
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
