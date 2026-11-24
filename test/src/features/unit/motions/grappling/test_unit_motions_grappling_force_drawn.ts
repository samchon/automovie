import { HumanForceDrawn } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `HumanForceDrawn` is a body drawn off balance by a constant force against its
 * own inverted-pendulum stiffness: the offset `a (cosh ωt − 1)` with `a = F /
 * (m ω²)`, its speed `a ω sinh ωt`, and the extrapolated offset `x + v / ω`.
 *
 * A 70 kg body at ω = 3 /s is pulled by 63 N: `a = 63 / (70 · 9) = 0.1` m.
 *
 * Scenarios:
 *
 * 1. At 0 s nothing has moved; before it the state is the start's.
 * 2. At 1 s the offset is `0.1 (cosh 3 − 1)`, the speed `0.3 sinh 3`, and the
 *    extrapolation their sum over ω; the prepared motion agrees.
 */
export function test_unit_motions_grappling_force_drawn(): void {
  const props: HumanForceDrawn.IProps = { mass: 70, frequency: 3, force: 63 };
  const start: HumanForceDrawn.IState = HumanForceDrawn.sample({
    ...props,
    seconds: -1,
  });
  TestValidator.equals("at rest at the start", start, {
    offset: 0,
    speed: 0,
    extrapolated: 0,
  });
  const at: HumanForceDrawn.IState = HumanForceDrawn.sample({
    ...props,
    seconds: 1,
  });
  const offset: number = 0.1 * (Math.cosh(3) - 1);
  const speed: number = 0.3 * Math.sinh(3);
  TestValidator.predicate(
    "the closed form at 1 s",
    nclose(at.offset, offset, 1e-12) &&
      nclose(at.speed, speed, 1e-12) &&
      nclose(at.extrapolated, offset + speed / 3, 1e-12) &&
      nclose(HumanForceDrawn.prepare(props).offset(1), offset, 1e-12) &&
      nclose(HumanForceDrawn.prepare(props).sample(1).speed, speed, 1e-12) &&
      HumanForceDrawn.prepare(props).sample(-1).offset === 0,
  );
}
