import { AutoMovieEngineAffordanceArticulation, AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPianoPedal,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Read a released upright damper pedal and its hinge in world coordinates.
 * Parameter context: The action's target prop and start time.
 * Returns: The plate and hinge geometry needed by the foot rocker.
 * If the prop or the pedal cannot be staged at rest.
 */
export function readPianoPedal(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPianoPedal>,
): IPedal {
  const id: string = context.params.prop;
  const source: IAutoMovieMotionHumanPropReader = context.prop(id);
  const { prop } = source;
  const byId: Map<string, IAutoMovieAffordance> = new Map(
    prop.affordances?.map(
      (site: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [
        site.id,
        site,
      ],
    ),
  );
  const pedal: IAutoMovieAffordance | undefined = byId.get("damperPedal");
  const hinge: IAutoMovieAffordance | undefined = byId.get("damperPedalHinge");
  if (
    prop.fixed !== true ||
    prop.motion !== undefined ||
    prop.articulate === undefined ||
    pedal?.kind !== "pedal" ||
    pedal.travel !== undefined ||
    pedal.width === undefined ||
    pedal.depth === undefined ||
    hinge?.kind !== "hinge" ||
    hinge.travel === undefined ||
    hinge.travel >= 90 ||
    ![hinge.travel, pedal.width, pedal.depth].every(
      (dimension: number): boolean =>
        dimension > 0,
    ) ||
    pedal.follows !== undefined ||
    pedal.rides !== hinge.id ||
    hinge.rides !== undefined ||
    hinge.follows !== undefined ||
    AutoMovieEngineAffordanceArticulation.travel(
      byId,
      source.state?.(context.start) ?? {},
      hinge.id,
    ) !== 0
  )
    refuse(
      id,
      "supply a fixed articulated upright piano with a released damper pedal",
    );
  const frame: IAutoMovieRigidTransform = source.frame(context.start);
  const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    frame.rotation,
    pedal.frame.rotation,
  );
  const up: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    AutoMovieEngineQuaternion.multiply(frame.rotation, hinge.frame.rotation),
    { x: 0, y: 1, z: 0 },
  );
  const lateral: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  const offset: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    frame.rotation,
    AutoMovieEngineVector3.subtract(pedal.frame.translation, hinge.frame.translation),
  );
  if (
    up.y < 1 - 1e-9 ||
    AutoMovieEngineVector3.dot(lateral, axis) < 1 - 1e-9 ||
    Math.abs(offset.y) > 1e-9
  )
    refuse(id, "stage the upright piano on a level floor");
  const pivot: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    frame.position,
    AutoMovieEngineQuaternion.rotateVector(frame.rotation, hinge.frame.translation),
  );
  return {
    point: AutoMovieEngineVector3.add(pivot, offset),
    rotation,
    pivot,
    axis,
    travel: hinge.travel,
    width: pedal.width,
    depth: pedal.depth,
  };
}

/*
 * The admitted level plate in world space.
 */
interface IPedal {
  /*
   * Centre of the undepressed plate.
   */
  point: IAutoMovieVector3;
  /*
   * Plate axes, used to check the ball lies within the plate.
   */
  rotation: IAutoMovieQuaternion;
  /*
   * Hinge pivot and positive lateral axis in world space.
   */
  pivot: IAutoMovieVector3;
  axis: IAutoMovieVector3;
  /*
   * Plate dimensions in metres and hinge travel in degrees.
   */
  width: number;
  depth: number;
  travel: number;
}

/*
 * Report the prop placement the author can correct.
 */
function refuse(value: string, fix: string): never {
  throw new AutoMovieMotionHumanRefusal({
    kind: "reach",
    axis: "prop",
    value,
    reason: "the right-foot damper action cannot be placed",
    fix,
  });
}
