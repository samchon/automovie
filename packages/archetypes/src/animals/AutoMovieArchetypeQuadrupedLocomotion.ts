import { AutoMovieArchetypeRefusal } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { CamelGait } from "./camel/CamelGait";
import { DeerGait } from "./deer/DeerGait";
import type { QuadrupedChange } from "./quadruped/QuadrupedChange";
import { QuadrupedGaitAdmission } from "./quadruped/QuadrupedGaitAdmission";

/**
 * Builds camel and sika speed tables from authored periods and contact times
 * and validates complete caller-supplied gait tables.
 */
export namespace AutoMovieArchetypeQuadrupedLocomotion {
  /** One finite SI clock with separate fore and hind contact durations. */
  export interface IClock {
    /**
     * Positive speed in metres per second. Speeds increase strictly across
     * rows.
     */
    speed: number;
    /** Positive stride period in seconds with a finite reciprocal frequency. */
    stride: number;
    /** Positive fore contact seconds, strictly shorter than the stride. */
    foreStance: number;
    /** Positive hind contact seconds, strictly shorter than the stride. */
    hindStance: number;
  }

  /** Adds an authored running pace to the camel's observed walk. */
  export interface ICamel {
    /** One or more running-pace clocks in increasing speed order. */
    pace: readonly IClock[];
  }

  /** Supplies an authored sika trot, with an optional faster gallop. */
  export interface IDeerTrot {
    /** Required clocks for the diagonal trot, slowest first. */
    trot: readonly IClock[];
    /** Optional faster rotary-gallop clocks, slowest first. */
    gallop?: readonly IClock[];
  }

  /** Supplies an authored sika rotary gallop without a trot. */
  export interface IDeerGallop {
    /** Omit the trot to use the walk and rotary gallop. */
    trot?: undefined;
    /** Required clocks for the rotary gallop, slowest first. */
    gallop: readonly IClock[];
  }

  /**
   * Adds either or both of the authored sika trot and rotary gallop above
   * the walk.
   */
  export type IDeer = IDeerTrot | IDeerGallop;

  /**
   * Adds authored running-pace clocks above the measured camel walk.
   *
   * Left and right lateral pairs land one half stride apart. The pace uses
   * the walk's pose ranges and the caller's timing, with zero stride spread.
   *
   * @param params One or more pace clocks in increasing speed order.
   * @returns A validated absolute table with walk and pace.
   * @throws {AutoMovieArchetypeRefusal} For an empty or invalid authored
   *   clock sequence, including a pace that starts at or below the walk.
   */
  export function camel(
    params: ICamel,
  ): AutoMovieArchetypeQuadrupedGait.ITable {
    return admit({
      ...CamelGait.TABLE,
      order: ["walk", "pace"],
      gaits: {
        walk: CamelGait.TABLE.gaits.walk!,
        pace: authored(params.pace, PACE, CamelGait.TABLE.gaits.walk!, "pace"),
      },
    });
  }

  /**
   * Adds an authored diagonal trot, rotary gallop or both above the sika walk.
   *
   * Trot uses opposite diagonal pairs. The rotary phase order from left fore
   * is left hind, right hind and right fore. The faster gaits use the walk's
   * pose ranges. Their timing uses the caller's clocks with zero stride spread.
   *
   * @param params One or both nonempty authored gait sequences. Within each,
   *   clocks increase by speed. Trot starts below gallop when both are present.
   * @returns The validated absolute table containing the supplied gaits.
   * @throws {AutoMovieArchetypeRefusal} If both authored sequences are absent
   *   or the admitted clock or gait order is invalid.
   */
  export function deer(params: IDeer): AutoMovieArchetypeQuadrupedGait.ITable {
    if (params.trot === undefined && params.gallop === undefined)
      refuse("deer", params, "supply trot and/or rotary-gallop clocks");
    const order: AutoMovieArchetypeQuadrupedGait.Gait[] = ["walk"];
    const gaits: Partial<
      Record<
        AutoMovieArchetypeQuadrupedGait.Gait,
        AutoMovieArchetypeQuadrupedGait.IGait
      >
    > = {
      walk: DeerGait.TABLE.gaits.walk!,
    };
    if (params.trot !== undefined) {
      order.push("trot");
      gaits.trot = authored(params.trot, TROT, gaits.walk!, "trot");
    }
    if (params.gallop !== undefined) {
      order.push("gallop");
      gaits.gallop = authored(params.gallop, ROTARY, gaits.walk!, "gallop");
    }
    return admit({ ...DeerGait.TABLE, order, gaits });
  }

  /**
   * Validates and copies the clock and pose inputs for a complete gait table.
   *
   * Automatic gaits start at increasing speeds. Each after the slowest has
   * an entry rule, and explicit-only gaits have none. The four touchdown
   * phases lie below one, with left fore at zero.
   *
   * @param table Caller-owned gait table with declared clocks and pose inputs.
   * @returns An independent snapshot of the admitted table, including copied
   *   row, phase and pose records.
   * @throws {AutoMovieArchetypeRefusal} For invalid scalar measurements,
   *   gait choices, ordering, touchdown phases or transition rules.
   */
  export function admit(
    table: AutoMovieArchetypeQuadrupedGait.ITable,
  ): AutoMovieArchetypeQuadrupedGait.ITable {
    if (table.order.length === 0)
      refuse("table.order", table.order, "list at least one supported gait");
    positive(table.reference, "table.reference");
    nonnegative(table.hysteresis, "table.hysteresis");
    unit(table.follow.fore, "table.follow.fore");
    unit(table.follow.hind, "table.follow.hind");
    if (table.scaling !== undefined && table.scaling !== "absolute")
      refuse("table.scaling", table.scaling, "use absolute or omit scaling");
    const order: AutoMovieArchetypeQuadrupedGait.Gait[] = [];
    const explicit: AutoMovieArchetypeQuadrupedGait.Gait[] = [];
    const declared: readonly AutoMovieArchetypeQuadrupedGait.Gait[] = [
      ...table.order,
      ...(table.explicit ?? []),
    ];
    const gaits: Partial<
      Record<
        AutoMovieArchetypeQuadrupedGait.Gait,
        AutoMovieArchetypeQuadrupedGait.IGait
      >
    > = {};
    let previous: AutoMovieArchetypeQuadrupedGait.IGait | undefined;
    for (let index: number = 0; index < declared.length; index++) {
      const kind: AutoMovieArchetypeQuadrupedGait.Gait = declared[index]!;
      const automatic: boolean = index < table.order.length;
      if (
        !Object.keys(AutoMovieArchetypeQuadrupedGait.BEATS).includes(kind) ||
        gaits[kind] !== undefined
      )
        refuse(
          automatic ? "table.order" : "table.explicit",
          kind,
          "use distinct supported gait names across both lists",
        );
      const source: AutoMovieArchetypeQuadrupedGait.IGait | undefined =
        table.gaits[kind];
      const axis: string = `table.gaits.${kind}`;
      if (source === undefined)
        refuse(axis, source, "supply every ordered gait");
      const rows: AutoMovieArchetypeQuadrupedGait.IRow[] = admittedRows(
        source.rows,
        `${axis}.rows`,
      );
      const phases: Record<AutoMovieArchetypeQuadrupedBody.Limb, number> = {
        ...source.phases,
      };
      for (const limb of [
        "leftFore",
        "rightFore",
        "leftHind",
        "rightHind",
      ] as const) {
        unit(phases[limb], `${axis}.phases.${limb}`);
        if (phases[limb] === 1)
          refuse(`${axis}.phases.${limb}`, 1, "use a phase below one");
      }
      if (phases.leftFore !== 0)
        refuse(
          `${axis}.phases.leftFore`,
          phases.leftFore,
          "start the stride at leftFore touchdown",
        );
      nonnegative(source.bob, `${axis}.bob`);
      nonnegative(source.nod.range, `${axis}.nod.range`);
      if (!["support", "bob", "lead"].includes(source.nod.timing))
        refuse(
          `${axis}.nod.timing`,
          source.nod.timing,
          "use support, bob or lead",
        );
      for (const end of ["fore", "hind"] as const) {
        nonnegative(source.fold[end], `${axis}.fold.${end}`);
        nonnegative(source.lift[end], `${axis}.lift.${end}`);
      }
      if (!automatic && source.change !== undefined)
        refuse(
          `${axis}.change`,
          source.change,
          "omit automatic transitions for explicit-only gaits",
        );
      const change: QuadrupedChange.Rule | undefined = automatic
        ? transition(source.change, previous, rows, axis)
        : undefined;
      const current: AutoMovieArchetypeQuadrupedGait.IGait = {
        rows,
        phases,
        bob: source.bob,
        nod: { range: source.nod.range, timing: source.nod.timing },
        fold: { ...source.fold },
        lift: { ...source.lift },
        ...QuadrupedGaitAdmission.elevation(source.elevation, axis),
        ...(change === undefined ? {} : { change }),
      };
      if (automatic) {
        order.push(kind);
        previous = current;
      } else explicit.push(kind);
      gaits[kind] = current;
    }
    if (
      Object.keys(table.gaits).some(
        (key: string): boolean =>
          !declared.some(
            (gait: AutoMovieArchetypeQuadrupedGait.Gait): boolean =>
              gait === key,
          ),
      )
    )
      refuse(
        "table.gaits",
        table.gaits,
        "list every supplied gait in order or explicit",
      );
    return {
      order,
      ...(explicit.length === 0 ? {} : { explicit }),
      ...QuadrupedGaitAdmission.collected(table.collected, order, explicit),
      gaits,
      reference: table.reference,
      hysteresis: table.hysteresis,
      follow: { ...table.follow },
      ...(table.scaling === undefined ? {} : { scaling: table.scaling }),
    };
  }

  /*
   * Coincident lateral pairs, explicitly constructed for running pace.
   */
  const PACE: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, number>> = {
    leftFore: 0,
    rightFore: 0.5,
    leftHind: 0,
    rightHind: 0.5,
  };

  /*
   * Coincident diagonals; the other diagonal lands half a stride later.
   */
  const TROT: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, number>> = {
    leftFore: 0,
    rightFore: 0.5,
    leftHind: 0.5,
    rightHind: 0,
  };

  /*
   * Constructed LH→RH→RF→LF rotary order: left fore leads, right hind leads.
   */
  const ROTARY: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, number>> =
    {
      leftFore: 0,
      rightFore: 0.75,
      leftHind: 0.25,
      rightHind: 0.5,
    };

  /*
   * Convert required authored seconds to common gait rows, retaining named walk
   * construction proxies.
   */
  function authored(
    clocks: readonly IClock[],
    phases: AutoMovieArchetypeQuadrupedGait.IGait["phases"],
    pose: AutoMovieArchetypeQuadrupedGait.IGait,
    gait: AutoMovieArchetypeQuadrupedGait.Gait,
  ): AutoMovieArchetypeQuadrupedGait.IGait {
    if (clocks.length === 0)
      refuse(`${gait}.rows`, clocks, "supply at least one authored clock");
    const rows: AutoMovieArchetypeQuadrupedGait.IRow[] = Array.from(
      clocks,
      (clock: IClock, index: number): AutoMovieArchetypeQuadrupedGait.IRow => {
        const axis: string = `${gait}.rows[${index}]`;
        positive(clock.hindStance, `${axis}.hindStance`);
        return {
          speed: clock.speed,
          stride: clock.stride,
          deviation: 0,
          stance: clock.foreStance,
          hindStance: clock.hindStance,
        };
      },
    );
    return {
      ...pose,
      rows,
      phases,
      change: { kind: "speed", speed: rows[0]!.speed },
    };
  }

  /*
   * Admit every positive SI clock and copy rows without a caller-owned
   * reference.
   */
  function admittedRows(
    rows: readonly AutoMovieArchetypeQuadrupedGait.IRow[],
    axis: string,
  ): AutoMovieArchetypeQuadrupedGait.IRow[] {
    if (rows.length === 0)
      refuse(axis, rows, "supply a nonempty speed-ordered row table");
    let previous: number = 0;
    return Array.from(
      rows,
      (
        row: AutoMovieArchetypeQuadrupedGait.IRow,
        index: number,
      ): AutoMovieArchetypeQuadrupedGait.IRow => {
        const at: string = `${axis}[${index}]`;
        positive(row.speed, `${at}.speed`);
        positive(row.stride, `${at}.stride`);
        positive(1 / row.stride, `${at}.frequency`);
        positive(row.stance, `${at}.stance`);
        nonnegative(row.deviation, `${at}.deviation`);
        if (row.speed <= previous)
          refuse(`${at}.speed`, row.speed, "increase row speeds strictly");
        if (row.stance >= row.stride || row.deviation >= row.stride)
          refuse(
            at,
            row,
            "keep stance and stride spread below the positive period",
          );
        if (row.hindStance !== undefined) {
          positive(row.hindStance, `${at}.hindStance`);
          if (row.hindStance >= row.stride)
            refuse(
              `${at}.hindStance`,
              row.hindStance,
              "leave a positive hind swing below the stride period",
            );
        }
        previous = row.speed;
        return {
          speed: row.speed,
          stride: row.stride,
          deviation: row.deviation,
          stance: row.stance,
          ...(row.hindStance === undefined
            ? {}
            : { hindStance: row.hindStance }),
        };
      },
    );
  }

  /*
   * Admit ordered gait ranges and copy the existing owner's closed change-rule
   * vocabulary.
   */
  function transition(
    rule: QuadrupedChange.Rule | undefined,
    previous: AutoMovieArchetypeQuadrupedGait.IGait | undefined,
    rows: readonly AutoMovieArchetypeQuadrupedGait.IRow[],
    axis: string,
  ): QuadrupedChange.Rule | undefined {
    if (previous === undefined) {
      if (rule !== undefined)
        refuse(
          `${axis}.change`,
          rule,
          "omit a change rule on the slowest gait",
        );
      return undefined;
    }

    // Measured gait ranges may nest; order concerns their starting speeds,
    // while the declared transition rule owns their common speed domain.
    if (rows[0]!.speed <= previous.rows[0]!.speed)
      refuse(
        `${axis}.rows`,
        rows,
        "increase the minimum gait speed in gait order",
      );
    if (rule === undefined)
      refuse(`${axis}.change`, rule, "declare the faster gait's change rule");
    if (rule.kind === "speed") {
      positive(rule.speed, `${axis}.change.speed`);
      return { kind: "speed", speed: rule.speed };
    }
    if (rule.kind === "froude") {
      positive(rule.froude, `${axis}.change.froude`);
      return { kind: "froude", froude: rule.froude };
    }
    if (rule.kind === "mass") {
      positive(rule.speed, `${axis}.change.speed`);
      positive(rule.mass, `${axis}.change.mass`);
      if (!Number.isFinite(rule.exponent))
        refuse(
          `${axis}.change.exponent`,
          rule.exponent,
          "supply a finite exponent",
        );
      return {
        kind: "mass",
        speed: rule.speed,
        mass: rule.mass,
        exponent: rule.exponent,
      };
    }
    if (rule.kind !== "overlap")
      refuse(`${axis}.change`, rule, "use speed, froude, mass or overlap");
    if (rows[0]!.speed > previous.rows[previous.rows.length - 1]!.speed)
      refuse(
        `${axis}.change`,
        rule,
        "supply intersecting speed ranges for an overlap transition",
      );
    return { kind: "overlap" };
  }

  /*
   * A finite positive SI time, reciprocal frequency, speed or reference length.
   */
  function positive(value: number, axis: string): void {
    if (!Number.isFinite(value) || value <= 0)
      refuse(axis, value, "supply a finite positive value");
  }

  /*
   * A finite nonnegative range, spread or hysteresis.
   */
  function nonnegative(value: number, axis: string): void {
    if (!Number.isFinite(value) || value < 0)
      refuse(axis, value, "supply a finite nonnegative value");
  }

  /*
   * A finite unit fraction; touchdown phases separately exclude the endpoint
   * one.
   */
  function unit(value: number, axis: string): void {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      refuse(axis, value, "supply a finite fraction from zero through one");
  }

  /*
   * One structured admission refusal with no hidden fallback.
   */
  function refuse(axis: string, value: unknown, reason: string): never {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "quadrupedLocomotion",
      axis,
      value,
      reason,
      fix: "Supply an explicit valid locomotion table or authored clock.",
    });
  }
}
