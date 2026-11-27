// Closed forms ported from IHMC Open Robotics Software (Apache-2.0),
// 201903_Stable: ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/capturePoint/CapturePointTools.java
// computeDesiredCapturePointPosition, and capturePoint/
// CoMIntegrationTools.java integrateCoMPositionWithConstantCMP l.136-170 and
// integrateCoMPositionOverPolynomial l.355-370.
import type { AutoMovieEnginePhysicalBalanceTypes } from "../AutoMovieEnginePhysicalBalanceTypes";

import { AutoMovieEnginePhysicalDisturbanceBranches as Branches } from "../AutoMovieEnginePhysicalDisturbanceBranches";
import { AutoMovieEnginePhysicalDisturbanceFollow } from "../AutoMovieEnginePhysicalDisturbanceFollow";
import { AutoMovieEnginePhysicalDisturbanceForm } from "../AutoMovieEnginePhysicalDisturbanceForm";
import { AutoMovieEnginePhysicalDisturbanceResponse as Response } from "../AutoMovieEnginePhysicalDisturbanceResponse";
import type { AutoMovieEnginePhysicalIcpPlannerTools as Tools } from "../AutoMovieEnginePhysicalIcpPlannerTools";

/** A planted foot. */
type Foot = AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanFoot;

/** One closed-form piece of the response. */
type IPiece = AutoMovieEnginePhysicalDisturbanceForm.IPiece;

/** One swing foot's cubic. */
type ISwing = AutoMovieEnginePhysicalDisturbanceFollow.ISwing;

/** The response's following and sampling. */
const { follow, span, swingAt }: typeof AutoMovieEnginePhysicalDisturbanceFollow =
  AutoMovieEnginePhysicalDisturbanceFollow;

/** A planted limb's outline. */
const { outline }: typeof AutoMovieEnginePhysicalDisturbanceForm = AutoMovieEnginePhysicalDisturbanceForm;

/**
 * A biped's response to a stated disturbance, prepared once for the span: IHMC
 * 201903's push recovery and capture-point plans laid from the state just after
 * the first push, every moving span a closed-form curve between the few branch
 * points where the response changes, and `sample(t)` a pure evaluation at any
 * time in any order.
 *
 * Branch points, and what each does as the reference's states do:
 *
 * - A push: the centre of mass's velocity jumps by the push's impulse over the
 *   mass, the capture point by that over omega. In double support the push
 *   recovery's fall test runs (`AutoMovieEnginePhysicalPushRecovery.doubleSupport`), and a
 *   fall triggers a step the policy's reaction time after the capture point
 *   left the support; in single support the footstep is checked again against
 *   the capture region with the swing time left and, when it moves, the plan is
 *   made again from then (`WalkingSingleSupportState` l.136-163) and the swing
 *   foot's cubic re-aimed from where it is.
 * - The trigger: the footstep in the support foot's one-step capture region
 *   (`AutoMovieEnginePhysicalPushRecovery.checkAndUpdate`) and the single-support plan to it
 *   (`AutoMovieEnginePhysicalIcpPlanner.singleSupport`).
 * - The touchdown, the swing time after the trigger (`ZULU.swingTime`): the
 *   transfer to standing (`AutoMovieEnginePhysicalIcpPlanner.toStanding`), done once its
 *   duration has run and the capture point is within `maxErrorToStanding` of
 *   its hold (`TransferToStandingState.isDone`), found in closed form from the
 *   error's decay.
 * - A fall: no capturable footstep, the one-step capture region empty at the
 *   trigger or after a push in single support, ends the response there; the
 *   body is handed back to the physics, which takes the fall's contacts.
 * - Standing: the cubic to the authored capture point
 *   (`AutoMovieEnginePhysicalIcpPlanner.standing`), and at its end the authored capture point
 *   at rest.
 *
 * Between them each plan's capture point xi_d is a chain of closed forms read
 * off the built plan on fixed soles: an exponential from a constant pivot, q +
 * r e^(omega t), or a cubic, a0 + a1 t + a2 t^2 + a3 t^3. The ICP controller
 * acts on the error e = xi - xi_d (`AutoMovieEnginePhysicalIcpController`, Zulu's gains):
 *
 * - Its proportional law, the pivot xi_d - xi_d' / omega + (1 + K_p) e, gives
 *   e(t) = e0 e^(-omega K_p t) along and across the plan's motion, split at
 *   each piece's start, a plan at rest taking the across gain both ways.
 * - Its centre-of-pressure constraint: while that pivot lies outside the support,
 *   the program holds it on the support, the projection of the unconstrained
 *   one taken as the piece starts, and xi(t) = cmp + (xi0 - cmp) e^(omega t)
 *   (`CapturePointTools.computeDesiredCapturePointPosition`) until the
 *   unconstrained pivot comes back inside, found in closed form where xi_d has
 *   a constant pivot, its path then a line; over a cubic it is held to the
 *   cubic's end.
 *
 * The centre of mass follows c' = omega (xi - c) in closed form on each piece:
 * a constant pivot's response (`CoMIntegrationTools
 * .integrateCoMPositionWithConstantCMP`), a cubic's
 * (`integrateCoMPositionOverPolynomial`), and an error term b e^(-lambda t)'s,
 * b omega / (omega - lambda) e^(-lambda t), with the homogeneous e^(-omega t)
 * term carrying the piece's initial value. The ground's reaction is the
 * pendulum's: m omega^2 (c - cmp) across the floor and the weight up, at the
 * pivot, shared between two planted feet by the pivot's place along the line
 * between them.
 *
 * A swing foot follows the planner's velocity-constrained cubic to its footstep
 * at rest (`AutoMovieEnginePhysicalIcpPlannerTools.cubic`), on the floor as the recovery
 * step's clearance is zero.
 *
 * Points are world floor points (x, z), metres; times local seconds.
 *
 * @param input The state just after the first push and the pushes after it.
 * @returns The prepared span.
 * @see https://github.com/ihmcrobotics/ihmc-open-robotics-software/blob/201903_Stable/ihmc-common-walking-control-modules/src/main/java/us/ihmc/commonWalkingControlModules/capturePoint/CapturePointTools.java
 * @see https://github.com/ihmcrobotics/ihmc-open-robotics-software/blob/201903_Stable/ihmc-common-walking-control-modules/src/main/java/us/ihmc/commonWalkingControlModules/capturePoint/CoMIntegrationTools.java
 */
export function preparePhysicalDisturbanceSpan(
  input: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanInput,
): AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult {
  const scope: Response.IResponse = Response.create(input);
  const { omega, t0, pieces, branches, tolerance, across, swings, contacts } =
    scope;

  Response.test(scope);
  for (let guard: number = 0; guard < 256; ++guard) {
    const push: number = scope.pushes[0]?.seconds ?? Number.POSITIVE_INFINITY;
    const event: number =
      scope.mode === "single"
        ? scope.step!.touchdown
        : scope.trigger !== undefined
          ? scope.trigger.at
          : scope.hold !== undefined
            ? scope.hold.done
            : (scope.standingEnd ?? Number.POSITIVE_INFINITY);
    const next: number = Math.min(push, event);
    scope.state = follow(pieces, {
      phase: scope.mode,
      reference: scope.reference,
      support: Response.supportOf(Response.planted(scope)),
      start: scope.t,
      end: next,
      xi: scope.state.xi,
      c: scope.state.c,
      omega,
    });
    if (next === Infinity) break;
    scope.t = next;

    // A push, the trigger, the touchdown, the transfer to standing's exit
    // and the standing cubic's end, in that order at one instant.
    if (push <= event) {
      if (Branches.push(scope)) break;
      continue;
    }
    if (
      scope.mode !== "single" &&
      scope.trigger !== undefined &&
      scope.t >= scope.trigger.at
    ) {
      if (Branches.trigger(scope)) break;
      continue;
    }
    if (scope.mode === "single") {
      Branches.touchdown(scope);
      continue;
    }
    if (scope.hold !== undefined) {
      Branches.exit(scope);
      continue;
    }
    Branches.end(scope);
  }
  const { t, mode, state, footstep, fallen } = scope;

  // The response's settling: the last piece's error within the tolerance of
  // its plan, from its decay.
  // A response that falls at its first push has no moving span: it holds
  // the state just after the push.
  if (pieces.length === 0)
    pieces.push({
      start: t0,
      end: Number.POSITIVE_INFINITY,
      phase: mode,
      saturated: false,
      form: { kind: "exp", start: t0, q: state.xi, r: { x: 0, z: 0 } },
      errors: [],
      c0: state.c,
    });
  const last: IPiece = pieces[pieces.length - 1]!;
  const residual: number = last.errors.reduce(
    (sum: number, error): number => sum + Math.hypot(error.b.x, error.b.z),
    0,
  );
  const settled: number =
    fallen ??
    Math.max(
      t,
      residual > tolerance
        ? last.start + Math.log(residual / tolerance) / (omega * across)
        : last.start,
    );
  if (
    fallen === undefined &&
    !branches.some((branch): boolean => branch.kind === "end")
  )
    branches.push({ kind: "end", seconds: settled });
  return span({
    pieces,
    branches,
    footstep,
    input,
    until: settled,
    feet: (seconds: number): Record<string, Tools.IFloor> =>
      Object.fromEntries(
        input.feet.map((foot: Foot): [string, Tools.IFloor] => [
          foot.bone,
          swings.some(
            (swing: ISwing): boolean =>
              swing.bone === foot.bone && swing.start < seconds,
          )
            ? swingAt(swings, foot.bone, seconds).position
            : foot.frame.origin,
        ]),
      ),
    contacts: (seconds: number): string[] => {
      let bones: string[] = contacts[0]!.bones;
      for (const contact of contacts)
        if (contact.start <= seconds) bones = contact.bones;
      return bones;
    },
    // A planted limb's outline where its endpoint stands, the weight being
    // split over the support the pivot is held on.
    outline: (bone: string, at: Tools.IFloor): Tools.IFloor[] => {
      const foot: Foot = input.feet.find(
        (f: Foot): boolean => f.bone === bone,
      )!;
      return outline({ ...foot, frame: { ...foot.frame, origin: at } });
    },
  });
}
