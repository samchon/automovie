import { physicalDisturbanceFollow } from "./physicalDisturbanceFollow";
import { physicalDisturbanceForm } from "./physicalDisturbanceForm";
import { physicalDisturbancePlacement as Placement } from "./physicalDisturbancePlacement";
import { physicalFootstepAdjustor } from "./physicalFootstepAdjustor";
import { physicalIcpController } from "./physicalIcpController";
import { physicalIcpPlanner } from "./physicalIcpPlanner";
import { physicalIcpPlannerCmps as Cmps } from "./physicalIcpPlannerCmps";
import type { physicalIcpPlannerTools as Tools } from "./physicalIcpPlannerTools";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";
import { physicalPushRecovery as Recovery } from "./physicalPushRecovery";
import { physicalSupportSpanContacts as Contacts } from "./physicalSupportSpanContacts";
import type { preparePhysicalDisturbanceSpan } from "./preparePhysicalDisturbanceSpan";

/** A planted foot. */
type Foot = preparePhysicalDisturbanceSpan.IFoot;

/** The closed forms the response is laid with. */
const {
  ZULU,
  add,
  constant,
  contact,
  evaluate,
  outline,
  segmented,
  toLocal,
  toWorld,
}: typeof physicalDisturbanceForm = physicalDisturbanceForm;

/**
 * A disturbance response while it is laid (`preparePhysicalDisturbanceSpan`):
 * the state every branch point reads and moves, and the support, step and
 * placement rules the branch points share.
 */
export namespace physicalDisturbanceResponse {
  /** The step a single-support plan rides on. */
  export interface IStep {
    /** The stance's planted limbs merged into one support (`merge`). */
    support: Foot;

    /** The stance's planted limbs. */
    stance: Foot[];

    /** The swinging limb. */
    swing: Foot;

    /** The footstep, a world floor point. */
    target: Tools.IFloor;

    /** The touchdown, local seconds. */
    touchdown: number;

    /** The single-support plan to the footstep. */
    plan: physicalIcpPlanner.ISinglePlan;

    /** Whether the footstep lies in the capture region. */
    viable: boolean;
  }

  /** The response being laid: its constants, its record and its state. */
  export interface IResponse {
    /** The state just after the first push and the pushes after it. */
    input: preparePhysicalDisturbanceSpan.IInput;

    /** The pendulum's rate, per second. */
    omega: number;

    /** The first push, local seconds. */
    t0: number;

    /** The authored capture point and its rate. */
    authored: Tools.IState;

    /** The closed-form pieces laid so far. */
    pieces: physicalDisturbanceForm.IPiece[];

    /** The branch points passed so far. */
    branches: preparePhysicalDisturbanceSpan.IBranch[];

    /** The pushes still to come, in time order. */
    pushes: preparePhysicalDisturbanceSpan.IPush[];

    /** The policy's reaction time, seconds. */
    reaction: number;

    /** The transfer to standing's exit error, metres. */
    tolerance: number;

    /** The ICP controller's across gain. */
    across: number;

    /** Where each foot stands, by bone. */
    placed: Map<string, Foot>;

    /** Each swing's cubic. */
    swings: physicalDisturbanceFollow.ISwing[];

    /** Which limbs stand on the floor from when. */
    contacts: { start: number; bones: string[] }[];

    /**
     * The two sides a plan rides on after a step: the stance, its planted limbs
     * merged into one support (`merge`), and the stepping limb, by their
     * lateral order.
     */
    pair: { left: Foot; right: Foot } | undefined;

    /** The capture point and centre of mass now. */
    state: physicalDisturbanceForm.IState;

    /** Now, local seconds. */
    t: number;

    /** The phase now. */
    mode: physicalDisturbanceForm.IPiece["phase"];

    /** The plan's capture point now. */
    reference: physicalDisturbanceForm.IReference;

    /** When the capture point left the support, if it has. */
    outside: number | undefined;

    /** The push recovery's state. */
    recovery: Recovery.IState;

    /** The step a fall triggers: when, and which limb swings. */
    trigger: { at: number; swing: string } | undefined;

    /** The step being taken. */
    step: IStep | undefined;

    /** The transfer to standing's plan and its exit. */
    hold:
      | {
          reference: physicalDisturbanceForm.IReference;
          done: number;
          checked: boolean;
        }
      | undefined;

    /** The standing cubic's end, local seconds. */
    standingEnd: number | undefined;

    /** The last footstep laid. */
    footstep: preparePhysicalDisturbanceSpan.ISpan["footstep"];

    /** When the response fell, if it did. */
    fallen: number | undefined;
  }

  /**
   * The response at the first push: the state just after it, every foot planted
   * as authored, and the authored capture point at rest as the plan.
   *
   * @param input The state just after the first push and the pushes after it.
   * @returns The response before its first branch point's test.
   */
  export function create(
    input: preparePhysicalDisturbanceSpan.IInput,
  ): IResponse {
    const { omega } = input;
    const t0: number = input.seconds;
    const authored: Tools.IState = {
      position: { ...input.authored.position },
      velocity: { ...input.authored.velocity },
    };
    return {
      input,
      omega,
      t0,
      authored,
      pieces: [],
      branches: [{ kind: "push", seconds: t0 }],
      pushes: [...(input.pushes ?? [])]
        .filter((push): boolean => push.seconds > t0)
        .sort((a, b): number => a.seconds - b.seconds),
      reaction: Math.max(0, input.reactionSeconds ?? 0),
      tolerance: physicalIcpPlanner.DEFAULTS.maxErrorToStanding,
      across: physicalIcpController.ZULU.kpOrthogonal,

      // The feet: where each stands from when, each swing's cubic, and which
      // stand on the floor from when.
      placed: new Map(
        input.feet.map((foot: Foot): [string, Foot] => [foot.bone, foot]),
      ),
      swings: [],
      contacts: [
        { start: t0, bones: input.feet.map((foot: Foot): string => foot.bone) },
      ],
      pair: undefined,
      state: {
        xi: {
          x: input.center.x + input.velocity.x / omega,
          z: input.center.z + input.velocity.z / omega,
        },
        c: { x: input.center.x, z: input.center.z },
      },
      t: t0,
      mode: "double",
      reference: constant(t0, authored.position),
      outside: undefined,
      recovery: Recovery.initial(),
      trigger: undefined,
      step: undefined,
      hold: undefined,
      standingEnd: undefined,
      footstep: undefined,
      fallen: undefined,
    };
  }

  /** The limbs planted now. */
  export function planted(scope: IResponse): Foot[] {
    return scope.contacts[scope.contacts.length - 1]!.bones.map(
      (bone: string): Foot => scope.placed.get(bone)!,
    );
  }

  /** The support the feet's outlines span. */
  export function supportOf(feet: readonly Foot[]): Polygon.IPoint[] {
    return Contacts.hull(feet.map(contact));
  }

  /**
   * The stance while a limb swings, any number of planted limbs merged into one
   * support the planner reads as a foot: their outline's hull in a frame at its
   * centroid, facing as the swinging limb faces, on the side opposite it
   * (`physicalSupportSpanContacts.remaining`); a single limb is itself.
   */
  export function merge(stance: readonly Foot[], swing: Foot): Foot {
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
  }

  /**
   * The swinging limb: of the planted limbs, from the farthest from the capture
   * point to the nearest, the last of equals first, as the push recovery keeps
   * the closest limb and swings the other (`physicalPushRecovery.doubleSupport`
   * l.169-182, PushRecoveryControlModule l.169-182), the first whose sole can
   * hold its own trial's capture point at touchdown (`attempt`); else the first
   * that can capture; else the farthest.
   */
  export function choose(scope: IResponse, feet: readonly Foot[]): string {
    const ranked: { foot: Foot; distance: number }[] = feet
      .map((foot: Foot, index: number) => {
        const at: Tools.IFloor = toWorld(Polygon.centroid(supportOf([foot])));
        return {
          foot,
          index,
          distance: Math.hypot(
            scope.state.xi.x - at.x,
            scope.state.xi.z - at.z,
          ),
        };
      })
      .sort((a, b): number => b.distance - a.distance || b.index - a.index);
    const trials = ranked.map(({ foot }) => ({
      foot,
      ...attempt(
        scope,
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
  }

  /**
   * One candidate's step laid once in closed form: its preferred swing time and
   * region (`computePreferredSwingTimeForRecovering` l.197-220), its footstep
   * projected into the region (`physicalFootstepAdjustor`), the single-support
   * response toward it, and whether its sole can hold the response's capture
   * point at touchdown within the region, the footstep check the swing makes
   * (`WalkingSingleSupportState` l.136-163).
   */
  export function attempt(
    scope: IResponse,
    stance: readonly Foot[],
    swing: Foot,
  ): { holds: boolean; capturable: boolean } {
    const time: number = Placement.preferred(
      scope,
      stance,
      swing,
      ZULU.swingTime,
    );
    if (!(time > 0)) return { holds: false, capturable: false };
    const duration: number = Math.max(
      ZULU.minimumSwingTime,
      Math.min(ZULU.swingTime, time),
    );
    const region: Polygon.IPoint[] = Placement.reachable(
      scope,
      stance,
      swing,
      duration,
    );
    if (region.length < 3) return { holds: false, capturable: true };
    const projected: physicalFootstepAdjustor.IResult =
      physicalFootstepAdjustor({
        position: toLocal(swing.frame.origin),
        outline: Polygon.hull(outline(swing).map(toLocal)),
        support: Polygon.centroid(supportOf(stance)),
        region,
      });
    const trial: physicalDisturbanceForm.IState =
      physicalDisturbanceFollow.follow([], {
        phase: "single",
        reference: segmented(
          scope.t,
          Placement.plan(
            scope,
            merge(stance, swing),
            swing,
            toWorld(projected.position),
            duration,
          ),
        ),
        support: supportOf(stance),
        start: scope.t,
        end: scope.t + duration,
        xi: scope.state.xi,
        c: scope.state.c,
        omega: scope.omega,
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
  }

  /** The soles of the pair a plan rides on after a step. */
  export function soles(scope: IResponse): physicalIcpPlanner.ISoles {
    return {
      left: scope.pair!.left.frame,
      right: scope.pair!.right.frame,
    };
  }

  /**
   * The standing target: the authored capture point while the feet stand as
   * authored; after a step, the reference's own, the final pivot between the
   * feet at rest, the right foot first (`physicalIcpPlannerCmps.between`
   * l.345-350, l.399-401), as the authored stance no longer says where the body
   * stands.
   */
  export function target(scope: IResponse): Tools.IState {
    if (scope.pair === undefined) return scope.authored;
    return {
      position: Cmps.between(
        scope.pair.right,
        scope.pair.left,
        physicalIcpPlanner.DEFAULTS,
      ),
      velocity: { x: 0, z: 0 },
    };
  }

  /** The push recovery's double-support fall test at a branch point. */
  export function test(scope: IResponse): void {
    if (scope.mode === "single") return;
    const feet: Foot[] = planted(scope);
    const fall: { state: Recovery.IState; swing?: string } =
      Recovery.doubleSupport({
        state: scope.recovery,
        capture: toLocal(scope.state.xi),
        desired: toLocal(
          evaluate(scope.reference, scope.t, scope.omega).position,
        ),
        support: supportOf(feet),
        feet: feet.map((foot: Foot) => ({
          bone: foot.bone,
          centroid: Polygon.centroid(supportOf([foot])),
        })),
        dt: ZULU.controlDt,
        period: ZULU.controlDt,
      });
    scope.recovery = fall.state;
    if (fall.swing === undefined) {
      scope.outside = undefined;
      scope.trigger = undefined;
      return;
    }
    scope.outside ??= scope.t;
    scope.trigger = {
      at: Math.max(scope.t, scope.outside + scope.reaction),
      swing: choose(scope, feet),
    };
  }
}
