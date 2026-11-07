import { Quaternion, physicalJointChain } from "@automovie/engine";
import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { filmContactIntent } from "../motion/contact/filmContactIntent";
import { Fighter } from "../motion/fighter/Fighter";
import { Strike } from "../motion/striking/Strike";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import { BoutPhysicalSettings as Settings } from "./BoutPhysicalSettings";
import type { BoutTargetSource } from "./BoutTargetSource";
import { boutLimbClearanceBindings } from "./boutLimbClearanceBindings";
import { boutPostBindings } from "./boutPostBindings";

/** Bind screenplay relationships to actual collider identities. No opponent world coordinate or production-local collision/IK calculation is stored here. */
export function boutContactBindings(
  source: BoutTargetSource,
  id: FilmPlan.ActorId,
  seconds: number,
): Binding[] {
  if (id === "referee" || (id === "b" && seconds >= BoutScript.finish.at))
    return [];
  const profile: P = source.rigs[id].profile;
  const other: "a" | "b" = id === "a" ? "b" : "a";
  const bindings: Binding[] = [];
  const posts: Set<string> = new Set();
  const touch: number = Fighter.touchWeight(seconds);
  if (touch > 0)
    bindings.push(bind("touch", "leftHand", other, "leftHand", touch, true));
  for (const action of BoutScript.actions) {
    const envelope: Strike.Envelope = Strike.envelope(action, seconds);
    const intent: filmContactIntent.IIntent = filmContactIntent(action);
    const relation: filmContactIntent.Relation | null = intent.relation;
    if (action.actor !== id || !envelope.active) continue;
    const side: "left" | "right" = intent.side;
    const receiver: "left" | "right" = intent.receiverSide;
    const kick: boolean = intent.kick;
    if (kick && !posts.has(side)) {
      posts.add(side);
      bindings.push(
        ...boutPostBindings(
          profile,
          { body: other, profile: source.rigs[other].profile },
          side,
        ),
      );
      bindings.push(
        ...boutLimbClearanceBindings(
          profile,
          { body: other, profile: source.rigs[other].profile },
          `${side}UpperLeg`,
          `weapon:${side}`,
        ),
      );
    }
    if (!relation) continue;
    const bone: string = intent.sourceBone;
    const target: string = intent.targetBone;
    const binding: Binding = bind(
      action.id,
      bone,
      other,
      target,
      kick ? Strike.kickContactWeight(action, seconds) : envelope.extension,
      !kick,
    );
    if (relation === "head") {
      const head: P.ISegment = source.rigs[other].profile.segments.find(
        (segment: P.ISegment): boolean => segment.bone === "head",
      )!;
      binding.target.normal = Quaternion.rotateVector(
        Quaternion.inverse(head.neutral.rotation),
        kick
          ? { x: 0, y: 0, z: receiver === "right" ? -1 : 1 }
          : { x: 1, y: 0, z: 0 },
      );
    }
    bindings.push(binding);
  }
  return bindings;

  /** Use the declared equipment/skin shape and its own compression allowance. */
  function bind(
    name: string,
    bone: string,
    body: "a" | "b",
    targetBone: string,
    weight: number,
    glove: boolean,
  ): Binding {
    const own: P.IShape = select(profile, bone, glove);
    const receiver: P = source.rigs[body].profile;
    const target: P.IShape = select(
      receiver,
      targetBone,
      targetBone.endsWith("Hand"),
    );
    // Whole kicking-limb separation requests tangent contact, even against a soft glove.
    const compression: number = glove
      ? (profile.materials.find(
          (material: P.IMaterial): boolean => material.id === own.material,
        )?.maximumCompression ?? 0) +
        (receiver.materials.find(
          (material: P.IMaterial): boolean => material.id === target.material,
        )?.maximumCompression ?? 0)
      : 0;
    return {
      id: name,
      kind: "contact",
      chain: physicalJointChain(profile, bone),
      source: { bone, shape: own.id },
      target: { body, bone: targetBone, shape: target.id },
      weight,
      compression,
      iterations: Settings.targetIterations,
      tolerance: Settings.targetTolerance,
    };
  }
}

/** Resolve an authored body region through its actual equipment or provider geometry. */
function select(profile: P, bone: string, glove: boolean): P.IShape {
  const segment: P.ISegment = profile.segments.find(
    (candidate: P.ISegment): boolean => candidate.bone === bone,
  )!;
  return (
    (glove
      ? segment.shapes.find(
          (shape: P.IShape): boolean => shape.material === "glove",
        )
      : undefined) ?? segment.shapes[0]!
  );
}
