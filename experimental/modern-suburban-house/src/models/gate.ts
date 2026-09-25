/** Side-yard gate leaf only. The posts, opening span and ground height belong
 * to spaces; the caller supplies the leaf's width and height from that host. */
import { PrototypeBuilder, type HousePrototype } from "./parts";

export const gateProfile = {
  plankCount: 8,
  gap: 0.008,
  edge: 0.002,
  depth: 0.04,
  battenHeight: 0.10,
  battenDepth: 0.025,
  battenLevels: [0.35,1.30],
  hingeLevels: [0.25,1.40],
  hingeRadius: 0.0125,
  hingeHeight: 0.10,
  handleLevel: 0.90,
} as const;

/** Local origin is the centre of the leaf's lower edge, at the fence plane.
 * World placement and the +X hinge motion are left to instances and motions. */
export function buildGatePrototype(id:string,width:number,height:number):HousePrototype {
  const p=gateProfile;
  if (![width,height].every((value)=>Number.isFinite(value)&&value>0) ||
      height<=Math.max(...p.hingeLevels)+p.hingeHeight/2 ||
      width<=p.gap*(p.plankCount-1)+p.edge*2)
    throw Error(`${id}: invalid gate reservation`);
  const plank=(width-p.edge*2-p.gap*(p.plankCount-1))/p.plankCount;
  const b=new PrototypeBuilder(id,"src/models/gate.ts",{
    "leaf-panel":"furniture-wood","gate-batten":"furniture-wood",
    hinge:"charcoal-metal",handle:"charcoal-metal",
  });
  for(let i=0;i<p.plankCount;i++) {
    const x=-width/2+p.edge+i*(plank+p.gap);
    b.box("leaf-panel",[x,0,-p.depth/2],[x+plank,height,p.depth/2]);
  }
  for(const level of p.battenLevels) b.box("gate-batten",
    [-width/2,level-p.battenHeight/2,-p.depth/2-p.battenDepth],
    [width/2,level+p.battenHeight/2,-p.depth/2]);
  for(const level of p.hingeLevels)
    b.frustum("hinge",[width/2,level-p.hingeHeight/2,-p.depth/2],
      p.hingeRadius,p.hingeRadius,p.hingeHeight,12);
  b.frustum("handle",[-width/2+0.06,p.handleLevel-0.004,-p.depth/2-0.01],
    0.03,0.03,0.008,12);
  b.beam("handle",[-width/2+0.06,p.handleLevel,-p.depth/2-0.01],
    [-width/2+0.14,p.handleLevel,-p.depth/2-0.05],0.008,0.008,12);
  return b.finish();
}
