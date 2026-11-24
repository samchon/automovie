import {
  IAutoMovieSoftAnchor,
  type IAutoMovieSoftBodyBoundarySample,
  IAutoMovieSoftBodyDomain,
  type IAutoMovieSoftBodyObserver,
  IAutoMovieSoftBodyState,
  IAutoMovieSoftCollider,
  IAutoMovieVector3,
} from "@automovie/interface";

import { simulateSoftBodyCore } from "./simulateSoftBodyCore";

/**
 * Replay cloth against a complete resolved moving boundary for every absolute
 * step from zero through the target. Static colliders remain active. Each
 * sample holds every authored moving anchor or releases it; an observer reads
 * every completed step. This public API currently reaches portable tests
 * through the wearable resolver; no production/viewer host wires that live
 * solver.
 */
export const simulateSoftBodyWithBoundaries: (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  boundaries: readonly IAutoMovieSoftBodyBoundarySample[],
  state?: string | null,
  observer?: IAutoMovieSoftBodyObserver | null,
) => IAutoMovieSoftBodyState = (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  boundaries: readonly IAutoMovieSoftBodyBoundarySample[],
  state: string | null = null,
  observer: IAutoMovieSoftBodyObserver | null = null,
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
      .flatMap(
        (
          collider: IAutoMovieSoftCollider,
        ): IAutoMovieSoftCollider.IBodyCapsule[] =>
          collider.kind === "body-capsule" ? [collider] : [],
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
    for (const particle of boundary.released ?? []) {
      if (!movingAnchorParticles.has(particle))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] releases particle ${particle}, which is not an authored moving anchor`,
        );
      if (particles.has(particle))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] both holds and releases particle ${particle}`,
        );
      particles.add(particle);
    }
    for (const particle of movingAnchorParticles)
      if (!particles.has(particle))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] is missing authored moving anchor particle ${particle}`,
        );
    const capsules: Set<string> = new Set<string>();
    for (const capsule of boundary.capsules) {
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
  return simulateSoftBodyCore(domain, step, state, boundaries, observer);
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
