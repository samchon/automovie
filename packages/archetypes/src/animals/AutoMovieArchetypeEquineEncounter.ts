import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeRide,
} from "../core";
import type { AutoMovieArchetypeEquineEncounterCue } from "./AutoMovieArchetypeEquineEncounterCue";
import { AutoMovieArchetypeEquineExpression } from "./AutoMovieArchetypeEquineExpression";
import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";
import { AutoMovieArchetypeEquineStance } from "./AutoMovieArchetypeEquineStance";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * Two horses' agonistic encounter on one scene clock: threats, bites, rearing
 * strikes and double-barrel kicks aimed at named regions of the other horse,
 * the struck horse's response and an optional retreat.
 *
 * Each horse rides into the encounter and halts. A strike or kick is a stance
 * row (`EquineEncounterRows`) whose hooves go to the aimed region's surface on
 * the other horse's halted body, read from its bar: the region's point on the
 * bar's axis pushed out along the bar's radius toward the attacker; the hoof's
 * endpoint goes onto that point with its terminal bar along the inward normal,
 * so the hoof's sole meets the surface end-on without entering it. A bite is a
 * touching muzzle reach (`AutoMovieArchetypeEquineExpression`) onto the
 * region's surface facing the biter's poll, so the head comes in along the
 * surface's normal, tracked on the other horse's staged ride. A threat pins
 * both ears back and faces the other horse's head. When each contact act ends
 * the struck horse pins its ears and turns its head to the attacker for
 * `RESPONSE`, so the touched region holds still while touched and the
 * attacker's limbs are back down. A retreat plays its own ride from its start
 * second, beginning at the halt. An unreachable region is refused by the stance
 * or the reach.
 */
export namespace AutoMovieArchetypeEquineEncounter {
  /**
   * Stage an encounter.
   *
   * @param animals The two equids at rest, as their producers built them.
   * @param horses Their rides into the encounter and their retreats.
   * @param acts The acts.
   * @returns The two staged rides.
   * @throws {AutoMovieArchetypeRefusal} As the stance and the expression layer
   *   refuse: an act while moving, overlapping acts, or an unreachable region.
   */
  export function stage<Id extends string, D extends string>(
    animals: Pair<AutoMovieArchetype<Id, D>>,
    horses: Pair<AutoMovieArchetypeEquineEncounterCue.IHorse<Id, D>>,
    acts: readonly AutoMovieArchetypeEquineEncounterCue.Act[],
  ): Pair<AutoMovieArchetypeRide.IRide<Id, D>> {
    const halts: Pair<AutoMovieArchetypeRide.ISample<Id, D>> = [
      horses[0].ride.at(horses[0].ride.duration),
      horses[1].ride.at(horses[1].ride.duration),
    ];
    const stanceOf = (horse: number): AutoMovieArchetypeRide.IRide<Id, D> => {
      const me: AutoMovieArchetypeRide.ISample<Id, D> = halts[horse]!;
      const other: AutoMovieArchetypeRide.ISample<Id, D> = halts[1 - horse]!;
      const rows: AutoMovieArchetypeEquineStanceCue.Cue[] = [];
      for (const act of acts) {
        if (act.horse !== horse) continue;
        if (act.kind === "strike") {
          rows.push({
            kind: "strike",
            side: act.side,
            from: act.from,
            entry: act.entry,
            hold: act.hold,
            exit: act.exit,
            ...hoof(me, other, act.region, `${act.side}Fore`),
          });
        } else if (act.kind === "kick")
          rows.push({
            kind: "kick",
            from: act.from,
            entry: act.entry,
            hold: act.hold,
            exit: act.exit,
            hooves: {
              left: hoof(me, other, act.region, "leftHind"),
              right: hoof(me, other, act.region, "rightHind"),
            },
          });
      }
      return AutoMovieArchetypeEquineStance.after(
        animals[horse]!,
        horses[horse]!.ride,
        rows,
      );
    };
    const stances: Pair<AutoMovieArchetypeRide.IRide<Id, D>> = [
      stanceOf(0),
      stanceOf(1),
    ];
    const stagedOf = (horse: number): AutoMovieArchetypeRide.IRide<Id, D> => {
      const other: AutoMovieArchetypeRide.IRide<Id, D> = stances[1 - horse]!;
      const head = (seconds: number): IAutoMovieVector3 =>
        center(other.at(seconds), "head");
      const cues: AutoMovieArchetypeEquineExpressionCue.Cue[] = [];
      const face = (
        window: AutoMovieArchetypeEquineExpressionCue.IWindow,
      ): void => {
        cues.push({ kind: "ear", side: "left", carriage: "pinned", ...window });
        cues.push({
          kind: "ear",
          side: "right",
          carriage: "pinned",
          ...window,
        });
        cues.push({
          kind: "attend",
          target: { kind: "track", at: head },
          ...window,
        });
      };
      for (const act of acts) {
        if (act.horse === horse && act.kind === "threat")
          face({ from: act.from, to: act.to, ease: act.ease });
        else if (act.horse === horse && act.kind === "bite") {
          const biter: AutoMovieArchetypeRide.ISample<Id, D> = halts[horse]!;
          cues.push({
            kind: "reach",
            act: "bite",
            gap: 0,
            from: act.from,
            to: act.to,
            ease: act.ease,
            target: {
              kind: "track",
              at: (seconds: number): IAutoMovieVector3 =>
                bitten(biter, other.at(seconds), act.region),
            },
            around: {
              at: (seconds: number): AutoMovieArchetypeRide.IPose<Id, D> =>
                other.at(seconds),
            },
          });
        } else if (act.horse !== horse) {
          if (act.kind === "threat") continue;
          // The response follows the act's end, so the struck region holds still while it is touched and the attacker's limbs are down.
          const contact: number =
            act.kind === "bite"
              ? act.to
              : act.from + act.entry + act.hold + act.exit;
          const attacker: AutoMovieArchetypeRide.IRide<Id, D> =
            stances[1 - horse]!;
          const window: AutoMovieArchetypeEquineExpressionCue.IWindow = {
            from: contact,
            to: contact + RESPONSE.seconds,
            ease: RESPONSE.ease,
          };
          cues.push({
            kind: "ear",
            side: "left",
            carriage: "pinned",
            ...window,
          });
          cues.push({
            kind: "ear",
            side: "right",
            carriage: "pinned",
            ...window,
          });
          cues.push({
            kind: "attend",
            target: {
              kind: "track",
              at: (seconds: number): IAutoMovieVector3 =>
                center(attacker.at(seconds), "head"),
            },
            ...window,
          });
        }
      }
      const expressed: AutoMovieArchetypeRide.IRide<Id, D> =
        AutoMovieArchetypeEquineExpression.layer(
          animals[horse]!,
          stances[horse]!,
          cues,
        );
      return retreated(expressed, horses[horse]!.retreat);
    };
    return [stagedOf(0), stagedOf(1)];
  }

  /*
   * A ride followed by its retreat from the retreat's start second.
   */
  function retreated<Id extends string, D extends string>(
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    retreat: AutoMovieArchetypeEquineEncounterCue.IRetreat<Id, D> | undefined,
  ): AutoMovieArchetypeRide.IRide<Id, D> {
    if (retreat === undefined) return ride;
    const at = (seconds: number): AutoMovieArchetypeRide.ISample<Id, D> =>
      seconds < retreat.from
        ? ride.at(seconds)
        : retreat.ride.at(seconds - retreat.from);
    return {
      plan: ride.plan,
      duration: retreat.from + retreat.ride.duration,
      instants: [
        ...ride.instants.filter(
          (instant: Instant): boolean => instant.seconds < retreat.from,
        ),
        ...retreat.ride.instants.map(
          (instant: Instant): Instant => ({
            ...instant,
            seconds: instant.seconds + retreat.from,
          }),
        ),
      ],
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: AutoMovieArchetypeRide.ISample<Id, D> = at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }

  /*
   * Where a hoof's endpoint goes to touch a region of the other horse, and the
   * surface's outward normal, both in the attacker's halted base model space.
   */
  function hoof<Id extends string, D extends string>(
    me: AutoMovieArchetypeRide.ISample<Id, D>,
    other: AutoMovieArchetypeRide.ISample<Id, D>,
    region: AutoMovieArchetypeEquineEncounterCue.Region,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): AutoMovieArchetypeEquineEncounterCue.IContact {
    const from: IAutoMovieVector3 = center(
      me,
      AutoMovieArchetypeQuadrupedBody.BONES[limb][0],
    );
    const aimed: ISurface = surface(other, region, from, false);
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      me.placement.rotation,
    );
    return {
      point: AutoMovieEngineQuaternion.rotateVector(
        inverse,
        AutoMovieEngineVector3.subtract(aimed.point, me.placement.translation),
      ),
      normal: AutoMovieEngineQuaternion.rotateVector(inverse, aimed.normal),
    };
  }

  /*
   * Where a bite's muzzle goes on a region so the head meets the surface
   * end-on.
   *
   * The reach (`EquineHeadReach`) puts the poll on the upper intersection of
   * the neck's circle about its root and the muzzle's about the target, in the
   * vertical plane through them. The target is the region's surface point
   * facing that poll at the foot of its perpendicular onto the bar, so the head
   * runs from the poll along the surface's inward normal. Each depends on the
   * other, so the pair is refined from the halted poll by `REFINE` closed-form
   * passes.
   */
  function bitten<Id extends string, D extends string>(
    biter: AutoMovieArchetypeRide.ISample<Id, D>,
    other: AutoMovieArchetypeRide.ISample<Id, D>,
    region: AutoMovieArchetypeEquineEncounterCue.Region,
  ): IAutoMovieVector3 {
    const neck: IBar = bar(biter.archetype, "neck");
    const head: IBar = bar(biter.archetype, "head");
    const root: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
      biter.placement,
      neck.from,
    );
    const link: number = AutoMovieEngineVector3.distance(neck.from, neck.to);
    const muzzle: number = AutoMovieEngineVector3.distance(head.from, head.to) + head.radius;
    let poll: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
      biter.placement,
      head.from,
    );
    let target: IAutoMovieVector3 = poll;
    for (let pass: number = 0; pass < REFINE; pass++) {
      target = surface(other, region, poll, true).point;
      const span: number = AutoMovieEngineVector3.distance(root, target);
      const along: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
        AutoMovieEngineVector3.subtract(target, root),
        1 / span,
      );
      const up: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
        AutoMovieEngineVector3.addScaled({ x: 0, y: 1, z: 0 }, along, -along.y),
      );
      const x: number =
        (link * link - muzzle * muzzle + span * span) / (2 * span);
      poll = AutoMovieEngineVector3.addScaled(
        AutoMovieEngineVector3.addScaled(root, along, x),
        up,
        Math.sqrt(Math.max(0, link * link - x * x)),
      );
    }
    return target;
  }

  /*
   * A region's surface point facing a world point, on a sample's bar: at the
   * region's share along the bar, or, when `facing`, at the foot of the
   * perpendicular from the point onto the bar (kept within its middle), so an
   * approach from that point meets the surface end-on.
   */
  function surface<Id extends string, D extends string>(
    sample: AutoMovieArchetypeRide.ISample<Id, D>,
    region: AutoMovieArchetypeEquineEncounterCue.Region,
    toward: IAutoMovieVector3,
    facing: boolean,
  ): ISurface {
    const where: IRegion = REGIONS[region];
    const shape: IBar = bar(sample.archetype, where.bar);
    const start: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
      sample.placement,
      shape.from,
    );
    const end: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
      sample.placement,
      shape.to,
    );
    const axis: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(end, start),
    );
    const span: number = AutoMovieEngineVector3.distance(start, end);
    const along: number = facing
      ? Math.min(
          0.9,
          Math.max(
            0.1,
            AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(toward, start), axis) / span,
          ),
        )
      : where.along;
    const centre: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(start, end, along);
    const out: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(toward, centre);
    const radial: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.addScaled(out, axis, -AutoMovieEngineVector3.dot(out, axis)),
    );
    return {
      point: AutoMovieEngineVector3.addScaled(centre, radial, shape.radius),
      normal: radial,
    };
  }

  /*
   * A part's world centre in a sample.
   */
  function center<Id extends string, D extends string>(
    sample: AutoMovieArchetypeRide.ISample<Id, D>,
    id: string,
  ): IAutoMovieVector3 {
    const shape: IBar = bar(sample.archetype, id);
    return AutoMovieArchetypeFrame.point(
      sample.placement,
      AutoMovieEngineVector3.lerp(shape.from, shape.to, 0.5),
    );
  }

  /*
   * A bar part's ends and radius in model space.
   */
  function bar<Id extends string, D extends string>(
    model: AutoMovieArchetype<Id, D>,
    id: string,
  ): IBar {
    const part: IAutoMovieModelPart = model.parts.find(
      (each: IAutoMovieModelPart): boolean => each.id === id,
    )!;
    const geometry: IAutoMovieModelPart["geometry"] = part.geometry;
    const height: number =
      geometry.type === "primitive" &&
      (geometry.shape.type === "capsule" || geometry.shape.type === "cylinder")
        ? geometry.shape.height
        : 0;
    const radius: number =
      geometry.type === "primitive" &&
      (geometry.shape.type === "capsule" || geometry.shape.type === "cylinder")
        ? geometry.shape.radius
        : 0;
    const half: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      part.transform!.rotation,
      { x: 0, y: height / 2, z: 0 },
    );
    return {
      from: AutoMovieEngineVector3.subtract(part.transform!.translation, half),
      to: AutoMovieEngineVector3.add(part.transform!.translation, half),
      radius,
    };
  }
}

/*
 * How long a struck horse's response lasts, seconds, and its ease: authored.
 */
const RESPONSE: Readonly<IResponse> = { seconds: 1.2, ease: 0.2 };

/*
 * Each region's bar and the share along it, from the bar's start, of its aimed
 * point.
 */
const REGIONS: Readonly<
  Record<AutoMovieArchetypeEquineEncounterCue.Region, IRegion>
> = {
  neck: { bar: "neck", along: 0.5 },
  head: { bar: "head", along: 0.4 },
  shoulder: { bar: "trunk", along: 0.85 },
  barrel: { bar: "trunk", along: 0.5 },
  hindquarters: { bar: "hindquarters", along: 0.5 },
};

/*
 * Closed-form passes refining a bite's target and the poll the reach will put
 * above it: authored.
 */
const REFINE: number = 4;

/*
 * A struck horse's authored response.
 */
interface IResponse {
  /*
   * Seconds it lasts.
   */
  seconds: number;

  /*
   * Seconds of its ease in and out.
   */
  ease: number;
}

/*
 * Where a region is on the body.
 */
interface IRegion {
  /*
   * The bar it lies on.
   */
  bar: AutoMovieArchetypeQuadrupedBody.Bone;

  /*
   * The share along the bar, from its start.
   */
  along: number;
}

/*
 * A point on a body's surface and its outward normal.
 */
interface ISurface {
  /*
   * The point, world metres.
   */
  point: IAutoMovieVector3;

  /*
   * The unit outward normal.
   */
  normal: IAutoMovieVector3;
}

/** Two of a kind, one per horse. */
type Pair<T> = readonly [T, T];

/*
 * A bar's ends and radius.
 */
interface IBar {
  /*
   * Its start.
   */
  from: IAutoMovieVector3;

  /*
   * Its end.
   */
  to: IAutoMovieVector3;

  /*
   * Its radius.
   */
  radius: number;
}

/*
 * A named instant of a ride.
 */
type Instant = AutoMovieArchetypeRide.IRide<string, string>["instants"][number];
