// Closed forms ported from IHMC Open Robotics Software (Apache-2.0),
// 201903_Stable: ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/capturePoint/CapturePointTools.java
// computeDesiredCapturePointPosition, and capturePoint/
// CoMIntegrationTools.java integrateCoMPositionWithConstantCMP l.136-170 and
// integrateCoMPositionOverPolynomial l.355-370. See NOTICE.
import type { IAutoMovieVector3 } from "@automovie/interface";

import { physicalFootstepAdjustor } from "./physicalFootstepAdjustor";
import { physicalIcpController } from "./physicalIcpController";
import { physicalIcpPlanner } from "./physicalIcpPlanner";
import { physicalIcpPlannerCmps as Cmps } from "./physicalIcpPlannerCmps";
import { physicalIcpPlannerTools as Tools } from "./physicalIcpPlannerTools";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";
import { physicalPushRecovery as Recovery } from "./physicalPushRecovery";
import { physicalSupportSpanContacts as Contacts } from "./physicalSupportSpanContacts";

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
 *   recovery's fall test runs (`physicalPushRecovery.doubleSupport`), and a
 *   fall triggers a step the policy's reaction time after the capture point
 *   left the support; in single support the footstep is checked again against
 *   the capture region with the swing time left and, when it moves, the plan is
 *   made again from then (`WalkingSingleSupportState` l.136-163) and the swing
 *   foot's cubic re-aimed from where it is.
 * - The trigger: the footstep in the support foot's one-step capture region
 *   (`physicalPushRecovery.checkAndUpdate`) and the single-support plan to it
 *   (`physicalIcpPlanner.singleSupport`).
 * - The touchdown, the swing time after the trigger (`ZULU.swingTime`): the
 *   transfer to standing (`physicalIcpPlanner.toStanding`), done once its
 *   duration has run and the capture point is within `maxErrorToStanding` of
 *   its hold (`TransferToStandingState.isDone`), found in closed form from the
 *   error's decay.
 * - A fall: no capturable footstep, the one-step capture region empty at the
 *   trigger or after a push in single support, ends the response there; the
 *   body is handed back to the physics, which takes the fall's contacts.
 * - Standing: the cubic to the authored capture point
 *   (`physicalIcpPlanner.standing`), and at its end the authored capture point
 *   at rest.
 *
 * Between them each plan's capture point xi_d is a chain of closed forms read
 * off the built plan on fixed soles: an exponential from a constant pivot, q +
 * r e^(omega t), or a cubic, a0 + a1 t + a2 t^2 + a3 t^3. The ICP controller
 * acts on the error e = xi - xi_d (`physicalIcpController`, Zulu's gains):
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
 * at rest (`physicalIcpPlannerTools.cubic`), on the floor as the recovery
 * step's clearance is zero.
 *
 * Points are world floor points (x, z), metres; times local seconds.
 *
 * @param input The state just after the first push and the pushes after it.
 * @returns The prepared span.
 */
export function preparePhysicalDisturbanceSpan(
  input: preparePhysicalDisturbanceSpan.IInput,
): preparePhysicalDisturbanceSpan.ISpan {
  const { omega } = input;
  const t0: number = input.seconds;
  const authored: Tools.IState = {
    position: { ...input.authored.position },
    velocity: { ...input.authored.velocity },
  };
  const pieces: IPiece[] = [];
  const branches: preparePhysicalDisturbanceSpan.IBranch[] = [
    { kind: "push", seconds: t0 },
  ];
  const pushes: preparePhysicalDisturbanceSpan.IPush[] = [
    ...(input.pushes ?? []),
  ]
    .filter((push): boolean => push.seconds > t0)
    .sort((a, b): number => a.seconds - b.seconds);
  const reaction: number = Math.max(0, input.reactionSeconds ?? 0);
  const tolerance: number = physicalIcpPlanner.DEFAULTS.maxErrorToStanding;
  const across: number = physicalIcpController.ZULU.kpOrthogonal;

  // The feet: where each stands from when, each swing's cubic, and which
  // stand on the floor from when.
  const placed: Map<string, Foot> = new Map(
    input.feet.map((foot: Foot): [string, Foot] => [foot.bone, foot]),
  );
  const swings: ISwing[] = [];
  const contacts: { start: number; bones: string[] }[] = [
    { start: t0, bones: input.feet.map((foot: Foot): string => foot.bone) },
  ];
  const planted = (): Foot[] =>
    contacts[contacts.length - 1]!.bones.map(
      (bone: string): Foot => placed.get(bone)!,
    );
  const supportOf = (feet: readonly Foot[]): Polygon.IPoint[] =>
    Contacts.hull(feet.map(contact));

  // The stance while a limb swings, any number of planted limbs merged into
  // one support the planner reads as a foot: their outline's hull in a frame
  // at its centroid, facing as the swinging limb faces, on the side opposite
  // it (`physicalSupportSpanContacts.remaining`); a single limb is itself.
  const merge = (stance: readonly Foot[], swing: Foot): Foot => {
    if (stance.length === 1) return stance[0]!;
    const hull: Polygon.IPoint[] = supportOf(stance);
    const origin: Tools.IFloor = toWorld(Polygon.centroid(hull));
    const frame: Polygon.IFrame = { origin, forward: swing.frame.forward };
    const lateral: number = Polygon.local(frame, swing.frame.origin).y;
    return {
      bone: stance.map((foot: Foot): string => foot.bone).join("+"),
      side: lateral > 0 ? "right" : "left",
      frame,
      polygon: Polygon.hull(
        hull.map(
          (p: Polygon.IPoint): Polygon.IPoint =>
            Polygon.local(frame, toWorld(p)),
        ),
      ),
    };
  };

  // The swinging limb: of the planted limbs, from the farthest from the
  // capture point to the nearest, the last of equals first, as the push
  // recovery keeps the closest limb and swings the other
  // (`physicalPushRecovery.doubleSupport` l.169-182, PushRecoveryControlModule
  // l.169-182), the first whose sole can hold its own trial's capture point
  // at touchdown (`attempt`); else the first that can capture; else the
  // farthest.
  const choose = (feet: readonly Foot[]): string => {
    const ranked: { foot: Foot; distance: number }[] = feet
      .map((foot: Foot, index: number) => {
        const at: Tools.IFloor = toWorld(Polygon.centroid(supportOf([foot])));
        return {
          foot,
          index,
          distance: Math.hypot(state.xi.x - at.x, state.xi.z - at.z),
        };
      })
      .sort((a, b): number => b.distance - a.distance || b.index - a.index);
    const trials = ranked.map(({ foot }) => ({
      foot,
      ...attempt(
        feet.filter((other: Foot): boolean => other !== foot),
        foot,
      ),
    }));
    const chosen: (typeof trials)[number] | undefined =
      trials.find((trial): boolean => trial.holds) ??
      trials.find((trial): boolean => trial.capturable) ??
      trials[0];
    if (chosen === undefined) throw new Error("No planted limb to swing.");
    return chosen.foot.bone;
  };

  // One candidate's step laid once in closed form: its preferred swing time
  // and region (`computePreferredSwingTimeForRecovering` l.197-220), its
  // footstep projected into the region (`physicalFootstepAdjustor`), the
  // single-support response toward it, and whether its sole can hold the
  // response's capture point at touchdown within the region, the footstep
  // check the swing makes (`WalkingSingleSupportState` l.136-163).
  const attempt = (
    stance: readonly Foot[],
    swing: Foot,
  ): { holds: boolean; capturable: boolean } => {
    const time: number = preferred(stance, swing, ZULU.swingTime);
    if (!(time > 0)) return { holds: false, capturable: false };
    const duration: number = Math.max(
      ZULU.minimumSwingTime,
      Math.min(ZULU.swingTime, time),
    );
    const region: Polygon.IPoint[] = reachable(stance, swing, duration);
    if (region.length < 3) return { holds: false, capturable: true };
    const projected: physicalFootstepAdjustor.IResult =
      physicalFootstepAdjustor({
        position: toLocal(swing.frame.origin),
        outline: Polygon.hull(outline(swing).map(toLocal)),
        support: Polygon.centroid(supportOf(stance)),
        region,
      });
    const trial: IState = follow([], {
      phase: "single",
      reference: segmented(
        t,
        plan(
          merge(stance, swing),
          swing,
          toWorld(projected.position),
          duration,
        ),
      ),
      support: supportOf(stance),
      start: t,
      end: t + duration,
      xi: state.xi,
      c: state.c,
      omega,
    });
    const facing: Polygon.IFrame = {
      origin: { x: 0, z: 0 },
      forward: swing.frame.forward,
    };
    const holding: Polygon.IPoint[] = Polygon.hull(
      swing.polygon.map(
        (v: Polygon.IPoint): Polygon.IPoint =>
          toLocal(add(trial.xi, Polygon.world(facing, v), -1)),
      ),
    );
    return {
      holds: Polygon.intersect(region, holding).length >= 3,
      capturable: true,
    };
  };

  // The two sides a plan rides on: the stance, its planted limbs merged into
  // one support (`merge`), and the stepping limb, by their lateral order.
  let pair: { left: Foot; right: Foot } | undefined;
  const soles = (): physicalIcpPlanner.ISoles => ({
    left: pair!.left.frame,
    right: pair!.right.frame,
  });

  let state: IState = {
    xi: {
      x: input.center.x + input.velocity.x / omega,
      z: input.center.z + input.velocity.z / omega,
    },
    c: { x: input.center.x, z: input.center.z },
  };
  let t: number = t0;
  let mode: IPiece["phase"] = "double";
  let reference: IReference = constant(t0, authored.position);
  let outside: number | undefined;
  let recovery: Recovery.IState = Recovery.initial();
  let trigger: { at: number; swing: string } | undefined;
  let step:
    | {
        support: Foot;
        stance: Foot[];
        swing: Foot;
        target: Tools.IFloor;
        touchdown: number;
        plan: physicalIcpPlanner.ISinglePlan;
        viable: boolean;
      }
    | undefined;
  let hold:
    | { reference: IReference; done: number; checked: boolean }
    | undefined;
  let standingEnd: number | undefined;
  let footstep: preparePhysicalDisturbanceSpan.ISpan["footstep"];
  let fallen: number | undefined;

  // The standing target: the authored capture point while the feet stand as
  // authored; after a step, the reference's own, the final pivot between the
  // feet at rest, the right foot first (`physicalIcpPlannerCmps.between`
  // l.345-350, l.399-401), as the authored stance no longer says where the
  // body stands.
  const target = (): Tools.IState => {
    if (pair === undefined) return authored;
    return {
      position: Cmps.between(
        pair.right,
        pair.left,
        physicalIcpPlanner.DEFAULTS,
      ),
      velocity: { x: 0, z: 0 },
    };
  };

  // The push recovery's double-support fall test at a branch point.
  const test = (): void => {
    if (mode === "single") return;
    const feet: Foot[] = planted();
    const fall: { state: Recovery.IState; swing?: string } =
      Recovery.doubleSupport({
        state: recovery,
        capture: toLocal(state.xi),
        desired: toLocal(evaluate(reference, t, omega).position),
        support: supportOf(feet),
        feet: feet.map((foot: Foot) => ({
          bone: foot.bone,
          centroid: Polygon.centroid(supportOf([foot])),
        })),
        dt: ZULU.controlDt,
        period: ZULU.controlDt,
      });
    recovery = fall.state;
    if (fall.swing === undefined) {
      outside = undefined;
      trigger = undefined;
      return;
    }
    outside ??= t;
    trigger = { at: Math.max(t, outside + reaction), swing: choose(feet) };
  };

  // The region a swinging limb can step into with a swing time left: the
  // remaining support's one-step capture region cut by the discs it can
  // reach, the maximum endpoint travel about its lift-off place
  // (`IAutoMoviePhysicalBalance.maximumStep`) and, with its leg known, the
  // leg's reach about its hip carried by the centre of mass
  // (`physicalSupportSpanContacts.captureRegion`).
  const reachable = (
    stance: readonly Foot[],
    swing: Foot,
    remaining: number,
  ): Polygon.IPoint[] => {
    const reach: Contacts.IReach[] = [
      { center: toLocal(swing.frame.origin), radius: input.maximumStep },
    ];
    if (swing.leg && swing.leg.length > swing.leg.height)
      reach.push({
        center: toLocal(add(state.c, swing.leg.hip)),
        radius: Math.sqrt(
          swing.leg.length * swing.leg.length -
            swing.leg.height * swing.leg.height,
        ),
      });
    return Contacts.captureRegion({
      polygon: supportOf(stance),
      capture: toLocal(state.xi),
      omega,
      remaining,
      reach,
    });
  };

  // The swing time a recovery prefers: the time left, reduced by tenths of
  // it while the region is empty (`physicalPushRecovery.preferredSwingTime`,
  // `computePreferredSwingTimeForRecovering` l.197-220).
  const preferred = (
    stance: readonly Foot[],
    swing: Foot,
    remaining: number,
  ): number => {
    if (remaining <= ZULU.controlDt) return remaining;
    let time: number = remaining;
    for (; time >= 0; time -= remaining / 10)
      if (Polygon.area(reachable(stance, swing, time)) > 0) break;
    return time;
  };

  // The footstep projected into the region once per recovery, not while the
  // capture point's error is small nor within `MINIMUM_TIME_TO_REPLAN` of
  // touchdown (`physicalPushRecovery.checkAndUpdate` l.231-281,
  // `physicalFootstepAdjustor`).
  const place = (
    stance: readonly Foot[],
    swing: Foot,
    from: Tools.IFloor,
    remaining: number,
  ): {
    target: Tools.IFloor;
    viable: boolean;
    adjusted: boolean;
    preferred: number;
  } => {
    const time: number = preferred(stance, swing, remaining);
    const region: Polygon.IPoint[] =
      time > 0 ? reachable(stance, swing, time) : [];
    const kept = {
      target: from,
      viable: region.length > 0,
      adjusted: false,
      preferred: time,
    };
    if (
      region.length === 0 ||
      !recovery.large ||
      recovery.recovering ||
      remaining < Recovery.MINIMUM_TIME_TO_REPLAN
    )
      return kept;
    const adjusted: physicalFootstepAdjustor.IResult = physicalFootstepAdjustor(
      {
        position: toLocal(from),
        outline: Polygon.hull(
          outline({ ...swing, frame: { ...swing.frame, origin: from } }).map(
            toLocal,
          ),
        ),
        support: Polygon.centroid(supportOf(stance)),
        region,
      },
    );
    if (!adjusted.adjusted) return kept;
    recovery = { ...recovery, recovering: true };
    return {
      target: toWorld(adjusted.position),
      viable: true,
      adjusted: true,
      preferred: time,
    };
  };
  // The single-support plan from a time to a footstep.
  const plan = (
    support: Foot,
    swing: Foot,
    target: Tools.IFloor,
    duration: number,
  ) => {
    const landing: Foot = {
      ...swing,
      frame: { origin: target, forward: swing.frame.forward },
    };
    return physicalIcpPlanner.singleSupport({
      support,
      footstep: landing,
      omega,
      parameters: { swing: duration },
    });
  };

  test();
  for (let guard: number = 0; guard < 256; ++guard) {
    const push: number = pushes[0]?.seconds ?? Number.POSITIVE_INFINITY;
    const event: number =
      mode === "single"
        ? step!.touchdown
        : trigger !== undefined
          ? trigger.at
          : hold !== undefined
            ? hold.done
            : (standingEnd ?? Number.POSITIVE_INFINITY);
    const next: number = Math.min(push, event);
    state = follow(pieces, {
      phase: mode,
      reference,
      support: supportOf(planted()),
      start: t,
      end: next,
      xi: state.xi,
      c: state.c,
      omega,
    });
    if (next === Infinity) break;
    t = next;

    // A push: the velocity's jump, then the state's own test.
    if (push <= event) {
      const jump: IAutoMovieVector3 = pushes.shift()!.velocity;
      state = {
        xi: { x: state.xi.x + jump.x / omega, z: state.xi.z + jump.z / omega },
        c: state.c,
      };
      branches.push({ kind: "push", seconds: t });
      if (mode !== "single") {
        test();
        continue;
      }
      const s = step!;
      recovery = Recovery.singleSupport({
        state: recovery,
        capture: toLocal(state.xi),
        desired: toLocal(evaluate(reference, t, omega).position),
      });
      const from: Tools.IState = swingAt(swings, s.swing.bone, t);
      const moved = place(s.stance, s.swing, from.position, s.touchdown - t);
      if (!moved.viable) {
        branches.push({ kind: "fall", seconds: t, bone: s.swing.bone });
        fallen = t;
        break;
      }
      if (!moved.adjusted) continue;
      s.target = moved.target;
      s.viable = moved.viable;
      s.plan = plan(s.support, s.swing, s.target, s.touchdown - t);
      reference = segmented(t, s.plan);
      swings.push({
        bone: s.swing.bone,
        start: t,
        end: s.touchdown,
        from,
        to: s.target,
      });
      footstep = { bone: s.swing.bone, position: s.target, viable: s.viable };
      continue;
    }

    // The trigger: the step out of a fall.
    if (mode !== "single" && trigger !== undefined && t >= trigger.at) {
      const swing: Foot = placed.get(trigger.swing)!;
      const stance: Foot[] = planted().filter(
        (foot: Foot): boolean => foot.bone !== swing.bone,
      );
      const support: Foot = merge(stance, swing);
      recovery = Recovery.fall(recovery);
      const placedAt = place(stance, swing, swing.frame.origin, ZULU.swingTime);

      // No capturable step: the response ends in a fall, which the physics
      // takes from here with the fall's contacts.
      if (!placedAt.viable) {
        branches.push({ kind: "fall", seconds: t, bone: swing.bone });
        fallen = t;
        break;
      }

      // The swing sped up to the time the capture region prefers, no shorter
      // than a recovery's minimum (`WalkingSingleSupportState
      // .requestSwingSpeedUpIfNeeded` l.364-381, `hasMinimumTimePassed`
      // l.405-414).
      const duration: number =
        placedAt.preferred > 0
          ? Math.max(
              ZULU.minimumSwingTime,
              Math.min(ZULU.swingTime, placedAt.preferred),
            )
          : ZULU.swingTime;
      // The footstep under the response's own capture point at touchdown:
      // the single-support response laid once toward the projected footstep
      // gives the capture point at its end, xi(T), and the footstep is that
      // point projected into the region, the swing foot's place the
      // capture point reaches, as the reference checks the footstep against
      // the capture point through the swing (`WalkingSingleSupportState`
      // l.136-163); the plan is laid again toward it.
      const region: Polygon.IPoint[] = reachable(stance, swing, duration);
      const trial: IState = follow([], {
        phase: "single",
        reference: segmented(
          t,
          plan(support, swing, placedAt.target, duration),
        ),
        support: supportOf(stance),
        start: t,
        end: t + duration,
        xi: state.xi,
        c: state.c,
        omega,
      });
      // The sole's outline is placed to contain xi(T), as the footstep
      // adjustor places the foot's outline rather than its point
      // (`physicalFootstepAdjustor`): the endpoints whose sole holds xi(T)
      // are xi(T) less the sole's outline about its endpoint, and the
      // footstep is the one of them in the region nearest the sole centred
      // on xi(T); with none in the region, xi(T)'s projection into it.
      const facing: Polygon.IFrame = {
        origin: { x: 0, z: 0 },
        forward: swing.frame.forward,
      };
      const holding: Polygon.IPoint[] = Polygon.hull(
        swing.polygon.map(
          (v: Polygon.IPoint): Polygon.IPoint =>
            toLocal(add(trial.xi, Polygon.world(facing, v), -1)),
        ),
      );
      const centred: Polygon.IPoint = toLocal(
        add(
          trial.xi,
          Polygon.world(facing, Polygon.centroid(Polygon.hull(swing.polygon))),
          -1,
        ),
      );
      const both: Polygon.IPoint[] =
        region.length >= 3 ? Polygon.intersect(region, holding) : [];
      const under: Tools.IFloor =
        both.length >= 3
          ? toWorld(Polygon.project(both, centred))
          : region.length >= 3
            ? toWorld(Polygon.project(region, toLocal(trial.xi)))
            : placedAt.target;
      placedAt.target = under;
      step = {
        support,
        stance,
        swing,
        target: under,
        touchdown: t + duration,
        plan: plan(support, swing, under, duration),
        viable: placedAt.viable,
      };
      footstep = {
        bone: swing.bone,
        position: placedAt.target,
        viable: placedAt.viable,
      };
      swings.push({
        bone: swing.bone,
        start: t,
        end: step.touchdown,
        from: { position: swing.frame.origin, velocity: { x: 0, z: 0 } },
        to: placedAt.target,
      });
      contacts.push({
        start: t,
        bones: stance.map((foot: Foot): string => foot.bone),
      });
      branches.push({ kind: "trigger", seconds: t, bone: swing.bone });
      reference = segmented(t, step.plan);
      mode = "single";
      trigger = undefined;
      outside = undefined;
      hold = undefined;
      standingEnd = undefined;
      continue;
    }

    // The touchdown: the transfer to standing.
    if (mode === "single") {
      const s = step!;
      const landing: Foot = {
        ...s.swing,
        frame: { origin: s.target, forward: s.swing.frame.forward },
      };
      placed.set(landing.bone, landing);
      contacts.push({
        start: t,
        bones: [
          ...s.stance.map((foot: Foot): string => foot.bone),
          landing.bone,
        ],
      });
      branches.push({ kind: "touchdown", seconds: t, bone: landing.bone });
      const last: Tools.IFloor = evaluate(reference, t, omega).position;
      const left: Foot = s.support.side === "left" ? s.support : landing;
      const right: Foot = s.support.side === "left" ? landing : s.support;
      pair = { left, right };
      reference = transfer(
        t,
        physicalIcpPlanner.toStanding({
          feet: { left, right },
          support: s.support.side,
          desired: last,
          center: state.c,
        }),
        soles(),
      );
      hold = {
        reference,
        done: t + physicalIcpPlanner.DEFAULTS.finalTransfer,
        checked: false,
      };
      mode = "toStanding";
      step = undefined;
      recovery = Recovery.reset(recovery);
      test();
      continue;
    }

    // The transfer to standing's exit test, then its exit.
    if (hold !== undefined) {
      const point: Tools.IFloor = evaluate(hold.reference, t, omega).position;
      const error: number = Math.hypot(
        state.xi.x - point.x,
        state.xi.z - point.z,
      );
      if (!hold.checked && !(error < tolerance)) {
        hold.checked = true;
        hold.done = t + Math.log(error / tolerance) / (omega * across);
        continue;
      }
      reference = transfer(
        t,
        physicalIcpPlanner.standing({
          soles: soles(),
          from: { position: point, velocity: { x: 0, z: 0 } },
          to: target(),
        }),
        soles(),
      );
      branches.push({ kind: "standing", seconds: t });
      standingEnd = t + physicalIcpPlanner.DEFAULTS.finalTransfer;
      mode = "standing";
      recovery = Recovery.reset(recovery);
      hold = undefined;
      test();
      continue;
    }

    // The standing cubic's end: its target at rest.
    branches.push({ kind: "end", seconds: t });
    reference = constant(t, target().position);
    mode = "after";
    standingEnd = undefined;
    test();
  }

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

/** The span's input, branch points, sample and result. */
export namespace preparePhysicalDisturbanceSpan {
  /** The state just after the first push and the pushes after it. */
  export interface IInput {
    /** The first push's time, local seconds. */
    seconds: number;

    /** The centre of mass just after it, world metres. */
    center: IAutoMovieVector3;

    /** Its velocity, metres per second, the push's impulse over the mass added. */
    velocity: IAutoMovieVector3;

    /** The pendulum's rate, per second (IHMC's omega0). */
    omega: number;

    /** The body's mass, kilograms. */
    mass: number;

    /** Gravity's magnitude, metres per second squared. */
    gravity: number;

    /**
     * The two planted feet: each its endpoint bone, its side, its sole frame
     * and its contact outline in that frame, x forward and y to the left
     * (`physicalSupportSole.foot`).
     */
    feet: readonly IFoot[];

    /** The authored capture point and its rate at the push, held for the span. */
    authored: {
      position: { x: number; z: number };
      velocity: { x: number; z: number };
    };

    /** The pushes after the first, each its time and velocity jump. */
    pushes?: readonly IPush[];

    /** The policy's longest step, metres. */
    maximumStep: number;

    /** The policy's reaction time before a step, seconds; zero when absent. */
    reactionSeconds?: number;

    /** The floor's height, metres. */
    floor: number;
  }

  /** A later push of the stated disturbance. */
  export interface IPush {
    /** When, local seconds. */
    seconds: number;

    /** The centre of mass's velocity jump, metres per second. */
    velocity: IAutoMovieVector3;
  }

  /** A planted foot. */
  export interface IFoot {
    /** Its endpoint bone. */
    bone: string;

    /** Its side. */
    side: "left" | "right";

    /** Its sole frame, world x and z. */
    frame: {
      origin: { x: number; z: number };
      forward: { x: number; z: number };
    };

    /** Its contact outline in the sole frame. */
    polygon: { x: number; y: number }[];

    /**
     * Its leg's reach, when known: the hip anchor's horizontal offset from the
     * centre of mass, world x and z, its height over the floor, and the leg's
     * chain length, metres. A footstep stays within sqrt(L^2 - h^2) of the hip
     * where it stands at touchdown, carried by the centre of mass.
     */
    leg?: { hip: { x: number; z: number }; height: number; length: number };
  }

  /** A branch point of the span. */
  export interface IBranch {
    /** What happens there. */
    kind: "push" | "trigger" | "touchdown" | "standing" | "end" | "fall";

    /** When, local seconds. */
    seconds: number;

    /** The stepping foot, at a trigger or touchdown. */
    bone?: string;
  }

  /** The response at a time. */
  export interface ISample {
    /** The walking state the time falls in. */
    phase: "double" | "single" | "toStanding" | "standing" | "after";

    /** Whether the controller's pivot is held on the support. */
    saturated: boolean;

    /** The capture point, world x and z, metres. */
    capture: { x: number; z: number };

    /** Its rate, metres per second. */
    captureVelocity: { x: number; z: number };

    /** The centroidal moment pivot, world x and z, metres. */
    pivot: { x: number; z: number };

    /** The centre of mass, world metres, its height held from the push. */
    center: IAutoMovieVector3;

    /** Its velocity, metres per second, horizontal. */
    centerVelocity: IAutoMovieVector3;

    /** Each foot's endpoint on the floor, world metres, by bone. */
    feet: Record<string, IAutoMovieVector3>;

    /**
     * The ground's reaction, newtons, at the pivot on the floor: m omega^2 (c -
     * cmp) across and the weight up.
     */
    reaction: { point: IAutoMovieVector3; force: IAutoMovieVector3 };

    /** Each planted foot's share of the reaction, by bone, summing to one. */
    loads: Record<string, number>;
  }

  /** The prepared span. */
  export interface ISpan {
    /** Its branch points in time order. */
    branches: IBranch[];

    /** The last recovery step's foot and footstep, if it steps. */
    footstep?: {
      bone: string;
      position: { x: number; z: number };
      viable: boolean;
    };

    /**
     * When the response has settled within `maxErrorToStanding` of its plan
     * after its last branch point, or falls, local seconds: where the body is
     * handed back to the physics.
     */
    until: number;

    /**
     * The response at a time: pure, in any order; before the push, the state
     * just after it.
     *
     * @param seconds Local seconds.
     * @returns The response.
     */
    sample(seconds: number): ISample;
  }
}

type Foot = preparePhysicalDisturbanceSpan.IFoot;

/**
 * Zulu's walking timing the response is laid with: its default swing time
 * (`ZuluWalkingControllerParameters` l.709-712), which IHMC 201903 gives a
 * swing out of a double-support fall (`WalkingSingleSupportState` l.206-216);
 * its controller's period (`ZuluRobotModel.DEFAULT_CONTROL_DT` l.68), over
 * which the push recovery's windows count and the program's active constraint
 * is taken again; and the shortest swing out of a fall
 * (`WalkingSingleSupportState.hasMinimumTimePassed` l.412-413).
 */
const ZULU: Readonly<{
  swingTime: number;
  controlDt: number;
  minimumSwingTime: number;
}> = {
  swingTime: 0.6,
  controlDt: 0.003,
  minimumSwingTime: 0.15,
};

/** A capture point and centre of mass at an instant. */
interface IState {
  /** The capture point. */
  xi: Tools.IFloor;

  /** The centre of mass. */
  c: Tools.IFloor;
}

/**
 * One closed form of a plan's capture point from a start time: q + r e^(omega
 * (t - start)), or a0 + a1 u + a2 u^2 + a3 u^3 with u = t - start.
 */
type IForm =
  | { kind: "exp"; start: number; q: Tools.IFloor; r: Tools.IFloor }
  | {
      kind: "poly";
      start: number;
      a: readonly [Tools.IFloor, Tools.IFloor, Tools.IFloor, Tools.IFloor];
    };

/** A plan's capture point as consecutive closed forms, each until the next. */
type IReference = readonly IForm[];

/** One closed-form piece of the response. */
interface IPiece {
  /** When it starts, local seconds. */
  start: number;

  /** When it ends, local seconds. */
  end: number;

  /** The walking state. */
  phase: preparePhysicalDisturbanceSpan.ISample["phase"];

  /** Whether the pivot is held on the support. */
  saturated: boolean;

  /** The capture point's base form: the plan's, or the held pivot's. */
  form: IForm;

  /** The error's terms, b e^(-rate (t - start)). */
  errors: readonly { b: Tools.IFloor; rate: number }[];

  /** The centre of mass at the start. */
  c0: Tools.IFloor;
}

/** The world-aligned frame the support's polygons use. */
const WORLD: Polygon.IFrame = {
  origin: { x: 0, z: 0 },
  forward: { x: 0, z: 1 },
};

/** A floor point in the support's world-aligned frame. */
function toLocal(p: Tools.IFloor): Polygon.IPoint {
  return Polygon.local(WORLD, p);
}

/** A point of the world-aligned frame on the floor. */
function toWorld(p: Polygon.IPoint): Tools.IFloor {
  return Polygon.world(WORLD, p);
}

/** A foot's outline on the floor. */
function outline(foot: Foot): Tools.IFloor[] {
  return foot.polygon.map(
    (p: Polygon.IPoint): Tools.IFloor => Polygon.world(foot.frame, p),
  );
}

/** A foot as a planted contact: its outline's points on the floor. */
function contact(foot: Foot): Contacts.IContact {
  return { bone: foot.bone, points: outline(foot) };
}

/** A + k b. */
function add(a: Tools.IFloor, b: Tools.IFloor, k: number = 1): Tools.IFloor {
  return { x: a.x + k * b.x, z: a.z + k * b.z };
}

/** K p. */
function scaled(p: Tools.IFloor, k: number): Tools.IFloor {
  return { x: p.x * k, z: p.z * k };
}

/** A capture point at rest at a point from a time. */
function constant(start: number, p: Tools.IFloor): IForm[] {
  return [{ kind: "exp", start, q: p, r: { x: 0, z: 0 } }];
}

/**
 * A cubic over a duration from one point and rate to another
 * (`physicalIcpPlannerTools.cubic`), then the final point at rest.
 */
function cubic(
  start: number,
  duration: number,
  from: Tools.IState,
  to: Tools.IState,
): IForm[] {
  if (!(duration > 0)) return constant(start, to.position);
  const T: number = duration;
  const axis = (key: "x" | "z"): [number, number, number, number] => {
    const z0: number = from.position[key];
    const v0: number = from.velocity[key];
    const z1: number = to.position[key];
    const v1: number = to.velocity[key];
    return [
      z0,
      v0,
      (3 * (z1 - z0)) / (T * T) - (2 * v0 + v1) / T,
      (2 * (z0 - z1)) / (T * T * T) + (v0 + v1) / (T * T),
    ];
  };
  const x: [number, number, number, number] = axis("x");
  const z: [number, number, number, number] = axis("z");
  return [
    {
      kind: "poly",
      start,
      a: [
        { x: x[0], z: z[0] },
        { x: x[1], z: z[1] },
        { x: x[2], z: z[2] },
        { x: x[3], z: z[3] },
      ],
    },
    ...constant(start + T, to.position),
  ];
}

/**
 * A single-support plan on its own soles as closed forms: the divergence from
 * the entry pivot, the cubic across the pivot switch, and the divergence from
 * the exit pivot after (`physicalIcpPlannerSegments`), its world copies being
 * its sole copies on the soles it was made on.
 */
function segmented(
  start: number,
  plan: physicalIcpPlanner.ISinglePlan,
): IReference {
  const s = plan.segments;
  const w = s.world;
  return [
    {
      kind: "exp",
      start,
      q: w.initialCmp,
      r: add(w.initialIcp, w.initialCmp, -1),
    },
    ...cubic(
      start + s.startOfSpline,
      s.endOfSpline - s.startOfSpline,
      w.start,
      w.end,
    ).slice(0, 1),
    {
      kind: "exp",
      start: start + s.endOfSpline,
      q: w.finalCmp,
      r: add(w.end.position, w.finalCmp, -1),
    },
  ];
}

/**
 * A double-support plan's cubic on fixed soles: its ends carried to where their
 * frames are (`physicalIcpPlanner`), then its final point at rest.
 */
function transfer(
  start: number,
  plan: physicalIcpPlanner.ITransferPlan,
  soles: physicalIcpPlanner.ISoles,
): IReference {
  const middle: Polygon.IFrame = Tools.midFeet(
    soles.left,
    soles.right,
    plan.fallback,
  );
  const frame = (attachment: physicalIcpPlanner.IAttachment): Polygon.IFrame =>
    attachment === "midFeet" ? middle : soles[attachment];
  return cubic(
    start,
    plan.cubicDuration,
    Tools.detach(frame(plan.initial.frame), plan.initial.state),
    Tools.detach(frame(plan.final.frame), plan.final.state),
  );
}

/** The form of a reference in force at a time. */
function formAt(reference: IReference, seconds: number): IForm {
  let form: IForm = reference[0]!;
  for (const candidate of reference)
    if (candidate.start <= seconds) form = candidate;
  return form;
}

/** A form's capture point and rate at a time. */
function value(form: IForm, seconds: number, omega: number): Tools.IState {
  const u: number = seconds - form.start;
  if (form.kind === "exp") {
    const grow: number = Math.exp(omega * u);
    return {
      position: add(form.q, form.r, grow),
      velocity: scaled(form.r, omega * grow),
    };
  }
  const [a0, a1, a2, a3] = form.a;
  return {
    position: {
      x: a0.x + u * (a1.x + u * (a2.x + u * a3.x)),
      z: a0.z + u * (a1.z + u * (a2.z + u * a3.z)),
    },
    velocity: {
      x: a1.x + u * (2 * a2.x + 3 * u * a3.x),
      z: a1.z + u * (2 * a2.z + 3 * u * a3.z),
    },
  };
}

/** A reference's capture point and rate at a time. */
function evaluate(
  reference: IReference,
  seconds: number,
  omega: number,
): Tools.IState {
  return value(formAt(reference, seconds), seconds, omega);
}

/**
 * A form's particular centre of mass under c' = omega (xi - c): the constant
 * pivot's, q + r / 2 e^(omega u) (`integrateCoMPositionWithConstantCMP`), or
 * the cubic's (`integrateCoMPositionOverPolynomial` l.355-370).
 */
function particular(form: IForm, seconds: number, omega: number): Tools.IFloor {
  const u: number = seconds - form.start;
  if (form.kind === "exp") return add(form.q, form.r, Math.exp(omega * u) / 2);
  const [a0, a1, a2, a3] = form.a;
  const axis = (key: "x" | "z"): number =>
    a3[key] * u * u * u +
    (a2[key] - (3 * a3[key]) / omega) * u * u +
    (a1[key] - (2 * a2[key]) / omega + (6 * a3[key]) / (omega * omega)) * u +
    (a0[key] -
      a1[key] / omega +
      (2 * a2[key]) / (omega * omega) -
      (6 * a3[key]) / (omega * omega * omega));
  return { x: axis("x"), z: axis("z") };
}

/** A piece's capture point and rate at a time. */
function capture(piece: IPiece, seconds: number, omega: number): Tools.IState {
  const base: Tools.IState = value(piece.form, seconds, omega);
  const u: number = seconds - piece.start;
  let position: Tools.IFloor = base.position;
  let velocity: Tools.IFloor = base.velocity;
  for (const error of piece.errors) {
    const decay: number = Math.exp(-error.rate * u);
    position = add(position, error.b, decay);
    velocity = add(velocity, error.b, -error.rate * decay);
  }
  return { position, velocity };
}

/** A piece's centre of mass at a time, its homogeneous term from c0. */
function center(piece: IPiece, seconds: number, omega: number): Tools.IFloor {
  const at = (u: number): Tools.IFloor => {
    let c: Tools.IFloor = particular(piece.form, piece.start + u, omega);
    for (const error of piece.errors)
      c = add(
        c,
        error.b,
        (omega / (omega - error.rate)) * Math.exp(-error.rate * u),
      );
    return c;
  };
  const u: number = seconds - piece.start;
  return add(at(u), add(piece.c0, at(0), -1), Math.exp(-omega * u));
}

/** The error's split along and across the plan's motion, with their gains. */
function decompose(
  motion: Tools.IFloor,
  error: Tools.IFloor,
  omega: number,
): { b: Tools.IFloor; rate: number; gain: number }[] {
  const length: number = Math.hypot(motion.x, motion.z);
  const across: number = physicalIcpController.ZULU.kpOrthogonal;
  if (!(length > Tools.EPSILON))
    return [{ b: error, rate: omega * across, gain: across }];
  const u: Tools.IFloor = scaled(motion, 1 / length);
  const along: Tools.IFloor = scaled(u, error.x * u.x + error.z * u.z);
  const parallel: number = physicalIcpController.ZULU.kpParallel;
  return [
    { b: along, rate: omega * parallel, gain: parallel },
    { b: add(error, along, -1), rate: omega * across, gain: across },
  ];
}

/** A form restarted at a time, its values unchanged. */
function shift(form: IForm, start: number, omega: number): IForm {
  const u: number = start - form.start;
  if (form.kind === "exp")
    return { ...form, start, r: scaled(form.r, Math.exp(omega * u)) };
  const [a0, a1, a2, a3] = form.a;
  const axis = (key: "x" | "z"): [number, number, number, number] => [
    a0[key] + u * (a1[key] + u * (a2[key] + u * a3[key])),
    a1[key] + u * (2 * a2[key] + 3 * u * a3[key]),
    a2[key] + 3 * u * a3[key],
    a3[key],
  ];
  const x: [number, number, number, number] = axis("x");
  const z: [number, number, number, number] = axis("z");
  return {
    kind: "poly",
    start,
    a: [
      { x: x[0], z: z[0] },
      { x: x[1], z: z[1] },
      { x: x[2], z: z[2] },
      { x: x[3], z: z[3] },
    ],
  };
}

/**
 * The response over an interval tracking a reference on a support, piece by
 * piece: at each form's start the error is split again; while the unconstrained
 * pivot lies outside the support the pivot is held there. Pushes its pieces and
 * returns the state at the interval's end.
 */
function follow(
  pieces: IPiece[],
  input: {
    phase: IPiece["phase"];
    reference: IReference;
    support: readonly Polygon.IPoint[];
    start: number;
    end: number;
    xi: Tools.IFloor;
    c: Tools.IFloor;
    omega: number;
  },
): IState {
  const { omega } = input;
  let t: number = input.start;
  let state: IState = { xi: input.xi, c: input.c };
  const push = (piece: IPiece): void => {
    pieces.push(piece);
    if (piece.end !== Infinity)
      state = {
        xi: capture(piece, piece.end, omega).position,
        c: center(piece, piece.end, omega),
      };
  };
  for (let guard: number = 0; guard < 65536 && t < input.end; ++guard) {
    const form: IForm = formAt(input.reference, t);
    const next: number | undefined = input.reference.find(
      (candidate: IForm): boolean => candidate.start > t,
    )?.start;
    const until: number = Math.min(input.end, next ?? Number.POSITIVE_INFINITY);
    const desired: Tools.IState = value(form, t, omega);
    const split: { b: Tools.IFloor; rate: number; gain: number }[] = decompose(
      desired.velocity,
      add(state.xi, desired.position, -1),
      omega,
    );
    const unconstrained: Tools.IFloor = split.reduce(
      (sum: Tools.IFloor, term): Tools.IFloor =>
        add(sum, term.b, 1 + term.gain),
      add(desired.position, desired.velocity, -1 / omega),
    );
    if (
      input.support.length < 3 ||
      Polygon.inside(input.support, toLocal(unconstrained))
    ) {
      push({
        start: t,
        end: until,
        phase: input.phase,
        saturated: false,
        form: shift(form, t, omega),
        errors: split.map((term) => ({ b: term.b, rate: term.rate })),
        c0: state.c,
      });
      t = until;
      continue;
    }

    // The pivot held on the support: xi = cmp + (xi0 - cmp) e^(omega u).
    const held: Tools.IFloor = toWorld(
      Polygon.project(input.support, toLocal(unconstrained)),
    );
    const d: Tools.IFloor = add(state.xi, held, -1);
    const exit: number =
      form.kind === "exp"
        ? reentry(
            {
              ...form,
              start: t,
              r: scaled(form.r, Math.exp(omega * (t - form.start))),
            },
            held,
            d,
            split,
            input.support,
            omega,
          )
        : crossing(form, held, d, split, input.support, t, until, omega);
    // The program's active constraint is taken again each control period,
    // as the controller solves it once per update (Zulu's period), the projection held over the period.
    const period: number = Math.min(until, t + ZULU.controlDt);
    const stop: number = exit > t && exit < period ? exit : period;
    push({
      start: t,
      end: stop,
      phase: input.phase,
      saturated: true,
      form: { kind: "exp", start: t, q: held, r: d },
      errors: [],
      c0: state.c,
    });
    t = stop;
  }
  return state;
}

/**
 * When the unconstrained pivot comes back inside the support while the pivot is
 * held over a cubic reference: its path, the cubic's pivot xi_d - xi_d' / omega
 * plus the gain on xi - xi_d with xi = cmp + d e^(omega u), mixes a polynomial
 * and an exponential, so its first entry is bracketed on a grid of the interval
 * and refined by bisection, once as the response is prepared. The interval's
 * end, when it stays outside.
 */
function crossing(
  form: IForm,
  held: Tools.IFloor,
  d: Tools.IFloor,
  split: readonly { b: Tools.IFloor; gain: number }[],
  support: readonly Polygon.IPoint[],
  start: number,
  until: number,
  omega: number,
): number {
  if (until === Infinity) return until;
  const gain: number = 1 + (split[0]?.gain ?? 0);
  const inside = (time: number): boolean => {
    const desired: Tools.IState = value(form, time, omega);
    const xi: Tools.IFloor = add(held, d, Math.exp(omega * (time - start)));
    const pivot: Tools.IFloor = add(
      add(desired.position, desired.velocity, -1 / omega),
      add(xi, desired.position, -1),
      gain,
    );
    return Polygon.inside(support, toLocal(pivot));
  };
  const grid: number = 64;
  let before: number = start;
  for (let i: number = 1; i <= grid; ++i) {
    const time: number = start + ((until - start) * i) / grid;
    if (inside(time)) {
      let low: number = before;
      let high: number = time;
      for (let j: number = 0; j < 48; ++j) {
        const middle: number = (low + high) / 2;
        if (inside(middle)) high = middle;
        else low = middle;
      }
      return high;
    }
    before = time;
  }
  return until;
}

/**
 * When the unconstrained pivot comes back inside the support while the pivot is
 * held, over a reference form with a constant pivot q from the same start: with
 * xi = cmp + d s and xi_d = q + r s, s = e^(omega u), the pivot q + K (cmp
 *
 * - Q + (d - r) s) moves along a line in s, inside a convex polygon over an
 *   interval of s found edge by edge. Never, when it stays outside.
 */
function reentry(
  form: Extract<IForm, { kind: "exp" }>,
  held: Tools.IFloor,
  d: Tools.IFloor,
  split: readonly { b: Tools.IFloor; gain: number }[],
  support: readonly Polygon.IPoint[],
  omega: number,
): number {
  // The gain operator of the split: K v = sum (1 + k_i) (v . u_i) u_i over
  // its unit directions, or (1 + k) v for a single gain.
  const units: { u: Tools.IFloor; k: number }[] = split
    .filter((term) => Math.hypot(term.b.x, term.b.z) > 0)
    .map((term) => ({
      u: scaled(term.b, 1 / Math.hypot(term.b.x, term.b.z)),
      k: 1 + term.gain,
    }));
  const gain = (v: Tools.IFloor): Tools.IFloor =>
    split.length === 1 || units.length < 2
      ? scaled(v, 1 + (split[0]?.gain ?? 0))
      : units.reduce(
          (sum: Tools.IFloor, unit): Tools.IFloor =>
            add(sum, unit.u, unit.k * (v.x * unit.u.x + v.z * unit.u.z)),
          { x: 0, z: 0 },
        );
  const base: Tools.IFloor = add(form.q, gain(add(held, form.q, -1)));
  const slope: Tools.IFloor = gain(add(d, form.r, -1));
  const b0: Polygon.IPoint = toLocal(base);
  const b1: Polygon.IPoint = toLocal(add(base, slope));
  const direction: Polygon.IPoint = { x: b1.x - b0.x, y: b1.y - b0.y };
  const centre: Polygon.IPoint = Polygon.centroid([...support]);
  let lower: number = 1;
  let upper: number = Number.POSITIVE_INFINITY;
  for (let i: number = 0; i < support.length; ++i) {
    const a: Polygon.IPoint = support[i]!;
    const b: Polygon.IPoint = support[(i + 1) % support.length]!;
    const cross = (p: Polygon.IPoint): number =>
      (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    const sign: number = cross(centre) >= 0 ? 1 : -1;
    const alpha: number = sign * cross(b0);
    const beta: number =
      sign * ((b.x - a.x) * direction.y - (b.y - a.y) * direction.x);
    if (beta > 0) lower = Math.max(lower, -alpha / beta);
    else if (beta < 0) upper = Math.min(upper, -alpha / beta);
    else if (alpha < 0) upper = Number.NEGATIVE_INFINITY;
  }
  if (lower > upper)
    return Number.POSITIVE_INFINITY;
  return form.start + Math.log(lower) / omega;
}

/** A swing foot's cubic to its footstep. */
interface ISwing {
  /** The swinging foot's endpoint bone. */
  bone: string;

  /** When the cubic starts and lands, local seconds. */
  start: number;

  /** When it lands. */
  end: number;

  /** Where and how fast the foot is as the cubic starts. */
  from: Tools.IState;

  /** The footstep. */
  to: Tools.IFloor;
}

/** A swing foot's place and rate at a time on its latest cubic. */
function swingAt(
  swings: readonly ISwing[],
  bone: string,
  seconds: number,
): Tools.IState {
  let swing: ISwing | undefined;
  for (const candidate of swings)
    if (candidate.bone === bone && candidate.start <= seconds)
      swing = candidate;
  if (swing === undefined) throw new Error(`No swing of ${bone}.`);
  if (seconds >= swing.end)
    return { position: swing.to, velocity: { x: 0, z: 0 } };
  return Tools.cubic(
    {
      duration: swing.end - swing.start,
      initial: swing.from.position,
      initialVelocity: swing.from.velocity,
      final: swing.to,
      finalVelocity: { x: 0, z: 0 },
    },
    seconds - swing.start,
  );
}

/** The span from its pieces. */
function span(input: {
  pieces: readonly IPiece[];
  branches: preparePhysicalDisturbanceSpan.IBranch[];
  footstep: preparePhysicalDisturbanceSpan.ISpan["footstep"];
  input: preparePhysicalDisturbanceSpan.IInput;
  until: number;
  feet: (seconds: number) => Record<string, Tools.IFloor>;
  contacts: (seconds: number) => string[];
  outline: (bone: string, at: Tools.IFloor) => Tools.IFloor[];
}): preparePhysicalDisturbanceSpan.ISpan {
  const { pieces } = input;
  const { omega, mass, gravity, floor } = input.input;
  return {
    branches: input.branches,
    ...(input.footstep ? { footstep: input.footstep } : {}),
    until: input.until,
    sample: (seconds: number): preparePhysicalDisturbanceSpan.ISample => {
      const piece: IPiece | undefined =
        pieces.find((p: IPiece): boolean => seconds < p.end) ??
        pieces[pieces.length - 1];
      if (piece === undefined) throw new Error("A span has no piece.");
      const at: number = Math.max(piece.start, seconds);
      const xi: Tools.IState = capture(piece, at, omega);
      const c: Tools.IFloor = center(piece, at, omega);
      const cmp: Tools.IFloor = add(xi.position, xi.velocity, -1 / omega);
      const feet: Record<string, Tools.IFloor> = input.feet(seconds);
      const planted: string[] = input.contacts(seconds);

      // The weight's split over the planted limbs' outlines at the pivot,
      // for any number (`physicalSupportSpanContacts.loads`).
      // Each outline vertex is a contact of its own, so the pivot held on the
      // outlines' hull has a split; a limb's share is its vertices' sum.
      const vertices: Contacts.IContact[] = planted.flatMap(
        (bone: string): Contacts.IContact[] =>
          input.outline(bone, feet[bone]!).map(
            (point: Tools.IFloor, k: number): Contacts.IContact => ({
              bone: `${bone}#${k}`,
              points: [point],
            }),
          ),
      );
      const loads: Record<string, number> = Object.fromEntries(
        planted.map((bone: string): [string, number] => [bone, 0]),
      );
      Contacts.loads(vertices, cmp).forEach(
        (load: Contacts.ILoad, k: number): void => {
          const bone: string = vertices[k]!.bone.slice(
            0,
            vertices[k]!.bone.lastIndexOf("#"),
          );
          loads[bone] = (loads[bone] ?? 0) + load.share;
        },
      );
      return {
        phase: piece.phase,
        saturated: piece.saturated,
        capture: xi.position,
        captureVelocity: xi.velocity,
        pivot: cmp,
        center: { x: c.x, y: input.input.center.y, z: c.z },
        centerVelocity: {
          x: omega * (xi.position.x - c.x),
          y: 0,
          z: omega * (xi.position.z - c.z),
        },
        feet: Object.fromEntries(
          Object.entries(feet).map(
            ([bone, p]: [string, Tools.IFloor]): [
              string,
              IAutoMovieVector3,
            ] => [bone, { x: p.x, y: floor, z: p.z }],
          ),
        ),
        reaction: {
          point: { x: cmp.x, y: floor, z: cmp.z },
          force: {
            x: mass * omega * omega * (c.x - cmp.x),
            y: mass * gravity,
            z: mass * omega * omega * (c.z - cmp.z),
          },
        },
        loads,
      };
    },
  };
}
