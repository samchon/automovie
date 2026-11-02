import { AutoMovieHumanMouthDeformation as Deformation } from "../expression/AutoMovieHumanMouthDeformation";
import { AutoMovieHumanMouthExpression as Expression } from "../expression/AutoMovieHumanMouthExpression";
import type { AutoMovieHumanSkeleton } from "../skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanExpression } from "../structures/expression/IAutoMovieHumanExpression";
import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";

/** Mouth articulation shared by an instance's skeleton and geometry consumers. */
export namespace AutoMovieHumanMouthState {
  /** Immutable mouth data prepared with the body's bind geometry. */
  export interface IPrepared {
    /** Mouth and hinge in calibration millimetres. */
    context: Deformation.IContext;

    /** Model metres per calibration millimetre. */
    scale: number;

    /** The person's maximal interincisal opening in millimetres. */
    maximal: number;
  }

  /** Compose speech with the authored jaw once, without changing authored data. */
  export function pose(
    prepared: IPrepared | undefined,
    authored: IAutoMovieHumanPose,
    expression: IAutoMovieHumanExpression,
  ): IAutoMovieHumanPose {
    const resolved: Expression.IResolved = resolve(prepared, expression);
    if (resolved.opening === 0) return authored;
    return {
      ...authored,
      head: {
        ...authored.head,
        jaw: {
          ...authored.head?.jaw,
          opening: (authored.head?.jaw?.opening ?? 0) + resolved.opening,
        },
      },
    };
  }

  /** Channels plus the total jaw opening actually applied by the evaluator. */
  export function channels(
    prepared: IPrepared | undefined,
    authored: IAutoMovieHumanPose,
    expression: IAutoMovieHumanExpression,
    output: AutoMovieHumanSkeleton.IOutput,
  ): Expression.IResolved {
    const resolved: Expression.IResolved = resolve(prepared, expression);
    const opening: number = (authored.head?.jaw?.opening ?? 0) + resolved.opening;
    resolved.opening = output.clamped.find(
      (entry: AutoMovieHumanSkeleton.IClamp): boolean => entry.path === "head.jaw.opening",
    )?.applied ?? opening;
    return resolved;
  }

  /**
   * Displace a part's original bind buffers, before its declared skinning.
   * Every call reads the immutable bind, so updates never accumulate offsets.
   */
  export function deform(
    prepared: IPrepared | undefined,
    resolved: Expression.IResolved,
    id: string,
    positions: ArrayLike<number>,
    normals: ArrayLike<number> | null,
  ): ReturnType<typeof Deformation.displace> {
    if (prepared === undefined || Expression.still(resolved) || !MOVED.test(id))
      return null;
    return Deformation.displace(
      positions,
      normals,
      prepared.scale,
      Deformation.field(prepared.context, resolved, resolved.opening),
      id === "human.mouth.tongue",
      prepared.context.mouth,
    );
  }

  /** Resolve only supported body articulation; never accept a silent missing consumer. */
  function resolve(prepared: IPrepared | undefined, expression: IAutoMovieHumanExpression): Expression.IResolved {
    const resolved: Expression.IResolved = Expression.resolve(expression, prepared?.maximal ?? 1);
    if (prepared === undefined && (!Expression.still(resolved) || resolved.opening > 0))
      throw new Error("Human body has no prepared mouth for this expression");
    return resolved;
  }
}

/** The lining shares the lip field; teeth and gums keep their rigid shapes. */
const MOVED: RegExp = /^human\.(skin|cavity)\.|^human\.mouth\.(lining|tongue)$/;
