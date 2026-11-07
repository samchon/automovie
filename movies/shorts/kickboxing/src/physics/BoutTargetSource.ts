import {
  AutoMovieEnvelope as Envelope,
  preparePhysicalGeometry as Geometry,
  Quaternion,
} from "@automovie/engine";
import {
  AutoMovieHumanGrounding as Grounding,
  type AutoMovieHumanSkeleton as Skeleton,
} from "@automovie/human";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createPersonParameters } from "../assets/person/createPersonParameters";
import { Resolve } from "../motion/contact/Resolve";
import { Blocking } from "../motion/defense/Blocking";
import { Fighter } from "../motion/fighter/Fighter";
import { FighterBody } from "../motion/fighter/FighterBody";
import { Aftermath } from "../motion/reactions/Aftermath";
import { BoutFormulaResponse } from "../motion/reactions/BoutFormulaResponse";
import { Referee } from "../motion/referee/Referee";
import { RefereeCues } from "../motion/referee/RefereeCues";
import { Rhythm } from "../motion/rhythm/Rhythm";
import { FilmBodyRig as Rig } from "../motion/rig/FilmBodyRig";
import { FilmVector as V } from "../motion/rig/FilmVector";
import { Foot } from "../motion/rig/Foot";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import { boutPhysicalPlacement } from "./boutPhysicalPlacement";
import { boutPhysicalTrunk } from "./boutPhysicalTrunk";
import { fitBoutContactScene } from "./fitBoutContactScene";
import { fitBoutPhysicalLimbs } from "./fitBoutPhysicalLimbs";
import { fitBoutPhysicalTargets } from "./fitBoutPhysicalTargets";

/** Authored bout/referee intent and shared clinical/sole fitting; this source contains no collision solver or fall path. */
export class BoutTargetSource {
  /** Three actor bindings; fighters share their fixed body. */
  public readonly rigs: Record<FilmPlan.ActorId, Rig>;
  /** Authored fighters and their shared step-planner consumers. */
  public readonly fighters: Record<"a" | "b", Fighter>;
  /** Authored officiating cues, timing and supported steps. */
  public readonly referee: Referee;
  /** Exact declared physical foot populations, shared with Human grounding. */
  private readonly grounding: Record<FilmPlan.ActorId, Grounding.IPrepared>;
  /** Shared convex queries prepared before sampling interbody constraints. */
  private geometry?: Geometry.IQueries;
  /** Exact geometric inputs retained with the produced comparison. */
  private responses: BoutFormulaResponse.IContact[] = [];
  public constructor() {
    const fighter: Rig = new Rig(createPersonParameters(1800, true), true);
    const referee: Rig = new Rig(
      createPersonParameters(1780, false),
      false,
      75,
    );
    this.rigs = { a: fighter, b: fighter, referee };
    this.fighters = {
      a: new Fighter(
        "a",
        fighter,
        (seconds: number): Fighter.Stance =>
          seconds < Aftermath.kickEnd
            ? rocking("a", Blocking.pair(seconds).a, seconds)
            : Aftermath.stance(seconds),
        { start: 0, end: 180, physical: true },
      ),
      b: new Fighter(
        "b",
        fighter,
        (seconds: number): Fighter.Stance =>
          rocking(
            "b",
            Blocking.pair(Math.min(seconds, BoutScript.finish.at)).b,
            Math.min(seconds, BoutScript.finish.at),
          ),
        { start: 0, end: BoutScript.finish.at, physical: true },
      ),
    };
    this.referee = new Referee(
      referee,
      RefereeCues.scene((seconds: number): V.Value => {
        const stance: Fighter.Stance =
          seconds < Aftermath.kickEnd
            ? { ...Blocking.pair(seconds).a, walk: 0 }
            : Aftermath.stance(seconds);
        return [stance.origin[0], 1.6, stance.origin[1]];
      }),
      true,
    );
    const groundFighter: Grounding.IPrepared = Grounding.prepare(
      fighter.evaluate,
      fighter.solePoints,
    );
    this.grounding = {
      a: groundFighter,
      b: groundFighter,
      referee: Grounding.prepare(referee.evaluate, referee.solePoints),
    };
  }
  /** Initialize the shared no-dynamics geometry provider once before generating constrained targets. */
  public async prepare(): Promise<void> {
    this.geometry ??= await Geometry();
  }
  /** Select response authority independently from the supported-step policy. */
  public configureResponses(
    mode: BoutFormulaResponse.Mode,
    contacts: readonly BoutFormulaResponse.IContact[],
  ): void {
    this.responses = BoutFormulaResponse.admit(contacts);
    for (const fighter of Object.values(this.fighters))
      fighter.response.configure(mode, this.responses);
  }
  /** Replay facial acting from exactly the same inputs used before target fitting. */
  public get formulaResponses(): BoutFormulaResponse.IContact[] {
    return structuredClone(this.responses);
  }
  /** Post-contact B retains intent only; withdrawing physical tracking determines his actual pelvis/head trajectory. */
  public frames(seconds: number): Record<FilmPlan.ActorId, FighterBody.Frame> {
    const a: FighterBody.Frame = this.fighters.a.frame(seconds);
    Aftermath.apply(
      a,
      seconds,
      (): V.Value => [Aftermath.fallenHead[0], 0.2, Aftermath.fallenHead[1]],
    );
    const b: FighterBody.Frame = this.fighters.b.frame(
      Math.min(seconds, BoutScript.finish.at),
      seconds,
    );
    if (seconds > BoutScript.finish.at) b.time = seconds;
    if (seconds > 157.7) {
      const head: number = Envelope.plateau(
        seconds,
        157.7,
        158.2,
        162.3,
        163.2,
      );
      const brace: number = Envelope.plateau(seconds, 158.7, 159.3, 163, 163.8);
      const push: number = Envelope.plateau(
        seconds,
        159.6,
        160.6,
        161.6,
        162.6,
      );
      b.hands = { left: { kind: "pose" }, right: { kind: "pose" } };
      b.legs = { left: { kind: "pose" }, right: { kind: "pose" } };
      b.cervical.flexion = 10 - 12 * head;
      b.atlas.flexion = 4 - 5 * head;
      b.arms.left = {
        shoulder: { flexion: 25 + 55 * brace, abduction: 15, rotation: 20 },
        elbow: { flexion: 100 - 65 * push },
        forearm: { pronation: 35 },
      };
      b.thoracic.flexion = 12 - 8 * push;
      b.jaw = 10;
    }
    return { a, b, referee: this.referee.frame(seconds) };
  }
  /** Bake actual clinical targets through Human's fitter and complete declared sole constraints. */
  public sample(
    seconds: number,
  ): Record<FilmPlan.ActorId, BoutTargetSource.ISample> {
    if (!this.geometry)
      throw new Error(
        "Prepare bout geometry before sampling constrained targets",
      );
    const frames: Record<FilmPlan.ActorId, FighterBody.Frame> =
      this.frames(seconds);
    const resolved: Resolve.Output = Resolve.requests(
      frames,
      this.rigs,
      undefined,
      { geometry: this.geometry, approach: false },
    );
    const results: Record<FilmPlan.ActorId, BoutTargetSource.ISample> =
      {} as Record<FilmPlan.ActorId, BoutTargetSource.ISample>;
    for (const id of ["a", "b", "referee"] as const) {
      const request: Rig.Request = resolved.requests[id]!;
      for (const side of ["left", "right"] as const) {
        const leg: Rig.Goal | undefined = request.legs?.[side];
        if (!leg || frames[id].legs[side].kind !== "place") continue;
        const lift: number = this.rigs[id].ballHeight - Foot.BALL_HEIGHT;
        leg.point = V.add(leg.point, [0, lift, 0]);
        if (leg.aim?.bone === "ball")
          leg.aim.point = V.add(leg.aim.point, [0, lift, 0]);
      }
      const fitted: Rig.Result = this.rigs[id].solve(request);
      const grounded: Grounding.IResult = this.grounding[id](
        fitted.pose,
        {
          translation: [...request.root.position],
          rotation: [...request.root.rotation],
        },
        { channels: [], targets: [], rootAxes: ["y"], floor: 0, iterations: 1 },
      );
      if (grounded.status !== "admitted")
        throw new Error(
          `Bout sole grounding refused ${id}@${seconds}: ${grounded.reason}`,
        );
      const root: Rig.Placement = {
        position: grounded.root.translation,
        rotation: grounded.root.rotation,
      };
      const rotation: P.ITransform["rotation"] = {
        x: root.rotation[0],
        y: root.rotation[1],
        z: root.rotation[2],
        w: root.rotation[3],
      };
      const placements: Map<string, Skeleton.IPlacement> = new Map(
        grounded.output.posed.map(
          (placement: Skeleton.IPlacement): [string, Skeleton.IPlacement] => [
            placement.bone,
            placement,
          ],
        ),
      );
      const segments: Record<string, P.ITransform> = Object.fromEntries(
        this.rigs[id].profile.segments.map(
          (segment: P.ISegment): [string, P.ITransform] => {
            const placement: Skeleton.IPlacement = placements.get(
              segment.bone,
            )!;
            const turned: P.ITransform["rotation"] = Quaternion.multiply(
              rotation,
              {
                x: placement.rotation[0],
                y: placement.rotation[1],
                z: placement.rotation[2],
                w: placement.rotation[3],
              },
            );
            return [
              segment.bone,
              {
                position: V.vector(
                  V.add(
                    root.position,
                    V.rotate(placement.position, root.rotation),
                  ),
                ),
                rotation: turned,
              },
            ];
          },
        ),
      );
      const supportFit: ReturnType<typeof fitBoutPhysicalTargets> =
        fitBoutPhysicalTargets(this.rigs[id], segments, request, frames[id]);
      results[id] = {
        root,
        fitted,
        segments: supportFit.targets,
        request,
        frame: frames[id],
        groundingLift: root.position[1] - request.root.position[1],
        approach: resolved.approach[id]!,
        supportGoals: supportFit.goals,
      };
    }
    const physical: Resolve.Output = Resolve.requests(
      frames,
      this.rigs,
      Object.fromEntries(
        (["a", "b", "referee"] as const).map(
          (id: FilmPlan.ActorId): [string, Rig.Trunk] => [
            id,
            boutPhysicalTrunk(results[id].segments, this.rigs[id].profile),
          ],
        ),
      ),
      { geometry: this.geometry },
    );
    // Apply only authored target travel, then restore the original planted world
    // goals through the same shared support fitter before free-limb/contact fitting.
    for (const id of ["a", "b", "referee"] as const) {
      results[id].approach = physical.approach[id]!;
      const delta: V.Value = V.tuple(results[id].approach.translation);
      if (V.length(delta) === 0) continue;
      const shifted: Record<string, P.ITransform> = Object.fromEntries(
        Object.entries(results[id].segments).map(
          ([bone, pose]: [string, P.ITransform]): [string, P.ITransform] => [
            bone,
            {
              ...pose,
              position: V.vector(V.add(V.tuple(pose.position), delta)),
            },
          ],
        ),
      );
      const supportFit: ReturnType<typeof fitBoutPhysicalTargets> =
        fitBoutPhysicalTargets(
          this.rigs[id],
          shifted,
          results[id].request,
          frames[id],
        );
      results[id].segments = supportFit.targets;
      results[id].supportGoals = supportFit.goals;
    }
    for (const id of ["a", "b", "referee"] as const) {
      results[id].segments = fitBoutPhysicalLimbs(
        this.rigs[id],
        results[id].segments,
        physical.requests[id]!,
        frames[id],
      );
    }
    fitBoutContactScene(this, results, seconds, this.geometry);
    for (const id of ["a", "b", "referee"] as const) {
      results[id].root = boutPhysicalPlacement(
        results[id].segments.hips!,
        results[id].fitted.output.posed.find(
          (placement: Skeleton.IPlacement): boolean =>
            placement.bone === "hips",
        )!,
      );
    }
    return results;
  }
}

/** Complete sampled authoring state, independent of actual physical response. */
export namespace BoutTargetSource {
  /** One actor's actual shared clinical/sole output and its authored promises. */
  export interface ISample {
    /** Final displayed actor placement relative to the initial clinical pelvis. */
    root: Rig.Placement;
    /** Initial clinical fit and its residual, before shared support/contact fitting. */
    fitted: Rig.Result;
    /** World physical segment goals. */
    segments: Record<string, P.ITransform>;
    /** Original world goals. */
    request: Rig.Request;
    /** Authored posture and intentions. */
    frame: FighterBody.Frame;
    /** Sole-derived root lift, metres. */
    groundingLift: number;
    /** Measured remaining contact and protective witness residuals, metres. */
    residuals?: Record<string, number>;
    /** Receiver-relative authored root travel and remaining reach excess; actual displayed origins come from segments. */
    approach: Resolve.Output["approach"][string];
    /** Original shared floor-planner goals consumed by the subsequent simultaneous contact fit. */
    supportGoals: Record<string, IAutoMovieVector3>;
  }
}

/** Apply the retained live rhythm to the bout's authored stance, without a second step scheduler. */
function rocking(
  id: "a" | "b",
  frame: Blocking.Frame,
  seconds: number,
): Fighter.Stance {
  const [forward, left]: readonly [number, number] = Rhythm.stance(id, seconds);
  const offset: V.Value = V.rotateY([forward, 0, left], frame.heading);
  return {
    origin: [frame.origin[0] + offset[0], frame.origin[1] + offset[2]],
    heading: frame.heading,
    walk: 0,
  };
}
