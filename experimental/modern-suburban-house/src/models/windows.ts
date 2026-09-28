/**
 * Window filling prototypes in the opening-local frame. Dimensions, depth
 * bands, part boundaries and metric UVs belong to docs/models/01-windows.md.
 * World positions and finish properties belong to instances and materials.
 */
import type { IAutoMovieMesh, IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

type WindowKind = "double-hung" | "fixed" | "awning";
type FaceId = "frame" | "sash" | "mullion" | "muntin" | "glass" |
  "obscured-glass" | "exterior-trim" | "interior-sill" | "interior-casing";
type Box = readonly [number, number, number, number, number, number];
type WindowSpec = { id: string; kind: WindowKind; width: number; height: number; columns: number; lowerTravel?: number; awningAngle?: number };
type WindowBuilt = { model: IAutoMovieModel; faceByPart: Readonly<Record<string, FaceId>> };

const FRAME = 0.06;
const SASH = 0.05;
const MULLION = 0.08;
const MUNTIN = 0.025;

/** Closed box with independently measured UVs on all six planar faces. */
const boxMesh = (box: Box, axis: "standard" | "mullion" | "vertical-trim" = "standard"): IAutoMovieMesh => {
  const [x0, x1, y0, y1, z0, z1] = box;
  if (![...box].every(Number.isFinite) || x1 <= x0 || y1 <= y0 || z1 <= z0)
    throw new Error(`invalid window member bounds: ${box.join(",")}`);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const face = (corners: readonly (readonly [number, number, number])[], normal: readonly [number, number, number]): void => {
    const offset = positions.length / 3;
    for (const [x, y, z] of corners) {
      positions.push(x, y, z);
      normals.push(...normal);
      if ((axis === "mullion" || axis === "vertical-trim") && Math.abs(normal[1]) !== 1) {
        uvs.push(y - y0, Math.abs(normal[2]) === 1 ? x - x0 : z - z0);
      } else if (Math.abs(normal[1]) === 1) uvs.push(x - x0, z - z0);
      else if (Math.abs(normal[2]) === 1) uvs.push(x - x0, y - y0);
      else uvs.push(z - z0, y - y0);
    }
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  };
  face([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]], [0,0,1]);
  face([[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]], [0,0,-1]);
  face([[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]], [1,0,0]);
  face([[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]], [-1,0,0]);
  face([[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]], [0,1,0]);
  face([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]], [0,-1,0]);
  return { positions, normals, uvs, indices, skin: null };
};

/** Three window filling prototypes with distinct closed members and metric UVs. */
export class Windows {
  /** Build one opening-local window and its nine-face binding map. */
  public build(input: WindowSpec): WindowBuilt {
    const { id, kind, width: w, height: h, columns: n } = input;
    if (!id || ![w,h,n].every(Number.isFinite) || w <= 0 || h <= 0 || !Number.isInteger(n) || n < 1)
      throw new Error(`invalid window opening: ${id}`);
    if (!(["double-hung", "fixed", "awning"] as const).includes(kind))
      throw new Error(`unsupported window kind: ${id}`);
    if (kind === "awning" && (n !== 1 || input.lowerTravel !== undefined))
      throw new Error(`unsupported awning configuration: ${id}`);
    if (kind !== "awning" && input.awningAngle !== undefined)
      throw new Error(`unexpected awning angle: ${id}`);
    const c = (w - 2 * FRAME - (n - 1) * MULLION) / n;
    if (c < 0.30 || h <= 2 * FRAME + 2 * SASH + MUNTIN)
      throw new Error(`window pane below reviewed minimum: ${id}`);
    const lowerTravel = input.lowerTravel ?? 0;
    const sh = (h - 2 * FRAME) / 2;
    if (!Number.isFinite(lowerTravel) || lowerTravel < 0 ||
        (kind !== "double-hung" && lowerTravel !== 0) || lowerTravel > sh / 2)
      throw new Error(`window lower travel outside reviewed range: ${id}`);
    const awningAngle = input.awningAngle ?? 0;
    if (!Number.isFinite(awningAngle) || awningAngle < 0 ||
        (kind !== "awning" && awningAngle !== 0) || awningAngle > Math.PI / 8)
      throw new Error(`window awning angle outside reviewed range: ${id}`);

    const parts: IAutoMovieModelPart[] = [];
    const faceByPart: Record<string, FaceId> = {};
    const add = (name: string, face: FaceId, bounds: Box, uv: "standard" | "mullion" | "vertical-trim" = "standard"): void => {
      if (faceByPart[name] !== undefined) throw new Error(`duplicate window part: ${id}/${name}`);
      parts.push({ id: name, name, geometry: { type: "mesh", mesh: boxMesh(bounds, uv) },
        material: null, attachedBone: null, transform: null });
      faceByPart[name] = face;
    };
    const l = -w / 2;
    const r = w / 2;
    // Four frame members meet by their end faces; corner volume is not copied.
    add("frame/bottom", "frame", [l,r,0,FRAME,-0.18,-0.04]);
    add("frame/top", "frame", [l,r,h-FRAME,h,-0.18,-0.04]);
    add("frame/left", "frame", [l,l+FRAME,FRAME,h-FRAME,-0.18,-0.04]);
    add("frame/right", "frame", [r-FRAME,r,FRAME,h-FRAME,-0.18,-0.04]);
    for (let k = 1; k < n; k++) {
      const x0 = l + FRAME + k*c + (k-1)*MULLION;
      add(`mullion-${k}`, "mullion", [x0,x0+MULLION,FRAME,h-FRAME,-0.18,-0.04], "mullion");
    }
    const sash = (stem: string, x0: number, x1: number, y0: number, y1: number,
      z0: number, z1: number, glass0: number, glass1: number, obscured: boolean): void => {
      add(`${stem}/sash-bottom`, "sash", [x0,x1,y0,y0+SASH,z0,z1]);
      add(`${stem}/sash-top`, "sash", [x0,x1,y1-SASH,y1,z0,z1]);
      add(`${stem}/sash-left`, "sash", [x0,x0+SASH,y0+SASH,y1-SASH,z0,z1]);
      add(`${stem}/sash-right`, "sash", [x1-SASH,x1,y0+SASH,y1-SASH,z0,z1]);
      const gx0=x0+SASH, gx1=x1-SASH, gy0=y0+SASH, gy1=y1-SASH;
      if (obscured) {
        add(`${stem}/obscured-glass`, "obscured-glass", [gx0,gx1,gy0,gy1,glass0,glass1]);
        return;
      }
      const midX=(gx0+gx1)/2, midY=(gy0+gy1)/2, m=MUNTIN/2;
      for (const [col, xa, xb] of [["left",gx0,midX-m],["right",midX+m,gx1]] as const)
        for (const [row, ya, yb] of [["lower",gy0,midY-m],["upper",midY+m,gy1]] as const)
          add(`${stem}/glass-${col}-${row}`, "glass", [xa,xb,ya,yb,glass0,glass1]);
      for (const [side, a, b] of [["outer",glass1,glass1+0.01],["inner",glass0-0.01,glass0]] as const) {
        add(`${stem}/muntin-${side}-vertical`, "muntin", [midX-m,midX+m,gy0,gy1,a,b]);
        add(`${stem}/muntin-${side}-left`, "muntin", [gx0,midX-m,midY-m,midY+m,a,b]);
        add(`${stem}/muntin-${side}-right`, "muntin", [midX+m,gx1,midY-m,midY+m,a,b]);
      }
    };
    for (let k=0; k<n; k++) {
      const x0=l+FRAME+k*(c+MULLION), x1=x0+c;
      if (kind === "double-hung") {
        sash(`unit-${k+1}/lower-sash`,x0,x1,FRAME+lowerTravel,FRAME+sh+lowerTravel,-0.17,-0.12,-0.153,-0.147,false);
        sash(`unit-${k+1}/upper-sash`,x0,x1,FRAME+sh,h-FRAME,-0.10,-0.05,-0.083,-0.077,false);
      } else if (kind === "fixed")
        sash(`unit-${k+1}/fixed-sash`,x0,x1,FRAME,h-FRAME,-0.13,-0.08,-0.113,-0.107,false);
      else sash("awning-sash",x0,x1,FRAME,h-FRAME,-0.13,-0.08,-0.113,-0.107,true);
    }
    // Wall-side trim and sill occupy separate depth bands and meet on faces.
    add("exterior-trim/left", "exterior-trim", [l-0.10,l,0,h,0,0.035], "vertical-trim");
    add("exterior-trim/right", "exterior-trim", [r,r+0.10,0,h,0,0.035], "vertical-trim");
    add("exterior-trim/bottom", "exterior-trim", [l-0.10,r+0.10,-0.10,0,0,0.035]);
    add("exterior-trim/top", "exterior-trim", [l-0.10,r+0.10,h,h+0.10,0,0.035]);
    add("interior-sill/body", "interior-sill", [l,r,0,0.03,-0.25,-0.18]);
    add("interior-sill/ears", "interior-sill", [l-0.07,r+0.07,0,0.03,-0.31,-0.25]);
    add("interior-casing/left", "interior-casing", [l-0.07,l,0.03,h,-0.265,-0.25], "vertical-trim");
    add("interior-casing/right", "interior-casing", [r,r+0.07,0.03,h,-0.265,-0.25], "vertical-trim");
    add("interior-casing/top", "interior-casing", [l-0.07,r+0.07,h,h+0.07,-0.265,-0.25]);
    if (awningAngle !== 0) {
      const theta = -awningAngle, cos = Math.cos(theta), sin = Math.sin(theta);
      const pivotY = h - FRAME, pivotZ = -0.08;
      for (const part of parts) {
        if (!part.id.startsWith("awning-sash/")) continue;
        if (part.geometry.type !== "mesh") throw Error(`invalid awning part: ${part.id}`);
        const mesh = part.geometry.mesh;
        const normals = mesh.normals;
        if (normals === null) throw Error(`awning part has no normals: ${part.id}`);
        for (let i = 0; i < mesh.positions.length; i += 3) {
          const dy = mesh.positions[i+1]! - pivotY, dz = mesh.positions[i+2]! - pivotZ;
          mesh.positions[i+1] = pivotY + cos*dy - sin*dz;
          mesh.positions[i+2] = pivotZ + sin*dy + cos*dz;
          const ny = normals[i+1]!, nz = normals[i+2]!;
          normals[i+1] = cos*ny - sin*nz;
          normals[i+2] = sin*ny + cos*nz;
        }
      }
    }
    const model: IAutoMovieModel = { id: `window:${id}`, name: id,
      origin: "generated", parts, skeleton: null, body: null,
      materials: [], asset: null };
    return { model, faceByPart };
  }
}
