import type { AutoMovieHumanSkeleton } from "@automovie/human";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import {
  type AutoMovieHumanCartoon,
  createAutoMovieClosedSphereGeometry,
  createAutoMovieHumanPolygonFigure,
} from "@automovie/render";
import * as THREE from "three";

import type { FighterBody } from "./FighterBody";
import type { IFighterProfile } from "./IFighterProfile";

/**
 * A fighter's displayed look: the original Human polygon figure in his skin
 * colour, shorts on the hips and thighs, gloves on the hands from the
 * physical glove colliders, a cartoon face whose brows and eyes show strain
 * and whose mouth opens with breath, and reddened skin where blows landed.
 * It only draws what the performance places; it decides nothing.
 *
 * ```ts
 * const figure = a.figure();
 * scene.add(figure.object);
 * figure.place(posed, { jaw: 12, wince: 0.4 }, { "ribs-left": 0.6 });
 * ```
 *
 * @evidence docs/body/settings/cast/fighter-a.md#recognition Skin colour and kit identify him from every view.
 * @evidence docs/body/settings/cast/fighter-a.md#kit Gloves and shorts.
 * @evidence docs/body/settings/cast/fighter-a.md#marks Struck skin reddens and stays marked.
 * @evidence docs/body/settings/cast/fighter-a.md#hands The glove follows the hand and wrist through every rotation.
 */
export class FighterFigure {
  /** The figure's root, placed with an identity transform: placements are world frames. */
  public readonly object: THREE.Group = new THREE.Group();

  private readonly figure: ReturnType<typeof createAutoMovieHumanPolygonFigure>;

  private readonly colors: Record<string, number>;

  private readonly owned: { dispose(): void }[] = [];

  private flush: string = "";

  /**
   * Build the look.
   *
   * @param profile His settings record.
   * @param body His body, for the skeleton and glove colliders.
   */
  public constructor(profile: IFighterProfile, body: FighterBody) {
    this.colors = Object.fromEntries(
      body.neutral.bones.map(
        (b: AutoMovieHumanSkeleton.IBone): [string, number] => [
          b.bone,
          b.bone === "hips" ? profile.shorts : profile.skin,
        ],
      ),
    );
    this.figure = createAutoMovieHumanPolygonFigure({
      evaluate: (): AutoMovieHumanSkeleton.IOutput => body.neutral,
      partColors: this.colors,
    });
    this.object.add(this.figure.object);
    const cloth: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
      color: profile.shorts,
      roughness: 0.95,
    });
    const trim: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
      color: profile.trim,
      roughness: 0.8,
    });
    const glove: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
      color: profile.gloves,
      roughness: 0.55,
    });
    this.owned.push(cloth, trim, glove);
    for (const side of ["left", "right"] as const) {
      // Shorts cover the upper half of each thigh, mid-thigh length.
      const upper = body.neutral.bones.find(
        (b) => b.bone === `${side}UpperLeg`,
      )!;
      const knee = body.neutral.bones.find(
        (b) => b.bone === `${side}LowerLeg`,
      )!;
      const parent: THREE.Group = this.figure.drawing.bones.get(
        `${side}UpperLeg`,
      )!;
      const along: THREE.Vector3 = new THREE.Vector3(...knee.position).sub(
        new THREE.Vector3(...upper.position),
      );
      const length: number = along.length() / 2;
      const leg: THREE.CylinderGeometry = new THREE.CylinderGeometry(
        upper.radius * 1.12,
        upper.radius * 1.08,
        length,
        10,
      );
      const band: THREE.CylinderGeometry = new THREE.CylinderGeometry(
        upper.radius * 1.13,
        upper.radius * 1.13,
        length * 0.08,
        10,
      );
      this.owned.push(leg, band);
      const direction: THREE.Vector3 = along.clone().normalize();
      const turn: THREE.Quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction,
      );
      const shorts: THREE.Mesh = new THREE.Mesh(leg, cloth);
      shorts.quaternion.copy(turn);
      shorts.position.copy(direction.clone().multiplyScalar(length / 2));
      const cuff: THREE.Mesh = new THREE.Mesh(band, trim);
      cuff.quaternion.copy(turn);
      cuff.position.copy(direction.clone().multiplyScalar(length));
      parent.add(shorts, cuff);
      // The glove is the hand's physical glove collider, drawn where it is.
      const hand: P.ISegment = body.profile.segments.find(
        (s) => s.bone === `${side}Hand`,
      )!;
      const shape: P.IShape = hand.shapes.find(
        (s) => s.id === `${side}-glove`,
      )!;
      const sphere: THREE.BufferGeometry = createAutoMovieClosedSphereGeometry(
        shape.kind === "sphere" ? shape.radius : 0,
        18,
        12,
      );
      this.owned.push(sphere);
      const mesh: THREE.Mesh = new THREE.Mesh(sphere, glove);
      mesh.name = `${side}-glove`;
      // The hand group moves by the same placement as the physical segment,
      // so the collider's segment-local offset is the mesh's local position.
      mesh.position.set(
        shape.transform.position.x,
        shape.transform.position.y,
        shape.transform.position.z,
      );
      this.figure.drawing.bones.get(`${side}Hand`)!.add(mesh);
    }
    this.object.traverse((o: THREE.Object3D): void => {
      if (o instanceof THREE.Mesh) o.castShadow = true;
    });
  }

  /**
   * Draw one instant.
   *
   * @param posed World placements of every bone.
   * @param face Jaw opening in millimetres and strain in [0, 1].
   * @param marks Redness by struck region id, in [0, 1].
   */
  public place(
    posed: AutoMovieHumanSkeleton.IPlacement[],
    face: { jaw: number; wince: number },
    marks: Readonly<Record<string, number>>,
  ): void {
    const wince: number = Math.round(face.wince * 10) / 10;
    const expression: AutoMovieHumanCartoon.IExpression = {
      units: [
        { unit: "browLowerer", intensity: wince, side: "both" },
        { unit: "lidTightener", intensity: wince, side: "both" },
        {
          unit: "jawDrop",
          intensity: Math.min(1, Math.round(face.jaw / 5) / 10),
          side: "both",
        },
      ],
    };
    this.figure.place({ posed }, undefined, expression);
    this.mark(marks);
  }

  /** Redden the struck regions' parts toward a bruise, quantized so colours rebuild only on change. */
  private mark(marks: Readonly<Record<string, number>>): void {
    const parts: Record<string, string[]> = {
      face: ["head"],
      chin: ["head"],
      "jaw-left": ["head"],
      "jaw-right": ["head"],
      "head-left": ["head"],
      "head-right": ["head"],
      "jaw-neck-left": ["neck"],
      "jaw-neck-right": ["neck"],
      stomach: ["spine"],
      "ribs-left": ["chest"],
      "ribs-right": ["chest"],
      "thigh-left": ["leftUpperLeg"],
      "thigh-right": ["rightUpperLeg"],
    };
    const levels: Record<string, number> = {};
    for (const [region, level] of Object.entries(marks))
      for (const bone of parts[region] ?? [])
        levels[bone] = Math.max(levels[bone] ?? 0, Math.round(level * 5) / 5);
    const key: string = JSON.stringify(levels);
    if (key === this.flush) return;
    this.flush = key;
    const bruise: THREE.Color = new THREE.Color(FighterFigure.BRUISE);
    const colors: Record<string, number> = { ...this.colors };
    for (const [bone, level] of Object.entries(levels))
      colors[bone] = new THREE.Color(this.colors[bone])
        .lerp(bruise, level * FighterFigure.BRUISE_SHARE)
        .getHex();
    this.figure.drawing.setPartColors(colors);
  }

  /** Release the figure and its kit. */
  public dispose(): void {
    this.figure.dispose();
    for (const o of this.owned) o.dispose();
    this.object.removeFromParent();
  }

  /** Colour struck skin reddens toward. */
  public static readonly BRUISE: number = 0xc8323a;

  /** Greatest share of the bruise colour in fully marked skin, so skin tone stays recognizable. */
  public static readonly BRUISE_SHARE: number = 0.45;
}
