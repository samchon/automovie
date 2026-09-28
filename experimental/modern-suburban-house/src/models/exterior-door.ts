/**
 * Front entry and garden-pair fillings in opening-local metres. The origin is
 * the rough opening's lower centre on its weather face; +Z points outdoors.
 * Spaces retain thresholds and walls. This owner emits only door members.
 */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import {
  boxMeshes,
  cylinder,
  doorModel,
  hingeCut,
  rotateY,
  type Box,
  type Face,
} from "../geometry/exterior-door-geometry";

type Build = { model: IAutoMovieModel; faceByPart: Readonly<Record<string, Face>> };

/** Front single leaf and rear garden pair, with explicit part faces. */
export class ExteriorDoor {
  /** Build the 1.00 × 2.20 m front filling; positive angle opens into -Z. */
  public buildFront(angle = 0): Build {
    if (!Number.isFinite(angle) || angle < 0 || angle > Math.PI/2)
      throw new Error(`front door angle outside 0..pi/2: ${angle}`);
    const parts: IAutoMovieModelPart[] = [], faceByPart: Record<string, Face> = {};
    const add = (name: string, id: Face, mesh: IAutoMovieMesh, moving = false): void => {
      const key = `${moving ? "leaf/" : "fixed/"}${name}`;
      if (faceByPart[key]) throw new Error(`duplicate front door part: ${key}`);
      if (moving) rotateY(mesh, [0.47,0,-0.145], -angle);
      parts.push({
        id: key,
        name: key,
        geometry: { type:"mesh", mesh },
        material:null,
        attachedBone:null,
        transform:null,
      });
      faceByPart[key]=id;
    };
    const box = (name: string, b: Box, front: Face, back=front, edge=front,
      moving=false, length: "x" | "y" | null = null): void => {
      for (const [id, mesh] of boxMeshes(b, front, back, edge, length)) add(`${name}/${id}`, id, mesh, moving);
    };
    // World drawing X=[0.40,1.40] translated by its opening centre 0.90.
    box("jamb/left",[-.50,-.47,.02,2.17,-.25,0],"jamb");
    const hingeLevels=[.23,1.08,1.93];
    let jambStart=.02,stileStart=.15;
    for(const [i,h] of hingeLevels.entries()){
      box(`jamb/right-${i}`, [.47,.50,jambStart,h-.04,-.25,0],"jamb");
      box(
        `right-stile-${i}`,
        [.35, .47, stileStart, h-.04, -.145, -.105],
        "leaf-exterior",
        "leaf-interior",
        "leaf-edge",
        true,
      );
      add(`jamb/right-cut-${i}`,"jamb",hingeCut([.47,.50,h-.04,h+.04,-.25,0],
        .47,-.145,.009,"edge-left","jamb","jamb","jamb")[0]![1]);
      for(const [id,m] of hingeCut(
        [.35, .47, h-.04, h+.04, -.145, -.105],
        .47,
        -.145,
        .009,
        "corner-right-bottom",
        "leaf-exterior",
        "leaf-interior",
        "leaf-edge",
      ))
        add(`right-stile-cut-${i}/${id}`,id,m,true);
      jambStart=h+.04;
      stileStart=h+.04;
    }
    box("jamb/right-end",[.47,.50,jambStart,2.17,-.25,0],"jamb");
    box(
      "right-stile-end",
      [.35, .47, stileStart, 2.05, -.145, -.105],
      "leaf-exterior",
      "leaf-interior",
      "leaf-edge",
      true,
    );
    box("jamb/head",[-.50,.50,2.17,2.20,-.25,0],"jamb");
    box(
      "exterior-trim/left",
      [-.60, -.50, 0, 2.20, 0, .035],
      "exterior-trim",
      undefined,
      undefined,
      false,
      "y",
    );
    box(
      "exterior-trim/right",
      [.50, .60, 0, 2.20, 0, .035],
      "exterior-trim",
      undefined,
      undefined,
      false,
      "y",
    );
    box(
      "exterior-trim/head",
      [-.60, .60, 2.20, 2.30, 0, .035],
      "exterior-trim",
      undefined,
      undefined,
      false,
      "x",
    );
    box(
      "casing/left",
      [-.57, -.50, 0, 2.20, -.265, -.25],
      "casing",
      undefined,
      undefined,
      false,
      "y",
    );
    box(
      "casing/right",
      [.50, .57, 0, 2.20, -.265, -.25],
      "casing",
      undefined,
      undefined,
      false,
      "y",
    );
    box(
      "casing/head",
      [-.57, .57, 2.20, 2.27, -.265, -.25],
      "casing",
      undefined,
      undefined,
      false,
      "x",
    );
    const wood = (name: string, b: Box): void => box(
      name,
      b,
      "leaf-exterior",
      "leaf-interior",
      "leaf-edge",
      true,
    );
    wood("bottom",[-.47,.47,.03,.15,-.145,-.105]);
    wood("left-stile",[-.47,-.35,.15,2.05,-.145,-.105]);
    wood("lock-rail",[-.35,.35,1.18,1.30,-.145,-.105]);
    wood("top-rail",[-.47,.47,2.05,2.17,-.145,-.105]);
    box(
      "lower-recess",
      [-.35, .35, .15, 1.18, -.137, -.113],
      "leaf-panel",
      undefined,
      undefined,
      true,
    );
    const xs = [
      [-.35, -.13666666666666666],
      [-.10666666666666666, .10666666666666666],
      [.13666666666666666, .35],
    ] as const;
    for (const [k,[a,b]] of xs.entries()) {
      for (const [j,[lo,hi]] of [[1.30,1.66],[1.69,2.05]].entries())
        box(
          `glass/${k}-${j}`,
          [a, b, lo, hi, -.128, -.122],
          "glass",
          undefined,
          undefined,
          true,
        );
      box(
        `muntin/cross-${k}`,
        [a, b, 1.66, 1.69, -.145, -.105],
        "muntin",
        undefined,
        undefined,
        true,
        "x",
      );
    }
    box(
      "muntin/vertical-1",
      [-.13666666666666666, -.10666666666666666, 1.30, 2.05, -.145, -.105],
      "muntin",
      undefined,
      undefined,
      true,
      "y",
    );
    box(
      "muntin/vertical-2",
      [.10666666666666666, .13666666666666666, 1.30, 2.05, -.145, -.105],
      "muntin",
      undefined,
      undefined,
      true,
      "y",
    );
    for (const h of hingeLevels) add(
      `hinge/${h}`,
      "hinge",
      cylinder("y", [.47, 0, -.145], .009, h-.04, h+.04),
    );
    for (const side of [-1,1]) {
      const z=side===1
        ? -.105
        : -.145, outside=z+side*.008, stemEnd=outside+side*.044;
      add(
        `handle/${side}/plate`,
        "handle",
        cylinder(
          "z",
          [-.40, .95, 0],
          .0325,
          Math.min(z, outside),
          Math.max(z, outside),
        ),
        true,
      );
      add(
        `handle/${side}/stem`,
        "handle",
        cylinder(
          "z",
          [-.40, .95, 0],
          .008,
          Math.min(outside, stemEnd),
          Math.max(outside, stemEnd),
        ),
        true,
      );
      add(
        `handle/${side}/lever`,
        "handle",
        cylinder("x", [0, .95, stemEnd], .008, -.40, -.29),
        true,
      );
    }
    return { model: doorModel("front-door", parts), faceByPart };
  }

  /** Build the 2.40 × 2.25 m rear pair; each angle opens toward +Z. */
  public buildGarden(leftAngle = 0, rightAngle = 0): Build {
    for (const angle of [leftAngle,rightAngle])
      if (!Number.isFinite(angle) || angle < 0 || angle > Math.PI/2)
        throw new Error(`garden door angle outside 0..pi/2: ${angle}`);
    const parts: IAutoMovieModelPart[] = [], faceByPart: Record<string, Face> = {};
    const add = (name: string, id: Face, mesh: IAutoMovieMesh,
      leaf: "left" | "right" | null = null): void => {
      const key = `${leaf ?? "fixed"}/${name}`;
      if (faceByPart[key]) throw new Error(
        `duplicate garden door part: ${key}`,
      );
      if (leaf) rotateY(
        mesh,
        [leaf==="left" ? -1.17 : 1.17, 0, -.105],
        leaf==="left" ? -leftAngle : rightAngle,
      );
      parts.push({
        id:key,
        name:key,
        geometry:{ type:"mesh", mesh },
        material:null,
        attachedBone:null,
        transform:null,
      });
      faceByPart[key]=id;
    };
    const box = (name:string,b:Box,front:Face,back=front,edge=front,
      leaf: "left" | "right" | null = null,length:"x"|"y"|null=null):void => {
      for (const [id,mesh] of boxMeshes(b, front, back, edge, length)) add(`${name}/${id}`, id, mesh, leaf);
    };
    const hingeLevels=[.23,1.08,1.93];
    for(const [side,x0,x1,axis,notch] of [
      ["left", -1.20, -1.17, -1.17, "edge-right"],
      ["right", 1.17, 1.20, 1.17, "edge-left"],
    ] as const){
      let start=.02;
      for(const [i,h] of hingeLevels.entries()){
        box(`jamb/${side}-${i}`,[x0,x1,start,h-.04,-.25,0],"jamb");
        add(`jamb/${side}-cut-${i}`,"jamb",hingeCut([x0,x1,h-.04,h+.04,-.25,0],
          axis,-.105,.009,notch,"jamb","jamb","jamb")[0]![1]);
        start=h+.04;
      }
      box(`jamb/${side}-end`,[x0,x1,start,2.22,-.25,0],"jamb");
    }
    box("jamb/head",[-1.20,1.20,2.22,2.25,-.25,0],"jamb");
    for (const [name,a,b] of [
      ["left", -1.30, -1.20],
      ["right", 1.20, 1.30],
    ] as const)
      box(
        `exterior-trim/${name}`,
        [a, b, 0, 2.25, 0, .035],
        "exterior-trim",
        undefined,
        undefined,
        null,
        "y",
      );
    box(
      "exterior-trim/head",
      [-1.30, 1.30, 2.25, 2.35, 0, .035],
      "exterior-trim",
      undefined,
      undefined,
      null,
      "x",
    );
    for (const [name,a,b] of [
      ["left", -1.27, -1.20],
      ["right", 1.20, 1.27],
    ] as const)
      box(
        `casing/${name}`,
        [a, b, 0, 2.25, -.265, -.25],
        "casing",
        undefined,
        undefined,
        null,
        "y",
      );
    box(
      "casing/head",
      [-1.27, 1.27, 2.25, 2.32, -.265, -.25],
      "casing",
      undefined,
      undefined,
      null,
      "x",
    );
    for (const [leaf,x0,x1,hx,sgn] of [
      ["left", -1.17, 0, -1.17, -1],
      ["right", 0, 1.17, 1.17, 1],
    ] as const) {
      const g0=x0+.10,g1=x1-.10;
      const wood=(name:string,b:Box):void=>box(
        name,
        b,
        "leaf-exterior",
        "leaf-interior",
        "leaf-edge",
        leaf,
      );
      wood("bottom",[x0,x1,.03,.13,-.145,-.105]);
      wood("top",[x0,x1,2.12,2.22,-.145,-.105]);
      if(leaf==="left")wood("right-stile",[g1,x1,.13,2.12,-.145,-.105]);
      else wood("left-stile",[x0,g0,.13,2.12,-.145,-.105]);
      let start=.13;
      for(const [i,h] of hingeLevels.entries()){
        const hingeSide=leaf==="left"?[x0,g0] as const:[g1,x1] as const;
        wood(`hinge-stile-${i}`, [
          hingeSide[0],
          hingeSide[1],
          start,
          h-.04,
          -.145,
          -.105,
        ]);
        for(const [id,m] of hingeCut(
          [hingeSide[0], hingeSide[1], h-.04, h+.04, -.145, -.105],
          hx,
          -.105,
          .009,
          leaf==="left" ? "corner-left-top" : "corner-right-top",
          "leaf-exterior",
          "leaf-interior",
          "leaf-edge",
        ))
          add(`hinge-stile-cut-${i}/${id}`,id,m,leaf);
        start=h+.04;
      }
      const hingeSide=leaf==="left"?[x0,g0] as const:[g1,x1] as const;
      wood("hinge-stile-end", [
        hingeSide[0],
        hingeSide[1],
        start,
        2.12,
        -.145,
        -.105,
      ]);
      box(
        "sash/bottom",
        [g0, g1, .13, .15, -.145, -.105],
        "sash",
        undefined,
        undefined,
        leaf,
        "x",
      );
      box(
        "sash/top",
        [g0, g1, 2.10, 2.12, -.145, -.105],
        "sash",
        undefined,
        undefined,
        leaf,
        "x",
      );
      box(
        "sash/left",
        [g0, g0+.02, .15, 2.10, -.145, -.105],
        "sash",
        undefined,
        undefined,
        leaf,
        "y",
      );
      box(
        "sash/right",
        [g1-.02, g1, .15, 2.10, -.145, -.105],
        "sash",
        undefined,
        undefined,
        leaf,
        "y",
      );
      box(
        "glass",
        [g0+.02, g1-.02, .15, 2.10, -.128, -.122],
        "glass",
        undefined,
        undefined,
        leaf,
      );
      for (const h of hingeLevels) add(
        `hinge/${leaf}/${h}`,
        "hinge",
        cylinder("y", [hx, 0, -.105], .009, h-.04, h+.04),
      );
      const hand=leaf==="left" ? -.07 : .07;
      for (const side of [-1,1]) {
        const z=side===1
          ? -.105
          : -.145, outside=z+side*.008, stemEnd=outside+side*.044;
        add(
          `handle/${side}/plate`,
          "handle",
          cylinder(
            "z",
            [hand, .95, 0],
            .0325,
            Math.min(z, outside),
            Math.max(z, outside),
          ),
          leaf,
        );
        add(
          `handle/${side}/stem`,
          "handle",
          cylinder(
            "z",
            [hand, .95, 0],
            .008,
            Math.min(outside, stemEnd),
            Math.max(outside, stemEnd),
          ),
          leaf,
        );
        add(
          `handle/${side}/lever`,
          "handle",
          cylinder(
            "x",
            [0, .95, stemEnd],
            .008,
            Math.min(hand, hand+sgn*.11),
            Math.max(hand, hand+sgn*.11),
          ),
          leaf,
        );
      }
    }
    return { model: doorModel("garden-door", parts), faceByPart };
  }
}
