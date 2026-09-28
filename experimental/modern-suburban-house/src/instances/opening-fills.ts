/** Derive exterior window placement from the built wall openings. */
import type { IAutoMovieMeshTransform } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { Windows } from "../models/windows";

type WindowKind = "double-hung" | "fixed" | "awning";
type WindowPrototype = ReturnType<Windows["build"]>;
type Placement = {
  id: string;
  modelId: string;
  transform: IAutoMovieMeshTransform;
};

/** The column counts and opening forms settled by the model and facade owners. */
const WINDOW_FORMS: Readonly<Record<string, readonly [WindowKind, number]>> = {
  "living-front-window": ["double-hung", 3],
  "bedroom-two-front-window": ["double-hung", 2],
  "stair-front-window": ["fixed", 1],
  "bedroom-three-front-window": ["double-hung", 2],
  "kitchen-rear-window": ["double-hung", 1],
  "family-rear-window": ["double-hung", 2],
  "primary-rear-window": ["double-hung", 2],
  "living-left-window": ["double-hung", 1],
  "primary-left-window": ["double-hung", 2],
  "family-right-window": ["double-hung", 2],
  "tub-right-window": ["awning", 1],
  "garage-right-window": ["fixed", 2],
};

const wallSide = (id: string): readonly ["x" | "z", number, number] => {
  if (id.startsWith("front-")) return ["z", 1, 0];
  if (id.startsWith("rear-")) return ["z", -1, Math.PI];
  if (id.startsWith("left-")) return ["x", -1, -Math.PI / 2];
  if (id.startsWith("right-")) return ["x", 1, Math.PI / 2];
  throw new Error(`window boundary has no exterior side: ${id}`);
};

/** One filling per window void, with dimensions read from its built outline. */
export class OpeningWindowFills {
  public build(
    environment: IAutoMovieBuiltEnvironment,
    maximum = false,
  ): {
    prototypes: WindowPrototype[];
    instances: Placement[];
  } {
    const prototypes: WindowPrototype[] = [];
    const instances: Placement[] = [];
    const boundaries = new Map(
      environment.boundaries.map((boundary) => [boundary.id, boundary]),
    );
    const windows = environment.openings.filter(
      (opening) => opening.kind === "window",
    );
    const actual = new Set(windows.map((opening) => opening.id));
    const expected = Object.keys(WINDOW_FORMS);
    if (
      actual.size !== windows.length ||
      actual.size !== expected.length ||
      expected.some((id) => !actual.has(id))
    )
      throw new Error(
        "exterior window opening population differs from its model assignments",
      );
    const builder = new Windows();
    for (const opening of windows) {
      const form = WINDOW_FORMS[opening.id];
      const boundary = boundaries.get(opening.boundary);
      const outline = opening.profile?.outline;
      if (
        form === undefined ||
        boundary?.face === undefined ||
        outline === undefined ||
        outline.length !== 4
      )
        throw new Error(
          `window opening has no rectangular host: ${opening.id}`,
        );
      const [axis, outward, yaw] = wallSide(boundary.id);
      const values = outline.map((point) => point.x);
      const heights = outline.map((point) => point.y);
      const lo = Math.min(...values),
        hi = Math.max(...values),
        bottom = Math.min(...heights),
        top = Math.max(...heights);
      const [kind, columns] = form;
      const spec = {
        id: opening.id,
        kind,
        width: hi - lo,
        height: top - bottom,
        columns,
      };
      const built = maximum ? builder.maximum(spec) : builder.build(spec);
      const weatherPlane =
        boundary.face.origin[axis] + (outward * boundary.face.thickness) / 2;
      const hostYaw =
        2 * Math.atan2(boundary.face.rotation.y, boundary.face.rotation.w);
      const centre = (lo + hi) / 2;
      const worldCentre = {
        x: boundary.face.origin.x + Math.cos(hostYaw) * centre,
        z: boundary.face.origin.z - Math.sin(hostYaw) * centre,
      };
      const translation =
        axis === "z"
          ? { x: worldCentre.x, y: bottom, z: weatherPlane }
          : { x: weatherPlane, y: bottom, z: worldCentre.z };
      prototypes.push(built);
      instances.push({
        id: `fill:${opening.id}`,
        modelId: built.model.id,
        transform: {
          translation,
          rotation: { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) },
        },
      });
    }
    return { prototypes, instances };
  }
}
