import type {
  IAutoMoviePhysicalFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieEnginePhysicalBinding as Bound } from "../IAutoMovieEnginePhysicalBinding";

/*
 * Copy display state without retaining solver bodies or changing solver order.
 */
export function readPhysicalFrame(
  bound: Bound,
  seconds: number,
): IAutoMoviePhysicalFrame {
  const bodies: IAutoMoviePhysicalFrame["bodies"] = Object.create(null);
  for (const [key, body] of bound.bodies) {
    const slash: number = key.indexOf("/");
    const id: string = key.slice(0, slash);
    const bone: string = key.slice(slash + 1);
    const position: IAutoMovieVector3 = { ...body.translation() };
    (bodies[id] ??= Object.create(null))[bone] = {
      position,
      rotation: { ...body.rotation() },
      velocity: {
        ...body.velocityAtPoint(position),
      },
      angularVelocity: { ...body.angvel() },
    };
  }
  return { seconds, bodies };
}
