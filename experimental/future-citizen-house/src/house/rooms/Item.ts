import { Assembly } from "../Assembly";
import { v } from "../v";
import { yaw } from "../yaw";

/** Legacy room-source furniture assembly retained for the current viewer until
 * reviewed model, instance and system sources replace every element together.
 * This caller supplies the current transform; it owns neither the eventual
 * prototype nor the room. Child solids share a rigid local frame. */
export class Item {
  constructor(readonly a: Assembly, readonly id: string, readonly room: string, x: number, y: number, z: number, angle = 0) {
    a.environment.elements.push({ id, kind: "fit-out", space: room, parent: "house-root", model: null, transform: { translation: v(x, y, z), rotation: yaw(angle), scale: v(1, 1, 1) } });
  }
  box(name: string, material: string, x: number, y: number, z: number, w: number, h: number, d: number): void {
    const id = this.a.box(this.id + "-" + name, this.room, material, x, y, z, w, h, d);
    this.a.environment.elements.find((e) => e.id === id)!.parent = this.id;
  }
  round(name: string, material: string, x: number, y: number, z: number, w: number, h: number, d: number): void {
    const id = this.a.ellipsoid(this.id + "-" + name, this.room, material, x, y, z, w, h, d);
    this.a.environment.elements.find((e) => e.id === id)!.parent = this.id;
  }
}
