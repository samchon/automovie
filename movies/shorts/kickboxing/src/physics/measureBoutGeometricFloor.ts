import {
  type AutoMoviePhysicsCache as Cache,
  preparePhysicalGeometry as Geometry,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";

import { BoutPhysicalSettings as Settings } from "./BoutPhysicalSettings";

/** Observe actual displayed profile/floor arrival at cache rate, for authored supports and the kinematic comparison. Episodes carry null impulse and retain onset witnesses; they cannot release tracking or supply force-based appearance. */
export async function measureBoutGeometricFloor(input: {
  profiles: Readonly<Record<string, P>>;
  at: (seconds: number) => Cache.IFrame;
  start: number;
  end: number;
  rate: number;
}): Promise<Receipt[]> {
  const geometry: Geometry.IQueries = await Geometry();
  const bounds: typeof Settings.floorBounds = Settings.floorBounds;
  const floor: Geometry.ICollider = {
    body: "floor",
    bone: "floor",
    shape: {
      id: "floor",
      material: "floor",
      kind: "box",
      halfExtents: {
        x: (bounds.max.x - bounds.min.x) / 2,
        y: bounds.thickness / 2,
        z: (bounds.max.z - bounds.min.z) / 2,
      },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    },
    pose: {
      position: {
        x: (bounds.min.x + bounds.max.x) / 2,
        y: Settings.floor - bounds.thickness / 2,
        z: (bounds.min.z + bounds.max.z) / 2,
      },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  };
  const contacts: Receipt[] = [];
  let active: Map<string, Receipt> = new Map();
  for (
    let step: number = 0;
    step <= Math.round((input.end - input.start) * input.rate);
    step++
  ) {
    const seconds: number = input.start + step / input.rate;
    const frame: Cache.IFrame = input.at(seconds);
    const next: Map<string, Receipt> = new Map();
    for (const [body, profile] of Object.entries(input.profiles))
      for (const segment of profile.segments)
        for (const shape of segment.shapes) {
          const collider: Geometry.ICollider = {
            body,
            bone: segment.bone,
            shape,
            pose: frame.bodies[body]![segment.bone]!,
          };
          if (geometry.minimumY(collider) > Settings.floor) continue;
          const measured: Receipt | null = geometry.contact(
            collider,
            floor,
            seconds,
          );
          if (!measured || measured.separation > 0) continue;
          const key: string = `${body}/${segment.bone}/${shape.id}`;
          const previous: Receipt | undefined = active.get(key);
          const receipt: Receipt = previous ?? measured;
          receipt.endSeconds = seconds;
          if (!previous) contacts.push(receipt);
          next.set(key, receipt);
        }
    active = next;
  }
  return contacts;
}
