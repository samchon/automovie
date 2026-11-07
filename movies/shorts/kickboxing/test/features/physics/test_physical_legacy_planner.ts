import { AutoMovieStepPlanner as Planner } from "@automovie/engine";
import type { IAutoMovieFootfallPattern } from "@automovie/interface";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

/** Recorded original-film stance inputs reproduce its scheduler and sampled foot placements.
 *
 * Scenarios:
 * 1. Each of three actors supplies opening, bout, knockdown and aftermath input windows.
 * 2. Every scheduled swing agrees within one nanosecond and one nanometre/radian.
 * 3. Every 30 Hz sampled phase and placement agrees, including reservations and pivots.
 *
 * The JSON records baseline source blobs and literal callbacks' inputs/outputs;
 * this test imports no production-local implementation or amended screenplay.
 */
export async function test_physical_legacy_planner(): Promise<void> {
  const record: IRecord = JSON.parse(
    await readFile(
      path.join(
        import.meta.dirname,
        "../../fixtures/physical/kickboxing-legacy.json",
      ),
      "utf8",
    ),
  );
  const findings: string[] = [];
  const convert: (value: IPlacement) => Planner.IPlacement = (
    value: IPlacement,
  ): Planner.IPlacement => ({
    point: [...value.ball],
    yaw: value.yaw,
    pitch: value.heel,
    clearance: value.lift,
  });
  const error: (a: Planner.IPlacement, b: IPlacement) => number = (
    a: Planner.IPlacement,
    b: IPlacement,
  ): number =>
    Math.max(
      Math.hypot(a.point[0] - b.ball[0], a.point[1] - b.ball[1]),
      Math.abs(Planner.angle(a.yaw - b.yaw)),
      Math.abs(a.pitch - b.heel),
      Math.abs(a.clearance - b.lift),
    );
  for (const window of record.planners) {
    const label: string = `${window.id}/${window.input.start}`;
    try {
      // The original drift scheduler prescribes no minimum planted duration.
      // Its two-foot minimum is explicitly zero because its 50 ms overlap permits flight.
      const pattern: IAutoMovieFootfallPattern = {
        id: "recorded-drift-scheduler",
        minimumSupports: 0,
        limbs: (["left", "right"] as const).map(
          (
            bone: "left" | "right",
            index: number,
          ): {
            bone: "left" | "right";
            chain: ("left" | "right")[];
            phase: number;
            duty: number;
            offset: { forward: number; left: number };
            stride: { speed: number; length: number }[];
          } => ({
            bone,
            chain: [bone],
            phase: index / 2,
            duty: 0,
            offset: {
              forward: index === 0 ? 1 : -1,
              left: index === 0 ? 1 : -1,
            },
            stride: [{ speed: 0, length: 0.9 }],
          }),
        ),
      };
      const planner: Planner = new Planner({
        pattern,
        start: window.input.start,
        end: window.input.end,
        rate: 120,
        desired: (seconds: number): Record<string, Planner.IPlacement> => {
          const row: Record<string, IPlacement> | undefined =
            window.desired[seconds.toPrecision(17)];
          if (!row)
            throw new Error(
              `Recorded desired query missing: ${seconds.toPrecision(17)}`,
            );
          return Object.fromEntries(
            Object.entries(row).map(
              ([bone, value]: [string, IPlacement]): [
                string,
                Planner.IPlacement,
              ] => [bone, convert(value)],
            ),
          );
        },
        heading: (seconds: number): number => {
          const value: number | undefined =
            window.headings[seconds.toPrecision(17)];
          if (value === undefined)
            throw new Error(
              `Recorded heading query missing: ${seconds.toPrecision(17)}`,
            );
          return value;
        },
        reservations: window.input.busy.map(
          (
            entry: (typeof window.input.busy)[number],
          ): Planner.IReservation => ({
            bone: entry.side,
            start: entry.start,
            end: entry.end,
          }),
        ),
        duration: window.input.duration,
        threshold: window.input.threshold,
        height: window.input.height,
        peakPitch: 0.25,
        overlap: window.input.overlap,
        swingRetargeting: "from-scheduled-landing",
        maximumStride: 0.9,
        reservationMargin: 0.04,
        margin: 0.03,
        yawLever: 0.12,
        pitchLever: 0.05,
        alternationWindow: 0.35,
      });
      const steps: Planner.IStep[] = planner.steps.filter(
        (step: (typeof planner.steps)[number]): boolean =>
          step.kind === "swing",
      );
      if (steps.length !== window.steps.length)
        findings.push(
          `${label}: swing count ${steps.length}, recorded ${window.steps.length}`,
        );
      for (const [index, expected] of window.steps.entries()) {
        const actual: Planner.IStep | undefined = steps[index];
        if (
          !actual ||
          actual.bone !== expected.side ||
          Math.max(
            Math.abs(actual.start - expected.start),
            Math.abs(actual.end - expected.end),
            error(actual.from, expected.from),
            error(actual.to, expected.to),
          ) > 1e-9
        ) {
          findings.push(
            `${label}: first differing swing ${index}: ${JSON.stringify({ actual, expected, previous: steps[index - 1] })}`,
          );
          break;
        }
      }
      for (const sample of window.samples) {
        const actual: Planner.IState = planner.at(sample.side, sample.seconds);
        if (
          actual.phase !==
            (sample.phase === "busy" ? "reserved" : sample.phase) ||
          error(actual.placement, sample.placement) > 1e-9 ||
          Math.abs(actual.progress - sample.progress) > 1e-9
        ) {
          findings.push(
            `${label}: first differing seek ${sample.side}@${sample.seconds}`,
          );
          break;
        }
      }
    } catch (failure: unknown) {
      findings.push(`${label}: ${String(failure)}`);
    }
  }
  assert.deepEqual(findings, [], "all recorded scheduler windows");
}

/** Literal old placement units, retained only as recorded test data. */
interface IPlacement {
  /** World X/Z metres. */
  ball: [number, number];
  /** World radians. */
  yaw: number;
  /** Heel pitch radians. */
  heel: number;
  /** Metre clearance. */
  lift: number;
}

/** Recorded input and independent old outputs for each named film window. */
interface IRecord {
  /** The capture helper's twelve actor/windows. */
  planners: {
    /** Actor identifier from the original production. */ id: string;
    /** Original scheduling parameters. */ input: {
      start: number;
      end: number;
      duration: number;
      threshold: number;
      height: number;
      overlap: number;
      busy: { side: string; start: number; end: number }[];
    };
    /** Exact Float64 query keys. */ desired: Record<
      string,
      Record<string, IPlacement>
    >;
    /** Exact original heading values. */ headings: Record<string, number>;
    /** Swings emitted by the original scheduler. */ steps: {
      side: string;
      start: number;
      end: number;
      from: IPlacement;
      to: IPlacement;
    }[];
    /** Independently sampled old seek outputs. */ samples: {
      seconds: number;
      side: string;
      phase: "planted" | "swing" | "busy";
      progress: number;
      placement: IPlacement;
    }[];
  }[];
}
