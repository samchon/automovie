import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { hipJoints } from "../posture/hipJoints";

/**
 * The key states of a kneel, solved from the body: standing, the kneeling
 * leg stepped back, on one knee, on both knees and sitting back on the heels.
 *
 * Every place follows from the leg's two lengths and the knee's radius over
 * the floor. On one knee the kneeling knee touches the floor straight under
 * its hip joint with the thigh upright, and the front foot stays planted with
 * its shank upright, so the hips stand behind the front ankle by what the
 * thigh's length leaves after the height difference. A kneeling foot is
 * tucked: it stands on its toes straight behind its knee, heading the way the
 * body faces so the leg stays in one plane, as far back as puts the ankle a
 * shank from the knee and as steeply as puts the ankle at its dorsiflexion
 * range. Where that pitch is more than the toes extend, the toes hold their
 * range and the foot's toe joint rises by what keeps the toes' tip on the
 * floor. Sitting back, each thigh turns back about its knee until the knee
 * flexes `SIT` degrees, the high-flexion band measured in kneeling (141.6
 * degrees, Acker et al. 2011, J Arthroplasty 26:319; up to 157 +- 6 in deep
 * postures, Hemmerich et al. 2006, J Orthop Res 24:770).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each key state, how its places follow from the body and the sources of the sitting flexion.
 * @evidence contracts/development/design.md#principled-representation Key states as a root and two feet, each foot a floor point, a heading, a pitch and its toes' angle.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the kneel's geometry; read only by the kneel law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No world coordinate is typed; every place is read from the body's measure and its range table.
 */
export namespace kneelKeys {
  /** Knee flexion sitting back on the heels, degrees (Acker et al. 2011; inside the range table's 150). */
  export const SIT: number = 145;

  /**
   * A foot's place on the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and its unit.
   * @evidence contracts/development/design.md#principled-representation The toe joint's point, a heading, a pitch and the toes' angle define the foot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by the kneel law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ankle is derived by `HumanFoot.pivot`, not stored.
   */
  export interface IFoot {
    /** The toes' joint, world metres. */
    at: IAutoMovieVector3;

    /** Degrees about +Y. */
    heading: number;

    /** Degrees; negative with the heel up. */
    pitch: number;

    /** The toes' extension, degrees. */
    toes: number;

    /** Whether the foot bears on the floor. */
    planted: boolean;
  }

  /**
   * A key state: the root and both feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation A root and a foot per side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by the kneel law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint angle is stored; the legs are solved from the feet.
   */
  export interface IKey {
    /** The root, world metres. */
    root: IAutoMovieVector3;

    /** The feet. */
    feet: Record<"left" | "right", IFoot>;
  }

  /**
   * The solved key states and the frame they were solved in.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The keys in order from standing down, with the frame and the sitting pivot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by the kneel law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The stepped key carries the kneeling root; its height on the way is the law's, found from the legs' reach.
   */
  export interface IKeys {
    /** Standing, stepped back, on one knee, then on both knees and sitting back when asked. */
    keys: IKey[];

    /** The heading's unit vector. */
    forward: IAutoMovieVector3;

    /** The hip joints from the root. */
    rest: Record<"left" | "right", IAutoMovieVector3>;

    /** The root's place about which it turns as the hips sit back: the first knee's, as the root. */
    pivot: IAutoMovieVector3;

    /** The standing leg's length from hip joint to ankle as a share of the thigh and the shank. */
    extension: number;
  }

  /**
   * A foot tucked behind a knee that rests on the floor: on its toes straight
   * behind the knee, the ankle at its dorsiflexion range.
   *
   * @param body The body.
   * @param side The leg.
   * @param kneeAt The knee joint, world metres.
   * @param yaw The heading the knee points along, degrees about +Y.
   * @param floor The height of the toes' joint when the foot stands flat, world metres.
   * @returns The foot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture, each input and its unit; the namespace gives the toes' rule.
   * @evidence contracts/development/implementation.md#principled-implementation The toes' joint is found on the floor behind the knee where the ankle is a shank from the knee, and the foot's pitch is the one that leaves the ankle at its dorsiflexion range against the shank's slope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A foot from a distance and a pitch, a bisection for the distance and a fixed-point loop for the pitch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ranges are read from the range table; past the toes' range the toes' joint rises instead of the toes overextending.
   * @evidence contracts/development/implementation.md#efficient-algorithms Six 40-step bisections of a closed-form ankle place.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanFoot.pivot` for the ankle; callers solve a foot once and translate it with its knee.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function tucked(
    body: IHumanBody,
    side: "left" | "right",
    kneeAt: IAutoMovieVector3,
    yaw: number,
    floor: number,
  ): IFoot {
    const m = body.measure;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const dorsiflexion: number =
      AutoMovieMotionHumanRange.limit(`${side}Foot`, "flexion") ?? 0;
    const extension: number =
      AutoMovieMotionHumanRange.limit(`${side}Toes`, "flexion") ?? 90;
    const toe: number = Vector3.length(
      Vector3.subtract(
        HumanFoot.offset(body, side, "toe"),
        HumanFoot.offset(body, side, "mtp"),
      ),
    );
    const foot = (d: number, pitch: number): IFoot => ({
      at: {
        ...Vector3.subtract(kneeAt, Vector3.scale(forward, d)),
        y:
          floor +
          toe * Math.sin((Math.max(0, pitch - extension) * Math.PI) / 180),
      },
      heading: yaw,
      pitch: -pitch,
      toes: Math.min(extension, pitch),
      planted: true,
    });
    const ankle = (at: IFoot): IAutoMovieVector3 =>
      HumanFoot.pivot(body, side, "mtp", at.at, at.heading, at.pitch).ankle;
    const back = (pitch: number): number => {
      let lo: number = 0;
      let hi: number = m.shank + m.footLength;
      for (let i: number = 0; i < 40; i++) {
        const mid: number = (lo + hi) / 2;
        if (
          Vector3.length(Vector3.subtract(ankle(foot(mid, pitch)), kneeAt)) <
          m.shank
        )
          lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    let pitch: number = 90 - dorsiflexion;
    for (let i: number = 0; i < 6; i++) {
      const rise: number = ankle(foot(back(pitch), pitch)).y - kneeAt.y;
      pitch =
        90 -
        dorsiflexion +
        (Math.asin(Math.max(-1, Math.min(1, rise / m.shank))) * 180) / Math.PI;
    }
    return foot(back(pitch), pitch);
  }

  /**
   * A root turned about a pivot from one place to another, as the hips turn
   * about the knees when the body sits back on its heels.
   *
   * @param pivot The pivot, world metres.
   * @param a The root at progress 0.
   * @param b The root at progress 1.
   * @param u Progress in [0, 1].
   * @returns The root.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the turn, each input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A spherical interpolation of the two arms from the pivot, so the root keeps its distance from the knees when the arms are equally long.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two arms, their angle and one weighted sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Arms closer than a millionth of a radian return the first root instead of dividing by the angle's sine.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No equivalent work exists to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function turn(
    pivot: IAutoMovieVector3,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    u: number,
  ): IAutoMovieVector3 {
    const from: IAutoMovieVector3 = Vector3.subtract(a, pivot);
    const to: IAutoMovieVector3 = Vector3.subtract(b, pivot);
    const angle: number = Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          Vector3.dot(from, to) / (Vector3.length(from) * Vector3.length(to)),
        ),
      ),
    );
    if (angle < 1e-6) return a;
    return Vector3.add(
      pivot,
      Vector3.add(
        Vector3.scale(from, Math.sin((1 - u) * angle) / Math.sin(angle)),
        Vector3.scale(to, Math.sin(u * angle) / Math.sin(angle)),
      ),
    );
  }

  /** How far short of the hip's extension range a thigh reaching behind is kept, degrees (provisional). */
  export const SPARE: number = 5;

  /**
   * The forward tilt of the pelvis that keeps the legs inside the hips'
   * extension range while a foot stands far behind: people lean the trunk
   * forward as they step back into a lunge, because the hip extends only
   * about 30 degrees against the pelvis.
   *
   * @param body The body.
   * @param hips The hip joints, world metres.
   * @param ankles The ankles, world metres.
   * @param forward The heading's unit vector.
   * @returns Degrees, never negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the tilt, why people make it, each input and the result's unit.
   * @evidence contracts/development/implementation.md#principled-implementation The thigh's slope behind the vertical is the hip-to-ankle line's slope less the angle the two-bone leg puts between that line and the thigh; the tilt is what that slope exceeds the range less `SPARE` by, the greater of the two legs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A law of cosines per leg and one rounded maximum with zero.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The range is read from the range table; the corner at zero is rounded over 2 degrees so the tilt starts without a jump in its speed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `AutoMovieMotionHumanRange.limit`, as `tucked` does.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function lean(
    body: IHumanBody,
    hips: Record<"left" | "right", IAutoMovieVector3>,
    ankles: Record<"left" | "right", IAutoMovieVector3>,
    forward: IAutoMovieVector3,
  ): number {
    const m = body.measure;
    let most: number = -Infinity;
    for (const side of ["left", "right"] as const) {
      const range: number = -(
        AutoMovieMotionHumanRange.limit(`${side}UpperLeg`, "extension") ?? 0
      );
      const to: IAutoMovieVector3 = Vector3.subtract(ankles[side], hips[side]);
      const length: number = Math.max(
        1e-6,
        Math.min(m.thigh + m.shank, Vector3.length(to)),
      );
      const line: number = Math.atan2(-Vector3.dot(to, forward), -to.y);
      const inside: number = Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            (m.thigh * m.thigh + length * length - m.shank * m.shank) /
              (2 * m.thigh * length),
          ),
        ),
      );
      most = Math.max(
        most,
        ((line - inside) * 180) / Math.PI - (range - SPARE),
      );
    }
    return (most + Math.sqrt(most * most + 4)) / 2;
  }

  /**
   * Solve the key states.
   *
   * @param body The body.
   * @param standing The standing posture the kneel starts from.
   * @param kind On one knee, on both knees or sitting back.
   * @param k The knee that goes down first.
   * @returns The key states.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result; the namespace gives the geometry.
   * @evidence contracts/development/implementation.md#principled-implementation Each place is solved from the thigh, the shank, the knee's radius and the ankle's and toes' ranges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Standing feet, the kneeling height, the tucked feet, the sitting root, then the key list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The knee's radius is the shank collider's, marked provisional in the namespace of the law.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two tucked feet, each six 40-step bisections of a closed-form ankle place.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The first knee's tucked foot serves every key after the step.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function solve(
    body: IHumanBody,
    standing: IHumanPosture,
    kind: "one" | "both" | "sitBack",
    k: "left" | "right",
  ): IKeys {
    const m = body.measure;
    const f: "left" | "right" = k === "left" ? "right" : "left";
    const yaw: number = standing.yaw;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );

    // Standing feet as toes' joints on the floor with their headings.
    const flat = (side: "left" | "right"): HumanFoot.IPlacement => {
      const goal: IHumanPosture.IGoal = standing.limbs[`${side}Leg`]!;
      return {
        ankle: goal.point,
        rotation: goal.rotation ?? HumanFrame.turn(yaw),
      };
    };
    const stood = (side: "left" | "right"): IFoot => ({
      at: HumanFoot.point(body, side, "mtp", flat(side)),
      heading: HumanFoot.heading(flat(side).rotation),
      pitch: 0,
      toes: 0,
      planted: true,
    });
    const foot0: Record<"left" | "right", IFoot> = {
      left: stood("left"),
      right: stood("right"),
    };
    const ankleOf = (side: "left" | "right", foot: IFoot): IAutoMovieVector3 =>
      HumanFoot.pivot(body, side, "mtp", foot.at, foot.heading, foot.pitch)
        .ankle;

    // The kneeling height: the knee joint a shank radius over the floor, the
    // hip joint a thigh above it.
    const knee: number = m.shankRadius;
    const hipY: number = knee + m.thigh;
    const frontAnkle: IAutoMovieVector3 = flat(f).ankle;
    const above: number = hipY - (frontAnkle.y + m.shank);
    const behind: number = Math.sqrt(
      Math.max(0, m.thigh * m.thigh - above * above),
    );
    const rest = hipJoints(body, { x: 0, y: 0, z: 0 }, HumanFrame.turn(yaw));
    const standingHips = hipJoints(body, standing.root, HumanFrame.turn(yaw));
    const hipK: IAutoMovieVector3 = {
      ...Vector3.add(
        standingHips[k],
        Vector3.scale(
          forward,
          Vector3.dot(Vector3.subtract(frontAnkle, standingHips[k]), forward) -
            behind,
        ),
      ),
      y: hipY,
    };
    const rootKneel: IAutoMovieVector3 = Vector3.subtract(hipK, rest[k]);

    const kneeK: IAutoMovieVector3 = Vector3.subtract(
      hipK,
      Vector3.scale(up, m.thigh),
    );
    const backFoot: IFoot = tucked(body, k, kneeK, yaw, foot0[k].at.y);
    const secondFoot: IFoot = tucked(
      body,
      f,
      { ...Vector3.add(rootKneel, rest[f]), y: knee },
      yaw,
      foot0[f].at.y,
    );

    // Sitting back: the thigh turns back about the knee until it flexes SIT
    // degrees.
    const shankDir: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(ankleOf(k, backFoot), kneeK),
    );
    const across: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(shankDir, up),
    );
    const normal: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(across, shankDir),
    );
    const open: number = ((180 - SIT) * Math.PI) / 180;
    const hipSit: IAutoMovieVector3 = Vector3.add(
      kneeK,
      Vector3.scale(
        Vector3.add(
          Vector3.scale(shankDir, Math.cos(open)),
          Vector3.scale(normal, Math.sin(open)),
        ),
        m.thigh,
      ),
    );

    const feet = (front: IFoot): IKey["feet"] =>
      ({ [f]: front, [k]: backFoot }) as IKey["feet"];
    const keys: IKey[] = [
      { root: standing.root, feet: foot0 },
      { root: rootKneel, feet: feet(foot0[f]) },
      { root: rootKneel, feet: feet(foot0[f]) },
    ];
    if (kind !== "one") keys.push({ root: rootKneel, feet: feet(secondFoot) });
    if (kind === "sitBack")
      keys.push({
        root: Vector3.subtract(hipSit, rest[k]),
        feet: feet(secondFoot),
      });
    return {
      keys,
      forward,
      rest,
      pivot: Vector3.subtract(kneeK, rest[k]),
      extension: Math.min(
        1,
        Vector3.length(Vector3.subtract(frontAnkle, standingHips[f])) /
          (m.thigh + m.shank),
      ),
    };
  }
}
