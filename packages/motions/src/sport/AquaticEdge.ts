import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMaterialContact } from "../posture/HumanMaterialContact";
import { AquaticPosture } from "./AquaticPosture";

/**
 * The performance's named pool edge at the action's start.
 *
 * @throws {HumanRefusal} When no support is named, or it declares no edge.
 */
export function AquaticEdge(
  context: AquaticPosture.Context,
): AquaticEdge.IEdge {
  const id: string | undefined = context.params.support;
  if (id === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "support",
      value: null,
      reason: "an exit is made over a named edge",
      fix: "give the pool edge's subject id in support",
    });
  const edge: IAutoMovieMotionHumanPropReader = context.prop(id);
  const frame: IAutoMovieRigidTransform = edge.frame(context.start);
  const contact: IAutoMovieAffordance | undefined = (
    edge.prop.affordances ?? []
  ).find((a: IAutoMovieAffordance): boolean => a.id === "edge");
  if (contact === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "support",
      value: id,
      reason: "the support declares no edge",
      fix: "use a pool edge with an `edge` contact",
    });
  return {
    id,
    lip: Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, contact.frame.translation),
    ),
    out: Quaternion.rotateVector(frame.rotation, { x: 0, y: 0, z: 1 }),
    across: Quaternion.rotateVector(frame.rotation, { x: 1, y: 0, z: 0 }),
  };
}

/**
 * A pool edge as the exits read it: the lip, where the deck meets the wall
 * face, and the edge's own directions, out over the water and along the wall.
 * The named support must declare an `edge` contact; the edge prop's frame puts
 * the water toward its `+Z` (`createPoolEdge`).
 */
export namespace AquaticEdge {
  /** Bind the actual receiving deck when the stage declares its perimeter. */
  export function deck(
    context: AquaticPosture.Context,
    edge: IEdge,
  ): HumanMaterialContact.ISite | undefined {
    const prop: IAutoMovieMotionHumanPropReader = context.prop(edge.id);
    return (
      HumanMaterialContact.prepare(prop, "deckFace", context.start) ??
      HumanMaterialContact.prepare(prop, "deck", context.start)
    );
  }

  /** Refuse an expected receiving footprint outside the named material. */
  export function admit(
    edge: IEdge,
    face: HumanMaterialContact.IFace,
    points: readonly IAutoMovieVector3[],
    part: string,
  ): void {
    if (
      points.some(
        (point: IAutoMovieVector3): boolean =>
          HumanMaterialContact.point(face, point) === undefined,
      )
    )
      throw new HumanRefusal({
        kind: "reach",
        axis: "support",
        value: edge.id,
        reason: `the ${part} projects outside the receiving pool deck`,
        fix: "use a wider or deeper deck at the named pool edge",
      });
  }

  /** A pool edge in the world. */
  export interface IEdge {
    /** The edge prop's subject id. */
    id: string;

    /** Where the deck meets the wall face, world metres. */
    lip: IAutoMovieVector3;

    /** The unit horizontal direction out from the wall over the water. */
    out: IAutoMovieVector3;

    /** The unit horizontal direction along the wall. */
    across: IAutoMovieVector3;
  }

  /**
   * A world point `out` metres out from the lip over the water (negative: back
   * on the deck), `side` along it and `up` above it.
   */
  export function at(
    edge: IEdge,
    out: number,
    side: number,
    up: number,
  ): IAutoMovieVector3 {
    return Vector3.add(
      edge.lip,
      Vector3.add(
        Vector3.add(
          Vector3.scale(edge.out, out),
          Vector3.scale(edge.across, side),
        ),
        { x: 0, y: up, z: 0 },
      ),
    );
  }
}
