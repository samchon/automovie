import * as THREE from "three";
import { paperGripThickness } from "./paperGripThickness";

/**
 * Own the single cream paper prop's coarse crane, opening and closed-note forms.
 * The square is16cm across; the stylized crane is a blockout silhouette rather
 * than a metric origami simulation. The caller synchronizes form changes with
 * actual hands. This object has no flight clock or automatic unfolding.
 * Local XY is the open sheet and positive Z is its written face.
 *
 * @evidence contracts/common.md#implementation-and-ownership A single root retains paper identity while the host controls custody and manual opening. Fixed morph vertices express coarse folded geometry; they do not certify inextensible origami. The base follows its actual lower vertex; a separately addressable folded upper layer follows the actual beak vertex and becomes visible only when the caller begins unfolding. Both are real finite paper geometry, not invisible contact proxies. One texture owns the exact required inscription, rendered only on the positive face. Resources retire with the prop.
 * @evidence contracts/common.md#authoring-interface Supply opening0forcrane through1foropen and closing0through1foroncefolded. Both must be finite unit values. The caller places/orients the root, controls audience-facing visibility and proves hand contact. The factory itself never advances a clock or changes inscription.
 */
export function createInvitationPaper(): {
  object: THREE.Group;
  gripBase: THREE.Mesh;
  gripFlap: THREE.Mesh;
  anchor: () => THREE.Vector3;
  beak: () => THREE.Vector3;
  flap: () => THREE.Vector3;
  gripFaces: () => { front: THREE.Vector3; back: THREE.Vector3 };
  form: (opening: number, closing: number) => void;
  dispose: () => void;
} {
  const object: THREE.Group = new THREE.Group();
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 1024;
  const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
  if (!context) throw new Error("Invitation inscription needs Canvas2D");
  context.fillStyle = "#f4ead0"; context.fillRect(0, 0, 1024, 1024);
  context.fillStyle = "#292a32";
  context.textAlign = "center"; context.textBaseline = "middle";
  context.font = "48px Georgia";
  context.fillText("Would you have tea with me?", 512, 512, 940);
  const texture: THREE.CanvasTexture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const cream: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0xf4ead0, roughness: 1, side: THREE.DoubleSide });
  const ink: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
  const geometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(0.16, 0.16, 2, 2);
  const positions: THREE.BufferAttribute = geometry.getAttribute("position") as THREE.BufferAttribute;
  const open: Float32Array = new Float32Array(positions.array);
  const crane: number[] = [
    -0.08,0.01,0, 0.018,0.065,0, 0.08,0.01,0,
    -0.025,0,0.012, 0,0,0.025, 0.025,0,0.012,
    -0.045,-0.015,0, 0,-0.025,0, 0.018,-0.018,0,
  ];
  const paper: THREE.Mesh = new THREE.Mesh(geometry, cream);
  object.add(paper);
  // Coarse folded layers give the original note one finite graspable base.
  const baseGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(0.012, 0.008, paperGripThickness);
  const base: THREE.Mesh = new THREE.Mesh(baseGeometry, cream);
  base.name = "folded-paper-base";
  object.add(base);
  const flapGeometry:THREE.BoxGeometry=new THREE.BoxGeometry(.012,.008,paperGripThickness);
  const flap:THREE.Mesh=new THREE.Mesh(flapGeometry,cream);flap.name="folded-upper-flap";flap.visible=false;object.add(flap);
  const frontGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(0.16, 0.16);
  const front: THREE.Mesh = new THREE.Mesh(frontGeometry, ink);
  front.position.z = 0.0005;
  object.add(front);
  return {
    object, gripBase: base,gripFlap:flap,
    /** Read the actual folded-base vertex from the current emitted surface. */
    anchor(): THREE.Vector3 {
      return new THREE.Vector3().fromBufferAttribute(positions, 7);
    },
    /** Read the actual current vertex that forms the folded crane beak. */
    beak(): THREE.Vector3 { return new THREE.Vector3().fromBufferAttribute(positions,1); },
    /** Read the real upper flap's centre; its folded layer remains finite when opened. */
    flap():THREE.Vector3{return new THREE.Vector3().fromBufferAttribute(positions,1);},
    /** Read the two actual opposite box faces in world coordinates. */
    gripFaces(): { front: THREE.Vector3; back: THREE.Vector3 } {
      object.updateMatrixWorld(true);
      const bounds: THREE.Box3 = baseGeometry.boundingBox ?? (baseGeometry.computeBoundingBox(), baseGeometry.boundingBox!);
      return { front: base.localToWorld(new THREE.Vector3(0,0,bounds.max.z)), back: base.localToWorld(new THREE.Vector3(0,0,bounds.min.z)) };
    },
    /** Place the manual form from fixed controls without accumulating deformation. */
    form(opening: number, closing: number): void {
      if (![opening, closing].every((value: number): boolean => Number.isFinite(value) && value >= 0 && value <= 1))
        throw new Error("Paper form controls must be finite unit values");
      for (let index: number = 0; index < positions.count; index++) {
        const x: number = open[index * 3]!;
        const y: number = open[index * 3 + 1]!;
        const fold: number = y < 0 ? closing * Math.PI : 0;
        const py: number = y * Math.cos(fold);
        const pz: number = -y * Math.sin(fold);
        positions.setXYZ(index,
          THREE.MathUtils.lerp(crane[index * 3]!, x, opening),
          THREE.MathUtils.lerp(crane[index * 3 + 1]!, py, opening),
          THREE.MathUtils.lerp(crane[index * 3 + 2]!, pz, opening));
      }
      positions.needsUpdate = true;
      base.position.copy(new THREE.Vector3().fromBufferAttribute(positions, 7));
      base.scale.z = THREE.MathUtils.lerp(1, 0.0001 / paperGripThickness, opening);
      flap.position.copy(new THREE.Vector3().fromBufferAttribute(positions,1));
      geometry.computeVertexNormals(); geometry.computeBoundingSphere();
      front.visible = opening >= 0.999 && closing === 0;
    },
    /** Retire the paper's geometry and inscription without disposing other props. */
    dispose(): void {
      geometry.dispose(); frontGeometry.dispose(); baseGeometry.dispose();flapGeometry.dispose();
      cream.dispose(); ink.dispose(); texture.dispose(); object.clear();
    },
  };
}
