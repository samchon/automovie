import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanSustainedForce,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanLoad } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** A force site at the hips. */
const HIPS: IAutoMovieMotionHumanSustainedForce["at"] = {
  bone: "hips",
  point: { x: 0, y: 0, z: 0 },
};

/**
 * `HumanLoad` reads what a load does to a body: the lean back that balances a
 * load carried ahead, `−asin(F a / (M h))`; the inertial force of an
 * accelerated frame, `−m a`; whether an acceleration tips a body, `h |a| / g
 *
 * > Half its base`; the friction a ground acceleration needs, `|a_level| / (g
 *
 * - A_y)`; and the sustained forces on a subject at a second, summed.
 *
 * Scenarios:
 *
 * 1. 70 kg with its centre at 1 m holding 20 kg 0.5 m ahead leans back `asin(1 /
 *    7)`; a load its weight cannot balance gives none.
 * 2. An accelerated frame pushes a 70 kg body back by 70 times its acceleration.
 * 3. At 1 m over a 0.5 m half base, 6 m/s² tips and 4 m/s² does not.
 * 4. A level 5 m/s² needs `5 / g` of friction; falling freely, any is too little.
 * 5. The sum on `a` at 1 s is its two sustained forces' values, not its impulse
 *    nor `b`'s force.
 */
export function test_motions_perform_human_load(): void {
  const g: number = AutoMovieGravity.STANDARD;
  TestValidator.predicate(
    "the lean",
    nclose(
      HumanLoad.lean({ mass: 70, height: 1, load: 20, ahead: 0.5 })!,
      (-Math.asin(1 / 7) * 180) / Math.PI,
      1e-12,
    ) &&
      HumanLoad.lean({ mass: 70, height: 1, load: 200, ahead: 0.5 }) === null,
  );
  const pushed: IAutoMovieMotionHumanSustainedForce = HumanLoad.inertial(
    "a",
    70,
    (): IAutoMovieVector3 => ({ x: 1, y: 0, z: 2 }),
    0,
    2,
  );
  TestValidator.predicate(
    "the inertial force",
    pushed.from === 0 &&
      pushed.to === 2 &&
      vclose(
        HumanLoad.sustained([pushed], "a", 1),
        { x: -70, y: 0, z: -140 },
        1e-12,
      ),
  );
  TestValidator.predicate(
    "tipping",
    HumanLoad.tips(6, 1, 0.5) && !HumanLoad.tips(4, 1, 0.5),
  );
  TestValidator.predicate(
    "the friction needed",
    nclose(HumanLoad.required({ x: 3, y: 0, z: 4 }), 5 / g, 1e-12) &&
      HumanLoad.required({ x: 1, y: -g, z: 0 }) === Infinity,
  );
  const forces: IAutoMovieMotionHumanForce[] = [
    {
      kind: "sustained",
      subject: "a",
      at: HIPS,
      from: 0,
      to: 2,
      force: { x: 1, y: 0, z: 0 },
    },
    {
      kind: "sustained",
      subject: "a",
      at: HIPS,
      from: 0.5,
      to: 1.5,
      force: (seconds: number): IAutoMovieVector3 => ({
        x: 0,
        y: seconds,
        z: 0,
      }),
    },
    {
      kind: "sustained",
      subject: "a",
      at: HIPS,
      from: 2,
      to: 3,
      force: { x: 9, y: 9, z: 9 },
    },
    {
      kind: "impulse",
      subject: "a",
      at: HIPS,
      seconds: 1,
      impulse: { x: 5, y: 5, z: 5 },
    },
    {
      kind: "sustained",
      subject: "b",
      at: HIPS,
      from: 0,
      to: 2,
      force: { x: 7, y: 7, z: 7 },
    },
  ];
  TestValidator.predicate(
    "the sum",
    vclose(HumanLoad.sustained(forces, "a", 1), { x: 1, y: 1, z: 0 }, 1e-12),
  );
}
