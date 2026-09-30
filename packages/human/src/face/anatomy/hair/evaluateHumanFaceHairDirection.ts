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
 * @evidence contracts/common.md#principled-implementation The comb field is
 *   the flow plus a parting term whose side weight is tanh of the signed
 *   distance to the parting plane, projected into the tangent and weighted by
 *   its envelope, strength and exp(-d / reach). Its inward part is removed and
 *   an outward lift decaying with distance is added. The curl then rotates that
 *   axis: the helix returns cos(a) axis + sin(a) (cos t across + sin t up) and
 *   the wave rotates the axis about `up` by a sin t, with across perpendicular
 *   to the axis and the skin normal and up their cross product, so each is a
 *   unit vector. The angle a rises as 1 - exp(-d / reach) from zero at the root.
 *   This is a kinematic field, as the comment states, with no elastic energy,
 *   and a cancelled direction refuses instead of picking a comb.
 * @evidence contracts/common.md#clear-and-simple-design One evaluation from
 *   layer, position, normal, arc distance and phase to a unit direction; contact
 *   and turning limits stay with the integrator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style: every term is a layer field applied by the same
 *   formula.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   each term, the ownership of contact, that no gravity or elasticity is
 *   modelled, the refusal and that inputs are unchanged.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidence contracts/modeling.md#spatial-conventions The root and the flow
 *   are in the neutral head frame in metres and dimensionless respectively, the
 *   distance is arc length in metres along the lock, the angles are radians, and
 *   the result is a unit vector in the head frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The field is a
 *   styling model and not a follicle or fibre mechanics, as the document states,
 *   so it carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
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
