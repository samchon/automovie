import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { HumanBalance } from "./HumanBalance";

/** The crouch law's fixed scalar search and actual lowered-body callback. */
interface IProps {
  /** The unchanged body and its mass/ROM owners. */
  body: IAutoMovieMotionHumanBody;

  /** Fixed heading unit vector, world frame. */
  forward: IAutoMovieVector3;

  /** Upper trunk-inclination bound from the law's lumbar range, degrees. */
  most: number;

  /** Whether the law keeps the heels flat throughout the descent. */
  flat: boolean;

  /** Descent share at which the heels leave the floor, or one for flat heels. */
  rises: number;

  /** The law's existing count of equal descent intervals. */
  shares: number;

  /** Bind fixed standing-source foot/root/pelvis geometry at one descent share; every inclination still writes actual joints/goals and borrows only current-query raw-hip FK. */
  posture(
    share: number,
  ): (
    inclination: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IAutoMovieMotionHumanPosture;
}

/**
 * Prepare the crouch's original inclination table and refine each interior
 * query by its existing secant search. Only whole-body mass centres are
 * observed during the searches; the one forefoot target still uses the
 * canonical support offset it actually needs.
 *
 * @param props Unchanged body, heading, range/heel geometry and original actual-posture builder.
 * @returns The current inclination in degrees, optionally borrowing same-evaluation FK/ROM metadata only while its actual secant trials run.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed law-derived bounds/share count, world heading, actual posture callback, degree result and synchronous search-local loans.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps the original upright/low centre course, heel-dependent forefoot target, endpoint-bracket choices, twelve bisections at each stated share, linear table seed and at most five bounded secant refinements with the original 1e-5 residual and equality branches.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A centre-only producer serves the original ahead observation. Each fixed-share builder prepares its foot/root/pelvis geometry, then every inclination writes/solves a current posture. Table construction returns only scalars; a separate query scope owns actual secant evaluations.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every actual current posture still receives complete canonical joint/limb/digit fitting and mass placement. No share, bisection, secant candidate, angle bound, target, residual tolerance or contact rule changes; unused foot-base geometry alone is omitted from centre-only trials.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed mass-name demand prepares once. The original O(S) table/twelve bisections per share and at most five runtime secant steps remain; each share prepares invariant ankle/root/pelvis-limit geometry once while all actual trials share synchronous FK/static ROM prerequisites and omit unrelated support geometry.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body/heading/range/heel data and the standing-source builder are fixed for the plan. Only immutable demand and scalar table/course data survive construction; every changed inclination/posture/centre is evaluated, without reusing a solved pose or numerical verdict.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns S+1 angles, two course scalars, fixed geometry and the posture callback until release. Construction and query FK/ROM sources end with their own synchronous scope or throw; no current pose/map, borrowed workspace or query history enters the returned reader.
 */
export function prepareCrouchInclination(
  props: IProps,
): (
  share: number,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
) => number {
  const centre: ReturnType<typeof HumanBalance.prepareCentre> =
    HumanBalance.prepareCentre(props.body);
  const ahead: (
    at: ReturnType<IProps["posture"]>,
    q: number,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
  ) => number = (
    at: ReturnType<IProps["posture"]>,
    q: number,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
  ): number => Vector3.dot(centre(at(q, read), read, project), props.forward);
  const course: (s: number, upright: number, low: number) => number = (
    s: number,
    upright: number,
    low: number,
  ): number => upright + (low - upright) * Math.min(1, s / props.rises);
  const fixed: { upright: number; low: number; angles: number[] } = ((): {
    upright: number;
    low: number;
    angles: number[];
  } => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(props.body);
    const start: ReturnType<IProps["posture"]> = props.posture(0);
    const upright: number = ahead(start, 0, read, project);
    const bottom: ReturnType<IProps["posture"]> = props.posture(1);
    const low: number = props.flat
      ? Math.min(upright, ahead(bottom, props.most, read, project))
      : ahead(bottom, 0, read, project) -
        HumanBalance.offset(props.body, bottom(0, read));
    const angles: number[] = [0];
    for (let k: number = 1; k <= props.shares; k++) {
      const s: number = k / props.shares;
      const at: ReturnType<IProps["posture"]> = props.posture(s);
      const target: number = course(s, upright, low);
      const error: (q: number) => number = (q: number): number =>
        ahead(at, q, read, project) - target;
      let lo: number = 0;
      let hi: number = props.most;
      if (error(lo) >= 0) hi = lo;
      else if (error(hi) <= 0) lo = hi;
      else
        for (let i: number = 0; i < 12; i++) {
          const mid: number = (lo + hi) / 2;
          if (error(mid) < 0) lo = mid;
          else hi = mid;
        }
      angles.push((lo + hi) / 2);
    }
    return { upright, low, angles };
  })();
  return (
    s: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): number => {
    const at: number = Math.max(0, Math.min(1, s)) * props.shares;
    const k: number = Math.min(props.shares - 1, Math.floor(at));
    const within: (q: number) => number = (q: number): number =>
      Math.max(0, Math.min(props.most, q));
    let a: number =
      fixed.angles[k]! + (fixed.angles[k + 1]! - fixed.angles[k]!) * (at - k);
    if (at === k || at === props.shares) return a;
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      projection ?? prepareHumanPostureProjection(props.body);
    const target: number = course(at / props.shares, fixed.upright, fixed.low);
    const current: ReturnType<IProps["posture"]> = props.posture(
      at / props.shares,
    );
    const error: (q: number) => number = (q: number): number =>
      ahead(current, q, read, project) - target;
    let ea: number = error(a);
    let b: number = within(a + (ea < 0 ? 0.5 : -0.5));
    for (let i: number = 0; i < 5 && b !== a; i++) {
      const eb: number = error(b);
      if (Math.abs(eb) < 1e-5 || eb === ea) break;
      const next: number = within(b - (eb * (b - a)) / (eb - ea));
      [a, ea, b] = [b, eb, next];
    }
    return b;
  };
}
