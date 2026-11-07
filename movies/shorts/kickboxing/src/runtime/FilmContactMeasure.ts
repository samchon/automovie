import type { preparePhysicalGeometry as Geometry } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { FilmActor } from "../assets/person/FilmActor";
import type { ImpactEffects } from "../motion/consequences/ImpactEffects";
import { filmContactIntent } from "../motion/contact/filmContactIntent";
import type { FilmBodyRig as BodyRig } from "../motion/rig/FilmBodyRig";
import { FilmVector as Vec3 } from "../motion/rig/FilmVector";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";

/**
 * Measurements of one performed strike on the displayed bodies: its landing
 * for effects and the signed separation between the colliders of its striking
 * surface and of the receiving region its computed outcome promises. Goal
 * authoring and this audit read the same contact intent, so a refused contact
 * means the displayed bodies did not meet, never that two landmarks disagree.
 */
export namespace FilmContactMeasure {
  /** One displayed body: its rig and the solved pose under its corrected root. */
  export interface IBody {
    /** Provider rig and declared colliders. */ rig: BodyRig;
    /** Displayed clinical pose. */ pose: BodyRig.Result["pose"];
    /** Displayed root after ground correction. */ root: BodyRig.Placement;
  }

  /** Farthest separation the query reports; anything beyond is plainly no contact. */
  const PREDICTION: number = 1;

  /** The landing of a measured contact at the currently displayed second. */
  export function impact(
    actors: Readonly<Record<FilmPlan.ActorId, FilmActor>>,
    action: BoutScript.Action,
    relation: ImpactEffects.Impact["relation"],
  ): ImpactEffects.Impact {
    const attacker: FilmActor = actors[action.actor];
    const receiver: FilmActor = actors[action.actor === "a" ? "b" : "a"];
    const intent: filmContactIntent.IIntent = filmContactIntent(action);
    return {
      id: action.id,
      seconds: action.at,
      attacker: action.actor,
      receiver: action.actor === "a" ? "b" : "a",
      relation,
      side: intent.receiverSide,
      weapon: intent.kick ? "shin" : intent.side,
      point: intent.kick ? attacker.point(intent.sourceBone) : attacker.glove(intent.side),
      direction: Vec3.normalize(Vec3.sub(receiver.point("chest"), attacker.point("chest"))),
      strength: 1,
      finish: action === BoutScript.finish,
    };
  }

  /** Signed separation between the striking surface and the promised receiving region, metres; negative is compression. */
  export function gap(
    bodies: Readonly<Record<"a" | "b", IBody>>,
    action: BoutScript.Action,
    queries: Geometry.IQueries,
  ): number {
    const intent: filmContactIntent.IIntent = filmContactIntent(action);
    const receiver: "a" | "b" = action.actor === "a" ? "b" : "a";
    // A guard is the whole set forearm and glove on the threatened side.
    const targets: readonly string[] =
      intent.relation === "guard" ? [`${intent.receiverSide}Hand`, `${intent.receiverSide}LowerArm`] : [intent.targetBone];
    const weapons: Geometry.ICollider[] = colliders(action.actor, bodies[action.actor], [intent.sourceBone]);
    const received: Geometry.ICollider[] = colliders(receiver, bodies[receiver], targets);
    let best: number = Infinity;
    for (const weapon of weapons)
      for (const target of received)
        best = Math.min(best, queries.contact(weapon, target, action.at, PREDICTION)?.separation ?? Infinity);
    return best;
  }

  /** Every declared collider of the named segments in the displayed placement. */
  function colliders(body: string, input: IBody, bones: readonly string[]): Geometry.ICollider[] {
    const segments: Readonly<Record<string, P.ITransform>> = input.rig.trunk(input.pose, input.root).segments;
    return input.rig.profile.segments
      .filter((segment: P.ISegment): boolean => bones.includes(segment.bone))
      .flatMap((segment: P.ISegment): Geometry.ICollider[] =>
        segment.shapes.map(
          (shape: P.IShape): Geometry.ICollider => ({ body, bone: segment.bone, shape, pose: segments[segment.bone]! }),
        ),
      );
  }
}
