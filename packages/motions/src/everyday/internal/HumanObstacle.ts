import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * The obstacle a prop is, at a second.
 *
 * @param context The action's context.
 * @param subject The obstacle's prop subject.
 * @param from Where the performer stands, world metres; from behind the edge's
 *   face the near side is the top's far edge.
 * @returns The near side, the height and the depth.
 * @throws {HumanRefusal} When the prop declares no edge or top, no depth, or a
 *   non-positive height or depth.
 */
export function HumanObstacle(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  subject: string,
  from?: IAutoMovieVector3,
): HumanObstacle.IObstacle {
  const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
  const affordances: readonly IAutoMovieAffordance[] =
    read.prop.affordances ?? [];
  const find = (id: string): IAutoMovieAffordance | undefined =>
    affordances.find((a: IAutoMovieAffordance): boolean => a.id === id);
  const refuse = (reason: string): IAutoMovieMotionHumanRefusal =>
    new HumanRefusal({
      kind: "affordance",
      axis: "obstacle",
      value: subject,
      feasible: {
        kind: "alternatives",
        values: affordances.map((a: IAutoMovieAffordance): string => a.id),
      },
      reason,
      fix:
        "step over a kerb or a hurdle, whose edge and depth their contacts declare (AutoMovieArchetypeKerb.create, AutoMovieArchetypeHurdle.create)",
    });
  const edge: IAutoMovieAffordance | undefined = find("edge") ?? find("top");
  if (edge === undefined)
    throw refuse(`${subject} declares no edge or top to step over`);
  const depth: number | undefined =
    edge.id === "edge" ? find("top")?.depth : find("bar")?.aperture;
  if (depth === undefined)
    throw refuse(`${subject} declares no depth behind its ${edge.id}`);
  const frame: IAutoMovieRigidTransform = read.frame(context.start);
  const near: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, edge.frame.translation),
  );
  const height: number = near.y - frame.position.y;
  if (!(height > 0 && depth > 0))
    throw refuse(
      `${subject} stands ${height.toFixed(3)} m high and ${depth.toFixed(3)} m deep; an obstacle has a positive height and depth`,
    );
  // The near side is whichever of the edge and the top's far side, a depth
  // back across it, faces the performer: stepping out of a tub, the inner
  // side of its apron.
  const outward: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(frame.rotation, edge.frame.rotation),
    { x: 0, y: 0, z: 1 },
  );
  const across: IAutoMovieVector3 = Vector3.normalize({
    x: outward.x,
    y: 0,
    z: outward.z,
  });
  const back: IAutoMovieVector3 = Vector3.subtract(
    near,
    Vector3.scale(across, depth),
  );
  const side: IAutoMovieVector3 =
    from !== undefined &&
    Math.abs(Vector3.dot(Vector3.subtract(from, back), across)) <
      Math.abs(Vector3.dot(Vector3.subtract(from, near), across))
      ? back
      : near;
  return {
    at: { x: side.x, y: frame.position.y, z: side.z },
    height,
    depth,
  };
}

/**
 * A low obstacle as a stepping-over act reads it: the middle of its near side
 * on the floor, its height and its depth.
 *
 * The near side is the obstacle's `edge` contact, a kerb's top front edge
 * (`AutoMovieArchetypeKerb.create`), or without one its `top`, a hurdle's top
 * bar edge (`AutoMovieArchetypeHurdle.create`): a ledge along its `+X` with `+Y`
 * up, its height the edge's above the prop's base. Its depth is the `top`
 * face's depth behind a kerb's edge, or a hurdle's `bar` thickness, that bar's
 * aperture.
 */
export namespace HumanObstacle {
  /** An obstacle where it stands. */
  export interface IObstacle {
    /** The middle of its near side on the floor, world metres. */
    at: IAutoMovieVector3;

    /** Its height, metres. */
    height: number;

    /** Its depth across the near side, metres. */
    depth: number;
  }
}

/** The alternatives of `OfContext`'s site. */
type OfContext = "prop" | "start";
