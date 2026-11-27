import {
  Quaternion,
  Vector3,
  AutoMovieEngineKinematics,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type { IAutoMovieAffordance, IAutoMovieModelPart, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import { type AutoMovieArchetype, AutoMovieArchetypeFrame, AutoMovieArchetypeRefusal, type AutoMovieArchetypeRide } from "../core";
import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedSkeleton } from "./AutoMovieArchetypeQuadrupedSkeleton";
import { EquineExpressionAdmission } from "./equine/EquineExpressionAdmission";
import { EquineExpressionPose } from "./equine/EquineExpressionPose";
import { EquineHeadClearance } from "./equine/EquineHeadClearance";
import { EquineHeadCourse } from "./equine/EquineHeadCourse";
import { EquineHeadReach } from "./equine/EquineHeadReach";
import { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";
import { EquineExpressionConstants } from "./equine/EquineExpressionConstants";

const { CHEW_HZ, CHEW_DEGREES, OPEN_DEGREES, YAWN_DEGREES, SLACK_DEGREES, CURL_DEGREES, SHAKE, CARRIAGES, SWISH, EARS, TAILS } = EquineExpressionConstants;
/**
 * An equid's expression layer over any of its rides: attention, muzzle reaches
 * for sniffing, greeting, feeding, drinking, rubbing and grooming, held head
 * carriages (doze, flehmen, yawn), each ear, the jaw, the lips, a neck shake
 * and the tail, and vocal and skin-twitch marks.
 *
 * The layer is a pose layer in the motion skill's sense: it samples the base
 * ride and re-poses only the neck and head, the ears, the jaw and the tail
 * through the animal's rig (`EquineExpressionPose`), so the base's stride,
 * hooves, trunk, tack and contacts are kept exactly and its timing and instants
 * are kept. Each held cue blends in and out on a minimum-jerk share over its
 * `ease`; outside every cue a sample is the base ride's own. On the head
 * channel a cue that starts where the one before it ends blends from that cue's
 * turns rather than from rest, and the one before holds until it hands over; a
 * reach given another body to go around plans its neck and head course around
 * that body's bars (`EquineHeadCourse`), refusing when none clears. A muzzle
 * reach solves the neck and head in closed form (`EquineHeadReach`), a suckling
 * foal's with its poll bent down so it reaches up under the belly, its head
 * first dipped low and then raised to the udder (`EquineHeadReach.dipping`,
 * `rising`), against the target read at that sample, in the horse's current
 * frame, so a moving partner is tracked; a target out of reach, or one the head
 * or neck could only reach through a forelimb (`EquineHeadClearance`), is
 * refused. A carriage pitches the neck and head by authored angles
 * (`EquineHeadReach.pitched`); a curled upper lip turns about its root and a
 * slack lower lip drops the jaw a little; a shake rolls the neck about its own
 * bar. Each vocalization adds exactly one mark, `vocal:<call>`, to the instants
 * and to `marks`, and each skin twitch one instant `twitch:<region>`; each
 * reach adds `<act>On` and `<act>Off` where it is fully held.
 */
export namespace AutoMovieArchetypeEquineExpression {
  /**
   * The layered ride: the base ride's plan and duration, its instants with the
   * cues' added, and its vocal marks.
   */
  export interface IRide<
    Id extends string,
    D extends string,
  > extends AutoMovieArchetypeRide.IRide<Id, D> {
    /** The vocal marks, in time order. */
    marks: readonly AutoMovieArchetypeEquineExpressionCue.IMark[];
  }

  /**
   * Layer cues over an equid's ride.
   *
   * @param animal The equid at rest, as its producer built it: the rest frames
   *   the ears' and jaw's carriages are read in.
   * @param ride Any ride of that equid.
   * @param cues The cues.
   * @returns The layered ride.
   * @throws {AutoMovieArchetypeRefusal} For a non-equid, a malformed window,
   *   cues overlapping on one channel, a clearance that contradicts its act, or
   *   a fixed target out of reach where it is first fully held; a tracked
   *   target out of reach refuses at the sample that reads it.
   */
  export function layer<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    cues: readonly AutoMovieArchetypeEquineExpressionCue.Cue[],
  ): IRide<Id, D> {
    const species: AutoMovieArchetypeQuadruped.ISpecies = AutoMovieArchetypeQuadruped.species(animal);
    if (species.nodding !== AutoMovieArchetypeQuadruped.BRIDLED)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: animal.archetype,
        axis: "animal",
        value: animal.archetype,
        feasible: null,
        reason: `a ${animal.archetype} has no equid's bridled head`,
        fix: "Layer equine expression over a horse, pony, donkey or mule.",
      });
    const held: readonly Held[] = EquineExpressionAdmission.admit(
      animal.archetype,
      cues,
    );
    const rest: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    > = AutoMovieEngineKinematics.prepareArticulatedRig(
      AutoMovieArchetypeQuadrupedSkeleton.of(animal),
    ).read();
    const nodding: ReadonlySet<string> = new Set(species.nodding);
    const neckContacts: ReadonlySet<string> = new Set(
      species.noddingContacts ?? [],
    );
    const prepared: EquineExpressionPose.IPrepared = {
      trunk: rest.get("trunk")!.rotation,
      head: rest.get("head")!.rotation,
      parts: Object.fromEntries(
        animal.parts.map(
          (
            part: IAutoMovieModelPart,
          ): [string, AutoMovieArchetypeQuadrupedBody.Bone] => [
            part.id,
            nodding.has(part.id) ? "head" : "trunk",
          ],
        ),
      ),
      contacts: Object.fromEntries(
        animal.affordances.map(
          (
            contact: IAutoMovieAffordance,
          ): [string, AutoMovieArchetypeQuadrupedBody.Bone] => [
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
    const radius = (id: string): number => {
      const part: IAutoMovieModelPart = animal.parts.find(
        (each: IAutoMovieModelPart): boolean => each.id === id,
      )!;
      return part.geometry.type === "primitive" &&
        (part.geometry.shape.type === "capsule" ||
          part.geometry.shape.type === "cylinder")
        ? part.geometry.shape.radius
        : 0;
    };
    const radii: EquineHeadCourse.IRadii = {
      neck: radius("neck"),
      head: radius("head"),
    };

    // The head channel's cues in time order, one at a time: a cue that starts where the one before ends takes over from it.
    const heads: readonly Heading[] = held
      .filter(
        (cue: Held): cue is Heading =>
          cue.kind === "attend" ||
          cue.kind === "reach" ||
          cue.kind === "carriage",
      )
      .sort((p: Heading, q: Heading): number => p.from - q.from);

    /** The layered sample at a film second. */
    const at = (seconds: number): AutoMovieArchetypeRide.ISample<Id, D> => {
      const base: AutoMovieArchetypeRide.ISample<Id, D> = ride.at(seconds);
      const channels: EquineExpressionPose.IChannels = {
        ears: {},
        jaw: 0,
        lip: 0,
        roll: 0,
        tail: { raise: 0, swing: 0 },
      };
      const index: number = heads.findIndex(
        (cue: Heading): boolean => seconds > cue.from && seconds < cue.to,
      );
      const turning: Heading | undefined = heads[index];
      for (const cue of held) {
        const share: number = EquineExpressionAdmission.envelope(cue, seconds);
        if (share === 0) continue;
        if (
          cue.kind === "attend" ||
          cue.kind === "reach" ||
          cue.kind === "carriage"
        )
          continue;
        else if (cue.kind === "ear")
          channels.ears[cue.side] = {
            direction: EARS[cue.carriage],
            share,
          };
        else if (cue.kind === "jaw")
          channels.jaw +=
            share *
            (cue.action === "open"
              ? OPEN_DEGREES
              : cue.action === "yawn"
                ? YAWN_DEGREES
                : (CHEW_DEGREES / 2) *
                  (1 - Math.cos(2 * Math.PI * CHEW_HZ * (seconds - cue.from))));
        else if (cue.kind === "lip") {
          if (cue.action === "curl") channels.lip = share * CURL_DEGREES;
          else channels.jaw += share * SLACK_DEGREES;
        } else if (cue.kind === "shake")
          channels.roll =
            share *
            SHAKE.degrees *
            Math.sin(2 * Math.PI * SHAKE.hertz * (seconds - cue.from));
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
        channels.lip === 0 &&
        channels.roll === 0 &&
        channels.tail.raise === 0 &&
        channels.tail.swing === 0 &&
        Object.keys(channels.ears).length === 0
      )
        return base;
      const current: ReadonlyMap<
        AutoMovieArchetypeQuadrupedBody.Bone,
        IAutoMovieTransform
      > = AutoMovieEngineKinematics.prepareArticulatedRig(
        AutoMovieArchetypeQuadrupedSkeleton.of(base.archetype),
      ).read();
      if (turning !== undefined)
        channels.head = {
          turn: course(base, current, index, seconds),
          share: 1,
        };
      const posed: AutoMovieArchetypeRide.IPose<Id, D> =
        EquineExpressionPose.pose(base, current, prepared, channels);
      if (turning?.kind === "reach")
        EquineHeadClearance(
          animal.archetype,
          posed.archetype,
          EquineExpressionAdmission.local(
            base,
            EquineExpressionAdmission.target(turning, seconds),
          ),
        );
      return { ...posed, course: base.course };
    };

    /**
     * The head channel's turns at a second: the active cue's full turns, eased
     * in along a course from rest, or from an adjacent cue's turns that it
     * takes over, and eased out to rest unless an adjacent cue takes over; a
     * reach around another body plans its course around it
     * (`EquineHeadCourse`).
     */
    function course(
      base: AutoMovieArchetypeRide.ISample<Id, D>,
      current: ReadonlyMap<
        AutoMovieArchetypeQuadrupedBody.Bone,
        IAutoMovieTransform
      >,
      index: number,
      seconds: number,
    ): EquineHeadReach.ITurn {
      const cue: Heading = heads[index]!;
      const before: Heading | undefined = heads[index - 1];
      const after: Heading | undefined = heads[index + 1];
      const rising: number = (seconds - cue.from) / cue.ease;
      const falling: number =
        after !== undefined && after.from === cue.to
          ? Infinity
          : (cue.to - seconds) / cue.ease;
      const goal: EquineHeadReach.ITurn = turn(base, current, cue, seconds);
      if (rising >= 1 && falling >= 1) return goal;
      const start: EquineHeadReach.ITurn =
        rising < falling && before !== undefined && before.to === cue.from
          ? turn(base, current, before, seconds)
          : EquineHeadCourse.rest();
      const share: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.max(0, Math.min(1, rising, falling)),
      );
      const path: EquineHeadCourse.IPath =
        cue.kind === "reach" && cue.around !== undefined
          ? EquineHeadCourse.plan(
              barsOf(current),
              radii,
              start,
              goal,
              obstacles(base, cue.around.at(seconds)),
            )
          : { direct: true, via: start };
      return EquineHeadCourse.shown(path, start, goal, share);
    }

    /** The current neck and head bars. */
    function barsOf(
      current: ReadonlyMap<
        AutoMovieArchetypeQuadrupedBody.Bone,
        IAutoMovieTransform
      >,
    ): EquineHeadReach.IBars {
      const neck: IAutoMovieTransform = current.get("neck")!;
      const poll: IAutoMovieTransform = current.get("head")!;
      return {
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
    }

    /** Another body's bars in this sample's model space. */
    function obstacles(
      base: AutoMovieArchetypeRide.ISample<Id, D>,
      other: AutoMovieArchetypeRide.IPose<string, string>,
    ): EquineHeadCourse.IObstacle[] {
      return other.archetype.parts.flatMap(
        (part: IAutoMovieModelPart): EquineHeadCourse.IObstacle[] => {
          const geometry: IAutoMovieModelPart["geometry"] = part.geometry;
          if (
            part.transform === undefined ||
            part.transform === null ||
            geometry.type !== "primitive" ||
            (geometry.shape.type !== "capsule" &&
              geometry.shape.type !== "cylinder")
          )
            return [];
          const half: IAutoMovieVector3 = Quaternion.rotateVector(
            part.transform.rotation,
            { x: 0, y: geometry.shape.height / 2, z: 0 },
          );
          const end = (sign: number): IAutoMovieVector3 =>
            EquineExpressionAdmission.local(
              base,
              AutoMovieArchetypeFrame.point(
                other.placement,
                Vector3.addScaled(part.transform!.translation, half, sign),
              ),
            );
          return [
            {
              id: part.id,
              from: end(-1),
              to: end(1),
              radius: geometry.shape.radius,
            },
          ];
        },
      );
    }

    /** The full turns of a head-channel cue at a second. */
    function turn(
      base: AutoMovieArchetypeRide.ISample<Id, D>,
      current: ReadonlyMap<
        AutoMovieArchetypeQuadrupedBody.Bone,
        IAutoMovieTransform
      >,
      cue: Heading,
      seconds: number,
    ): EquineHeadReach.ITurn {
      const bars: EquineHeadReach.IBars = barsOf(current);
      if (cue.kind === "carriage")
        return EquineHeadReach.pitched(bars, ...CARRIAGES[cue.carriage]);
      const point: IAutoMovieVector3 = EquineExpressionAdmission.local(
        base,
        EquineExpressionAdmission.target(cue, seconds),
      );
      if (cue.kind === "attend") return EquineHeadReach.face(bars, point);
      return EquineHeadReach.reach(
        bars,
        point,
        cue.gap,
        animal.archetype,
        cue.act === "suckle",
      );
    }

    // A fixed target is solved where it is first fully held, so an unreachable one refuses at admission.
    for (const cue of held)
      if (cue.kind === "reach" && cue.target.kind === "point")
        at(cue.from + cue.ease);

    const marks: AutoMovieArchetypeEquineExpressionCue.IMark[] = cues
      .filter(
        (
          cue: AutoMovieArchetypeEquineExpressionCue.Cue,
        ): cue is AutoMovieArchetypeEquineExpressionCue.IVocalize =>
          cue.kind === "vocalize",
      )
      .map(
        (
          cue: AutoMovieArchetypeEquineExpressionCue.IVocalize,
        ): AutoMovieArchetypeEquineExpressionCue.IMark => ({
          call: cue.call,
          seconds: cue.at,
          label: `vocal:${cue.call}`,
        }),
      )
      .sort(
        (
          p: AutoMovieArchetypeEquineExpressionCue.IMark,
          q: AutoMovieArchetypeEquineExpressionCue.IMark,
        ): number => p.seconds - q.seconds,
      );
    const instants: Instant[] = [
      ...ride.instants,
      ...marks.map(
        (mark: AutoMovieArchetypeEquineExpressionCue.IMark): Instant => ({
          seconds: mark.seconds,
          label: mark.label,
        }),
      ),
      ...cues.flatMap(
        (cue: AutoMovieArchetypeEquineExpressionCue.Cue): Instant[] =>
          cue.kind === "twitch"
            ? [{ seconds: cue.at, label: `twitch:${cue.region}` }]
            : [],
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
        const sample: AutoMovieArchetypeRide.ISample<Id, D> = at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }
}
type Held = EquineExpressionConstants.Held;
type Heading = EquineExpressionConstants.Heading;

type Instant = EquineExpressionConstants.Instant;
