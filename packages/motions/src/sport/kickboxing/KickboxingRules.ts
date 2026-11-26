import type {
  AutoMovieHumanoidRegion,
  IAutoMovieCheckLegality,
  IAutoMovieMotionTarget,
  IAutoMovieSchedule,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";

/**
 * The kickboxing ruleset a performance's schedule must keep, in the engine's
 * `checkAutoMovieLegality` form, for the motions vocabulary's `punch`, `kick`,
 * `defend` and `knockdown` actions.
 *
 * From the GLORY Official Rules V2.2, §5.07 (as inspected in the kickboxing
 * research): elbows, throws and sweeps are banned, so only punches, round
 * kicks, push kicks and knees strike (A.7, A.10); strikes to the back of the
 * head or the back (A.2) and to the groin (A.3) are fouls, and no other target
 * is, the throat included; a linear kick to the legs is a foul, so a push kick
 * may only strike the body (A.4: "an Athlete may only attack the legs with
 * kicks that arc"); the clinch allows one immediate knee, so a knee may not
 * touch another strike of the same fighter (A.11); and no downed opponent may
 * be attacked. A strike at a performer who is down (between the start of their
 * knockdown and the start of their next action) breaks the last rule.
 *
 * Fighting style choices such as "kicks finish combinations" are not rules and
 * are not checked here.
 */
export namespace KickboxingRules {
  /**
   * Regions a strike may not target (GLORY §5.07 A.2 the back of the head or
   * the back, A.3 the groin).
   */
  export const FOUL_REGIONS: ReadonlySet<AutoMovieHumanoidRegion> =
    new Set<AutoMovieHumanoidRegion>([
      "headBack",
      "nape",
      "upperBack",
      "lowerBack",
      "kidneyLeft",
      "kidneyRight",
      "groin",
    ]);

  /** Leg regions a linear kick may not target. */
  export const LEG_REGIONS: ReadonlySet<AutoMovieHumanoidRegion> =
    new Set<AutoMovieHumanoidRegion>([
      "thighFrontLeft",
      "thighFrontRight",
      "thighOuterLeft",
      "thighOuterRight",
      "thighInnerLeft",
      "thighInnerRight",
      "kneeLeft",
      "kneeRight",
      "shinLeft",
      "shinRight",
      "calfLeft",
      "calfRight",
    ]);

  /**
   * Why a strike's parameters are a foul, or null when they are legal.
   *
   * @param capability The action's name.
   * @param params Its parameters.
   * @returns The reason, or null.
   */
  export function foul(capability: string, params: object): string | null {
    if (
      capability !== "punch" &&
      capability !== "kick" &&
      capability !== "knee"
    )
      return null;
    const p: IFoulP = params as IFoulP2;
    if (p.at?.kind !== "person") return null;
    if (FOUL_REGIONS.has(p.at.region))
      return `a strike at the ${p.at.region} is a foul`;
    if (
      capability === "kick" &&
      p.technique === "push" &&
      LEG_REGIONS.has(p.at.region)
    )
      return `a linear kick at the ${p.at.region} is a foul`;
    return null;
  }

  /** The rules. */
  export const rules: readonly IAutoMovieCheckLegality.IRule[] = Object.freeze([
    {
      id: "single-clinch-knee",
      check: (
        entry: IAutoMovieScheduleEntry,
        schedule: IAutoMovieSchedule,
      ): string | null => {
        if (entry.intent.capability !== "knee") return null;

        // GLORY A.11: the clinch allows one immediate knee, then the athlete
        // disengages; another strike touching the knee keeps the clinch.
        const touching: boolean = schedule.entries.some(
          (other: IAutoMovieScheduleEntry): boolean =>
            other !== entry &&
            other.subject === entry.subject &&
            (other.intent.capability === "knee" ||
              other.intent.capability === "punch" ||
              other.intent.capability === "kick") &&
            (Math.abs(other.end - entry.start) < 1e-6 ||
              Math.abs(entry.end - other.start) < 1e-6),
        );
        return touching
          ? `knee ${entry.index} is not a single clinch knee`
          : null;
      },
    },
    {
      id: "legal-target",
      check: (entry: IAutoMovieScheduleEntry): string | null => {
        const reason: string | null = foul(
          entry.intent.capability,
          params(entry),
        );
        return reason === null ? null : `entry ${entry.index}: ${reason}`;
      },
    },
    {
      id: "no-attack-on-a-downed-opponent",
      check: (
        entry: IAutoMovieScheduleEntry,
        schedule: IAutoMovieSchedule,
      ): string | null => {
        if (
          entry.intent.capability !== "punch" &&
          entry.intent.capability !== "kick" &&
          entry.intent.capability !== "knee"
        )
          return null;
        const at: IAutoMovieMotionTarget | undefined = (
          params(entry) as IRulesAt
        ).at;
        if (at?.kind !== "person") return null;
        const down: IAutoMovieScheduleEntry | undefined = schedule.entries.find(
          (other: IAutoMovieScheduleEntry): boolean => {
            if (
              other.subject !== at.subject ||
              other.intent.capability !== "knockdown" ||
              other.start > entry.start
            )
              return false;
            // The fallen fighter's next action, the earliest of theirs after
            // the knockdown whatever order the schedule lists them in.
            let next: number = Infinity;
            for (const later of schedule.entries)
              if (
                later.subject === at.subject &&
                later.start > other.start &&
                later.index !== other.index
              )
                next = Math.min(next, later.start);
            return entry.start < next;
          },
        );
        return down === undefined
          ? null
          : `entry ${entry.index} strikes ${at.subject}, who is down since ${down.start.toFixed(2)} s`;
      },
    },
  ]);

  /** An entry's action parameters. */
  function params(entry: IAutoMovieScheduleEntry): object {
    return (entry.intent.parameters?.params as object | undefined) ?? {};
  }
}

/** The record of `IRulesAt`'s site. */
type IRulesAt = { at?: IAutoMovieMotionTarget };

/** The record of `IFoulP2`'s site. */
type IFoulP2 = {
  at?: IAutoMovieMotionTarget;
  technique?: string;
};

/** The record of `IFoulP`'s site. */
type IFoulP = { at?: IAutoMovieMotionTarget; technique?: string };
