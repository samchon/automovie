import {
  IAutoMovieSoftAnchor,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyState,
  IAutoMovieSoftCollider,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieSoftBodyBoundarySample } from "./IAutoMovieSoftBodyBoundarySample";
import { simulateSoftBodyCore } from "./simulateSoftBodyCore";

/** Replay cloth against a complete resolved moving boundary for every absolute step from zero through the target. Static colliders remain active. This public API currently reaches portable tests through the wearable resolver; no production/viewer host wires that live solver.
 *
 * @evidence contracts/common.md#principled-implementation Every boundary step, moving-anchor particle and body-capsule id must cover its authored counterpart exactly, with finite target vectors and positive finite radii, before the shared fixed-clock core runs. Core domain validity remains a separate caller premise.
 * @evidence contracts/common.md#clear-and-simple-design Boundary completeness is checked once before integration, while one shared core owns both static and moving trajectories and their numeric ordering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing, foreign and duplicate targets are refused; static anchors are not invented for absent moving samples, and no frame interpolation repairs an incomplete history.
 * @evidence contracts/common.md#meaningful-documentation States inclusive step coverage, static-plus-moving semantics, core premise and unwired host reach.
 * @evidence contracts/performance.md#efficient-algorithms For K samples, A authored moving anchors and B capsules, admission scans samples and their target records using sets; replay adds O(P*K*(I+C+B+A)) in its moving-anchor find path, with O(P+A+B) local working storage excluding supplied history.
 * @evidence contracts/performance.md#reuse-equivalent-work Authored moving particle/capsule sets are reused across all samples, and the core reuses prepared lattice data across steps; different boundary histories are not treated as equivalent cached trajectories.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Admission sets are call-local, boundary rows are read only, and only fresh state arrays survive successful integration; refusal acquires no actor, animation cursor or render host.
 *
 * @author Samchon
 */
export const simulateSoftBodyWithBoundaries: (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  boundaries: readonly IAutoMovieSoftBodyBoundarySample[],
  state?: string | null,
) => IAutoMovieSoftBodyState = (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  boundaries: readonly IAutoMovieSoftBodyBoundarySample[],
  state: string | null = null,
): IAutoMovieSoftBodyState => {
  if (boundaries.length !== step + 1)
    throw new Error(
      `soft body "${domain.id}" needs one moving boundary for every step from 0 through ${step}`,
    );
  const movingAnchorParticles: Set<number> = new Set(
    domain.anchors
      .filter(
        (anchor: IAutoMovieSoftAnchor): boolean => anchor.binding !== undefined,
      )
      .map((anchor: IAutoMovieSoftAnchor): number => anchor.particle),
  );
  const bodyCapsuleIds: Set<string> = new Set(
    domain.colliders
      .filter(
        (
          collider: IAutoMovieSoftCollider,
        ): collider is IAutoMovieSoftCollider.IBodyCapsule =>
          collider.kind === "body-capsule",
      )
      .map(
        (collider: IAutoMovieSoftCollider.IBodyCapsule): string => collider.id,
      ),
  );
  for (let index: number = 0; index < boundaries.length; ++index) {
    const boundary: IAutoMovieSoftBodyBoundarySample = boundaries[index]!;
    if (boundary.step !== index)
      throw new Error(
        `soft body "${domain.id}" moving boundary[${index}] must name absolute step ${index}`,
      );
    const particles: Set<number> = new Set<number>();
    for (const anchor of boundary.anchors) {
      if (
        !Number.isSafeInteger(anchor.particle) ||
        anchor.particle < 0 ||
        anchor.particle >= domain.lattice.columns * domain.lattice.rows
      )
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] has an invalid anchor particle`,
        );
      if (!movingAnchorParticles.has(anchor.particle))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] particle ${anchor.particle} is not an authored moving anchor`,
        );
      if (particles.has(anchor.particle))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] repeats anchor particle ${anchor.particle}`,
        );
      particles.add(anchor.particle);
      assertVector(anchor.position, `moving boundary[${index}] anchor`);
    }
    for (const particle of movingAnchorParticles)
      if (!particles.has(particle))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] is missing authored moving anchor particle ${particle}`,
        );
    const capsules: Set<string> = new Set<string>();
    for (const capsule of boundary.capsules) {
      if (capsule.id.trim().length === 0)
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] capsule id must not be blank`,
        );
      if (capsules.has(capsule.id))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] repeats capsule "${capsule.id}"`,
        );
      if (!bodyCapsuleIds.has(capsule.id))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] capsule "${capsule.id}" is not an authored body capsule`,
        );
      capsules.add(capsule.id);
      assertVector(capsule.from, `moving boundary[${index}] capsule from`);
      assertVector(capsule.to, `moving boundary[${index}] capsule to`);
      if (!Number.isFinite(capsule.radius) || capsule.radius <= 0)
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] capsule radius must be finite and positive`,
        );
    }
    for (const id of bodyCapsuleIds)
      if (!capsules.has(id))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] is missing authored body capsule "${id}"`,
        );
  }
  return simulateSoftBodyCore(domain, step, state, boundaries);
};

/** Refuse a nonfinite resolved moving-boundary vector. */
const assertVector: (value: IAutoMovieVector3, label: string) => void = (
  value: IAutoMovieVector3,
  label: string,
): void => {
  if (
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    !Number.isFinite(value.z)
  )
    throw new Error(`${label} must contain finite coordinates`);
};
