import {
  physicalBalanceHandoff,
  physicalBalanceRamp,
  physicalBalanceSense,
  physicalBalanceSettle,
  physicalBalanceStance,
  physicalBalanceSwing,
  physicalBipedPlan,
  physicalBipedTouchdown,
  physicalQuadPlan,
  physicalQuadTouchdown,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalBalanceReplay } from "../internal/PhysicalBalanceReplay";

/**
 * No balance phase reads another phase's private state: at every recorded key
 * frame of the fourteen disturbance cases, a phase given its recorded input
 * with every other phase's private fields set to other values returns the same
 * result, those fields either carried through as given or written as without
 * them.
 *
 * Private state, by owner: the settle phase's loss timer (`lostSince`), the
 * root tracker's centre-of-pressure integral (`pressure` but its `command`,
 * which the stance reads), the handoff's record (`handoffs`), the biped
 * touchdown's foot switches (`switches`) and the plan's push recovery flags
 * (`push`). A two-support body runs the biped touchdown and plan, a
 * four-support body the quadruped's; the quadruped's gait (`gait`, `swings`)
 * is shared between its touchdown and plan, as IHMC's touchdown callback
 * clears the step adjustment.
 *
 * Scenarios:
 *
 * 1. Each phase, in the controller's order, from each record's state advanced by
 *    the phases before it, run once as recorded and once perturbed.
 * 2. The two results agree, private fields aside, as JSON with keys in any order;
 *    the stance agrees on its readings and its assessment.
 * 3. Each perturbed private field comes out as it went in, or as the unperturbed
 *    run wrote it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the private fields by owner, the perturbation and what agreement means.
 * @evidence contracts/development/testing.md#behavioral-verification Calls every phase on recorded states and reads the states and commands they return.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the same phase's unperturbed result, so a phase reading a foreign private field differs from itself; nothing is computed by a model of the phase.
 * @evidence contracts/development/testing.md#distinguishing-cases A phase that read any perturbed field, say the plan reading the touchdown's `switches` or the stance reading the integral's bias, would change its result at some recorded frame.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation over the replay fixtures; no native world, viewer or simulation run.
 */
export function test_physical_balance_phase_seams(): void {
  const failures: string[] = [];
  const profiles: Partial<Record<string, IAutoMoviePhysicalProfile>> = {};
  for (const name of PhysicalBalanceReplay.list()) {
    const fixture: PhysicalBalanceReplay.IFixture =
      PhysicalBalanceReplay.load(name);
    const built: IAutoMoviePhysicalProfile = (profiles[fixture.subject] ??=
      PhysicalBalanceReplay.profile(fixture.subject));
    for (const record of fixture.records) {
      if (record.kind !== "advance") continue;
      const at: string = `${fixture.case} @${record.seconds}`;
      const { sense, state } = PhysicalBalanceReplay.sense(
        fixture,
        record,
        built,
      );
      const check = (
        phase: Owner,
        input: IAutoMoviePhysicalRecoveryState,
        run: (state: IAutoMoviePhysicalRecoveryState) => {
          state?: IAutoMoviePhysicalRecoveryState;
          rest: unknown;
        },
      ): void => {
        const plain = run(structuredClone(input));
        const perturbed = run(perturb(input, phase));
        if (canonical(plain.rest) !== canonical(perturbed.rest))
          failures.push(`${at} ${phase}: its commands moved`);
        if (plain.state === undefined || perturbed.state === undefined) return;
        if (canonical(strip(plain.state)) !== canonical(strip(perturbed.state)))
          failures.push(`${at} ${phase}: its state moved`);
        const given: IAutoMoviePhysicalRecoveryState = perturb(input, phase);
        for (const field of FIELDS) {
          const out: string | undefined = canonical(
            field.read(perturbed.state),
          );
          if (
            out !== canonical(field.read(given)) &&
            out !== canonical(field.read(plain.state))
          )
            failures.push(`${at} ${phase}: ${field.name} was rewritten`);
        }
      };
      const handed: IAutoMoviePhysicalRecoveryState = physicalBalanceHandoff({
        state,
        ...(sense.unavailable ? { unavailable: sense.unavailable } : {}),
        seconds: sense.seconds,
      });
      check("handoff", state, (s) => ({
        state: physicalBalanceHandoff({
          state: s,
          ...(sense.unavailable ? { unavailable: sense.unavailable } : {}),
          seconds: sense.seconds,
        }),
        rest: null,
      }));
      const biped: boolean = sense.limbs.length === 2;
      const touchdown = (
        s: IAutoMoviePhysicalRecoveryState,
      ): IAutoMoviePhysicalRecoveryState =>
        biped
          ? physicalBipedTouchdown({ state: s, sense })
          : physicalQuadTouchdown({ state: s, sense });
      const landed: IAutoMoviePhysicalRecoveryState = touchdown(handed);
      check("touchdown", handed, (s) => ({ state: touchdown(s), rest: null }));
      const seated: IAutoMoviePhysicalRecoveryState = physicalBalanceRamp({
        state: landed,
        sense,
      });
      check("ramp", landed, (s) => ({
        state: physicalBalanceRamp({ state: s, sense }),
        rest: null,
      }));
      const stance: physicalBalanceStance.IStance = physicalBalanceStance({
        state: seated,
        sense,
      });
      check("stance", seated, (s) => ({ rest: readings(sense, s) }));
      const planning = (
        s: IAutoMoviePhysicalRecoveryState,
        at: physicalBalanceStance.IStance,
      ): physicalBipedPlan.IResult | physicalQuadPlan.IResult =>
        biped
          ? physicalBipedPlan({ state: s, sense, stance: at })
          : physicalQuadPlan({ state: s, sense, stance: at });
      const plan: physicalBipedPlan.IResult | physicalQuadPlan.IResult =
        planning(seated, stance);
      check("plan", seated, (s) => {
        const result: physicalBipedPlan.IResult | physicalQuadPlan.IResult =
          planning(s, physicalBalanceStance({ state: s, sense }));
        return {
          state: result.state,
          rest: { goals: result.goals, assessment: result.assessment },
        };
      });
      const swing: physicalBalanceSwing.IResult = physicalBalanceSwing({
        state: plan.state,
        sense,
      });
      check("swing", plan.state, (s) => {
        const result: physicalBalanceSwing.IResult = physicalBalanceSwing({
          state: s,
          sense,
        });
        return {
          state: result.state,
          rest: {
            goals: result.goals,
            drives: result.drives,
            path: result.path ?? null,
          },
        };
      });
      check("settle", swing.state, (s) => {
        const result: physicalBalanceSettle.IResult = physicalBalanceSettle({
          state: s,
          sense,
          goals: { ...plan.goals, ...swing.goals },
          assessment: plan.assessment,
        });
        return {
          state: result.state,
          rest: {
            goals: result.goals,
            rootStrength: result.rootStrength,
            rootShift: result.rootShift ?? null,
          },
        };
      });
    }
  }
  TestValidator.equals("balance phase seams", failures, []);
}

/** A phase, by the private state it owns. */
type Owner =
  | "handoff"
  | "touchdown"
  | "ramp"
  | "stance"
  | "plan"
  | "swing"
  | "settle";

/** One private field: its owner, how to read it and how to set it otherwise. */
interface IField {
  name: string;
  owner: Owner | "root";
  read(state: IAutoMoviePhysicalRecoveryState): unknown;
  write(state: IAutoMoviePhysicalRecoveryState): void;
}

/** Every phase's private fields, each set to a value no recording holds. */
const FIELDS: readonly IField[] = [
  {
    name: "lostSince",
    owner: "settle",
    read: (state) => state.lostSince,
    write: (state) => {
      state.lostSince = -1000;
    },
  },
  {
    name: "pressure",
    owner: "root",
    read: (state) =>
      state.pressure ? { ...state.pressure, command: undefined } : undefined,
    write: (state) => {
      state.pressure = {
        bias: { x: 1000, z: -1000 },
        acceleration: { x: 1000, z: 1000 },
        velocity: { x: 1000, z: 1000 },
        swing: "perturbed",
        ...(state.pressure?.command ? { command: state.pressure.command } : {}),
      };
    },
  },
  {
    name: "switches",
    owner: "touchdown",
    read: (state) => state.switches,
    write: (state) => {
      state.switches = {
        ...state.switches,
        perturbed: {
          low: { value: true, count: 1 },
          cop: { value: true, count: 2 },
          hit: { value: true, count: 1 },
        },
      };
    },
  },
  {
    name: "push",
    owner: "plan",
    read: (state) => state.push,
    write: (state) => {
      state.push = {
        recovering: !(state.push?.recovering ?? false),
        fall: !(state.push?.fall ?? false),
        safe: { value: true, count: 1000 },
        large: !(state.push?.large ?? false),
      };
    },
  },
  {
    name: "handoffs",
    owner: "handoff",
    read: (state) => state.handoffs,
    write: (state) => {
      state.handoffs = [
        ...(state.handoffs ?? []),
        { bone: "perturbed", seconds: -1000 },
      ];
    },
  },
];

/** A copy of a state with every private field but the phase's own set otherwise. */
function perturb(
  state: IAutoMoviePhysicalRecoveryState,
  phase: Owner,
): IAutoMoviePhysicalRecoveryState {
  const copy: IAutoMoviePhysicalRecoveryState = structuredClone(state);
  for (const field of FIELDS) if (field.owner !== phase) field.write(copy);
  return copy;
}

/** A state without its private fields, the integral's shared command kept. */
function strip(state: IAutoMoviePhysicalRecoveryState): unknown {
  const copy: IAutoMoviePhysicalRecoveryState = structuredClone(state);
  const command: { x: number; z: number } | undefined = copy.pressure?.command;
  delete copy.lostSince;
  delete copy.handoffs;
  delete copy.pressure;
  delete copy.switches;
  delete copy.push;
  return { ...copy, command: command ?? null };
}

/** The stance's readings and its assessment of the planted support. */
function readings(
  sense: physicalBalanceSense.ISense,
  state: IAutoMoviePhysicalRecoveryState,
): unknown {
  const { ask, ...stance } = physicalBalanceStance({ state, sense });
  return {
    ...stance,
    assessment: ask(stance.planted, [], false, stance.timing),
  };
}

/** JSON with every object's keys sorted. */
function canonical(value: unknown): string | undefined {
  return JSON.stringify(value, (_key: string, v: unknown): unknown =>
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : v,
  );
}
