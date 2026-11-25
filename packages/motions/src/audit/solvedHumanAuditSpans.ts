import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSimulation,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalOwnershipEvent,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";

import { splitSolvedHumanAuditSpan } from "./splitSolvedHumanAuditSpan";
import { subtractHumanAuditInterval } from "./subtractHumanAuditInterval";

/**
 * A person's placed actions as the audit reads them where windows of the
 * performance were solved (`HumanPerformance.simulate`): inside a window, the
 * parts the solver owns are judged by the solver's contacts, not by the plants
 * their action declared.
 *
 * A declared plant says where a kinematic law holds a part; once the solver
 * owns the part, the law no longer moves it, so the plant describes nothing the
 * film shows. Each action overlapping the span where the solver owns some of
 * the person's segments is read in three pieces: before and after the span as
 * declared, and inside it with the owned parts' declared windows removed and
 * the solver's contact episodes of the person (`IAutoMovieContactReceipt`) with
 * the floor and the props added as bearing windows (`bear`). A bearing window
 * holds a foot at its loaded range and lets the floor be read under it, but
 * asserts no plant: the solver's Coulomb friction decides whether a contact
 * slides. Where the solver owns the root, the inside piece takes no balance
 * judgement (`physical: false`): the solver's dynamics are the body's balance.
 * Every check that reads only the displayed bones (floor, tangle, range,
 * continuity, partner) reads the pieces as before.
 *
 * @param spans The person's placed actions, film seconds.
 * @param subject The person.
 * @param body The person's body, for its regions.
 * @param simulations The performance's solved windows.
 * @returns The actions as the audit reads them.
 */
export function solvedHumanAuditSpans(
  spans: readonly IAutoMovieMotionHumanAuditMotion.ISpan[],
  subject: string,
  body: IAutoMovieMotionHumanBody,
  simulations: readonly IAutoMovieMotionHumanSimulation[],
): IAutoMovieMotionHumanAuditMotion.ISpan[] {
  let read: IAutoMovieMotionHumanAuditMotion.ISpan[] = [...spans];
  for (const record of simulations) {
    const owned: solvedHumanAuditSpans.IOwned | null =
      solvedHumanAuditSpans.owned(record, subject);
    if (owned === null) continue;
    const solved: IContact[] = contacts(record, subject);
    read = read.flatMap(
      (
        span: IAutoMovieMotionHumanAuditMotion.ISpan,
      ): IAutoMovieMotionHumanAuditMotion.ISpan[] =>
        splitSolvedHumanAuditSpan(
          span,
          owned,
          solved,
          (window: IAutoMovieMotionHumanContactWindow): boolean =>
            bones(window, body).some((bone: string): boolean =>
              owned.bones.has(bone),
            ),
        ),
    );
  }
  return read;
}

/** Companion types and readers of {@link solvedHumanAuditSpans}. */
export namespace solvedHumanAuditSpans {
  /** Where and what of a person a solved window owns. */
  export interface IOwned {
    /** First film second the solver owns a segment of the person. */
    from: number;

    /** Last film second it does, the window's end when it never hands back. */
    to: number;

    /** The segments it owns at some instant of the span. */
    bones: ReadonlySet<string>;

    /** Whether it owns the root segment, the body's whole support. */
    root: boolean;
  }

  /**
   * What of a person one solved window owns, from its ownership record.
   *
   * @param record The solved window.
   * @param subject The person.
   * @returns The owned span and segments; null when the window owns none of the
   *   person.
   */
  export function owned(
    record: IAutoMovieMotionHumanSimulation,
    subject: string,
  ): IOwned | null {
    const input: IAutoMoviePhysicalSimulationInput.IInput =
      record.simulation.input;
    const solved: IAutoMoviePhysicalSimulationInput.IBody | undefined =
      input.bodies.find(
        (candidate: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
          candidate.id === subject,
      );
    if (solved === undefined) return null;
    const events: readonly IAutoMoviePhysicalOwnershipEvent[] =
      record.simulation.cache.ownership.filter(
        (event: IAutoMoviePhysicalOwnershipEvent): boolean =>
          event.body === subject,
      );
    const taken: IAutoMoviePhysicalOwnershipEvent[] = events.filter(
      (event: IAutoMoviePhysicalOwnershipEvent): boolean =>
        event.kind !== "authored",
    );
    if (taken.length === 0) return null;
    const first: number = Math.min(
      ...taken.map(
        (event: IAutoMoviePhysicalOwnershipEvent): number => event.seconds,
      ),
    );
    const last: number = Math.max(
      ...taken.map(
        (event: IAutoMoviePhysicalOwnershipEvent): number => event.seconds,
      ),
    );
    const back: IAutoMoviePhysicalOwnershipEvent[] = events.filter(
      (event: IAutoMoviePhysicalOwnershipEvent): boolean =>
        event.kind === "authored" && event.seconds > last,
    );
    const root: string = solved.profile.segments.find(
      (segment: IAutoMoviePhysicalSegment): boolean =>
        !solved.profile.joints.some(
          (joint: IAutoMoviePhysicalJoint): boolean =>
            joint.child === segment.bone,
        ),
    )!.bone;
    const bones: Set<string> = new Set(
      taken.map(
        (event: IAutoMoviePhysicalOwnershipEvent): string => event.bone,
      ),
    );
    return {
      from: record.window.from + first,
      to:
        record.window.from +
        (back.length === 0
          ? input.duration
          : Math.min(
              ...back.map(
                (event: IAutoMoviePhysicalOwnershipEvent): number =>
                  event.seconds,
              ),
            )),
      bones,
      root: bones.has(root),
    };
  }

  /**
   * The parts of a film span where no solved window owns any of the named
   * segments of a person: the span less each window's owned span that takes one
   * of them, in order.
   *
   * @param simulations The performance's solved windows.
   * @param subject The person.
   * @param segments The segments asked about.
   * @param from First film second of the span.
   * @param to Last film second of the span.
   * @returns The unsolved parts, each a first and last film second.
   */
  export function unsolved(
    simulations: readonly IAutoMovieMotionHumanSimulation[],
    subject: string,
    segments: readonly string[],
    from: number,
    to: number,
  ): Interval[] {
    let pieces: Interval[] = [[from, to]];
    for (const record of simulations) {
      const taken: IOwned | null = owned(record, subject);
      if (
        taken === null ||
        !segments.some((bone: string): boolean => taken.bones.has(bone))
      )
        continue;
      pieces = subtractHumanAuditInterval(pieces, taken.from, taken.to);
    }
    return pieces;
  }

  /** A first and last film second. */
  export type Interval = readonly [number, number];

  /**
   * The canonical foot segments, whose unloaded range a solved window
   * supersedes.
   */
  export const FEET: readonly string[] = [
    "leftFoot",
    "rightFoot",
    "leftToes",
    "rightToes",
  ];
}

/** A solver contact episode of the person as a bearing window, film seconds. */
type IContact = splitSolvedHumanAuditSpan.IContact;

/**
 * The person's solver contact episodes with the floor and the props: what bears
 * the body; a grip on another person is a grip, not a bearing.
 */
function contacts(
  record: IAutoMovieMotionHumanSimulation,
  subject: string,
): IContact[] {
  const out: IContact[] = [];
  for (const receipt of record.simulation.cache.contacts)
    for (const [own, other] of [
      [receipt.a, receipt.b],
      [receipt.b, receipt.a],
    ] as const) {
      if (own.body !== subject) continue;
      const part: IAutoMovieMotionHumanContactWindow["part"] | undefined =
        PARTS[own.bone];
      const support: IAutoMovieMotionHumanContactWindow.Support | null =
        other.body === "floor"
          ? { kind: "ground" }
          : other.body.startsWith(PROP)
            ? { kind: "prop", subject: other.body.slice(PROP.length) }
            : null;
      if (part === undefined || support === null) continue;
      out.push({
        part,
        support,
        from: record.window.from + receipt.seconds,
        to: record.window.from + receipt.endSeconds,
      });
    }
  return out;
}

/**
 * The segments a contact window's part names: its region's bone, else the bones
 * the part spans.
 */
function bones(
  window: IAutoMovieMotionHumanContactWindow,
  body: IAutoMovieMotionHumanBody,
): readonly string[] {
  if (window.region !== undefined)
    return [body.surfaces.regions[window.region].bone];
  return Object.entries(PARTS)
    .filter(
      ([, part]: [
        string,
        IAutoMovieMotionHumanContactWindow["part"],
      ]): boolean => part === window.part,
    )
    .map(
      ([bone]: [string, IAutoMovieMotionHumanContactWindow["part"]]): string =>
        bone,
    );
}

/**
 * The id prefix of a prop's kinematic body in a solved window
 * (`placeHumanSimulationColliders`).
 */
const PROP: string = "prop:";

/** The contact part each canonical segment bears with. */
const PARTS: Readonly<
  Record<string, IAutoMovieMotionHumanContactWindow["part"]>
> = {
  hips: "seat",
  spine: "back",
  chest: "chest",
  neck: "head",
  head: "head",
  leftUpperArm: "leftUpperArm",
  rightUpperArm: "rightUpperArm",
  leftLowerArm: "leftLowerArm",
  rightLowerArm: "rightLowerArm",
  leftHand: "leftHand",
  rightHand: "rightHand",
  leftUpperLeg: "leftUpperLeg",
  rightUpperLeg: "rightUpperLeg",
  leftLowerLeg: "leftLowerLeg",
  rightLowerLeg: "rightLowerLeg",
  leftFoot: "leftFoot",
  leftToes: "leftFoot",
  rightFoot: "rightFoot",
  rightToes: "rightFoot",
};
