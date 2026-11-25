import { physicalShapePairDistance } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { weldHumanSimulationProfile } from "./weldHumanSimulationProfile";

/**
 * The grips one simulated performer holds on another inside a window, each as
 * the solver's collider relationship: a hand's contact window of kind `grip`
 * whose support is a person the window also simulates.
 *
 * The gripping hand's actuator chain is its upper arm, forearm and the segment
 * that carries the hand: the hand's own, or the forearm when the window welds
 * the hand into it (`weldHumanSimulationProfile`). The receiver is the
 * partner's segment that carries the gripped region or bone, the nearest
 * profile segment up the rig when the bone carries none. Of the hand's own
 * colliders, wherever they ride, and the receiver's, the pair nearest each
 * other in the sampled poses at the grip's first step is the pair bound, the
 * pair the authored grip actually closes.
 *
 * @param performance The performance the window samples.
 * @param bodies The simulated performers' bodies, by subject.
 * @param profiles The profiles the window solves, by subject: the bodies' with
 *   their welds applied.
 * @param targets Each simulated performer's sampled segment poses, by step.
 * @param clock The window's first film second, interval count and rate.
 * @returns The grips, in performer then placement order.
 * @throws {HumanRefusal} When a gripping arm has no actuator segment in the
 *   profile.
 */
export function bindHumanSimulationGrips(
  performance: IAutoMovieMotionHumanPerformance,
  bodies: ReadonlyMap<string, IAutoMovieMotionHumanBody>,
  profiles: ReadonlyMap<string, IAutoMoviePhysicalProfile>,
  targets: ReadonlyMap<
    string,
    readonly Record<string, IAutoMovieRigidTransform>[]
  >,
  clock: bindHumanSimulationGrips.IClock,
): bindHumanSimulationGrips.IGrip[] {
  const grips: bindHumanSimulationGrips.IGrip[] = [];
  for (const subject of bodies.keys())
    for (const segment of performance.segments(subject))
      for (const window of segment.plan.contacts) {
        const support: IAutoMovieMotionHumanContactWindow.Support =
          window.support;
        if (
          window.kind !== "grip" ||
          support.kind !== "person" ||
          (window.part !== "leftHand" && window.part !== "rightHand")
        )
          continue;
        const partner: IAutoMovieMotionHumanBody | undefined = bodies.get(
          support.subject,
        );
        if (partner === undefined || support.subject === subject) continue;
        const span: readonly [number, number] = steps(segment, window, clock);
        if (span[0] > span[1]) continue;
        const side: AutoMovieHumanSide =
          window.part === "leftHand" ? "left" : "right";
        const profile: IAutoMoviePhysicalProfile = profiles.get(subject)!;
        const arm: readonly AutoMovieHumanoidBone[] = [
          `${side}UpperArm`,
          `${side}LowerArm`,
        ];
        for (const bone of arm)
          if (
            !profile.segments.some(
              (s: IAutoMoviePhysicalSegment): boolean => s.bone === bone,
            )
          )
            throw new HumanRefusal({
              kind: "parameter",
              axis: "window.subjects",
              value: subject,
              feasible: null,
              reason: `${subject}'s physical profile has no ${bone} segment for its grip on ${support.subject}`,
              fix: "simulate a body whose profile carries the arm's segments",
            });

        // The hand rides its carrier when the window welds it
        // (`weldHumanSimulationProfile`), so the chain ends at the carrier and
        // the bound collider is one of the hand's own, wherever it rides.
        const hand: AutoMovieHumanoidBone = `${side}Hand`;
        const carried: string = carrier(bodies.get(subject)!, profile, hand);
        const chain: string[] = [...new Set<string>([...arm, carried])];
        const own: ReadonlySet<string> = subtree(bodies.get(subject)!, hand);
        const held: AutoMovieHumanoidBone =
          "region" in support
            ? partner.surfaces.regions[support.region].bone
            : support.bone;
        const receiver: string = carrier(
          partner,
          profiles.get(support.subject)!,
          held,
        );
        const first: readonly [string, string] = nearest(
          profile,
          carried,
          (shape: IAutoMoviePhysicalShape): boolean =>
            carried === hand ||
            own.has(weldHumanSimulationProfile.rider(shape.id) ?? carried),
          targets.get(subject)![span[0]]!,
          profiles.get(support.subject)!,
          receiver,
          targets.get(support.subject)![span[0]]!,
        );
        grips.push({
          subject,
          partner: support.subject,
          side,
          chain,
          source: { bone: carried, shape: first[0] },
          target: { bone: receiver, shape: first[1] },
          from: span[0],
          to: span[1],
        });
      }
  return grips;
}

/** Companion types of {@link bindHumanSimulationGrips}. */
export namespace bindHumanSimulationGrips {
  /**
   * A window's grid: its first film second, interval count and intervals per
   * second.
   */
  export interface IClock {
    /** First film second, step zero. */
    from: number;

    /** Intervals in the window. */
    count: number;

    /** Intervals per second. */
    rate: number;
  }

  /** A collider on a segment, by bone and shape id. */
  export interface ICollider {
    /** The segment's bone. */
    bone: string;

    /** The shape's id within the segment. */
    shape: string;
  }

  /** One grip of one simulated performer on another. */
  export interface IGrip {
    /** The gripping performer. */
    subject: string;

    /** The gripped performer. */
    partner: string;

    /** The gripping hand. */
    side: AutoMovieHumanSide;

    /**
     * The actuator chain, proximal to distal, ending at the segment carrying
     * the hand.
     */
    chain: string[];

    /** The hand's collider, on the segment that carries it. */
    source: ICollider;

    /** The partner's collider. */
    target: ICollider;

    /** First step the grip holds. */
    from: number;

    /** Last step the grip holds. */
    to: number;
  }
}

/**
 * The first and last steps of a contact window inside the window's grid; the
 * first exceeds the last when it holds at none.
 */
function steps(
  segment: IAutoMovieMotionHumanSegment,
  window: IAutoMovieMotionHumanContactWindow,
  clock: bindHumanSimulationGrips.IClock,
): readonly [number, number] {
  const begin: number = Math.max(
    segment.entryTime,
    segment.start + window.from * segment.plan.duration,
  );
  const end: number = Math.min(
    segment.end,
    segment.start + window.to * segment.plan.duration,
  );
  const first: number = Math.max(
    1,
    Math.ceil((begin - clock.from) * clock.rate),
  );
  const last: number = Math.min(
    clock.count,
    Math.floor((end - clock.from) * clock.rate),
  );
  return [first, last];
}

/**
 * The profile segment that carries a rig bone: the bone's own, or its nearest
 * ancestor's.
 */
function carrier(
  body: IAutoMovieMotionHumanBody,
  profile: IAutoMoviePhysicalProfile,
  bone: AutoMovieHumanoidBone,
): string {
  const segments: ReadonlySet<string> = new Set(
    profile.segments.map((s: IAutoMoviePhysicalSegment): string => s.bone),
  );
  let at: IAutoMovieBone = body.bones.get(bone)!;
  while (!segments.has(at.bone) && at.parent !== null)
    at = body.bones.get(at.parent)!;
  return at.bone;
}

/** A rig bone and every bone below it. */
function subtree(
  body: IAutoMovieMotionHumanBody,
  root: AutoMovieHumanoidBone,
): Set<string> {
  const found: Set<string> = new Set([root]);
  const visit = (bone: AutoMovieHumanoidBone): void => {
    for (const child of body.topology.childrenByParent.get(bone) ?? []) {
      found.add(child.bone);
      visit(child.bone);
    }
  };
  visit(root);
  return found;
}

/**
 * The nearest pair of colliders of two segments in their sampled poses, the
 * first segment's colliders limited to those `keep` admits.
 */
function nearest(
  a: IAutoMoviePhysicalProfile,
  boneA: string,
  keep: (shape: IAutoMoviePhysicalShape) => boolean,
  posesA: Record<string, IAutoMovieRigidTransform>,
  b: IAutoMoviePhysicalProfile,
  boneB: string,
  posesB: Record<string, IAutoMovieRigidTransform>,
): readonly [string, string] {
  const shapes = (
    profile: IAutoMoviePhysicalProfile,
    bone: string,
  ): readonly IAutoMoviePhysicalShape[] =>
    profile.segments.find(
      (s: IAutoMoviePhysicalSegment): boolean => s.bone === bone,
    )!.shapes;
  let best: readonly [string, string] = ["", ""];
  let least: number = Infinity;
  for (const shapeA of shapes(a, boneA).filter(keep))
    for (const shapeB of shapes(b, boneB)) {
      const distance: number = physicalShapePairDistance(
        posesA[boneA]!,
        shapeA,
        posesB[boneB]!,
        shapeB,
      );
      if (distance < least) {
        least = distance;
        best = [shapeA.id, shapeB.id];
      }
    }
  return best;
}
