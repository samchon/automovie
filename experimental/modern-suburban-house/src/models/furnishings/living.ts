/** Fixed fireplace insert and mantel from docs/models/11-living.md. */
import { FittingParts, type FittingBuilt, type FittingPoint } from "./geometry";

type XY = readonly [number,number];

/** Living-room architectural fittings, centred at the brick firebox opening. */
export class Living {
  /** Five firebox plates, a true mitred face ring, and the separate wood mantel. */
  public fireplace(): FittingBuilt {
    const a=new FittingParts();
    a.box("firebox/back","firebox",[-0.52,0.52,0.23,0.87,-0.55,-0.525]);
    a.box("firebox/left","firebox",[-0.52,-0.495,0.255,0.845,-0.525,-0.015],1);
    a.box("firebox/right","firebox",[0.495,0.52,0.255,0.845,-0.525,-0.015],1);
    a.box("firebox/bottom","firebox",[-0.52,0.52,0.23,0.255,-0.525,-0.015]);
    a.box("firebox/top","firebox",[-0.52,0.52,0.845,0.87,-0.525,-0.015]);
    const strips: readonly [string,readonly [XY,XY,XY,XY]][] = [
      [
        "bottom",
        [
          [-0.52, 0.23],
          [0.52, 0.23],
          [0.495, 0.255],
          [-0.495, 0.255],
        ],
      ],
      [
        "right",
        [
          [0.52, 0.23],
          [0.52, 0.87],
          [0.495, 0.845],
          [0.495, 0.255],
        ],
      ],
      [
        "top",
        [
          [0.52, 0.87],
          [-0.52, 0.87],
          [-0.495, 0.845],
          [0.495, 0.845],
        ],
      ],
      [
        "left",
        [
          [-0.52, 0.87],
          [-0.52, 0.23],
          [-0.495, 0.255],
          [-0.495, 0.845],
        ],
      ],
    ];
    for(const [id,outline] of strips){
      a.mesh(`firebox-trim/${id}`, "firebox-trim", (q)=>{
        const front=outline.map(([x,y]):FittingPoint=>[x,y,0]) as unknown as [FittingPoint,FittingPoint,FittingPoint,FittingPoint];
        const rear=outline.map(([x,y]):FittingPoint=>[x,y,-0.015]) as unknown as [FittingPoint,FittingPoint,FittingPoint,FittingPoint];
        q(
          front,
          [0, 0, 1],
          front.map((p)=>[p[0]+0.52,p[1]-0.23]) as unknown as [XY,XY,XY,XY],
        );
        q(
          rear,
          [0, 0, -1],
          rear.map((p)=>[p[0]+0.52,p[1]-0.23]) as unknown as [XY,XY,XY,XY],
        );
        for(let i=0;i<4;i++){
          const j=(i+1)%4,dx=outline[j]![0]-outline[i]![0],dy=outline[j]![1]-outline[i]![1];
          const length=Math.hypot(dx, dy),normal:FittingPoint=[
            dy/length,
            -dx/length,
            0,
          ];
          q([rear[i]!, rear[j]!, front[j]!, front[i]!], normal, [
            [0, 0],
            [length, 0],
            [length, 0.015],
            [0, 0.015],
          ]);
        }
      });
    }
    a.box("mantel","mantel",[-0.80,0.80,1.30,1.40,-0.55,0]);
    return a.finish("fireplace");
  }
}
