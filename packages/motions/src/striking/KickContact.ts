import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
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
 * The leans are tried from the least upward and the first that lands is the
 * kick's; when none does, the one whose fitted leg comes nearest is, which is
 * the declared miss. Under each lean a leg that falls short steps the support
 * foot up along the line by what it lacks, unless the step is given: first by
 * the solve's gap, then by what the fitted weapon still lacks toward the
 * point, because the hip's range of motion can leave the fitted leg shorter
 * than the free solve promised. The step up never brings the kicking hip
 * nearer the point along the line than {@link KickForm.STEP_ROOM_SHARE} of
 * the thigh, where the knee would pass the target. A leg jammed by a point
 * closer than its flexion band's shortest reach steps the support foot back
 * by the difference instead, so the weapon it declared lands, not the knee.
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
   */
  export function choose(
    props: KickCarriage.IProps,
    chain: KickChain.IProps,
    set: Pick<IKickGeometry.ICarriage, "turn" | "pitch">,
    step: number | undefined,
    prefer?: number,
  ): IContact {
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
    const under = (carriage: IKickGeometry.ICarriage): IContact => {
      const base: IHumanPosture = KickCarriage.posture(
        props,
        carriage,
        props.timing.impact,
      );
      return { carriage, base, fit: fitted(chain, base) };
    };
    let best: IContact | undefined;
    let least: number = Number.POSITIVE_INFINITY;
    for (const lean of leans) {
      let carriage: IKickGeometry.ICarriage = { ...set, lean, step: step ?? 0 };
      let forward: number = limit;
      if (step === undefined) {
        const base: IHumanPosture = KickCarriage.posture(
          props,
          carriage,
          props.timing.impact,
        );
        const hip: IAutoMovieVector3 = KickCarriage.hip(
          props.body,
          base,
          props.side,
        );
        const solved: StrikingReach.ISolution = KickChain.solve(chain, base);
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
              limit,
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
        const candidate: IContact = under(carriage);
        const fit: KickChain.IFit = candidate.fit;
        if (
          fit.status !== "short" &&
          fit.slip <= KickForm.TOLERANCE &&
          fit.residual <= KickForm.TOLERANCE
        )
          return candidate;
        const cost: number = fit.slip + fit.residual;
        if (cost < least) {
          least = cost;
          best = candidate;
        }

        // What the fitted weapon still lacks toward the point, taken up by
        // the support foot along the line: a step of `d` shortens the hip's
        // distance to the point by `d` times the line's share of that
        // direction.
        if (step !== undefined || carriage.step >= forward) break;
        const toward: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(
            chain.planned,
            KickCarriage.hip(props.body, candidate.base, props.side),
          ),
        );
        const ahead: number = Vector3.dot(toward, props.line);
        const lack: number = Vector3.dot(
          Vector3.subtract(chain.planned, fit.reached),
          toward,
        );
        if (!(lack > 0 && ahead > 1e-3)) break;
        carriage = {
          ...carriage,
          step: Math.min(forward, carriage.step + lack / ahead),
        };
      }
    }
    return best!;
  }

  /** Solve the leg from the hip a posture leaves it and fit it. */
  function fitted(chain: KickChain.IProps, base: IHumanPosture): KickChain.IFit {
    return KickChain.fit(chain, base, KickChain.solve(chain, base));
  }
}
