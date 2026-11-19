import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropDrive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ExerciseKey } from "../exercise/ExerciseKey";
import { poseBones } from "../posture/poseBones";
import { AquaticCrew } from "./AquaticCrew";
import { AquaticPosture } from "./AquaticPosture";

/**
 * Dinghy tack and near-side recovery when a tack is aborted. The visible
 * foot transfers follow World Sailing Racing Rules 13 and 42 and Schutt (2017).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both outcomes and their supporting references.
 * @evidence contracts/development/design.md#principled-representation Stages body transfers in the hull frame while the helm drives the boat's authored rig.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the dinghy gait and helm articular timing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The entered body and craft determine the deck contact locations.
 */
export namespace AquaticSail {
  /** Two discrete foot transfers, or a near-side recovery when the helm aborts. */
  export function plan(
    context: AquaticPosture.Context,
    aborted: boolean,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const hull: AquaticCrew.IHull = AquaticCrew.bind(context);
    const hipsAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["hips"]);
    const duration: number = 3.65;
    const helm: boolean = params.role !== "crew";
    const lead: AquaticCrew.Side = params.side ?? "left";
    const trail: AquaticCrew.Side = lead === "left" ? "right" : "left";
    const enteredHips: IAutoMovieVector3 = poseBones(
      body,
      entry.pose,
      undefined,
      new Set(["hips"]),
    ).get("hips")!.worldPosition;
    const hips: IAutoMovieVector3 = Quaternion.rotateVector(
      hull.inverse,
      Vector3.subtract(enteredHips, hull.origin.position),
    );
    const initialSide: number =
      params.side === undefined
        ? Math.sign(hips.x) || 1
        : lead === "left"
          ? 1
          : -1;
    const cross: number =
      -initialSide *
      Math.max(Math.abs(hips.x), body.measure.stature * 0.21) *
      (aborted ? 1 : 2);
    const leadStart: number = helm ? 0.29 : 0.21;
    const leadEnd: number = leadStart + 0.21;
    const trailStart: number = aborted ? 0.58 : leadEnd + 0.02;
    const trailEnd: number = trailStart + 0.19;
    const clearance: number = body.measure.stature * 0.075;
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      AquaticCrew.bear(hull.id, `${lead}Foot`, "plant", 0, leadStart),
      AquaticCrew.bear(
        hull.id,
        `${lead}Foot`,
        "plant",
        leadEnd,
        aborted ? trailStart : 1,
      ),
      AquaticCrew.bear(
        hull.id,
        `${trail}Foot`,
        "plant",
        0,
        aborted ? 1 : trailStart,
      ),
      AquaticCrew.bear(
        hull.id,
        aborted ? `${lead}Foot` : `${trail}Foot`,
        "plant",
        trailEnd,
        1,
      ),
      ...AquaticCrew.grips(hull, params),
    ];
    const upright: IAutoMovieMotionHumanPosture = entry.posture;
    const drives: IAutoMovieMotionPropDrive[] = [];
    if (helm && params.boom !== undefined) {
      const start: number = hull.travel(params.boom);
      drives.push({
        prop: hull.id,
        articulation: params.boom,
        from: 0,
        to: 1,
        travel: (t: number): number => {
          const u: number = t / duration;
          return aborted
            ? start *
                (1 -
                  0.65 *
                    (AquaticCrew.span(u, 0.12, leadEnd) -
                      AquaticCrew.span(u, trailStart, trailEnd)))
            : start * (1 - 2 * AquaticCrew.span(u, leadStart, trailEnd));
        },
      });
    }
    if (helm && params.rudder !== undefined) {
      const start: number = hull.travel(params.rudder);
      drives.push({
        prop: hull.id,
        articulation: params.rudder,
        from: 0,
        to: 1,
        travel: (t: number): number => {
          const u: number = t / duration;
          return (
            start +
            initialSide *
              18 *
              (AquaticCrew.span(u, 0.12, leadStart) -
                AquaticCrew.span(u, leadEnd, trailEnd))
          );
        },
      });
    }
    return {
      duration,
      contacts,
      drives,
      events: [
        { name: "helmIn", share: 0.12 },
        { name: "leadLift", share: leadStart },
        { name: "leadPlant", share: leadEnd },
        { name: aborted ? "abort" : "trailLift", share: trailStart },
        { name: "settle", share: trailEnd },
        { name: "relax", share: 1 },
      ],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, Math.min(duration, seconds));
        const u: number = t / duration;
        const first: number = AquaticCrew.span(u, leadStart, leadEnd);
        const second: number = AquaticCrew.span(u, trailStart, trailEnd);
        const stride: number = aborted ? first - second : (first + second) / 2;
        const lower: number =
          AquaticCrew.span(u, 0.12, leadStart) *
          (1 - AquaticCrew.span(u, trailEnd, 0.98));
        const trunk: IAutoMovieMotionHumanPosture = AquaticPosture.key(
          upright,
          ExerciseKey.from(
            body,
            {
              pitch: 9 + 28 * lower,
              roll: initialSide * (9 - 18 * stride),
              yaw: initialSide * 80 * stride,
              spine: [9 * lower, 0, (helm ? 20 : 10) * stride],
              neck: -12 * lower,
            },
            {
              hip: 23 + 32 * lower,
              knee: 28 + 40 * lower,
              shoulder: 36,
              raise: 28,
              elbow: 65,
            },
          ),
        );
        const leadX: number = aborted ? first - second : first;
        const trailX: number = aborted ? 0 : second;
        const leadBase: IAutoMovieVector3 = hull.feet[lead];
        const trailBase: IAutoMovieVector3 = hull.feet[trail];
        const footA: IAutoMovieVector3 = {
          ...leadBase,
          x: leadBase.x + cross * leadX,
          y:
            leadBase.y +
            clearance *
              (swing(u, leadStart, leadEnd) +
                (aborted ? swing(u, trailStart, trailEnd) : 0)),
        };
        const footB: IAutoMovieVector3 = {
          ...trailBase,
          x: trailBase.x + cross * trailX,
          y:
            trailBase.y +
            (aborted ? 0 : clearance * swing(u, trailStart, trailEnd)),
        };
        const carriedHips: IAutoMovieVector3 = {
          ...hips,
          x: hips.x + cross * (aborted ? 0.48 : 1) * stride,
          y: hips.y - body.measure.stature * 0.26 * lower,
        };
        // The pelvis crosses the deck. Counter the offset from rotating the
        // floor-origin rig to duck, so pitch and yaw do not move it off that path.
        const offset: IAutoMovieVector3 = Vector3.subtract(
          hipsAt(trunk).get("hips")!.worldPosition,
          trunk.root,
        );
        const root: IAutoMovieVector3 = Vector3.subtract(
          carriedHips,
          Quaternion.rotateVector(hull.inverse, offset),
        );
        return AquaticCrew.apply(
          context,
          hull,
          t,
          trunk,
          root,
          lead === "left" ? footA : footB,
          lead === "right" ? footA : footB,
        );
      },
    };
  }

  /** An ankle's clearance pulse between release and replant. */
  function swing(at: number, from: number, to: number): number {
    return Math.sin(Math.PI * AquaticCrew.span(at, from, to)) ** 2;
  }
}
