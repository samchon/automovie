import { Quaternion, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanSkeleton } from "@automovie/human";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { createAutoMovieHumanPolygonFigure } from "@automovie/render";
import * as THREE from "three";

import type { RefereeBody } from "./RefereeBody";

/**
 * The referee's displayed look: his own polygon figure in a white long-sleeve
 * shirt, black trousers and black shoes with bare hands and face, whose mouth
 * opens while he speaks.
 *
 * ```ts
 * const figure = referee.figure();
 * figure.place(output, root, 14);
 * ```
 *
 * @evidence docs/body/settings/cast/referee.md#uniform White shirt, black trousers, black shoes.
 * @evidence docs/body/settings/cast/referee.md#recognition Bare hands; the uniform distinguishes him from both fighters.
 * @evidence docs/body/settings/cast/referee.md#voice The mouth opens during speech and closes between phrases.
 */
export class RefereeFigure {
  /** The figure's root at identity; placements are world frames. */
  public readonly object: THREE.Group = new THREE.Group();

  private readonly figure: ReturnType<typeof createAutoMovieHumanPolygonFigure>;

  /** Shirt, trousers, shoes and skin colours. */
  public static readonly COLORS = {
    shirt: 0xf0f0e8,
    trousers: 0x151b23,
    shoes: 0x0c0f14,
    skin: 0xb98367,
  } as const;

  /**
   * Build the look.
   *
   * @param body His body.
   */
  public constructor(body: RefereeBody) {
    const c = RefereeFigure.COLORS;
    const colors: Record<string, number> = Object.fromEntries(
      body.neutral.bones.map((b): [string, number] => [
        b.bone,
        /Foot|Subtalar|Midfoot|Toe|Hallux|Second|Third|Fourth|Fifth/.test(
          b.bone,
        )
          ? c.shoes
          : /^(hips|leftUpperLeg|rightUpperLeg|leftLowerLeg|rightLowerLeg)/.test(
                b.bone,
              )
            ? c.trousers
            : /^(head|neck|atlas)|Hand|Thumb|Index|Middle|Ring|Little/.test(
                  b.bone,
                )
              ? c.skin
              : c.shirt,
      ]),
    );
    this.figure = createAutoMovieHumanPolygonFigure({
      evaluate: (): AutoMovieHumanSkeleton.IOutput => body.neutral,
      partColors: colors,
    });
    this.object.add(this.figure.object);
    this.object.traverse((o: THREE.Object3D): void => {
      if (o instanceof THREE.Mesh) o.castShadow = true;
    });
  }

  /**
   * Draw one instant.
   *
   * @param output His clinical FK.
   * @param root Its world root.
   * @param jaw Jaw opening, millimetres.
   */
  public place(
    output: AutoMovieHumanSkeleton.IOutput,
    root: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion },
    jaw: number,
  ): void {
    const posed: AutoMovieHumanSkeleton.IPlacement[] = output.posed.map((p) => {
      const position: IAutoMovieVector3 = Vector3.add(
        root.position,
        Quaternion.rotateVector(root.rotation, {
          x: p.position[0],
          y: p.position[1],
          z: p.position[2],
        }),
      );
      const rotation: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(root.rotation, {
          x: p.rotation[0],
          y: p.rotation[1],
          z: p.rotation[2],
          w: p.rotation[3],
        }),
      );
      return {
        bone: p.bone,
        position: [position.x, position.y, position.z],
        rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
      };
    });
    this.figure.place({ posed }, undefined, {
      units: [
        {
          unit: "jawDrop",
          intensity: Math.min(1, Math.round(jaw / 5) / 10),
          side: "both",
        },
      ],
    });
  }

  /** Release the figure. */
  public dispose(): void {
    this.figure.dispose();
    this.object.removeFromParent();
  }
}
