// Named, deterministic measurement producer for cabinet-and-shelf.
// Inputs are the cabinet H2's parameter record and finite variant list.
// The emitted rows remain beside their owner H2 for review.
const { readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

const documentPath = resolve(__dirname, "../../docs/models/002-storage-and-sleep.md");
const startMarker = "<!-- @generated-cabinet-parts:start -->";
const endMarker = "<!-- @generated-cabinet-parts:end -->";
/** @typedef {{panel:number,back:number,toe:number,frontInset:number,doorThickness:number,seam:number,leafMaximum:number,hingeRadius:number,hingeDepth:number,hingeY:number,handleWidth:number,handleHeight:number,handleDepth:number,drawerWall:number,shelfPitch:number,islandSeam:number}} CabinetSpec */
/** @typedef {{id:string,shape:string,x:[number,number],y:[number,number],z:[number,number],contact:string}} Part */
/** @typedef {{state:string,envelope:{x:[number,number],y:[number,number],z:[number,number]},parts:Part[],voids:{host:string,x:[number,number],y:[number,number],z:[number,number]}[],pieces:{host:string,x:[number,number],y:[number,number],z:[number,number]}[]}} Assembly */

/** @param {number} value */
const round = (value) => Number(value.toFixed(6));
/** @param {number} a @param {number} b @returns {[number,number]} */
const span = (a, b) => [round(a), round(b)];
/** @param {[number,number]} value */
const extent = (value) => `${value[0]}..${value[1]}`;

/** @param {string} source */
function specification(source) {
  const start = source.indexOf("{#cabinet-and-shelf}");
  const end = source.indexOf("## ", start);
  if (start < 0 || end < 0) throw Error("cabinet H2 absent");
  const h2 = source.slice(start, end);
  const specMatch = /^@cabinet-spec: (.+)$/m.exec(h2);
  const variantsMatch = /^@cabinet-variants: (.+)$/m.exec(h2);
  if (!specMatch || !variantsMatch) throw Error("cabinet parameter record or variants absent");
  const spec = /** @type {CabinetSpec} */ (JSON.parse(specMatch[1]));
  const variants = variantsMatch[1].split(",").map((value) => value.trim());
  if (new Set(variants).size !== variants.length || variants.length !== 22)
    throw Error("cabinet variant inventory incomplete or duplicated");
  const required = /** @type {(keyof CabinetSpec)[]} */ ([
    "panel", "back", "toe", "frontInset", "doorThickness", "seam", "leafMaximum",
    "hingeRadius", "hingeDepth", "hingeY", "handleWidth", "handleHeight", "handleDepth",
    "drawerWall", "shelfPitch", "islandSeam"
  ]);
  if (!required.every((key) => typeof spec[key] === "number" && Number.isFinite(spec[key]) && spec[key] > 0))
    throw Error("cabinet parameter record incomplete");
  if (spec.panel !== 0.018 || spec.back !== 0.012 || spec.toe !== 0.08 ||
    spec.leafMaximum !== 0.60 || spec.islandSeam !== 0.004)
    throw Error("cabinet parameter record differs from authored design");
  const prose = h2.slice(0, h2.indexOf(startMarker));
  const commitments = [
    "일반형은 폭 0.50..2.90m",
    "측판은 두께 0.018m로 x=±W/2의 안쪽에, y=0.098..H−0.018",
    "하판은 y=0.08..0.098,z=−D/2+0.012..D/2−0.023",
    "상판은 y=H−0.018..H,z=−D/2..D/2−0.023",
    "뒤판은 x=±W/2,y=0.08..H−0.018",
    "0.005m 깊이 연결편은 z=D/2−0.023..D/2−0.018",
    "x=축±0.008,y=축±0.020,z=D/2−0.018..D/2−0.001",
    "서랍의 가로 손잡이는 폭 0.16×높이 0.012×깊이 0.016m",
    "상자 Y 점유는 각 전면 Y 하한+0.015..상한−0.010m",
    "oven-sill`(x=±0.32,y=0.098..0.15,z=−D/2+0.012..D/2−0.023)",
    "x=−0.418..+0.422,z=−1.307..+1.307",
    "높이는 상·하판과 0.003m clear를 두어 y=0.101..0.849",
    "service-stile-j",
    "n=max(2,ceil((W−0.006)/0.60))",
    "n=ceil((2.65−0.008)/0.60)=5"
  ];
  for (const text of commitments) if (!prose.includes(text))
    throw Error(`cabinet prose/table commitment absent: ${text}`);
  const account = readFileSync(resolve(__dirname, "../../docs/accounts/models/legacy-fitout.md"), "utf8");
  const cited = [...new Set([...account.matchAll(/cabinet\/([a-z-]+\/[0-9]+x[0-9]+x[0-9]+\/(?:closed|open))/g)].map((match) => match[1]))];
  for (const id of cited) if (!variants.includes(id)) throw Error(`cabinet account variant ${id} missing from model H2`);
  for (const id of variants) {
    const match = /^([a-z-]+)\/(\d+)x(\d+)x(\d+)\/(closed|open)$/.exec(id);
    if (!match) throw Error(`bad cabinet variant ${id}`);
    if (match[1] === "open-shelf" ? match[5] !== "open" : match[5] !== "closed")
      throw Error(`bad delivered state ${id}`);
  }
  return { spec, variants, h2 };
}

/** @param {Part[]} parts @param {string} id @param {string} shape @param {[number,number]} x @param {[number,number]} y @param {[number,number]} z @param {string} contact */
function add(parts, id, shape, x, y, z, contact) {
  if (!(x[1] > x[0] && y[1] > y[0] && z[1] > z[0])) throw Error(`cabinet ${id}: zero-width part`);
  parts.push({ id, shape, x, y, z, contact });
}

/** @param {CabinetSpec} p @param {string} id @param {boolean} opened */
function assemble(p, id, opened) {
  const match = /^([a-z-]+)\/(\d+)x(\d+)x(\d+)\/(closed|open)$/.exec(id);
  if (!match) throw Error(`cabinet variant ${id} invalid`);
  const [, kind, wm, hm, dm] = match;
  const W = Number(wm) / 1000, H = Number(hm) / 1000, D = Number(dm) / 1000;
  const state = id.replace(/\/(closed|open)$/, opened ? "/inspection-open" : "/delivered");
  /** @type {Part[]} */ const parts = [];
  /** @type {Assembly["voids"]} */ const voids = [];
  /** @type {Assembly["pieces"]} */ const pieces = [];
  const halfW = W / 2, halfD = D / 2;
  const wall = kind === "wall", island = kind === "island-base";
  const toeY = wall ? 0 : p.toe;
  const lower = toeY + p.panel, upper = H - p.panel;
  const front = kind === "open-shelf" ? halfD : halfD - p.frontInset, backInner = -halfD + p.back;
  if (island) {
    // The island uses Z for its 2.65 m long side; X is its service front.
    const zEnd = halfD - p.panel;
    add(parts, "bottom", "box", span(-halfW + 0.022, halfW), span(p.toe, p.toe + p.panel), span(-halfD, halfD), "toe,end-negative,end-positive");
    add(parts, "top", "box", span(-halfW + 0.022, halfW), span(upper, H), span(-halfD, halfD), "end-negative,end-positive,dining-side");
    voids.push({ host: "top", x: span(-0.34, 0.18), y: span(upper, H), z: span(0.45, 0.85) });
    add(parts, "toe", "box", span(-halfW, halfW), span(0, p.toe), span(-halfD, halfD - 0.05), "ground,bottom");
    add(parts, "end-negative", "box", span(-halfW + 0.022, halfW), span(lower, upper), span(-halfD, -zEnd), "bottom,top,dining-side");
    add(parts, "end-positive", "box", span(-halfW + 0.022, halfW), span(lower, upper), span(zEnd, halfD), "bottom,top,dining-side");
    add(parts, "dining-side", "box", span(halfW - p.panel, halfW), span(lower, upper), span(-zEnd, zEnd), "bottom,top,end-negative,end-positive");
    add(parts, "service-strip-bottom", "box", span(-halfW, -halfW + 0.022),
      span(p.toe, lower + p.seam), span(-zEnd, zEnd), "toe,bottom");
    add(parts, "service-strip-top", "box", span(-halfW, -halfW + 0.022),
      span(upper - p.seam, H), span(-zEnd, zEnd), "top");
    const shelfCount = Math.max(1, Math.ceil((H - p.toe) / p.shelfPitch));
    for (let j = 1; j < shelfCount; j++) {
      const y = p.toe / 2 + j * (H - p.toe) / shelfCount;
      add(parts, `shelf-${j}`, "box", span(-halfW + 0.022, halfW - p.panel), span(y - p.panel / 2, y + p.panel / 2), span(-zEnd, zEnd), "end-negative,end-positive,dining-side");
    }
    const count = Math.ceil((D - 0.008) / p.leafMaximum);
    const width = (D - (count + 1) * p.islandSeam) / count;
    for (let j = 1; j < count; j++) {
      const seamZ = -halfD + p.islandSeam + j * width + (j - 0.5) * p.islandSeam;
      add(parts, `service-stile-${j}`, "box", span(-halfW + 0.022, -halfW + 0.040),
        span(lower, upper), span(seamZ - 0.009, seamZ + 0.009), "bottom,top");
      for (let k = 1; k < shelfCount; k++) {
        const y = p.toe / 2 + k * (H - p.toe) / shelfCount;
        voids.push({ host: `shelf-${k}`, x: span(-halfW + 0.022, -halfW + 0.040),
          y: span(y - p.panel / 2, y + p.panel / 2), z: span(seamZ - 0.009, seamZ + 0.009) });
      }
    }
    for (let i = 0; i < count; i++) {
      const z0 = -halfD + p.islandSeam + i * (width + p.islandSeam);
      const z1 = z0 + width;
      const hz = z0 + 0.009, hx = -halfW + 0.013;
      const doorY = span(lower + p.seam, upper - p.seam);
      const doorX = opened ? span(hx - (z1 - hz), hx - (z0 - hz)) : span(-halfW, -halfW + p.doorThickness);
      const doorZ = opened ? span(hz - 0.013, hz + 0.005) : span(z0, z1);
      add(parts, `service-door-${i}`, "box", doorX, doorY, doorZ,
        `service-hinge-${2*i},service-hinge-${2*i+1}`);
      /** @param {[number,number]} x @param {[number,number]} z */
      const rotate = (x, z) => opened
        ? { x: span(hx - (z[1] - hz), hx - (z[0] - hz)), z: span(hz + x[0] - hx, hz + x[1] - hx) }
        : { x, z };
      for (let j = 0; j < 2; j++) {
        const cy = j ? 0.71 : 0.16, hingeId = `service-hinge-${2*i+j}`;
        const recess = rotate(span(-halfW + 0.005, -halfW + p.doorThickness), span(hz - p.hingeRadius, hz + p.hingeRadius));
        voids.push({ host: `service-door-${i}`, x: recess.x,
          y: span(cy - p.hingeDepth / 2, cy + p.hingeDepth / 2), z: recess.z });
        if (opened) voids.push({ host: `service-door-${i}`, x: span(Math.max(doorX[0], -halfW - 0.02), doorX[1]),
          y: span(cy - p.hingeDepth / 2, cy + p.hingeDepth / 2), z: doorZ });
        add(parts, hingeId, "curved", span(-halfW + 0.005, -halfW + 0.022),
          span(cy - p.hingeDepth / 2, cy + p.hingeDepth / 2), span(hz - p.hingeRadius, hz + p.hingeRadius),
          `service-door-${i},${i ? `service-stile-${i}` : "end-negative"}`);
        pieces.push({ host: hingeId, x: span(-halfW + 0.005, -halfW + p.doorThickness),
          y: span(cy - p.hingeDepth / 2, cy + p.hingeDepth / 2), z: span(hz - p.hingeRadius, hz + p.hingeRadius) });
        pieces.push({ host: hingeId, x: span(-halfW + p.doorThickness, -halfW + 0.022),
          y: span(cy - p.hingeDepth / 2, cy + p.hingeDepth / 2), z: span(hz - p.hingeRadius, hz + p.hingeRadius) });
      }
      const handleZ = z1 - 0.055, hy = p.toe + p.seam + 0.55 * (H - 0.086);
      const handle = rotate(span(-halfW, -halfW + p.handleDepth),
        span(handleZ - p.handleWidth / 2, handleZ + p.handleWidth / 2));
      voids.push({ host: `service-door-${i}`, x: handle.x,
        y: span(hy - p.handleHeight / 2, hy + p.handleHeight / 2), z: handle.z });
      add(parts, `service-handle-${i}`, "box", handle.x,
        span(hy - p.handleHeight / 2, hy + p.handleHeight / 2), handle.z, `service-door-${i}`);
    }
  } else {
    add(parts, "back", "box", span(-halfW, halfW), span(toeY, upper), span(-halfD, backInner), wall ? "cleat-0,bottom,top" : "toe,bottom,top");
    add(parts, "bottom", "box", span(-halfW, halfW), span(toeY, lower), span(backInner, front), "back,side-left,side-right");
    add(parts, "top", "box", span(-halfW, halfW), span(upper, H), span(-halfD, front), "back,side-left,side-right");
    add(parts, "side-left", "box", span(-halfW, -halfW + p.panel), span(lower, upper), span(backInner, front), "back,bottom,top");
    add(parts, "side-right", "box", span(halfW - p.panel, halfW), span(lower, upper), span(backInner, front), "back,bottom,top");
    if (!wall) add(parts, "toe", "box", span(-halfW, halfW), span(0, p.toe), span(-halfD, halfD - 0.05), "ground,back,bottom");
    if (wall) for (const [i, x] of [-(halfW - 0.12), halfW - 0.12].entries())
      add(parts, `cleat-${i}`, "box", span(x - 0.04, x + 0.04), span(0.13, 0.19), span(-halfD - 0.025, -halfD), "back,wall");
    if (wall) add(parts, "fixed-front-bottom", "box", span(-halfW, halfW),
      span(0, p.toe + p.seam), span(front, halfD), "side-left,side-right,bottom");
    if (kind === "vanity") voids.push({ host: "top", x: span(-(0.68 * W + 0.04) / 2, (0.68 * W + 0.04) / 2),
      y: span(upper, H), z: span(-0.145, 0.195) });
    if (["open-shelf", "tall", "service", "wall", "bench-base"].includes(kind)) {
      const count = Math.max(1, Math.ceil((H - p.toe) / p.shelfPitch));
      const divided = kind === "tall" && W >= 1.30;
      if (divided) {
        add(parts, "divider", "box", span(0.10 * W, 0.10 * W + p.panel), span(lower, upper),
          span(backInner, halfD - p.panel), "bottom,top");
        const rodLength = 0.60 * W - p.panel, cx = -0.20 * W + 0.009;
        add(parts, "rod", "cylinder", span(cx - rodLength / 2, cx + rodLength / 2),
          span(H - 0.35 - 0.0125, H - 0.35 + 0.0125), span(-0.0925, -0.0675), "side-left,divider");
      }
      for (let j = 1; j < count; j++) {
        const center = wall ? j * H / count : p.toe / 2 + j * (H - p.toe) / count;
        add(parts, `shelf-${j}`, "box",
          divided ? span(0.10 * W + p.panel, halfW - p.panel) : span(-halfW + p.panel, halfW - p.panel),
          span(center - p.panel / 2, center + p.panel / 2), span(backInner, front), divided ? "divider,side-right,back" : "side-left,side-right,back");
      }
      if (kind !== "open-shelf") {
        const count = Math.max(2, Math.ceil((W - 0.006) / p.leafMaximum));
        const width = (W - (count + 1) * p.seam) / count;
        for (let j = 1; j < count; j++) {
          const cx = -halfW + p.seam + j * width + (j - 0.5) * p.seam;
          add(parts, `stile-${j}`, "box", span(cx - p.panel / 2, cx + p.panel / 2),
            span(lower, upper), span(halfD - 0.041, front), "bottom,top");
          if (kind === "tall" && W >= 1.30 && cx + p.panel / 2 > 0.10 * W &&
            cx - p.panel / 2 < 0.10 * W + p.panel)
            voids.push({ host: "divider", x: span(Math.max(cx - p.panel / 2, 0.10 * W),
              Math.min(cx + p.panel / 2, 0.10 * W + p.panel)),
              y: span(lower, upper), z: span(halfD - 0.041, halfD - p.panel) });
          for (let k = 1; k < Math.max(1, Math.ceil((H - p.toe) / p.shelfPitch)); k++) {
            const y = wall ? k * H / Math.max(1, Math.ceil((H - p.toe) / p.shelfPitch))
              : p.toe / 2 + k * (H - p.toe) / Math.max(1, Math.ceil((H - p.toe) / p.shelfPitch));
            if (kind !== "tall" || W < 1.30 || cx >= 0.10 * W + p.panel)
              voids.push({ host: `shelf-${k}`, x: span(cx - p.panel / 2, cx + p.panel / 2),
                y: span(y - p.panel / 2, y + p.panel / 2), z: span(halfD - 0.041, front) });
          }
        }
        for (let i = 0; i < count; i++) {
          const x0 = -halfW + p.seam + i * (width + p.seam), x1 = x0 + width;
          const hx = i % 2 ? x1 - 0.013 : x0 + 0.013, hz = halfD - 0.009;
          const doorX = !opened ? span(x0, x1) : i % 2
            ? span(hx + (halfD - p.doorThickness - hz), hx + (halfD - hz))
            : span(hx - (halfD - hz), hx - (halfD - p.doorThickness - hz));
          const doorZ = !opened ? span(halfD - p.doorThickness, halfD) : i % 2
            ? span(hz - (x1 - hx), hz - (x0 - hx)) : span(hz + (x0 - hx), hz + (x1 - hx));
          add(parts, `door-${i}`, "box", doorX, span(p.toe + p.seam, H - p.seam), doorZ,
            `hinge-${2*i},hinge-${2*i+1}`);
          /** @param {[number,number]} x @param {[number,number]} z */
          const rotate = (x, z) => {
            if (!opened) return { x, z };
            return i % 2
              ? { x: span(hx + z[0] - hz, hx + z[1] - hz), z: span(hz - (x[1] - hx), hz - (x[0] - hx)) }
              : { x: span(hx - (z[1] - hz), hx - (z[0] - hz)), z: span(hz + x[0] - hx, hz + x[1] - hx) };
          };
          for (let j = 0; j < 2; j++) {
            const cy = j ? H - p.hingeY : p.hingeY;
            const recess = rotate(span(hx - p.hingeRadius, hx + p.hingeRadius), span(halfD - p.doorThickness, halfD - 0.001));
            voids.push({ host: `door-${i}`, x: recess.x,
              y: span(cy - p.hingeDepth / 2, cy + p.hingeDepth / 2), z: recess.z });
            if (opened) voids.push({ host: `door-${i}`, x: doorX,
              y: span(cy - p.hingeDepth / 2, cy + p.hingeDepth / 2),
              z: span(doorZ[0], Math.min(doorZ[1], halfD - 0.001)) });
            add(parts, `hinge-${2*i+j}`, "curved", span(hx - p.hingeRadius, hx + p.hingeRadius),
              span(cy - p.hingeDepth / 2, cy + p.hingeDepth / 2),
              span(halfD - 0.023, halfD - 0.001), `door-${i},${i % 2 === 0 ? (i === 0 ? "side-left" : `stile-${i}`) : (i === count - 1 ? "side-right" : `stile-${i+1}`)}`);
            pieces.push({ host: `hinge-${2*i+j}`, x: span(hx - p.hingeRadius, hx + p.hingeRadius),
              y: span(cy - p.hingeDepth / 2, cy + p.hingeDepth / 2), z: span(halfD - 0.023, halfD - p.doorThickness) });
            pieces.push({ host: `hinge-${2*i+j}`, x: span(hx - p.hingeRadius, hx + p.hingeRadius),
              y: span(cy - p.hingeDepth / 2, cy + p.hingeDepth / 2), z: span(halfD - p.doorThickness, halfD - 0.001) });
          }
          const handleX = i % 2 ? x0 + 0.055 : x1 - 0.055;
          const hy = p.toe + p.seam + 0.55 * (H - 0.086);
          const inset = rotate(span(handleX - p.handleWidth / 2, handleX + p.handleWidth / 2), span(halfD - p.handleDepth, halfD));
          voids.push({ host: `door-${i}`, x: inset.x, y: span(hy - p.handleHeight / 2, hy + p.handleHeight / 2), z: inset.z });
          add(parts, `handle-${i}`, "box", inset.x, span(hy - p.handleHeight / 2, hy + p.handleHeight / 2), inset.z, `door-${i}`);
        }
      }
    }
    if (["nightstand", "vanity", "media", "kitchen-base"].includes(kind)) {
      add(parts, "fixed-front", "box", span(-halfW, halfW), span(toeY, upper),
        span(front, halfD), "side-left,side-right");
      const simple = kind === "nightstand" || kind === "vanity";
      if (kind === "media" || kind === "kitchen-base") {
        const inner = kind === "media" ? 0.08 * W : 0.32;
        for (const sign of [-1, 1]) {
          const x = sign < 0 ? span(-inner - p.panel, -inner) : span(inner, inner + p.panel);
          add(parts, sign < 0 ? "bay-divider-left" : "bay-divider-right", "box", x,
            span(lower, upper), span(backInner, front), "bottom,top,back");
        }
        if (kind === "media")
          voids.push({ host: "fixed-front", x: span(-0.08 * W, 0.08 * W),
            y: span(lower, upper), z: span(front, halfD) });
        else {
          voids.push({ host: "fixed-front", x: span(-0.32, 0.32),
            y: span(0.15, 0.74), z: span(front, halfD) });
          add(parts, "oven-sill", "box", span(-0.32, 0.32), span(lower, 0.15),
            span(backInner, front), "bottom,bay-divider-left,bay-divider-right");
        }
      }
      /** @type {{x:[number,number],y:[number,number]}[]} */
      const drawerRects = [];
      if (kind === "nightstand" || kind === "vanity") {
        const centers = kind === "nightstand" ? [0.16, 0.34] : [0.25, 0.57];
        const height = kind === "nightstand" ? 0.14 : 0.24;
        for (const cy of centers) drawerRects.push({ x: span(-halfW + 0.006, halfW - 0.006),
          y: span(cy - height / 2, cy + height / 2) });
      } else if (kind === "media") {
        const drawerWidth = 0.42 * W - 0.006;
        for (const sign of [-1, 1]) drawerRects.push({ x: span(sign * 0.29 * W - drawerWidth / 2,
          sign * 0.29 * W + drawerWidth / 2), y: span(0.19, 0.37) });
      } else {
        const drawerWidth = (W - 0.64) / 2 - 0.006;
        for (const sign of [-1, 1]) for (const cy of [0.20, 0.44, 0.68])
          drawerRects.push({ x: span(sign * (0.32 + ((W - 0.64) / 4)) - drawerWidth / 2,
            sign * (0.32 + ((W - 0.64) / 4)) + drawerWidth / 2), y: span(cy - 0.10, cy + 0.10) });
      }
      for (const [i, rect] of drawerRects.entries()) {
        const drawerId = `drawer-${i}`, facadeZ = halfD - p.doorThickness;
        const boxX = span(rect.x[0] + 0.015, rect.x[1] - 0.015);
        const boxY = span(rect.y[0] + 0.015, rect.y[1] - 0.010);
        const boxZ = span(-halfD + 0.020, facadeZ);
        const thickness = p.drawerWall;
        add(parts, drawerId, "hollow", rect.x, rect.y, span(boxZ[0], halfD),
          simple ? `runner-${i}-left,runner-${i}-right,handle-${i}`
            : `${rect.x[0] < 0 ? "side-left" : "bay-divider-right"},${rect.x[0] < 0 ? "bay-divider-left" : "side-right"},handle-${i}`);
        /** @param {[number,number]} x @param {[number,number]} y @param {[number,number]} z */
        const put = (x, y, z) => pieces.push({ host: drawerId, x, y, z });
        put(rect.x, rect.y, span(facadeZ, halfD));
        put(boxX, span(boxY[0], boxY[0] + thickness), boxZ);
        put(span(boxX[0], boxX[0] + thickness), span(boxY[0] + thickness, boxY[1]), boxZ);
        put(span(boxX[1] - thickness, boxX[1]), span(boxY[0] + thickness, boxY[1]), boxZ);
        put(span(boxX[0] + thickness, boxX[1] - thickness), span(boxY[0] + thickness, boxY[1]),
          span(boxZ[0], boxZ[0] + thickness));
        voids.push({ host: "fixed-front", x: span(rect.x[0] - p.seam, rect.x[1] + p.seam),
          y: span(rect.y[0] - p.seam, rect.y[1] + p.seam), z: span(front, halfD) });
        if (simple) for (const sign of [-1, 1]) {
          const runnerX = sign < 0
            ? span(-halfW + p.panel, boxX[0])
            : span(boxX[1], halfW - p.panel);
          add(parts, `runner-${i}-${sign < 0 ? "left" : "right"}`, "box", runnerX,
            span(boxY[0] + thickness, boxY[0] + 2 * thickness), span(boxZ[0], front),
            `${sign < 0 ? "side-left" : "side-right"},${drawerId}`);
        }
        const handleY = (rect.y[0] + rect.y[1]) / 2;
        const handleX = (rect.x[0] + rect.x[1]) / 2;
        const handle = { x: span(handleX - 0.08, handleX + 0.08),
          y: span(handleY - p.handleWidth / 2, handleY + p.handleWidth / 2),
          z: span(halfD - p.handleDepth, halfD) };
        voids.push({ host: drawerId, ...handle });
        add(parts, `handle-${i}`, "box", handle.x, handle.y, handle.z, drawerId);
      }
    }
  }
  const zMin = wall ? -halfD - 0.025 : -halfD;
  const zMax = opened && !island ? halfD + (W - (Math.max(2, Math.ceil((W-0.006)/p.leafMaximum)) + 1)*p.seam) /
    Math.max(2, Math.ceil((W-0.006)/p.leafMaximum)) - 0.022 : halfD;
  const envelope = island ? { x: span(opened ? -0.9432 : -halfW, halfW), y: span(0, H), z: span(-halfD, halfD) }
    : { x: span(-halfW, halfW), y: span(0, H), z: span(zMin, zMax) };
  return { state, envelope, parts, voids, pieces };
}

/** @param {ReturnType<typeof specification>} input */
function assemblies(input) {
  return input.variants.flatMap((id) => {
    const normal = assemble(input.spec, id, false);
    return /^(tall|service|wall|bench-base|island-base)\//.test(id)
      ? [normal, assemble(input.spec, id, true)] : [normal];
  });
}

/** @param {ReturnType<typeof specification>} input */
function render(input) {
  /** @type {string[]} */ const out = [];
  for (const item of assemblies(input)) {
    out.push(`@inventory ${item.state}: ${item.parts.map((part) => part.id).join(", ")}`, "");
    for (const cut of item.voids) out.push(`@void ${item.state}: ${cut.host}, ${extent(cut.x)}, ${extent(cut.y)}, ${extent(cut.z)}`);
    for (const piece of item.pieces) out.push(`@piece ${item.state}: ${piece.host}, ${extent(piece.x)}, ${extent(piece.y)}, ${extent(piece.z)}`);
    out.push("| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |");
    const e = item.envelope;
    out.push(`| @envelope | ${item.state} | * | bounds | ${extent(e.x)} | ${extent(e.y)} | ${extent(e.z)} | - |`);
    for (const part of item.parts) out.push(`| @part | ${item.state} | ${part.id} | ${part.shape} | ${extent(part.x)} | ${extent(part.y)} | ${extent(part.z)} | ${part.contact} |`);
    out.push("");
  }
  return out.join("\n").trimEnd();
}

/** @param {string} source */
function check(source) {
  const input = specification(source);
  const start = source.indexOf(startMarker), end = source.indexOf(endMarker);
  if (start < 0 || end <= start) throw Error("cabinet generated block absent");
  const actual = source.slice(start + startMarker.length, end).trim().replace(/\r\n/g, "\n");
  if (actual !== render(input)) throw Error("cabinet table differs from authored formulas and variants");
  return assemblies(input);
}

if (require.main === module) {
  const source = readFileSync(documentPath, "utf8");
  if (process.argv[2] === "--write") {
    const input = specification(source);
    const start = source.indexOf(startMarker), end = source.indexOf(endMarker);
    if (start < 0 || end <= start) throw Error("cabinet generated markers absent");
    writeFileSync(documentPath, source.slice(0, start + startMarker.length) + "\n" +
      render(input) + "\n" + source.slice(end), "utf8");
  } else check(source);
}

module.exports = { specification, assemble, assemblies, render, check };
