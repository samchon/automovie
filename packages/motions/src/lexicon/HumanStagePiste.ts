import { AutoMovieComposition } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieChain,
  IAutoMovieComposition,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanStageBladeFootwork,
  IAutoMovieMotionHumanSword,
  IAutoMovieMotionHumanSwordParry,
  IAutoMovieMotionTarget,
  IAutoMovieSchedule,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";

import { HumanChain } from "../HumanChain";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanBlade } from "./HumanBlade";
import { HumanPisteTarget } from "./HumanPisteTarget";
import { stageBladeFootwork } from "./stageBladeFootwork";

/**
 * A two-performer bout on a piste or a kendo court: from their opening
 * marks both close the distance in advances of the weapon's own footwork,
 * then the first attacks and the screenplay's result decides the exchange. A touch for the first lands its
 * attack; one for the second has the attack parried and the second riposte;
 * the epee's double touch lands both attacks at one instant, each blade
 * following the other performer as it lunges; no touch has the
 * attack parried and left there. The result is announced at the decisive
 * instant of the touch that scores, or of the parry that closes the attack.
 *
 * The rules are checked before anything is placed. A touch must aim at the
 * weapon's valid target (FIE Technical Rules): the foil's trunk, every region
 * for the epee, and for the sabre every region above the waist. A kendo
 * strike must aim at a struck region of the opponent's armour (FIK, The
 * Regulations of Kendo Shiai and Shinpan, Articles 12 and 14): the men, the
 * kote, either side of the do or the tsuki. Only the epee scores a double
 * touch. Register stageBladeFootwork and the HumanBlade rows when playing the
 * take; the blade actions refuse a target out of reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the bout's phases, the result's branches and their actions, the announced instant, the rule checks and the required laws.
 * @evidence contracts/development/design.md#principled-representation The take holds each performer's chain, marks, blade and target, the shared clock of the footwork and the scripted result; the placed record pairs the composition with its result reader.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Uses HumanChain, the stageBladeFootwork law and the HumanBlade rows; keeps the result reading in the same public namespace and the target rule in HumanPisteTarget.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The weapons and results are closed literals; the outcome is the script's, and the blade actions own reach and contact.
 */
export namespace HumanStagePiste {
  /**
   * The weapon of the bout.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the three fencing weapons and kendo.
   * @evidence contracts/development/design.md#principled-representation Four explicit literals, each with its footwork, attack and target rule.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by compose for the footwork style, the attack, the reply and the target rule.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller chooses the weapon. No props are guessed or created.
   */
  export type Kind = "foil" | "epee" | "sabre" | "kendo";

  /**
   * The result the screenplay gives the two performers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the performer or performers the touch is awarded to.
   * @evidence contracts/development/design.md#principled-representation A touch for either performer, a double touch and no touch are distinct literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Chooses the exchange's actions and the announced result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The script supplies the outcome before either performer is placed.
   */
  export type Result = "first" | "second" | "both" | "none";

  /**
   * One performer's preparation, marks, blade and target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the preparatory chain, the body-relative mark shift in metres, the held blade and the target.
   * @evidence contracts/development/design.md#principled-representation One existing chain, a stage direction with a positive distance, the held blade's prop subject and a motion target.
   * @evidence contracts/development/design.md#minimal-and-owned-surface compose reads every member: the shift from the first four, the attack or reply from the blade and target.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Props and preparatory actions stay in the caller's own chain; the blade must already be held when the exchange starts.
   */
  export interface IActor {
    /** Chain that prepares the performer on its opening mark, the blade taken in hand. */
    chain: IAutoMovieMotionHumanChainCore;

    /** Direction of the mark shift from the performer's heading on its opening mark. */
    direction: IAutoMovieMotionHumanStageBladeFootwork.Direction;

    /** Forward lead, or the lead read by the footwork law when omitted. */
    lead?: AutoMovieHumanSide;

    /** Positive horizontal distance the performer's approach covers to its lunging mark, in metres, in advances of at most `ADVANCE`. */
    distance: number;

    /** The held blade's prop subject. */
    blade: string;

    /** Where this performer's attack or reply lands on the other: a body region for fencing, a struck point of the worn armour for kendo. */
    target: IAutoMovieMotionTarget;
  }

  /**
   * Two performers, the footwork's clock and the screenplay's result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the anchor, time and length units, the optional editing cue and the optional spacing check.
   * @evidence contracts/development/design.md#principled-representation A closed result independent of the two performers' marks and targets, with the footwork's duration in seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface compose uses each input to place the shift, check the spacing and the rules, and choose the exchange.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reserved space is an authored bound on travel between the floor marks. Physical pose remains the motion laws' responsibility.
   */
  export interface ITake {
    /** Unique prefix of the bout's schedule anchors. */
    anchor: string;

    /** The weapon. */
    kind: Kind;

    /** The performer who attacks first. */
    first: IActor;

    /** The performer who answers. */
    second: IActor;

    /** Positive common duration of each advance of the approach, in seconds. */
    duration: number;

    /** Share in [0, 1] of the shift's duration for its `propCue` editing event; none when absent. */
    cue?: number;

    /** Scripted result of the exchange. */
    result: Result;

    /** Optional opening separation and minimum reserve between the floor marks, both in metres. */
    reserve?: readonly [opening: number, minimum: number];
  }

  /**
   * The screenplay's result at its actual film time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the unit and reference of its time.
   * @evidence contracts/development/design.md#principled-representation Film seconds and the closed scripted result.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by the take's reader for editing and playback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No computed score is embedded in the record.
   */
  export interface IAnnouncement {
    /** Absolute film seconds of the decisive instant that scores or closes the exchange. */
    seconds: number;

    /** Result from the screenplay. */
    result: Result;
  }

  /**
   * The composition to place and its result reader.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the composition and the reader's presence condition.
   * @evidence contracts/development/design.md#principled-representation The reader receives the placed schedule and reads the deciding action from it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A caller places the composition, then reads the result through this record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing or cut deciding action, or a double touch outside the epee's window, yields no result.
   */
  export interface IPlaced {
    /** The shift and then the exchange, both preparatory chains included. */
    composition: IAutoMovieComposition.ISequence;

    /** Reads the result only when its deciding action was placed whole within its span. */
    announced: (schedule: IAutoMovieSchedule) => IAnnouncement | undefined;
  }

  /** A performer's part in the bout. */
  type Role = "first" | "second";

  /** Explicit weapon names admitted at the SDK boundary. */
  const KINDS: readonly Kind[] = ["foil", "epee", "sabre", "kendo"];

  /**
   * The longest gap between two touches the epee scores as a double touch,
   * seconds: the lower end of the 40 to 50 ms the FIE sets for its apparatus.
   */
  export const DOUBLE: number = 0.04;

  /** The weapon's attack: a thrust lunged for the point weapons, a cut otherwise. */
  const ATTACK: Readonly<Record<Kind, string>> = {
    foil: HumanBlade.lunge.name,
    epee: HumanBlade.lunge.name,
    sabre: HumanBlade.cut.name,
    kendo: HumanBlade.cut.name,
  };

  /** The weapon's answer out of a parry: a riposte for the point weapons, a cut otherwise. */
  const REPLY: Readonly<Record<Kind, string>> = {
    foil: HumanBlade.riposte.name,
    epee: HumanBlade.riposte.name,
    sabre: HumanBlade.cut.name,
    kendo: HumanBlade.cut.name,
  };

  /** The advance a cut is carried by: the sabre's lunge, kendo's stepping strike. */
  const CARRY: Readonly<
    Partial<Record<Kind, IAutoMovieMotionHumanSword.IAttack["advance"]>>
  > = { sabre: "lunge", kendo: "step" };

  /**
   * The longest single advance of the approach, metres: about one foot's
   * length, the fencing advance's step (provisional), inside the footwork
   * law's longest mark shift for every canonical body.
   */
  export const ADVANCE: number = 0.3;

  /** One advance of the approach: the take, its index and the advances' count. */
  interface IAdvance {
    /** The bout. */
    take: ITake;

    /** This advance's index from 0. */
    index: number;

    /** How many advances cover each performer's approach. */
    count: number;
  }

  /** Each advance shifts both performers on one clock, each its share of its approach. */
  const SHIFT: IAutoMovieMotionHumanMutual<IAdvance, Role> = {
    name: "stagePiste",
    roles: ["first", "second"],
    act: (role, advance): IAutoMovieMotionHumanMutual.IAct => {
      const { take, index, count }: IAdvance = advance;
      const { direction, distance, lead }: IActor = take[role];
      const params: IAutoMovieMotionHumanStageBladeFootwork.IParams = {
        style: take.kind,
        direction,
        distance: distance / count,
        duration: take.duration,
        ...(take.cue === undefined || index > 0 ? {} : { propCue: take.cue }),
        ...(lead === undefined ? {} : { lead }),
      };
      return { name: stageBladeFootwork.name, params };
    },
  };

  /**
   * Check the take against the weapon's rules, then close each performer's
   * approach in equal advances of at most `ADVANCE`, both stepping on each
   * advance's one clock, and append the exchange the result calls for.
   * The optional reserve requires enough opening space for both full
   * translations and the remaining space stated in the screenplay.
   *
   * @param take The cast, blocking, time, reserved space, targets and result.
   * @returns The composition and its result reader.
   * @throws {HumanRefusal} When the weapon, a number, the reserved space, a target or the result breaks the take's rules.
   * @throws {Error} When the anchor is blank or one performer takes both roles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the phases, the result's branches, the required space and the refusal cases.
   * @evidence contracts/development/implementation.md#principled-implementation The rules are the weapon's valid target and double-touch rule; each full planned translation is subtracted from the opening distance for a conservative reserve. HumanChain places the advances, and the registered blade actions, synchronised on the attack's decisive instant, place the exchange.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the weapon, numbers and rules, place the approach's advances, then the exchange and its reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Cast, timing, marks, targets and outcome come from the script; reach, the parry's meeting and every pose belong to the blade actions.
   * @evidence contracts/development/implementation.md#efficient-algorithms Validation reads fixed input fields and constant sets, placement builds two intents per advance and at most three for the exchange, and the reader scans the schedule's entries for at most two anchors.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanChain.mutual, the HumanBlade rows, HumanBound and the registered stageBladeFootwork.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader captures the anchors and the result, with no frame cache or native resource.
   */
  export function compose(take: ITake): IPlaced {
    if (take.anchor.trim().length === 0)
      throw new Error("Give the staged bout a nonblank anchor");
    if (!KINDS.includes(take.kind))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "stageKind",
        value: take.kind,
        reason: "the bout needs a fencing weapon or kendo",
        fix: "choose foil, epee, sabre or kendo",
      });
    if (take.result === "both" && take.kind !== "epee")
      throw new HumanRefusal({
        kind: "rule",
        axis: "result",
        value: take.result,
        reason: `the ${take.kind} awards one touch at a time; only the epee scores a double touch`,
        fix: "award the touch to one performer or to neither",
      });
    HumanBound.above("duration", take.duration, 0, "s");
    if (take.cue !== undefined) HumanBound.within("cue", take.cue, 0, 1);
    HumanBound.above("first.distance", take.first.distance, 0, "m");
    HumanBound.above("second.distance", take.second.distance, 0, "m");
    if (take.reserve !== undefined) {
      const [opening, minimum]: readonly [number, number] = take.reserve;
      HumanBound.above("openingSpace", opening, 0, "m");
      HumanBound.least("minimumReserve", minimum, 0, "m");
      HumanBound.least(
        "stageClearance",
        opening - take.first.distance - take.second.distance,
        minimum,
        "m",
      );
    }
    HumanPisteTarget(take.kind, "first.target", take.first.target);
    HumanPisteTarget(take.kind, "second.target", take.second.target);

    // The approach closes each performer's distance in equal advances of at
    // most ADVANCE, both performers stepping on each advance's one clock.
    const count: number = Math.max(
      1,
      Math.ceil(Math.max(take.first.distance, take.second.distance) / ADVANCE),
    );
    const approach: IAutoMovieChain[] = [];
    for (let index: number = 0; index < count; ++index)
      approach.push(
        HumanChain.mutual(
          SHIFT,
          index === 0
            ? { first: take.first.chain, second: take.second.chain }
            : {
                first: HumanChain.subject(take.first.chain.subject),
                second: HumanChain.subject(take.second.chain.subject),
              },
          { take, index, count },
          index === 0 ? take.anchor : `${take.anchor}.${index}`,
        ),
      );
    const exchange: IAutoMovieChain = bout(take);
    const anchors: IAnchors = deciding(take);
    return {
      composition: AutoMovieComposition.sequence(...approach, exchange),
      announced: (schedule: IAutoMovieSchedule): IAnnouncement | undefined => {
        const at: number | undefined = decisive(schedule, anchors.decides);
        if (at === undefined) return undefined;
        if (anchors.with !== undefined) {
          const other: number | undefined = decisive(schedule, anchors.with);
          if (other === undefined || Math.abs(other - at) > DOUBLE)
            return undefined;
        }
        return { seconds: at, result: take.result };
      },
    };
  }

  /** The anchors whose decisive instants decide the result. */
  interface IAnchors {
    /** The action that scores or closes the exchange. */
    decides: string;

    /** The second touch of a double touch. */
    with?: string;
  }

  /** The anchors of the deciding actions of a take. */
  function deciding(take: ITake): IAnchors {
    switch (take.result) {
      case "first":
        return { decides: `${take.anchor}.attack` };
      case "second":
        return { decides: `${take.anchor}.reply` };
      case "both":
        return {
          decides: `${take.anchor}.attack`,
          with: `${take.anchor}.counter`,
        };
      case "none":
        return { decides: `${take.anchor}.parry` };
    }
  }

  /** The exchange after the shift, as the result calls for it. */
  function bout(take: ITake): IAutoMovieChain {
    const { anchor, kind, first, second } = take;
    const carry: IAutoMovieMotionHumanSword.IAttack["advance"] = CARRY[kind];
    const strike = (
      actor: IActor,
      outcome: IAutoMovieMotionHumanSword.IAttack["outcome"],
    ): IAutoMovieMotionHumanSword.IAttack => ({
      blade: actor.blade,
      target: actor.target,
      outcome,
      ...(carry === undefined ? {} : { advance: carry }),
    });
    const attacker: IAutoMovieMotionHumanChainCore = HumanChain.subject(
      first.chain.subject,
    );
    const answerer: IAutoMovieMotionHumanChainCore = HumanChain.subject(
      second.chain.subject,
    );
    const attack: string = `${anchor}.attack`;
    const lands: boolean = take.result === "first" || take.result === "both";
    const opening: IAutoMovieMotionHumanChainCore = attacker.registered(
      ATTACK[kind],
      strike(first, lands ? "lands" : "parried"),
      attack,
    );
    if (take.result === "first") return opening;
    if (take.result === "both")
      return opening.with(
        answerer
          .registered(
            ATTACK[kind],
            strike(second, "lands"),
            `${anchor}.counter`,
          )
          .sync({ of: attack, align: "stroke" }),
      );
    const parry: IAutoMovieMotionHumanSwordParry.IParry = {
      blade: second.blade,
      against: attack,
    };
    const closed: IAutoMovieMotionHumanChainCore = answerer
      .registered(HumanBlade.parry.name, parry, `${anchor}.parry`)
      .sync({ of: attack, align: "stroke" });
    if (take.result === "none") return opening.with(closed);
    const reply: IAutoMovieMotionHumanSword.IAttack = {
      blade: second.blade,
      target: second.target,
      ...(carry === undefined ? {} : { advance: carry }),
    };
    return opening.with(
      closed.registered(REPLY[kind], reply, `${anchor}.reply`),
    );
  }

  /** Read a placed action's decisive instant while it lies within its span. */
  function decisive(
    schedule: IAutoMovieSchedule,
    anchor: string,
  ): number | undefined {
    const entry: IAutoMovieScheduleEntry | undefined = schedule.entries.find(
      (row): boolean => row.intent.anchor === anchor,
    );
    if (entry === undefined) return undefined;
    const at: number | undefined =
      entry.contact ??
      entry.events?.find((row): boolean => row.name === "stroke")?.seconds;
    return at !== undefined &&
      at >= entry.start - 1e-9 &&
      at <= entry.end + 1e-9
      ? at
      : undefined;
  }
}
