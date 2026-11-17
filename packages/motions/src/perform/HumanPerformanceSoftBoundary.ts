import type { AutoMovieHumanoidBone, AutoMovieHumanoidSocket, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanPerformanceState, IAutoMovieMotionHumanProp, IAutoMovieResolvedBone, IAutoMovieSoftAnchorBinding, IAutoMovieSoftBodyBoundarySample, IAutoMovieSoftBodyDomain, IAutoMovieSoftBodyResolvedCapsule, IAutoMovieSoftCollider, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3 } from "@automovie/engine";

import { HumanPerformanceRead } from "./HumanPerformanceRead";

/**
 * One step's boundary of a soft prop in a performance: every moving
 * anchor's world point (an `actor-bone` binding on its person's displayed
 * bone, a `node` binding on a rigid prop's frame, a grip's particle on the
 * gripping hand's grip socket), the grips' particles released at this step,
 * and every body capsule on its person's displayed bones.
 *
 * @param state The performance.
 * @param domain The soft domain with its grips' anchors added.
 * @param grips The grips that bind particles.
 * @param bones The displayed bones by person and step.
 * @param k The absolute step.
 * @param seconds Its film second.
 * @returns The step's boundary sample.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the sample holds for each kind of anchor and capsule.
 * @evidence contracts/development/implementation.md#principled-implementation Each binding's rigid offset carried by its displayed bone or prop frame; a grip's particle follows the hand that closed last on it and is released when no grip holds it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the anchors and one over the body capsules.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bone or prop throws through its reader rather than leaving the anchor at an origin.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in anchors and capsules; the bones are read once per person and step through the reader.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The bone reader keeps each person's bones per step.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh sample and retains nothing.
 */
export function HumanPerformanceSoftBoundary(
  state: IAutoMovieMotionHumanPerformanceState,
  domain: IAutoMovieSoftBodyDomain,
  grips: readonly HumanPerformanceSoftBoundary.IGripAnchor[],
  bones: HumanPerformanceSoftBoundary.BoneReader,
  k: number,
  seconds: number,
): IAutoMovieSoftBodyBoundarySample {
  const anchors: { particle: number; position: IAutoMovieVector3 }[] = [];
  const released: number[] = [];
  for (const anchor of domain.anchors) {
    const binding: IAutoMovieSoftAnchorBinding | undefined = anchor.binding;
    if (binding === undefined) continue;
    if (binding.kind === "node" && binding.node.startsWith(HumanPerformanceSoftBoundary.GRIP)) {
      const g: HumanPerformanceSoftBoundary.IGripAnchor | undefined = HumanPerformanceSoftBoundary.owner(grips, anchor.particle, seconds);
      if (g === undefined) released.push(anchor.particle);
      else
        anchors.push({
          particle: anchor.particle,
          position: HumanPerformanceSoftBoundary.gripSocket(state, bones, g.person, g.side, k, seconds),
        });
      continue;
    }
    if (binding.kind === "node") {
      const frame: IAutoMovieMotionHumanProp.IFrame = HumanPerformanceRead.prop(
        state,
        binding.node,
        seconds,
      );
      anchors.push({
        particle: anchor.particle,
        position: Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, binding.offset),
        ),
      });
      continue;
    }
    const bone: IAutoMovieResolvedBone = bones(binding.actor, k, seconds).get(
      binding.bone,
    )!;
    anchors.push({
      particle: anchor.particle,
      position: Vector3.add(
        bone.worldPosition,
        Quaternion.rotateVector(bone.worldRotation, binding.offset),
      ),
    });
  }
  const capsules: IAutoMovieSoftBodyResolvedCapsule[] = domain.colliders
    .filter(
      (c: IAutoMovieSoftCollider): c is IAutoMovieSoftCollider.IBodyCapsule =>
        c.kind === "body-capsule",
    )
    .map(
      (
        c: IAutoMovieSoftCollider.IBodyCapsule,
      ): IAutoMovieSoftBodyResolvedCapsule => {
        const read: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          bones(c.actor, k, seconds);
        return {
          id: c.id,
          from: { ...read.get(c.capsule.from)!.worldPosition },
          to: { ...read.get(c.capsule.to)!.worldPosition },
          radius: c.capsule.radius,
        };
      },
    );
  return {
    step: k,
    anchors,
    capsules,
    ...(released.length === 0 ? {} : { released }),
  };
}

/**
 * Companion of {@link HumanPerformanceSoftBoundary}: the grip record, the
 * bone reader and the small helpers the soft pass shares.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member.
 * @evidence contracts/development/design.md#principled-representation A grip as a particle bound to a hand over a window; bones read by person and step.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanPerformanceSoft` and the boundary read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's and interface's types.
 */
export namespace HumanPerformanceSoftBoundary {
  /** A grip that binds a particle to a hand's socket for a window. */
  export interface IGripAnchor {
    /** The particle held. */
    particle: number;

    /** The gripping person. */
    person: string;

    /** The gripping hand. */
    side: "left" | "right";

    /** The grip's first film second. */
    from: number;

    /** The grip's last film second. */
    to: number;
  }

  /** Displayed bones by person and step. */
  export type BoneReader = (
    person: string,
    k: number,
    seconds: number,
  ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /** A reader of displayed bones by person and step, each read once. */
  export const memoBones: (state: IAutoMovieMotionHumanPerformanceState) => BoneReader = (
    state: IAutoMovieMotionHumanPerformanceState,
  ): BoneReader => {
    const kept: Map<
      string,
      ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
    > = new Map();
    return (
      person: string,
      k: number,
      seconds: number,
    ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const key: string = `${person}:${k}`;
      let read:
        | ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
        | undefined = kept.get(key);
      if (read === undefined) {
        read = HumanPerformanceRead.bones(state, person, seconds);
        kept.set(key, read);
      }
      return read;
    };
  };

  /** The grip that holds a particle at a second: the one that closed last among those open. */
  export const owner: (
    grips: readonly IGripAnchor[],
    particle: number,
    seconds: number,
  ) => IGripAnchor | undefined = (
    grips: readonly IGripAnchor[],
    particle: number,
    seconds: number,
  ): IGripAnchor | undefined =>
    grips
      .filter(
        (g: IGripAnchor): boolean =>
          g.particle === particle && seconds >= g.from && seconds <= g.to,
      )
      .reduce<
        IGripAnchor | undefined
      >((last: IGripAnchor | undefined, g: IGripAnchor): IGripAnchor => (last === undefined || g.from >= last.from ? g : last), undefined);

  /** A hand's grip socket in the world at a step. */
  export const gripSocket: (
    state: IAutoMovieMotionHumanPerformanceState,
    bones: BoneReader,
    person: string,
    side: "left" | "right",
    k: number,
    seconds: number,
  ) => IAutoMovieVector3 = (
    state: IAutoMovieMotionHumanPerformanceState,
    bones: BoneReader,
    person: string,
    side: "left" | "right",
    k: number,
    seconds: number,
  ): IAutoMovieVector3 => {
    const socket: IAutoMovieHumanoidSurfaces.IFrame =
      HumanPerformanceRead.person(state, person).performer.body.surfaces.sockets[
        `grip${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidSocket
      ];
    const hand: IAutoMovieResolvedBone = bones(person, k, seconds).get(
      `${side}Hand`,
    )!;
    return Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(hand.worldRotation, socket.point),
    );
  };

  /** The node name prefix of an anchor a grip makes. */
  export const GRIP: string = "grip:";

  /** Step 0's positions: the rest with the first boundary's anchors applied, as the engine starts. */
  export const rest: (
    domain: IAutoMovieSoftBodyDomain,
    first: IAutoMovieSoftBodyBoundarySample,
  ) => number[] = (
    domain: IAutoMovieSoftBodyDomain,
    first: IAutoMovieSoftBodyBoundarySample,
  ): number[] => {
    const out: number[] = [...domain.rest];
    for (const a of first.anchors) {
      out[a.particle * 3] = a.position.x;
      out[a.particle * 3 + 1] = a.position.y;
      out[a.particle * 3 + 2] = a.position.z;
    }
    return out;
  };
}
