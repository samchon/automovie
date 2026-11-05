import * as THREE from "three";

/**
 * Draw exact English dialogue inside the actual captured scene canvas.
 *
 * @evidence contracts/common.md#implementation-and-ownership The production owns its small text canvas, texture and camera-attached sprite; Viewer captures those actual pixels. A caption displays screenplay words and never certifies that a candidate WAV spoke them. Updates reuse the canvas rather than allocate per frame.
 * @evidence contracts/common.md#authoring-interface Call in a browser with the production camera, set the current line or an empty string at exact scene time, then dispose once. The sprite ignores depth and sits near the bottom of the adopted 9:16 view; changed camera FOV/aspect needs visual reinspection.
 */
export function createDuelCaption(camera: THREE.PerspectiveCamera): { set: (text: string) => void; dispose: () => void } {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 160;
  const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
  if (context === null) throw new Error("Caption canvas unavailable");
  const texture: THREE.CanvasTexture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material: THREE.SpriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, transparent: true });
  const sprite: THREE.Sprite = new THREE.Sprite(material);
  sprite.position.set(0, -0.57, -2);
  sprite.scale.set(0.75, 0.117, 1);
  sprite.renderOrder = 1000;
  camera.add(sprite);
  let current: string | null = null;
  return {
    set: (text: string): void => {
      if (text === current) return;
      current = text;
      context.clearRect(0, 0, canvas.width, canvas.height);
      sprite.visible = text.length > 0;
      if (text.length > 0) {
        context.fillStyle = "rgba(12,18,22,0.82)";
        context.fillRect(0, 12, canvas.width, 132);
        context.font = "600 66px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#ffffff";
        context.fillText(text, canvas.width / 2, 80, 960);
      }
      texture.needsUpdate = true;
    },
    dispose: (): void => {
      sprite.removeFromParent();
      material.dispose();
      texture.dispose();
    },
  };
}
