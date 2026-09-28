/**
 * Resolve the three exterior door voids from built wall faces and include the
 * site-owned side gate as a fourth, independent placement. Each prototype is
 * the model owner's closed rest state. Materials bind its face IDs later.
 */
import type { IAutoMovieMeshTransform } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { ExteriorDoor } from "../models/exterior-door";
import { GarageDoor } from "../models/garage-door";
import { Gate } from "../models/gate";
import { SIDE_WALK } from "../spaces/site/side-walk";

type Prototype =
  | ReturnType<ExteriorDoor["buildFront"]>
  | ReturnType<GarageDoor["build"]>
  | ReturnType<Gate["build"]>;
type Placement = {
  id: string;
  modelId: string;
  transform: IAutoMovieMeshTransform;
};
type DoorForm = "front" | "garage" | "garden";
const FORMS: Readonly<
  Record<string, readonly [DoorForm, number, number, number]>
> = {
  "front-door": ["front", 1.0, 2.2, 0],
  "garage-front-door": ["garage", 5.0, 2.3, 0],
  "garden-door": ["garden", 2.4, 2.25, Math.PI],
};
const TOLERANCE = 1e-7;

/** One instance per wall opening, plus the separately reserved fence gate. */
export class ExteriorDoorFills {
  public build(
    environment: IAutoMovieBuiltEnvironment,
    maximum = false,
  ): {
    prototypes: Prototype[];
    instances: Placement[];
  } {
    const doors = environment.openings.filter(
      (o) => o.kind === "door" && FORMS[o.id] !== undefined,
    );
    const expected = Object.keys(FORMS);
    const ids = new Set(doors.map((o) => o.id));
    if (
      doors.length !== expected.length ||
      ids.size !== doors.length ||
      expected.some((id) => !ids.has(id))
    )
      throw new Error(
        "exterior door opening population differs from reviewed assignments",
      );
    const boundaries = new Map(environment.boundaries.map((b) => [b.id, b]));
    const exterior = new ExteriorDoor(),
      garage = new GarageDoor(),
      gate = new Gate();
    const prototypes: Prototype[] = [],
      instances: Placement[] = [];
    for (const opening of doors) {
      const [form, expectedWidth, expectedHeight, yaw] = FORMS[opening.id]!;
      const face = boundaries.get(opening.boundary)?.face,
        outline = opening.profile?.outline;
      if (face === undefined || outline === undefined || outline.length !== 4)
        throw new Error(
          `exterior door has no rectangular wall host: ${opening.id}`,
        );
      const q = face.rotation;
      if (
        ![q.x, q.y, q.z, q.w].every(Number.isFinite) ||
        Math.abs(q.x) > TOLERANCE ||
        Math.abs(q.z) > TOLERANCE ||
        Math.abs(Math.hypot(q.y, q.w) - 1) > TOLERANCE
      )
        throw new Error(
          `exterior door host is not a level wall: ${opening.id}`,
        );
      const hostYaw = 2 * Math.atan2(q.y, q.w);
      const tangent = { x: Math.cos(hostYaw), z: -Math.sin(hostYaw) };
      const normal = { x: Math.sin(hostYaw), z: Math.cos(hostYaw) };
      const outward = { x: Math.sin(yaw), z: Math.cos(yaw) };
      if (
        Math.abs(Math.abs(normal.x * outward.x + normal.z * outward.z) - 1) >
        TOLERANCE
      )
        throw new Error(`exterior door host faces wrong axis: ${opening.id}`);
      const x = outline.map((p) => p.x),
        y = outline.map((p) => p.y);
      const lo = Math.min(...x),
        hi = Math.max(...x),
        bottom = Math.min(...y),
        top = Math.max(...y);
      if (
        ![lo, hi, bottom, top].every(Number.isFinite) ||
        Math.abs(hi - lo - expectedWidth) > TOLERANCE ||
        Math.abs(top - bottom - expectedHeight) > TOLERANCE
      )
        throw new Error(
          `exterior door outline disagrees with reviewed opening: ${opening.id}`,
        );
      const built =
        form === "front"
          ? exterior.buildFront(maximum ? Math.PI / 2 : 0)
          : form === "garage"
            ? garage.build(maximum ? 2.3 : 0)
            : exterior.buildGarden(
                maximum ? Math.PI / 2 : 0,
                maximum ? Math.PI / 2 : 0,
              );
      const center = (lo + hi) / 2;
      prototypes.push(built);
      instances.push({
        id: `fill:${opening.id}`,
        modelId: built.model.id,
        transform: {
          translation: {
            x:
              face.origin.x +
              tangent.x * center +
              (outward.x * face.thickness) / 2,
            y: face.origin.y + bottom,
            z:
              face.origin.z +
              tangent.z * center +
              (outward.z * face.thickness) / 2,
          },
          rotation: { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) },
        },
      });
    }
    const side = gate.build(SIDE_WALK.top, maximum ? Math.PI / 2 : 0);
    prototypes.push(side);
    instances.push({
      id: "fill:side-yard-gate",
      modelId: side.model.id,
      transform: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    });
    return { prototypes, instances };
  }
}
