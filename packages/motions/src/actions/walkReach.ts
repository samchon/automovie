import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  minimumJerk,
  wrapDegrees,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { walkFoot } from "./walkFoot";
import { walkLeg } from "./walkLeg";

/**
 * Makes every foot goal of a stepping gait reachable on the actual pelvis,
 * the footskate cleanup of Kovar, Schreiner and Gleicher (2002): the contacts
 * are enforced by IK, and the root moves so the IK can meet them.
 *
 * `ground` settles the pelvis against the stances. It lowers the root until
 * each stance's ankle is reached with the knee at least `KNEE` degrees bent
 * (`resolveHumanPosture.lower`) and turns the pelvis no further than `TWIST`
 * from each stance's foot. A swinging foot claims through the stance it left
 * or the stance it lands in, its claim fading out over the first `FADE` of
 * its swing and in over the last on a minimum-jerk weight (Flash and Hogan
 * 1985), so the pelvis is continuous with its rate through every contact
 * event and never depends on where the swinging foot is. A stance whose shank
 * leans past the ankle's dorsal limit raises its heel about its ball, or
 * lowers its toes about its heel in the heel rocker; one whose thigh would
 * trail more than `TRAIL` raises its heel further; and a foot pivots on its
 * toe pad by the pelvis's turn beyond `TWIST`, in proportion to its heel's
 * rise up to `HEEL_UP`, the pivot of a stepping turn. The hip joints are read
 * from the pelvis posed by the root, the heading and the pelvis joint, so its
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
   * Settle the pelvis against the stances.
   *
   * @param body The body.
   * @param root The unconstrained root, world metres.
   * @param planned The unconstrained heading, degrees.
   * @param hips The pelvis joint's clinical angles, degrees.
   * @param feet Each foot as scheduled.
   * @returns The pelvis and each stance as reached.
   */
  export function ground(
    body: IHumanBody,
    root: IAutoMovieVector3,
    planned: number,
    hips: readonly [number, number, number],
    feet: Readonly<Record<"left" | "right", walkFoot.IScheduled>>,
  ): IGround {
    const weights: Record<"left" | "right", number> = {
      left: weight(feet.left),
      right: weight(feet.right),
    };
    const pivots: Record<"left" | "right", number> = { left: 0, right: 0 };
    let yaw: number = planned;
    for (const side of SIDES) {
      const w: number = weights[side];
      if (w <= 0) continue;
      const rotation: IAutoMovieQuaternion = feet[side].placement.rotation;
      const heading: number = HumanFrame.heading(rotation);
      const off: number = wrapDegrees(planned - heading);
      const excess: number =
        Math.abs(off) > TWIST ? off - Math.sign(off) * TWIST : 0;
      pivots[side] =
        excess * Math.min(1, Math.max(0, -walkFoot.pitch(rotation) / HEEL_UP));
      const turned: number = wrapDegrees(yaw - (heading + pivots[side]));
      if (Math.abs(turned) > TWIST / w)
        yaw -= turned - (Math.sign(turned) * TWIST) / w;
    }
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      {
        skeleton: body.skeleton.id,
        root: {
          translation: root,
          rotation: resolveHumanPosture.heading({ yaw, pitch: 0, roll: 0 }),
          scale: { x: 1, y: 1, z: 1 },
        },
        joints: [
          { bone: "hips", flexion: hips[0], abduction: hips[1], twist: hips[2] },
        ],
      },
    );
    const hip = (side: "left" | "right", drop: number): IAutoMovieVector3 => {
      const p: IAutoMovieVector3 = bones.get(`${side}UpperLeg`)!.worldPosition;
      return { x: p.x, y: p.y - drop, z: p.z };
    };
    const placed = {} as Record<"left" | "right", walkFoot.IEnd>;
    const contacts = {} as Record<"left" | "right", IAutoMovieVector3>;
    const place = (drop: number): void => {
      for (const side of SIDES) {
        const out = stance(
          body,
          side,
          feet[side],
          hip(side, drop),
          yaw,
          pivots[side],
        );
        placed[side] = out.end;
        contacts[side] = out.contact;
      }
    };
    const lowering = (): number =>
      Math.max(
        0,
        ...SIDES.map((side): number =>
          weights[side] <= 0
            ? 0
            : weights[side] *
              (root.y -
                resolveHumanPosture.lower(
                  body,
                  {
                    root,
                    yaw,
                    pitch: 0,
                    roll: 0,
                    joints: { hips },
                    limbs: {
                      [`${side}Leg`]: {
                        point: placed[side].ankle,
                        bend: feet[side].placement.ankle,
                        planted: true,
                      },
                    },
                  },
                  KNEE,
                ).root.y),
        ),
      );
    // The stances are placed first and the root lowered for the ankles they
    // end at, then placed again against the lowered hips, so the root is
    // lowered for the feet actually shown.
    place(0);
    const first: number = lowering();
    place(first);
    const drop: number = Math.max(first, lowering());
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
   * degrees back and the knee's bend carry it, the heading within `TWIST` of
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
      const back: number = sagittal * Math.sin(extension);
      v = {
        x: v.x - ahead * forward.x - back * forward.x,
        y: -sagittal * Math.cos(extension),
        z: v.z - ahead * forward.z - back * forward.z,
      };
    }
    let ankle: IAutoMovieVector3 = Vector3.add(h, v);
    let rotation: IAutoMovieQuaternion = foot.placement.rotation;
    const off: number = wrapDegrees(
      HumanFrame.heading(rotation) - settled.yaw,
    );
    if (Math.abs(off) > TWIST)
      rotation = HumanFoot.rotation(
        settled.yaw + Math.sign(off) * TWIST,
        walkFoot.pitch(rotation),
      );

    // The ankle comes in under the hip until the leg's line leans no further
    // to the side of the foot than the ankle inverts or everts.
    const across: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: walkFoot.yaw(rotation) },
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

  /**
   * A stance as its leg can hold it under a hip: the heel raised about the
   * ball, or the toes lowered about the heel, and the foot pivoted on its toe
   * pad.
   */
  function stance(
    body: IHumanBody,
    side: "left" | "right",
    foot: walkFoot.IFoot,
    h: IAutoMovieVector3,
    yaw: number,
    pivoted: number,
  ): { end: walkFoot.IEnd; contact: IAutoMovieVector3 } {
    let placement: HumanFoot.IPlacement = foot.placement;
    const heading: number = HumanFrame.heading(placement.rotation);
    let pitch: number = walkFoot.pitch(placement.rotation);
    const about: "heel" | "mtp" = pitch > 1e-6 ? "heel" : "mtp";
    const pivot: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      about,
      placement,
    );
    const at = (degrees: number): HumanFoot.IPlacement =>
      HumanFoot.pivot(body, side, about, pivot, heading, degrees);
    // The heel rises about the ball once the shank leans past the ankle's
    // dorsal limit: the forefoot rocker begins where the ankle can bend no
    // further (Perry and Burnfield), so the ball never slides. A heel
    // strike's toes come down about the heel the same way.
    if (
      HumanFoot.point(
        body,
        side,
        about === "heel" ? "heel" : "toe",
        placement,
        foot.toes,
      ).y < 0.01
    )
      for (let k: number = 0; k < 4; k++) {
        const top: number =
          -walkLeg.lean(body, h, placement.ankle, heading) +
          20 -
          walkLeg.ANKLE;
        if (pitch <= top + 1e-6) break;
        pitch = about === "heel" ? Math.max(0, top) : top;
        placement = at(pitch);
      }
    // The heel rises further about the ball while the thigh would trail more
    // than TRAIL behind vertical and the ankle can still plantarflex: the
    // knee then bends and the thigh comes forward, the trailing-limb posture
    // of terminal stance and pre-swing (Perry and Burnfield). The rise is the
    // least one that holds the bound, found by bisection, so it varies
    // continuously.
    if (about === "mtp") {
      const refused = (degrees: number): boolean => {
        const ankle: IAutoMovieVector3 = at(degrees).ankle;
        return (
          walkLeg.trailing(body, h, ankle, yaw) > TRAIL &&
          degrees + walkLeg.lean(body, h, ankle, heading) + 50 > walkLeg.ANKLE
        );
      };
      if (refused(pitch)) {
        let low: number = -STEEPEST;
        let high: number = pitch;
        if (!refused(low))
          for (let k: number = 0; k < 30; k++) {
            const middle: number = (low + high) / 2;
            if (refused(middle)) high = middle;
            else low = middle;
          }
        pitch = Math.min(pitch, low);
        placement = at(pitch);
      }
    }
    const toes: number = Math.max(foot.toes, -pitch);
    // The pivot turn: the foot turns about its toe pad by its pivot.
    if (about === "mtp" && Math.abs(pivoted) > 1e-9) {
      const pad: IAutoMovieVector3 = HumanFoot.point(
        body,
        side,
        "toe",
        placement,
        toes,
      );
      const turned: IAutoMovieQuaternion = HumanFoot.rotation(
        heading + pivoted,
        pitch,
      );
      placement = {
        ankle: Vector3.subtract(
          pad,
          Quaternion.rotateVector(
            turned,
            HumanFoot.offset(body, side, "toe", toes),
          ),
        ),
        rotation: turned,
      };
    }
    return {
      end: { ankle: placement.ankle, rotation: placement.rotation, toes },
      contact: HumanFoot.offset(body, side, about),
    };
  }

  /** Both feet. */
  const SIDES: readonly ["left", "right"] = ["left", "right"];

  /** The largest extension, degrees, of a swinging leg's thigh, 2° inside the hip's 30° extension (DEFAULT_HUMANOID_ROM); the ankle trails further by the knee's bend. */
  const EXTENSION: number = 28;

  /** The furthest a swinging leg's line leans to the side of its foot, degrees: the ankle's 25° of inversion and eversion (DEFAULT_HUMANOID_ROM), the same bound a stance stands inside, so a swing joins its stances where they are. */
  const SIDE: number = 25;

  /** The furthest a planted leg's thigh trails behind vertical, degrees: the 20° of terminal stance (Perry and Burnfield), inside the hip's 30° extension. */
  const TRAIL: number = 20;

  /** The steepest heel rise of a planted foot, degrees toes-down (provisional): past it the foot would stand on its toe tips. */
  const STEEPEST: number = 75;

  /** The least knee flexion of a planted or reaching leg, degrees (provisional): a walking knee never locks straight. */
  const KNEE: number = 10;

  /** The largest heading, degrees, a foot may keep from the pelvis: 25° inside the hip's 45° rotation (DEFAULT_HUMANOID_ROM), room for the pitch a toe-off and the list a turned leg also ask of it. */
  export const TWIST: number = 20;

  /** Pitch, degrees toes-down, at which a planted foot's heel is far enough up to take the whole pivot turn on its toe pad (provisional). */
  const HEEL_UP: number = 30;
}
