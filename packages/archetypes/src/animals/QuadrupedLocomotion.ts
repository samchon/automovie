import { ArchetypeRefusal } from "../core";
import { CamelGait } from "./CamelGait";
import { DeerGait } from "./DeerGait";
import type { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedChange } from "./QuadrupedChange";
import { QuadrupedGait } from "./QuadrupedGait";

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
 * observed sika trot and rotary gallop. The trot uses coincident diagonals;
 * the rotary gallop uses authored quarter-stride intervals, with opposite
 * leading fore/hind sides. These fractions are constructions, not measured
 * full-phase statistics. Their durations always come from the caller.
 *
 * Each faster gait's first authored speed is its automatic change boundary,
 * not a claimed biological transition. Absolute scaling preserves all clocks.
 * Admission makes a private numerical snapshot for a ride; no species registry,
 * model identity, motion law or foreign function is modified.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes observed walk data, explicitly authored SI clocks and phase constructions, borrowed pose ranges, deterministic spread and unmeasured biological transitions.
 * @evidence contracts/development/design.md#principled-representation Separate required fore/hind stance times and one period form each authored row; closed species builders add only their declared gait vocabulary to the existing measured walking table.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the camel/deer authored-clock builders and the admission shared with rideQuadruped; gait schema, species identity, poses and the ride solver remain with their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No default speed or biological clock, encoded provenance, global registry, monkeypatch, fitted response or fixture exception substitutes for the author's required values.
 */
export namespace QuadrupedLocomotion {
  /**
   * An authored SI clock, with independent fore/hind contact durations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every member names its SI unit, positivity or ordering constraint and explicitly authored origin; shorter stances leave a positive swing.
   * @evidence contracts/development/design.md#principled-representation Speed, complete stride period and separate fore/hind stance durations are required numbers; no missing period or contact duration can be filled by a biological default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies only the four independent authoring quantities converted by the camel/deer builders to the existing QuadrupedGait.IRow contract.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional hind clock, implicit duty factor, encoded measurement or sentinel speed disguises missing authored timing.
   */
  export interface IClock {
    /** Authored speed, metres per second; rows must increase strictly. */
    speed: number;
    /** Authored complete stride period, seconds, with a finite representable reciprocal frequency. */
    stride: number;
    /** Authored fore-foot ground-contact duration, seconds, below stride. */
    foreStance: number;
    /** Authored hind-foot ground-contact duration, seconds, below stride. */
    hindStance: number;
  }

  /**
   * Required authored lateral-pace clocks, separate from the measured walk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the required nonempty increasing pace rows and their separation from the species' experimental walking point.
   * @evidence contracts/development/design.md#principled-representation One required array of independently authored SI clock points represents the one additional camel gait; row admission enforces nonemptiness and strict speed order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The camel builder's complete authored input; the measured walk, lateral phase construction and common gait schema remain with their owners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No default pace clock, relabelled horse trot or optional timing bundle substitutes for the caller's values.
   */
  export interface ICamel {
    /** One or more strictly increasing speed points; no clock is defaulted. */
    pace: readonly IClock[];
  }

  /**
   * Authored sika trot and/or rotary gallop; an absent gait stays unsupported.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names both phase constructions, the required-clock branches and the speed order when both gaits are supplied.
   * @evidence contracts/development/design.md#principled-representation A union requires trot, rotary gallop or both; the empty combination is excluded statically and still refused at runtime for unchecked callers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The deer builder's authored faster-gait selection imports the shared IClock and retains the measured walking point without duplicating species or solver contracts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No all-optional empty configuration or measured-gallop claim can be inferred from an absent clock; rotary intervals remain explicitly constructed.
   */
  export type IDeer =
    | {
        /** Required authored diagonal-trot clocks in this branch. */
        trot: readonly IClock[];
        /** Optional authored rotary-gallop clocks, faster than trot. */
        gallop?: readonly IClock[];
      }
    | {
        /** No authored trot is supplied in the gallop-only branch. */
        trot?: undefined;
        /** Required authored rotary-gallop clocks in this branch. */
        gallop: readonly IClock[];
      };

  /** Coincident lateral pairs, explicitly constructed for running pace. */
  const PACE: Readonly<Record<QuadrupedBody.Limb, number>> = {
    leftFore: 0,
    rightFore: 0.5,
    leftHind: 0,
    rightHind: 0.5,
  };

  /** Coincident diagonals; the other diagonal lands half a stride later. */
  const TROT: Readonly<Record<QuadrupedBody.Limb, number>> = {
    leftFore: 0,
    rightFore: 0.5,
    leftHind: 0.5,
    rightHind: 0,
  };

  /** Constructed LH→RH→RF→LF rotary order: left fore leads, right hind leads. */
  const ROTARY: Readonly<Record<QuadrupedBody.Limb, number>> = {
    leftFore: 0,
    rightFore: 0.75,
    leftHind: 0.25,
    rightHind: 0.5,
  };

  /**
   * The camel's measured walking point plus the caller's running-pace clocks.
   *
   * @param params Required authored SI clocks; construction pose ranges remain the walk's proxies.
   * @returns An admitted absolute table, with ipsilateral running-pace contacts.
   * @throws {ArchetypeRefusal} For an empty, unordered, nonfinite or unsupported clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the required authoring values, lateral construction, retained walk and absence of measured faster-gait shape claims.
   * @evidence contracts/development/implementation.md#principled-implementation Copies the measured walk and builds pace rows solely from the caller's speed, stride and separate fore/hind stance times; each side lands together at half-stride separation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One species table plus one authored gait, passed through shared admission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No mean clock or speed is supplied by a default, and the construction is not called an experimental dromedary sample.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear time and retained rows in the supplied clock count; admission occurs when building, never per frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses CamelGait's walk and the shared row builder/admission; the common ride evaluates the resulting table.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only the bounded table snapshot; no cache, model or external handle is retained.
   */
  export function camel(params: ICamel): QuadrupedGait.ITable {
    object(params, "camel");
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
   * The sika's measured walk plus explicitly authored trot and/or rotary gallop.
   *
   * @param params At least one faster gait's SI clocks, in increasing speed order.
   * @returns An admitted absolute table; absent faster gaits stay unsupported.
   * @throws {ArchetypeRefusal} For no faster gait or any invalid clock/table.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States required clocks, optional-gait absence and the constructed diagonal or opposite-lead rotary contact order.
   * @evidence contracts/development/implementation.md#principled-implementation Adds only the caller's declared trot/gallop rows to DeerGait's observed walk; constant phase constructions express diagonal pairing or LH→RH→RF→LF rotary order without asserting measured intervals.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Assemble present closed gait choices in order, then admit the complete table once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No horse transverse gallop or fabricated sika clock fills an absent authored gait.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear time and retained rows in the supplied clock count, with at most three gaits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses DeerGait's walk, shared authored-row construction and shared table admission.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the finite table snapshot and retains no model, registry or external resource.
   */
  export function deer(params: IDeer): QuadrupedGait.ITable {
    object(params, "deer");
    if (params.trot === undefined && params.gallop === undefined)
      refuse("deer", params, "supply trot and/or rotary-gallop clocks");
    const order: QuadrupedGait.Gait[] = ["walk"];
    const gaits: Partial<Record<QuadrupedGait.Gait, QuadrupedGait.IGait>> = {
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
   * @param table Closed gaits, ordered finite SI rows and normalized touchdown phases.
   * @returns A new numerical snapshot, without references to mutable caller rows or pose records.
   * @throws {ArchetypeRefusal} For malformed tables, unordered speeds, invalid contact/phase data or an absent transition rule.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the admitted numeric domains, complete-table requirement and snapshot ownership at the ride boundary.
   * @evidence contracts/development/implementation.md#principled-implementation Validates finite positive clock values and representable reciprocal frequency, strictly increasing row and gait endpoint speeds, 0≤phase<1 with leftFore zero, positive stances below period and each transition's declared rule, then copies every consumed nested value.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Table header, closed gait order, per-gait pose/rows/phases and transition admission, then one result.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rejects invalid values rather than clamping, inventing periods or mutating the source species; snapshotting needs no registry or monkeypatch.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear time and retained space in row count plus gait count; four limb phases and bounded pose fields add constant work per gait.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by both authored builders and rideQuadruped's optional-table boundary; no validation is repeated while sampling frames.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocations belong only to the returned finite table; no global state, pending work or external handle survives the call.
   */
  export function admit(table: QuadrupedGait.ITable): QuadrupedGait.ITable {
    object(table, "table");
    object(table.gaits, "table.gaits");
    object(table.follow, "table.follow");
    if (!Array.isArray(table.order) || table.order.length === 0)
      refuse("table.order", table.order, "list at least one supported gait");
    positive(table.reference, "table.reference");
    nonnegative(table.hysteresis, "table.hysteresis");
    unit(table.follow.fore, "table.follow.fore");
    unit(table.follow.hind, "table.follow.hind");
    if (table.scaling !== undefined && table.scaling !== "absolute")
      refuse("table.scaling", table.scaling, "use absolute or omit scaling");
    const order: QuadrupedGait.Gait[] = [];
    const gaits: Partial<Record<QuadrupedGait.Gait, QuadrupedGait.IGait>> = {};
    let previous: QuadrupedGait.IGait | undefined;
    for (let index: number = 0; index < table.order.length; index++) {
      const kind: QuadrupedGait.Gait = table.order[index]!;
      if (
        !Object.keys(QuadrupedGait.BEATS).includes(kind) ||
        order.includes(kind)
      )
        refuse("table.order", table.order, "use distinct supported gait names");
      const source: QuadrupedGait.IGait | undefined = table.gaits[kind];
      const axis: string = `table.gaits.${kind}`;
      if (source === undefined)
        refuse(axis, source, "supply every ordered gait");
      object(source, axis);
      object(source.phases, `${axis}.phases`);
      object(source.nod, `${axis}.nod`);
      object(source.fold, `${axis}.fold`);
      object(source.lift, `${axis}.lift`);
      const rows: QuadrupedGait.IRow[] = admittedRows(
        source.rows,
        `${axis}.rows`,
      );
      const phases: Record<QuadrupedBody.Limb, number> = { ...source.phases };
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
      const change: QuadrupedChange.Rule | undefined = transition(
        source.change,
        previous,
        rows,
        axis,
      );
      const current: QuadrupedGait.IGait = {
        rows,
        phases,
        bob: source.bob,
        nod: { range: source.nod.range, timing: source.nod.timing },
        fold: { ...source.fold },
        lift: { ...source.lift },
        ...(change === undefined ? {} : { change }),
      };
      order.push(kind);
      gaits[kind] = current;
      previous = current;
    }
    if (
      Object.keys(table.gaits).some(
        (key: string): boolean => !order.includes(key as QuadrupedGait.Gait),
      )
    )
      refuse(
        "table.gaits",
        table.gaits,
        "list exactly the gaits present in order",
      );
    return {
      order,
      gaits,
      reference: table.reference,
      hysteresis: table.hysteresis,
      follow: { ...table.follow },
      ...(table.scaling === undefined ? {} : { scaling: table.scaling }),
    };
  }

  /** Convert required authored seconds to common gait rows, retaining named walk construction proxies. */
  function authored(
    clocks: readonly IClock[],
    phases: QuadrupedGait.IGait["phases"],
    pose: QuadrupedGait.IGait,
    gait: QuadrupedGait.Gait,
  ): QuadrupedGait.IGait {
    if (!Array.isArray(clocks) || clocks.length === 0)
      refuse(`${gait}.rows`, clocks, "supply at least one authored clock");
    const rows: QuadrupedGait.IRow[] = Array.from(
      clocks,
      (clock: IClock, index: number): QuadrupedGait.IRow => {
        const axis: string = `${gait}.rows[${index}]`;
        object(clock, axis);
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

  /** Admit every positive SI clock and copy rows without a caller-owned reference. */
  function admittedRows(
    rows: readonly QuadrupedGait.IRow[],
    axis: string,
  ): QuadrupedGait.IRow[] {
    if (!Array.isArray(rows) || rows.length === 0)
      refuse(axis, rows, "supply a nonempty speed-ordered row table");
    let previous: number = 0;
    return Array.from(
      rows,
      (row: QuadrupedGait.IRow, index: number): QuadrupedGait.IRow => {
        const at: string = `${axis}[${index}]`;
        object(row, at);
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

  /** Admit ordered gait ranges and copy the existing owner's closed change-rule vocabulary. */
  function transition(
    rule: QuadrupedChange.Rule | undefined,
    previous: QuadrupedGait.IGait | undefined,
    rows: readonly QuadrupedGait.IRow[],
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
    if (
      rows[0]!.speed <= previous.rows[0]!.speed ||
      rows[rows.length - 1]!.speed <=
        previous.rows[previous.rows.length - 1]!.speed
    )
      refuse(
        `${axis}.rows`,
        rows,
        "increase both gait speed-range endpoints in gait order",
      );
    if (rule === undefined)
      refuse(`${axis}.change`, rule, "declare the faster gait's change rule");
    object(rule, `${axis}.change`);
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
          "use a finite mass exponent",
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

  /** Require a record before reading a caller's nested table or clock. */
  function object(value: unknown, axis: string): void {
    if (value === null || typeof value !== "object" || Array.isArray(value))
      refuse(axis, value, "supply the declared record");
  }

  /** A finite positive SI time, reciprocal frequency, speed or reference length. */
  function positive(value: number, axis: string): void {
    if (!Number.isFinite(value) || value <= 0)
      refuse(axis, value, "supply a finite positive value");
  }

  /** A finite nonnegative range, spread or hysteresis. */
  function nonnegative(value: number, axis: string): void {
    if (!Number.isFinite(value) || value < 0)
      refuse(axis, value, "supply a finite nonnegative value");
  }

  /** A finite unit fraction; touchdown phases separately exclude the endpoint one. */
  function unit(value: number, axis: string): void {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      refuse(axis, value, "supply a finite fraction from zero through one");
  }

  /** One structured admission refusal with no hidden fallback. */
  function refuse(axis: string, value: unknown, reason: string): never {
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "quadrupedLocomotion",
      axis,
      value,
      reason,
      fix: "Supply an explicit valid locomotion table or authored clock.",
    });
  }
}
