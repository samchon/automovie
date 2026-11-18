import type {
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanCarried,
  HumanCarriedCoupling,
  HumanCarriedCouplingLoad,
  HumanLoad,
  HumanRefusal,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The coupled carry's laws (#3437) hold their closed forms: the bearing
 * shares are the vertical reactions of a body resting on point supports,
 * a bearer's load is its share of the borne mass at the borne centre's
 * distance, and the capacity is the moment-balance bound over that share.
 *
 * Every expectation is computed here from the statics as the module states
 * it: three supports not on one line carry a weight over a point inside
 * them by its barycentric coordinates (the force sum and the two moment
 * balances, three equations in three unknowns); a weight outside their
 * triangle needs a negative reaction, which a resting contact cannot give;
 * collinear supports balance the weight along their line by the lever rule,
 * a support that would have to pull bearing nothing. The capacity is `HumanLoad.lean`'s
 * bound `m d <= M h`. Tolerances are round-off, 1e-9.
 *
 * Scenarios:
 * 1. Three supports at the corners of a right triangle: a centre at their
 *    centroid gives a third each; a centre at a corner gives that corner
 *    all of it; a centre on the middle of an edge gives its two ends half
 *    each.
 * 2. A centre outside the triangle gives no negative share, and the shares
 *    still sum to one.
 * 3. Three collinear supports at 0, 1 and 2 m under a centre at 0.3 m: the
 *    far one would have to pull, so the two near ones carry 0.7 and 0.3,
 *    the lever rule.
 * 4. One support carries everything.
 * 5. For each carry of `HumanCarried.CARRIES` on the average man bearing the
 *    small woman, the coupling's load for the bearer is its contacts' share
 *    of the borne mass, the shares on every support (the bearer, and the
 *    floor under a drag) summing to one.
 * 6. A borne mass just past the bearer's capacity in a cradle, the small
 *    woman bearing another of her build with extra mass, is refused on `mass`
 *    with the feasible maximum `M h / |d|` over the bearer's share; the
 *    same carry within it is accepted.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public share, load and capacity on inputs whose answers the statics give; a share that is not the reaction, a negative share, a load that ignores the share or a wrong capacity fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The barycentric reactions and the bound are evaluated in the test from their equations.
 * @evidence contracts/development/testing.md#distinguishing-cases Inside, on a corner, on an edge and outside a triangle, collinear and single supports, every carry, and both sides of the capacity.
 * @evidence contracts/development/testing.md#execution-ownership Arithmetic and three polygon men in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the laws, their derivations and the 6 scenarios.
 */
export function test_human_motion_coupled_laws(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;
  const p = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const triangle: IAutoMovieVector3[] = [p(0, 0), p(1, 0), p(0, 1)];
  const sum = (w: readonly number[]): number =>
    w.reduce((s: number, v: number): number => s + v, 0);

  // 1. Inside, at a corner, on an edge.
  for (const [label, centre, expected] of [
    ["the centroid", p(1 / 3, 1 / 3), [1 / 3, 1 / 3, 1 / 3]],
    ["a corner", p(1, 0), [0, 1, 0]],
    ["an edge's middle", p(0.5, 0), [0.5, 0.5, 0]],
  ] as const) {
    const w: number[] = HumanCarriedCouplingLoad.shares(triangle, centre);
    all.check(
      `a centre at ${label}: shares ${w.map((v) => v.toFixed(6)).join(", ")}, ${expected.join(", ")} expected`,
      w.length === 3 &&
        w.every((v: number, i: number): boolean => close(v, expected[i]!)),
    );
  }

  // 2. Outside.
  const outside: number[] = HumanCarriedCouplingLoad.shares(triangle, p(2, 2));
  all.check(
    `a centre outside: shares ${outside.join(", ")}, none negative and summing to one expected`,
    outside.every((v: number): boolean => v >= 0) && close(sum(outside), 1),
  );

  // 3 and 4. Collinear and single.
  const line: number[] = HumanCarriedCouplingLoad.shares(
    [p(0, 0), p(1, 0), p(2, 0)],
    p(0.3, 0),
  );
  // The lever rule over the two near supports: 0.3 m from the first and
  // 0.7 m from the second of a 1 m span.
  const lever: readonly number[] = [0.7, 0.3, 0];
  all.check(
    `collinear supports: shares ${line.join(", ")}, ${lever.join(", ")} expected`,
    line.every((v: number, i: number): boolean => close(v, lever[i]!)),
  );
  all.check(
    "one support carries everything",
    close(HumanCarriedCouplingLoad.shares([p(0, 0)], p(5, 5))[0]!, 1),
  );

  // 5. The bearer's load is its contacts' share.
  const bearer = motionHumanBody("m-average");
  const borne = motionHumanBody("f-small");
  for (const carry of Object.keys(
    HumanCarried.CARRIES,
  ) as IAutoMovieMotionHumanCarried.Carry[]) {
    let coupling: IAutoMovieMotionCoupling;
    try {
      coupling = HumanCarriedCoupling.couple(
        bearer,
        borne,
        HumanCarried.CARRIES[carry],
        carry,
      );
    } catch (error) {
      all.check(
        `${carry}: coupled expected, refused with ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
      continue;
    }
    // Every bearing contact's share, the bearer's and the floor's under a
    // drag, together carry the whole weight.
    const share: number = sum(
      coupling.contacts.filter((c) => c.kind === "bear").map((c) => c.load),
    );
    all.check(
      `${carry}: the bearing shares on every support sum to ${share}, one expected`,
      close(share, 1),
    );
    const own: number = sum(
      coupling.contacts
        .filter((c) => c.on.role === HumanCarriedCoupling.BEARER)
        .map((c) => c.load),
    );
    const load = HumanCarriedCouplingLoad.load(bearer, coupling);
    all.check(
      `${carry}: the bearer's load is ${load.load} kg, the borne ${coupling.mass} kg times its share ${own} expected`,
      close(load.load, coupling.mass * own),
    );
  }

  // 6. The capacity, both sides.
  const small = motionHumanBody("f-small");
  // The bound is read from a carry the small bearer can hold, the small
  // woman cradling another of her build.
  const base: IAutoMovieMotionCoupling = HumanCarriedCoupling.couple(
    small,
    small,
    HumanCarried.CARRIES.cradle,
    "cradle",
  );
  const props = HumanCarriedCouplingLoad.load(small, base);
  const capacity: number = (props.mass * props.height) / Math.abs(props.ahead);
  all.check(
    `the moment balance leans at the cradle's load (${props.load.toFixed(1)} kg against a capacity of ${capacity.toFixed(1)} kg)`,
    props.load > capacity || HumanLoad.lean(props) !== null,
  );
  if (capacity > base.mass) {
    let refusal: IAutoMovieMotionHumanRefusal | null = null;
    try {
      HumanCarriedCoupling.couple(
        small,
        small,
        HumanCarried.CARRIES.cradle,
        "cradle",
        capacity - base.mass + 1,
      );
    } catch (error) {
      if (error instanceof HumanRefusal) refusal = error;
      else throw error;
    }
    all.check(
      `1 kg past the capacity: a participant refusal on mass with the maximum ${capacity.toFixed(3)} kg expected, read ${refusal?.message ?? "none"}`,
      refusal !== null &&
        refusal.kind === "participant" &&
        refusal.axis === "mass" &&
        refusal.feasible?.kind === "range" &&
        refusal.feasible.maximum !== null &&
        Math.abs(refusal.feasible.maximum - capacity) <= 1e-6 * capacity,
    );
    all.check(
      "1 kg within the capacity is coupled",
      (() => {
        try {
          HumanCarriedCoupling.couple(
            small,
            small,
            HumanCarried.CARRIES.cradle,
            "cradle",
            capacity - base.mass - 1,
          );
          return true;
        } catch {
          return false;
        }
      })(),
    );
  }
  all.assert("the coupled carry's laws hold their closed forms");
}
