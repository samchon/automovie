import { ROM_TOLERANCE } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMoviePerformanceMode,
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import type { bindHumanSimulationGrips } from "./bindHumanSimulationGrips";

/**
 * One performer of a simulated window as a body of the engine's input: its
 * sampled poses as targets, and at each step which of its segments the
 * solver owns and how strongly they track.
 *
 * The root stays authored throughout: the kinematic laws own where the body
 * stands, steps and balances. A segment becomes physical only where
 * something physical reaches it: from the step an impulse lands on it, its
 * subtree tracks its sampled poses with the profile's bounded joint motors
 * until the window hands back; while it grips a simulated partner, the
 * gripping arm's chain and the hand's subtree track the grip as the
 * solver's collider binding, fitted together with the partner's when both
 * grip each other (a coupled group, #3834). A performer the window
 * releases (a fall, or `released`) is wholly physical with its tracking
 * withdrawn from its release step, a passive body under gravity, contact
 * and its joints' limits. Gravity on a tracked subtree is compensated, as
 * the muscles hold a limb's own weight, so tracking error is the response
 * to what struck it, not sag. When the window hands back, every segment
 * returns to authored motion over the last `handoff` seconds through the
 * engine's continuous return.
 *
 * @param props The performer, its body and samples, the mode and the window's schedule.
 * @returns The engine body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what stays authored, what becomes physical and when, the release, the gravity compensation and the hand-back.
 * @evidence contracts/development/implementation.md#principled-implementation Kinematic motion with physical response only where a hit lands, blended back to the kinematic motion afterwards: Zordan, Majkowska, Chiu and Fast 2005, "Dynamic response for motion capture animation", ACM TOG 24(3):697-701. Sample k's policy owns the interval before it (`IAutoMoviePhysicalSimulationInput.ITarget`), so an impulse applied at step k's opening boundary meets its subtree already physical.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the step policy from the window's impulses, grips, groups and releases; the window's assembly owns those decisions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every gain and limit is the profile's; the only body settings are zero root actuation, the engine's default hand-back and its residual limits, the joint one widened to the range tolerance the displayed poses themselves are admitted within (`ROM_TOLERANCE`).
 * @evidence contracts/development/implementation.md#efficient-algorithms O((S + 1) * B) for S steps and B segments, with the descendant closure memoised per distinct bone set.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Steps with the same owned set share one frozen array, so the engine's ownership selection sees no change between them.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh body that shares the caller's sampled poses; retains nothing.
 */
export function planHumanSimulationBody(
  props: planHumanSimulationBody.IProps,
): IAutoMoviePhysicalSimulationInput.IBody {
  const profile: IAutoMovieMotionHumanBody["profile"] = props.body.profile;
  const children: Map<string, string[]> = new Map();
  for (const joint of profile.joints)
    children.set(joint.parent, [
      ...(children.get(joint.parent) ?? []),
      joint.child,
    ]);
  const root: string = profile.segments.find(
    (
      segment: IAutoMovieMotionHumanBody["profile"]["segments"][number],
    ): boolean =>
      !profile.joints.some(
        (joint: IAutoMoviePhysicalJoint): boolean =>
          joint.child === segment.bone,
      ),
  )!.bone;
  const closures: Map<string, string[]> = new Map();
  const closure = (bones: ReadonlySet<string>): string[] => {
    const key: string = [...bones].sort(ordinal).join(",");
    const known: string[] | undefined = closures.get(key);
    if (known !== undefined) return known;
    const found: Set<string> = new Set();
    const visit = (bone: string): void => {
      if (found.has(bone)) return;
      found.add(bone);
      for (const child of children.get(bone) ?? []) visit(child);
    };
    for (const bone of bones) if (bone !== root) visit(bone);
    const result: string[] = [...found].sort(ordinal);
    Object.freeze(result);
    closures.set(key, result);
    return result;
  };
  const own: readonly bindHumanSimulationGrips.IGrip[] = props.grips.filter(
    (grip: bindHumanSimulationGrips.IGrip): boolean =>
      grip.subject === props.subject,
  );
  const release: number = props.releases.get(props.subject)!;
  const targets: IAutoMoviePhysicalSimulationInput.ITarget[] =
    props.targets.map(
      (
        segments: Record<string, IAutoMovieRigidTransform>,
        step: number,
      ): IAutoMoviePhysicalSimulationInput.ITarget => {
        if (step === 0 || step > props.end)
          return { strength: 1, segments, dynamicSegments: closure(new Set()) };
        if (step >= release) return { strength: 0, segments };
        const struck: Set<string> = new Set(
          props.impulses
            .filter(
              (impulse: planHumanSimulationBody.IImpulse): boolean =>
                impulse.body === props.subject && impulse.step <= step,
            )
            .map(
              (impulse: planHumanSimulationBody.IImpulse): string =>
                impulse.bone,
            ),
        );
        const bindings: IAutoMoviePhysicalContactBinding[] = [];
        for (const grip of own)
          if (
            grip.from <= step &&
            step <= grip.to &&
            step < props.releases.get(grip.partner)!
          ) {
            for (const bone of grip.chain) struck.add(bone);
            bindings.push({
              id: `grip-${grip.side}-${grip.partner}`,
              kind: "contact",
              chain: [...grip.chain],
              source: { ...grip.source },
              target: { body: grip.partner, ...grip.target },
              weight: 1,
              compression: 0,
              iterations: planHumanSimulationBody.ITERATIONS,
              tolerance: planHumanSimulationBody.CONTACT_TOLERANCE,
            });
          }
        const group: string | undefined = props.groups
          .get(step)
          ?.get(props.subject);
        return {
          strength: 1,
          segments,
          dynamicSegments: closure(struck),
          ...(bindings.length === 0 ? {} : { bindings }),
          ...(group === undefined ? {} : { coupledGroup: group }),
        };
      },
    );
  return {
    id: props.subject,
    profile,
    mode: props.mode,
    targets,
    handoffSeconds: planHumanSimulationBody.HANDOFF,
    handoffLimits: {
      maximumLinearError: planHumanSimulationBody.CONTACT_TOLERANCE,
      maximumJointViolation: (ROM_TOLERANCE * Math.PI) / 180,
    },
    rootStiffness: 0,
    rootDamping: 0,
    maximumRootForce: 0,
    complianceSeconds: 0,
    complianceStrength: 1,
    compensateGravity: true,
  };
}

/** Companion types and constants of {@link planHumanSimulationBody}. */
export namespace planHumanSimulationBody {
  /** Seconds a physical subtree takes to return to authored motion: the engine's documented default (`IAutoMoviePhysicalSimulationInput.IBody.handoffSeconds`). */
  export const HANDOFF: number = 0.2;

  /** The engine's default native contact tolerance, metres (`IAutoMoviePhysicalSimulationInput.IInput.contactTolerance`), the residual a binding fit may stop at. */
  export const CONTACT_TOLERANCE: number = 0.0001;

  /** Bounded geometric updates per binding fit: the engine's admitted maximum (`IAutoMoviePhysicalContactBinding.iterations`). */
  export const ITERATIONS: number = 32;

  /** An impulse already placed on the window's grid. */
  export interface IImpulse {
    /** The step whose opening boundary it lands on, 1 to the window's interval count. */
    step: number;

    /** The struck performer. */
    body: string;

    /** The struck profile segment. */
    bone: string;
  }

  /** What one performer's body is planned from. */
  export interface IProps {
    /** The performer, the body's id. */
    subject: string;

    /** The performer's body. */
    body: IAutoMovieMotionHumanBody;

    /** The window's mode. */
    mode: IAutoMoviePerformanceMode;

    /** The sampled world segment poses, steps 0 to the interval count. */
    targets: readonly Record<string, IAutoMovieRigidTransform>[];

    /** Every impulse of the window. */
    impulses: readonly IImpulse[];

    /** Every grip of the window. */
    grips: readonly bindHumanSimulationGrips.IGrip[];

    /** Each simulated performer's release step; past the interval count for one never released. */
    releases: ReadonlyMap<string, number>;

    /** Coupled-group label by step, then by performer. */
    groups: ReadonlyMap<number, ReadonlyMap<string, string>>;

    /** The last step the solver may own a segment; later steps hand back. */
    end: number;
  }
}

/** Code-unit order of two ids, the deterministic order of a label. */
function ordinal(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
