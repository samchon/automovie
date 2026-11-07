import { AutoMovieHumanContactAppearance as Appearance } from "@automovie/human";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import { createAutoMovieSurfaceAppearance } from "@automovie/viewer";
import * as THREE from "three";

import type { FilmActor } from "../assets/person/FilmActor";

/** Bind provider-local contact patches to the original polygon and its actual glove/face meshes. */
export class BoutSurface {
  /** Current cloned surface resources; original meshes stay owned by the actor. */
  private appearance?: ReturnType<typeof createAutoMovieSurfaceAppearance>;
  /** Face replacement invalidates the borrowed mesh population. */
  private revision: number = -1;
  /** The currently drawn solved segment frames. */
  private segments: Readonly<Record<string, P.ITransform>> = {};
  /** One matrix pair per actual mesh and displayed frame. */
  private readonly frames: Map<
    THREE.Mesh,
    { toBone: THREE.Matrix4; toMesh: THREE.Matrix4 }
  > = new Map();
  /** Provider-prepared local response, independent of render meshes. */
  private readonly sample: ReturnType<typeof Appearance.prepare>;
  /** Floor compression affects shape without painting an injury mark. */
  private readonly floorSample: ReturnType<typeof Appearance.prepare>;
  public constructor(
    private readonly actor: FilmActor,
    contacts: readonly Receipt[],
    frameAt: (seconds: number, bone: string) => P.ITransform,
    floorContacts: readonly Receipt[] = [],
    geometricImpulses: Readonly<Record<string, number>> = {},
  ) {
    this.sample = Appearance.prepare({
      body: actor.id,
      contacts,
      frameAt,
      materials: ["skin", "glove"],
      radius: 0.12,
      weightPerImpulse: 0.12,
      color: [0.8, 0.36, 0.4],
      decaySeconds: 60,
      compressionSeconds: 0.07,
      geometricImpulses,
    });
    this.floorSample = Appearance.prepare({
      body: actor.id,
      contacts: floorContacts.filter(
        (receipt: Receipt): boolean => receipt.compression > 0,
      ),
      frameAt,
      materials: ["skin", "glove"],
      radius: 0.12,
      weightPerImpulse: 0,
      color: [1, 1, 1],
      decaySeconds: 60,
      compressionSeconds: 0.07,
      geometricImpulses,
    });
  }
  /** Update only shared renderer/provider response from the actual physical frames. */
  public update(
    seconds: number,
    segments: Readonly<Record<string, P.ITransform>>,
  ): void {
    this.segments = segments;
    this.frames.clear();
    if (this.revision !== this.actor.person.geometryRevision) {
      this.appearance?.dispose();
      this.appearance = createAutoMovieSurfaceAppearance({
        surfaces: this.actor.person
          .collisionParts()
          .filter(
            (
              part: ReturnType<FilmActor["person"]["collisionParts"]>[number],
            ): boolean => Object.hasOwn(segments, part.bone),
          )
          .map(
            (
              part: ReturnType<FilmActor["person"]["collisionParts"]>[number],
            ): { bone: string; mesh: THREE.Mesh } => ({
              bone: part.bone,
              mesh: part.mesh,
            }),
          ),
        sample: (
          bone: string,
          point: IAutoMovieVector3,
          time: number,
          mesh: THREE.Mesh,
        ): Appearance.ISample => {
          let frame:
            | { toBone: THREE.Matrix4; toMesh: THREE.Matrix4 }
            | undefined = this.frames.get(mesh);
          if (!frame) {
            const pose: P.ITransform = this.segments[bone]!;
            const matrix: THREE.Matrix4 = new THREE.Matrix4().compose(
              new THREE.Vector3(
                pose.position.x,
                pose.position.y,
                pose.position.z,
              ),
              new THREE.Quaternion(
                pose.rotation.x,
                pose.rotation.y,
                pose.rotation.z,
                pose.rotation.w,
              ),
              new THREE.Vector3(1, 1, 1),
            );
            frame = {
              toBone: matrix.clone().invert().multiply(mesh.matrixWorld),
              toMesh: mesh.matrixWorld.clone().invert().multiply(matrix),
            };
            this.frames.set(mesh, frame);
          }
          const local: THREE.Vector3 = new THREE.Vector3(
            point.x,
            point.y,
            point.z,
          ).applyMatrix4(frame.toBone);
          const sampled: Appearance.ISample = this.sample(
            bone,
            { x: local.x, y: local.y, z: local.z },
            time,
          );
          const floor: Appearance.ISample = this.floorSample(
            bone,
            { x: local.x, y: local.y, z: local.z },
            time,
          );
          if (
            Math.hypot(
              floor.displacement.x,
              floor.displacement.y,
              floor.displacement.z,
            ) >
            Math.hypot(
              sampled.displacement.x,
              sampled.displacement.y,
              sampled.displacement.z,
            )
          )
            sampled.displacement = floor.displacement;
          const delta: THREE.Vector3 = new THREE.Vector3(
            sampled.displacement.x,
            sampled.displacement.y,
            sampled.displacement.z,
          )
            .applyMatrix4(frame.toMesh)
            .sub(new THREE.Vector3().applyMatrix4(frame.toMesh));
          return {
            color: mesh.name.endsWith("-glove") ? [1, 1, 1] : sampled.color,
            displacement: { x: delta.x, y: delta.y, z: delta.z },
          };
        },
      });
      this.revision = this.actor.person.geometryRevision;
    }
    this.appearance!.update(seconds);
  }
  /** Restore actor-owned geometry/materials before actor disposal. */
  public dispose(): void {
    this.appearance?.dispose();
    this.appearance = undefined;
    this.frames.clear();
  }
}
