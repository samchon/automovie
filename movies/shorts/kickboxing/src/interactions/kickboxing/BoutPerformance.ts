import {
  Quaternion,
  resolveAutoMovieRelationalGoal,
  Vector3,
  type IAutoMovieSchedule,
  type preparePhysicalGeometry,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { Fighter } from "../../entities/cast/fighter/Fighter";
import type { FighterBody } from "../../entities/cast/fighter/FighterBody";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingDefense } from "../../laws/kickboxing/KickboxingDefense";
import { KickboxingOutcome } from "../../laws/kickboxing/KickboxingOutcome";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import type { BoutLaws } from "./BoutLaws";
import { FighterPosture } from "./FighterPosture";
import type { IRingCast } from "./IRingCast";

/**
 * The fighters' bodies at any second: each fighter's shape-prior posture
 * fitted by his limbs against the floor, then every touching strike's weapon
 * bent onto the receiver's actual region by the engine's relational fit from
 * the held support foot, weighted in over the last quarter of the delivery
 * and out over the first quarter of the return, landing at the strike's
 * drawn point along the region's surface, and finally the fallen
 * fighter settled onto the canvas by his lowest collider. Every second is a
 * pure function of the schedule; results are cached by second.
 *
 * ```ts
 * const performance = new BoutPerformance(cast, schedule, queries);
 * performance.at(150).b.segments; // B's world segments at the finish
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#surfaces The weapon meets the receiver's actual region or defending limb.
 * @evidence docs/research/kickboxing/brazilian-kick.md#law The pelvis and support pivot are fitted with the kicking leg.
 * @evidence docs/research/kickboxing/exchanges.md#outcomes The outcome decides which region the weapon meets; geometry only realizes it.
 * @evidence docs/research/kickboxing/rules.md#uncertainty The fallen fighter lies on the canvas.
 */
export class BoutPerformance {
  private readonly priors: Map<string, FighterBody.IPlaced> = new Map();

  private readonly finals: Map<number, Record<string, BoutPerformance.IBody>> =
    new Map();

  /** Share of a delivery, before contact and after it, over which the relational fit is weighted in and out. */
  public static readonly FIT_SHARE: number = 0.25;

  /**
   * Prepare the performance.
   *
   * @param cast The cast.
   * @param schedule The resolved schedule.
   * @param queries The engine's geometric queries, for settling the fallen body.
   */
  public constructor(
    private readonly cast: IRingCast,
    private readonly schedule: IAutoMovieSchedule,
    private readonly queries: preparePhysicalGeometry.IQueries,
  ) {}

  /**
   * Both fighters at a second.
   *
   * @param seconds Film seconds.
   * @returns Each fighter's posed body by id.
   */
  public at(seconds: number): Record<string, BoutPerformance.IBody> {
    const key: number = Math.round(seconds * BoutPerformance.KEY);
    const cached = this.finals.get(key);
    if (cached) return cached;
    const result: Record<string, BoutPerformance.IBody> = {};
    for (const fighter of [this.cast.a, this.cast.b]) {
      const prior: FighterBody.IPlaced = this.prior(fighter.id, seconds);
      const posed = FighterPosture.at(
        this.cast,
        this.schedule,
        fighter.id,
        seconds,
        null,
      );
      let segments: Record<string, P.ITransform> = this.contact(
        fighter,
        seconds,
        prior.segments,
      );
      segments = this.settle(fighter, seconds, segments);
      result[fighter.id] = {
        ...prior,
        segments,
        jaw: posed.posture.jaw,
        wince: posed.posture.wince,
      };
    }
    if (this.finals.size > BoutPerformance.CACHE) this.finals.clear();
    this.finals.set(key, result);
    return result;
  }

  /**
   * A fighter's limb-fitted prior at a second, before contacts.
   *
   * @param subject His id.
   * @param seconds Film seconds.
   * @returns The placed prior.
   */
  public prior(subject: string, seconds: number): FighterBody.IPlaced {
    const key: string = `${subject}@${Math.round(seconds * BoutPerformance.KEY)}`;
    const cached = this.priors.get(key);
    if (cached) return cached;
    const fighter: Fighter =
      subject === this.cast.a.id ? this.cast.a : this.cast.b;
    // Strike targets read the opponent's prior without its own strike
    // targets, so the two priors never wait on each other.
    const posed = FighterPosture.at(
      this.cast,
      this.schedule,
      subject,
      seconds,
      this.reader(),
    );
    const placed: FighterBody.IPlaced = fighter.body.place(
      posed.posture,
      posed.frame,
    );
    if (this.priors.size > BoutPerformance.CACHE) this.priors.clear();
    this.priors.set(key, placed);
    return placed;
  }

  /** Reads a region's world point on a fighter's prior. */
  private reader(): FighterPosture.RegionReader {
    return (
      subject: string,
      region: string,
      seconds: number,
    ): IAutoMovieVector3 => {
      const fighter: Fighter =
        subject === this.cast.a.id ? this.cast.a : this.cast.b;
      const placed: FighterBody.IPlaced = this.shallow(subject, seconds);
      const r = fighter.body.regions[region];
      if (!r) throw new Error(`Unknown region ${subject}.${region}`);
      const s: P.ITransform = placed.segments[r.bone]!;
      return Vector3.add(
        s.position,
        Quaternion.rotateVector(s.rotation, r.localPoint),
      );
    };
  }

  /** A prior whose own strikes keep their shape path. */
  private shallow(subject: string, seconds: number): FighterBody.IPlaced {
    const key: string = `${subject}~${Math.round(seconds * BoutPerformance.KEY)}`;
    const cached = this.priors.get(key);
    if (cached) return cached;
    const fighter: Fighter =
      subject === this.cast.a.id ? this.cast.a : this.cast.b;
    const posed = FighterPosture.at(
      this.cast,
      this.schedule,
      subject,
      seconds,
      null,
    );
    const placed: FighterBody.IPlaced = fighter.body.place(
      posed.posture,
      posed.frame,
    );
    this.priors.set(key, placed);
    return placed;
  }

  /** Bend touching strikes onto the receiver's region near contact. */
  private contact(
    fighter: Fighter,
    seconds: number,
    prior: Record<string, P.ITransform>,
  ): Record<string, P.ITransform> {
    let segments: Record<string, P.ITransform> = prior;
    for (const strike of BoutPerformance.touching(this.schedule, fighter.id)) {
      const delivery: number = strike.entry.contact! - strike.entry.start;
      const window: number = delivery * BoutPerformance.FIT_SHARE;
      const offset: number = seconds - strike.entry.contact!;
      if (offset < -window || offset > window) continue;
      const weight: number = 1 - Math.abs(offset) / window;
      const receiver: Fighter =
        fighter === this.cast.a ? this.cast.b : this.cast.a;
      const goal = this.goal(fighter, receiver, strike);
      const result = resolveAutoMovieRelationalGoal({
        performer: fighter.id,
        goal: {
          ...goal,
          window: {
            start: strike.entry.contact! - window,
            end: strike.entry.contact! + window,
          },
        },
        bodies: {
          [fighter.id]: this.body(fighter, strike.spec, (s: number) =>
            s === seconds ? segments : this.prior(fighter.id, s).segments,
          ),
          [receiver.id]: this.body(
            receiver,
            strike.spec,
            (s: number) => this.prior(receiver.id, s).segments,
            BoutPerformance.landing(receiver, strike, this.queries),
          ),
        },
        seconds,
        iterations: BoutPerformance.ITERATIONS,
        approachWeight: BoutPerformance.APPROACH_WEIGHT,
      });
      if (result.active)
        segments = blend(segments, result.targets, ease(weight));
    }
    return segments;
  }

  /** The relational goal of a touching strike: its weapon surface onto the region its outcome decides. */
  private goal(
    fighter: Fighter,
    receiver: Fighter,
    strike: BoutPerformance.ITouch,
  ): Omit<
    Parameters<typeof resolveAutoMovieRelationalGoal>[0]["goal"],
    "window"
  > {
    const weapon =
      fighter.body.weapons[`${strike.spec.surface}-${strike.spec.side}`];
    if (!weapon) throw new Error(`No ${strike.spec.surface} surface`);
    return {
      surface: {
        bone: weapon.bone,
        localPoint: weapon.localPoint,
        localDirection: weapon.localDirection,
      },
      // The descending kick's path already comes down from the turnover's
      // apex in the shape; an imposed arrival direction would only turn the
      // whole body over the support and drop the raised knee.
      target: { subject: receiver.id, region: strike.region },
      // The strike committed its path at launch or chamber in the shape; a
      // touching outcome means the region is there at contact, so the fit
      // tracks it through the contact window.
      lock: "track",
    };
  }

  /** An engine body over a fighter's segments, held on the support foot opposite the striking limb. */
  private body(
    fighter: Fighter,
    spec: KickboxingTechnique.ISpec,
    pose: (s: number) => Record<string, P.ITransform>,
    regions: Readonly<
      Record<string, resolveAutoMovieRelationalGoal.IRegion>
    > = fighter.body.regions,
  ): resolveAutoMovieRelationalGoal.IBody {
    const support: "left" | "right" =
      spec.limb === "leg" ? KickboxingTechnique.opposite(spec.side) : "left";
    const reach: string[] =
      spec.limb === "arm"
        ? [
            "chest",
            `${spec.side}Shoulder`,
            `${spec.side}UpperArm`,
            `${spec.side}LowerArm`,
            `${spec.side}Hand`,
          ]
        : [`${spec.side}UpperLeg`, `${spec.side}LowerLeg`, `${spec.side}Foot`];
    // The trunk leans into a punch; a kick also bends the support leg, except
    // the descending kick, whose turnover the shape already placed and whose
    // fit only rolls the pelvis and trunk over the held, turning support foot.
    const chain: string[] =
      spec.limb === "leg" && spec.line !== "descending"
        ? [`${support}LowerLeg`, `${support}UpperLeg`, "hips", "spine"]
        : ["hips", "spine"];
    return {
      profile: fighter.body.profile,
      pose,
      regions,
      support: () => ({
        bone: `${support}Midfoot`,
        localPoint: fighter.body.weapons[`sole-${support}`]!.localPoint,
        normal: { x: 0, y: 1, z: 0 },
        // A kick may turn the support foot through the studied pivot; a punch holds it.
        minimum: spec.limb === "leg" ? -Math.PI / 2 : 0,
        maximum: spec.limb === "leg" ? Math.PI / 2 : 0,
      }),
      bones: [...chain, ...reach],
    };
  }

  /** Settle a fallen fighter onto the canvas by his lowest collider. */
  private settle(
    fighter: Fighter,
    seconds: number,
    segments: Record<string, P.ITransform>,
  ): Record<string, P.ITransform> {
    const fall: IAutoMovieSchedule.IEntry | undefined =
      this.schedule.entries.find((e) => {
        if (e.subject !== fighter.id || e.intent.capability !== "phase")
          return false;
        const action = KickboxingAction.read(e.intent);
        return action.kind === "phase" && action.phase === "fall";
      });
    if (!fall || seconds < fall.start) return segments;
    const lowest = (pose: Record<string, P.ITransform>): number => {
      let least: number = Infinity;
      for (const segment of fighter.body.profile.segments)
        for (const shape of segment.shapes)
          least = Math.min(
            least,
            this.queries.minimumY({
              body: fighter.id,
              bone: segment.bone,
              shape,
              pose: pose[segment.bone]!,
            }),
          );
      return least;
    };
    // During the fall the body may only be lifted out of the canvas, beyond
    // the depth his planted feet already had when the blow caught him, an
    // allowance that fades over the fall so he leaves his feet without a
    // jump; once he lies, he rests exactly on the canvas.
    const share: number = (seconds - fall.start) / (fall.end - fall.start);
    const standing: number = Math.max(
      0,
      -lowest(this.prior(fighter.id, fall.start).segments),
    );
    const depth: number = -lowest(segments);
    const lift: number =
      seconds >= fall.end ? depth : Math.max(0, depth - standing * (1 - share));
    if (lift === 0) return segments;
    return Object.fromEntries(
      Object.entries(segments).map(([bone, t]) => [
        bone,
        {
          position: { ...t.position, y: t.position.y + lift },
          rotation: t.rotation,
        },
      ]),
    );
  }
}

/** Companion types and the touching-strike reader of {@link BoutPerformance}. */
export namespace BoutPerformance {
  /** Seconds are cached at this many keys per second: a 1/1200 s grid finer than any frame. */
  export const KEY: number = 1200;

  /** Cached seconds kept before the caches are cleared. */
  export const CACHE: number = 4096;

  /** Metres of residual the fit trades per unit of approach-direction difference: a centimetre, so reaching the region outweighs the arrival angle the shape already set. */
  export const APPROACH_WEIGHT: number = 0.01;

  /** Relational fit budget, within the engine's limit. */
  export const ITERATIONS: number = 64;

  /** One fighter's displayed body. */
  export interface IBody extends FighterBody.IPlaced {
    /** Jaw opening, millimetres. */
    jaw: number;

    /** Strain, in [0, 1]. */
    wince: number;
  }

  /** A strike whose outcome makes the bodies touch, with the region it meets. */
  export interface ITouch {
    /** The strike's entry. */
    entry: IAutoMovieSchedule.IEntry;

    /** Its technique. */
    spec: KickboxingTechnique.ISpec;

    /** Its outcome. */
    outcome: KickboxingOutcome.Outcome;

    /** The receiver's region the weapon meets. */
    region: string;

    /** The answer's entry. */
    answer: IAutoMovieSchedule.IEntry;
  }

  /**
   * The receiver's regions with the struck one moved along its surface by
   * the strike's drawn contact offset: tangent to the region's outward
   * direction, along the bone's own long axis where that axis is not the
   * outward one, then projected back onto the nearest of the bone's
   * declared colliders, so the point stays on the region's surface.
   *
   * @param receiver The receiver.
   * @param strike The touching strike.
   * @param queries The engine's geometric queries.
   * @returns The regions the relational fit reads.
   */
  export function landing(
    receiver: Fighter,
    strike: ITouch,
    queries: preparePhysicalGeometry.IQueries,
  ): Readonly<Record<string, resolveAutoMovieRelationalGoal.IRegion>> {
    const drawn = (strike.entry.state as BoutLaws.IState | undefined)?.strike;
    const region = receiver.body.regions[strike.region];
    if (!drawn || !region || drawn.point === 0) return receiver.body.regions;
    const out: IAutoMovieVector3 = Vector3.normalize(region.localPoint);
    const axis: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const along: IAutoMovieVector3 = Vector3.subtract(
      axis,
      Vector3.scale(out, Vector3.dot(axis, out)),
    );
    if (Vector3.length(along) < 1e-6) return receiver.body.regions;
    const moved: IAutoMovieVector3 = Vector3.add(
      region.localPoint,
      Vector3.scale(Vector3.normalize(along), drawn.point),
    );
    const segment = receiver.body.profile.segments.find(
      (s: P.ISegment) => s.bone === region.bone,
    );
    if (!segment) return receiver.body.regions;
    let best: IAutoMovieVector3 = moved;
    let nearest: number = Infinity;
    for (const shape of segment.shapes) {
      const p: IAutoMovieVector3 = queries.project(
        {
          body: receiver.id,
          bone: region.bone,
          shape,
          pose: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
        },
        moved,
      );
      const d: number = Vector3.length(Vector3.subtract(p, moved));
      if (d < nearest) {
        nearest = d;
        best = p;
      }
    }
    return {
      ...receiver.body.regions,
      [strike.region]: { bone: region.bone, localPoint: best },
    };
  }

  /**
   * A fighter's touching strikes: every strike whose answer's outcome touches, with the region the defense table gives.
   *
   * @param schedule The schedule.
   * @param subject The striker's id.
   * @returns His touching strikes in time order.
   * @evidence docs/research/kickboxing/exchanges.md#outcomes Landed, parried, blocked and checked strikes touch.
   */
  export function touching(
    schedule: IAutoMovieSchedule,
    subject: string,
  ): ITouch[] {
    const answers: Map<string, IAutoMovieSchedule.IEntry> = new Map();
    for (const entry of schedule.entries) {
      if (entry.intent.capability !== "answer") continue;
      const action = KickboxingAction.read(entry.intent);
      if (action.kind === "answer") answers.set(action.strike, entry);
    }
    const result: ITouch[] = [];
    for (const entry of schedule.entries) {
      if (
        entry.subject !== subject ||
        entry.intent.capability !== "strike" ||
        entry.intent.anchor === undefined
      )
        continue;
      const answer = answers.get(entry.intent.anchor);
      if (!answer || answer.outcome === undefined) continue;
      const outcome = answer.outcome as KickboxingOutcome.Outcome;
      if (!KickboxingOutcome.touches(outcome)) continue;
      const action = KickboxingAction.read(entry.intent);
      const defend = KickboxingAction.read(answer.intent);
      if (action.kind !== "strike" || defend.kind !== "answer") continue;
      const spec: KickboxingTechnique.ISpec =
        KickboxingTechnique.table[action.technique];
      const region: string | null = KickboxingDefense.contact(
        defend.answer,
        spec,
      );
      if (region === null) continue;
      result.push({ entry, spec, outcome, region, answer });
    }
    return result;
  }
}

/** Blend world segments: positions linearly, rotations by slerp. */
function blend(
  a: Record<string, P.ITransform>,
  b: Record<string, P.ITransform>,
  w: number,
): Record<string, P.ITransform> {
  return Object.fromEntries(
    Object.entries(a).map(([bone, t]) => {
      const u: P.ITransform | undefined = b[bone];
      if (!u) return [bone, t];
      return [
        bone,
        {
          position: Vector3.lerp(t.position, u.position, w),
          rotation: Quaternion.slerp(t.rotation, u.rotation, w),
        },
      ];
    }),
  );
}

function ease(t: number): number {
  const x: number = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}
