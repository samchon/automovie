import {
  Quaternion,
  Vector3,
  closestPointsBetweenSegments,
  minimumJerk,
  prepareArticulatedRig,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type Archetype,
  ArchetypeFrame,
  ArchetypeRefusal,
  type ArchetypeRide,
} from "../core";
import type { EquineExpressionCue } from "./EquineExpressionCue";
import { EquineExpressionPose } from "./EquineExpressionPose";
import { EquineHeadReach } from "./EquineHeadReach";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedSkeleton } from "./QuadrupedSkeleton";
import { createQuadruped } from "./createQuadruped";

/** Grazing chew rate, Hz: 47.1 chews per minute by sound recorder (Taylor, Lancaster and Ellis 2025, Animals 15:2273, Table 1). */
const CHEW_HZ: number = 47.1 / 60;

/** Peak jaw opening of a chew, degrees: authored, no source read gives the coarse jaw's angle. */
const CHEW_DEGREES: number = 6;

/** A held-open jaw, degrees: authored. */
const OPEN_DEGREES: number = 15;

/** A tail swish's rate, Hz, and swing, degrees: authored. */
const SWISH: Readonly<{ hertz: number; degrees: number }> = {
  hertz: 1,
  degrees: 30,
};

/** Each ear carriage's direction for the left ear in the rest model's space, mirrored for the right: authored poses for EquiFACS EAD101 (forward), EAD104 (lateral, back) and EAD103 (pinned). */
const EARS: Readonly<
  Record<EquineExpressionCue.EarCarriage, IAutoMovieVector3>
> = {
  forward: { x: 0.15, y: 0.75, z: 0.65 },
  lateral: { x: 1, y: 0.45, z: 0 },
  back: { x: 0.3, y: 0.6, z: -0.75 },
  pinned: { x: 0.2, y: 0.2, z: -1 },
};

/** Each tail carriage's raise, degrees: authored. A swish keeps the hang and swings. */
const TAILS: Readonly<Record<EquineExpressionCue.TailCarriage, number>> = {
  raised: 40,
  clamped: -15,
  swish: 0,
};

/** Acts whose muzzle touches its target. */
const TOUCHING: ReadonlySet<EquineExpressionCue.Act> =
  new Set<EquineExpressionCue.Act>([
    "greet",
    "graze",
    "hay",
    "drink",
    "rub",
    "groom",
  ]);

/** A held cue with its channel. */
type Held = Exclude<EquineExpressionCue.Cue, EquineExpressionCue.IVocalize>;

/** A cue on the head channel. */
type Facing = EquineExpressionCue.IAttend | EquineExpressionCue.IReach;

/** A named instant of a ride. */
type Instant = ArchetypeRide.IRide<string, string>["instants"][number];

/**
 * An equid's expression layer over any of its rides: attention, muzzle reaches for sniffing, greeting, feeding, drinking, rubbing and grooming, each ear, the jaw and the tail, and vocal marks.
 *
 * The layer is a pose layer in the motion skill's sense: it samples the base ride and re-poses only the neck and head, the ears, the jaw and the tail through the animal's actual rig (`EquineExpressionPose`), so the base's stride, hooves, trunk, tack and contacts are kept exactly and its timing and instants are kept. Each held cue blends in and out on a minimum-jerk share over its `ease`; outside every cue a sample is the base ride's own. A muzzle reach solves the neck and head in closed form (`EquineHeadReach`) against the target read at that sample, in the horse's current frame, so a moving partner is tracked; a target out of reach, or one the head or neck could only reach through a forelimb, is refused. Each vocalization adds exactly one mark, `vocal:<call>`, to the instants and to `marks`; each reach adds `<act>On` and `<act>Off` where it is fully held.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is layered, what is kept, the blending, the reach solve and its refusals, and the instants added.
 * @evidence contracts/development/design.md#principled-representation A ride in, a ride out with its marks, on the same film clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One layer and its ride type; the cues are `EquineExpressionCue`'s and the posing `EquineExpressionPose`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No species branch beyond the admission of an equid's bridled head; no change to the base ride.
 */
export namespace EquineExpression {
  /**
   * The layered ride: the base ride's plan and duration, its instants with the cues' added, and its vocal marks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is added to the ride.
   * @evidence contracts/development/design.md#principled-representation A ride with its sound marks.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `layer`; read as any ride and by sound.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRide<
    Id extends string,
    D extends string,
  > extends ArchetypeRide.IRide<Id, D> {
    /** The vocal marks, in time order. */
    marks: readonly EquineExpressionCue.IMark[];
  }

  /**
   * Layer cues over an equid's ride.
   *
   * @param animal The equid at rest, as its producer built it: the rest frames the ears' and jaw's carriages are read in.
   * @param ride Any ride of that equid.
   * @param cues The cues.
   * @returns The layered ride.
   * @throws {ArchetypeRefusal} For a non-equid, a malformed window, cues overlapping on one channel, a clearance that contradicts its act, or a fixed target out of reach where it is first fully held; a tracked target out of reach refuses at the sample that reads it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the output and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Admit the cues, read the source's rest frames and carriers, then for each sample weight each active channel by its cue's minimum-jerk share and re-pose the base sample; fixed reach targets are solved once at admission to refuse early.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, preparation, then a stateless sampler that delegates the solve and the posing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Outside every cue the base sample is returned unchanged; no target is clamped and no forelimb penetration is accepted.
   * @evidence contracts/development/implementation.md#efficient-algorithms A sample scans the C cues once, reads the rig once and does constant solve work plus the O(B+P+A) emission; idle samples cost one base sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Rest frames, carriers and the admitted cue list serve every sample.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the base ride, the rest rotations, the carriers and the cues for as long as the caller keeps the ride.
   */
  export function layer<Id extends string, D extends string>(
    animal: Archetype<Id, D>,
    ride: ArchetypeRide.IRide<Id, D>,
    cues: readonly EquineExpressionCue.Cue[],
  ): IRide<Id, D> {
    const species: createQuadruped.ISpecies = createQuadruped.species(animal);
    if (species.nodding !== createQuadruped.BRIDLED)
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: animal.archetype,
        axis: "animal",
        value: animal.archetype,
        feasible: null,
        reason: `a ${animal.archetype} has no equid's bridled head`,
        fix: "Layer equine expression over a horse, pony, donkey or mule.",
      });
    const held: readonly Held[] = admit(animal.archetype, cues);
    const rest: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform> =
      prepareArticulatedRig(QuadrupedSkeleton.of(animal)).read();
    const nodding: ReadonlySet<string> = new Set(species.nodding);
    const neckContacts: ReadonlySet<string> = new Set(
      species.noddingContacts ?? [],
    );
    const prepared: EquineExpressionPose.IPrepared = {
      trunk: rest.get("trunk")!.rotation,
      head: rest.get("head")!.rotation,
      parts: Object.fromEntries(
        animal.parts.map(
          (part: IAutoMovieModelPart): [string, QuadrupedBody.Bone] => [
            part.id,
            nodding.has(part.id) ? "head" : "trunk",
          ],
        ),
      ),
      contacts: Object.fromEntries(
        animal.affordances.map(
          (contact: IAutoMovieAffordance): [string, QuadrupedBody.Bone] => [
            contact.id,
            neckContacts.has(contact.id) ? "neck" : "trunk",
          ],
        ),
      ),
    };
    const head: IAutoMovieModelPart = animal.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "head",
    )!;
    const muzzle: number =
      head.geometry.type === "primitive" &&
      head.geometry.shape.type === "capsule"
        ? head.geometry.shape.height + head.geometry.shape.radius
        : NaN;

    /** The layered sample at a film second. */
    const at = (seconds: number): ArchetypeRide.ISample<Id, D> => {
      const base: ArchetypeRide.ISample<Id, D> = ride.at(seconds);
      const channels: EquineExpressionPose.IChannels = {
        ears: {},
        jaw: 0,
        tail: { raise: 0, swing: 0 },
      };
      let turning: Facing | undefined;
      let turned: number = 0;
      for (const cue of held) {
        const share: number = envelope(cue, seconds);
        if (share === 0) continue;
        if (cue.kind === "attend" || cue.kind === "reach") {
          turning = cue;
          turned = share;
        } else if (cue.kind === "ear")
          channels.ears[cue.side] = {
            direction: EARS[cue.carriage],
            share,
          };
        else if (cue.kind === "jaw")
          channels.jaw =
            share *
            (cue.action === "open"
              ? OPEN_DEGREES
              : (CHEW_DEGREES / 2) *
                (1 - Math.cos(2 * Math.PI * CHEW_HZ * (seconds - cue.from))));
        else
          channels.tail = {
            raise: share * TAILS[cue.carriage],
            swing:
              cue.carriage === "swish"
                ? share *
                  SWISH.degrees *
                  Math.sin(2 * Math.PI * SWISH.hertz * (seconds - cue.from))
                : 0,
          };
      }
      if (
        turning === undefined &&
        channels.jaw === 0 &&
        channels.tail.raise === 0 &&
        channels.tail.swing === 0 &&
        Object.keys(channels.ears).length === 0
      )
        return base;
      const current: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform> =
        prepareArticulatedRig(QuadrupedSkeleton.of(base.archetype)).read();
      if (turning !== undefined)
        channels.head = {
          turn: turn(base, current, turning, seconds),
          share: turned,
        };
      const posed: ArchetypeRide.IPose<Id, D> = EquineExpressionPose.pose(
        base,
        current,
        prepared,
        channels,
      );
      if (turning?.kind === "reach")
        clear(
          animal.archetype,
          posed.archetype,
          local(base, target(turning, seconds)),
        );
      return { ...posed, course: base.course };
    };

    /** The full turns of the head channel's cue at a second. */
    function turn(
      base: ArchetypeRide.ISample<Id, D>,
      current: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform>,
      cue: Facing,
      seconds: number,
    ): EquineHeadReach.ITurn {
      const neck: IAutoMovieTransform = current.get("neck")!;
      const poll: IAutoMovieTransform = current.get("head")!;
      const bars: EquineHeadReach.IBars = {
        root: neck.translation,
        neck: neck.rotation,
        poll: poll.translation,
        head: poll.rotation,
        muzzle,
        body: Quaternion.multiply(
          current.get("trunk")!.rotation,
          Quaternion.inverse(prepared.trunk),
        ),
      };
      const point: IAutoMovieVector3 = local(base, target(cue, seconds));
      return cue.kind === "attend"
        ? EquineHeadReach.face(bars, point)
        : EquineHeadReach.reach(bars, point, cue.gap, animal.archetype);
    }

    // A fixed target is solved where it is first fully held, so an unreachable one refuses at admission.
    for (const cue of held)
      if (cue.kind === "reach" && cue.target.kind === "point")
        at(cue.from + cue.ease);

    const marks: EquineExpressionCue.IMark[] = cues
      .filter(
        (cue: EquineExpressionCue.Cue): cue is EquineExpressionCue.IVocalize =>
          cue.kind === "vocalize",
      )
      .map(
        (cue: EquineExpressionCue.IVocalize): EquineExpressionCue.IMark => ({
          call: cue.call,
          seconds: cue.at,
          label: `vocal:${cue.call}`,
        }),
      )
      .sort(
        (p: EquineExpressionCue.IMark, q: EquineExpressionCue.IMark): number =>
          p.seconds - q.seconds,
      );
    const instants: Instant[] = [
      ...ride.instants,
      ...marks.map(
        (mark: EquineExpressionCue.IMark): Instant => ({
          seconds: mark.seconds,
          label: mark.label,
        }),
      ),
      ...held.flatMap((cue: Held): Instant[] =>
        cue.kind === "reach"
          ? [
              { seconds: cue.from + cue.ease, label: `${cue.act}On` },
              { seconds: cue.to - cue.ease, label: `${cue.act}Off` },
            ]
          : [],
      ),
    ].sort((p: Instant, q: Instant): number => p.seconds - q.seconds);
    return {
      plan: ride.plan,
      duration: ride.duration,
      instants,
      marks,
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

  /** A cue's minimum-jerk share at a second: zero outside its window, one when fully held. */
  function envelope(cue: Held, seconds: number): number {
    if (!(seconds > cue.from && seconds < cue.to)) return 0;
    return minimumJerk.share(
      Math.min(
        1,
        (seconds - cue.from) / cue.ease,
        (cue.to - seconds) / cue.ease,
      ),
    );
  }

  /** A target's world point at a second. */
  function target(cue: Facing, seconds: number): IAutoMovieVector3 {
    return cue.target.kind === "point"
      ? cue.target.point
      : cue.target.at(seconds);
  }

  /** A world point in a sample's model space. */
  function local(
    sample: ArchetypeRide.IPose<string, string>,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      sample.placement.rotation,
    );
    return Quaternion.rotateVector(
      inverse,
      Vector3.subtract(point, sample.placement.translation),
    );
  }

  /** Refuse a reach whose head or neck passes through a forelimb bar that does not bear the target. */
  function clear(
    archetype: string,
    posed: Pick<Archetype, "parts">,
    point: IAutoMovieVector3,
  ): void {
    const bars: Map<string, ISegment> = new Map(
      posed.parts.flatMap((part: IAutoMovieModelPart): [string, ISegment][] => {
        const segment: ISegment | null = bar(part);
        return segment === null ? [] : [[part.id, segment]];
      }),
    );
    for (const mover of ["head", "neck"] as const) {
      const moving: ISegment = bars.get(mover)!;
      for (const limb of ["leftFore", "rightFore"] as const)
        for (const bone of QuadrupedBody.BONES[limb]) {
          const other: ISegment = bars.get(bone)!;
          const bearing: number = closestPointsBetweenSegments(
            point,
            point,
            other.from,
            other.to,
          ).distance;
          if (bearing <= other.radius + 1e-9) continue;
          const gap: number =
            closestPointsBetweenSegments(
              moving.from,
              moving.to,
              other.from,
              other.to,
            ).distance -
            moving.radius -
            other.radius;
          if (gap < 0)
            throw new ArchetypeRefusal({
              kind: "parameter",
              archetype,
              axis: "target",
              value: point,
              feasible: null,
              reason: `the ${mover} reaches the target only through the ${bone}, by ${-gap} m`,
              fix: "Place the target where the muzzle can reach it clear of the forelimbs.",
            });
        }
    }
  }

  /** A capsule or cylinder part's axis and radius, model space. */
  interface ISegment {
    /** Its start. */
    from: IAutoMovieVector3;

    /** Its end. */
    to: IAutoMovieVector3;

    /** Its radius, metres. */
    radius: number;
  }

  /** Read a bar part's axis, or null for any other part. */
  function bar(part: IAutoMovieModelPart): ISegment | null {
    const geometry: IAutoMovieModelPart["geometry"] = part.geometry;
    if (
      part.transform === null ||
      part.transform === undefined ||
      geometry.type !== "primitive" ||
      (geometry.shape.type !== "capsule" && geometry.shape.type !== "cylinder")
    )
      return null;
    const half: IAutoMovieVector3 = Quaternion.rotateVector(
      part.transform.rotation,
      { x: 0, y: geometry.shape.height / 2, z: 0 },
    );
    return {
      from: Vector3.subtract(part.transform.translation, half),
      to: Vector3.add(part.transform.translation, half),
      radius: geometry.shape.radius,
    };
  }

  /** Admit the cues: finite windows, one cue at a time per channel, and clearances that agree with their acts. */
  function admit(
    archetype: string,
    cues: readonly EquineExpressionCue.Cue[],
  ): readonly Held[] {
    const refuse = (axis: string, value: unknown, reason: string): never => {
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis,
        value,
        feasible: null,
        reason,
        fix: "Give each cue a finite window longer than twice its ease, one cue at a time per channel, and a clearance its act allows.",
      });
    };
    const held: Held[] = [];
    for (const cue of cues) {
      if (cue.kind === "vocalize") {
        if (!Number.isFinite(cue.at))
          refuse("at", cue.at, "a call needs a finite second");
        continue;
      }
      if (
        ![cue.from, cue.to, cue.ease].every(Number.isFinite) ||
        !(cue.ease > 0 && 2 * cue.ease <= cue.to - cue.from)
      )
        refuse("ease", cue.ease, `a ${cue.kind} cue needs from + 2 ease <= to`);
      if (cue.kind === "reach") {
        const touching: boolean = TOUCHING.has(cue.act);
        if (
          !(
            Number.isFinite(cue.gap) && (touching ? cue.gap === 0 : cue.gap > 0)
          )
        )
          refuse(
            "gap",
            cue.gap,
            touching
              ? `a ${cue.act} touches its target, so its clearance is zero`
              : "a sniff keeps a positive clearance",
          );
      }
      held.push(cue);
    }
    const channel = (cue: Held): string =>
      cue.kind === "attend" || cue.kind === "reach"
        ? "head"
        : cue.kind === "ear"
          ? `${cue.side}Ear`
          : cue.kind;
    const ordered: Held[] = [...held].sort(
      (p: Held, q: Held): number => p.from - q.from,
    );
    const last: Map<string, Held> = new Map();
    for (const cue of ordered) {
      const before: Held | undefined = last.get(channel(cue));
      if (before !== undefined && cue.from < before.to)
        refuse(
          "cues",
          channel(cue),
          `two cues overlap on the ${channel(cue)} channel at ${cue.from} s`,
        );
      last.set(channel(cue), cue);
    }
    return held;
  }
}
