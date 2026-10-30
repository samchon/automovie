import { projectileAt } from "@automovie/engine";
import * as THREE from "three";

import { Actor, primitive, retire, rod } from "./assets.ts";
import type { Film, Shot } from "./film.ts";

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
    readonly film: Film,
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
    const named=this.actors.filter(a=>a.tag&&a.root.visible);
    named.forEach((a,i)=>{a.tag!.visible=Math.floor(local/2)%named.length===i;});
    const fires=this.film.events.filter(e=>e.shot===shot.id&&(e.action==="fire"||e.action==="rear-fire")&&shot.start+local>=e.start&&shot.start+local<e.start+e.duration);
    for(const a of this.actors){if(!a.rifle)continue;const aim=a.mode==="aim"||a.mode==="aim-walk";const grip=a.points[(a.mode==="load-walk"||a.mode==="reload"||a.mode==="reload-walk")? 13:7]!.clone();a.rifle.rotation.z=aim? 0:1.2;if(aim)grip.add(a.points[13]!).multiplyScalar(.5);else grip.add(new THREE.Vector3(Math.cos(1.2),Math.sin(1.2),0).multiplyScalar(.2));a.rifle.position.copy(grip);if(a.flash)a.flash.visible=aim&&fires.length>0;}
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
  private label(words: string, x: number, y: number, z: number): THREE.Sprite {
    const canvas = document.createElement("canvas");
    canvas.height = 80;
    const c = canvas.getContext("2d")!;
    c.font="500 39px Georgia";canvas.width=Math.ceil(c.measureText(words).width+40);c.font="500 39px Georgia";
    c.fillStyle = "#111722dc";
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.font = "500 39px Georgia";
    c.textAlign = "center";
    c.fillStyle = "#f5ead5";
    c.fillText(words, canvas.width/2, 53);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        depthTest: false,
        transparent: true,
      }),
    );
    sprite.position.set(x, y, z);
    sprite.scale.set(canvas.width/canvas.height*.38,.38,1);
    this.group.add(sprite);
    return sprite;
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
    const a = new Actor(name, color, marker, this.film.performance);
    a.root.position.set(x, y + 0.85, z);
    a.root.rotation.y = facing;
    this.group.add(a.root);
    this.actors.push(a);
    if(/infantry|defender|attacker|rearguard|leading men|rear guard|counterattack/.test(name))this.musket(a);
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
    a.tag=this.label(name,0,1.45,0);a.root.add(a.tag);
    return a;
  }
  private floor(night = false): void {
    this.box(36, 0.14, 24, 0, -0.074, 0, night ? "#272e38" : "#7c8277");
    this.box(32, 0.004, 2.7, 0, -.002, 0, night ? "#444448" : "#a69b80");
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
  private foldingPaper(x:number,y:number,z:number):{root:THREE.Group;hinge:THREE.Group} {
    const root=new THREE.Group();root.position.set(x,y,z);this.group.add(root);const left=primitive({type:"box",width:.21,height:.014,depth:.3},"#e8ddba");left.position.x=-.105;root.add(left);const hinge=new THREE.Group();const right=primitive({type:"box",width:.21,height:.014,depth:.3},"#e8ddba");right.position.x=.105;hinge.position.y=.015;hinge.add(right);root.add(hinge);return {root,hinge};
  }
  private musket(a: Actor): THREE.Group {
    if(a.rifle)return a.rifle;
    const gun = this.box(0.95, 0.045, 0.055, 0, 0, 0, "#493e33");
    a.root.add(gun);
    gun.position.set(0.4, 0.5, 0);
    a.rifle=gun;const flash=primitive({type:"sphere",radius:.1},"#ffc967");flash.position.x=.5;flash.visible=false;gun.add(flash);a.flash=flash;
    return gun;
  }
  private phase(shot:Shot,action:string,t:number):number {const event=this.film.events.find(e=>e.shot===shot.id&&e.action===action);if(!event)throw new Error(`Missing shared event ${shot.id}/${action}`);return clamp((shot.start+t-event.start)/event.duration);}
  private storyTime(shot:Shot,first:string,t:number):number {const origin=this.film.shots.find(s=>s.id===first);if(!origin)throw new Error(`Missing story origin ${first}`);return shot.start-origin.start+t;}
  private slope(w:number,d:number,x:number,y:number,z:number,axis:"x"|"z",angle:number):(x:number,z:number)=>number {
    const hill=this.box(w,.5,d,x,y,z,"#71806e");if(axis==="x")hill.rotation.z=angle;else hill.rotation.x=angle;hill.updateMatrixWorld(true);
    const normal=new THREE.Vector3(0,1,0).applyQuaternion(hill.quaternion);const point=hill.localToWorld(new THREE.Vector3(0,.25,0));const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,point);
    return (px,pz)=>Math.max(0,(-plane.constant-normal.x*px-normal.z*pz)/normal.y);
  }
  private map(x=0,z=0):THREE.Group {
    const map=this.box(1.7,.018,1.1,x,1.13,z,"#c8bfa0");for(const [dx,dz]of[[-.6,-.3],[.1,.35],[.6,-.15]]){const mark=primitive({type:"box",width:.13,height:.035,depth:.13},BLUE);mark.position.set(dx,.025,dz);map.add(mark);}return map;
  }
  private hands(
    a: Actor,
    t: number,
    mode: string,
    right?: THREE.Vector3,
    left?: THREE.Vector3,
    speed=.65,
  ): void {
    a.pose(t, mode,undefined,undefined,speed);
    a.root.updateMatrixWorld(true);
    const targets: [THREE.Vector3, THREE.Vector3] = [
      a.points[7]!.clone(),
      a.points[13]!.clone(),
    ];
    if (right) targets[0] = a.root.worldToLocal(right.clone());
    if (left) targets[1] = a.root.worldToLocal(left.clone());
    a.pose(t, mode, targets,undefined,speed);
  }
  private hand(a: Actor, side = 0): THREE.Vector3 {
    a.root.updateMatrixWorld(true);
    return a.root.localToWorld(a.points[side === 0 ? 7 : 13]!.clone());
  }
  private horse(
    x: number,
    z: number,
    color = BLUE,
    name = "rider",
    marker = "",
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
        leg.position.set(xx, 0.45, zz);
        root.add(leg);
        legs.push(leg);
      }
    const rider = this.actor(name, 0, 0, color,marker);
    root.add(rider.root);
    rider.root.position.set(-0.06, 1.4, 0);
    rider.pose(0, "ride");
    return { root, rider, legs };
  }
  private horseStep(h:{rider:Actor;legs:THREE.Group[]},distance:number,speed=.9):void {h.rider.pose(distance/speed,"ride");h.legs.forEach((leg,i)=>leg.rotation.z=Math.sin(distance/speed/this.film.performance.horsePeriod*Math.PI*2+i*Math.PI)*.25);}
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
        const spoke=primitive({type:"box",width:.64,height:.09,depth:.05},"#8d7b5b");wheel.add(spoke);
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
    _to = 5,
  ): void {
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i]!;
      a.root.position.x = from+t*speed-i*.65;
      a.pose(t + i * 0.18, "walk",undefined,undefined,speed);
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
    if (id === "cart") {
      const cart=this.cart(),pushers=[this.actor("pusher",-2.3,-.43),this.actor("pusher",-2.3,.43)];
      const infantry=Array.from({length:8},(_,i)=>this.actor("infantry",-4-i*.6,1.1+(i%2)*.5));
      const loader=this.actor("loading soldier",-4.4,-1.4,BLUE,"",Math.PI);this.musket(loader);
      const passer=this.actor("passing infantry",-4.6,-1.8);
      const rear=this.actor("rear guard",-5.1,-.7,BLUE,"",Math.PI);
      const ramrod=this.cylinder(.008,.62,0,0,0,"#b2b4aa");loader.root.add(ramrod);ramrod.rotation.z=1.2-Math.PI/2;
      const cartridge=this.box(.055,.13,.045,.2,.55,.25,"#ddd0ad");loader.root.add(cartridge);
      this.evaluate=t=>{
        const pull=ease((t-2.4)/1.5);this.view(-1.8+pull*7.8,2.8+pull*2,3.3+pull*5.7,-4.2+pull*3.9,1.15, -1.4+pull*1.4);
        const push=this.phase(shot,"push",t);const move=push*3+Math.max(0,t-7)*.65;
        cart.root.position.x=move;cart.wheels.forEach(w=>w.rotation.y=-move/.37);
        pushers.forEach((a,i)=>{a.root.position.set(-2.3+move,.85,i===0?-.43:.43);a.pose(Math.max(0,t-3),"push-walk",[new THREE.Vector3(.5,.13,.025),new THREE.Vector3(.5,.13,-.025)],undefined,t<7? .75:.65);});
        infantry.forEach((a,i)=>{const travel=Math.max(0,t-4)*.68;a.root.position.x=-4-i*.6+travel;a.pose(Math.max(0,t-4)+i*.1,t<4?"stand":"walk",undefined,undefined,.68);});
        loader.root.position.x=-4.4+Math.min(t,2.5)*.22+Math.max(0,t-2.5)*.65;loader.root.rotation.y=t<2.5?Math.PI:0;const jostle=this.phase(shot,"cartridge-jostle",t);
        loader.pose(t,t<2.5?"load-walk":"carry-walk",[new THREE.Vector3(t<.5? .4:.2,t<.5? 1.07-Math.sin(t*10)*.1:.55-ease(jostle)*.2,t<.5? .02:.25),new THREE.Vector3(.12,.35,-.03)],undefined,t<2.5?-.22:.65);
        passer.root.position.x=loader.root.position.x-.2+(t-.9)*.5;passer.pose(t,"walk",undefined,undefined,.72);
        ramrod.visible=t<.65;ramrod.position.set(.38,1.04-Math.sin(t*10)*.1,.02);
        const leave=shot.duration-3;rear.root.position.x=-5.1+Math.max(0,t-leave)*.7;rear.root.rotation.y=t<leave?Math.PI:0;rear.pose(Math.max(0,t-leave),t<leave?"aim":"walk",undefined,undefined,.7);
      };return;
    }
    if(id==="columns"){
      const cart=this.cart(0,0);cart.root.rotation.y=Math.PI/2;
      const halted=Array.from({length:10},(_,i)=>this.actor("Allied infantry",-3-i*.65,.6+(i%2)*.6,RED));
      const other=Array.from({length:5},(_,i)=>this.actor("other column",.5,-3-i*.7,RED,"",-Math.PI/2));
      const horse=this.horse(-1.6,2,RED);const officer=this.named("Officer with orders",-1.6,2,"",0,RED);
      const lifters=[this.actor("wheel lifter",-.55,-1.25,RED,"",-Math.PI/2),this.actor("wheel lifter",.55,-1.25,RED,"",-Math.PI/2)];
      this.evaluate=t=>{
        this.view(7,5.1,9,0,1,0);const dismount=this.phase(shot,"dismount",t),lift=this.phase(shot,"wheel-lift",t);const height=Math.sin(Math.PI*lift)*.25;cart.root.position.y=height;cart.root.position.z=-Math.max(0,t-6)*.65;
        horse.rider.root.visible=dismount<.5;officer.root.visible=dismount>=.5;officer.root.position.set(-1.6+ease((t-2)/2)*1.2,.85,2-ease((t-4)/2)*1.0);officer.pose(t,t<2?"stand":"walk");officer.lookAt(new THREE.Vector3(.5,1,-2));
        halted.forEach((a,i)=>{const distance=Math.min(t,1.8)*.6+Math.max(0,t-6)*.6;a.root.position.x=-3-i*.65+distance;a.pose(t,t>1.8&&t<6?"stand":"walk",undefined,undefined,.6);});
        other.forEach((a,i)=>{a.root.position.z=-3-i*.7+Math.min(t,1.5)*.6;a.pose(t,t>1.5?"stand":"walk");});
        lifters.forEach((a,i)=>{a.root.position.set(i===0?-.68:.68,.45,-1.05+cart.root.position.z);const point=new THREE.Vector3(i===0?-.68:.68,.37+height,-.55+cart.root.position.z);this.hands(a,Math.max(0,t-6),t>6?"press-walk":"press",point.clone().add(new THREE.Vector3(.035,0,0)),point.clone().add(new THREE.Vector3(-.035,0,0)),t>6?-.65:0);});
      };return;
    }
    if(id==="fork"){
      const branch=this.box(8,.004,1.6,2,-.002,2,"#81775f");branch.rotation.y=-.65;this.box(2,2.8,2,-5,1.4,-4,"#4a4341");
      const asking=this.actor("questioning soldier",-1.3,0),following=this.actor("following soldier",-2.1,.05),ahead=this.actor("soldier ahead",-.1,0);
      const crowd=Array.from({length:8},(_,i)=>this.actor("marcher",-3.1-i*.6,(i%2)*.65-.3));
      this.evaluate=t=>{
        this.view(6,3.6,8,0,1,0);const push=this.phase(shot,"crowd-push",t);asking.root.position.x=-1.3+Math.min(t,1.3)*.4+Math.max(0,t-4)*.65;asking.root.position.z=push*.35;
        asking.pose(t,t<1.3||t>4?"walk":"stand",undefined,undefined,.65);asking.lookAt(t<4?new THREE.Vector3(2,.7,2):new THREE.Vector3(4,1,0));
        following.root.position.x=asking.root.position.x-(t<4? .8:.4);following.root.position.z=asking.root.position.z;if(t>=4){following.pose(t,"push-walk",[new THREE.Vector3(.42,.57,.12),new THREE.Vector3(.42,.57,-.12)]);}else following.pose(t,"walk");following.lookAt(ahead.root.position.clone().add(new THREE.Vector3(0,.8,0)));
        ahead.root.position.x=-.1+t*.65;ahead.pose(t,"walk");crowd.forEach((a,i)=>{a.root.position.x=-3.1-i*.6+t*.65;a.pose(t+i*.12,"walk");});
      };return;
    }
    if(["descent","ascent","march","raygern"].includes(id)){
      const allied=id==="ascent";const soldiers=Array.from({length:12},(_,i)=>this.actor("marcher",-4-i*.65,(i%3-1)*.7,allied?RED:BLUE));
      const blocked=id==="raygern"?Array.from({length:4},(_,i)=>this.actor("leading ranks",-1+i*.65,(i%2)*.7)):[];
      const surface=id==="descent"||id==="ascent"?this.slope(18,4,0,.8,0,"x",Math.atan(.13)):()=>0;
      if(id==="raygern")this.label("Friant's leading men",0,2.6,0);
      this.evaluate=t=>{
        this.view(8,4.8,11,0,1,0);blocked.forEach((a,i)=>{a.root.position.x=-1+i*.65+Math.max(0,t-4.5)*.9;a.pose(Math.max(0,t-4.5),t<4.5?"stand":"walk",undefined,undefined,.9);});let travel=t*.65;if(id==="raygern")travel=(Math.min(t,3)+Math.max(0,t-5))*.65;
        soldiers.forEach((a,i)=>{
          const backwards=id==="descent";a.root.position.x=backwards? 3+i*.5-travel:-4-i*.65+travel;a.root.rotation.y=backwards?Math.PI:0;a.root.position.y=.85+surface(a.root.position.x,a.root.position.z);
          a.pose(travel/.65+i*.18,id==="raygern"&&t>=3&&t<=5?"stand":"walk");if(id==="raygern"&&i===0&&t>3&&t<5){a.root.position.y=.45;a.pose(t,"sit");a.lookAt(new THREE.Vector3(4,1,0));}else a.plant(surface);
        });
      };return;
    }
    if (id === "empty") {
      this.slope(18,4,0,.8,0,"x",Math.atan(.13));
      this.evaluate = (t) => {
        this.view(9 - t * 0.2, 4.3, 11);
      };
      return;
    }
    if(["orders","dictation"].includes(id)){
      this.room();this.table();this.map();const berthier=this.named("Berthier",-1.8,0),napoleon=this.named("Napoleon",1.8,0,"bicorn",Math.PI);napoleon.root.visible=id==="dictation";
      const paper=this.foldingPaper(-1.2,1.2,0),pen=this.box(.23,.02,.02,-1.2,1.22,0,"#242931");
      const bag=this.box(.35,.35,.12,-2,1,.6,"#6d5039"),horse=this.horse(-4,2),messenger=this.actor("messenger",-2.4,.8);
      this.label("French corps · awaiting arrival reports",0,1.45,-.8);
      for(const z of [.8,2])this.box(.15,2.3,.15,-3.2,1.15,z,"#655b4b");this.box(.15,.15,1.35,-3.2,2.3,1.4,"#655b4b");
      this.evaluate=t=>{
        this.view(6.3,4.5,8,-.5,1,0);const fold=this.phase(shot,"fold",t),walking=this.phase(shot,"courier-walk",t),mount=this.phase(shot,"mount",t),depart=this.phase(shot,"depart",t);
        berthier.pose(t,"carry");this.hands(berthier,t,"write",pen.position.clone());berthier.lookAt(t<3?paper.root.position:new THREE.Vector3(0,1.13,0));napoleon.pose(t,"point");
        paper.hinge.rotation.z=fold*Math.PI;pen.visible=id==="dictation";pen.position.x=-1.2+Math.sin(t*12)*.025;
        messenger.root.position.set(-2.4-walking*1.9+mount*.36,.85+mount*.55,.8+walking*1.6-mount*.4);messenger.root.rotation.y=mount>0?Math.PI:2.4;messenger.root.visible=mount<1;messenger.pose(t,mount>0?"ride":walking>0?"carry-walk":"carry");
        horse.root.rotation.y=Math.PI;horse.rider.root.visible=mount>=1;const distance=Math.max(0,t-6)*.9;horse.root.position.x=-4-distance;this.horseStep(horse,distance);
        bag.position.copy(this.hand(mount<1?messenger:horse.rider)).add(new THREE.Vector3(0,-.12,0));
        if(depart>0)berthier.lookAt(new THREE.Vector3(0,1.13,0));
      };return;
    }
    if(["arrival","petition","paper","writing"].includes(id)){
      this.room();this.table();this.map(0,-.08);
      const murat=this.named("Murat · French marshal",-2,-1,"feather"),soult=this.named("Soult · French marshal",1.65,.45,"",Math.PI),lannes=this.named("Lannes · French marshal",-.5,1.15,"",Math.PI/2);
      const paper=this.paper(1.1,1.145,.6),pen=this.box(.25,.018,.018,-.5,1.17,.65,"#282e38");
      for(const z of [-1.55,-.45])this.box(.16,2.3,.16,-3.4,1.15,z,"#655b4b");this.box(.16,.18,1.3,-3.4,2.3,-1,"#655b4b");
      this.evaluate=t=>{
        this.view(6,4,7,0,1,0);const u=this.storyTime(shot,"arrival",t);const enter=clamp(u/3),approach=clamp((u-1.7)/3),arrive=clamp((u-3.2)/2.8);
        murat.root.position.set(-4.7+enter*2.7,.85,-1);murat.pose(u,u<3?"walk":"point",undefined,undefined,.9);if(murat.feather)murat.feather.rotation.z=-.15+Math.pow(Math.max(0,Math.cos(Math.min(Math.PI/2,Math.abs(murat.root.position.x+3.4)/.55*Math.PI/2))),2)*1.3;
        soult.root.position.set(3-approach*1.35,.85,.45);soult.pose(Math.max(0,u-1.7),u>=1.7&&u<4.7?"walk":"point",undefined,undefined,.45);lannes.root.position.set(-.5,.85,3-arrive*1.85);lannes.pose(Math.max(0,u-3.2),u>=3.2&&u<6?"walk":id==="writing"?"write":"stand",undefined,undefined,1.85/2.8);
        lannes.lookAt(id==="petition"?murat.root.position.clone().add(new THREE.Vector3(0,.85,0)):new THREE.Vector3(0,1.13,0));soult.lookAt(new THREE.Vector3(0,1.13,0));murat.lookAt(lannes.root.position.clone().add(new THREE.Vector3(0,.85,0)));
        const slide=id==="paper"?this.phase(shot,"paper-slide",t):id==="writing"? 1:0;paper.position.x=1.1-slide*1.6;pen.position.x=-.5+Math.sin(t*12)*.025;pen.visible=id==="writing";
        if(id==="writing")this.hands(lannes,t,"write",pen.position.clone(),new THREE.Vector3(-.65,1.14,.72));
        if(id==="paper"&&slide<.13)this.hands(soult,t,"write",new THREE.Vector3(1.1,1.16,.6));
      };return;
    }
    if (
      ["delivery", "boast", "challenge", "withdraw", "departures"].includes(id)
    ) {
      this.room();
      this.table(0, -0.6);this.map(0,-.6);
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
        murat.pose(t, "stand");napoleon.lookAt(id==="delivery"?letter.position:soult.root.position.clone().add(new THREE.Vector3(0,.8,0)));lannes.lookAt(soult.root.position.clone().add(new THREE.Vector3(0,.8,0)));soult.lookAt(napoleon.root.position.clone().add(new THREE.Vector3(0,.8,0)));
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
    if(id==="conference"){
      this.room();this.table();this.map();const w=this.named("Weyrother",-1.9,0,"",0,RED),alex=this.named("Alexander · Emperor of Russia",1.9,-1.1,"",Math.PI,RED),kut=this.named("Kutuzov · Russian commander",1.9,1.2,"",Math.PI,RED);
      this.box(.65,.1,.65,1.9,.59,-1.1,"#6c5b48");this.box(.65,.1,.65,1.9,.39,1.2,"#6c5b48");this.box(.14,.54,.14,1.9,.27,-1.1,"#6c5b48");this.box(.14,.34,.14,1.9,.17,1.2,"#6c5b48");
      const route=[new THREE.Vector3(-.65,1.16,-.35),new THREE.Vector3(-.15,1.16,-.35),new THREE.Vector3(.15,1.16,.3),new THREE.Vector3(.7,1.16,.3)];
      for(let i=1;i<route.length;i++){const segment=this.cylinder(.018,1,0,0,0,RED);rod(segment,route[i-1]!,route[i]!);}
      this.label("Road to Vienna",.8,1.46,.3);const pointer=this.cylinder(.012,1,0,0,0,"#302e29");const papers=[this.foldingPaper(1.5,1.13,-1.1),this.foldingPaper(1.5,1.13,1.2)];
      this.evaluate=t=>{
        this.view(5.8,4.3,7);w.pose(t,"point");const progress=this.phase(shot,"route",t)*(route.length-1);const index=Math.min(route.length-2,Math.floor(progress));const tip=route[index]!.clone().lerp(route[index+1]!,progress-index);rod(pointer,this.hand(w),tip);w.lookAt(tip);
        const exit=this.phase(shot,"fold-exit",t);alex.root.position.set(1.9+exit*3,.65+exit*.2,-1.1-exit*1.8);kut.root.position.set(1.9-exit*3.5,.45+exit*.4,1.2+exit*1.4);
        for(const[a,i,height]of[[alex,0,.65],[kut,1,.45]] as const){if(exit===0){a.pose(t,"sit",undefined,[new THREE.Vector3(.55,-height,.24),new THREE.Vector3(.55,-height,-.24)]);a.lookAt(new THREE.Vector3(0,1.15,0));}else{a.root.rotation.y=a===alex? .5:2.7;a.pose(t,"carry-walk");}const sheet=papers[i]!;sheet.hinge.rotation.z=Math.min(1,exit*3)*Math.PI;sheet.root.position.copy(this.hand(a));}
      };return;
    }
    if(["mail","wine","sleep"].includes(id)){
      this.room();this.table(-2);const a=this.actor("staff officer",-3.4,0),b=this.actor("staff officer",-1,1.1);const paper=this.paper(-2.8,1.35,0),cask=this.cylinder(.4,.8,1,.4,0,"#665039"),straw=this.cylinder(.018,1,0,0,0,"#d9caa0");
      for(let i=0;i<12;i++){const strand=this.box(1.3,.018,.05,2+(i%4)*.2,.04,-1+Math.floor(i/4)*.45,"#b6a56d");strand.rotation.y=i*.9;}
      const cheer=this.actor("soldier",4,-2);this.box(1.8,2.8,.15,4,1.4,-2.6,"#a88f54");const doorway=new THREE.PointLight("#ffd698",3,7);doorway.position.set(4,1.6,-1.8);this.group.add(doorway);
      this.evaluate=t=>{
        this.view(id==="wine"? 5:7,id==="wine"? 3.1:4.5,id==="wine"? 6:8);
        a.root.position.set(-3.4,.85,0);b.root.position.set(-1,.85,1.1);a.root.rotation.z=0;b.root.rotation.z=0;a.shadow.visible=true;b.shadow.visible=true;a.pose(t,"carry");b.pose(t,"carry");
        paper.position.set(-2.8,1.35,0);paper.rotation.z=-.2;this.hands(a,t,"carry",paper.position.clone());a.lookAt(paper.position);
        if(id==="wine"){b.root.position.set(.35,.85,.15);b.root.rotation.y=0;b.pose(t,"carry");b.lookAt(new THREE.Vector3(1,.8,0));const mouth=b.root.localToWorld(new THREE.Vector3(.14,.88,.0));rod(straw,new THREE.Vector3(1,.78,0),mouth);this.hands(b,t,"carry",mouth.clone().lerp(new THREE.Vector3(1,.78,0),.4));}
        if(id==="sleep"){const awake=this.phase(shot,"wake",t),awake2=ease((t-2)/1.2);a.root.position.set(1,.18+awake*.27,-.5);a.root.rotation.z=(1-awake)*Math.PI/2;a.pose(t,awake===0?"stand":"sit");b.root.position.set(2,.18+awake2*.27,.7);b.root.rotation.z=(1-awake2)*Math.PI/2;b.pose(t,awake2===0?"stand":"sit");a.shadow.visible=false;b.shadow.visible=false;paper.visible=false;doorway.intensity=2.5+Math.sin(t*11)*.7;a.lookAt(new THREE.Vector3(4,1.6,-2));b.lookAt(new THREE.Vector3(4,1.6,-2));}
        cheer.pose(t,id==="sleep"&&t>=1.35?"cheer":"stand");cask.visible=id!=="sleep";straw.visible=id==="wine";
      };return;
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
    if(["village","davout","return-fire","ammunition"].includes(id)){
      this.box(14,.025,1,0,.02,-2.5,"#728e9b");this.box(3,1.1,.25,-.4,.55,-.3,"#b3b29f");this.box(3,1.1,.25,-.4,2.2,-.3,"#b3b29f");for(const x of [-1.7,.9])this.box(.4,1,.25,x,1.5,-.3,"#b3b29f");
      const shooter=this.actor("window defender",-.5,.5,BLUE,"",Math.PI/2),supplier=this.actor("ammunition bearer",.6,.5,BLUE,"",Math.PI);const ammo=this.box(.06,.13,.04,.05,1.2,.5,"#e0d0ac");
      const davout=this.named("Davout",-3,2,"glasses"),friant=this.named("Friant",-4,1.4);
      const arriving=Array.from({length:6},(_,i)=>this.actor("leading men",-5-i*.65,1.5+Math.floor(i/3)*.65));
      const attackers=Array.from({length:5},(_,i)=>this.actor("attacker",-2+i,-4,RED,"",-Math.PI/2));
      this.evaluate=t=>{
        this.view(id==="ammunition"? 3.6:6,id==="ammunition"? 2.5:4.4,id==="ammunition"? 4.2:8,0,1,0);
        const u=this.storyTime(shot,"village",t),now=shot.start+t;const reload=this.film.events.some(e=>e.shot===id&&e.action==="reload"&&now>=e.start&&now<e.start+e.duration);
        shooter.pose(t,reload?"reload":"aim");supplier.pose(t,"carry");
        const transaction=id==="village"||id==="ammunition";ammo.visible=transaction;
        if(transaction){const q=this.phase(shot,"ammo",t);ammo.visible=q<1;const source=new THREE.Vector3(.05,1.2,.5),destination=new THREE.Vector3(-.5,1.73,.12);ammo.position.copy(source).lerp(destination,q);
          if(q<.35)this.hands(supplier,t,"carry",ammo.position.clone());else if(q<1)this.hands(shooter,t,"reload",ammo.position.clone(),shooter.root.localToWorld(new THREE.Vector3(.15,.3,-.06)));
          if(q===0&&t>.4){shooter.pose(t,"reload",[new THREE.Vector3(.12,.16,.18),new THREE.Vector3(.15,.3,-.06)]);}
        }
        davout.root.visible=id==="davout";friant.root.visible=id==="davout";davout.pose(t,"point");davout.lookAt(t<3?new THREE.Vector3(-.5,1.4,-.3):new THREE.Vector3(-4,1.5,1.5));friant.root.position.x=-4+Math.min(t,4)*.5;friant.pose(t,"walk");
        arriving.forEach((a,i)=>{a.root.visible=u>=9;const target=-1.1+(i%3)*.5;const x=Math.min(target,-5-i*.65+Math.max(0,u-9)*.65);a.root.position.x=x;a.root.rotation.y=x===target?Math.PI/2:0;a.pose(Math.max(0,u-9)+i*.1,x===target?(reload?"reload":"aim"):"walk");});
        attackers.forEach((a,i)=>{a.root.position.z=-4+Math.min(u,12)*.1;a.pose(t,reload?"reload":"aim");});
      };return;
    }
    if(id==="center"){
      const height=this.slope(10,8,2,.8,-3,"z",Math.atan(.18));const n=this.named("Napoleon",-2,3,"bicorn",.98),s=this.named("Soult",-.3,3,"",Math.PI);
      const allies=Array.from({length:8},(_,i)=>this.actor("Allied descent",2+(i%4)*.65,-5-Math.floor(i/4)*.65,RED,"",-Math.PI/2));
      this.evaluate=t=>{
        this.view(7,5.2,11,0,1,-1);n.pose(t,"point");n.lookAt(new THREE.Vector3(2,1.7,-3));s.pose(t,"stand");s.lookAt(n.root.position.clone().add(new THREE.Vector3(0,.8,0)));
        allies.forEach((a,i)=>{a.root.position.z=-5-Math.floor(i/4)*.65+t*.4;a.root.position.y=.85+height(a.root.position.x,a.root.position.z);a.pose(t+i*.12,"walk",undefined,undefined,.4);a.plant(height);});
      };return;
    }
    if(["climb","counterattack"].includes(id)){
      const surface=this.slope(17,7,0,.8,0,"x",Math.atan(.16));
      const french=Array.from({length:10},(_,i)=>this.actor("French infantry",-5+(i%5)*.5,Math.floor(i/5)*.9));
      const enemy=Array.from({length:7},(_,i)=>this.actor("counterattack",5+(i%4)*.5,-1+Math.floor(i/4),RED,"",Math.PI));
      const ball=primitive({type:"sphere",radius:.11},"#30383c");this.group.add(ball);
      this.evaluate=t=>{
        this.view(7,5.5,12,0,1.6,0);const u=this.storyTime(shot,"climb",t),now=shot.start+t;
        const reload=this.film.events.some(e=>e.shot===id&&e.action==="reload"&&now>=e.start&&now<e.start+e.duration);
        const first=this.film.shots.find(s=>s.id==="climb")!.duration;
        french.forEach((a,i)=>{
          const base=-5+(i%5)*.5;const up=Math.min(u,first)*.52;const counter=Math.max(0,u-first);
          const pressure=counter<4?-counter*.3:-1.2+(counter-4)*.5;
          a.root.position.set(base+up+pressure,.85,Math.floor(i/5)*.9+(i%2? 1:-1)*ease((u-3)/2)*.65);
          a.root.position.y+=surface(a.root.position.x,a.root.position.z);a.root.rotation.z=0;a.shadow.visible=true;
          const mode=id==="climb"?(t>2&&t<4?"duck-walk":reload?"reload-walk":"aim-walk"):(reload?"reload-walk":"aim-walk");
          a.pose(u+i*.1,mode,undefined,undefined,id==="climb"? .52:t<4?-.3:.5);a.plant(surface);
        });
        enemy.forEach((a,i)=>{const counter=Math.max(0,u-first);a.root.position.x=5+(i%4)*.5-Math.min(counter,4)*.6+Math.max(0,counter-4)*.42;a.root.position.y=.85+surface(a.root.position.x,a.root.position.z);a.pose(u+i*.1,reload?"reload-walk":"aim-walk",undefined,undefined,counter<4? .6:-.42);a.plant(surface);});
        ball.visible=false;
        if(id==="counterattack"){
          const hit=this.film.events.find(e=>e.shot===id&&e.action==="cannon-hit")!.start-shot.start;
          const a=french[3]!,origin={x:-5+1.5+first*.52-.9,y:0,z:.7};origin.y=surface(origin.x,origin.z)+.85;
          const flight=t-hit,land=(3.52+Math.sqrt(3.52**2+4*4.905*.7))/(2*4.905);
          if(flight>=0){const state=projectileAt({origin,velocity:{x:3,y:4,z:1.2},gravity:{x:0,y:-9.81,z:0}},Math.min(flight,land));a.root.position.set(state.position.x,state.position.y,state.position.z);a.root.rotation.z=ease(flight/land)*(-Math.PI/2+Math.atan(.16));a.shadow.visible=false;}
          ball.visible=t>=hit-.3&&t<hit;const projectile=projectileAt({origin:{x:origin.x-7.5,y:origin.y,z:origin.z},velocity:{x:25,y:0,z:0},gravity:{x:0,y:0,z:0}},Math.max(0,t-hit+.3));ball.position.set(projectile.position.x,projectile.position.y,projectile.position.z);
        }
      };return;
    }
    if (id === "north") {
      const infantry = Array.from({ length: 12 }, (_, i) =>
        this.actor("Lannes infantry", -2.2 + Math.floor(i / 4) * .65, .4 + (i % 4) * .7),
      );
      const lannes = infantry[0]!;
      lannes.tag = this.label("Lannes · infantry", 0, 1.45, 0);
      lannes.root.add(lannes.tag);
      const enemy = Array.from({ length: 8 }, (_, i) =>
        this.actor("Allied infantry", 4.3 + Math.floor(i / 4) * .65, .4 + (i % 4) * .7, RED, "", Math.PI),
      );
      const french = Array.from({ length: 3 }, (_, i) =>
        this.horse(-5.2 - i * 2.05, -1.35, BLUE, i === 0 ? "Murat" : "French cavalry", i === 0 ? "feather" : ""),
      );
      french[0]!.rider.tag = this.label("Murat · cavalry", 0, 1.45, 0);
      french[0]!.rider.root.add(french[0]!.rider.tag!);
      const allied = Array.from({ length: 3 }, (_, i) =>
        this.horse(5.2 + i * 2.05, -1.35, RED, i === 0 ? "Liechtenstein cavalry" : "Allied cavalry"),
      );
      allied[0]!.rider.tag = this.label("Liechtenstein", 0, 1.45, 0);
      allied[0]!.rider.root.add(allied[0]!.rider.tag!);
      this.evaluate = t => {
        this.view(7.5, 6.7, 11.5, -.2, 1, -.1);
        infantry.forEach(a => { a.pose(t, "aim"); a.lookAt(new THREE.Vector3(5, 1.5, a.root.position.z)); });
        enemy.forEach(a => { a.pose(t, "aim"); a.lookAt(new THREE.Vector3(-2, 1.5, a.root.position.z)); });
        const approach = ease(t / 5) * 4.2;
        // Both fronts meet at a two-metre horse-root gap; neither rides through its opponent.
        const recoil = .16 * Math.sin(Math.max(0, t - 5) * 2.2) ** 2;
        french.forEach((h, i) => {
          const distance = approach - recoil;
          h.root.position.set(-5.2 - i * 2.05 + distance, 0, -1.35);
          h.root.rotation.y = 0;
          this.horseStep(h, distance);
        });
        allied.forEach((h, i) => {
          const distance = approach - recoil;
          h.root.position.set(5.2 + i * 2.05 - distance, 0, -1.35);
          h.root.rotation.y = Math.PI;
          this.horseStep(h, distance);
        });
      };
      return;
    }
    if (id === "guard") {
      // Two closed square perimeters leave a 2.4 m corridor between their inward faces.
      const squares: { actor: Actor; inward: boolean }[] = [];
      for (const centerZ of [-2.7, 2.7]) {
        for (let side = 0; side < 4; side++) {
          for (let slot = 0; slot < 5; slot++) {
            const along = -2 + slot;
            const x = side < 2 ? along : side === 2 ? -2 : 2;
            const z = side < 2 ? centerZ + (side === 0 ? -1.5 : 1.5) : centerZ - 1.5 + slot * .75;
            // Each corner belongs to one horizontal edge, rather than duplicate figures.
            if (side >= 2 && (slot === 0 || slot === 4)) continue;
            const inward = centerZ < 0 ? side === 1 : side === 0;
            const facing = side === 0 ? Math.PI / 2 : side === 1 ? -Math.PI / 2 : side === 2 ? Math.PI : 0;
            squares.push({ actor: this.actor("French reserve infantry", x, z, BLUE, "", facing), inward });
          }
        }
      }
      const french = [
        this.horse(-3.2, -.42, BLUE, "Rapp", "hair"),
        this.horse(-5.25, -.42, BLUE, "French Guard cavalry"),
      ];
      french[0]!.rider.tag = this.label("Rapp", 0, 1.45, 0);
      french[0]!.rider.root.add(french[0]!.rider.tag!);
      const russian = [
        this.horse(4.8, -.42, RED, "Russian Guard cavalry"),
        this.horse(6.85, -.42, RED, "Russian Guard cavalry"),
        this.horse(5.7, .42, RED, "Russian Guard cavalry"),
      ];
      const reinforcing = [
        this.horse(-6.4, .42, BLUE, "French Guard reinforcement"),
        this.horse(-8.45, .42, BLUE, "French Guard reinforcement"),
      ];
      this.evaluate = t => {
        this.view(9.6, 10.8, 13, -.2, .8, 0);
        const open = this.phase(shot, "path-opens", t);
        const contact = this.phase(shot, "contact", t);
        const reinforcement = this.phase(shot, "reinforce", t);
        squares.forEach(({ actor, inward }) => {
          // The inward muskets physically occupy the corridor until their bearers lower them.
          actor.pose(t, inward && open >= .5 ? "stand" : "aim");
        });
        // Rapp waits for the musket lane, advances into contact, then yields under pressure.
        const advance = 2.3 * ease((t - 3.5) / 1.5);
        // Pressure continues while reinforcements enter, slowing to zero only when they join.
        const retreat = 1.2 * ease((t - 5) / 2) + .6 * (reinforcement - reinforcement * reinforcement / 2);
        french.forEach((h, i) => {
          const distance = advance - retreat;
          h.root.position.set(-3.2 - i * 2.05 + distance, 0, -.42);
          h.root.rotation.y = 0;
          this.horseStep(h, distance);
        });
        russian.forEach((h, i) => {
          const lane = i === 2 ? .42 : -.42;
          const trailing = i === 1 ? 2.05 : 0;
          const distance = 3.7 * ease(t / 5) + retreat;
          h.root.position.set(4.8 + trailing - distance, 0, lane);
          h.root.rotation.y = Math.PI;
          this.horseStep(h, distance);
        });
        reinforcing.forEach((h, i) => {
          const distance = 4 * ease(reinforcement);
          h.root.position.set(-6.4 - i * 2.05 + distance, 0, .42);
          h.root.rotation.y = 0;
          this.horseStep(h, distance);
        });
        french[0]!.rider.lookAt(new THREE.Vector3(contact > 0 ? 1 : -1, 2.1, -.42));
      };
      return;
    }
    if (id === "tangle") {
      // The late order belongs to the Allied retreat, including every waiting horse and rank.
      const front = Array.from({ length: 8 }, (_, i) =>
        this.actor("Allied retreating infantry", 1 + Math.floor(i / 3) * .65, (i % 3 - 1) * .65, RED),
      );
      const rear = Array.from({ length: 8 }, (_, i) =>
        this.actor("Allied halted infantry", -6.2 - Math.floor(i / 3) * .65, (i % 3 - 1) * .65, RED),
      );
      const horses = [this.horse(-3, -.55, RED, "Allied cavalry"), this.horse(-5.1, .55, RED, "Allied cavalry")];
      const orderly = this.horse(6, 2.5, RED, "Allied orderly");
      orderly.rider.tag = this.label("Withdrawal order", 0, 1.45, 0);
      orderly.rider.root.add(orderly.rider.tag);
      const officer = this.named("Allied officer", 1.05, 3.35, "", 0, RED);
      const order = this.paper(0, 0, 0);
      this.box(15, .008, .13, -.2, .002, -1.8, "#5d645b");
      this.box(15, .008, .13, -.2, .002, 1.8, "#5d645b");
      this.evaluate = t => {
        this.view(7.5, 6.8, 11.5, -.7, 1, .1);
        const late = this.phase(shot, "late-order", t);
        const turn = this.phase(shot, "turn", t);
        orderly.root.position.set(6 - 4.1 * ease(t / 2), 0, 2.5);
        orderly.root.rotation.y = Math.PI;
        this.horseStep(orderly, 4.1 * ease(t / 2));
        officer.pose(t, late > .5 ? "point" : "stand");
        // Both arms reach the same world-space exchange, outside the horse's body.
        if (late > 0) {
          const exchange = new THREE.Vector3(1.5, 1.65, 2.95);
          if (late < .65) this.hands(orderly.rider, t, "ride", undefined, exchange);
          this.hands(officer, t, "stand", late > .5 ? new THREE.Vector3(.5, 1.44, 3.15) : undefined, exchange);
        }
        officer.lookAt(late > .5 ? new THREE.Vector3(-3, 1.3, 0) : new THREE.Vector3(1.9, 2.1, 2.5));
        order.position.copy(this.hand(late >= .5 ? officer : orderly.rider, 1));
        front.forEach((a, i) => {
          a.root.position.x = 1 + Math.floor(i / 3) * .65 + Math.min(t, 2) * .2;
          a.root.rotation.y = ease(turn) * Math.PI;
          a.pose(Math.min(t, 2), t < 2 ? "walk" : "stand", undefined, undefined, .2);
        });
        rear.forEach((a, i) => {
          a.root.position.x = -6.2 - Math.floor(i / 3) * .65 + Math.min(t, 3) * .24;
          a.pose(Math.min(t, 3), t < 3 ? "walk" : "stand", undefined, undefined, .24);
        });
        horses.forEach((h, i) => {
          const advance = 2.05 * ease(t / 3);
          const blocked = .18 * ease(Math.max(0, t - 5));
          h.root.position.set(-3 - i * 2.1 + advance - blocked, 0, i === 0 ? -.55 : .55);
          h.root.rotation.y = ease(turn) * Math.PI;
          this.horseStep(h, advance - blocked);
        });
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
      const water = this.box(10, .025, 7, 0, .005, -4, "#7e9ba4");
      const ice = this.box(5, .04, 3, 0, .04, -2, "#bccbd0");
      // The dry route is visibly narrow; ranks behind cannot spread into the water.
      this.box(.85, .07, 6, 2.8, .005, 1.65, "#a69b80");
      const queue = Array.from({ length: 8 }, (_, i) =>
        this.actor("Allied retreating troop", 0, 1 + i * .8, RED, "", Math.PI / 2),
      );
      this.evaluate = t => {
        this.view(7.2, 7.8, 10, .65, .55, -.3);
        const contact = this.phase(shot, "ice-contact", t);
        const rise = this.phase(shot, "water-rise", t);
        const reroute = this.phase(shot, "reroute", t);
        ice.rotation.x = .04 * ease(contact);
        ice.position.y = .04 - .035 * ease(contact);
        water.position.y = .005 + .035 * ease(rise);
        ice.updateMatrixWorld(true);
        const edge = ice.localToWorld(new THREE.Vector3(.12, .02, 1.5));
        const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(ice.quaternion);
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, edge);
        const surface = (x: number, z: number): number =>
          Math.abs(x) <= 2.5 && z <= edge.z + .002
            ? (-plane.constant - normal.x * x - normal.z * z) / normal.y
            : x >= 2.375 && x <= 3.225 ? .04 : 0;
        queue.forEach((a, i) => {
          const approach = Math.min(t, 3) * .45;
          const follow = i === 0 ? ease(reroute) : i === 1 ? ease((t - 6) / 3) : 0;
          const originZ = 1 + i * .8 - approach;
          a.root.position.set(follow * 2.8, .85, originZ + (1.25 - originZ) * follow);
          a.root.rotation.y = Math.PI / 2 - follow * (Math.PI / 2 + .35);
          if (i === 0 && t >= 3 && t <= 5) {
            // The leading foot touches the actual nearest edge before that same plane bends.
            a.root.position.y = .85 + Math.min(0, edge.y) * .5;
            a.root.updateMatrixWorld(true);
            const front = a.root.worldToLocal(edge.clone());
            const back = a.root.worldToLocal(new THREE.Vector3(-.12, 0, -.28));
            a.pose(t, "stand", undefined, [front, back]);
          } else {
            const moving = t < 3 || (i < 2 && follow > 0 && follow < 1);
            a.root.position.y = .85 + surface(a.root.position.x, a.root.position.z);
            a.pose(t, moving ? "walk" : "stand", undefined, undefined, t < 3 ? .45 : .65);
            a.plant(surface);
          }
          a.lookAt(i === 0 && t >= 3 && t <= 5 ? edge : new THREE.Vector3(2.8, 1, 2));
        });
      };
      return;
    }
    if(["cheers","bowl","separate","straw"].includes(id)){
      for(let i=0;i<18;i++){const straw=this.box(1.4,.018,.045,(i%6)*.38-1,.05,Math.floor(i/6)*.5,"#a39161");straw.rotation.y=i*.8;}
      const seated=this.actor("soldier",0,0),friend=this.actor("friend",2,1.1,BLUE,"",Math.PI);
      const bowl=this.cylinder(.17,.1,.35,.5,.25,"#bca47e");
      const crowd=Array.from({length:6},(_,i)=>this.actor("cheering soldier",-4+(i%3)*.8,-2+Math.floor(i/3)*.7));
      const lannes=this.named("Lannes",-4,1.7),soult=this.named("Soult",4,1.7);
      const carriers=[this.actor("carrier",-4.5,3),this.actor("carrier",-1.5,3,BLUE,"",Math.PI)];
      const stretcher=this.box(2.2,.08,.7,-3,1.1,3,"#776b52"),wounded=this.actor("wounded",-3,3);wounded.shadow.visible=false;
      this.evaluate=t=>{
        const u=this.storyTime(shot,"cheers",t),close=id==="straw"||id==="bowl";
        this.view(close? 2.8:7,close? 2.1:4.8,close? 3.2:10,close? .4:0,close? .45:1,0);
        seated.root.position.y=.45;seated.pose(u,"sit");seated.lookAt(new THREE.Vector3(.25,.1,.65));
        const approach=clamp((u-8)/3),take=clamp((u-11)/3);
        friend.root.position.set(2-approach*1.35,.85-approach*.4,.8);friend.root.rotation.y=Math.PI;
        friend.pose(Math.max(0,u-8),approach<1?"walk":"sit",undefined,undefined,.45);friend.lookAt(u<11?new THREE.Vector3(.25,.1,.65):seated.root.position.clone().add(new THREE.Vector3(0,.7,0)));
        bowl.position.set(.35+take*.1,.5-take*.39,.25);
        if(u<11)this.hands(seated,u,"sit",bowl.position.clone());
        else if(take<1)this.hands(friend,u,"press",bowl.position.clone());
        seated.lookAt(new THREE.Vector3(.25,.1,.65));friend.lookAt(u<11?new THREE.Vector3(.25,.1,.65):bowl.position);
        crowd.forEach(a=>a.pose(u,id==="cheers"?"cheer":"stand"));lannes.pose(u,"stand");soult.pose(u,"stand");lannes.lookAt(new THREE.Vector3(-6,1.4,2));soult.lookAt(new THREE.Vector3(6,1.4,2));
        carriers.forEach((a,i)=>{a.root.position.x=-4.5+i*3+u*.65;a.pose(u,"carry-walk",undefined,undefined,i===0? .65:-.65);const point=new THREE.Vector3(-4.1+i*2.2+u*.65,1.1,3);this.hands(a,u,"carry-walk",point.clone().add(new THREE.Vector3(0,0,.3)),point.clone().add(new THREE.Vector3(0,0,-.3)),i===0? .65:-.65);});
        stretcher.position.x=-3+u*.65;wounded.root.position.set(-3+u*.65,1.29,3);wounded.root.rotation.z=Math.PI/2;wounded.pose(u,"stand");
        if(id==="straw"){const press=this.phase(shot,"hand-press",t);seated.pose(t,"press",[new THREE.Vector3(.24,-.28-ease(press)*.11,.28),new THREE.Vector3(.2,.03,-.18)]);seated.lookAt(new THREE.Vector3(.24,.06,.28));}
      };return;
    }
    throw new Error(`Unimplemented screenplay stage ${id}`);
  }
}
