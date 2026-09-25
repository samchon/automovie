/**
 * The object roles in the temple inventory, placed in room-local world metres.
 * Each role has a stable identity; repeated prototypes remain separate elements.
 * The local model origin and its support height determine the Y coordinate.
 */
import type { IAutoMovieBuiltElement } from "@automovie/interface";
import { templeLevels as y } from "../spaces/storey";
import { templeSiteGrade } from "../spaces/site/extent";

export interface TempleObjectPlacement {
  role: string;
  space: string;
  prototype: string;
  x: number;
  y: number;
  z: number;
  yaw?: number;
  scale?: number;
}

export class TempleObjectInstances {
  static placements(): TempleObjectPlacement[] {
    const list: TempleObjectPlacement[] = [];
    const put = (space: string, role: string, prototype: string, x: number, yy: number, z: number,
      yaw = 0, scale = 1): void => { list.push({ space, role, prototype, x, y: yy, z, yaw, scale }); };
    const e = "entrance", c = "courtyard", co = "colonnade", s = "sanctuary";
    const o = "offering", a = "administration", r = "records", st = "storage";
    const yard = "service-yard", site = "temple-site";
    // Porch: the bench runs along the narrow west support, clear of the central stair.
    put(e,"waiting-bench","bench",-1.39,0,9.10,Math.PI/2);
    put(e,"portable-lamp","portable-lamp",-1.36,0.46,8.80);
    put(e,"water-vessel","small-vessel",-1.35,0.46,9.18);
    put(e,"washing-bowl","offering-bowl",-1.35,0.45,9.53);
    put(e,"carrying-basket","basket",1.38,0,9.35);
    // Open court: the central basin keeps its own clear ring.
    put(c,"fountain","fountain",0,y.courtyard,2.175);
    put(c,"waterside-bench","bench",-2.55,y.courtyard,2.15,Math.PI/2);
    put(c,"planter","planter",2.65,y.courtyard,0.05);
    put(c,"portable-lamp","portable-lamp",2.75,y.courtyard,5.20);
    put(c,"bucket","bucket",-2.65,y.courtyard,5.15);
    // Colonnade: objects hug the wall and leave the court perimeter walk open.
    put(co,"wall-bench","bench",-4.65,0,3.15,Math.PI/2);
    put(co,"lampstand","lampstand",-4.75,0,7.25);
    put(co,"basket","basket",-4.55,0,4.60);
    put(co,"small-vessel","small-vessel",-4.65,0.46,3.15);
    put(co,"stool","stool",4.65,0,3.40);
    put(co,"votive-plaque","votive-plaque",-5.35,0,0.15);
    // Sanctuary: the aisle from the south door to the altar stays legible.
    put(s,"altar","altar",0,0,-7.15);
    put(s,"niche","niche",0,0,-9.65);
    put(s,"left-lampstand","lampstand",-1.90,0,-7.35);
    put(s,"right-lampstand","lampstand",1.90,0,-7.35);
    put(s,"offering-bowl","offering-bowl",-0.55,1.09,-7.35);
    put(s,"niche-vessel","small-vessel",0,0.75,-9.38);
    put(s,"censer","censer",0.50,1.10,-7.30);
    put(s,"altar-cloth","textile",0,1.10,-7.05,0,0.65);
    put(s,"floor-cushion","floor-cushion",-1.65,0,-5.30);
    put(s,"votive-plaque","votive-plaque",4.65,0,-8.80);
    // The long shared offering room has a central stone table and wall shelving.
    put(o,"offering-table","offering-table",-7.85,0,-1.20);
    put(o,"display-shelf","display-shelf",-7.90,0,-7.20);
    put(o,"offering-bowl","offering-bowl",-7.70,0.81,-1.65);
    put(o,"small-vessel","small-vessel",-8.05,0.82,-0.85);
    put(o,"carry-jar","carry-jar",-7.25,0,-3.70);
    put(o,"offering-tray","offering-tray",-7.83,0.82,-1.10);
    put(o,"votive-plaque","votive-plaque",-9.25,0,1.65);
    put(o,"textile","textile",-8.90,0.58,-7.00,0,0.72);
    put(o,"basket","basket",-7.10,0,-5.50);
    put(o,"portable-lamp","portable-lamp",-8.90,0,3.50);
    // Office writing objects are supported by the desk; the low chest is separate.
    put(a,"desk","desk",7.55,0,7.00);
    put(a,"stool","stool",7.55,0,8.15);
    put(a,"working-scroll","open-scroll",7.45,0.75,7.00);
    put(a,"tool-vessel","small-vessel",7.92,0.75,6.90);
    put(a,"wall-shelf","display-shelf-office",8.85,0,6.25);
    put(a,"stylus","stylus",7.50,0.756,7.28);
    put(a,"writing-tablet","writing-tablet",7.12,0.75,6.75);
    put(a,"document-chest","chest",8.75,0,8.60,0,0.55);
    put(a,"portable-lamp","portable-lamp",7.95,0.75,7.28,0,0.8);
    put(a,"textile","textile",8.65,0.63,6.42,0,0.55);
    // Records: scrolls occupy a shelf bay, with an independent reading station.
    put(r,"scroll-shelf","scroll-shelf",7.80,0,2.05);
    put(r,"reading-desk","reading-desk",7.55,0,4.25);
    put(r,"stool","stool",7.55,0,5.08);
    put(r,"stored-scroll","scroll",7.20,0.405,2.30);
    put(r,"chest","chest",9.05,0,4.30);
    put(r,"document-chest","chest",8.90,0,3.30,0,0.55);
    put(r,"rope-coil","rope-coil",6.80,0,3.25);
    put(r,"portable-lamp","portable-lamp",7.90,0.72,4.25,0,0.8);
    put(r,"dust-cover","textile",8.65,0.505,4.30,0,0.55);
    // Storage: the single jar stand is distinct from the two-bay jar rack.
    put(st,"jar-rack","jar-rack",7.125,0,-1.30);
    put(st,"storage-jar","storage-jar",6.835,0.28,-1.30);
    put(st,"carry-jar","carry-jar",7.415,0.28,-1.30);
    put(st,"basket","basket",8.25,0,-1.30);
    put(st,"chest","chest",9.05,0,0.50);
    put(st,"jar-stand","jar-stand",6.65,0,0.55);
    put(st,"stand-vessel","small-vessel",6.65,0.34,0.55);
    put(st,"cover-cloth","textile",9.05,0.505,0.50,0,0.55);
    put(st,"rope-coil","rope-coil",8.15,0,0.55);
    put(st,"bucket","bucket",7.35,0,0.60);
    // Service yard: larger tools are distributed along its long outside edge.
    put(yard,"storage-jar","storage-jar",9.05,0,-8.40);
    put(yard,"carry-jar","carry-jar",8.20,0,-8.40);
    put(yard,"basket","basket",7.40,0,-8.35);
    put(yard,"work-bench","bench",8.05,0,-6.60,Math.PI/2);
    put(yard,"bucket","bucket",6.75,0,-5.80);
    put(yard,"carrying-yoke","carrying-yoke",8.05,0.485,-6.60);
    put(yard,"rope-coil","rope-coil",9.12,0,-4.90);
    put(yard,"handcart","handcart",7.70,0,-3.75);
    // South site ground is graded from the building to the public road.
    put(site,"path-lamp","portable-lamp",-4.0,templeSiteGrade(12.5),12.5);
    put(site,"porch-planter","planter",3.10,templeSiteGrade(11.5),11.5);
    put(site,"path-bucket","bucket",2.10,templeSiteGrade(13),13);
    put(site,"path-handcart","handcart",-7.00,templeSiteGrade(15),15);
    put(site,"path-basket","basket",-5.20,templeSiteGrade(13.5),13.5);
    if (list.length !== 78) throw new Error(`사물 역할 ${list.length}/78`);
    return list;
  }

  static elements(): IAutoMovieBuiltElement[] {
    return this.placements().map((item) => ({
      id: `temple.object.${item.space}.${item.role}`,
      kind: "object", parent: item.space === "temple-site" ? "site.root" : "temple.root",
      space: item.space, model: `object.${item.prototype}`,
      transform: {
        translation: { x: item.x, y: item.y, z: item.z },
        rotation: { x: 0, y: Math.sin((item.yaw ?? 0)/2), z: 0, w: Math.cos((item.yaw ?? 0)/2) },
        scale: { x: item.scale ?? 1, y: item.scale ?? 1, z: item.scale ?? 1 },
      },
    }));
  }
}
