import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame, type ArchetypeRide } from "../core";
import type { EquineEncounterCue } from "./EquineEncounterCue";
import { EquineExpression } from "./EquineExpression";
import type { EquineExpressionCue } from "./EquineExpressionCue";
import { EquineStance } from "./EquineStance";
import type { EquineStanceCue } from "./EquineStanceCue";
import { QuadrupedBody } from "./QuadrupedBody";

/** How long a struck horse's response lasts, seconds, and its ease: authored. */
const RESPONSE: Readonly<IResponse> = { seconds: 1.2, ease: 0.2 };

/** Each region's bar and the share along it, from the bar's start, of its aimed point. */
const REGIONS: Readonly<Record<EquineEncounterCue.Region, IRegion>> = {
  neck: { bar: "neck", along: 0.5 },
  head: { bar: "head", along: 0.4 },
  shoulder: { bar: "trunk", along: 0.85 },
  barrel: { bar: "trunk", along: 0.5 },
  hindquarters: { bar: "hindquarters", along: 0.5 },
};

/** A struck horse's authored response. */
interface IResponse {
  /** Seconds it lasts. */
  seconds: number;

  /** Seconds of its ease in and out. */
  ease: number;
}

/** Where a region is on the body. */
interface IRegion {
  /** The bar it lies on. */
  bar: QuadrupedBody.Bone;

  /** The share along the bar, from its start. */
  along: number;
}

/** A point on a body's surface and its outward normal. */
interface ISurface {
  /** The point, world metres. */
  point: IAutoMovieVector3;

  /** The unit outward normal. */
  normal: IAutoMovieVector3;
}

/** Two of a kind, one per horse. */
type Pair<T> = readonly [T, T];

/**
 * Two horses' agonistic encounter on one scene clock: threats, bites, rearing strikes and double-barrel kicks aimed at named regions of the other horse, the struck horse's response and an optional retreat.
 *
 * Each horse rides into the encounter and halts. A strike or kick is a stance row (`EquineEncounterRows`) whose hooves go to the aimed region's surface on the other horse's halted body, read from its actual bar: the region's point on the bar's axis pushed out along the bar's radius toward the attacker, the hoof's endpoint one terminal radius off it, so the hoof meets the surface without entering it. A bite is a touching muzzle reach (`EquineExpression`) onto the region's surface, tracked on the other horse's staged ride. A threat pins both ears back and faces the other horse's head. Every contact makes the struck horse pin its ears and turn its head to the attacker for `RESPONSE`. A retreat plays its own ride from its start second, beginning at the halt. An unreachable region is refused by the stance or the reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the clock, how each act is aimed and staged, the response, the retreat and the refusals.
 * @evidence contracts/development/design.md#principled-representation Two rides in, two rides out on the same clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One entry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Contacts are touches at actual surfaces; no physics.
 */
export namespace EquineEncounter {
  /**
   * Stage an encounter.
   *
   * @param animals The two equids at rest, as their producers built them.
   * @param horses Their rides into the encounter and their retreats.
   * @param acts The acts.
   * @returns The two staged rides.
   * @throws {ArchetypeRefusal} As the stance and the expression layer refuse: an act while moving, overlapping acts, or an unreachable region.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the output and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Aim each strike and kick at the other horse's halted body and stage both stances; then aim the bites, threats and responses at the staged rides and layer the expressions; then append the retreats.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Stances, expressions, retreats.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per act; sampling is the layers'.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the stance and the expression layer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The rides retain their layers.
   */
  export function stage<Id extends string, D extends string>(
    animals: Pair<Archetype<Id, D>>,
    horses: Pair<EquineEncounterCue.IHorse<Id, D>>,
    acts: readonly EquineEncounterCue.Act[],
  ): Pair<ArchetypeRide.IRide<Id, D>> {
    const halts: Pair<ArchetypeRide.ISample<Id, D>> = [
      horses[0].ride.at(horses[0].ride.duration),
      horses[1].ride.at(horses[1].ride.duration),
    ];
    const stanceOf = (horse: number): ArchetypeRide.IRide<Id, D> => {
      const me: ArchetypeRide.ISample<Id, D> = halts[horse]!;
      const other: ArchetypeRide.ISample<Id, D> = halts[1 - horse]!;
      const rows: EquineStanceCue.Cue[] = [];
      for (const act of acts) {
        if (act.horse !== horse) continue;
        if (act.kind === "strike") {
          const limb: QuadrupedBody.Limb = `${act.side}Fore`;
          rows.push({
            kind: "strike",
            side: act.side,
            from: act.from,
            entry: act.entry,
            hold: act.hold,
            exit: act.exit,
            point: hoof(me, other, act.region, limb, "Fore"),
          });
        } else if (act.kind === "kick")
          rows.push({
            kind: "kick",
            from: act.from,
            entry: act.entry,
            hold: act.hold,
            exit: act.exit,
            point: hoof(me, other, act.region, "leftHind", "Hind"),
          });
      }
      return EquineStance.after(animals[horse]!, horses[horse]!.ride, rows);
    };
    const stances: Pair<ArchetypeRide.IRide<Id, D>> = [
      stanceOf(0),
      stanceOf(1),
    ];
    const stagedOf = (horse: number): ArchetypeRide.IRide<Id, D> => {
      const other: ArchetypeRide.IRide<Id, D> = stances[1 - horse]!;
      const head = (seconds: number): IAutoMovieVector3 =>
        center(other.at(seconds), "head");
      const cues: EquineExpressionCue.Cue[] = [];
      const face = (window: EquineExpressionCue.IWindow): void => {
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
          const from: IAutoMovieVector3 = center(halts[horse]!, "head");
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
                surface(other.at(seconds), act.region, from).point,
            },
          });
        } else if (act.horse !== horse) {
          if (act.kind === "threat") continue;
          const contact: number =
            act.kind === "bite" ? act.from + act.ease : act.from + act.entry;
          const attacker: ArchetypeRide.IRide<Id, D> = stances[1 - horse]!;
          const window: EquineExpressionCue.IWindow = {
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
      const expressed: ArchetypeRide.IRide<Id, D> = EquineExpression.layer(
        animals[horse]!,
        stances[horse]!,
        cues,
      );
      return retreated(expressed, horses[horse]!.retreat);
    };
    return [stagedOf(0), stagedOf(1)];
  }

  /** A ride followed by its retreat from the retreat's start second. */
  function retreated<Id extends string, D extends string>(
    ride: ArchetypeRide.IRide<Id, D>,
    retreat: EquineEncounterCue.IRetreat<Id, D> | undefined,
  ): ArchetypeRide.IRide<Id, D> {
    if (retreat === undefined) return ride;
    const at = (seconds: number): ArchetypeRide.ISample<Id, D> =>
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
        const sample: ArchetypeRide.ISample<Id, D> = at(seconds);
        return ArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }

  /** The base-model point a hoof's endpoint goes to so it touches a region of the other horse: the surface point one terminal radius out, read in the attacker's halt. */
  function hoof<Id extends string, D extends string>(
    me: ArchetypeRide.ISample<Id, D>,
    other: ArchetypeRide.ISample<Id, D>,
    region: EquineEncounterCue.Region,
    limb: QuadrupedBody.Limb,
    end: "Fore" | "Hind",
  ): IAutoMovieVector3 {
    const from: IAutoMovieVector3 = center(
      me,
      QuadrupedBody.BONES[`left${end}`][0],
    );
    const aimed: ISurface = surface(other, region, from);
    const radius: number = bar(
      me.archetype,
      QuadrupedBody.BONES[limb][3],
    ).radius;
    const world: IAutoMovieVector3 = Vector3.addScaled(
      aimed.point,
      aimed.normal,
      radius,
    );
    return Quaternion.rotateVector(
      Quaternion.inverse(me.placement.rotation),
      Vector3.subtract(world, me.placement.translation),
    );
  }

  /** A region's surface point facing a world point, on a sample's actual bar. */
  function surface<Id extends string, D extends string>(
    sample: ArchetypeRide.ISample<Id, D>,
    region: EquineEncounterCue.Region,
    toward: IAutoMovieVector3,
  ): ISurface {
    const where: IRegion = REGIONS[region];
    const shape: IBar = bar(sample.archetype, where.bar);
    const start: IAutoMovieVector3 = ArchetypeFrame.point(
      sample.placement,
      shape.from,
    );
    const end: IAutoMovieVector3 = ArchetypeFrame.point(
      sample.placement,
      shape.to,
    );
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(end, start),
    );
    const centre: IAutoMovieVector3 = Vector3.lerp(start, end, where.along);
    const out: IAutoMovieVector3 = Vector3.subtract(toward, centre);
    const radial: IAutoMovieVector3 = Vector3.normalize(
      Vector3.addScaled(out, axis, -Vector3.dot(out, axis)),
    );
    return {
      point: Vector3.addScaled(centre, radial, shape.radius),
      normal: radial,
    };
  }

  /** A part's world centre in a sample. */
  function center<Id extends string, D extends string>(
    sample: ArchetypeRide.ISample<Id, D>,
    id: string,
  ): IAutoMovieVector3 {
    const shape: IBar = bar(sample.archetype, id);
    return ArchetypeFrame.point(
      sample.placement,
      Vector3.lerp(shape.from, shape.to, 0.5),
    );
  }

  /** A bar part's ends and radius in model space. */
  function bar<Id extends string, D extends string>(
    model: Archetype<Id, D>,
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
    const half: IAutoMovieVector3 = Quaternion.rotateVector(
      part.transform!.rotation,
      { x: 0, y: height / 2, z: 0 },
    );
    return {
      from: Vector3.subtract(part.transform!.translation, half),
      to: Vector3.add(part.transform!.translation, half),
      radius,
    };
  }
}

/** A bar's ends and radius. */
interface IBar {
  /** Its start. */
  from: IAutoMovieVector3;

  /** Its end. */
  to: IAutoMovieVector3;

  /** Its radius. */
  radius: number;
}

/** A named instant of a ride. */
type Instant = ArchetypeRide.IRide<string, string>["instants"][number];
