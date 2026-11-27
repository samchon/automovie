import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanHand,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Align the surface's normal exactly and its forward across that normal.
 * World-frame admission precedes rest-frame admission, as in HumanHand.align.
 */
export function alignHumanHandSurface(
  rest: Pick<IAutoMovieMotionHumanHand.IFrame, AlignHumanHandSurfaceRest>,
  world: Pick<IAutoMovieMotionHumanHand.IFrame, AlignHumanHandSurfaceWorld>,
): IAutoMovieQuaternion {
  return composed(basis(world), AutoMovieEngineQuaternion.inverse(basis(rest)));
}

/*
 * Fixed-rest alignment for repeated actual world direction pairs.
 */
export namespace alignHumanHandSurface {
  /*
   * Prepare the fixed inverse rest basis once. Each world-frame read projects
   * its own forward direction, refuses a parallel frame and composes the same
   * normalized rotation as the direct entry for admitted geometry.
   */
  export function prepare(
    rest: Pick<
      IAutoMovieMotionHumanHand.IFrame,
      AlignHumanHandSurfacePrepareRest
    >,
  ): (
    world: Pick<
      IAutoMovieMotionHumanHand.IFrame,
      AlignHumanHandSurfacePrepareWorldResult
    >,
  ) => IAutoMovieQuaternion {
    const fixed: Pick<
      IAutoMovieMotionHumanHand.IFrame,
      AlignHumanHandSurfacePrepareFixed
    > = {
      normal: { ...rest.normal },
      forward: { ...rest.forward },
    };
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(basis(fixed));
    return (
      world: Pick<
        IAutoMovieMotionHumanHand.IFrame,
        AlignHumanHandSurfacePrepareWorld
      >,
    ): IAutoMovieQuaternion => {
      const into: IAutoMovieQuaternion = basis(world);
      return composed(into, inverse);
    };
  }
}

/*
 * Complete the original projected normal/forward basis, retaining its parallel
 * refusal.
 */
function basis(
  frame: Pick<IAutoMovieMotionHumanHand.IFrame, BasisFrame>,
): IAutoMovieQuaternion {
  const n: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(frame.normal);
  const across: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    frame.forward,
    AutoMovieEngineVector3.scale(n, AutoMovieEngineVector3.dot(frame.forward, n)),
  );
  if (AutoMovieEngineVector3.length(across) < 1e-9)
    throw new Error("A forward direction must not be parallel to its normal");
  const f: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(across);
  return AutoMovieEngineMath.quaternionFromBasis(n, f, AutoMovieEngineVector3.cross(n, f));
}
/*
 * Keep normalization outside the same ordered world-times-inverse-rest product.
 */
function composed(
  world: IAutoMovieQuaternion,
  inverse: IAutoMovieQuaternion,
): IAutoMovieQuaternion {
  return AutoMovieEngineQuaternion.normalize(AutoMovieEngineQuaternion.multiply(world, inverse));
}

/*
 * The alternatives of `AlignHumanHandSurfaceWorld`'s site.
 */
type AlignHumanHandSurfaceWorld = "normal" | "forward";

/*
 * The alternatives of `AlignHumanHandSurfaceRest`'s site.
 */
type AlignHumanHandSurfaceRest = "normal" | "forward";

/*
 * The alternatives of `AlignHumanHandSurfacePrepareWorld`'s site.
 */
type AlignHumanHandSurfacePrepareWorld = "normal" | "forward";

/*
 * The alternatives of `AlignHumanHandSurfacePrepareFixed`'s site.
 */
type AlignHumanHandSurfacePrepareFixed = "normal" | "forward";
/*
 * The alternatives of `AlignHumanHandSurfacePrepareWorldResult`'s site.
 */
type AlignHumanHandSurfacePrepareWorldResult = "normal" | "forward";

/*
 * The alternatives of `AlignHumanHandSurfacePrepareRest`'s site.
 */
type AlignHumanHandSurfacePrepareRest = "normal" | "forward";

/*
 * The alternatives of `BasisFrame`'s site.
 */
type BasisFrame = "normal" | "forward";
