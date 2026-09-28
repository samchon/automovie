/** Fixed kitchen cabinet and sink-island prototypes from docs/models/10-kitchen-dining.md. */
import { FittingParts, type FittingBuilt } from "./geometry";

const lengths = new Set([3.35,1.30,0.30]);

/** Kitchen cabinet fittings in the reviewed rear-wall, floor-local metre frame. */
export class KitchenDining {
  /** One reviewed L-run segment; the caller places its centre and wall-facing direction. */
  public baseRun(length: number, wallEnd: "none"|"left"|"right"|"both" = "none"): FittingBuilt {
    const reviewedLength = [...lengths].find(value => Math.abs(value-length) < 1e-7);
    if (reviewedLength === undefined) throw new Error("unsupported kitchen base-run length");
    length = reviewedLength;
    const a=new FittingParts(), left=-length/2, right=length/2;
    a.box("plinth", "plinth", [
      left+(wallEnd==="left"||wallEnd==="both"?0.015:0),
      right-(wallEnd==="right"||wallEnd==="both"?0.015:0),
      0,
      0.10,
      0.015,
      0.55,
    ]);
    a.box("carcass","carcass",[left,right,0.10,0.88,0.015,0.60]);
    const count=Math.round(length/0.60), step=length/count;
    for(let i=0;i<count;i++){
      const x0=left+i*step,x1=left+(i+1)*step,mid=(x0+x1)/2;
      a.box(`bay-${i+1}/drawer`,"drawer-front",[x0,x1,0.73,0.88,0.60,0.62]);
      a.box(`bay-${i+1}/leaf`,"leaf",[x0,x1,0.10,0.73,0.60,0.62]);
      a.box(`bay-${i+1}/drawer-handle`, "handle", [
        mid-0.06,
        mid+0.06,
        0.79,
        0.802,
        0.62,
        0.64,
      ]);
      a.box(`bay-${i+1}/leaf-handle`, "handle", [
        mid-0.06,
        mid+0.06,
        0.665,
        0.677,
        0.62,
        0.64,
      ]);
    }
    a.box("countertop","countertop",[left,right,0.88,0.91,0,0.65]);
    return a.finish(`kitchen-base-${length}`);
  }

  /** The left 1.30 m two-door and rear 0.85 m one-door upper cabinets. */
  public wallCabinet(length: 1.30|0.85): FittingBuilt {
    if (length!==1.30&&length!==0.85) throw new Error(
      "unsupported kitchen upper length",
    );
    const a=new FittingParts(),left=-length/2,right=length/2,count=length===1.30
      ? 2
      : 1,step=length/count;
    a.box("carcass","carcass",[left,right,0,0.90,0,0.31]);
    for(let i=0;i<count;i++){
      const x0=left+i*step,x1=x0+step,free=i===0?x1-0.04:x0+0.04;
      a.box(`door-${i+1}`,"leaf",[x0,x1,0,0.90,0.31,0.33]);
      a.cylinder(
        `door-${i+1}/handle`,
        "handle",
        "y",
        [free, 0.04, 0.344],
        0.12,
        0.006,
      );
      a.cylinder(
        `door-${i+1}/support`,
        "handle",
        "z",
        [free, 0.10, 0.33],
        0.008,
        0.004,
      );
    }
    return a.finish(`kitchen-upper-${length}`);
  }

  /** Sink island: the seat-side 0.30 m knee void and the dishwasher bay stay open. */
  public island(): FittingBuilt {
    const a=new FittingParts();
    // The four strips give the countertop a real rectangular 0.50 m aperture.
    a.box("countertop/left","countertop",[-1.125,-1.025,0.88,0.91,0,1.05]);
    a.box("countertop/right","countertop",[-0.525,1.125,0.88,0.91,0,1.05]);
    a.box("countertop/back","countertop",[-1.025,-0.525,0.88,0.91,0,0.45]);
    a.box("countertop/front","countertop",[-1.025,-0.525,0.88,0.91,0.95,1.05]);
    // Basin faces end at the countertop cut and leave its top open.
    a.box("basin/bottom","basin",[-1.025,-0.525,0.71,0.722,0.45,0.95]);
    a.box("basin/left","basin",[-1.025,-1.013,0.722,0.91,0.45,0.95]);
    a.box("basin/right","basin",[-0.537,-0.525,0.722,0.91,0.45,0.95]);
    a.box("basin/back","basin",[-1.013,-0.537,0.722,0.91,0.45,0.462]);
    a.box("basin/front","basin",[-1.013,-0.537,0.722,0.91,0.938,0.95]);
    // Above Y=.71 the carcass clears the basin; the dishwasher clears its full height.
    a.box("carcass/left","carcass",[-1.125,-1.025,0.10,0.88,0.30,1.01]);
    a.box("carcass/sink-low","carcass",[-1.025,-0.525,0.10,0.71,0.30,1.01]);
    a.box("carcass/sink-back","carcass",[-1.025,-0.525,0.71,0.88,0.30,0.45]);
    a.box("carcass/sink-front","carcass",[-1.025,-0.525,0.71,0.88,0.95,1.01]);
    a.box("carcass/gap","carcass",[-0.525,-0.475,0.10,0.88,0.30,1.01]);
    a.box(
      "carcass/dishwasher-back",
      "carcass",
      [-0.475, 0.125, 0.10, 0.88, 0.30, 0.45],
    );
    a.box("carcass/right","carcass",[0.125,1.125,0.10,0.88,0.30,1.01]);
    for(const [id,x0,x1] of [
      ["left", -1.125, -0.475],
      ["right", 0.125, 1.125],
    ] as const){
      a.box(`plinth/${id}`,"plinth",[x0,x1,0,0.10,0.30,0.94]);
      const count=Math.round((x1-x0)/0.60),step=(x1-x0)/count;
      for(let i=0;i<count;i++){
        const lo=x0+i*step,hi=lo+step,mid=(lo+hi)/2;
        a.box(`${id}-${i+1}/drawer`,"drawer-front",[lo,hi,0.73,0.88,1.01,1.03]);
        a.box(`${id}-${i+1}/leaf`,"leaf",[lo,hi,0.10,0.73,1.01,1.03]);
        a.box(`${id}-${i+1}/drawer-handle`, "handle", [
          mid-0.06,
          mid+0.06,
          0.79,
          0.802,
          1.03,
          1.05,
        ]);
        a.box(`${id}-${i+1}/leaf-handle`, "handle", [
          mid-0.06,
          mid+0.06,
          0.665,
          0.677,
          1.03,
          1.05,
        ]);
      }
    }
    a.cylinder("faucet/stem","faucet","y",[-0.775,0.91,0.42],0.341,0.0125);
    a.cylinder("faucet/spout","faucet","z",[-0.775,1.251,0.42],0.20,0.009);
    return a.finish("kitchen-island");
  }
}
