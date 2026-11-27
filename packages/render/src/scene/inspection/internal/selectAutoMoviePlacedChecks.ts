import type { IObserveAutoMoviePlacedSceneCheck } from "../../IObserveAutoMoviePlacedSceneCheck.js";
import type { ISelectAutoMoviePlacedChecksProps } from "../../ISelectAutoMoviePlacedChecksProps.js";
import type { ISelectAutoMoviePlacedChecksRule } from "../../ISelectAutoMoviePlacedChecksRule.js";
import type { ISelectAutoMoviePlacedChecksSupportPhase } from "../../ISelectAutoMoviePlacedChecksSupportPhase.js";
import type { ISelectAutoMoviePlacedChecksGripWindow } from "../../ISelectAutoMoviePlacedChecksGripWindow.js";
import type { ISelectAutoMoviePlacedChecksCustody } from "../../ISelectAutoMoviePlacedChecksCustody.js";
import type { ISelectAutoMoviePlacedChecksContinuity } from "../../ISelectAutoMoviePlacedChecksContinuity.js";
import type { ISelectAutoMoviePlacedChecksTrack } from "../../ISelectAutoMoviePlacedChecksTrack.js";
import { AutoMovieEngineFilm, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieClassifyPlaybackBoundary,
  IAutoMoviePlacedContinuity,
  IAutoMovieTransform,
} from "@automovie/interface";
import type { Object3D } from "three";


/*
 * Select the production's declared checks active at one placed sample, for
 * `AutoMovieRenderInspection.observePlacedScene`.
 *
 * A support or grip contributes its phase or window containing the sample
 * second. Custody contributes the holder its schedule allows at that second and
 * reads the actual holder from the displayed scene graph. A continuity track
 * contributes its authored record at the live shot clock and, from the second
 * output frame on, the step from the previous output frame. The cut decides
 * that step's boundary and both shot clocks, so a retime, a seam, a transition,
 * a cut and a declared break follow the playback mapping, and the rate limits
 * apply over the elapsed shot-local seconds. A step whose endpoint record is
 * itself invalid is not compared; the record check reports it.
 *
 * Nothing depends on a previous call, so a sample yields the same checks
 * whether it is reached forward, backward or by a jump.
 * Parameter props: The placed sample, the output rate and the declarations.
 * Returns: The observer's checks for this sample, in declaration order.
 */
export function selectAutoMoviePlacedChecks(
  props: ISelectAutoMoviePlacedChecksProps,
): ICheck[] {
  const seconds: number = props.time.filmSeconds;
  const checks: ICheck[] = [];
  for (const support of props.supports ?? []) {
    const index: number = support.phases.findIndex(
      (phase: ISelectAutoMoviePlacedChecksSupportPhase): boolean =>
        contains(phase, seconds),
    );
    const phase: ISelectAutoMoviePlacedChecksSupportPhase | undefined =
      support.phases[index];
    if (phase === undefined) continue;
    checks.push({
      ...envelope(support, seconds),
      input: {
        kind: "scene-support",
        path: `${support.path}.phases[${index}]`,
        maxGap: support.maxGap,
        maxSlip: support.maxSlip,
        sample: {
          socket: phase.socket,
          support: phase.support,
          anchor: phase.anchor,
        },
      },
    });
  }
  for (const grip of props.grips ?? []) {
    const index: number = grip.windows.findIndex(
      (window: ISelectAutoMoviePlacedChecksGripWindow): boolean =>
        contains(window, seconds),
    );
    const window: ISelectAutoMoviePlacedChecksGripWindow | undefined =
      grip.windows[index];
    if (window === undefined) continue;
    checks.push({
      ...envelope(grip, seconds),
      input: {
        kind: "scene-grip",
        path: `${grip.path}.windows[${index}]`,
        maxDistance: grip.maxDistance,
        maxAngle: grip.maxAngle,
        sample: {
          hand: window.hand,
          prop: window.prop,
          expected:
            typeof window.expected === "function"
              ? window.expected(seconds)
              : window.expected,
        },
      },
    });
  }
  for (const custody of props.custody ?? []) {
    const entry: IScheduleEntry | undefined = custody.schedule.reduce<
      IScheduleEntry | undefined
    >(
      (current: IScheduleEntry | undefined, next: IScheduleEntry) =>
        next.from <= seconds &&
        (current === undefined || next.from >= current.from)
          ? next
          : current,
      undefined,
    );
    if (entry === undefined) continue;
    const holder: string | null | undefined = holderOf(props.scene, custody);
    checks.push({
      ...envelope(custody, seconds),
      input: {
        kind: "custody",
        path: custody.path,
        allowed: [entry.holder],
        ...(holder === undefined ? {} : { holder }),
      },
    });
  }
  if (props.continuity !== undefined)
    for (const track of props.continuity.tracks)
      checks.push(...trackChecks(props, props.continuity, track));
  return checks;
}
type ICheck = IObserveAutoMoviePlacedSceneCheck;
type IObservation = Exclude<
  Extract<
    IAutoMoviePlacedContinuity.IProps,
    { kind: "transform" }
  >["observation"],
  undefined
>;
type IScheduleEntry = ISelectAutoMoviePlacedChecksCustody["schedule"][number];

type IEnvelope = Pick<ICheck, "key" | "required" | "paths" | "observedContact">;

/*
 * Whether a half-open window owns the film second.
 */
function contains(
  window: { readonly from: number; readonly to: number },
  seconds: number,
): boolean {
  return window.from <= seconds && seconds < window.to;
}

/*
 * The observer envelope of a rule at a film second, with its received evidence
 * when the producer has some.
 */
function envelope(
  rule: ISelectAutoMoviePlacedChecksRule,
  seconds: number,
): IEnvelope {
  const observedContact: ICheck["observedContact"] = rule.contact?.(seconds);
  return {
    key: rule.key,
    required: rule.required,
    ...(rule.paths === undefined ? {} : { paths: rule.paths }),
    ...(observedContact === undefined ? {} : { observedContact }),
  };
}

/*
 * The nearest declared holder carrying the prop, null when the prop hangs from
 * the scene without one, and undefined when the prop is not displayed beneath
 * the scene.
 */
function holderOf(
  scene: Object3D,
  custody: ISelectAutoMoviePlacedChecksCustody,
): string | null | undefined {
  const names: Map<Object3D, string> = new Map(
    Object.entries(custody.holders).map(
      ([name, node]: [string, Object3D]): [Object3D, string] => [node, name],
    ),
  );
  for (
    let node: Object3D | null = custody.prop.parent;
    node !== null;
    node = node.parent
  ) {
    const name: string | undefined = names.get(node);
    if (name !== undefined) return name;
    if (node === scene) return null;
  }
  return undefined;
}

/*
 * A track's record check at the live shot clock and, after the first output
 * frame, its step from the previous output frame with source-time limits.
 */
function trackChecks(
  props: ISelectAutoMoviePlacedChecksProps,
  continuity: ISelectAutoMoviePlacedChecksContinuity,
  track: ISelectAutoMoviePlacedChecksTrack,
): ICheck[] {
  const after: number = props.time.filmSeconds;
  const frame: number | undefined = props.time.outputFrame;
  const before: number =
    frame === undefined ? after - 1 / props.fps : (frame - 1) / props.fps;
  const classify = (from: number): IAutoMovieClassifyPlaybackBoundary.IResult =>
    AutoMovieEngineFilm.classifyAutoMoviePlaybackBoundary({
      sequence: continuity.sequence,
      timeline: continuity.timeline,
      before: from,
      after,
      ...(continuity.discontinuities === undefined
        ? {}
        : { discontinuities: continuity.discontinuities }),
    });
  const base: IEnvelope = envelope(track, after);
  const live: IAutoMovieClassifyPlaybackBoundary.IResult = classify(after);
  const current: IObservation | null | undefined =
    live.boundary === "unavailable"
      ? undefined
      : track.observe(live.after.shot, live.after.seconds);
  if (current === null) return [];
  const checks: ICheck[] = [
    {
      ...base,
      input: {
        kind: "transform",
        path: track.path,
        ...(current === undefined ? {} : { observation: current }),
      },
    },
  ];
  const incoming: IAutoMovieTransform | undefined = admitted(
    current,
    track.path,
  );
  if (!(before >= 0) || incoming === undefined) return checks;

  const edge: IAutoMovieClassifyPlaybackBoundary.IResult = classify(before);
  const step: { readonly kind: "step"; readonly path: string } = {
    kind: "step",
    path: track.path,
  };
  if (edge.boundary !== "continuous")
    return [
      ...checks,
      { ...base, input: { ...step, boundary: edge.boundary } },
    ];
  const previous: IObservation | null | undefined = track.observe(
    edge.before.shot,
    edge.before.seconds,
  );
  if (previous === null) return checks;
  const outgoing: IAutoMovieTransform | undefined = admitted(
    previous,
    track.path,
  );
  if (previous !== undefined && outgoing === undefined) return checks;
  const elapsed: number = Math.abs(edge.after.seconds - edge.before.seconds);
  const tolerance: { readonly distance: number; readonly angle: number } =
    track.tolerance ?? { distance: 0, angle: 0 };
  return [
    ...checks,
    {
      ...base,
      input: {
        ...step,
        boundary: "continuous",
        ...(outgoing === undefined
          ? {}
          : { before: { seconds: before, transform: outgoing } }),
        after: { seconds: after, transform: incoming },
        ...(track.maxSpeed === undefined
          ? {}
          : { maxDistance: track.maxSpeed * elapsed + tolerance.distance }),
        ...(track.maxAngularSpeed === undefined
          ? {}
          : {
              maxAngle: Math.min(
                Math.PI,
                track.maxAngularSpeed * elapsed + tolerance.angle,
              ),
            }),
      },
    },
  ];
}

/*
 * The record's transform when it is present and passes the canonical transform
 * admission, else undefined.
 */
function admitted(
  observation: IObservation | null | undefined,
  path: string,
): IAutoMovieTransform | undefined {
  if (observation?.kind !== "present") return undefined;
  const result: IAutoMoviePlacedContinuity.IResult =
    AutoMovieEngineValidation.measurePlacedContinuity({
      kind: "transform",
      path,
      observation,
    });
  return result.status === "checked" && result.violations.length === 0
    ? observation.transform
    : undefined;
}
