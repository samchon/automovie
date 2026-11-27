import { AutoMovieEngineTransform } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
} from "@automovie/interface";

/*
 * A fixed ladder as a fixture prop: ten rungs `rung1` upward at 0.3 m (OSHA
 * 1910.23(b)(2)), 0.41 m wide and 30 mm round, its rungs 0.35 m ahead of the
 * origin along `+Z`, each facing the climber at `-Z` as `createLadder`'s do.
 * Returns: The ladder.
 */
export function climbCaseLadder(): IAutoMovieMotionHumanProp {
  // Each rung's frame turns +Y to -Z, toward the climber.
  const out: IAutoMovieQuaternion = {
    x: -Math.SQRT1_2,
    y: 0,
    z: 0,
    w: Math.SQRT1_2,
  };
  const affordances: IAutoMovieAffordance[] = Array.from(
    { length: 10 },
    (_: unknown, i: number): IAutoMovieAffordance => ({
      id: `rung${i + 1}`,
      kind: "bar",
      frame: AutoMovieEngineTransform.of({ x: 0, y: 0.3 * (i + 1), z: 0 }, out),
      extent: null,
      grip: "power",
      aperture: 0.03,
      length: 0.41,
    }),
  );
  return {
    subject: "ladder",
    frame: {
      position: { x: 0, y: 0, z: 0.35 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    affordances,
    fixed: true,
  };
}
