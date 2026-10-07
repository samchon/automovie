import { type IAutoMovieMeshQueryBudget, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";
import type { IHumanFaceHairContactSample } from "./IHumanFaceHairContactSample";
import type { IHumanFaceHairContactSource } from "./IHumanFaceHairContactSource";
import type { IHumanFaceHairFreeWitness } from "./IHumanFaceHairFreeWitness";
import type { IHumanFaceHairRetraction } from "./IHumanFaceHairRetraction";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import { humanFaceHairFreeDistanceBound } from "./humanFaceHairFreeDistanceBound";

const requireDirection = humanFaceHairFrame.direction;

/**
 * The surface contact one hair curve keeps: its clearance (half a sampling
 * step and the requested clearance, plus a rounding allowance scaled to the
 * root, length and step) and a projection that
 * moves a point outside the closed collider to exactly that clearance along
 * the nearest feature, repeating until it holds. Guides call the projection
 * at every integration step; interpolated strands call it on every station,
 * so a strand keeps the same clearance its guides were integrated with
 * without being integrated itself. A projection that does not converge in 64
 * steps refuses.
 * The last sample is kept, so a point sampled twice in a row is queried once.
 * A successful sample is also retained as a witness within this contact
 * instance. If its 1-Lipschitz lower bound proves the next candidate free,
 * projection returns
 * that candidate without a new surface query. The witness is copied and owned
 * by this collider, so another face cannot install a stale contact sample.
 *
 * The rule also carries the step its clearance was built from, because that
 * is the chord a curve may span and still keep the requested clearance along
 * its whole length: distance to a closed set is 1-Lipschitz, so two stations
 * half a step beyond the clearance, no further apart than one step, keep it
 * between them. A curve that is not integrated has to be held to the same
 * chord to inherit that guarantee.
 *
 * The clearance is the fibre's own, not the rendered ribbon's: half a step is
 * what a straight segment between two projected stations may sag by, and the
 * requested clearance is the free distance the document asks its hair to keep.
 * A ribbon is far wider than the fibre path it stands for, and paying for that
 * width here would lift every strand off the scalp by half a ribbon; the mesh
 * owner keeps the ribbon's own corners outside instead.
 *
 * @evidence contracts/common.md#principled-implementation The clearance is
 *   half a sampling step plus the requested clearance plus a rounding allowance,
 *   and the projection moves a point to exactly that clearance along the nearest
 *   feature's outward direction and repeats, since one move can land inside
 *   another feature. Distance to a closed set is 1-Lipschitz, so a chord no
 *   longer than one step between two stations that each keep the clearance keeps
 *   it along the whole chord, which is why the step is exported with the rule. A
 *   projection that has not converged in 64 moves refuses. The kept last sample
 *   and the kept witness only skip a query whose answer is already known: the
 *   same coordinates return the identical hit, and a strictly certified point
 *   returns itself, so neither changes any station. The premise is a closed,
 *   consistently oriented collider.
 * @evidence contracts/common.md#clear-and-simple-design One rule per curve
 *   shared by the integrator, the strand projector and, through its clearance,
 *   the mesher, so the three cannot disagree; its only state is the last sample
 *   and the last witness, both private to the instance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject and no foreign state: the caches live in the instance,
 *   are compared by coordinates and are never installed from another face, and a
 *   point that cannot be placed refuses.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the clearance, the projection, who calls it, what is cached and why the
 *   cache is exact, the chord the step gives and why the clearance is the
 *   fibre's own and not the ribbon's.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Points, root, length,
 *   step, clearance and the rounding allowance are metres in the head frame of
 *   the supplied query, and nothing is converted; the allowance scales with the
 *   largest of the root's coordinates, the length, the step and the clearance.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries
 *   no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function humanFaceHairContact(
  props: IHumanFaceHairContactSource,
): IHumanFaceHairContact {
  const { layer, query } = props;
  const h = layer.samplingStep;
  const epsilon =
    128 *
    Number.EPSILON *
    Math.max(
      Math.abs(props.root.x),
      Math.abs(props.root.y),
      Math.abs(props.root.z),
      props.length,
      h,
      layer.clearance,
    );
  const clearance = h / 2 + layer.clearance + 2 * epsilon;
  // The projection of a step returns the very point the integrator samples
  // next, so the last query is kept: the same coordinates give the same hit,
  // because the query is deterministic in its point. The hit is shared and
  // read only.
  let sampled: IHumanFaceHairContactSample | undefined;
  const sample = (p: IAutoMovieVector3): ReturnType<typeof query> => {
    if (
      sampled !== undefined &&
      sampled.point.x === p.x &&
      sampled.point.y === p.y &&
      sampled.point.z === p.z
    )
      return sampled.hit;
    const hit = query([p.x, p.y, p.z]);
    sampled = { point: { x: p.x, y: p.y, z: p.z }, hit };
    return hit;
  };
  const outward = (p: IAutoMovieVector3, hit: ReturnType<typeof sample>) =>
    hit.distance === 0
      ? Vector3.create(hit.normal[0], hit.normal[1], hit.normal[2])
      : requireDirection(
          Vector3.scale(
            Vector3.subtract(
              p,
              Vector3.create(hit.point[0], hit.point[1], hit.point[2]),
            ),
            hit.signedDistance < 0 ? -1 : 1,
          ),
        );
  let witness: IHumanFaceHairFreeWitness | undefined;
  const project = (input: IAutoMovieVector3): IAutoMovieVector3 => {
    if (
      witness !== undefined &&
      humanFaceHairFreeDistanceBound({
        sampled: witness.point,
        distance: witness.free,
        candidate: input,
        required: clearance,
        allowance: epsilon,
      })
    )
      return input;
    let p = input;
    for (let attempt = 0; attempt < 64; attempt++) {
      const hit = sample(p);
      if (hit.signedDistance >= clearance - epsilon) {
        witness = { point: { ...p }, free: hit.signedDistance };
        return p;
      }
      p = Vector3.add(
        Vector3.create(hit.point[0], hit.point[1], hit.point[2]),
        Vector3.scale(outward(p, hit), clearance),
      );
    }
    throw new Error(
      "Numerical hair contact did not converge on the closed surface.",
    );
  };
  const retract = (
    input: IAutoMovieVector3,
    offset: number,
    budget: IAutoMovieMeshQueryBudget,
  ): IHumanFaceHairRetraction => {
    if (!Number.isFinite(offset) || offset < clearance - epsilon)
      throw new Error(
        "Hair offset retraction requires the unchanged free clearance.",
      );
    if (
      budget === undefined ||
      budget === null ||
      !Number.isSafeInteger(budget.remaining) ||
      budget.remaining < 0
    )
      throw new Error(
        "Hair offset retraction requires its safe-integer shared budget.",
      );
    const read = (point: IAutoMovieVector3): ReturnType<typeof sample> => {
      if (budget.remaining === 0)
        throw new Error(
          "Hair offset retraction exhausted its shared geometry budget.",
        );
      budget.remaining--;
      return sample(point);
    };
    let point = input;
    for (let attempt = 0; attempt < 64; attempt++) {
      const hit = read(point);
      const normal = outward(point, hit);
      const candidate = Vector3.add(
        Vector3.create(hit.point[0], hit.point[1], hit.point[2]),
        Vector3.scale(normal, offset),
      );
      const measured = read(candidate);
      if (
        measured.signedDistance >= clearance - epsilon &&
        Math.abs(measured.signedDistance - offset) <= epsilon
      )
        return { point: candidate, normal };
      point = candidate;
    }
    throw new Error(
      "Hair offset retraction did not converge on its closed surface.",
    );
  };
  return { clearance, step: h, epsilon, sample, outward, project, retract };
}
