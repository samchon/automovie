import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  type AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeSpan,
} from "../core";

/**
 * The riding saddle's mass when it travels alone, kilograms: authored, as the
 * horse producer carries none for its tack parts either.
 */
const MASS: number = 7;

/**
 * A horse's riding saddle as a prop a handler can carry, made of the saddle
 * parts of the same horse saddled.
 *
 * The prop keeps the saddled horse's model frame: every rigid part a saddled
 * horse has and the same horse untacked or bareback lacks (the saddle tree, its
 * leathers and stirrups) is laid again at its own place, so laying the prop's
 * `seat` on the horse's `saddle` socket (`AutoMovieArchetypeEquineCare`) puts
 * every part exactly where the producer saddles it. Flexible spans such as
 * reins stay with the horse. `grip` is the near (left) edge of the saddle tree,
 * where a hand carries and lays the saddle from the horse's near side.
 *
 * Public only so the package's specs can reach it: it is not part of the
 * authoring surface, and it moves to an internal subpath when one exists.
 */
export namespace AutoMovieArchetypeEquineSaddleProp {
  /**
   * The contacts: `grip`, the saddle tree's near edge a hand carries the saddle
   * by; `seat`, the saddle's frame, laid on the horse's `saddle` socket.
   */
  export type Affordance = "grip" | "seat";

  /**
   * The saddle of a saddled horse, apart from it.
   *
   * @param saddled The horse with its riding saddle.
   * @param bare The same horse without it, untacked or bareback.
   * @returns The saddle prop.
   * @throws {RangeError} When the saddled horse lacks its bearing deck or a
   *   saddle part is neither an admitted convex cell nor a supported solid.
   */
  export function of(
    saddled: AutoMovieArchetype<string, string>,
    bare: Pick<AutoMovieArchetype<string, string>, "parts">,
  ): AutoMovieArchetype<Affordance, never> {
    const kept: ReadonlySet<string> = new Set(
      bare.parts.map((part: IAutoMovieModelPart): string => part.id),
    );
    const spans: ReadonlySet<string> = new Set(
      saddled.spans.map(
        (span: AutoMovieArchetypeSpan.ISpan): string => span.id,
      ),
    );
    const builder: AutoMovieArchetypeBuilder<Affordance, never> =
      new AutoMovieArchetypeBuilder({
        material: "leather",
        name: "riding saddle",
        draw: new AutoMovieArchetypeDrawSession<never>(
          "saddle",
          {},
          undefined,
          {},
        ),
      });
    for (const part of saddled.parts) {
      if (kept.has(part.id) || spans.has(part.id)) continue;
      const geometry: IAutoMovieModelPart["geometry"] = part.geometry;
      const frame: IAutoMovieTransform =
        part.transform ?? AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 });
      const cell: AutoMovieArchetypeConvexCell.ICell | undefined =
        saddled.convexCells.get(part.id);
      if (cell !== undefined) {
        builder.convex(part.id, cell, frame.translation, {
          rotation: frame.rotation,
        });
        continue;
      }
      if (geometry.type !== "primitive")
        throw new RangeError(`The saddle part ${part.id} has no admitted solid`);
      const shape: typeof geometry.shape = geometry.shape;
      if (shape.type === "box")
        builder.box(
          part.id,
          Vector3.create(shape.width, shape.height, shape.depth),
          frame.translation,
          { rotation: frame.rotation },
        );
      else if (shape.type === "cylinder" || shape.type === "capsule") {
        const half: IAutoMovieVector3 = Quaternion.rotateVector(
          frame.rotation,
          {
            x: 0,
            y: shape.height / 2,
            z: 0,
          },
        );
        builder.rod(
          part.id,
          shape.radius,
          Vector3.subtract(frame.translation, half),
          Vector3.add(frame.translation, half),
          { round: shape.type === "capsule" },
        );
      } else if (shape.type === "sphere")
        builder.ball(part.id, shape.radius, frame.translation);
      else
        throw new RangeError(
          `The saddle part ${part.id} is not a box, bar or ball`,
        );
    }
    // A saddle is carried and laid from the near (left) side, the hand on the tree's near edge.
    const tree: IAutoMovieModelPart | undefined = saddled.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "saddle",
    );
    if (
      tree?.transform === undefined ||
      tree.transform === null ||
      tree.geometry.type !== "primitive" ||
      tree.geometry.shape.type !== "box"
    )
      throw new RangeError(
        "A saddle prop needs the saddled horse's saddle tree",
      );
    const edge: IAutoMovieVector3 = Vector3.add(
      tree.transform.translation,
      Quaternion.rotateVector(tree.transform.rotation, {
        x: tree.geometry.shape.width / 2,
        y: tree.geometry.shape.height / 2,
        z: 0,
      }),
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        edge,
        Quaternion.rotateVector(tree.transform.rotation, { x: 1, y: 0, z: 0 }),
        Quaternion.rotateVector(tree.transform.rotation, { x: 0, y: 0, z: 1 }),
      ),
      extent: null,
      grip: "power",
      aperture: tree.geometry.shape.height,
    });
    builder.affordance({
      id: "seat",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
      extent: null,
    });
    return builder.build(MASS);
  }
}
