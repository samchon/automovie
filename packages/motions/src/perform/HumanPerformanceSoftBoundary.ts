import {
  Quaternion,
  Vector3,
  softBodyRestConfiguration,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidSocket,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieSoftAnchorBinding,
  IAutoMovieSoftBodyBoundarySample,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyResolvedCapsule,
  IAutoMovieSoftCollider,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanObjectCord } from "./HumanObjectCord";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/** The record of `IHumanPerformanceSoftBoundaryAnchorsItem`'s site. */
type IHumanPerformanceSoftBoundaryAnchorsItem = {
  particle: number;
  position: IAutoMovieVector3;
};

/**
 * One step's boundary of a soft prop in a performance: every moving anchor's
 * world point (an `actor-bone` binding on its person's displayed bone, a `node`
 * binding on a rigid prop's frame or a span endpoint on that prop, a grip's
 * particle on the gripping hand's grip socket), the grips' particles released
 * at this step, and every body capsule on its person's displayed bones.
 *
 * @param state The performance.
 * @param domain The soft domain with its grips' anchors added.
 * @param grips The grips that bind particles.
 * @param gripped The particles whose anchors this replay assigned to grips.
 * @param bones The displayed bones by person and step.
 * @param k The absolute step.
 * @param seconds Its film second.
 * @param spanEnds A span's world endpoints for the first and last particles at
 *   this step.
 * @returns The step's boundary sample.
 */
export function HumanPerformanceSoftBoundary(
  state: IAutoMovieMotionHumanPerformanceState,
  domain: IAutoMovieSoftBodyDomain,
  grips: readonly HumanPerformanceSoftBoundary.IGripAnchor[],
  gripped: ReadonlySet<number>,
  bones: HumanPerformanceSoftBoundary.BoneReader,
  k: number,
  seconds: number,
  spanEnds?: IAutoMovieMotionHumanObject.ISpanEnds,
): IAutoMovieSoftBodyBoundarySample {
  const anchors: IHumanPerformanceSoftBoundaryAnchorsItem[] = [];
  const released: number[] = [];
  for (const anchor of domain.anchors) {
    const binding: IAutoMovieSoftAnchorBinding | undefined = anchor.binding;
    if (binding === undefined) continue;
    if (gripped.has(anchor.particle)) {
      const g: HumanPerformanceSoftBoundary.IGripAnchor | undefined =
        HumanPerformanceSoftBoundary.owner(grips, anchor.particle, seconds);
      if (g === undefined) released.push(anchor.particle);
      else
        anchors.push({
          particle: anchor.particle,
          position: HumanPerformanceSoftBoundary.gripSocket(
            state,
            bones,
            g.person,
            g.side,
            k,
            seconds,
          ),
        });
      continue;
    }
    if (binding.kind === "node") {
      const endpoint: IAutoMovieVector3 | undefined =
        anchor.particle === 0
          ? spanEnds?.from
          : anchor.particle === domain.lattice.rows - 1
            ? spanEnds?.to
            : undefined;
      anchors.push({
        particle: anchor.particle,
        position:
          endpoint ??
          place(
            HumanPerformanceRead.prop(state, binding.node, seconds),
            binding.offset,
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
 * Companion of {@link HumanPerformanceSoftBoundary}: the grip record, the bone
 * reader and the small helpers the soft pass shares.
 */
export namespace HumanPerformanceSoftBoundary {
  /** A grip that binds a particle to a hand's socket for a window. */
  export interface IGripAnchor {
    /** The particle held. */
    particle: number;

    /** The gripping person. */
    person: string;

    /** The gripping hand. */
    side: AutoMovieHumanSide;

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

  /**
   * The displayed bones a soft pass reads, read before its solves: every step
   * of each person a moving anchor (`actor-bone`) or a body capsule names, and
   * the steps of each grip window for its gripping person. The solves replay
   * from step 0 once per grip, so each of these reads serves every replay.
   *
   * @param state The performance.
   * @param domain The soft domain as seeded.
   * @param windows The grip windows on the prop, clipped to the performance.
   * @param count The domain's last step.
   * @param dt The domain's fixed step, seconds.
   * @returns The bones by person and step.
   */
  export function prepareBones(
    state: IAutoMovieMotionHumanPerformanceState,
    domain: IAutoMovieSoftBodyDomain,
    windows: readonly IAutoMovieMotionHumanPerformanceState.IGrip[],
    count: number,
    dt: number,
  ): BoneReader {
    const steps: Map<string, Set<number>> = new Map();
    const need = (person: string, from: number, to: number): void => {
      const wanted: Set<number> = steps.get(person) ?? new Set();
      for (let k: number = from; k <= to; ++k) wanted.add(k);
      steps.set(person, wanted);
    };
    for (const anchor of domain.anchors)
      if (anchor.binding?.kind === "actor-bone")
        need(anchor.binding.actor, 0, count);
    for (const collider of domain.colliders)
      if (collider.kind === "body-capsule") need(collider.actor, 0, count);

    // A grip's particle is bound from the step nearest its closing second and
    // its socket read at every step it holds.
    for (const window of windows)
      need(
        window.subject,
        Math.max(0, Math.floor(window.from / dt)),
        Math.min(count, Math.ceil(window.to / dt)),
      );
    const read: Map<
      string,
      Map<number, ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>>
    > = new Map(
      [...steps].map(
        ([person, wanted]: [string, Set<number>]): [
          string,
          Map<
            number,
            ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
          >,
        ] => [
          person,
          new Map(
            [...wanted].map(
              (
                k: number,
              ): [
                number,
                ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
              ] => [k, HumanPerformanceRead.bones(state, person, k * dt)],
            ),
          ),
        ],
      ),
    );
    return (
      person: string,
      k: number,
    ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      read.get(person)!.get(k)!;
  }

  /**
   * The grip that holds a particle at a second: the one that closed last among
   * those open.
   */
  export function owner(
    grips: readonly IGripAnchor[],
    particle: number,
    seconds: number,
  ): IGripAnchor | undefined {
    return grips
      .filter(
        (g: IGripAnchor): boolean =>
          g.particle === particle && seconds >= g.from && seconds <= g.to,
      )
      .reduce<
        IGripAnchor | undefined
      >((last: IGripAnchor | undefined, g: IGripAnchor): IGripAnchor => (last === undefined || g.from >= last.from ? g : last), undefined);
  }

  /** A hand's grip socket in the world at a step. */
  export function gripSocket(
    state: IAutoMovieMotionHumanPerformanceState,
    bones: BoneReader,
    person: string,
    side: AutoMovieHumanSide,
    k: number,
    seconds: number,
  ): IAutoMovieVector3 {
    const socket: IAutoMovieHumanoidSurfaces.IFrame =
      HumanPerformanceRead.person(state, person).performer.body.surfaces
        .sockets[
        `grip${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidSocket
      ];
    const hand: IAutoMovieResolvedBone = bones(person, k, seconds).get(
      `${side}Hand`,
    )!;
    return Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(hand.worldRotation, socket.point),
    );
  }
  /** The record of `IHumanPerformanceSoftBoundarySeedResult`'s site. */
  type IHumanPerformanceSoftBoundarySeedResult = {
    seed: IAutoMovieSoftBodyDomain;
    spans?: readonly IAutoMovieMotionHumanObject.ISpanEnds[];
  };

  /**
   * Seed the actual first placement and reuse model-span samples across grip
   * replays.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the initial placement and the replay sample lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Takes the first pair of endpoints through the same span reader as later samples, preserving the declaration's rest length in the seeded lattice.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The cord builder seeds the lattice from the first pair of endpoints and samples the remaining pairs in film order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A domain without a declared span length keeps its supplied rest array, and an overextended span with a declared length is refused at initial placement.
   * @evidence contracts/development/implementation.md#efficient-algorithms One linear seed in links and one owner pose and span lookup per distinct native step.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each solver pass reads the same planned model boundaries for the native clock.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds one endpoint pair per admitted native step.
   */
  export function seed(
    state: IAutoMovieMotionHumanPerformanceState,
    domain: IAutoMovieSoftBodyDomain,
    span: IAutoMovieMotionHumanProp.ISoftSpan | undefined,
    count: number,
  ): IHumanPerformanceSoftBoundarySeedResult {
    if (span === undefined) return { seed: domain };

    const initial: IAutoMovieMotionHumanObject.ISpanEnds = placedSpan(
      state,
      domain,
      span,
      0,
    );
    const seed: IAutoMovieSoftBodyDomain =
      span.length === undefined
        ? domain
        : {
            ...domain,
            rest: HumanObjectCord.rest(
              span.id,
              initial,
              span.length,
              domain.lattice.rows - 1,
              domain.solver.gravity,
            ),
          };
    const spans: IAutoMovieMotionHumanObject.ISpanEnds[] = [initial];
    const dt: number = domain.solver.fixedStepSeconds;
    for (let step: number = 1; step <= count; ++step)
      spans.push(placedSpan(state, domain, span, step * dt));
    return { seed, spans };
  }

  /**
   * The owner's span ends in world metres, from one prop frame and at most one
   * posed model read.
   */
  function placedSpan(
    state: IAutoMovieMotionHumanPerformanceState,
    domain: IAutoMovieSoftBodyDomain,
    binding: IAutoMovieMotionHumanProp.ISoftSpan,
    seconds: number,
  ): IAutoMovieMotionHumanObject.ISpanEnds {
    const owner: IAutoMovieMotionHumanProp | undefined = state.props.get(
      binding.owner,
    );
    const frame: IAutoMovieRigidTransform = HumanPerformanceRead.prop(
      state,
      binding.owner,
      seconds,
    );
    if (
      owner?.articulate !== undefined &&
      HumanPerformanceObject.writers(state, owner).length !== 0
    ) {
      const posed: IAutoMovieMotionHumanProp.IPosed =
        HumanPerformanceObject.pose(state, owner, seconds);
      if (posed.span === undefined)
        throw new Error(
          `Prop "${binding.owner}" does not supply posed endpoints for span "${binding.id}".`,
        );
      const ends: IAutoMovieMotionHumanObject.ISpanEnds = posed.span(
        binding.id,
      );
      return { from: place(frame, ends.from), to: place(frame, ends.to) };
    }
    const from: IAutoMovieSoftAnchorBinding | undefined =
      domain.anchors[0]?.binding;
    const to: IAutoMovieSoftAnchorBinding | undefined =
      domain.anchors[1]?.binding;
    if (
      from?.kind !== "node" ||
      to?.kind !== "node" ||
      from.node !== binding.owner ||
      to.node !== binding.owner
    )
      throw new Error(
        `Cord "${domain.id}" needs both of its model span anchors.`,
      );
    return { from: place(frame, from.offset), to: place(frame, to.offset) };
  }

  /** The node name prefix of an anchor a grip makes. */
  export const GRIP: string = "grip:";

  /**
   * Step 0's positions: the rest with the first boundary's anchors applied, as
   * the engine starts.
   */
  export const rest: (
    domain: IAutoMovieSoftBodyDomain,
    first: IAutoMovieSoftBodyBoundarySample,
  ) => number[] = (
    domain: IAutoMovieSoftBodyDomain,
    first: IAutoMovieSoftBodyBoundarySample,
  ): number[] => {
    const out: number[] = softBodyRestConfiguration(domain);
    for (const a of first.anchors) {
      out[a.particle * 3] = a.position.x;
      out[a.particle * 3 + 1] = a.position.y;
      out[a.particle * 3 + 2] = a.position.z;
    }
    return out;
  };
}

/** Express a rigid prop's local anchor offset in world metres. */
function place(
  frame: IAutoMovieRigidTransform,
  offset: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, offset),
  );
}
