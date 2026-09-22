import {
  Vector3,
  type createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairFrame } from "./humanFaceHairFrame";

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
 *
 * The clearance is the fibre's own, not the rendered ribbon's: half a step is
 * what a straight segment between two projected stations may sag by, and the
 * requested clearance is the free distance the document asks its hair to keep.
 * A ribbon is far wider than the fibre path it stands for, and paying for that
 * width here would lift every strand off the scalp by half a ribbon; the mesh
 * owner keeps the ribbon's own corners outside instead.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Keeps guides and interpolated strands outside the shared surface by one rule.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair States the fibre clearance from the step and the requested clearance and projects along the nearest feature of the closed collider.
 */
export function humanFaceHairContact(props: {
  layer: Pick<IAutoMovieHumanFaceHair.Layer, "samplingStep" | "clearance">;
  root: IAutoMovieVector3;
  length: number;
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
}): {
  clearance: number;
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
  const project = (input: IAutoMovieVector3): IAutoMovieVector3 => {
    let p = input;
    for (let attempt = 0; attempt < 64; attempt++) {
      const hit = sample(p);
      if (hit.signedDistance >= clearance - epsilon) return p;
      p = Vector3.add(
        Vector3.create(hit.point[0], hit.point[1], hit.point[2]),
        Vector3.scale(outward(p, hit), clearance),
      );
    }
    throw new Error(
      "Numerical hair contact did not converge on the closed surface.",
    );
  };
  return { clearance, epsilon, sample, outward, project };
}
