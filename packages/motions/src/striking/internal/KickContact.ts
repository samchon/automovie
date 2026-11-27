import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingReach,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanArmTrajectoryTerms } from "../../posture/internal/HumanArmTrajectoryTerms";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { KickCarriage } from "./KickCarriage";
import { KickChain } from "./KickChain";
import { KickForm } from "./KickForm";
import { StrikingReach } from "./StrikingReach";
import { StrikingStance } from "./StrikingStance";

/*
 * A kick's contact, decided on the figure itself: the carriage
 * (KickCarriage) under which the leg, solved from the hip the carriage
 * leaves it and fitted by the engine's limb fit (KickChain), lands its
 * weapon on the planned point with the support foot on its plant.
 *
 * The leans are tried from the least upward and the first that lands exactly
 * (weapon and support ball within KickForm.TOLERANCE) is the kick's;
 * when none does, the nearest of those whose weapon is on the point (within
 * KickForm.RESIDUAL) is, and only when no weapon is on the point the one
 * whose fitted leg comes nearest, which is the declared miss. Under each lean a
 * leg that falls short steps the support foot up along the line by what it
 * lacks, unless the step is given: first by the solve's gap, then by what the
 * fitted weapon still lacks toward the point, because the hip's range of motion
 * can leave the fitted leg shorter than the free solve promised. The step up
 * never brings the kicking hip nearer the point along the line than
 * KickForm.STEP_ROOM_SHARE of the thigh, where the knee would pass the
 * target. A leg jammed by a point closer than its flexion band's shortest reach
 * steps the support foot back by the difference instead, so the weapon it
 * declared lands, not the knee; a step back is no longer than the longest
 * backward step measured (KickForm.STEP_BACK_SHARE). A fitted weapon
 * that the hip's range of motion leaves beyond the point (a high point too near
 * for the thigh to rise to) steps the support foot back by the excess in the
 * same rounds, and so does a fitted knee folded past the band (a `jammed` fit),
 * by what its ankle lacks of the band's reach; only a fit inside the band lands
 * exactly, and one inside it ranks before a jammed one.
 */
export namespace KickContact {
  /*
   * The body leans a kick tries, in order: the preferred lean first, then, for
   * a round kick, every lean from `LEAN_LEAST` to `LEAN_MOST` by `LEAN_STEP`,
   * and for a push kick upright.
   * Parameter technique: The kick.
   * Parameter prefer: The lean the last contact used, if any.
   * Returns: The leans, degrees.
   */
  export function leans(
    technique: KickChain.IProps["technique"],
    prefer: number | undefined,
  ): number[] {
    const leans: number[] = prefer === undefined ? [] : [prefer];
    if (technique === "round")
      for (
        let lean: number = KickForm.LEAN_LEAST;
        lean <= KickForm.LEAN_MOST;
        lean += KickForm.LEAN_STEP
      ) {
        if (lean !== prefer) leans.push(lean);
      }
    else if (prefer !== 0) leans.push(0);
    return leans;
  }

  /*
   * The step's settling tolerance, metres: the limb solver's place tolerance
   * (`HumanArmTrajectoryTerms.TOLERANCE`, a millimetre).
   */
  export const TOLERANCE: number = HumanArmTrajectoryTerms.TOLERANCE / 1000;

  /*
   * A carriage with the leg fitted under it.
   */
  export interface IContact {
    /*
     * The carriage.
     */
    carriage: IAutoMovieMotionHumanKickGeometry.ICarriage;

    /*
     * The body's posture at the contact under the carriage.
     */
    base: IAutoMovieMotionHumanPosture;

    /*
     * The fitted leg.
     */
    fit: KickChain.IFit;
  }

  /*
   * Choose a kick's carriage and fit its leg.
   * Parameter props: The body's carriage inputs.
   * Parameter chain: The kick's body, side, technique, line, travel and planned
   * point.
   * Parameter set: The carriage's turn and tip, which the contact does not choose,
   * and the pelvis drive a decided step goes with (none when absent).
   * Parameter step: The support foot's step-up when it is already decided, metres;
   * undefined lets a short leg step up.
   * Parameter prefer: A lean tried before the others, degrees: the lean of the plan
   * this one corrects, so a small correction keeps its carriage.
   * Returns: The contact.
   * A `reach` refusal when the support step's search
   * travels the whole ground from a backward step to the forward room without
   * settling within `TOLERANCE`.
   */
  export function choose(
    props: KickCarriage.IProps,
    chain: KickChain.IProps,
    set: Pick<IAutoMovieMotionHumanKickGeometry.ICarriage, ChooseSet> &
      IChooseSet,
    step: number | undefined,
    prefer?: number,
  ): IContact {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(props.body);
    const rom = (): ReturnType<typeof prepareHumanPostureProjection> =>
      projection;
    const fitLeg: ReturnType<typeof KickChain.prepareFit> =
      KickChain.prepareFit(chain, projection);
    const leans: number[] = KickContact.leans(chain.technique, prefer);
    const m: IAutoMovieMotionHumanBody["measure"] = props.body.measure;
    const limit: number =
      KickForm.STEP_SHARE * StrikingStance.length(props.body);
    const back: number = KickForm.STEP_BACK_SHARE * m.stature;
    const under: (
      carriage: IAutoMovieMotionHumanKickGeometry.ICarriage,
      source?: ISource,
    ) => ITrial = (
      carriage: IAutoMovieMotionHumanKickGeometry.ICarriage,
      source?: ISource,
    ): ITrial => {
      const base: IAutoMovieMotionHumanPosture =
        source?.base ??
        KickCarriage.posture(
          props,
          carriage,
          props.timing.impact,
          undefined,
          resolution,
          rom(),
        );
      const hip: IAutoMovieVector3 =
        source?.hip ??
        KickCarriage.hip(props.body, base, props.side, resolution, rom());
      return {
        hip,
        contact: {
          carriage,
          base,
          fit: fitLeg(
            base,
            source?.solved ?? KickChain.solve(chain, base, hip),
            hip,
            resolution,
          ),
        },
      };
    };
    let best: IContact | undefined;
    let least: number = Number.POSITIVE_INFINITY;
    let landed: boolean = false;
    let kept: boolean = false;
    for (const lean of leans) {
      let carriage: IAutoMovieMotionHumanKickGeometry.ICarriage = {
        turn: set.turn,
        pitch: set.pitch,
        lean,
        step: step ?? 0,
        drive: set.drive ?? 0,
      };
      let forward: number = limit;
      let source: ISource | undefined;
      if (step === undefined) {
        const base: IAutoMovieMotionHumanPosture = KickCarriage.posture(
          props,
          carriage,
          props.timing.impact,
          undefined,
          resolution,
          rom(),
        );
        const hip: IAutoMovieVector3 = KickCarriage.hip(
          props.body,
          base,
          props.side,
          resolution,
          rom(),
        );
        const solved: IAutoMovieMotionHumanStrikingReach.ISolution =
          KickChain.solve(chain, base, hip);
        source = { base, hip, solved };
        const reach: IAutoMovieVector3 = Vector3.subtract(solved.point, hip);
        const span: number = Vector3.length(reach);
        const ahead: number = Vector3.dot(reach, props.line) / span;
        forward = Math.max(
          0,
          Math.min(
            limit,
            Vector3.dot(Vector3.subtract(chain.planned, hip), props.line) -
              KickForm.STEP_ROOM_SHARE * m.thigh,
          ),
        );
        if (solved.status === "short") {
          // A push kick that falls short drives its pelvis along the line
          // behind the foot by what the leg lacks, as the teep is coached
          // (the hips thrust into the target), and only what the drive
          // leaves is stepped up; a round kick steps. The drive is no
          // longer than the step may be and keeps the same room before
          // the point.
          const drive: number =
            chain.technique === "push" ? Math.min(forward, solved.gap) : 0;
          carriage = {
            ...carriage,
            drive,
            step: Math.min(forward - drive, solved.gap - drive),
          };
        } else if (solved.status === "jammed" && ahead > 1e-3)
          // The hip stands `span + gap` from the point, inside the band's
          // shortest reach by the difference, which the step back takes up
          // along the line.
          carriage = {
            ...carriage,
            step: -Math.min(
              back,
              Math.max(
                0,
                StrikingReach.reach(
                  m.thigh,
                  chain.technique === "round"
                    ? KickForm.SHIN_SHARE * m.shank
                    : m.shank,
                  KickForm.FLEXION[chain.technique][1],
                ) -
                  (span + solved.gap),
              ) / ahead,
            ),
          };
      }
      // The step is the fixed point of what the fitted weapon still lacks:
      // each pass steps the support foot by that lack (and a jammed knee's
      // shortfall), until the step moves by no more than the limb solver's
      // place tolerance. A jammed fit keeps stepping, since its first move
      // need not be its largest; the search is bounded by the ground the
      // support foot can cover, from the backward step's length to the
      // forward room, and a search that has travelled all of it unsettled is
      // refused.
      let travelled: number = 0;
      for (let first: boolean = true; ; first = false) {
        const { contact: candidate, hip }: ITrial = under(
          carriage,
          first && Object.is(carriage.step, 0) && carriage.drive === 0
            ? source
            : undefined,
        );
        const fit: KickChain.IFit = candidate.fit;
        if (
          fit.status === "reached" &&
          fit.slip <= KickForm.TOLERANCE &&
          fit.residual <= KickForm.TOLERANCE
        )
          return candidate;

        // No candidate was exact so far: one whose weapon is on the point
        // (not `short`) comes before any that misses it, one whose knee keeps
        // its band before one jammed past it, and among equals the nearer fit
        // does. Ranking by the cost alone let a miss with a clean plant
        // displace a landed leg whose support ball slipped a few
        // millimetres, and the kick then recorded a miss it had not made.
        const cost: number = fit.slip + fit.residual;
        const lands: boolean = fit.status !== "short";
        const clean: boolean = fit.status === "reached";
        if (
          best === undefined ||
          (lands && !landed) ||
          (lands === landed && clean && !kept) ||
          (lands === landed && clean === kept && cost < least)
        ) {
          least = cost;
          landed = lands;
          kept = clean;
          best = candidate;
        }

        // What the fitted weapon still lacks toward the point, taken up by
        // the support foot along the line: a step of `d` shortens the hip's
        // distance to the point by `d` times the line's share of that
        // direction. The lack is signed: a weapon the hip's range leaves
        // beyond the point steps the support foot back by the excess.
        if (step !== undefined) break;
        const toward: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(chain.planned, hip),
        );
        const ahead: number = Vector3.dot(toward, props.line);
        const lack: number = Vector3.dot(
          Vector3.subtract(chain.planned, fit.reached),
          toward,
        );

        // A fitted knee jammed past its band stands the ankle nearer the hip
        // than the band's most flexion leaves it: the support foot steps back
        // by that difference, as the solve's own jam does before the rounds.
        const jam: number =
          fit.status === "jammed"
            ? Math.max(
                0,
                StrikingReach.reach(
                  m.thigh,
                  m.shank,
                  KickForm.FLEXION[chain.technique][1],
                ) - Vector3.distance(hip, fit.ankle),
              )
            : 0;
        if (!(ahead > 1e-3)) break;
        const next: number = Math.max(
          -back,
          Math.min(
            forward - carriage.drive,
            carriage.step + (lack - jam) / ahead,
          ),
        );
        const change: number = Math.abs(next - carriage.step);
        if (change <= TOLERANCE) break;
        travelled += change;
        if (travelled > back + forward)
          throw new AutoMovieMotionHumanRefusal({
            kind: "reach",
            axis: "target",
            value: `${(Vector3.distance(hip, chain.planned) * 1000).toFixed(0)} mm`,
            feasible: {
              kind: "alternatives",
              values: ["a target the support foot's step settles on"],
            },
            reason: `the kick's support step does not settle: it has moved ${(travelled * 1000).toFixed(0)} mm, the whole ground from a backward step to the forward room, and still moves ${(change * 1000).toFixed(1)} mm a pass`,
            fix: "aim the kick at a target nearer the kicking leg's reach, or stand nearer or farther from it",
          });
        carriage = { ...carriage, step: next };
      }
    }
    return best!;
  }

  /*
   * One candidate and the unchanged hip shared by its solve, refits and step
   * correction.
   */
  interface ITrial {
    /*
     * The candidate whose fitted weapon is measured.
     */
    contact: IContact;

    /*
     * Its kicking hip on the candidate's exact body/base, world metres.
     */
    hip: IAutoMovieVector3;
  }

  /*
   * The already-computed zero-step source, used only if that first trial keeps
   * exactly positive zero step.
   */
  interface ISource {
    /*
     * The exact same carriage's posture before the leg is fitted.
     */
    base: IAutoMovieMotionHumanPosture;

    /*
     * Its kicking hip, world metres.
     */
    hip: IAutoMovieVector3;

    /*
     * The actual reach solve already made on that base.
     */
    solved: IAutoMovieMotionHumanStrikingReach.ISolution;
  }
}

/*
 * The record of `IChooseSet`'s site.
 */
type IChooseSet = {
  drive?: number;
};

/*
 * The alternatives of `ChooseSet`'s site.
 */
type ChooseSet = "turn" | "pitch";
