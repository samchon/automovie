import { AutoMovieArchetypeRefusal } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { CamelGait } from "./CamelGait";
import { DeerGait } from "./DeerGait";
import type { QuadrupedChange } from "./QuadrupedChange";
import { QuadrupedGaitAdmission } from "./QuadrupedGaitAdmission";

/**
 * Explicit authored clocks for locomotion absent from the measured walk tables.
 *
 * A clock is supplied in metres per second and seconds. No missing biological
 * period, stance, spread or speed band is inferred. Spread is authored zero,
 * making these deterministic construction clocks, not zero-variance samples.
 * The species' measured walk remains unchanged; faster gaits borrow its named
 * construction pose ranges, not measured faster-gait joint kinematics.
 *
 * Dagg (1974), doi:10.1111/j.1469-7998.1974.tb03144.x, distinguishes the
 * camel's lateral walk from its running pace. Here a pace is constructed with
 * simultaneous ipsilateral contacts and opposite sides half a stride apart.
 * Dagg (1967), Gaits and Their Development in the Infraorder Pecora, pp.65–66,
 * observed sika trot and rotary gallop. The trot uses coincident diagonals; the
 * rotary gallop uses authored quarter-stride intervals, with opposite leading
 * fore/hind sides. These fractions are constructions, not measured full-phase
 * statistics. Their durations always come from the caller.
 *
 * Each faster gait's first authored speed is its automatic change boundary, not
 * a claimed biological transition. Absolute scaling preserves all clocks.
 * Admission makes a private numerical snapshot for a ride; no species registry,
 * model identity, motion law or foreign function is modified.
 */
export namespace AutoMovieArchetypeQuadrupedLocomotion {
  /** An authored SI clock, with independent fore/hind contact durations. */
  export interface IClock {
    /** Authored speed, metres per second; rows must increase strictly. */
    speed: number;
    /**
     * Authored complete stride period, seconds, with a finite representable
     * reciprocal frequency.
     */
    stride: number;
    /** Authored fore-foot ground-contact duration, seconds, below stride. */
    foreStance: number;
    /** Authored hind-foot ground-contact duration, seconds, below stride. */
    hindStance: number;
  }

  /** Required authored lateral-pace clocks, separate from the measured walk. */
  export interface ICamel {
    /** One or more strictly increasing speed points; no clock is defaulted. */
    pace: readonly IClock[];
  }

  /** Deer input with an authored diagonal-trot clock table. */
  export interface IDeerTrot {
    /** Required authored diagonal-trot clocks in this branch. */
    trot: readonly IClock[];
    /** Optional authored rotary-gallop clocks, faster than trot. */
    gallop?: readonly IClock[];
  }

  /** Deer input with rotary-gallop clocks and no authored trot. */
  export interface IDeerGallop {
    /** No authored trot is supplied in the gallop-only branch. */
    trot?: undefined;
    /** Required authored rotary-gallop clocks in this branch. */
    gallop: readonly IClock[];
  }

  /** Authored sika trot and/or rotary gallop; an absent gait stays unsupported. */
  export type IDeer = IDeerTrot | IDeerGallop;

  /** Coincident lateral pairs, explicitly constructed for running pace. */
  const PACE: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, number>> = {
    leftFore: 0,
    rightFore: 0.5,
    leftHind: 0,
    rightHind: 0.5,
  };

  /** Coincident diagonals; the other diagonal lands half a stride later. */
  const TROT: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, number>> = {
    leftFore: 0,
    rightFore: 0.5,
    leftHind: 0.5,
    rightHind: 0,
  };

  /** Constructed LH→RH→RF→LF rotary order: left fore leads, right hind leads. */
  const ROTARY: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, number>> =
    {
      leftFore: 0,
      rightFore: 0.75,
      leftHind: 0.25,
      rightHind: 0.5,
    };

  /**
   * The camel's measured walking point plus the caller's running-pace clocks.
   *
   * @param params Required authored SI clocks; construction pose ranges remain
   *   the walk's proxies.
   * @returns An admitted absolute table, with ipsilateral running-pace
   *   contacts.
   * @throws {AutoMovieArchetypeRefusal} For an empty, unordered, nonfinite or
   *   unsupported clock.
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
   * The sika's measured walk plus explicitly authored trot and/or rotary
   * gallop.
   *
   * @param params At least one faster gait's SI clocks, in increasing speed
   *   order.
   * @returns An admitted absolute table; absent faster gaits stay unsupported.
   * @throws {AutoMovieArchetypeRefusal} For no faster gait or any invalid
   *   clock/table.
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
   * Admit and snapshot a complete caller-supplied table before a ride reads it.
   *
   * @param table Closed gaits, ordered finite SI rows and normalized touchdown
   *   phases.
   * @returns A new numerical snapshot, without references to mutable caller
   *   rows or pose records.
   * @throws {AutoMovieArchetypeRefusal} For malformed tables, unordered speeds,
   *   invalid contact/phase data or an absent transition rule.
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

  /**
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

  /**
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

  /**
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

  /** A finite positive SI time, reciprocal frequency, speed or reference length. */
  function positive(value: number, axis: string): void {
    if (value <= 0) refuse(axis, value, "supply a finite positive value");
  }

  /** A finite nonnegative range, spread or hysteresis. */
  function nonnegative(value: number, axis: string): void {
    if (value < 0) refuse(axis, value, "supply a finite nonnegative value");
  }

  /**
   * A finite unit fraction; touchdown phases separately exclude the endpoint
   * one.
   */
  function unit(value: number, axis: string): void {
    if (value < 0 || value > 1)
      refuse(axis, value, "supply a finite fraction from zero through one");
  }

  /** One structured admission refusal with no hidden fallback. */
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
