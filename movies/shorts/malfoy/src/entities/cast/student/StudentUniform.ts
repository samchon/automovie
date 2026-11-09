import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import type { IStudentProfile } from "./IStudentProfile";
import type { StudentBody } from "./StudentBody";

/**
 * The block mannequin's meshes in the school uniform: one rigid group per
 * segment frame (pelvis, trunk, head, each upper arm, forearm, hand, thigh,
 * shin and foot), each holding the body block and the uniform layers that
 * ride on it, placed every instant from the solved joints. Local axes of a
 * segment group: +X forward, +Y along the segment toward its parent joint
 * (up), +Z to the person's own right.
 *
 * @evidence docs/body/settings/world/hogwarts.md#uniform-grammar Shirt collar, tie with stripes, knit with house band, open black robe with house lining and crest, sleeves to the wrist bone, skirt with tights or trousers, black shoes; robe panels tucked for flight.
 * @evidence contracts/development/entities.md#settings-realization Colours from the house and record; sizes from the body's lengths.
 * @evidence contracts/development/entities.md#object-shape A fragment of `StudentFigure` that owns its meshes.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns every geometry and material it creates until `dispose`.
 * @evidence contracts/development/common.md#meaningful-documentation States the segment groups and their axes.
 */
export class StudentUniform {
  /** Root of every segment group. */
  public readonly object: THREE.Group = new THREE.Group();

  private readonly owned: { dispose(): void }[] = [];

  private readonly groups: Record<string, THREE.Group> = {};

  private readonly tucked: THREE.Object3D[] = [];

  private readonly hairDown: THREE.Object3D[] = [];

  private readonly hairRiding: THREE.Object3D[] = [];

  /** The mannequin's bare head, neck, eyes and hands, hidden where the Human polygon body draws them. */
  private readonly skin: THREE.Object3D[] = [];

  /** Hide the mannequin's bare skin parts, which the Human polygon figure draws instead. */
  public hideSkin(): void {
    for (const o of this.skin) o.visible = false;
  }

  /**
   * Dress the mannequin.
   *
   * @param profile The student's record.
   * @param body The student's skeleton.
   */
  public constructor(profile: IStudentProfile, body: StudentBody) {
    const L: StudentBody.ILengths = body.lengths;
    const m = body.measure;
    const house = profile.house === "slytherin" ? { main: 0x1d5e3a, stripe: 0xc5c9ce } : { main: 0x8e1c22, stripe: 0xd8a838 };
    const C = {
      skin: profile.skin,
      hair: profile.hairColor,
      shirt: 0xf2f1ec,
      knit: 0x3b3d42,
      robe: 0x17171a,
      bottoms: 0x2f3034,
      tights: 0x151515,
      shoes: 0x0c0c0c,
      dark: 0x161616,
    };
    for (const name of ["pelvis", "trunk", "head", "neck"])
      this.object.add((this.groups[name] = new THREE.Group()));
    for (const side of ["left", "right"])
      for (const part of ["upperArm", "forearm", "hand", "thigh", "shin", "foot"])
        this.object.add((this.groups[`${side}.${part}`] = new THREE.Group()));
    const sh: number = m.shoulderHalfWidth;
    const hh: number = m.hipHalfWidth;
    // Pelvis: hips block in the bottoms' colour.
    this.box("pelvis", [0.2, 0.17, 2 * hh + 0.12], [0, 0.02, 0], profile.bottoms === "skirt" ? C.bottoms : C.bottoms);
    // Trunk: knit body from the pelvis up to the shoulders, collar, tie, band, robe panels, crest.
    const t: number = L.trunk;
    this.box("trunk", [0.19, t + 0.04, 2 * sh + 0.06], [0, -t / 2 + 0.02, 0], C.knit);
    this.box("trunk", [0.06, 0.05, 0.13], [0.085, -0.03, 0], C.shirt); // collar wedge
    this.box("trunk", [0.012, t * 0.62, 0.045], [0.098, -0.06 - t * 0.31, 0], house.main); // tie
    for (let k = 1; k <= 4; k++) this.box("trunk", [0.014, 0.008, 0.046], [0.1, -0.06 - (t * 0.62 * k) / 5, 0], house.stripe);
    for (const s of [-1, 1]) {
      this.box("trunk", [0.013, 0.12, 0.012], [0.098, -0.09, s * 0.05], house.main, -s * 0.5); // V band
      const panel: THREE.Mesh = this.box("trunk", [0.03, t + 0.02, 0.13], [0.09, -t / 2, s * (sh - 0.02)], C.robe); // robe front panel
      void panel;
      this.box("trunk", [0.032, t, 0.015], [0.092, -t / 2, s * (sh - 0.09)], house.main); // lining edge
    }
    this.box("trunk", [0.03, t + 0.02, 2 * sh + 0.1], [-0.105, -t / 2, 0], C.robe); // robe back
    this.box("trunk", [0.034, 0.05, 0.05], [0.108, -0.14, -(sh - 0.04)], house.main); // crest on the left chest (own left is -Z)
    // Neck and head.
    this.skin.push(this.cyl("neck", 0.045, L.neck + 0.02, [0, -(L.neck + 0.02) / 2, 0], C.skin));
    const r: number = L.headRadius;
    this.skin.push(this.ellipsoid("head", [r * 0.95, r * 1.12, r * 0.85], [0, 0, 0], C.skin));
    for (const s of [-1, 1]) this.skin.push(this.ellipsoid("head", [0.012, 0.012, 0.012], [r * 0.82, r * 0.12, s * r * 0.35], C.dark));
    this.hair(profile.hair, r, C.hair, this.hairDown);
    if (profile.ridingHair !== undefined) this.hair(profile.ridingHair, r, C.hair, this.hairRiding);
    if (profile.glasses)
      for (const s of [-1, 1]) {
        const ring: THREE.Mesh = this.torus("head", 0.022, 0.004, [r * 0.93, r * 0.12, s * r * 0.36], C.dark);
        ring.rotation.y = Math.PI / 2;
        this.box("head", [0.006, 0.006, r * 0.3], [r * 0.95, r * 0.14, 0], C.dark);
      }
    // Arms: robe sleeves to the wrist, skin hands.
    for (const side of ["left", "right"] as const) {
      this.cyl(`${side}.upperArm`, 0.052, L.upperArm, [0, -L.upperArm / 2, 0], C.robe);
      this.cyl(`${side}.forearm`, 0.047, L.forearm, [0, -L.forearm / 2, 0], C.robe);
      this.skin.push(this.box(`${side}.hand`, [0.03, L.hand * 2, 0.08], [0, -L.hand, 0], C.skin));
      // Legs: skirt over the thigh and tights below, or trousers; the robe's lower panels; shoes.
      if (profile.bottoms === "skirt") {
        this.cyl(`${side}.thigh`, 0.072, L.thigh, [0, -L.thigh / 2, 0], C.tights);
        this.box(`${side}.thigh`, [0.2, L.thigh * 0.82, 0.17], [0, -L.thigh * 0.41, 0], C.bottoms);
        this.cyl(`${side}.shin`, 0.05, L.shank, [0, -L.shank / 2, 0], C.tights);
      } else {
        this.cyl(`${side}.thigh`, 0.075, L.thigh, [0, -L.thigh / 2, 0], C.bottoms);
        this.cyl(`${side}.shin`, 0.058, L.shank, [0, -L.shank / 2, 0], C.bottoms);
      }
      const s: number = side === "left" ? -1 : 1;
      this.tucked.push(this.box(`${side}.thigh`, [0.03, L.thigh * 0.95, 0.13], [0.11, -L.thigh * 0.47, s * 0.06], C.robe));
      this.tucked.push(this.box(`${side}.thigh`, [0.03, L.thigh * 0.95, 0.16], [-0.11, -L.thigh * 0.47, 0], C.robe));
      this.box(`${side}.foot`, [L.toe + 0.06, 0.07, 0.09], [L.toe / 2 - 0.01, 0, 0], C.shoes);
    }
  }

  /**
   * Place every segment group from a solved body.
   *
   * @param j The solved body.
   * @param riding Whether the uniform is in its riding state.
   */
  public place(j: StudentBody.IJoints, riding: boolean): void {
    const frame = (name: string, origin: IAutoMovieVector3, up: IAutoMovieVector3, forward: IAutoMovieVector3): void => {
      const g: THREE.Group = this.groups[name]!;
      const u: THREE.Vector3 = new THREE.Vector3(up.x, up.y, up.z).normalize();
      let f: THREE.Vector3 = new THREE.Vector3(forward.x, forward.y, forward.z);
      f.sub(u.clone().multiplyScalar(f.dot(u)));
      if (f.lengthSq() < 1e-9) f = new THREE.Vector3(1, 0, 0).sub(u.clone().multiplyScalar(u.x));
      f.normalize();
      const right: THREE.Vector3 = new THREE.Vector3().crossVectors(f, u);
      g.position.set(origin.x, origin.y, origin.z);
      g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f, u, right));
    };
    const down = (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
    frame("pelvis", j.pelvis, j.frame.up, j.frame.forward);
    frame("trunk", j.chest, j.trunk.up, j.trunk.forward);
    frame("neck", j.neck, j.trunk.up, j.trunk.forward);
    frame("head", j.headCentre, j.head.up, j.head.forward);
    for (const side of ["left", "right"] as const) {
      const arm: StudentBody.IArm = j.arms[side];
      frame(`${side}.upperArm`, arm.shoulder, down(arm.shoulder, arm.elbow), j.trunk.forward);
      frame(`${side}.forearm`, arm.elbow, down(arm.elbow, arm.wrist), j.trunk.forward);
      frame(`${side}.hand`, arm.wrist, down(arm.wrist, arm.hand), { x: -arm.palm.x, y: -arm.palm.y, z: -arm.palm.z });
      const leg: StudentBody.ILeg = j.legs[side];
      frame(`${side}.thigh`, leg.hip, down(leg.hip, leg.knee), j.frame.forward);
      frame(`${side}.shin`, leg.knee, down(leg.knee, leg.ankle), j.frame.forward);
      frame(`${side}.foot`, leg.ankle, j.frame.up, down(leg.toe, leg.ankle));
    }
    for (const o of this.tucked) o.visible = !riding;
    if (this.hairRiding.length > 0) {
      for (const o of this.hairDown) o.visible = !riding;
      for (const o of this.hairRiding) o.visible = riding;
    }
  }

  /** Release every geometry and material. */
  public dispose(): void {
    for (const o of this.owned) o.dispose();
    this.object.removeFromParent();
  }

  /** Hair meshes of a shape, in the head group's frame. */
  private hair(shape: IStudentProfile["hair"], r: number, color: number, into: THREE.Object3D[]): void {
    const add = (o: THREE.Mesh): void => void into.push(o);
    add(this.ellipsoid("head", [r * 1.02, r * 0.75, r * 0.92], [-r * 0.08, r * 0.38, 0], color)); // cap over the crown
    switch (shape) {
      case "shoulder-straight":
        add(this.box("head", [r * 0.45, r * 1.9, r * 1.6], [-r * 0.62, -r * 0.55, 0], color)); // curtain behind, falling to just above the shoulders
        for (const s of [-1, 1]) add(this.box("head", [r * 0.75, r * 1.5, r * 0.16], [-r * 0.15, -r * 0.4, s * r * 0.88], color));
        break;
      case "tail-low":
        add(this.cyl("head", r * 0.22, r * 1.2, [-r * 1.0, -r * 1.0, 0], color));
        break;
      case "tail-high":
        add(this.cyl("head", r * 0.22, r * 1.2, [-r * 1.05, r * 0.3, 0], color));
        break;
      case "short-untidy":
        for (const [x, z] of [[0.3, 0], [-0.1, 0.4], [-0.1, -0.4], [-0.5, 0.15], [-0.5, -0.2], [0.1, 0.2]] as const)
          add(this.cone("head", r * 0.28, r * 0.55, [x * r, r * 0.95, z * r], color));
        break;
      case "bob":
        add(this.box("head", [r * 1.6, r * 1.2, r * 2.0], [-r * 0.25, -r * 0.2, 0], color));
        break;
      case "braids":
        for (const s of [-1, 1]) add(this.cyl("head", r * 0.13, r * 2.0, [-r * 0.8, -r * 1.1, s * r * 0.4], color));
        break;
      case "curls":
        add(this.ellipsoid("head", [r * 1.15, r * 0.85, r * 1.1], [-r * 0.08, r * 0.45, 0], color));
        break;
      case "short":
      case "shaved":
        break;
    }
  }

  private material(color: number): THREE.MeshStandardMaterial {
    const made: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
    this.owned.push(made);
    return made;
  }

  private mesh(group: string, geometry: THREE.BufferGeometry, color: number, at: [number, number, number]): THREE.Mesh {
    this.owned.push(geometry);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, this.material(color));
    mesh.position.set(...at);
    this.groups[group]!.add(mesh);
    return mesh;
  }

  private box(group: string, size: [number, number, number], at: [number, number, number], color: number, tilt: number = 0): THREE.Mesh {
    const mesh: THREE.Mesh = this.mesh(group, new THREE.BoxGeometry(...size), color, at);
    mesh.rotation.x = tilt;
    return mesh;
  }

  private cyl(group: string, radius: number, length: number, at: [number, number, number], color: number): THREE.Mesh {
    return this.mesh(group, new THREE.CylinderGeometry(radius, radius, length, 10), color, at);
  }

  private cone(group: string, radius: number, length: number, at: [number, number, number], color: number): THREE.Mesh {
    return this.mesh(group, new THREE.ConeGeometry(radius, length, 6), color, at);
  }

  private torus(group: string, radius: number, tube: number, at: [number, number, number], color: number): THREE.Mesh {
    return this.mesh(group, new THREE.TorusGeometry(radius, tube, 6, 16), color, at);
  }

  private ellipsoid(group: string, radii: [number, number, number], at: [number, number, number], color: number): THREE.Mesh {
    const mesh: THREE.Mesh = this.mesh(group, new THREE.SphereGeometry(1, 14, 10), color, at);
    mesh.scale.set(...radii);
    return mesh;
  }
}
