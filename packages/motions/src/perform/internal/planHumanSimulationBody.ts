import { ROM_TOLERANCE } from "@automovie/engine";
import type {
  IAutoMoviePerformanceMode,
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import type { bindHumanSimulationGrips } from "./bindHumanSimulationGrips";

/**
 * One performer of a simulated window as a body of the engine's input: its
 * sampled poses as targets, and at each step which of its segments the solver
 * owns and how strongly they track.
 *
 * The root stays authored throughout: the kinematic laws own where the body
 * stands, steps and balances. A segment becomes physical only where something
 * physical reaches it: from the step an impulse lands on it, its subtree tracks
 * its sampled poses with the profile's bounded joint motors until the window
 * hands back; while it grips a simulated partner, the gripping arm's chain and
 * the hand's carrier track the grip as the solver's collider binding, fitted
 * together with the partner's when both grip each other (a coupled group). A
 * performer the window releases (a fall, or `released`) is wholly physical with
 * its tracking withdrawn from its release step, a passive body under gravity,
 * contact and its joints' limits. Gravity on a tracked subtree is compensated,
 * as the muscles hold a limb's own weight, so tracking error is the response to
 * what struck it, not sag. When the window hands back, every segment returns to
 * authored motion over the last `handoff` seconds through the engine's
 * continuous return.
 *
 * The struck set and the bindings change only at an impulse, a grip's first and
 * past-last steps and a partner's release, so the window is cut at those steps
 * once, and each span's physical subtree and bindings are built once and shared
 * by its steps.
 *
 * @param props The performer, its solved profile and samples, the mode and the
 *   window's schedule.
 * @returns The engine body.
 */
export function planHumanSimulationBody(
  props: planHumanSimulationBody.IProps,
): IAutoMoviePhysicalSimulationInput.IBody {
  const profile: IAutoMoviePhysicalProfile = props.profile;
  const children: Map<string, string[]> = new Map();
  for (const joint of profile.joints)
    children.set(joint.parent, [
      ...(children.get(joint.parent) ?? []),
      joint.child,
    ]);
  const root: string = profile.segments.find(
    (segment: IAutoMoviePhysicalSegment): boolean =>
      !profile.joints.some(
        (joint: IAutoMoviePhysicalJoint): boolean =>
          joint.child === segment.bone,
      ),
  )!.bone;

  // The subtrees below a set of bones, the root excepted, in code-unit order.
  const closure = (bones: ReadonlySet<string>): string[] => {
    const found: Set<string> = new Set();
    const visit = (bone: string): void => {
      if (found.has(bone)) return;
      found.add(bone);
      for (const child of children.get(bone) ?? []) visit(child);
    };
    for (const bone of bones) if (bone !== root) visit(bone);
    return [...found].sort(ordinal);
  };
  const own: readonly bindHumanSimulationGrips.IGrip[] = props.grips.filter(
    (grip: bindHumanSimulationGrips.IGrip): boolean =>
      grip.subject === props.subject,
  );
  const release: number = props.releases.get(props.subject)!;

  // Whether a grip binds at a step: inside its span, its partner not yet
  // released.
  const binds = (grip: bindHumanSimulationGrips.IGrip, step: number): boolean =>
    grip.from <= step &&
    step <= grip.to &&
    step < props.releases.get(grip.partner)!;

  // The steps where the struck set or the bindings can change, each the first
  // step of a span.
  const cuts: number[] = [
    ...new Set<number>([
      1,
      ...props.impulses
        .filter(
          (impulse: planHumanSimulationBody.IImpulse): boolean =>
            impulse.body === props.subject,
        )
        .map((impulse: planHumanSimulationBody.IImpulse): number =>
          Math.max(1, impulse.step),
        ),
      ...own.flatMap((grip: bindHumanSimulationGrips.IGrip): number[] => [
        Math.max(1, grip.from),
        grip.to + 1,
        props.releases.get(grip.partner)!,
      ]),
    ]),
  ].sort((a: number, b: number): number => a - b);
  const spans: planHumanSimulationBody.ISpan[] = cuts.map(
    (first: number): planHumanSimulationBody.ISpan => {
      const struck: Set<string> = new Set(
        props.impulses
          .filter(
            (impulse: planHumanSimulationBody.IImpulse): boolean =>
              impulse.body === props.subject && impulse.step <= first,
          )
          .map(
            (impulse: planHumanSimulationBody.IImpulse): string => impulse.bone,
          ),
      );
      const bindings: IAutoMoviePhysicalContactBinding[] = [];
      for (const grip of own)
        if (binds(grip, first)) {
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
      return { first, dynamicSegments: closure(struck), bindings };
    },
  );
  const still: string[] = closure(new Set());

  // The span a step lies in: the last whose first step is at or before it.
  let span: number = 0;
  const targets: IAutoMoviePhysicalSimulationInput.ITarget[] =
    props.targets.map(
      (
        segments: Record<string, IAutoMovieRigidTransform>,
        step: number,
      ): IAutoMoviePhysicalSimulationInput.ITarget => {
        if (step === 0 || step > props.end)
          return { strength: 1, segments, dynamicSegments: still };
        if (step >= release) return { strength: 0, segments };
        while (span + 1 < spans.length && spans[span + 1]!.first <= step)
          span++;
        const at: planHumanSimulationBody.ISpan = spans[span]!;
        const group: string | undefined = props.groups
          .get(step)
          ?.get(props.subject);
        return {
          strength: 1,
          segments,
          dynamicSegments: at.dynamicSegments,
          ...(at.bindings.length === 0 ? {} : { bindings: at.bindings }),
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
  /**
   * Seconds a physical subtree takes to return to authored motion: the engine's
   * documented default
   * (`IAutoMoviePhysicalSimulationInput.IBody.handoffSeconds`).
   */
  export const HANDOFF: number = 0.2;

  /**
   * The engine's default native contact tolerance, metres
   * (`IAutoMoviePhysicalSimulationInput.IInput.contactTolerance`), the residual
   * a binding fit may stop at.
   */
  export const CONTACT_TOLERANCE: number = 0.0001;

  /**
   * Bounded geometric updates per binding fit: the engine's admitted maximum
   * (`IAutoMoviePhysicalContactBinding.iterations`).
   */
  export const ITERATIONS: number = 32;

  /** An impulse already placed on the window's grid. */
  export interface IImpulse {
    /**
     * The step whose opening boundary it lands on, 1 to the window's interval
     * count.
     */
    step: number;

    /** The struck performer. */
    body: string;

    /** The struck profile segment. */
    bone: string;
  }

  /**
   * The steps from one cut to the next, over which the solver owns the same
   * segments under the same bindings.
   */
  export interface ISpan {
    /** The span's first step. */
    first: number;

    /** The segments the solver owns, in code-unit order. */
    dynamicSegments: string[];

    /** The grips bound over the span. */
    bindings: IAutoMoviePhysicalContactBinding[];
  }

  /** What one performer's body is planned from. */
  export interface IProps {
    /** The performer, the body's id. */
    subject: string;

    /**
     * The profile the window solves for the performer, welded as
     * `weldHumanSimulationProfile` welds it.
     */
    profile: IAutoMoviePhysicalProfile;

    /** The window's mode. */
    mode: IAutoMoviePerformanceMode;

    /** The sampled world segment poses, steps 0 to the interval count. */
    targets: readonly Record<string, IAutoMovieRigidTransform>[];

    /** Every impulse of the window. */
    impulses: readonly IImpulse[];

    /** Every grip of the window. */
    grips: readonly bindHumanSimulationGrips.IGrip[];

    /**
     * Each simulated performer's release step; past the interval count for one
     * never released.
     */
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
