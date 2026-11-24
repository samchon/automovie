import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal, readPropGrip } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of one quarter turn, unit vector components. */
const ROUNDING: number = 1e-12;

/**
 * `readPropGrip` reads a named point of a prop as a hand's grip at a film
 * second: the aimed point and normal as displayed, half the affordance's
 * aperture as the radius, and the handle's local +X carried by the prop's frame
 * and the affordance's own as the wrapped axis; with no affordance there is no
 * axis and no radius. A point the prop does not declare is refused on the
 * caller's axis.
 *
 * Scenarios, a bar prop turned a quarter about +Y, its `grip` affordance turned
 * another quarter, 0.04 m across:
 *
 * 1. The grip at 2 s takes the aimed point and normal at 2 s, radius 0.02, and the
 *    axis +X turned a half about +Y, -X.
 * 2. The `tip` point, with no affordance, takes radius 0 and no axis.
 * 3. A `knob` point is refused on `bar`.
 */
export function test_unit_motions_carrier_read_prop_grip(): void {
  const quarter = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const asked: { target: IAutoMovieMotionTarget; seconds: number }[] = [];
  const context: readPropGrip.IContext = {
    prop: (): readPropGrip.IReader => ({
      prop: {
        points: {
          grip: { point: { x: 0, y: 1, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
          tip: { point: { x: 1, y: 1, z: 0 }, normal: { x: 1, y: 0, z: 0 } },
        },
        affordances: [
          {
            id: "grip",
            kind: "handle",
            frame: {
              translation: { x: 0, y: 1, z: 0 },
              rotation: quarter,
              scale: { x: 1, y: 1, z: 1 },
            },
            extent: null,
            aperture: 0.04,
          },
        ],
      },
      frame: () => ({ rotation: quarter }),
    }),
    aim: (target: IAutoMovieMotionTarget, seconds: number) => {
      asked.push({ target, seconds });
      return {
        point: { x: seconds, y: 1, z: 0 },
        normal: { x: 0, y: 1, z: 0 },
      };
    },
  };
  const grip: IAutoMovieMotionHumanMountRider.IHoldGrip = readPropGrip(
    context,
    "bar",
    "grip",
    2,
    "bar",
  );
  TestValidator.predicate(
    "a handle",
    vclose(grip.point, { x: 2, y: 1, z: 0 }, ROUNDING) &&
      grip.radius === 0.02 &&
      vclose(grip.axis!, { x: -1, y: 0, z: 0 }, ROUNDING) &&
      asked[0]!.seconds === 2,
  );
  TestValidator.equals("the aim", asked[0]!.target, {
    kind: "prop",
    subject: "bar",
    point: "grip",
  });
  const tip: IAutoMovieMotionHumanMountRider.IHoldGrip = readPropGrip(
    context,
    "bar",
    "tip",
    0,
    "bar",
  );
  const normal: IAutoMovieVector3 = tip.normal;
  TestValidator.predicate(
    "no affordance",
    tip.radius === 0 && tip.axis === undefined && normal.y === 1,
  );
  let axis: string | undefined;
  try {
    readPropGrip(context, "bar", "knob", 0, "bar");
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) axis = error.axis;
  }
  TestValidator.equals("an undeclared point", axis, "bar");
}
