import {
  Vector3,
  type createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
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
 * A successful sample is retained within this contact instance. If its
 * 1-Lipschitz lower bound proves the next candidate free, projection returns
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
 */
export function humanFaceHairContact(props: {
  layer: Pick<IAutoMovieHumanFaceHair.Layer, "samplingStep" | "clearance">;
  root: IAutoMovieVector3;
  length: number;
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
}): {
  clearance: number;
  step: number;
  epsilon: number;
  sample: (p: IAutoMovieVector3) => ReturnType<typeof props.query>;
  outward: (
    p: IAutoMovieVector3,
    hit: ReturnType<typeof props.query>,
  ) => IAutoMovieVector3;
  project: (p: IAutoMovieVector3) => IAutoMovieVector3;
} {
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
  const sample = (p: IAutoMovieVector3) => query([p.x, p.y, p.z]);
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
  let witness: { point: IAutoMovieVector3; free: number } | undefined;
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
  return { clearance, step: h, epsilon, sample, outward, project };
}
