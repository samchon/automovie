import type { FilmActor } from "../assets/person/FilmActor";
import type { ImpactEffects } from "../motion/consequences/ImpactEffects";
import { FilmVector as Vec3 } from "../motion/rig/FilmVector";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";

/** Measurements of one performed strike on the displayed actors: its landing for effects and the gap between its weapon and the surface its outcome promises. */
export namespace FilmContactMeasure {
  /** The landing of a measured contact at the currently displayed second. */
  export function impact(
    actors: Readonly<Record<FilmPlan.ActorId, FilmActor>>,
    action: BoutScript.Action,
    relation: ImpactEffects.Impact["relation"],
  ): ImpactEffects.Impact {
    const attacker: FilmActor = actors[action.actor];
    const receiver: FilmActor = actors[action.actor === "a" ? "b" : "a"];
    const spec: (typeof BoutScript.specs)[BoutScript.Technique] =
      BoutScript.specs[action.technique];
    const kick: boolean = BoutScript.specs[action.technique].limb === "leg";
    const point: Vec3.Value = kick
      ? Vec3.lerp(
          attacker.point(`${spec.side}LowerLeg`),
          attacker.point(`${spec.side}Foot`),
          0.7,
        )
      : attacker.glove(spec.side);
    return {
      id: action.id,
      seconds: action.at,
      attacker: action.actor,
      receiver: action.actor === "a" ? "b" : "a",
      relation,
      side: spec.side === "left" ? "right" : "left",
      weapon: kick ? "shin" : spec.side,
      point,
      direction: Vec3.normalize(
        Vec3.sub(receiver.point("chest"), attacker.point("chest")),
      ),
      strength: 1,
      finish: action === BoutScript.finish,
    };
  }

  /** Gap between the attacking surface and its planned receiving surface, metres. */
  export function gap(
    actors: Readonly<Record<FilmPlan.ActorId, FilmActor>>,
    action: BoutScript.Action,
  ): number {
    const attacker: FilmActor = actors[action.actor];
    const receiver: FilmActor = actors[action.actor === "a" ? "b" : "a"];
    const spec: (typeof BoutScript.specs)[BoutScript.Technique] =
      BoutScript.specs[action.technique];
    const struck: "left" | "right" = spec.side === "left" ? "right" : "left";
    const kick: boolean = BoutScript.specs[action.technique].limb === "leg";
    const weapon: (point: Vec3.Value) => number = (
      point: Vec3.Value,
    ): number => {
      if (!kick) return Vec3.distance(attacker.glove(spec.side), point) - 0.095;
      const knee: Vec3.Value = attacker.point(`${spec.side}LowerLeg`);
      const ankle: Vec3.Value = attacker.point(`${spec.side}Foot`);
      return segment(point, knee, ankle) - 0.055;
    };
    switch (action.defense) {
      case "check": {
        const knee: Vec3.Value = receiver.point("leftLowerLeg");
        const ankle: Vec3.Value = receiver.point("leftFoot");
        const kneeA: Vec3.Value = attacker.point(`${spec.side}LowerLeg`);
        const ankleA: Vec3.Value = attacker.point(`${spec.side}Foot`);
        let best: number = Infinity;
        for (let i: number = 0; i <= 10; i++)
          best = Math.min(
            best,
            segment(Vec3.lerp(kneeA, ankleA, i / 10), knee, ankle),
          );
        return best - 0.11;
      }
      case "hit":
      case "none": {
        if (spec.target === "head") {
          // The struck jaw-side surface point in the frame the face looks along (toward
          // the attacker), the same point the kick aims at in Resolve.
          const toward: Vec3.Value = Vec3.sub(
            attacker.point("hips"),
            receiver.point("head"),
          );
          const forward: Vec3.Value = Vec3.normalize([toward[0], 0, toward[2]]);
          const left: Vec3.Value = Vec3.rotateY(
            [0, 0, 1],
            Vec3.heading(forward),
          );
          const jaw: Vec3.Value = Vec3.add(
            receiver.point("head"),
            Vec3.add(
              Vec3.add(
                Vec3.scale(forward, 0.06),
                Vec3.scale(left, struck === "left" ? 0.07 : -0.07),
              ),
              [0, -0.05, 0],
            ),
          );
          return weapon(jaw);
        }
        const chest: Vec3.Value = receiver.point("chest");
        const hips: Vec3.Value = receiver.point("hips");
        let best: number = Infinity;
        for (let i: number = 0; i <= 10; i++)
          best = Math.min(best, weapon(Vec3.lerp(hips, chest, i / 10)));
        return best - 0.14;
      }
      case "parry":
      case "cover":
      case "catch":
      case "block":
      case "slip":
      case "weave":
      case "lean": {
        if (spec.shape === "uppercut")
          return (
            Math.min(
              weapon(receiver.glove("left")),
              weapon(receiver.glove("right")),
            ) - 0.095
          );
        if (kick) {
          const forearm: Vec3.Value = Vec3.lerp(
            receiver.point(`${struck}LowerArm`),
            receiver.point(`${struck}Hand`),
            0.5,
          );
          return Math.min(
            weapon(receiver.glove(struck)) - 0.095,
            weapon(forearm) - 0.05,
          );
        }
        return weapon(receiver.glove(struck)) - 0.095;
      }
    }
  }
}

/** Distance from a point to a segment. */
function segment(point: Vec3.Value, a: Vec3.Value, b: Vec3.Value): number {
  const ab: Vec3.Value = Vec3.sub(b, a);
  const u: number = Math.max(
    0,
    Math.min(
      1,
      Vec3.dot(Vec3.sub(point, a), ab) / Math.max(1e-12, Vec3.dot(ab, ab)),
    ),
  );
  return Vec3.distance(point, Vec3.add(a, Vec3.scale(ab, u)));
}
