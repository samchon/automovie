import {
  DEFAULT_HUMANOID_ROM,
  Vector3,
  bracketedRoot,
  minimumJerk,
  smoothMinimum,
  wrapDegrees,
} from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { walkFoot } from "./walkFoot";
import { walkLeg } from "./walkLeg";
import { walkReachStance } from "./walkReachStance";

/**
 * Makes every foot goal of a stepping gait reachable on the actual pelvis,
 * the footskate cleanup of Kovar, Schreiner and Gleicher (2002): the contacts
 * are enforced by IK, and the root moves so the IK can meet them.
 *
 * `ground` settles the pelvis against the stances. It lowers the root until
 * each stance's ankle is reached with the knee at least `KNEE` degrees bent
 * and turns the pelvis no further than `TWIST` from each stance's foot
 * (`pelvis`). Each foot claims a lowering (`short`), signed, so a leg with
 * slack claims less than none. A swinging foot claims through the stance it
 * left or the stance it lands in, its claim fading out over the first `FADE`
 * of its swing and in over the last on a minimum-jerk weight (Flash and Hogan
 * 1985), unless the caller names its claim, as a walk does over the second
 * half of a swing (`walkDescent`). The two feet's claims and none at all join
 * in a smooth maximum `CLAIM` wide (the engine's `smoothMinimum`, negated),
 * which never lowers less than either asks, so the pelvis is continuous with
 * its rate through every contact event and where a leg runs out of slack.
 * The stances are placed against the lowered hips, which changes what they
 * claim, so the lowering is the one whose stances claim exactly it, found
 * between none and the first claim by the engine's `bracketedRoot`. Each
 * stance is held by `walkReachStance`: a shank leaning toward the ankle's
 * dorsal limit raises its heel about its ball (`walkLeg.heelRise`, from
 * `walkLeg.ROCKER` of room on), or lowers its toes about its heel in the
 * heel rocker; a thigh that would trail more than `walkReachStance.TRAIL`
 * raises it further; and a foot pivots on its toe pad by the pelvis's turn
 * beyond `TWIST`, in proportion to its heel's rise up to `HEEL_UP`, the
 * pivot of a stepping turn. The hip joints are read from the
 * pelvis posed by the root, the heading and the pelvis joint, so its
 * rotation and list count.
 *
 * `swing` then holds a swinging foot inside the leg's reach, the hip's
 * extension, the hip's rotation and the ankle's range under that pelvis, and
 * off the floor. A swing between two grounded stances starts and ends inside
 * all four, so the clamps act only in between.
 */
export namespace walkReach {
  /** The share of a swing over which its foot's claim on the pelvis fades out after toe-off and in before heel strike (provisional). */
  export const FADE: number = 0.25;

  /** The difference, metres, under which the claims on the root's height blend (provisional); a foot that asks nothing claims this much less than none, so it leaves the blend alone. */
  export const CLAIM: number = 0.01;

  /** A pelvis turned toward its stances, before it is lowered. */
  export interface IPelvis {
    /** The heading, degrees. */
    yaw: number;

    /** Each foot's pivot turn on its toe pad, degrees. */
    pivots: Record<"left" | "right", number>;

    /** The hip joints, world metres. */
    hips: Record<"left" | "right", IAutoMovieVector3>;
  }

  /** The pelvis settled against the stances. */
  export interface IGround {
    /** The heading, degrees. */
    yaw: number;

    /** The lowered root, world metres. */
    root: IAutoMovieVector3;

    /** The hip joints under that root, world metres. */
    hips: Record<"left" | "right", IAutoMovieVector3>;

    /** Each foot's stance as reached. */
    feet: Record<"left" | "right", walkFoot.IEnd>;

    /** Each stance's contact point in its foot's frame. */
    contacts: Record<"left" | "right", IAutoMovieVector3>;
  }

  /**
   * A scheduled foot's claim on the pelvis.
   *
   * @param foot The foot.
   * @returns 1 in stance, fading to 0 in mid-swing.
   */
  export function weight(foot: walkFoot.IScheduled): number {
    if (foot.swing === undefined) return 1;
    const u: number = foot.swing.u;
    return u < 0.5
      ? 1 - minimumJerk(Math.min(1, u / FADE)).s
      : minimumJerk(Math.max(0, (u - (1 - FADE)) / FADE)).s;
  }

  /**
   * The lowering a leg asks of the root to reach an ankle with the knee
   * `KNEE` bent (`resolveHumanPosture.short`).
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @returns Metres, negative by the leg's slack and no less than a metre
   *   under none, which claims as little as any slack does.
   */
  export function short(
    body: IHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
  ): number {
    return Math.max(-1, resolveHumanPosture.short(body, hip, ankle, KNEE));
  }

  /**
   * Turn the pelvis toward its stances: no further than `TWIST` from each
   * claiming foot, a foot with its heel up taking the rest as a pivot turn;
   * feet turned further apart than that, in a stepping turn, hold it between
   * them, each by its claim.
   *
   * @param body The body.
   * @param root The unconstrained root, world metres.
   * @param planned The unconstrained heading, degrees.
   * @param hips The pelvis joint's clinical angles, degrees.
   * @param feet Each foot as scheduled.
   * @returns The heading, the pivots and the hip joints under that root.
   */
  export function pelvis(
    body: IHumanBody,
    root: IAutoMovieVector3,
    planned: number,
    hips: readonly [number, number, number],
    feet: Readonly<Record<"left" | "right", walkFoot.IScheduled>>,
  ): IPelvis {
    const pivots: Record<"left" | "right", number> = { left: 0, right: 0 };
    let yaw: number = planned;
    // Each claiming foot's band: its pivoted heading, near the planned one,
    // give or take `TWIST` over its claim.
    type IBand = { centre: number; half: number };
    const bands: IBand[] = [];
    for (const side of SIDES) {
      const w: number = weight(feet[side]);
      if (w <= 0) continue;
      const rotation: IAutoMovieQuaternion = feet[side].placement.rotation;
      const heading: number = HumanFoot.heading(rotation);
      const off: number = wrapDegrees(planned - heading);
      const excess: number =
        Math.abs(off) > TWIST ? off - Math.sign(off) * TWIST : 0;
      pivots[side] =
        excess * Math.min(1, Math.max(0, -HumanFoot.pitch(rotation) / HEEL_UP));
      bands.push({
        centre: planned + wrapDegrees(heading + pivots[side] - planned),
        half: TWIST / w,
      });
      const turned: number = wrapDegrees(yaw - (heading + pivots[side]));
      if (Math.abs(turned) > TWIST / w)
        yaw -= turned - (Math.sign(turned) * TWIST) / w;
    }
    // Feet further apart than their bands, as in a stepping turn, hold the
    // pelvis in the gap between the bands, at the planned heading as near as
    // the gap allows, so the pelvis turns on with the plan as the claims pass
    // from one foot to the other.
    if (bands.length === 2) {
      const a: IBand =
        bands[0]!.centre <= bands[1]!.centre ? bands[0]! : bands[1]!;
      const b: IBand = a === bands[0] ? bands[1]! : bands[0]!;
      const upper: number = a.centre + a.half;
      const lower: number = b.centre - b.half;
      if (upper < lower) yaw = Math.min(lower, Math.max(upper, planned));
    }
    return {
      yaw,
      pivots,
      hips: hipJoints(
        body,
        root,
        resolveHumanPosture.heading({ yaw, pitch: 0, roll: 0 }),
        hips,
      ),
    };
  }

  /**
   * Settle the pelvis against the stances.
   *
   * @param body The body.
   * @param root The unconstrained root, world metres.
   * @param planned The unconstrained heading, degrees.
   * @param hips The pelvis joint's clinical angles, degrees.
   * @param feet Each foot as scheduled.
   * @param claims The lowering a foot claims in place of its faded stance's,
   *   metres.
   * @param rocker The room under which a stance's heel begins to rise,
   *   degrees; `walkLeg.ROCKER` when absent. A gait gives less while it
   *   starts and stops: a foot that is not stepping keeps its heel down until
   *   its ankle can bend no further.
   * @returns The pelvis and each stance as reached.
   */
  export function ground(
    body: IHumanBody,
    root: IAutoMovieVector3,
    planned: number,
    hips: readonly [number, number, number],
    feet: Readonly<Record<"left" | "right", walkFoot.IScheduled>>,
    claims: Readonly<Partial<Record<"left" | "right", number>>> = {},
    rocker: number = walkLeg.ROCKER,
  ): IGround {
    const {
      yaw,
      pivots,
      hips: joints,
    }: IPelvis = pelvis(body, root, planned, hips, feet);
    const hip = (side: "left" | "right", drop: number): IAutoMovieVector3 => {
      const p: IAutoMovieVector3 = joints[side];
      return { x: p.x, y: p.y - drop, z: p.z };
    };
    const placed = {} as Record<"left" | "right", walkFoot.IEnd>;
    const contacts = {} as Record<"left" | "right", IAutoMovieVector3>;
    const place = (drop: number): void => {
      for (const side of SIDES) {
        const out: { end: walkFoot.IEnd; contact: IAutoMovieVector3 } =
          walkReachStance.of(
            body,
            side,
            feet[side],
            hip(side, drop),
            yaw,
            pivots[side],
            rocker,
          );
        placed[side] = out.end;
        contacts[side] = out.contact;
      }
    };
    // A fading foot's claim runs from its stance's to `CLAIM` under none.
    const claim = (side: "left" | "right"): number => {
      const named: number | undefined = claims[side];
      if (named !== undefined) return named;
      const w: number = weight(feet[side]);
      return w <= 0
        ? -CLAIM
        : w * short(body, joints[side], placed[side].ankle) + (w - 1) * CLAIM;
    };
    const lowering = (): number =>
      -smoothMinimum(
        smoothMinimum(-claim("left"), -claim("right"), CLAIM),
        0,
        CLAIM,
      );
    // The lowering is the one that asks for itself: the stances placed against
    // the hips it lowers claim exactly it. Lower hips raise a stance's heel
    // and its claim falls, so what a lowering leaves unclaimed changes sign
    // once between none and the first claim. Under the unlowered hips a
    // stretched leg stands at its straight knee, where the shank's lean turns
    // on a square root; the lowering that asks for itself keeps every knee
    // bent, so none of that reaches the root.
    const asked = (drop: number): number => {
      place(drop);
      return lowering();
    };
    const first: number = asked(0);
    let drop: number = 0;
    if (first > 0) {
      let high: number = first;
      let over: number = asked(high) - high;
      for (let k: number = 0; k < 8 && over > 0; k++) {
        high *= 2;
        over = asked(high) - high;
      }
      const ends: ReadonlyMap<number, number> = new Map([
        [0, first],
        [high, over],
      ]);
      drop =
        over > 0
          ? high
          : bracketedRoot(
              (d: number): number => ends.get(d) ?? asked(d) - d,
              0,
              high,
              FINE,
            );
      place(drop);
    }
    return {
      yaw,
      root: { ...root, y: root.y - drop },
      hips: { left: hip("left", drop), right: hip("right", drop) },
      feet: placed,
      contacts,
    };
  }

  /**
   * Hold a swinging foot inside its leg's ranges under a settled pelvis: the
   * ankle within reach and no further behind the hip than a thigh `EXTENSION`
   * degrees back and the knee's bend carry it (an ankle past that keeps its
   * place behind the hip and rises onto the shank's reach from the knee, the
   * knee folding as a trailing heel lifts, or turns forward onto that line
   * where the shank cannot reach so far back), the heading within `TWIST` of
   * the pelvis, the pitch inside the ankle's range, and neither toe nor heel
   * under the floor.
   *
   * @param body The body.
   * @param side The foot.
   * @param settled The pelvis.
   * @param foot The swinging foot.
   * @returns The foot as reached.
   */
  export function swing(
    body: IHumanBody,
    side: "left" | "right",
    settled: IGround,
    foot: walkFoot.IFoot,
  ): walkFoot.IEnd {
    const m = body.measure;
    const h: IAutoMovieVector3 = settled.hips[side];
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: settled.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const limit: number = Math.sqrt(
      m.thigh ** 2 +
        m.shank ** 2 +
        2 * m.thigh * m.shank * Math.cos((KNEE * Math.PI) / 180),
    );
    let v: IAutoMovieVector3 = Vector3.subtract(foot.placement.ankle, h);
    const d: number = Vector3.length(v);
    if (d > limit) v = Vector3.scale(v, limit / d);
    const ahead: number = v.x * forward.x + v.z * forward.z;
    const sagittal: number = Math.hypot(ahead, v.y);
    const extension: number =
      (EXTENSION * Math.PI) / 180 + walkLeg.behind(body, Vector3.length(v));
    if (v.y < 0 && Math.atan2(-ahead, -v.y) > extension) {
      // The thigh stops at its extension and the knee folds: the ankle keeps
      // its place behind the hip, raised onto the shank's reach from the
      // knee, as a trailing leg's heel rises after toe-off. Where the shank
      // cannot reach that far back, the leg turns forward onto the line.
      const thighAngle: number = (EXTENSION * Math.PI) / 180;
      const kneeAhead: number = -m.thigh * Math.sin(thighAngle);
      const kneeDown: number = m.thigh * Math.cos(thighAngle);
      const along: number = ahead - kneeAhead;
      if (Math.abs(along) <= m.shank)
        v = {
          x: v.x,
          y: -kneeDown - Math.sqrt(m.shank * m.shank - along * along),
          z: v.z,
        };
      else {
        const back: number = sagittal * Math.sin(extension);
        v = {
          x: v.x - ahead * forward.x - back * forward.x,
          y: -sagittal * Math.cos(extension),
          z: v.z - ahead * forward.z - back * forward.z,
        };
      }
    }
    let ankle: IAutoMovieVector3 = Vector3.add(h, v);
    let rotation: IAutoMovieQuaternion = foot.placement.rotation;
    const off: number = wrapDegrees(HumanFoot.heading(rotation) - settled.yaw);
    if (Math.abs(off) > TWIST)
      rotation = HumanFoot.rotation(
        settled.yaw + Math.sign(off) * TWIST,
        HumanFoot.pitch(rotation),
      );

    // The ankle comes in under the hip until the leg's line leans no further
    // to the side of the foot than the ankle inverts or everts.
    const across: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: HumanFoot.heading(rotation) },
      { x: 1, y: 0, z: 0 },
    );
    const aside: number =
      (ankle.x - h.x) * across.x + (ankle.z - h.z) * across.z;
    const most: number =
      Math.tan((SIDE * Math.PI) / 180) * Math.max(0, h.y - ankle.y);
    if (Math.abs(aside) > most) {
      const shift: number = aside - Math.sign(aside) * most;
      ankle = {
        x: ankle.x - shift * across.x,
        y: ankle.y,
        z: ankle.z - shift * across.z,
      };
    }

    // Lifting the foot off the floor leans its shank further, so the pitch is
    // held inside the ankle's range again after each lift.
    for (let k: number = 0; k < 8; k++) {
      rotation = walkLeg.ankleRange(body, h, ankle, rotation);
      const low: number = Math.min(
        HumanFoot.point(body, side, "toe", { ankle, rotation }, foot.toes).y,
        HumanFoot.point(body, side, "heel", { ankle, rotation }).y,
      );
      if (low >= -1e-6) break;
      ankle = { ...ankle, y: ankle.y - low };
    }
    return { ankle, rotation, toes: foot.toes };
  }

  /** Both feet. */
  const SIDES: readonly ["left", "right"] = ["left", "right"];

  /** The width, metres, to which the root's lowering is solved: a nanometre, under which its error adds less than a micrometre per second to a rate read over a frame. */
  const FINE: number = 1e-9;

  /** The largest extension, degrees, of a swinging leg's thigh, 2° inside the hip's 30° extension (DEFAULT_HUMANOID_ROM); the ankle trails further by the knee's bend. */
  const EXTENSION: number = 28;

  /** The furthest a swinging leg's line leans to the side of its foot, degrees: the ankle's 25° of inversion and eversion (DEFAULT_HUMANOID_ROM), the same bound a stance stands inside, so a swing joins its stances where they are. */
  const SIDE: number = 25;

  /** The least knee flexion of a planted or reaching leg, degrees (provisional): a walking knee never locks straight. */
  const KNEE: number = 10;

  /**
   * The hips' rotation in a range-of-motion table: the least of either
   * hip's internal and external rotation, degrees.
   *
   * @param rom The table.
   * @returns Degrees, the lesser way of the stiffer hip.
   * @throws {Error} When the table gives a hip no rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each hip's twist interval, the smaller of its two sides, the smaller hip.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read per hip.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A table without a hip's rotation is refused, never read as no limit.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once, into `TWIST`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function hipTwist(rom: typeof DEFAULT_HUMANOID_ROM): number {
    return Math.min(
      ...(["leftUpperLeg", "rightUpperLeg"] as const).map(
        (bone: "leftUpperLeg" | "rightUpperLeg"): number => {
          const twist: IAutoMovieAngleRange | null | undefined =
            rom[bone]?.twist;
          if (twist === null || twist === undefined)
            throw new Error(`The range-of-motion table gives ${bone} no twist`);
          return Math.min(-twist.min, twist.max);
        },
      ),
    );
  }

  /** The largest heading, degrees, a foot may keep from the pelvis: the hip's own internal and external rotation (DEFAULT_HUMANOID_ROM, 45° either way, `hipTwist`); a turn that asks more is taken by spinning on the ball of the foot (a spin turn, Hase and Stein 1999). */
  export const TWIST: number = hipTwist(DEFAULT_HUMANOID_ROM);

  /** Pitch, degrees toes-down, at which a planted foot's heel is far enough up to take the whole pivot turn on its toe pad (provisional). */
  const HEEL_UP: number = 30;
}
