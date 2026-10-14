import { type IAutoMovieMeshQueryBudget, Vector3, type IAutoMovieSignedMeshQueryHit as ImportedIAutoMovieSignedMeshQueryHit } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";
import type { IHumanFaceHairContactSample } from "./IHumanFaceHairContactSample";
import type { IHumanFaceHairContactSource } from "./IHumanFaceHairContactSource";
import type { IHumanFaceHairFreeWitness } from "./IHumanFaceHairFreeWitness";
import type { IHumanFaceHairRetraction } from "./IHumanFaceHairRetraction";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import { humanFaceHairFreeDistanceBound } from "./humanFaceHairFreeDistanceBound";

const requireDirection: (value: IAutoMovieVector3) => IAutoMovieVector3 = humanFaceHairFrame.direction;

/**
 * Supply one hair curve's station threshold: half a sampling step and the requested gap, plus terminal-shaft radius when present and twice a rounding allowance scaled to the root, length and step. Projection admits a point at or beyond that threshold within the allowance; otherwise it repeats nearest-feature offset proposals, refusing after 64 unsuccessful steps. Admission does not promise equality with an offset surface. Guides and interpolated strands share this contact rule. Consecutive equal coordinates reuse the last signed sample. A separately copied free witness belongs to this contact's collider; its 1-Lipschitz lower bound can admit a later candidate without another query, returning that input by identity.
 *
 * The rule also carries the step its clearance was built from, because that is the chord a curve may span and still keep the requested clearance along its whole length: distance to a closed set is 1-Lipschitz, so two stations half a step beyond the clearance, no further apart than one step, keep it between them. A curve that is not integrated has to be held to the same chord to inherit that guarantee.
 *
 * Legacy ribbon clearance is the fibre's own, not its coverage width. A physical terminal shaft adds its unchanged radius before integration, so its outer surface can retain the same requested gap without reducing calibre. Half a step is what a straight segment between two projected stations may sag by, and the requested clearance is the free distance the document asks its hair to keep. A ribbon is far wider than the fibre path it stands for, and paying for that width here would lift every strand off the scalp by half a ribbon; the mesh owner keeps the ribbon's own corners outside instead.
 *
 * @evidence contracts/common.md#principled-implementation Signed nearest-feature proposals or a same-collider Lipschitz witness admit the augmented station threshold within epsilon; embedded, consistently oriented closed geometry remains the query premise.
 * @evidence contracts/common.md#clear-and-simple-design One lock contact exposes sample, outward, project and budgeted offset retraction to guide and remainder placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Projection/retraction refuse after 64 unsuccessful iterations; embedded closed orientation is a query premise and ribbon widths need separate cell checks.
 * @evidence contracts/common.md#meaningful-documentation Coordinates and clearances are head metres, and a successful Lipschitz witness can return the borrowed candidate unchanged.
 * @evidence contracts/performance.md#efficient-algorithms Projection takes up to 64 signed queries; retraction up to 128 budgeted samples, with fixed vector work per attempt.
 * @evidence contracts/performance.md#reuse-equivalent-work Last-coordinate samples and one copied free-distance witness reuse deterministic same-collider answers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The contact closure retains one sample and witness plus its query, while per-call projection points remain local; only retraction mutates the supplied budget.
 */
export function humanFaceHairContact(
  props: IHumanFaceHairContactSource,
): IHumanFaceHairContact {
  const { layer, query }: IHumanFaceHairContactSource = props;
  const h: number = layer.samplingStep;
  const epsilon: number =
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
  const clearance: number = h / 2 + layer.clearance + (layer.terminalShaftDiameter ?? 0) / 2 + 2 * epsilon;
  // The projection of a step returns the very point the integrator samples
  // next, so the last query is kept: the same coordinates give the same hit,
  // because the query is deterministic in its point. The hit is shared and
  // read only.
  let sampled: IHumanFaceHairContactSample | undefined;
  const sample: (p: IAutoMovieVector3) => ReturnType<(point: readonly number[]) => ImportedIAutoMovieSignedMeshQueryHit> = (p: IAutoMovieVector3): ReturnType<typeof query> => {
    if (
      sampled !== undefined &&
      sampled.point.x === p.x &&
      sampled.point.y === p.y &&
      sampled.point.z === p.z
    )
      return sampled.hit;
    const hit: ImportedIAutoMovieSignedMeshQueryHit = query([p.x, p.y, p.z]);
    sampled = { point: { x: p.x, y: p.y, z: p.z }, hit };
    return hit;
  };
  const outward: (p: IAutoMovieVector3, hit: ReturnType<(p: IAutoMovieVector3) => ReturnType<(point: readonly number[]) => ImportedIAutoMovieSignedMeshQueryHit>>) => IAutoMovieVector3 = (p: IAutoMovieVector3, hit: ReturnType<typeof sample>): IAutoMovieVector3 =>
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
  const project: (input: IAutoMovieVector3) => IAutoMovieVector3 = (input: IAutoMovieVector3): IAutoMovieVector3 => {
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
    let p: IAutoMovieVector3 = input;
    for (let attempt: number = 0; attempt < 64; attempt++) {
      const hit: ImportedIAutoMovieSignedMeshQueryHit = sample(p);
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
  const retract: (input: IAutoMovieVector3, offset: number, budget: IAutoMovieMeshQueryBudget) => IHumanFaceHairRetraction = (
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
    const read: (point: IAutoMovieVector3) => ReturnType<(p: IAutoMovieVector3) => ReturnType<(point: readonly number[]) => ImportedIAutoMovieSignedMeshQueryHit>> = (point: IAutoMovieVector3): ReturnType<typeof sample> => {
      if (budget.remaining === 0)
        throw new Error(
          "Hair offset retraction exhausted its shared geometry budget.",
        );
      budget.remaining--;
      return sample(point);
    };
    let point: IAutoMovieVector3 = input;
    for (let attempt: number = 0; attempt < 64; attempt++) {
      const hit: ImportedIAutoMovieSignedMeshQueryHit = read(point);
      const normal: IAutoMovieVector3 = outward(point, hit);
      const candidate: IAutoMovieVector3 = Vector3.add(
        Vector3.create(hit.point[0], hit.point[1], hit.point[2]),
        Vector3.scale(normal, offset),
      );
      const measured: ImportedIAutoMovieSignedMeshQueryHit = read(candidate);
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
