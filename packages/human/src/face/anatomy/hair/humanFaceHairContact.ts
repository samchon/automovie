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
 * step and the requested clearance, plus terminal-shaft radius when present,
 * and a rounding allowance scaled to the
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
 * Legacy ribbon clearance is the fibre's own, not its coverage width. A physical
 * terminal shaft adds its unchanged radius before integration, so its outer
 * surface can retain the same requested gap without reducing calibre. Half a step is
 * what a straight segment between two projected stations may sag by, and the
 * requested clearance is the free distance the document asks its hair to keep.
 * A ribbon is far wider than the fibre path it stands for, and paying for that
 * width here would lift every strand off the scalp by half a ribbon; the mesh
 * owner keeps the ribbon's own corners outside instead.
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
      (layer.terminalShaftDiameter ?? 0) / 2,
    );
  const clearance = h / 2 + layer.clearance + (layer.terminalShaftDiameter ?? 0) / 2 + 2 * epsilon;
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
