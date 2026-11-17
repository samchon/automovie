import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import type { IKickGeometry } from "./IKickGeometry";
import { KickCarriage } from "./KickCarriage";
import { KickChain } from "./KickChain";
import { KickForm } from "./KickForm";
import { StrikingReach } from "./StrikingReach";
import { StrikingStance } from "./StrikingStance";

/**
 * A kick's contact, decided on the figure itself: the carriage
 * ({@link KickCarriage}) under which the leg, solved from the hip the
 * carriage leaves it and fitted by the engine's limb fit ({@link KickChain}),
 * lands its weapon on the planned point with the support foot on its plant.
 *
 * The leans are tried from the least upward and the first that lands exactly
 * (weapon and support ball within {@link KickForm.TOLERANCE}) is the kick's;
 * when none does, the nearest of those whose weapon is on the point (within
 * {@link KickForm.RESIDUAL}) is, and only when no weapon is on the point the
 * one whose fitted leg comes nearest, which is the declared miss. Under each lean a leg that falls short steps the support
 * foot up along the line by what it lacks, unless the step is given: first by
 * the solve's gap, then by what the fitted weapon still lacks toward the
 * point, because the hip's range of motion can leave the fitted leg shorter
 * than the free solve promised. The step up never brings the kicking hip
 * nearer the point along the line than {@link KickForm.STEP_ROOM_SHARE} of
 * the thigh, where the knee would pass the target. A leg jammed by a point
 * closer than its flexion band's shortest reach steps the support foot back
 * by the difference instead, so the weapon it declared lands, not the knee;
 * a step back is no longer than the longest backward step measured
 * ({@link KickForm.STEP_BACK_SHARE}).
 * A fitted weapon that the hip's range of motion leaves beyond the point (a
 * high point too near for the thigh to rise to) steps the support foot back
 * by the excess in the same rounds.
 */
export namespace KickContact {
  /** A carriage with the leg fitted under it. */
  export interface IContact {
    /** The carriage. */
    carriage: IKickGeometry.ICarriage;

    /** The body's posture at the contact under the carriage. */
    base: IHumanPosture;

    /** The fitted leg. */
    fit: KickChain.IFit;
  }

  /**
   * Choose a kick's carriage and fit its leg.
   *
   * @param props The body's carriage inputs.
   * @param chain The kick's body, side, technique, line, travel and planned point.
   * @param set The carriage's turn and tip, which the contact does not choose.
   * @param step The support foot's step-up when it is already decided, metres; undefined lets a short leg step up.
   * @param prefer A lean tried before the others, degrees: the lean of the plan this one corrects, so a small correction keeps its carriage.
   * @returns The contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States canonical carriage/chain inputs, optional fixed step and preferred lean, and the physically fitted winning contact.
   * @evidence contracts/development/implementation.md#principled-implementation Keeps the original ordered lean search, solved step correction, repeated full physical leg fits, first valid contact and strict best residual selection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The local candidate builder shares only its same-base hip and fixed rig metadata; the outer lean/step loops still own every numerical trial and stopping condition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every original lean, step bound, fit round, plant, ROM clamp, arm/rival fallback and miss remains. The positive-zero initial trial reuses only its actually computed identical base/hip/solve.
   * @evidence contracts/development/implementation.md#efficient-algorithms The original bounded lean/step/refit search remains; one lazy prepared chain shares genuine ROM, endpoint demand, bend, extension bound and push rotation metadata across all actual trials, with no measured speedup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The synchronous search keeps one canonical body and rig unchanged. Only its issued ROM metadata and exact FK prerequisites are borrowed; changed carriage/goal candidates always run their full physical fits.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources FK workspaces, the lazy fixed-chain producer and its ROM projector end on this call's return or throw; that same scoped mapper serves each existing carriage-tilt/hip clamp, without changing raw lowering. The returned contact contains only its original carriage, posture and fitted numerical observations; no helper, projector or new history escapes.
   */
  export function choose(
    props: KickCarriage.IProps,
    chain: KickChain.IProps,
    set: Pick<IKickGeometry.ICarriage, "turn" | "pitch">,
    step: number | undefined,
    prefer?: number,
  ): IContact {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    let projection: ReturnType<typeof prepareHumanPostureProjection> | undefined;
    const rom: () => ReturnType<typeof prepareHumanPostureProjection> = (): ReturnType<typeof prepareHumanPostureProjection> =>
      (projection ??= prepareHumanPostureProjection(props.body));
    let fitLeg: ReturnType<typeof KickChain.prepareFit> | undefined;
    const leans: number[] = prefer === undefined ? [] : [prefer];
    if (chain.technique === "round")
      for (
        let lean: number = KickForm.LEAN_LEAST;
        lean <= KickForm.LEAN_MOST;
        lean += KickForm.LEAN_STEP
      ) {
        if (lean !== prefer) leans.push(lean);
      }
    else if (prefer !== 0) leans.push(0);
    const m: IHumanBody["measure"] = props.body.measure;
    const limit: number =
      KickForm.STEP_SHARE * StrikingStance.length(props.body);
    const back: number = KickForm.STEP_BACK_SHARE * m.stature;
    const under: (carriage: IKickGeometry.ICarriage, source?: ISource) => ITrial = (carriage: IKickGeometry.ICarriage, source?: ISource): ITrial => {
      const base: IHumanPosture = source?.base ?? KickCarriage.posture(
        props,
        carriage,
        props.timing.impact,
        undefined, resolution, rom(),
      );
      const hip: IAutoMovieVector3 = source?.hip ?? KickCarriage.hip(
        props.body,
        base,
        props.side,
        resolution, rom(),
      );
      return {
        hip,
        contact: {
          carriage,
          base,
          fit: (fitLeg ??= KickChain.prepareFit(chain, rom()))(base, source?.solved ?? KickChain.solve(chain, base, hip), hip, resolution),
        },
      };
    };
    let best: IContact | undefined;
    let least: number = Number.POSITIVE_INFINITY;
    let landed: boolean = false;
    for (const lean of leans) {
      let carriage: IKickGeometry.ICarriage = { ...set, lean, step: step ?? 0 };
      let forward: number = limit;
      let source: ISource | undefined;
      if (step === undefined) {
        const base: IHumanPosture = KickCarriage.posture(
          props,
          carriage,
          props.timing.impact,
          undefined, resolution, rom(),
        );
        const hip: IAutoMovieVector3 = KickCarriage.hip(
          props.body,
          base,
          props.side,
          resolution, rom(),
        );
        const solved: StrikingReach.ISolution = KickChain.solve(chain, base, hip);
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
        if (solved.status === "short")
          carriage = { ...carriage, step: Math.min(forward, solved.gap) };
        else if (solved.status === "jammed" && ahead > 1e-3)
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
      for (let round: number = 0; round < KickForm.STEP_ROUNDS; round++) {
        const { contact: candidate, hip }: ITrial = under(
          carriage,
          round === 0 && Object.is(carriage.step, 0) ? source : undefined,
        );
        const fit: KickChain.IFit = candidate.fit;
        if (
          fit.status !== "short" &&
          fit.slip <= KickForm.TOLERANCE &&
          fit.residual <= KickForm.TOLERANCE
        )
          return candidate;

        // No candidate was exact so far: one whose weapon is on the point
        // (not `short`) comes before any that misses it, and among equals the
        // nearer fit does. Ranking by the cost alone let a miss with a clean
        // plant displace a landed leg whose support ball slipped a few
        // millimetres, and the kick then recorded a miss it had not made.
        const cost: number = fit.slip + fit.residual;
        const lands: boolean = fit.status !== "short";
        if (
          best === undefined ||
          (lands && !landed) ||
          (lands === landed && cost < least)
        ) {
          least = cost;
          landed = lands;
          best = candidate;
        }

        // What the fitted weapon still lacks toward the point, taken up by
        // the support foot along the line: a step of `d` shortens the hip's
        // distance to the point by `d` times the line's share of that
        // direction. The lack is signed: a weapon the hip's range leaves
        // beyond the point steps the support foot back by the excess.
        if (step !== undefined) break;
        const toward: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(
            chain.planned,
            hip,
          ),
        );
        const ahead: number = Vector3.dot(toward, props.line);
        const lack: number = Vector3.dot(
          Vector3.subtract(chain.planned, fit.reached),
          toward,
        );
        if (!(ahead > 1e-3)) break;
        const next: number = Math.max(
          -back,
          Math.min(forward, carriage.step + lack / ahead),
        );
        if (Math.abs(next - carriage.step) < 1e-6) break;
        carriage = { ...carriage, step: next };
      }
    }
    return best!;
  }

  /** One candidate and the unchanged hip shared by its solve, refits and step correction. */
  interface ITrial {
    /** The candidate whose fitted weapon is measured. */
    contact: IContact;

    /** Its kicking hip on the candidate's exact body/base, world metres. */
    hip: IAutoMovieVector3;
  }

  /** The already-computed zero-step source, used only if that first trial keeps exactly positive zero step. */
  interface ISource {
    /** The exact same carriage's posture before the leg is fitted. */
    base: IHumanPosture;

    /** Its kicking hip, world metres. */
    hip: IAutoMovieVector3;

    /** The actual reach solve already made on that base. */
    solved: StrikingReach.ISolution;
  }
}
