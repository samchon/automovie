import { Quaternion, integrateAirborneRotation } from "@automovie/engine";
import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { qunit } from "../internal/qunit";

/**
 * An inverse principal frame is reusable by its current numeric quaternion,
 * rather than the identity of a caller-owned mutable rotation record.
 *
 * The physical body has the constant body tensor diag(2,3,4), h=0 and world
 * L=2X. Its root solution is q(t)=Rx(t), and its body rotation tangent for
 * a world X momentum change is (t/2,0,0). At t=0.5 the history changes the
 * principal axes' representation from identity to Rz(pi), keeping the sorted
 * moments (2,3,4). The two flipped eigenvector signs preserve the same tensor
 * exactly. Rz(pi) is written (0,0,1,0), without a rounded sin(pi).
 *
 * Scenarios:
 * 1. One history owns and reuses the same mutable quaternion object, whose
 *    components at each call declare the correct principal frame. Fixed
 *    and adaptive integration both cross the representation change.
 * 2. Actual q and its X tangent follow the independent closed forms at
 *    eleven shuffled instants within the existing 1e-6 integration bound;
 *    finite/unit rotations are required. Reusing an old inverse after the
 *    object changes makes the physical X rate reverse instead of staying 1.
 * 3. After integration, the history's own record is changed again. Playback
 *    retains completed numeric results and makes no further history calls.
 *
 * Each history output's numeric values are deterministic in its query time;
 * callers consume its borrowed frame during that call. No callback, global
 * or foreign function is replaced, and no output snapshot is an oracle.
 * This regression is deferred, separate from the two representative samples.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the physical tensor, ordered moments, equivalent eigenvector-sign charts, mutable-record lifetime, analytic solution/tangent and numerical bound.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public physical integrator with a real numeric principal-frame change on one owned object, observes actual orientation/tangent and checks post-completion callback and record independence.
 * @evidence contracts/development/testing.md#independent-expectations Flipping two eigenvectors leaves diag(2,3,4) unchanged; angular momentum balance gives unit X angular rate and differentiating Lx/2 gives tangent t/2. The declared physical tensor supplies the expectation, not another cached inverse.
 * @evidence contracts/development/testing.md#distinguishing-cases Same object with different quaternion components, a physical invariant across a principal-chart change, both integration modes, nonzero X sensitivity, shuffled playback and caller record mutation distinguish exact value reuse from stale identity reuse.
 * @evidence contracts/development/testing.md#execution-ownership One deferred in-memory physical model owns its frame and counters, starts no host or runner, and changes no foreign method or production state.
 */
export function test_engine_airborne_principal_frame_reuse(): void {
  const findings: string[] = [];
  for (const adaptive of [false, true]) {
    const mode: string = adaptive ? "adaptive" : "fixed";
    const frame: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
    let before: number = 0;
    let after: number = 0;
    const history: IAutoMovieIntegrateAirborneRotation.IHistory = (
      seconds: number,
    ): IAutoMovieIntegrateAirborneRotation.IInstant => {
      const turned: boolean = seconds >= 0.5;
      if (turned) after++;
      else before++;
      frame.z = turned ? 1 : 0;
      frame.w = turned ? 0 : 1;
      return {
        inertia: { moments: { x: 2, y: 3, z: 4 }, rotation: frame },
        relative: { x: 0, y: 0, z: 0 },
      };
    };
    const flight: IAutoMovieIntegrateAirborneRotation.IFlight = integrateAirborneRotation(
      {
        history,
        t0: 0,
        t1: 1,
        q0: { x: 0, y: 0, z: 0, w: 1 },
        momentum: { x: 2, y: 0, z: 0 },
        variations: [{ x: 1, y: 0, z: 0 }],
        h: 1 / 60,
        ...(adaptive
          ? { tolerance: { relative: 1e-10, absolute: 1e-10 } }
          : {}),
      },
    );
    const completed: number = before + after;
    if (!(before > 0 && after > 0))
      findings.push(
        `${mode}: integration did not observe both frame representations`,
      );
    frame.x = 1;
    frame.y = 0;
    frame.z = 0;
    frame.w = 0;
    for (const index of [10, 0, 7, 3, 9, 1, 5, 2, 8, 4, 6]) {
      const seconds: number = index / 10;
      const expected: IAutoMovieQuaternion = {
        x: Math.sin(seconds / 2),
        y: 0,
        z: 0,
        w: Math.cos(seconds / 2),
      };
      const shown: IAutoMovieQuaternion = flight.orientation(seconds);
      const tangents: readonly IAutoMovieVector3[] = flight.variations(seconds);
      if (
        !(
          qunit(shown) &&
          qclose(shown, expected, 1e-12) &&
          Quaternion.angle(shown, expected) <= 1e-6
        )
      )
        findings.push(
          `${mode}: physical orientation changed with its principal-axis chart at ${seconds}`,
        );
      if (
        !(
          tangents.length === 1 &&
          nclose(tangents[0]!.x, seconds / 2, 1e-6) &&
          nclose(tangents[0]!.y, 0, 1e-6) &&
          nclose(tangents[0]!.z, 0, 1e-6)
        )
      )
        findings.push(
          `${mode}: X sensitivity changed with its principal-axis chart at ${seconds}`,
        );
    }
    if (before + after !== completed)
      findings.push(
        `${mode}: completed playback reread mutable principal metadata`,
      );
  }
  TestValidator.equals(
    "principal inverse reuse observes current frame values",
    findings,
    [],
  );
}
