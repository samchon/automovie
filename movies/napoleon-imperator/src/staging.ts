import { projectileAt } from "@automovie/engine";
import * as THREE from "three";

import { Actor, primitive, retire, rod } from "./assets.ts";
import type { Shot } from "./film.ts";

const BLUE = "#4775a3",
  RED = "#a75450",
  CREAM = "#c3b595";
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const ease = (n: number) => {
  const x = clamp(n);
  return x * x * (3 - 2 * x);
};

/**
 * The episode's low-cost stage, controlled entirely by absolute shot time.
 * @evidence contracts/common.md#implementation-and-ownership Each shot installs one owned scene and evaluator. Source actions drive its actual actors and props; public projectileAt drives whole intact body flight. Changing shots retires prior resources.
 * @evidence contracts/common.md#authoring-interface Meters, Y-up and actor-local X-forward apply throughout. Camera presets belong to the actual delivered view; debug orbit is a separate explicit inspection control.
 */
export class Staging {
  readonly group = new THREE.Group();
  readonly actors: Actor[] = [];
  private id = "";
  private evaluate: (t: number) => void = () => {};
  private readonly look = new THREE.Vector3(0, 1, 0);
  constructor(
    readonly scene: THREE.Scene,
    readonly camera: THREE.PerspectiveCamera,
  ) {
    scene.add(this.group);
  }
  /**
   * Evaluate a complete stage at a selected instant, with no incremental state.
   * @evidence contracts/common.md#implementation-and-ownership A shot change rebuilds exclusive resources, and each frame re-evaluates all moving placements from the requested seconds. The camera and surfaces share that evaluation.
   * @evidence contracts/common.md#authoring-interface local is nonnegative shot-local seconds. Inspection yaw changes only the view; zero restores the authored camera.
   */
  frame(shot: Shot, local: number, inspectionYaw = 0): void {
    if (this.id !== shot.id) {
      retire(this.group);
      this.actors.length = 0;
      this.id = shot.id;
      this.prepare(shot);
    }
    this.evaluate(local);
    if (inspectionYaw !== 0) {
      const offset = this.camera.position.clone().sub(this.look);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), inspectionYaw);
      this.camera.position.copy(this.look).add(offset);
    }
    this.camera.lookAt(this.look);
    this.scene.updateMatrixWorld(true);
  }
  private view(x: number, y: number, z: number, tx = 0, ty = 1, tz = 0): void {
    this.camera.position.set(x, y, z);
    this.look.set(tx, ty, tz);
    this.camera.fov = 38;
    this.camera.updateProjectionMatrix();
  }
  private box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color = CREAM,
  ): THREE.Group {
    const object = primitive(
      { type: "box", width: w, height: h, depth: d },
      color,
    );
    object.position.set(x, y, z);
    this.group.add(object);
    return object;
  }
  private cylinder(
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    color = CREAM,
  ): THREE.Group {
    const object = primitive({ type: "cylinder", radius: r, height: h }, color);
    object.position.set(x, y, z);
    this.group.add(object);
    return object;
  }
  private label(words: string, x: number, y: number, z: number): void {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 96;
    const c = canvas.getContext("2d")!;
    c.fillStyle = "#111722dc";
    c.fillRect(0, 0, 768, 96);
    c.font = "500 39px Georgia";
    c.textAlign = "center";
    c.fillStyle = "#f5ead5";
    c.fillText(words, 384, 57);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        depthTest: false,
        transparent: true,
      }),
    );
    sprite.position.set(x, y, z);
    sprite.scale.set(words.length * 0.078 + 0.7, 0.38, 1);
    this.group.add(sprite);
  }
  private actor(
    name: string,
    x: number,
    z: number,
    color = BLUE,
    marker = "",
    facing = 0,
    y = 0,
  ): Actor {
    const a = new Actor(name, color, marker);
    a.root.position.set(x, y + 0.85, z);
    a.root.rotation.y = facing;
    this.group.add(a.root);
    this.actors.push(a);
    return a;
  }
  private named(
    name: string,
    x: number,
    z: number,
    marker = "",
    facing = 0,
    color = BLUE,
  ): Actor {
    const a = this.actor(name, x, z, color, marker, facing);
    this.label(name, x, 2.3, z);
    return a;
  }
  private floor(night = false): void {
    this.box(36, 0.14, 24, 0, -0.08, 0, night ? "#272e38" : "#7c8277");
    this.box(32, 0.015, 2.7, 0, 0.006, 0, night ? "#444448" : "#a69b80");
  }
  private room(): void {
    this.floor(true);
    this.box(14, 3.5, 0.15, 0, 1.7, -3, "#343b45");
    this.box(0.15, 3.5, 7, -7, 1.7, 0, "#333a44");
  }
  private table(x = 0, z = 0): void {
    this.box(2.7, 0.12, 1.5, x, 1.05, z, "#78634a");
    for (const dx of [-1.1, 1.1])
      for (const dz of [-0.55, 0.55])
        this.box(0.12, 1, 0.12, x + dx, 0.5, z + dz, "#594938");
  }
  private paper(x = 0, y = 1.13, z = 0): THREE.Group {
    return this.box(0.42, 0.014, 0.3, x, y, z, "#e8ddba");
  }
  private musket(a: Actor): THREE.Group {
    const gun = this.box(0.95, 0.045, 0.055, 0, 0, 0, "#493e33");
    a.root.add(gun);
    gun.position.set(0.4, 0.5, 0);
    return gun;
  }
  private hands(
    a: Actor,
    t: number,
    mode: string,
    right?: THREE.Vector3,
    left?: THREE.Vector3,
  ): void {
    a.pose(t, mode);
    a.root.updateMatrixWorld(true);
    const targets: [THREE.Vector3, THREE.Vector3] = [
      a.points[7]!.clone(),
      a.points[13]!.clone(),
    ];
    if (right) targets[0] = a.root.worldToLocal(right.clone());
    if (left) targets[1] = a.root.worldToLocal(left.clone());
    a.pose(t, mode, targets);
  }
  private hand(a: Actor, side = 0): THREE.Vector3 {
    a.root.updateMatrixWorld(true);
    return a.root.localToWorld(a.points[side === 0 ? 7 : 13]!.clone());
  }
  private horse(
    x: number,
    z: number,
    color = BLUE,
  ): { root: THREE.Group; rider: Actor; legs: THREE.Group[] } {
    const root = new THREE.Group();
    root.position.set(x, 0, z);
    this.group.add(root);
    const body = primitive(
      { type: "box", width: 1.3, height: 0.48, depth: 0.5 },
      "#6b5947",
    );
    body.position.y = 1.12;
    root.add(body);
    const head = primitive(
      { type: "box", width: 0.45, height: 0.48, depth: 0.28 },
      "#6b5947",
    );
    head.position.set(0.77, 1.52, 0);
    head.rotation.z = -0.3;
    root.add(head);
    const legs = [];
    for (const xx of [-0.48, 0.48])
      for (const zz of [-0.2, 0.2]) {
        const leg = primitive(
          { type: "cylinder", radius: 0.045, height: 0.9 },
          "#423b35",
        );
        leg.position.set(xx, 0.5, zz);
        root.add(leg);
        legs.push(leg);
      }
    const rider = this.actor("rider", 0, 0, color);
    root.add(rider.root);
    rider.root.position.set(-0.06, 1.65, 0);
    rider.pose(0, "ride");
    return { root, rider, legs };
  }
  private cart(x = 0, z = 0): { root: THREE.Group; wheels: THREE.Group[] } {
    const root = new THREE.Group();
    root.position.set(x, 0, z);
    this.group.add(root);
    const deck = primitive(
      { type: "box", width: 1.6, height: 0.22, depth: 1.2 },
      "#776346",
    );
    deck.position.y = 0.63;
    root.add(deck);
    const wheels = [];
    for (const xx of [-0.55, 0.55])
      for (const zz of [-0.68, 0.68]) {
        const wheel = primitive(
          { type: "cylinder", radius: 0.37, height: 0.08 },
          "#3e3b34",
        );
        wheel.position.set(xx, 0.37, zz);
        wheel.rotation.x = Math.PI / 2;
        root.add(wheel);
        wheels.push(wheel);
      }
    for (const zz of [-0.43, 0.43]) {
      const handle = primitive(
        { type: "box", width: 1.4, height: 0.08, depth: 0.08 },
        "#776346",
      );
      handle.position.set(-1.1, 0.98, zz);
      root.add(handle);
    }
    return { root, wheels };
  }
  private march(
    t: number,
    actors: Actor[],
    speed = 0.65,
    from = -5,
    to = 5,
  ): void {
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i]!;
      a.root.position.x = from + ((t * speed + i * 0.8) % (to - from));
      a.pose(t + i * 0.18, "walk");
    }
  }
  private prepare(shot: Shot): void {
    const id = shot.id;
    const dark = [
      "fork",
      "orders",
      "descent",
      "empty",
      "mail",
      "wine",
      "sleep",
      "raygern",
      "cheers",
      "bowl",
      "separate",
      "straw",
      "silence",
      "author",
    ].includes(id);
    this.scene.background = new THREE.Color(dark ? "#171d29" : "#9aa6a4");
    this.view(8, 5.7, 11);
    this.floor(dark);
    this.evaluate = () => this.view(8, 5.7, 11);
    if (["silence", "author"].includes(id)) {
      this.group.visible = false;
      this.evaluate = () => this.view(8, 5, 11);
      return;
    }
    this.group.visible = true;
    if (["cart", "columns"].includes(id)) {
      const cart = this.cart(0, 0),
        p1 = this.actor("pusher", -2.3, -0.43, id === "columns" ? RED : BLUE),
        p2 = this.actor("pusher", -2.3, 0.43, id === "columns" ? RED : BLUE);
      const soldiers = Array.from({ length: 8 }, (_, i) =>
        this.actor(
          "infantry",
          -4 - i * 0.55,
          1.3 + (i % 2) * 0.55,
          id === "columns" ? RED : BLUE,
        ),
      );
      const rear = this.actor("rear guard", -4, -1.3);
      this.musket(rear);
      const cannon = this.cylinder(0.2, 0.9, -6, 0.55, -2, "#3c4547");
      cannon.rotation.z = -Math.PI / 2;
      this.evaluate = (t) => {
        this.view(6, 4.8, 9, -0.3, 1, 0);
        const move = ease((t - 3) / 4) * 3;
        cart.root.position.x = move;
        cart.wheels.forEach((w) => (w.rotation.z = -move / 0.37));
        for (const [i, a] of [p1, p2].entries()) {
          a.root.position.x = -2.3 + move;
          a.root.position.z = i === 0 ? -0.43 : 0.43;
          a.pose(t, "push", [
            new THREE.Vector3(0.5, 0.13, 0.025),
            new THREE.Vector3(0.5, 0.13, -0.025),
          ]);
        }
        soldiers.forEach((a, i) => {
          const d = Math.max(0, t - 4) * 0.68;
          a.root.position.x = -4 - i * 0.55 + d;
          a.pose(t, "walk");
        });
        rear.pose(t, t < shot.duration - 3 ? "aim" : "walk");
        rear.root.rotation.y = t < shot.duration - 3 ? Math.PI : 0;
        rear.root.position.x = -4 + Math.max(0, t - shot.duration + 3) * 0.7;
      };
      return;
    }
    if (["fork", "descent", "ascent", "march", "raygern"].includes(id)) {
      const soldiers = Array.from({ length: 12 }, (_, i) =>
        this.actor(
          "marcher",
          -5 + i * 0.5,
          ((i % 3) - 1) * 0.7,
          id === "ascent" ? RED : BLUE,
        ),
      );
      if (id === "fork") {
        const branch = this.box(8, 0.018, 1.6, 2, 0.015, 2, "#81775f");
        branch.rotation.y = -0.65;
        this.box(2, 2.8, 2, -5, 1.4, -4, "#4a4341");
      }
      if (id === "descent" || id === "ascent") {
        const hill = this.box(18, 0.5, 4, 0, 0.8, -0.2, "#657569");
        hill.rotation.z = 0.13;
      }
      if (id === "raygern") this.label("Friant's leading men", 0, 2.6, 0);
      this.evaluate = (t) => {
        this.view(8, 4.8, 11, 0, 1, 0);
        let tt = t;
        if (id === "raygern") tt = t < 3 ? t : t < 5 ? 3 : t - 2;
        this.march(tt, soldiers, 0.65, -6, 7);
        if (id === "raygern" && t > 3 && t < 5) {
          soldiers.forEach((a) => a.pose(t, "stand"));
          soldiers[0]!.pose(t, "sit");
        }
        if (id === "descent" || id === "ascent")
          soldiers.forEach(
            (a) => (a.root.position.y = 0.85 + 1.05 + a.root.position.x * 0.13),
          );
      };
      return;
    }
    if (id === "empty") {
      const hill = this.box(18, 0.5, 4, 0, 0.8, -0.2, "#657569");
      hill.rotation.z = 0.13;
      this.evaluate = (t) => {
        this.view(9 - t * 0.2, 4.3, 11);
      };
      return;
    }
    if (["orders", "dictation"].includes(id)) {
      this.room();
      this.table();
      const berthier = this.named("Berthier", -1.8, 0, "", 0),
        napoleon = this.named("Napoleon", 1.8, 0, "bicorn", Math.PI);
      const paper = this.paper(-1.2, 1.2, 0);
      const pen = this.box(0.23, 0.02, 0.02, -1.2, 1.22, 0, "#242931");
      const bag = this.box(0.35, 0.35, 0.12, -2, 1, 0.6, "#6d5039");
      const horse = this.horse(-4, 2);
      const messenger = this.actor("messenger", -2.4, 0.8);
      this.label("Transmitting orders for the French army", 0, 3, -1);
      this.evaluate = (t) => {
        this.view(7, 4.5, 8, 0, 1, 0);
        berthier.pose(
          t,
          id === "dictation" ? "write" : t < 3 ? "write" : "point",
        );
        napoleon.pose(t, "stand");
        paper.rotation.z = -0.3 * ease(t / 1.2);
        pen.visible = id === "dictation";
        pen.position.x = -1.2 + Math.sin(t * 12) * 0.025;
        this.hands(berthier, t, "write", pen.position.clone());
        const progress = ease((t - 3) / 2);
        messenger.root.position.set(
          -2.4 - progress * 1.6,
          0.85,
          0.8 + progress * 1.2,
        );
        messenger.root.rotation.y = 2.4;
        messenger.root.visible = t < 5;
        messenger.pose(t, t < 3 ? "carry" : "walk");
        horse.rider.root.visible = t >= 5;
        horse.root.position.x = -4 + Math.max(0, t - 6) * 0.9;
        horse.rider.pose(t, "ride");
        bag.position
          .copy(this.hand(t < 5 ? messenger : horse.rider))
          .add(new THREE.Vector3(0, -0.12, 0));
        horse.legs.forEach(
          (l, i) =>
            (l.rotation.z = t < 6 ? 0 : Math.sin(t * 7 + i * Math.PI) * 0.25),
        );
      };
      return;
    }
    if (["arrival", "petition", "paper", "writing"].includes(id)) {
      this.room();
      this.table();
      const murat = this.named("Murat · Marshal", -2, -1, "feather", 0),
        soult = this.named("Soult · Marshal", 1.25, 0.45, "", Math.PI),
        lannes = this.named("Lannes · Marshal", -0.5, 1.15, "", Math.PI / 2);
      const paper = this.paper(0.65, 1.13, 0.6),
        pen = this.box(0.25, 0.018, 0.018, -0.5, 1.17, 0.65, "#282e38");
      this.box(0.18, 2.9, 1, -3.4, 1.45, -2.3, "#655b4b");
      this.box(1.8, 0.18, 1, -4.2, 2.9, -2.3, "#655b4b");
      this.evaluate = (t) => {
        this.view(7, 4.5, 8, 0, 1, 0);
        murat.pose(t, id === "arrival" ? "walk" : "point");
        murat.root.position.x = id === "arrival" ? -4 + ease(t / 4) * 2 : -2;
        soult.pose(t, id === "paper" ? "push" : "point");
        lannes.pose(t, id === "writing" ? "write" : "stand");
        paper.position.x =
          id === "paper" ? 0.65 - ease((t - 1) / 3) * 1.15 : -0.5;
        pen.position.x = -0.5 + Math.sin(t * 12) * 0.025;
        pen.visible = id === "writing";
        if (id === "writing")
          this.hands(
            lannes,
            t,
            "write",
            pen.position.clone(),
            new THREE.Vector3(-0.65, 1.14, 0.72),
          );
        if (id === "paper" && t < 1.8)
          this.hands(
            soult,
            t,
            "write",
            new THREE.Vector3(paper.position.x, 1.15, 0.6),
          );
      };
      return;
    }
    if (
      ["delivery", "boast", "challenge", "withdraw", "departures"].includes(id)
    ) {
      this.room();
      this.table(0, -0.6);
      const napoleon = this.named("Napoleon", -2, -0.7, "bicorn", 0),
        lannes = this.named("Lannes", 0.5, 0.9, "", Math.PI),
        soult = this.named("Soult", 2, -0.4, "", Math.PI),
        murat = this.named("Murat", 3, 1.4, "feather", Math.PI);
      const letter = this.paper(-1.1, 1.36, 0.4);
      this.evaluate = (t) => {
        this.view(7, 4.5, 9, 0, 1.1, 0.1);
        napoleon.pose(t, id === "withdraw" ? "point" : "carry");
        soult.pose(t, id === "boast" ? "point" : "stand");
        lannes.pose(t, id === "challenge" ? "point" : "carry");
        murat.pose(t, "stand");
        const q =
          id === "delivery" ? ease(t / 1.5) * (1 - ease((t - 1.6) / 1.5)) : 0;
        lannes.root.position.set(0.5 - q * 1.3, 0.85, 0.9 - q * 1.45);
        letter.position.set(-1.4, 1.36, -0.55);
        lannes.root.rotation.y =
          id === "challenge" || id === "withdraw" ? 0 : Math.PI;
        if (id === "delivery" && t < 1.5) {
          lannes.pose(t, "carry", [
            new THREE.Vector3(0.6, 0.51, 0),
            new THREE.Vector3(0.2, 0.23, -0.2),
          ]);
          letter.position
            .copy(this.hand(lannes))
            .add(new THREE.Vector3(0, 0.01, 0));
        } else {
          this.hands(napoleon, t, "carry", letter.position.clone());
        }
        if (id === "departures")
          for (const [a, delay] of [
            [soult, 0],
            [lannes, 1.7],
            [murat, 3.2],
          ] as const) {
            a.root.position.x =
              (a === soult ? 2 : a === lannes ? 0.5 : 3) +
              Math.max(0, t - delay) * 1.1;
            a.root.rotation.y = 0;
            a.pose(t, "walk");
          }
      };
      return;
    }
    if (id === "conference") {
      this.room();
      this.table();
      const w = this.named("Weyrother", -2, 0, "", 0, RED),
        alex = this.named(
          "Alexander · Emperor of Russia",
          1.4,
          -1.1,
          "",
          Math.PI,
          RED,
        ),
        kut = this.named(
          "Kutuzov · Russian commander",
          1.5,
          1.2,
          "",
          Math.PI,
          RED,
        );
      const map = this.box(1.9, 0.02, 1.1, 0, 1.13, 0, "#c7c2a1");
      const route = this.box(1.5, 0.02, 0.035, 0, 1.15, 0, RED);
      route.rotation.y = -0.5;
      this.label("Road to Vienna", 0, 1.5, -0.5);
      this.evaluate = (t) => {
        this.view(6, 4.5, 7);
        w.pose(t, "point");
        alex.pose(t, "sit");
        kut.pose(t, "sit");
        kut.root.position.y = 0.62;
        map.rotation.y = 0;
      };
      return;
    }
    if (["mail", "wine", "sleep"].includes(id)) {
      this.room();
      this.table(-2);
      const a = this.actor("staff officer", -3.4, 0),
        b = this.actor("staff officer", -1, 1.1);
      const paper = this.paper(-2.8, 1.35, 0);
      const cask = this.cylinder(0.4, 0.8, 1, 0.5, 0, "#665039");
      const straw = this.box(0.04, 1.15, 0.04, 1, 1.3, 0, "#d9caa0");
      straw.rotation.z = -0.5;
      for (let i = 0; i < 12; i++) {
        const s = this.box(
          1.3,
          0.018,
          0.05,
          2 + (i % 4) * 0.2,
          0.04,
          -1 + Math.floor(i / 4) * 0.45,
          "#b6a56d",
        );
        s.rotation.y = i * 0.9;
      }
      const cheer = this.actor("soldier", 4, -2);
      this.box(1.8, 2.8, 0.15, 4, 1.4, -2.6, "#a88f54");
      const doorway = new THREE.PointLight("#ffd698", 3, 7);
      doorway.position.set(4, 1.6, -1.8);
      this.group.add(doorway);
      this.evaluate = (t) => {
        this.view(7, 4.5, 8);
        a.root.rotation.z = 0;
        b.root.rotation.z = 0;
        a.root.position.set(-3.4, 0.85, 0);
        b.root.position.set(-1, 0.85, 1.1);
        a.pose(t, "carry");
        b.pose(t, "carry");
        if (id === "wine") {
          b.root.position.set(0.45, 0.85, 0.3);
          b.pose(t, "carry");
        }
        if (id === "sleep") {
          const awake = ease((t - 1.35) / 1.2),
            awake2 = ease((t - 2) / 1.2);
          a.root.position.set(1, 0.18 + awake * 0.27, -0.5);
          a.root.rotation.z = ((1 - awake) * Math.PI) / 2;
          a.pose(t, awake === 0 ? "stand" : "sit");
          b.root.position.set(2, 0.18 + awake2 * 0.27, 0.7);
          b.root.rotation.z = ((1 - awake2) * Math.PI) / 2;
          b.pose(t, awake2 === 0 ? "stand" : "sit");
          paper.visible = false;
          doorway.intensity = 2.5 + Math.sin(t * 11) * 0.7;
        }
        cheer.pose(t, id === "sleep" ? "cheer" : "stand");
        cask.visible = id !== "sleep";
        straw.visible = id === "wine";
      };
      return;
    }
    if (id === "duel") {
      const lannes = this.named("Lannes", -0.8, 0.5, "", 0),
        soult = this.named("Soult", 0.8, 0, "", Math.PI);
      this.evaluate = (t) => {
        this.view(6, 3.5, 8);
        lannes.pose(t, t < 7 ? "point" : "walk");
        soult.pose(t, t < 6 ? "stand" : "walk");
        soult.root.rotation.y = t < 6 ? Math.PI : 0;
        soult.root.position.x = 0.8 + Math.max(0, t - 6) * 0.9;
        lannes.root.position.z = 0.5 + Math.max(0, t - 8) * 0.65;
        lannes.root.rotation.y = t < 8 ? 0 : -Math.PI / 2;
      };
      return;
    }
    if (["village", "davout", "ammunition"].includes(id)) {
      this.box(14, 0.025, 1, 0, 0.02, -2.5, "#728e9b");
      this.box(3, 1.1, 0.25, -0.4, 0.55, -0.3, "#b3b29f");
      this.box(3, 1.1, 0.25, -0.4, 2.2, -0.3, "#b3b29f");
      this.box(0.4, 1, 0.25, -1.7, 1.5, -0.3, "#b3b29f");
      this.box(0.4, 1, 0.25, 0.9, 1.5, -0.3, "#b3b29f");
      const shooter = this.actor(
          "window defender",
          -0.5,
          0.5,
          BLUE,
          "",
          Math.PI / 2,
        ),
        supplier = this.actor("ammunition bearer", 0.6, 0.5, BLUE, "", Math.PI);
      this.musket(shooter);
      const ammo = this.box(0.16, 0.06, 0.09, 0.05, 1.2, 0.5, "#e0d0ac");
      const davout = this.named("Davout", -3, 1.6, "glasses", 0),
        friant = this.named("Friant", -4, 0);
      const reinforcements = Array.from({ length: 6 }, (_, i) =>
        this.actor("leading men", -5 - i * 0.5, 1.5 + (i % 2) * 0.5),
      );
      const enemies = Array.from({ length: 5 }, (_, i) =>
        this.actor("attacker", -2 + i, -4, RED, "", -Math.PI / 2),
      );
      this.evaluate = (t) => {
        this.view(6, 4.4, 8, 0, 1, 0);
        shooter.pose(t, t % 3 < 1.6 ? "aim" : "write");
        supplier.pose(t, "carry");
        const q = ease((t - 1) / 2);
        ammo.position.set(0.05 - q * 0.35, 1.2, 0.5);
        if (t < 2) this.hands(supplier, t, "carry", ammo.position.clone());
        else this.hands(shooter, t, "write", ammo.position.clone());
        davout.pose(t, "point");
        friant.pose(t, "walk");
        reinforcements.forEach((a, i) => {
          a.root.position.x = -5 - i * 0.5 + Math.min(5, t * 0.7);
          a.pose(t + i * 0.1, "walk");
        });
        enemies.forEach((a) => {
          a.root.position.z = -4 + t * 0.16;
          a.pose(t, "walk");
        });
        if (id !== "davout") {
          davout.root.visible = false;
          friant.root.visible = false;
        }
      };
      return;
    }
    if (id === "center") {
      const n = this.named("Napoleon", -2, 1, "bicorn"),
        s = this.named("Soult", -0.3, 1, "", Math.PI);
      this.box(12, 0.5, 4, 2, 0.8, -3, "#71806e");
      const allies = Array.from({ length: 8 }, (_, i) =>
        this.actor("Allied descent", 2 + i * 0.6, -3, RED),
      );
      this.evaluate = (t) => {
        this.view(7, 5.2, 10, 0, 1, -1);
        n.pose(t, "point");
        s.pose(t, "stand");
        allies.forEach((a, i) => {
          a.root.position.x = 2 + i * 0.6 + t * 0.25;
          a.root.position.y = 1.9 - t * 0.08;
          a.pose(t, "walk");
        });
      };
      return;
    }
    if (["climb", "counterattack"].includes(id)) {
      const hill = this.box(17, 0.5, 7, 0, 0.8, 0, "#77816c");
      hill.rotation.z = 0.16;
      const french = Array.from({ length: 10 }, (_, i) =>
        this.actor(
          "French infantry",
          -5 + (i % 5) * 0.5,
          Math.floor(i / 5) * 0.9,
        ),
      );
      const ball = primitive({ type: "sphere", radius: 0.11 }, "#30383c");
      this.group.add(ball);
      const enemy = Array.from({ length: 7 }, (_, i) =>
        this.actor(
          "counterattack",
          5 + (i % 4) * 0.5,
          -1 + Math.floor(i / 4),
          RED,
          "",
          Math.PI,
        ),
      );
      this.evaluate = (t) => {
        this.view(7, 5.5, 12, 0, 1.6, 0);
        const phase = id === "climb" ? t : 9 + t;
        french.forEach((a, i) => {
          a.root.position.x = -5 + (i % 5) * 0.5 + Math.min(5, phase * 0.6);
          a.root.position.z =
            Math.floor(i / 5) * 0.9 +
            (phase > 3 ? (i % 2 ? 1 : -1) * ease((phase - 3) / 2) * 0.7 : 0);
          a.root.position.y = 1.9 + a.root.position.x * 0.16;
          a.pose(
            t + i * 0.1,
            id === "climb" && t > 2 && t < 4
              ? "duck"
              : phase > 5
                ? "aim"
                : "walk",
          );
        });
        enemy.forEach((a, i) => {
          a.root.position.x =
            5 +
            (i % 4) * 0.5 -
            (id === "counterattack" ? Math.min(4, t * 0.6) : 0);
          a.root.position.y = 1.9 + a.root.position.x * 0.16;
          a.pose(t, t < 6 ? "walk" : "aim");
        });
        ball.visible = id === "counterattack" && t >= 2.7 && t < 3;
        if (id === "counterattack") {
          const a = french[3]!;
          const flight = Math.max(0, t - 3);
          const land =
            (3.52 + Math.sqrt(3.52 * 3.52 + 4 * 4.905 * 0.55)) / (2 * 4.905);
          const state = projectileAt(
            {
              origin: { x: 1.5, y: 2.14, z: 0.7 },
              velocity: { x: 3, y: 4, z: 1.2 },
              gravity: { x: 0, y: -9.81, z: 0 },
            },
            Math.min(flight, land),
          );
          if (flight > 0) {
            a.root.position.set(
              state.position.x,
              state.position.y,
              state.position.z,
            );
            a.root.rotation.z = (-ease(flight / land) * Math.PI) / 2;
            a.shadow.visible = false;
          } else {
            a.root.rotation.z = 0;
            a.shadow.visible = true;
          }
          const projectile = projectileAt(
            {
              origin: { x: -6, y: 2.14, z: 0.7 },
              velocity: { x: 25, y: 0, z: 0 },
              gravity: { x: 0, y: 0, z: 0 },
            },
            t - 2.7,
          );
          ball.position.set(
            projectile.position.x,
            projectile.position.y,
            projectile.position.z,
          );
        }
      };
      return;
    }
    if (["north", "guard", "tangle"].includes(id)) {
      const infantry = Array.from({ length: 12 }, (_, i) =>
        this.actor("infantry", -3 + (i % 4) * 0.5, Math.floor(i / 4) * 0.75),
      );
      const riders = Array.from({ length: 4 }, (_, i) =>
        this.horse(-5 - i * 1.7, -1.4, BLUE),
      );
      const opponents = Array.from({ length: 4 }, (_, i) =>
        this.horse(5 + i * 1.4, -2.6, RED),
      );
      if (id === "north") {
        this.label("Lannes · infantry", -2, 2.7, 1);
        this.label("Murat · cavalry", -3, 3, -1.4);
        this.label("Liechtenstein", 4, 3, -2.6);
      }
      if (id === "guard") {
        this.label("Rapp", -2, 3, -1.4);
        this.label("French infantry reserve", -1, 2.7, 1);
      }
      this.evaluate = (t) => {
        this.view(8, 6.5, 12, 0, 1, 0.1);
        infantry.forEach((a, i) => a.pose(t, "aim"));
        riders.forEach((h, i) => {
          h.root.position.x =
            -5 -
            i * 1.7 +
            (id === "guard"
              ? Math.min(7, t * 0.9) - Math.max(0, Math.min(2, t - 6)) * 0.8
              : t * 0.85);
          h.root.position.z =
            -1.4 + (id === "tangle" ? Math.sin(t + i) * 0.7 : 0);
          h.root.rotation.y = id === "tangle" ? ease((t - 1) / 3) * Math.PI : 0;
          h.rider.pose(t, "ride");
          h.legs.forEach(
            (l, j) => (l.rotation.z = Math.sin(t * 8 + j * Math.PI) * 0.3),
          );
        });
        opponents.forEach((h, i) => {
          h.root.position.x =
            5 + i * 1.4 - (id === "guard" ? Math.min(6, t * 0.8) : t * 0.65);
          h.root.rotation.y = Math.PI;
          h.legs.forEach(
            (l, j) => (l.rotation.z = Math.sin(t * 8 + j * Math.PI) * 0.3),
          );
        });
        if (id === "guard") {
          riders[3]!.root.position.x = -10 + Math.max(0, t - 6) * 1.8;
          riders[3]!.root.position.z = 0.1;
        }
      };
      return;
    }
    if (id === "eagle") {
      const french = this.actor("4th Line bearer", -1, 0),
        russian = this.actor("Russian Guard", 1, 0, RED, "", Math.PI);
      const pole = this.box(0.055, 2.6, 0.055, -0.5, 1.4, 0, "#bba05e"),
        eagle = this.box(0.45, 0.18, 0.12, 0, 1.35, 0, "#dab45b");
      pole.add(eagle);
      this.label("French 4th Line", -2, 2.7, 1);
      this.label("Russian Guard", 2.5, 2.7, 1);
      this.evaluate = (t) => {
        this.view(5, 3.6, 7);
        const approach = ease(t / 2),
          q = ease((t - 3) / 3);
        french.pose(t, "point");
        russian.root.position.x = 1 - approach * 0.9 + q * 2.5;
        pole.position.x = -0.5 + q * 2.5;
        pole.rotation.z = -0.15 * (1 - approach);
        if (t < 3)
          this.hands(
            french,
            t,
            "carry",
            new THREE.Vector3(pole.position.x, 1.4, 0),
          );
        else
          this.hands(
            russian,
            t,
            "carry",
            new THREE.Vector3(pole.position.x, 1.4, 0),
          );
      };
      return;
    }
    if (id === "rapp") {
      const rapp = this.named("Rapp", 0, 0, "hair", Math.PI);
      const bandage = this.box(0.1, 0.12, 0.15, 0, 0.43, -0.17, "#c7b79d");
      rapp.root.add(bandage);
      this.evaluate = (t) => {
        this.view(4, 2.5, 5, 0, 1.1, 0);
        rapp.root.position.x = 1 - t * 0.25;
        rapp.root.rotation.z = 0.12;
        rapp.pose(t, "walk", [
          new THREE.Vector3(0.2, 0.2, 0.1),
          new THREE.Vector3(0.05, -0.02, -0.22),
        ]);
      };
      return;
    }
    if (id === "rearguard") {
      const guards = Array.from({ length: 4 }, (_, i) =>
        this.actor("rearguard", -2 + i * 0.6, -1, RED, "", Math.PI),
      );
      const fleeing = Array.from({ length: 10 }, (_, i) =>
        this.actor("retreating troop", -4 - i * 0.5, 0.5 + (i % 2) * 0.7, RED),
      );
      this.evaluate = (t) => {
        this.view(7, 4.5, 10);
        guards.forEach((a) => a.pose(t, t < 2 ? "walk" : "aim"));
        this.march(t, fleeing, 0.9, -5, 8);
      };
      return;
    }
    if (id === "ice") {
      this.box(10, 0.025, 7, 2, 0.03, -3, "#8cabb2");
      const ice = this.box(5, 0.04, 3, 0, 0.08, -1.7, "#a9bcc0");
      const queue = Array.from({ length: 10 }, (_, i) =>
        this.actor("retreating troop", -4 - i * 0.65, 0.4, RED),
      );
      this.evaluate = (t) => {
        this.view(7, 6.5, 10, 0, 0.7, -1);
        const first = queue[0]!;
        first.root.position.x = -2 + Math.min(t, 3) * 0.6;
        first.root.position.z = t < 5 ? 0.4 : 0.4 + ease((t - 5) / 3) * 1.9;
        first.root.rotation.y = t < 5 ? 0 : -Math.PI / 2;
        first.pose(t, t < 3 || t > 5 ? "walk" : "stand");
        ice.rotation.z = t > 3 ? -0.045 * ease((t - 3) / 1) : 0;
        ice.position.y = 0.08 - (t > 3 ? 0.09 * ease((t - 3) / 1) : 0);
        queue.slice(1).forEach((a, i) => {
          a.root.position.x = -4 - i * 0.65 + Math.min(t, 3) * 0.6;
          a.pose(t, t < 3 ? "walk" : "stand");
          a.root.position.z =
            0.4 + (t > 7 && i < 2 ? ease((t - 7) / 3) * 1.4 : 0);
        });
      };
      return;
    }
    if (["cheers", "bowl", "separate", "straw"].includes(id)) {
      for (let i = 0; i < 18; i++) {
        const straw = this.box(
          1.4,
          0.018,
          0.045,
          (i % 6) * 0.38 - 1,
          0.05,
          Math.floor(i / 6) * 0.5,
          "#a39161",
        );
        straw.rotation.y = i * 0.8;
      }
      const seated = this.actor("soldier", 0, 0),
        friend = this.actor("friend", 2, 0);
      const bowl = this.cylinder(0.17, 0.1, 0.4, 0.5, 0.25, "#bca47e");
      const crowd = Array.from({ length: 6 }, (_, i) =>
        this.actor(
          "cheering soldier",
          -4 + (i % 3) * 0.8,
          -2 + Math.floor(i / 3) * 0.7,
        ),
      );
      const lannes = this.named("Lannes", -4, 1.7),
        soult = this.named("Soult", 4, 1.7);
      const carriers = [
        this.actor("carrier", -4.5, 3),
        this.actor("carrier", -1.5, 3, BLUE, "", Math.PI),
      ];
      const stretcher = this.box(2.2, 0.08, 0.7, -3, 1.1, 3, "#776b52");
      const wounded = this.actor("wounded", -3, 3);
      wounded.root.rotation.z = Math.PI / 2;
      wounded.root.position.y = 1.29;
      wounded.shadow.visible = false;
      this.evaluate = (t) => {
        const close = id === "straw" || id === "bowl";
        this.view(
          close ? 2.8 : 7,
          close ? 2.1 : 4.8,
          close ? 3.2 : 10,
          close ? 0.4 : 0,
          close ? 0.45 : 1,
          0,
        );
        seated.root.position.y = 0.45;
        seated.pose(t, "sit");
        friend.root.rotation.y = Math.PI;
        friend.root.position.set(
          2 - ease(t / 3) * 1.35,
          t < 3 ? 0.85 : 0.45,
          0,
        );
        friend.pose(t, t < 3 ? "walk" : "sit");
        const q = ease((t - 3) / 3);
        bowl.position.set(0.35 + q * 0.1, 0.5 - q * 0.39, 0.25);
        if (id === "cheers") {
          bowl.position.set(0.35, 0.5, 0.25);
          this.hands(seated, t, "sit", bowl.position.clone());
        } else if (t < 3) {
          this.hands(seated, t, "sit", bowl.position.clone());
        } else {
          this.hands(friend, t, "press", undefined, bowl.position.clone());
        }
        crowd.forEach((a) => a.pose(t, id === "cheers" ? "cheer" : "stand"));
        lannes.pose(t, "stand");
        soult.pose(t, "stand");
        carriers.forEach((a, i) => {
          a.root.position.x = -4.5 + i * 3 + t * 0.65;
          a.pose(t, "carry-walk");
        });
        stretcher.position.x = -3 + t * 0.65;
        wounded.root.position.x = -3 + t * 0.65;
        wounded.pose(t, "stand");
        if (id === "straw") {
          friend.root.visible = false;
          crowd.forEach((a) => (a.root.visible = false));
          carriers.forEach((a) => (a.root.visible = false));
          stretcher.visible = false;
          wounded.root.visible = false;
          lannes.root.visible = false;
          soult.root.visible = false;
          seated.pose(t, "press", [
            new THREE.Vector3(0.24, -0.39 + Math.sin(t * 2) * 0.006, 0.28),
            new THREE.Vector3(0.2, 0.03, -0.18),
          ]);
        }
      };
      return;
    }
    throw new Error(`Unimplemented screenplay stage ${id}`);
  }
}
