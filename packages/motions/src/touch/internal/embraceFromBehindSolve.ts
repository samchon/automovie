import { DEFAULT_HUMANOID_ROM, Vector3 } from "@automovie/engine";
import type {
  AutoMovieClinicalAxis,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../../audit/internal/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanHead } from "../../compose/internal/AutoMovieMotionHumanHead";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanAuditModel } from "../../posture/internal/HumanAuditModel";
import { HumanSequentialConvex } from "../../posture/internal/HumanSequentialConvex";
import { HumanSequentialConvexFunctions } from "../../posture/internal/HumanSequentialConvexFunctions";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { kiss } from "./kiss";
import { kissPose } from "./kissPose";

/*
 * The embrace from behind's one solve and what it reads (`embraceFromBehind`):
 * the stance and head solved as one constrained problem, the neck's added
 * angles, the chest's contact with the partner's torso, and the refusals.
 */
export namespace embraceFromBehindSolve {
  /*
   * The neck's two bones a resting head bends over.
   */
  export type NeckBone = "neck" | "head";

  /*
   * A freedom's range in the solve, metres or radians.
   */
  export interface IRange {
    /*
     * The least value.
     */
    low: number;

    /*
     * The greatest value.
     */
    high: number;
  }

  /*
   * One solved embrace: the root's advance and shift on the planted feet, the
   * lean's pitch and roll, the head's turn, and the neck's flexion and side
   * bend.
   */
  export interface ISolved {
    /*
     * The root's advance along the heading on the planted feet, metres.
     */
    advance: number;

    /*
     * The root's shift to the left on the planted feet, metres.
     */
    shift: number;

    /*
     * The forward lean from the hips, degrees.
     */
    pitch: number;

    /*
     * The side lean from the hips, degrees.
     */
    roll: number;

    /*
     * How far the body sinks on bent knees, metres.
     */
    sink: number;

    /*
     * The heels' raise, degrees: the rise onto the forefeet that lifts the
     * chin.
     */
    raise: number;

    /*
     * The head's turn, degrees.
     */
    twist: number;

    /*
     * The neck's flexion, degrees.
     */
    flexion: number;

    /*
     * The side bend over the neck and head, degrees.
     */
    tilt: number;

    /*
     * The neck's protraction, degrees: lower-neck flexion countered by
     * upper-neck extension.
     */
    protract: number;

    /*
     * The chin's distance from the shoulder at the solution, metres.
     */
    miss: number;
  }

  /*
   * A solved embrace with the partner's bone its chest bears on.
   */
  export interface IPlaced extends ISolved {
    /*
     * The partner's torso bone whose collider lies nearest the chest's: the
     * chest's computed contact.
     */
    chest: AutoMovieHumanoidBone;
  }

  /*
   * The partner's surfaces the embrace bears on: the torso's colliders (the
   * back the chest lies on), the shoulder region's bone's colliders (the
   * shoulder the head rests on) and the region's point on them (where the chin
   * goes).
   */
  export interface ISurfaces {
    /*
     * The signed distance to the partner's torso colliders.
     */
    back: (
      point: IAutoMovieVector3,
    ) => IAutoMovieMotionHumanColliders.IDistance;

    /*
     * The signed distance to the colliders of the shoulder region's bone.
     */
    top: (point: IAutoMovieVector3) => IAutoMovieMotionHumanColliders.IDistance;

    /*
     * The shoulder region's point, world metres.
     */
    rest: IAutoMovieVector3;
  }

  /*
   * The miss under which a region rests on another, metres (provisional: a skin
   * contact, as `headRest`'s).
   */
  export const NEAR: number = 0.01;

  /*
   * The lean's forward range, degrees: the kiss's own.
   */
  const PITCH: readonly [number, number] = [-10, 45];

  /*
   * Radians in a degree.
   */
  const RADIAN: number = Math.PI / 180;

  /*
   * The partner's torso bones whose colliders are the back the chest lies on.
   */
  export const TORSO: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>(["spine", "chest", "upperChest"]);

  /*
   * How far the body may sink on bent knees to bring the chin down, metres
   * (provisional: a slight knee bend).
   */
  const SINK: number = 0.12;

  /*
   * The neck's flexion, side bend and turn at a share, added over the posture's
   * own.
   */
  export function neck(
    posture: IAutoMovieMotionHumanPosture,
    s: ISolved,
    k: number,
  ): IAutoMovieMotionHumanPosture {
    const flexion: IAutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(0, s.flexion * k);
    const bend: IAutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(1, s.tilt * k);
    const turn: IAutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(2, s.twist * k);
    const added = (bone: NeckBone): readonly [number, number, number] => {
      const held: readonly [number, number, number] = posture.joints[bone] ?? [
        0, 0, 0,
      ];
      // Protraction flexes the neck bone and extends the head bone as much.
      const jut: number = (bone === "neck" ? 1 : -1) * s.protract * k;
      return [
        held[0] + flexion[bone]![0] + jut,
        held[1] + bend[bone]![1],
        held[2] + turn[bone]![2],
      ];
    };
    return {
      ...posture,
      joints: { ...posture.joints, neck: added("neck"), head: added("head") },
    };
  }

  /*
   * The embrace's stance and head, solved once at preparation as one
   * constrained problem: the head on the partner's shoulder, the chest on the
   * partner's back, the two bodies clear of each other, or the refusal.
   *
   * The stance is solved with the head: the root's advance and shift on the
   * planted feet (the kiss's own supported root, `kissBody`) are variables of
   * the solve, with the knees' sink, the lean's pitch and roll, the heels'
   * raise and the neck's flexion, side bend, turn and protraction. The solve is
   * sco's `BasicTrustRegionSQP` (`HumanSequentialConvex`, the trajopt port),
   * its variables in metres and radians, the units sco's parameters hold:
   *
   * - The cost is the squared distance from the chin to the shoulder's region,
   *   convexified with its full Hessian (trajopt's `CostFromFunc` with
   *   `full_hessian`).
   * - The two contacts are equalities on their contact violation, the distance
   *   from the contacting part to the nearest point of the surface it bears on
   *   (Mordatch, Todorov and Popović 2012, "Discovery of complex behaviors
   *   through contact-invariant optimization", §4.2), read against the
   *   colliders the audit reads two bodies by
   *   (`AutoMovieMotionHumanAuditPartner`: a declared contact is "a statement
   *   that the skins meet"): the chin's signed distance to the shoulder's
   *   colliders, the chin the contact's end effector, and the least signed
   *   distance from the audit's probes of the torso to the partner's back
   *   (`contact`).
   * - The two bodies are kept apart by trajopt's collision term, the hinge on the
   *   signed distance of every pair against its safety margin
   *   (`trajopt/src/collision_terms.cpp`), the margin the skin the audit allows
   *   (`AutoMovieMotionHumanAuditSkin.BUILT`): one row per pair of segments,
   *   each pair's deepest probe through the hold (`embraceTrunkClear`) at most
   *   that deep.
   * - The bounds are each freedom's range.
   *
   * The solved embrace is then checked as Algorithm 1 checks a base: each
   * contact within `NEAR` of its surface and the bodies within the skin; a
   * check that fails refuses with its measure.
   */
  export function solve(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanPosture,
    stance: IAutoMovieMotionHumanRise.Stance,
    surfaces: ISurfaces,
    partner: string,
    depth: (posture: IAutoMovieMotionHumanPosture, head: boolean) => number[],
  ): IPlaced {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const leaned: ReturnType<typeof kissPose> = kissPose(
      body,
      entry,
      stance,
      0,
      false,
    );
    const chin: ReturnType<typeof HumanTrunk.preparePoint> =
      HumanTrunk.preparePoint(body, "chin");
    const posed: (s: ISolved) => IAutoMovieMotionHumanPosture = (
      s: ISolved,
    ): IAutoMovieMotionHumanPosture =>
      neck(
        leaned({
          pitch: s.pitch,
          roll: s.roll,
          flexion: 0,
          raise: s.raise,
          sink: s.sink,
          advance: s.advance,
          shift: s.shift,
        }),
        s,
        1,
      );

    // A point of the solve: metres and radians, read back in degrees.
    const solved: (x: HumanSequentialConvexFunctions.Vector) => ISolved = (
      x: HumanSequentialConvexFunctions.Vector,
    ): ISolved => ({
      advance: x[0]!,
      shift: x[1]!,
      sink: x[2]!,
      pitch: degrees(x[3]!),
      roll: degrees(x[4]!),
      flexion: degrees(x[5]!),
      tilt: degrees(x[6]!),
      twist: degrees(x[7]!),
      protract: degrees(x[8]!),
      raise: degrees(x[9]!),
      miss: 0,
    });
    const neckRange: (axis: AutoMovieClinicalAxis) => IRange = (
      axis: AutoMovieClinicalAxis,
    ): IRange => ({
      low:
        (DEFAULT_HUMANOID_ROM.neck![axis]!.min +
          DEFAULT_HUMANOID_ROM.head![axis]!.min) *
        RADIAN,
      high:
        (DEFAULT_HUMANOID_ROM.neck![axis]!.max +
          DEFAULT_HUMANOID_ROM.head![axis]!.max) *
        RADIAN,
    });
    const bounds: readonly IRange[] = [
      { low: -Infinity, high: Infinity },
      { low: -Infinity, high: Infinity },
      { low: 0, high: SINK },
      { low: PITCH[0] * RADIAN, high: PITCH[1] * RADIAN },
      { low: -kiss.ROLL * RADIAN, high: kiss.ROLL * RADIAN },
      neckRange("flexion"),
      neckRange("abduction"),
      neckRange("twist"),
      { low: 0, high: DEFAULT_HUMANOID_ROM.neck!.flexion!.max * RADIAN },
      { low: 0, high: kiss.RAISE * RADIAN },
    ];
    const result: IAutoMovieMotionHumanSequentialConvex.IResult<
      HumanSequentialConvexFunctions.Vector,
      IAutoMovieMotionHumanSequentialConvex.IEvaluation
    > = HumanSequentialConvex.minimise(
      HumanSequentialConvexFunctions.problem({
        costs: [
          {
            f: (x: HumanSequentialConvexFunctions.Vector): number => {
              const d: IAutoMovieVector3 = Vector3.subtract(
                chin(posed(solved(x)), resolution),
                surfaces.rest,
              );
              return Vector3.dot(d, d);
            },
            full: true,
          },
        ],
        constraints: [
          {
            g: (
              x: HumanSequentialConvexFunctions.Vector,
            ): HumanSequentialConvexFunctions.Vector => {
              const posture: IAutoMovieMotionHumanPosture = posed(solved(x));
              return [
                surfaces.top(chin(posture, resolution)).distance,
                contact(body, posture, TORSO, surfaces.back).distance,
              ];
            },
            equality: true,
          },
          {
            g: (
              x: HumanSequentialConvexFunctions.Vector,
            ): HumanSequentialConvexFunctions.Vector =>
              depth(posed(solved(x)), true).map(
                (pair: number): number =>
                  pair - AutoMovieMotionHumanAuditSkin.BUILT,
              ),
            equality: false,
          },
        ],
        low: bounds.map((b: IRange): number => b.low),
        high: bounds.map((b: IRange): number => b.high),
      }),
      bounds.map((): number => 0),
      HumanSequentialConvex.DEFAULTS,
    );
    const best: ISolved = solved(result.x);
    const posture: IAutoMovieMotionHumanPosture = posed(best);
    const miss: number = Vector3.distance(
      chin(posture, resolution),
      surfaces.rest,
    );
    const head: IAutoMovieMotionHumanColliders.IDistance = surfaces.top(
      chin(posture, resolution),
    );

    const chest: IAutoMovieMotionHumanColliders.IDistance = contact(
      body,
      posture,
      TORSO,
      surfaces.back,
    );
    const into: number = Math.max(...depth(posture, true));
    if (Math.abs(head.distance) > NEAR)
      throw refusal(
        partner,
        `the chin stays ${(head.distance * 1000).toFixed(0)} mm from the partner's shoulder with the chest on the back, ${(miss * 1000).toFixed(0)} mm from the shoulder's top, leaning ${best.roll.toFixed(0)} degrees aside, sinking ${(best.sink * 1000).toFixed(0)} mm, the head turned ${best.twist.toFixed(0)}, flexed ${best.flexion.toFixed(0)} and bent ${best.tilt.toFixed(0)}, the heels raised ${best.raise.toFixed(0)}`,
        "stand behind the shoulder the chin rests on, or embrace a partner whose shoulder is near the chin's height",
      );
    if (Math.abs(chest.distance) > NEAR)
      throw refusal(
        partner,
        `the chest lies ${(chest.distance * 1000).toFixed(0)} mm ${chest.distance > 0 ? "off" : "into"} the partner's back with the head on the shoulder`,
        "stand behind the partner, nearer or farther by that much",
      );
    // Within the skin to the solve's own constraint tolerance (sco's
    // `cntTolerance`).
    if (
      into >
      AutoMovieMotionHumanAuditSkin.BUILT +
        HumanSequentialConvex.DEFAULTS.cntTolerance
    )
      throw refusal(
        partner,
        `the bodies lie ${(into * 1000).toFixed(1)} mm into each other with the head on the shoulder and the chest on the back`,
        "stand behind the shoulder the chin rests on",
      );
    return { ...best, miss, chest: chest.bone as AutoMovieHumanoidBone };
  }

  /*
   * A contact's violation: the least signed distance from the audit's probes of
   * a body's parts (`HumanAuditModel.frame`) to the surface they bear on, with
   * the surface's nearest bone.
   */
  export function contact(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    parts: ReadonlySet<AutoMovieHumanoidBone>,
    surface: (
      point: IAutoMovieVector3,
    ) => IAutoMovieMotionHumanColliders.IDistance,
  ): IAutoMovieMotionHumanColliders.IDistance {
    const frame: HumanAuditModel.IFrame = HumanAuditModel.frame(
      body,
      poseBones(body, resolveHumanPosture(body, posture)),
    );
    let least: IAutoMovieMotionHumanColliders.IDistance | undefined;
    frame.model.parts.forEach(
      (part: IAutoMovieMotionHumanAuditTangleModel.IPart, i: number): void => {
        if (!parts.has(part.bone)) return;
        for (const probe of frame.probes[i]!) {
          const near: IAutoMovieMotionHumanColliders.IDistance = surface(probe);
          if (least === undefined || near.distance < least.distance)
            least = near;
        }
      },
    );
    return least!;
  }

  /*
   * Degrees of an angle in radians.
   */
  export function degrees(radians: number): number {
    return radians / RADIAN;
  }

  /*
   * A reach refusal of the embrace.
   */
  export function refusal(
    partner: string,
    reason: string,
    fix: string,
  ): AutoMovieMotionHumanRefusal {
    return new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "partner",
      value: partner,
      reason,
      fix,
    });
  }
}
