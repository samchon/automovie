import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { physicalNativeVector } from "./physicalNativeVector";

/** Copy display state without retaining native wrappers or changing solver order. */
export function readPhysicalFrame(bound: Bound, seconds: number): Cache.IFrame {
  const bodies: Cache.IFrame["bodies"] = Object.create(null);
  for (const [key, body] of bound.bodies) {
    const slash: number = key.indexOf("/");
    const id: string = key.slice(0, slash);
    const bone: string = key.slice(slash + 1);
    const position: IAutoMovieVector3 = { ...body.translation() };
    (bodies[id] ??= Object.create(null))[bone] = {
      position,
      rotation: { ...body.rotation() },
      velocity: {
        ...physicalNativeVector(
          body.velocityAtPoint(physicalNativeVector(position)),
        ),
      },
      angularVelocity: { ...body.angvel() },
    };
  }
  return { seconds, bodies };
}
