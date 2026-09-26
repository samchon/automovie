// Measures authored model-part envelopes and contacts before modelSources exist.
// Each `@part` row is inside its prototype H2, beside the prose that owns it.
// Run from the production root: node src/review/model-part-audit.cjs
const fs = require("node:fs");
const path = require("node:path");
const { randomInt } = require("node:crypto");
const plantProducer = require("./model-plant-producer.cjs");
const cabinetProducer = require("./model-cabinet-producer.cjs");

const root = path.resolve(__dirname, "../..");
const names = fs.readdirSync(path.join(root, "docs/models"))
  .filter((name) => /^(?!000)\d{3}-.+\.md$/.test(name)).sort((a, b) => a.localeCompare(b))
  .map((name) => name.slice(0, -3));
const epsilon = 0.000001;
/** @typedef {{state:string,id:string,shape:string,x:[number,number],y:[number,number],z:[number,number],contact:string[]}} Part */
/** @typedef {{x:[number,number],y:[number,number],z:[number,number]}} Bounds */
/** @typedef {{guest:string,host:string,axis:string,plane:number,u:[number,number],v:[number,number]}} FlatContact */
/** @typedef {{section:"round"|"ellipse",bottomDivisor:number,shoulderNumerator:number,shoulderDenominator:number,wallDivisor:number,mouthRadius:number}} CavityProfile */

function sections() {
  /** @type {Map<string, string[]>} */
  const result = new Map();
  for (const name of names) {
    const lines = fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8").split(/\r?\n/);
    let anchor;
    for (const line of lines) {
      const h2 = /^## .*\{#([^}]+)\}/.exec(line);
      if (h2) {
        anchor = h2[1];
        if (result.has(anchor)) throw Error(`duplicate H2 ${anchor}`);
        result.set(anchor, []);
      } else if (anchor) result.get(anchor)?.push(line);
    }
  }
  return result;
}

/** @param {string} source @param {string} label @returns {[number,number]} */
function interval(source, label) {
  const match = /^\s*([−-]?(?:\d+\.)?\d+)\.\.([−-]?(?:\d+\.)?\d+)\s*$/.exec(source);
  if (!match) throw Error(`${label}: expected min..max, got ${source}`);
  /** @type {[number,number]} */
  const bounds = [Number(match[1].replace("−", "-")), Number(match[2].replace("−", "-"))];
  if (!bounds.every(Number.isFinite) || bounds[1] - bounds[0] <= epsilon)
    throw Error(`${label}: empty or invalid ${source}`);
  return bounds;
}

/** @param {string[]} lines @param {string} anchor */
function parse(lines, anchor) {
  const rows = lines.filter((line) => /^\| @(envelope|part) \|/.test(line));
  /** @type {Map<string, Part>} */
  const envelopes = new Map();
  /** @type {Map<string, Part>} */
  const parts = new Map();
  /** @type {Map<string, string[]>} */
  const inventory = new Map();
  /** @type {Map<string,{anchor:string,state:string,offset:[number,number,number]}>} */
  const compositions = new Map();
  /** @type {Map<string,{anchor:string,state:string,part:string,offset:[number,number,number]}>} */
  const supportBindings = new Map();
  /** @type {Map<string,string>} */
  const pinFaces = new Map();
  /** @type {Map<string,string>} */
  const emitterFaces = new Map();
  /** @type {Set<string>} */
  const miterJoints = new Set();
  /** @type {Map<string, {x:[number,number],y:[number,number],z:[number,number]}[]>} */
  const voids = new Map();
  /** @type {Map<string, Bounds[]>} */
  const pieces = new Map();
  /** @type {Map<string,{y:[number,number],z:[number,number],halfDepth:number}>} */
  const shearsZ = new Map();
  /** @type {Map<string,{inner:number,outer:number,centerX:number,centerZ:number}>} */
  const radial = new Map();
  /** @type {Map<string,{inner:number,outer:number,centerX:number,centerY:number}>} */
  const radialZ = new Map();
  /** @type {Map<string,{radius:number,y:[number,number]}>} */
  const bores = new Map();
  /** @type {Map<string,CavityProfile>} */
  const cavityProfiles = new Map();
  /** @type {Map<string,{centerX:number,centerY:number,radius:number,z:[number,number]}>} */
  const boresZ = new Map();
  /** @type {Map<string,{x:[number,number],centerY:number,centerZ:number,radius:number}>} */
  const boresX = new Map();
  /** @type {Map<string,{innerX:number,innerZ:number,outerX:number,outerZ:number,centerX:number,centerZ:number}>} */
  const ellipses = new Map();
  /** @type {Map<string,{host:string,guest:string,radius:number,halfWidth:number}>} */
  const tangents = new Map();
  /** @type {Map<string,FlatContact>} */
  const flatContacts = new Map();
  /** @type {Map<string,{first:string,second:string,axis:string,side:string}>} */
  const capContacts = new Map();
  /** @type {Map<string,{host:string,guest:string,axis:string}>} */
  const cavityContacts = new Map();
  /** @type {Map<string,{shell:string,cover:string,c0:number,c1:number,c2:number,shellDepth:number,coverDepth:number,seatGap:number}>} */
  const curveLayers = new Map();
  /** @type {Map<string,{host:string,guest:string,originY:number,spanY:number,c0:number,c1:number,hostDepth:number,gap:number,guestDepth:number}>} */
  const linearCurves = new Map();
  /** @type {Map<string,{prefix:string,cols:number,rows:number,pitchX:number,pitchZ:number,width:number,depth:number,y:[number,number],contact:string}>} */
  const grids = new Map();
  for (const line of lines) {
    const cap = /^@cap-contact\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([XYZ]),\s*([+-])$/.exec(line);
    if (cap) {
      const state = cap[1].trim(), first = cap[2].trim(), second = cap[3].trim();
      const key = `${state}/${[first, second].sort((a, b) => a.localeCompare(b)).join("/")}`;
      if (capContacts.has(key)) throw Error(`${anchor}/${key}: duplicate cap contact`);
      capContacts.set(key, { first, second, axis: cap[4].toLowerCase(), side: cap[5] });
    }
    const cavityContact = /^@cavity-contact\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([XYZ])$/.exec(line);
    if (cavityContact) {
      const state = cavityContact[1].trim(), host = cavityContact[2].trim(), guest = cavityContact[3].trim();
      const key = `${state}/${[host, guest].sort((a, b) => a.localeCompare(b)).join("/")}`;
      if (cavityContacts.has(key)) throw Error(`${anchor}/${key}: duplicate cavity contact`);
      cavityContacts.set(key, { host, guest, axis: cavityContact[4].toLowerCase() });
    }
    const support = /^@support\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+)$/.exec(line);
    if (support) {
      const state = support[1].trim();
      if (supportBindings.has(state)) throw Error(`${anchor}/${state}: duplicate support binding`);
      const offset = /** @type {[number,number,number]} */ (support.slice(5, 8).map((value) => Number(value.replace("−", "-"))));
      if (!offset.every(Number.isFinite)) throw Error(`${anchor}/${state}: invalid support offset`);
      supportBindings.set(state, { anchor: support[2].trim(), state: support[3].trim(), part: support[4].trim(), offset });
    }
    const pin = /^@pin-face\s+([^:]+):\s*([^,]+),\s*([^,]+)$/.exec(line);
    if (pin) {
      const key = `${pin[1].trim()}/${pin[2].trim()}`;
      if (pinFaces.has(key)) throw Error(`${anchor}/${key}: duplicate pin face`);
      pinFaces.set(key, pin[3].trim());
    }
    const emitter = /^@emitter-face\s+([^:]+):\s*([^,]+),\s*(-Y)$/.exec(line);
    if (emitter) {
      const state = emitter[1].trim();
      if (emitterFaces.has(state)) throw Error(`${anchor}/${state}: duplicate emitter face`);
      emitterFaces.set(state, emitter[2].trim());
    }
    const composed = /^@compose\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+)$/.exec(line);
    if (composed) {
      const state = composed[1].trim();
      if (compositions.has(state)) throw Error(`${anchor}: duplicate composition ${state}`);
      const offset = /** @type {[number,number,number]} */ (composed.slice(4, 7).map((value) => Number(value.replace("−", "-"))));
      if (!offset.every(Number.isFinite)) throw Error(`${anchor}/${state}: invalid composition offset`);
      compositions.set(state, { anchor: composed[2].trim(), state: composed[3].trim(), offset });
    }
    const list = /^@inventory\s+([^:]+):\s*(.+)$/.exec(line);
    if (list) {
      const state = list[1].trim();
      if (inventory.has(state)) throw Error(`${anchor}: duplicate inventory ${state}`);
      const names = list[2].split(",").map((value) => value.trim()).flatMap((name) => {
        const range = /^(.+)-(\d+)\.\.(\d+)$/.exec(name);
        if (!range) return [name];
        const start = Number(range[2]), end = Number(range[3]);
        if (end < start || end - start > 999) throw Error(`${anchor}: invalid inventory range ${name}`);
        return Array.from({ length: end - start + 1 }, (_, i) => `${range[1]}-${start + i}`);
      });
      inventory.set(state, names);
    }
    const joint = /^@joint\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*(miter45-xz)$/.exec(line);
    if (joint) miterJoints.add(`${joint[1].trim()}/${[joint[2].trim(), joint[3].trim()].sort((a, b) => a.localeCompare(b)).join("/")}`);
    const cut = /^@void\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+)$/.exec(line);
    if (cut) {
      const state = cut[1].trim(), host = cut[2].trim(), key = `${state}/${host}`;
      const region = { x: interval(cut[3], `${anchor}/${key}/void-x`),
        y: interval(cut[4], `${anchor}/${key}/void-y`), z: interval(cut[5], `${anchor}/${key}/void-z`) };
      voids.set(key, [...(voids.get(key) || []), region]);
    }
    const segment = /^@piece\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+)$/.exec(line);
    if (segment) {
      const state = segment[1].trim(), host = segment[2].trim(), key = `${state}/${host}`;
      const region = { x: interval(segment[3], `${anchor}/${key}/piece-x`),
        y: interval(segment[4], `${anchor}/${key}/piece-y`), z: interval(segment[5], `${anchor}/${key}/piece-z`) };
      pieces.set(key, [...(pieces.get(key) || []), region]);
    }
    const shear = /^@shear-z\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([\d.]+)$/.exec(line);
    if (shear) {
      const key = `${shear[1].trim()}/${shear[2].trim()}`;
      if (shearsZ.has(key)) throw Error(`${anchor}/${key}: duplicate shear-z`);
      shearsZ.set(key, { y: interval(shear[3], `${anchor}/${key}/shear-y`),
        z: interval(shear[4], `${anchor}/${key}/shear-z`), halfDepth: Number(shear[5]) });
    }
    const ring = /^@radial\s+([^:]+):\s*([^,]+),\s*([\d.]+),\s*([\d.]+)$/.exec(line);
    if (ring) {
      const key = `${ring[1].trim()}/${ring[2].trim()}`;
      if (radial.has(key)) throw Error(`${anchor}/${key}: duplicate radial declaration`);
      const inner = Number(ring[3]), outer = Number(ring[4]);
      if (!(inner >= 0 && outer > inner)) throw Error(`${anchor}/${key}: invalid radial interval`);
      radial.set(key, { inner, outer, centerX: 0, centerZ: 0 });
    }
    const offsetRing = /^@radial-at\s+([^:]+):\s*([^,]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([\d.]+),\s*([\d.]+)$/.exec(line);
    if (offsetRing) {
      const key = `${offsetRing[1].trim()}/${offsetRing[2].trim()}`;
      if (radial.has(key)) throw Error(`${anchor}/${key}: duplicate radial declaration`);
      const centerX = Number(offsetRing[3].replace("−", "-")), centerZ = Number(offsetRing[4].replace("−", "-"));
      const inner = Number(offsetRing[5]), outer = Number(offsetRing[6]);
      if (!(inner >= 0 && outer > inner)) throw Error(`${anchor}/${key}: invalid offset radial interval`);
      radial.set(key, { inner, outer, centerX, centerZ });
    }
    const faceRing = /^@radial-z\s+([^:]+):\s*([^,]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([\d.]+),\s*([\d.]+)$/.exec(line);
    if (faceRing) {
      const key = `${faceRing[1].trim()}/${faceRing[2].trim()}`;
      if (radialZ.has(key)) throw Error(`${anchor}/${key}: duplicate radial-z declaration`);
      const [centerX, centerY, inner, outer] = faceRing.slice(3).map((value) => Number(value.replace("−", "-")));
      if (!(inner >= 0 && outer > inner)) throw Error(`${anchor}/${key}: invalid radial-z interval`);
      radialZ.set(key, { inner, outer, centerX, centerY });
    }
    const bore = /^@bore\s+([^:]+):\s*([^,]+),\s*([\d.]+),\s*(.+)$/.exec(line);
    if (bore) bores.set(`${bore[1].trim()}/${bore[2].trim()}`, {
      radius: Number(bore[3]), y: interval(bore[4], `${anchor}/bore-y`) });
    const profile = /^@cavity-profile\s+([^:]+):\s*([^,]+),\s*(round|ellipse),\s*(\d+),\s*(\d+)\/(\d+),\s*(\d+),\s*([\d.]+)$/.exec(line);
    if (profile) {
      const key = `${profile[1].trim()}/${profile[2].trim()}`;
      if (cavityProfiles.has(key)) throw Error(`${anchor}/${key}: duplicate cavity profile`);
      cavityProfiles.set(key, { section: /** @type {"round"|"ellipse"} */ (profile[3]), bottomDivisor: Number(profile[4]),
        shoulderNumerator: Number(profile[5]), shoulderDenominator: Number(profile[6]),
        wallDivisor: Number(profile[7]), mouthRadius: Number(profile[8]) });
    }
    const boreZ = /^@bore-z\s+([^:]+):\s*([^,]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([\d.]+),\s*(.+)$/.exec(line);
    if (boreZ) {
      const key = `${boreZ[1].trim()}/${boreZ[2].trim()}`;
      if (boresZ.has(key)) throw Error(`${anchor}/${key}: duplicate bore-z`);
      boresZ.set(key, { centerX: Number(boreZ[3].replace("−", "-")),
        centerY: Number(boreZ[4].replace("−", "-")), radius: Number(boreZ[5]),
        z: interval(boreZ[6], `${anchor}/${key}/bore-z`) });
    }
    const boreX = /^@bore-x\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([\d.]+)$/.exec(line);
    if (boreX) {
      const key = `${boreX[1].trim()}/${boreX[2].trim()}`;
      if (boresX.has(key)) throw Error(`${anchor}/${key}: duplicate bore-x`);
      boresX.set(key, { x: interval(boreX[3], `${anchor}/${key}/bore-x`),
        centerY: Number(boreX[4].replace("−", "-")),
        centerZ: Number(boreX[5].replace("−", "-")), radius: Number(boreX[6]) });
    }
    const ellipse = /^@ellipse\s+([^:]+):\s*([^,]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([−-]?[\d.]+),\s*([−-]?[\d.]+))?$/.exec(line);
    if (ellipse) ellipses.set(`${ellipse[1].trim()}/${ellipse[2].trim()}`, {
      innerX: Number(ellipse[3]), innerZ: Number(ellipse[4]), outerX: Number(ellipse[5]), outerZ: Number(ellipse[6]),
      centerX: Number((ellipse[7] || "0").replace("−", "-")), centerZ: Number((ellipse[8] || "0").replace("−", "-")) });
    const tangent = /^@tangent\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([\d.]+),\s*([\d.]+)$/.exec(line);
    if (tangent) {
      const state = tangent[1].trim(), host = tangent[2].trim(), guest = tangent[3].trim();
      const key = `${state}/${[host, guest].sort((a, b) => a.localeCompare(b)).join("/")}`;
      if (tangents.has(key)) throw Error(`${anchor}/${key}: duplicate tangent proof`);
      tangents.set(key, { host, guest, radius: Number(tangent[4]), halfWidth: Number(tangent[5]) });
    }
    const flat = /^@flat-contact\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*(-Y|-Z),\s*([−-]?[\d.]+),\s*([^,]+),\s*([^,]+)$/.exec(line);
    if (flat) {
      const state = flat[1].trim(), guest = flat[2].trim(), host = flat[3].trim();
      const key = `${state}/${guest}/${host}`;
      if (flatContacts.has(key)) throw Error(`${anchor}/${key}: duplicate flat contact`);
      flatContacts.set(key, { guest, host, axis: flat[4], plane: Number(flat[5].replace("−", "-")),
        u: interval(flat[6], `${anchor}/${key}/flat-u`), v: interval(flat[7], `${anchor}/${key}/flat-v`) });
    }
    const curve = /^@curve-layer\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)$/.exec(line);
    if (curve) {
      const [state, shell, cover] = curve.slice(1, 4).map((value) => value.trim());
      const key = `${state}/${[shell, cover].sort((a, b) => a.localeCompare(b)).join("/")}`;
      if (curveLayers.has(key)) throw Error(`${anchor}/${key}: duplicate curve layer`);
      const [c0, c1, c2, shellDepth, coverDepth, seatGap] = curve.slice(4).map((value) => Number(value.replace("−", "-")));
      curveLayers.set(key, { shell, cover, c0, c1, c2, shellDepth, coverDepth, seatGap });
    }
    const linear = /^@curve-linear\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([−-]?[\d.]+),\s*([\d.]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)$/.exec(line);
    if (linear) {
      const [state, host, guest] = linear.slice(1, 4).map((value) => value.trim());
      const key = `${state}/${[host, guest].sort((a, b) => a.localeCompare(b)).join("/")}`;
      if (linearCurves.has(key)) throw Error(`${anchor}/${key}: duplicate linear curve`);
      const [originY, spanY, c0, c1, hostDepth, gap, guestDepth] = linear.slice(4).map((value) => Number(value.replace("−", "-")));
      linearCurves.set(key, { host, guest, originY, spanY, c0, c1, hostDepth, gap, guestDepth });
    }
    const grid = /^@grid\s+([^:]+):\s*(.+)$/.exec(line);
    if (grid) {
      const tokens = grid[2].split(",").map((value) => value.trim());
      if (tokens.length !== 9) throw Error(`${anchor}: grid requires nine values`);
      const [prefix, cols, rows, pitchX, pitchZ, width, depth, ys, contact] = tokens;
      const dimensions = [cols, rows, pitchX, pitchZ, width, depth].map(Number);
      if (!dimensions.every(Number.isFinite) || !Number.isInteger(dimensions[0]) || !Number.isInteger(dimensions[1]) ||
        dimensions[0] < 1 || dimensions[1] < 1 || dimensions[0] * dimensions[1] > 999)
        throw Error(`${anchor}: invalid grid dimensions`);
      if (grids.has(grid[1].trim())) throw Error(`${anchor}: duplicate grid state`);
      grids.set(grid[1].trim(), { prefix, cols: dimensions[0], rows: dimensions[1], pitchX: dimensions[2],
        pitchZ: dimensions[3], width: dimensions[4], depth: dimensions[5],
        y: interval(ys, `${anchor}/grid-y`), contact });
    }
  }
  for (const line of rows) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 8) throw Error(`${anchor}: eight cells required in ${line}`);
    const [kind, state, id, shape, xs, ys, zs, contact] = cells;
    const entry = { state, id, shape, x: interval(xs, `${anchor}/${state}/${id}/x`),
      y: interval(ys, `${anchor}/${state}/${id}/y`), z: interval(zs, `${anchor}/${state}/${id}/z`),
      contact: contact === "-" ? [] : contact.split(",").map((value) => value.trim()) };
    const key = `${state}/${id}`;
    if (kind === "@envelope") {
      if (id !== "*" || shape !== "bounds" || envelopes.has(state))
        throw Error(`${anchor}: duplicate or invalid envelope ${key}`);
      envelopes.set(state, entry);
    } else {
      if (!["box", "cylinder", "curved", "hollow", "mitered-box"].includes(shape) || parts.has(key))
        throw Error(`${anchor}: duplicate or invalid part ${key}`);
      parts.set(key, entry);
    }
  }
  for (const [state, grid] of grids) for (let row = 0; row < grid.rows; row++) for (let col = 0; col < grid.cols; col++) {
    const id = `${grid.prefix}-${row * grid.cols + col}`;
    const centerX = (col - (grid.cols - 1) / 2) * grid.pitchX;
    const centerZ = (row - (grid.rows - 1) / 2) * grid.pitchZ;
    const entry = { state, id, shape: "box", x: /** @type {[number,number]} */ ([centerX - grid.width / 2, centerX + grid.width / 2]),
      y: grid.y, z: /** @type {[number,number]} */ ([centerZ - grid.depth / 2, centerZ + grid.depth / 2]),
      contact: [grid.contact] };
    if (parts.has(`${state}/${id}`)) throw Error(`${anchor}: grid part duplicate ${state}/${id}`);
    parts.set(`${state}/${id}`, entry);
  }
  return { envelopes, parts, inventory, compositions, supportBindings, pinFaces, emitterFaces, miterJoints, voids, pieces, shearsZ, radial, radialZ, bores, cavityProfiles, boresZ, boresX, ellipses, tangents, flatContacts, capContacts, cavityContacts, curveLayers, linearCurves, grids };
}

/** @param {Part} emitter @param {Part[]} blockers @param {Map<string,{inner:number,outer:number,centerX:number,centerZ:number}>} radial @param {string} state */
function visibleEmitterFraction(emitter, blockers, radial, state) {
  const radius = radial.get(`${state}/${emitter.id}`);
  if (!radius) return 0;
  let areaSamples = 0, visibleSamples = 0;
  const steps = 80;
  for (let ix = 0; ix < steps; ix++) for (let iz = 0; iz < steps; iz++) {
    const x = emitter.x[0] + (ix + 0.5) * (emitter.x[1] - emitter.x[0]) / steps;
    const z = emitter.z[0] + (iz + 0.5) * (emitter.z[1] - emitter.z[0]) / steps;
    const distance = Math.hypot(x - radius.centerX, z - radius.centerZ);
    if (distance < radius.inner || distance > radius.outer) continue;
    areaSamples++;
    const blocked = blockers.some((part) => {
      if (part.id === emitter.id || part.y[0] >= emitter.y[0] - epsilon ||
        x < part.x[0] || x > part.x[1] || z < part.z[0] || z > part.z[1]) return false;
      const ring = radial.get(`${state}/${part.id}`);
      if (!ring) return true;
      const d = Math.hypot(x - ring.centerX, z - ring.centerZ);
      return d >= ring.inner && d <= ring.outer;
    });
    if (!blocked) visibleSamples++;
  }
  return areaSamples ? visibleSamples / areaSamples : 0;
}

// Area of an X-axis pin's circular end cap inside a rectangular target face.
// AABB contact alone accepts a tangent line; a positive disk/face intersection
// is required. Midpoint quadrature is deterministic and its 2048 slices are
// much finer than the authored 1 mm coordinate precision.
/** @param {Part} pin @param {Part} target */
function pinFaceArea(pin, target) {
  const endMeetsFace = Math.abs(pin.x[1] - target.x[0]) <= epsilon ||
    Math.abs(pin.x[0] - target.x[1]) <= epsilon;
  const radiusY = (pin.y[1] - pin.y[0]) / 2;
  const radiusZ = (pin.z[1] - pin.z[0]) / 2;
  if (!endMeetsFace || Math.abs(radiusY - radiusZ) > epsilon) return 0;
  const centerY = (pin.y[0] + pin.y[1]) / 2;
  const centerZ = (pin.z[0] + pin.z[1]) / 2;
  const z0 = Math.max(pin.z[0], target.z[0]);
  const z1 = Math.min(pin.z[1], target.z[1]);
  if (z1 <= z0) return 0;
  const slices = 2048;
  const dz = (z1 - z0) / slices;
  let area = 0;
  for (let i = 0; i < slices; i++) {
    const z = z0 + (i + 0.5) * dz;
    const reach = Math.sqrt(Math.max(0, radiusY ** 2 - (z - centerZ) ** 2));
    area += Math.max(0, Math.min(target.y[1], centerY + reach) -
      Math.max(target.y[0], centerY - reach)) * dz;
  }
  return area;
}

/** @param {Bounds} a @param {Bounds} b */
function overlap(a, b) {
  return /** @type {const} */ (["x", "y", "z"]).map((axis) => Math.min(a[axis][1], b[axis][1]) - Math.max(a[axis][0], b[axis][0]));
}

/** @param {Bounds} a @param {Bounds} b */
function surfaceContact(a, b) {
  const separation = overlap(a, b);
  return separation.every((size) => size >= -epsilon) &&
    separation.filter((size) => Math.abs(size) <= epsilon).length === 1 &&
    separation.filter((size) => size > epsilon).length === 2;
}

/**
 * Removes an axis-aligned cavity and returns disjoint remaining boxes.
 * @param {Bounds} box
 * @param {Bounds} cavity
 */
function subtractBox(box, cavity) {
  /** @type {Bounds} */
  const cut = {
    x: [Math.max(box.x[0], cavity.x[0]), Math.min(box.x[1], cavity.x[1])],
    y: [Math.max(box.y[0], cavity.y[0]), Math.min(box.y[1], cavity.y[1])],
    z: [Math.max(box.z[0], cavity.z[0]), Math.min(box.z[1], cavity.z[1])]
  };
  if (/** @type {const} */ (["x", "y", "z"]).some((axis) => cut[axis][1] - cut[axis][0] <= epsilon)) return [box];
  /** @type {Bounds[]} */
  const result = [];
  /** @param {[number,number]} x @param {[number,number]} y @param {[number,number]} z */
  const add = (x, y, z) => { if ([x, y, z].every(([lo, hi]) => hi - lo > epsilon)) result.push({ x, y, z }); };
  add([box.x[0], cut.x[0]], box.y, box.z);
  add([cut.x[1], box.x[1]], box.y, box.z);
  add(cut.x, [box.y[0], cut.y[0]], box.z);
  add(cut.x, [cut.y[1], box.y[1]], box.z);
  add(cut.x, cut.y, [box.z[0], cut.z[0]]);
  add(cut.x, cut.y, [cut.z[1], box.z[1]]);
  return result;
}

/** @param {Part} part @param {Map<string, Bounds[]>} voids @param {Map<string, Bounds[]>} pieces */
function occupiedBoxes(part, voids, pieces = new Map()) {
  /** @type {Bounds[]} */
  let boxes = pieces.get(`${part.state}/${part.id}`) || [part];
  for (const cavity of voids.get(`${part.state}/${part.id}`) || [])
    boxes = boxes.flatMap((box) => subtractBox(box, cavity));
  return boxes;
}

/** A rectangular hollow is exact only when its subtraction is explicitly declared.
 * @param {Part} part
 * @param {Map<string, Bounds[]>} voids
 * @param {Map<string, Bounds[]>} pieces
 * @param {Map<string,{inner:number,outer:number,centerX:number,centerZ:number}>} radial
 * @param {Map<string,{inner:number,outer:number,centerX:number,centerY:number}>} radialZ
 * @param {Map<string,{y:[number,number],z:[number,number],halfDepth:number}>} shearsZ
 */
function exactRectangularOccupancy(part, voids, pieces, radial, radialZ, shearsZ) {
  if (part.shape === "box") return true;
  const key = `${part.state}/${part.id}`;
  // A declared @piece set is the occupied union of its closed rectangular
  // solids. It can prove a finite planar patch without treating the parent
  // AABB as filled. Analytic radial parts retain their own contact rules.
  if (pieces.has(key) && !radial.has(key) && !radialZ.has(key) && !shearsZ.has(key))
    return true;
  return part.shape === "hollow" && voids.has(key) && !pieces.has(key) &&
    !radial.has(key) && !radialZ.has(key);
}

/**
 * Return a cylinder axis only when the two transverse AABB diameters agree.
 * Equal three-axis bounds are ambiguous and need an explicit shape proof.
 * @param {Part} part
 * @returns {"x"|"y"|"z"|undefined}
 */
function cylinderAxis(part) {
  if (part.shape !== "cylinder") return undefined;
  const lengths = { x: part.x[1] - part.x[0], y: part.y[1] - part.y[0], z: part.z[1] - part.z[0] };
  const possibilities = /** @type {const} */ (["x", "y", "z"]).filter((axis) => {
    const others = /** @type {const} */ (["x", "y", "z"]).filter((candidate) => candidate !== axis);
    return Math.abs(lengths[others[0]] - lengths[others[1]]) <= epsilon &&
      Math.abs(lengths[axis] - lengths[others[0]]) > epsilon;
  });
  return possibilities.length === 1 ? possibilities[0] : undefined;
}

/** Positive disk/rectangle intersection on the cylinder's planar end cap.
 * @param {Part} cylinder
 * @param {Bounds} targetBox
 * @param {"x"|"y"|"z"} axis
 */
function cylinderCapArea(cylinder, targetBox, axis) {
  const other = /** @type {const} */ (["x", "y", "z"]).filter((candidate) => candidate !== axis);
  const u = other[0], v = other[1];
  if (!(Math.abs(cylinder[axis][0] - targetBox[axis][1]) <= epsilon ||
    Math.abs(cylinder[axis][1] - targetBox[axis][0]) <= epsilon)) return 0;
  const centerU = (cylinder[u][0] + cylinder[u][1]) / 2;
  const centerV = (cylinder[v][0] + cylinder[v][1]) / 2;
  const radius = (cylinder[u][1] - cylinder[u][0]) / 2;
  const lo = Math.max(cylinder[u][0], targetBox[u][0]);
  const hi = Math.min(cylinder[u][1], targetBox[u][1]);
  if (hi - lo <= epsilon) return 0;
  const steps = 512, du = (hi - lo) / steps;
  let area = 0;
  for (let i = 0; i < steps; i++) {
    const uu = lo + (i + 0.5) * du;
    const reach = Math.sqrt(Math.max(0, radius ** 2 - (uu - centerU) ** 2));
    area += Math.max(0, Math.min(targetBox[v][1], centerV + reach) -
      Math.max(targetBox[v][0], centerV - reach)) * du;
  }
  return area;
}

/** Count occupied samples on a declared planar cap. Radial, elliptical and
 * bored parts use their authored cross sections instead of a filled AABB.
 * @param {Part} first @param {Part} second @param {"x"|"y"|"z"} axis @param {number} plane
 * @param {Map<string,{inner:number,outer:number,centerX:number,centerZ:number}>} radial
 * @param {Map<string,{inner:number,outer:number,centerX:number,centerY:number}>} radialZ
 * @param {Map<string,{radius:number,y:[number,number]}>} bores
 * @param {Map<string,{centerX:number,centerY:number,radius:number,z:[number,number]}>} boresZ
 * @param {Map<string,{innerX:number,innerZ:number,outerX:number,outerZ:number,centerX:number,centerZ:number}>} ellipses
 */
function capContactArea(first, second, axis, plane, radial, radialZ, bores, boresZ, ellipses) {
  const transverse = /** @type {const} */ (["x", "y", "z"]).filter((candidate) => candidate !== axis);
  const [u, v] = transverse;
  const loU = Math.max(first[u][0], second[u][0]);
  const hiU = Math.min(first[u][1], second[u][1]);
  const loV = Math.max(first[v][0], second[v][0]);
  const hiV = Math.min(first[v][1], second[v][1]);
  if (hiU - loU <= epsilon || hiV - loV <= epsilon) return 0;
  /** @param {Part} part @param {number} a @param {number} b */
  const filled = (part, a, b) => {
    const key = `${part.state}/${part.id}`;
    if (axis === "y") {
      const ring = radial.get(key);
      if (ring) {
        const d = Math.hypot(a - ring.centerX, b - ring.centerZ);
        if (d < ring.inner || d > ring.outer) return false;
      }
      const ellipse = ellipses.get(key);
      if (ellipse) {
        const x = a - ellipse.centerX, z = b - ellipse.centerZ;
        if ((x / ellipse.outerX) ** 2 + (z / ellipse.outerZ) ** 2 > 1 ||
          (x / ellipse.innerX) ** 2 + (z / ellipse.innerZ) ** 2 < 1) return false;
      }
      const bore = bores.get(key);
      if (bore && plane >= bore.y[0] - epsilon && plane <= bore.y[1] + epsilon &&
        Math.hypot(a, b) < bore.radius) return false;
    }
    if (axis === "z") {
      const ring = radialZ.get(key);
      if (ring) {
        const d = Math.hypot(a - ring.centerX, b - ring.centerY);
        if (d < ring.inner || d > ring.outer) return false;
      }
      const bore = boresZ.get(key);
      if (bore && plane >= bore.z[0] - epsilon && plane <= bore.z[1] + epsilon &&
        Math.hypot(a - bore.centerX, b - bore.centerY) < bore.radius)
        return false;
    }
    if (cylinderAxis(part) === axis) {
      const centerU = (part[u][0] + part[u][1]) / 2;
      const centerV = (part[v][0] + part[v][1]) / 2;
      if (Math.hypot(a - centerU, b - centerV) > (part[u][1] - part[u][0]) / 2)
        return false;
    }
    return true;
  };
  const samples = 80;
  let count = 0;
  for (let i = 0; i < samples; i++) for (let j = 0; j < samples; j++) {
    const a = loU + (i + 0.5) * (hiU - loU) / samples;
    const b = loV + (j + 0.5) * (hiV - loV) / samples;
    if (filled(first, a, b) && filled(second, a, b)) count++;
  }
  return count * (hiU - loU) * (hiV - loV) / (samples * samples);
}

/** @param {Part} a @param {Part} b @param {Map<string,{inner:number,outer:number,centerX:number,centerZ:number}>} radial @param {Map<string,{inner:number,outer:number,centerX:number,centerY:number}>} radialZ @param {Map<string,{centerX:number,centerY:number,radius:number,z:[number,number]}>} boresZ @param {Map<string,Bounds[]>} voids @param {Map<string,Bounds[]>} pieces @param {Map<string,{y:[number,number],z:[number,number],halfDepth:number}>} shearsZ @param {Set<string>} provedTangents @param {Set<string>} provedCurves @param {Map<string,boolean>} provedLinear @param {Set<string>} plantContacts @param {Set<string>} unprovedCurved @param {string} owner */
function actualContact(a, b, radial, radialZ, boresZ, voids, pieces, shearsZ, provedTangents, provedCurves, provedLinear, plantContacts, unprovedCurved, owner) {
  const key = `${a.state}/${[a.id, b.id].sort((left, right) => left.localeCompare(right)).join("/")}`;
  if (plantContacts.has(key)) return true;
  if (provedTangents.has(key) || provedCurves.has(key)) return true;
  if (provedLinear.has(key)) return provedLinear.get(key);
  for (const [host, guest] of [[a, b], [b, a]]) {
    const bore = boresZ.get(`${host.state}/${host.id}`);
    const ring = radialZ.get(`${guest.state}/${guest.id}`);
    if (bore && ring && Math.abs(bore.centerX - ring.centerX) <= epsilon &&
      Math.abs(bore.centerY - ring.centerY) <= epsilon &&
      Math.min(bore.z[1], guest.z[1]) - Math.max(bore.z[0], guest.z[0]) > epsilon)
      return Math.abs(ring.outer - bore.radius) <= epsilon;
  }
  const ar = radial.get(`${a.state}/${a.id}`), br = radial.get(`${b.state}/${b.id}`);
  if (ar && br && Math.abs(ar.centerX - br.centerX) <= epsilon && Math.abs(ar.centerZ - br.centerZ) <= epsilon) {
    const vertical = Math.min(a.y[1], b.y[1]) - Math.max(a.y[0], b.y[0]);
    const radius = Math.min(ar.outer, br.outer) - Math.max(ar.inner, br.inner);
    return (Math.abs(vertical) <= epsilon && radius > epsilon) ||
      (vertical > epsilon && (Math.abs(ar.outer - br.inner) <= epsilon || Math.abs(br.outer - ar.inner) <= epsilon));
  }
  const az = radialZ.get(`${a.state}/${a.id}`), bz = radialZ.get(`${b.state}/${b.id}`);
  if (az && bz && Math.abs(az.centerX - bz.centerX) <= epsilon && Math.abs(az.centerY - bz.centerY) <= epsilon) {
    const depth = Math.min(a.z[1], b.z[1]) - Math.max(a.z[0], b.z[0]);
    const radius = Math.min(az.outer, bz.outer) - Math.max(az.inner, bz.inner);
    return (Math.abs(depth) <= epsilon && radius > epsilon) ||
      (depth > epsilon && (Math.abs(az.outer - bz.inner) <= epsilon || Math.abs(bz.outer - az.inner) <= epsilon));
  }
  const contact = occupiedBoxes(a, voids, pieces).some((aa) => occupiedBoxes(b, voids, pieces).some((bb) => surfaceContact(aa, bb)));
  const exactA = exactRectangularOccupancy(a, voids, pieces, radial, radialZ, shearsZ);
  const exactB = exactRectangularOccupancy(b, voids, pieces, radial, radialZ, shearsZ);
  const capA = cylinderAxis(a);
  const capB = cylinderAxis(b);
  const finiteCap = (capA && exactB && occupiedBoxes(b, voids, pieces).some((box) =>
    cylinderCapArea(a, box, capA) > 1e-8)) ||
    (capB && exactA && occupiedBoxes(a, voids, pieces).some((box) =>
      cylinderCapArea(b, box, capB) > 1e-8));
  if (contact && [a.shape, b.shape].some((shape) => ["curved", "cylinder", "hollow"].includes(shape)) &&
    !(exactA && exactB) && !finiteCap)
    unprovedCurved.add(`${owner}/${key}`);
  return contact;
}

/** @param {Part} a @param {Part} b @param {Map<string,{inner:number,outer:number,centerX:number,centerZ:number}>} radial @param {Map<string,{inner:number,outer:number,centerX:number,centerY:number}>} radialZ @param {Map<string,{centerX:number,centerY:number,radius:number,z:[number,number]}>} boresZ @param {Map<string,Bounds[]>} voids @param {Map<string,Bounds[]>} pieces @param {Set<string>} provedTangents @param {Set<string>} provedCurves @param {Map<string,boolean>} provedLinear @param {Set<string>} plantNonOverlaps */
function actualOverlap(a, b, radial, radialZ, boresZ, voids, pieces, provedTangents, provedCurves, provedLinear, plantNonOverlaps) {
  const key = `${a.state}/${[a.id, b.id].sort((left, right) => left.localeCompare(right)).join("/")}`;
  if (plantNonOverlaps.has(key)) return false;
  if (provedTangents.has(key) || provedCurves.has(key) || provedLinear.has(key)) return false;
  for (const [host, guest] of [[a, b], [b, a]]) {
    const bore = boresZ.get(`${host.state}/${host.id}`);
    const ring = radialZ.get(`${guest.state}/${guest.id}`);
    if (bore && ring && Math.abs(bore.centerX - ring.centerX) <= epsilon &&
      Math.abs(bore.centerY - ring.centerY) <= epsilon &&
      Math.min(bore.z[1], guest.z[1]) - Math.max(bore.z[0], guest.z[0]) > epsilon)
      return ring.outer > bore.radius + epsilon;
  }
  const ar = radial.get(`${a.state}/${a.id}`), br = radial.get(`${b.state}/${b.id}`);
  if (ar && br && Math.abs(ar.centerX - br.centerX) <= epsilon && Math.abs(ar.centerZ - br.centerZ) <= epsilon)
    return Math.min(a.y[1], b.y[1]) - Math.max(a.y[0], b.y[0]) > epsilon &&
    Math.min(ar.outer, br.outer) - Math.max(ar.inner, br.inner) > epsilon;
  const az = radialZ.get(`${a.state}/${a.id}`), bz = radialZ.get(`${b.state}/${b.id}`);
  if (az && bz && Math.abs(az.centerX - bz.centerX) <= epsilon && Math.abs(az.centerY - bz.centerY) <= epsilon)
    return Math.min(a.z[1], b.z[1]) - Math.max(a.z[0], b.z[0]) > epsilon &&
      Math.min(az.outer, bz.outer) - Math.max(az.inner, bz.inner) > epsilon;
  return occupiedBoxes(a, voids, pieces).some((aa) => occupiedBoxes(b, voids, pieces).some((bb) => overlap(aa, bb).every((size) => size > epsilon)));
}

/** @param {string[]} lines @param {Map<string, Part>} envelopes @param {Map<string, Part>} parts */
function towelFormula(lines, envelopes, parts) {
  const prose = lines.join("\n");
  const heights = /허용 전체 높이는 ([\d.]+), ([\d.]+), ([\d.]+)m/.exec(prose);
  const rule = /h=\(H−([\d.]+)\)\/([\d.]+)/.exec(prose);
  const footprint = /폭 ([\d.]+), 접힌 깊이 ([\d.]+)m/.exec(prose);
  if (!heights || !rule || !footprint) return ["folded-towels: prose formula or variant list absent"];
  const errors = [];
  const expectedStates = heights.slice(1).map((value) => String(Math.round(Number(value) * 1000)));
  if (expectedStates.join(",") !== [...envelopes.keys()].join(","))
    errors.push("folded-towels: table states differ from prose variant heights");
  /** @param {string} state @param {string} id @param {string} axis @param {number} observed @param {number} expected */
  const near = (state, id, axis, observed, expected) => {
    if (Math.abs(observed - expected) > 0.0000001)
      errors.push(`folded-towels/${state}/${id}/${axis}: table ${observed} differs from prose formula ${expected}`);
  };
  for (const state of expectedStates) {
    const H = Number(state) / 1000;
    const h = (H - Number(rule[1])) / Number(rule[2]);
    const envelope = envelopes.get(state);
    if (!envelope) continue;
    near(state, "*", "x-min", envelope.x[0], -Number(footprint[1]) / 2);
    near(state, "*", "x-max", envelope.x[1], Number(footprint[1]) / 2);
    near(state, "*", "z-min", envelope.z[0], -Number(footprint[2]) / 2);
    near(state, "*", "z-max", envelope.z[1], Number(footprint[2]) / 2);
    near(state, "*", "y-max", envelope.y[1], H);
    /** @type {[string,number,number][]} */
    const bounds = [
      ["layer-0", 0, h], ["layer-1", h + 0.004, 2 * h + 0.004],
      ["layer-2", 2 * h + 0.008, H], ["fold-0", h, h + 0.004],
      ["fold-1", 2 * h + 0.004, 2 * h + 0.008]
    ];
    for (const [id, lower, upper] of bounds) {
      const part = parts.get(`${state}/${id}`);
      if (!part) continue;
      near(state, id, "y-min", part.y[0], lower);
      near(state, id, "y-max", part.y[1], upper);
    }
  }
  return errors;
}

/** @param {string[]} lines @param {Map<string, Part>} envelopes @param {Map<string, {x:[number,number],y:[number,number],z:[number,number]}[]>} voids */
function chargerFormula(lines, envelopes, voids) {
  const prose = lines.join("\n");
  const outer = /폭 ([\d.]+), 깊이 ([\d.]+), 높이 ([\d.]+)m/.exec(prose);
  const interfaceCut = /본체 위쪽 x=±([\d.]+),z=±([\d.]+),y=([\d.]+)\.\.([\d.]+)m/.exec(prose);
  const portCut = /앞쪽 edge z=\+([\d.]+)\.\.\+([\d.]+),x=±([\d.]+),y=([\d.]+)\.\.([\d.]+)m/.exec(prose);
  if (!outer || !interfaceCut || !portCut) return ["entry-charger: prose dimensions absent"];
  const envelope = envelopes.get("default"), cuts = voids.get("default/body");
  if (!envelope || !cuts || cuts.length !== 2) return ["entry-charger: measured envelope/voids absent"];
  /** @type {[number[],number[]][]} */
  const expected = [
    [envelope.x, [-Number(outer[1]) / 2, Number(outer[1]) / 2]],
    [envelope.y, [0, Number(outer[3])]],
    [envelope.z, [-Number(outer[2]) / 2, Number(outer[2]) / 2]],
    [cuts[0].x, [-Number(interfaceCut[1]), Number(interfaceCut[1])]],
    [cuts[0].y, [Number(interfaceCut[3]), Number(interfaceCut[4])]],
    [cuts[0].z, [-Number(interfaceCut[2]), Number(interfaceCut[2])]],
    [cuts[1].x, [-Number(portCut[3]), Number(portCut[3])]],
    [cuts[1].y, [Number(portCut[4]), Number(portCut[5])]],
    [cuts[1].z, [Number(portCut[1]), Number(portCut[2])]]
  ];
  return expected.flatMap(([actual, target], index) =>
    Math.abs(actual[0] - target[0]) > epsilon || Math.abs(actual[1] - target[1]) > epsilon
      ? [`entry-charger: prose/table interval ${index} differs`] : []);
}

/** @param {string[]} lines @param {Map<string, Part>} envelopes @param {Map<string, Part>} parts @param {Map<string, Bounds[]>} voids @param {Map<string,{inner:number,outer:number}>} radial */
function rugFormula(lines, envelopes, parts, voids, radial) {
  const prose = lines.join("\n");
  const dimensions = /폭 ([\d.]+), 깊이 ([\d.]+), 높이 ([\d.]+)m, `bedroom-rug\/1600x2200`은 폭 ([\d.]+), 깊이 ([\d.]+), 높이 ([\d.]+)m/.exec(prose);
  const bases = /base 높이는 living ([\d.]+)m·bedroom ([\d.]+)m, pile 높이는 두 변종 모두 ([\d.]+)m/.exec(prose);
  const round = /지름 ([\d.]+)m·높이 ([\d.]+)m 변종/.exec(prose);
  const edge = /안쪽으로 ([\d.]+)m 폭의 bound-edge/.exec(prose);
  if (!dimensions || !bases || !round || !edge) return ["rugs: prose dimensions absent"];
  const errors = [];
  /** @param {string} state @param {number} width @param {number} depth @param {number} height @param {number} baseHeight */
  const check = (state, width, depth, height, baseHeight) => {
    const envelope = envelopes.get(state), base = parts.get(`${state}/base`), pile = parts.get(`${state}/pile`), border = parts.get(`${state}/bound-edge`);
    if (!envelope || !base || !pile || !border) { errors.push(`rugs/${state}: table state absent`); return; }
    const expected = [[envelope.x[0], -width / 2], [envelope.x[1], width / 2], [envelope.z[0], -depth / 2],
      [envelope.z[1], depth / 2], [envelope.y[1], height], [base.y[1], baseHeight],
      [pile.y[0], baseHeight], [pile.y[1], height], [border.y[0], baseHeight], [border.y[1], height]];
    for (const [actual, target] of expected) if (Math.abs(actual - target) > epsilon)
      errors.push(`rugs/${state}: prose/table interval differs`);
  };
  check("living", Number(dimensions[1]), Number(dimensions[2]), Number(dimensions[3]), Number(bases[1]));
  check("bedroom1600x2200", Number(dimensions[4]), Number(dimensions[5]), Number(dimensions[6]), Number(bases[2]));
  check("round1200", Number(round[1]), Number(round[1]), Number(round[2]), 0.009);
  const borderWidth = Number(edge[1]);
  /** @type {[string,number,number][]} */
  const rectangularStates = [["living", Number(dimensions[1]) / 2, Number(dimensions[2]) / 2],
    ["bedroom1600x2200", Number(dimensions[4]) / 2, Number(dimensions[5]) / 2]];
  for (const [state, halfX, halfZ] of rectangularStates) {
    const cut = voids.get(`${state}/bound-edge`)?.[0], pile = parts.get(`${state}/pile`);
    if (!cut || !pile || Math.abs(cut.x[1] - (halfX - borderWidth)) > epsilon ||
      Math.abs(cut.z[1] - (halfZ - borderWidth)) > epsilon ||
      Math.abs(pile.x[1] - cut.x[1]) > epsilon || Math.abs(pile.z[1] - cut.z[1]) > epsilon)
      errors.push(`rugs/${state}: prose border width differs from table`);
  }
  const ring = radial.get("round1200/bound-edge"), circle = radial.get("round1200/pile");
  if (!ring || !circle || Math.abs(ring.inner - (Number(round[1]) / 2 - borderWidth)) > epsilon ||
    Math.abs(circle.outer - ring.inner) > epsilon)
    errors.push("rugs/round1200: prose radial border width differs from table");
  return errors;
}

/** @param {string} anchor @param {string[]} lines @param {Map<string,Part>} envelopes
 * Cross-checks authored first-sentence dimensions against every new single-state envelope. */
function simpleProseEnvelope(anchor, lines, envelopes) {
  /** @type {Record<string,{pattern:RegExp,order:("x"|"y"|"z")[]}>} */
  const rules = {
    "dining-chair": { pattern: /`dining-chair`는 폭 ([\d.]+), 깊이 ([\d.]+), 높이 ([\d.]+)m/, order: ["x", "z", "y"] },
    "storage-basket": { pattern: /폭 ([\d.]+), 깊이 ([\d.]+), 높이 ([\d.]+)m/, order: ["x", "z", "y"] },
    "wall-art": { pattern: /폭 ([\d.]+), 높이 ([\d.]+), 전체 깊이 ([\d.]+)m/, order: ["x", "y", "z"] },
    "living-display": { pattern: /폭 ([\d.]+), 높이 ([\d.]+), 깊이 ([\d.]+)m/, order: ["x", "y", "z"] },
  };
  const rule = rules[anchor];
  if (!rule) return [];
  const values = rule.pattern.exec(lines.join("\n"));
  const envelope = envelopes.get("default");
  if (!values || !envelope) return [`${anchor}: prose envelope dimensions absent`];
  const errors = [];
  for (let i = 0; i < rule.order.length; i++) {
    const axis = rule.order[i];
    const span = envelope[axis][1] - envelope[axis][0];
    if (Math.abs(span - Number(values[i + 1])) > epsilon)
      errors.push(`${anchor}: prose/table ${axis} envelope differs`);
  }
  return errors;
}

/** @param {string[]} lines @param {Map<string,Part>} envelopes @param {Map<string,{inner:number,outer:number}>} radial */
function pendantFormula(lines, envelopes, radial) {
  const prose = lines.join("\n");
  const length = /전체 하향 길이 ([\d.]+)m/.exec(prose);
  const cord = /cord는 y=−[\d.]+\.\.0에 지름 ([\d.]+)m/.exec(prose);
  const shade = /shade는 y=−[\d.]+\.\.−[\d.]+에 지름 ([\d.]+)m/.exec(prose);
  const diffuser = /diffuser는 지름 ([\d.]+)m·두께/.exec(prose);
  const canopy = /canopy는 지름 ([\d.]+), 높이 ([\d.]+)m/.exec(prose);
  if (!length || !cord || !shade || !diffuser || !canopy) return ["dining-pendant: prose diameter/length absent"];
  const observed = [envelopes.get("default")?.y[0], radial.get("default/cord")?.outer,
    radial.get("default/shade-wall")?.outer, radial.get("default/diffuser")?.outer,
    radial.get("default/canopy")?.outer];
  const expected = [-Number(length[1]), Number(cord[1]) / 2, Number(shade[1]) / 2,
    Number(diffuser[1]) / 2, Number(canopy[1]) / 2];
  return observed.flatMap((value, i) => value === undefined || Math.abs(value - expected[i]) > epsilon
    ? [`dining-pendant: prose/table dimension ${i} differs`] : []);
}

/** @param {string[]} lines @param {Map<string,Part>} envelopes @param {Map<string,Part>} parts */
function bookFormula(lines, envelopes, parts) {
  const prose = lines.join("\n");
  const allowed = /허용 조합은 ([^.]+) 세 가지다/.exec(prose);
  const cover = /표지 두 장은 두께 ([\d.]+)m/.exec(prose);
  const spine = /z=D\/2−([\d.]+)\.\.D\/2의 별도 판/.exec(prose);
  if (!allowed || !cover || !spine) return ["books: prose variant/formula absent"];
  const C = Number(cover[1]), S = Number(spine[1]);
  const states = [...allowed[1].matchAll(/`(\d+x\d+x\d+)`/g)].map((match) => match[1]);
  if (states.length !== 3 || states.join(",") !== [...envelopes.keys()].join(","))
    return ["books: prose variants differ from table states"];
  const errors = [];
  for (const state of states) {
    const [H, T, D] = state.split("x").map((value) => Number(value) / 1000);
    /** @type {Record<string,Bounds>} */
    const expected = {
      "*": { x: [-T / 2, T / 2], y: [0, H], z: [-D / 2, D / 2] },
      "cover-left": { x: [-T / 2, -T / 2 + C], y: [0, H], z: [-D / 2, D / 2 - S] },
      "cover-right": { x: [T / 2 - C, T / 2], y: [0, H], z: [-D / 2, D / 2 - S] },
      pages: { x: [-T / 2 + C, T / 2 - C], y: [C, H - C], z: [-D / 2, D / 2 - S] },
      spine: { x: [-T / 2, T / 2], y: [0, H], z: [D / 2 - S, D / 2] }
    };
    for (const [id, bounds] of Object.entries(expected)) {
      const observed = id === "*" ? envelopes.get(state) : parts.get(`${state}/${id}`);
      if (!observed) { errors.push(`books/${state}/${id}: table part absent`); continue; }
      for (const axis of /** @type {const} */ (["x", "y", "z"]))
        if (Math.abs(observed[axis][0] - bounds[axis][0]) > epsilon ||
          Math.abs(observed[axis][1] - bounds[axis][1]) > epsilon)
          errors.push(`books/${state}/${id}/${axis}: prose formula differs from table`);
    }
  }
  return errors;
}

/** @param {string[]} lines @param {Map<string,Part>} envelopes @param {Map<string,{radius:number,y:[number,number]}>} bores @param {Map<string,{innerX:number,innerZ:number,outerX:number,outerZ:number,centerX:number,centerZ:number}>} ellipses @param {Map<string,{host:string,guest:string,radius:number,halfWidth:number}>} tangents */
function propFormula(lines, envelopes, bores, ellipses, tangents) {
  const prose = lines.join("\n");
  const bowl = /`decor-bowl`은 외경 ([\d.]+), 높이 ([\d.]+)m, 벽 두께 ([\d.]+)m/.exec(prose);
  const tray = /`decor-tray`는 전체 폭 ([\d.]+)·깊이 ([\d.]+)·높이 ([\d.]+)m/.exec(prose);
  const cup = /`decor-cup`은 몸체 외경 ([\d.]+), 높이 ([\d.]+), 벽 두께 ([\d.]+)m/.exec(prose);
  const pad = /R=([\d.]+)m이고 \|x\|≤([\d.]+)m/.exec(prose);
  if (!bowl || !tray || !cup || !pad) return ["tabletop-props: prose dimensions absent"];
  const errors = [];
  /** @param {string} state @param {number} width @param {number} height @param {number} depth */
  const check = (state, width, height, depth) => {
    const box = envelopes.get(state);
    if (!box || Math.abs(box.x[1] - box.x[0] - width) > epsilon ||
      Math.abs(box.y[1] - box.y[0] - height) > epsilon ||
      (state !== "cup" && Math.abs(box.z[1] - box.z[0] - depth) > epsilon))
      errors.push(`tabletop-props/${state}: prose/table envelope differs`);
  };
  check("bowl", Number(bowl[1]), Number(bowl[2]), Number(bowl[1]));
  check("tray", Number(tray[1]), Number(tray[3]), Number(tray[2]));
  check("cup", Number(cup[1]), Number(cup[2]), Number(cup[1]));
  const bowlBore = bores.get("bowl/shell"), cupBore = bores.get("cup/body"), ellipse = ellipses.get("tray/rim"), tangent = tangents.get("cup/body/handle");
  if (!bowlBore || Math.abs(bowlBore.radius - (Number(bowl[1]) / 2 - Number(bowl[3]))) > epsilon ||
    !cupBore || Math.abs(cupBore.radius - (Number(cup[1]) / 2 - Number(cup[3]))) > epsilon ||
    !ellipse || Math.abs(ellipse.outerX - Number(tray[1]) / 2) > epsilon ||
    Math.abs(ellipse.outerZ - Number(tray[2]) / 2) > epsilon ||
    !tangent || Math.abs(tangent.radius - Number(pad[1])) > epsilon ||
    Math.abs(tangent.halfWidth - Number(pad[2])) > epsilon)
    errors.push("tabletop-props: prose/table cavity or tangent differs");
  return errors;
}

/** @param {string[]} lines @param {Map<string,Part>} envelopes @param {Map<string,Part>} parts @param {Map<string,Bounds[]>} voids */
function tubFormula(lines, envelopes, parts, voids) {
  const prose = lines.join("\n");
  const outer = /바닥 점유 ([\d.]+)×([\d.]+)m, rim 높이 ([\d.]+)m/.exec(prose);
  const inner = /내벽 간 치수는 길이 ([\d.]+)×폭 ([\d.]+)m, rim 안쪽의 실제 위쪽 개구는 ([\d.]+)×([\d.]+)m/.exec(prose);
  const underside = /내부 바닥판의 아래면 y=([\d.]+)m/.exec(prose);
  if (!outer || !inner || !underside) return ["bathtub: prose dimensional source absent"];
  const shell = voids.get("default/shell")?.[0], rim = voids.get("default/rim")?.[0];
  const box = envelopes.get("default"), floor = parts.get("default/floor");
  if (!shell || !rim || !box || !floor) return ["bathtub: table source absent"];
  const pairs = [[box.z[1] - box.z[0], Number(outer[1])], [box.x[1] - box.x[0], Number(outer[2])],
    [box.y[1], Number(outer[3])], [shell.z[1] - shell.z[0], Number(inner[1])],
    [shell.x[1] - shell.x[0], Number(inner[2])], [rim.z[1] - rim.z[0], Number(inner[3])],
    [rim.x[1] - rim.x[0], Number(inner[4])], [floor.y[0], Number(underside[1])]];
  return pairs.flatMap(([actual, expected], i) => Math.abs(actual - expected) > epsilon
    ? [`bathtub: prose/table dimension ${i} differs`] : []);
}

/** @param {string[]} lines @param {Map<string,Part>} envelopes @param {Map<string,Part>} parts @param {Map<string,{prefix:string,cols:number,rows:number,pitchX:number,pitchZ:number,width:number,depth:number,y:[number,number],contact:string}>} grids */
function equipmentFormula(lines, envelopes, parts, grids) {
  const prose = lines.join("\n");
  const display = /전체 화면판은 폭 ([\d.]+), 높이 ([\d.]+), 깊이 ([\d.]+)m/.exec(prose);
  const keyboard = /`work-keyboard`는 폭 ([\d.]+), 깊이 ([\d.]+), 높이 ([\d.]+)m/.exec(prose);
  const keys = /(\d+)열×(\d+)행의 낮은 key cap은 각각 ([\d.]+)×([\d.]+)×([\d.]+)m로 y=([\d.]+)\.\.([\d.]+)/.exec(prose);
  const pitchX = /x=\(c−5\.5\)×([\d.]+)m/.exec(prose);
  const pitchZ = /z=\(r−1\.5\)×([\d.]+)m/.exec(prose);
  if (!display || !keyboard || !keys || !pitchX || !pitchZ) return ["work-equipment: prose grid or dimensions absent"];
  const d = envelopes.get("display"), k = envelopes.get("keyboard");
  const housing = parts.get("display/housing"), bezel = parts.get("display/display-bezel"), grid = grids.get("keyboard");
  if (!d || !k || !housing || !bezel || !grid) return ["work-equipment: table parts absent"];
  const pairs = [[housing.x[1] - housing.x[0], Number(display[1])], [housing.y[1] - housing.y[0], Number(display[2])],
    [housing.z[1] - housing.z[0] + bezel.z[1] - bezel.z[0], Number(display[3])],
    [k.x[1] - k.x[0], Number(keyboard[1])], [k.z[1] - k.z[0], Number(keyboard[2])],
    [k.y[1] - k.y[0], Number(keyboard[3])], [grid.cols, Number(keys[1])], [grid.rows, Number(keys[2])],
    [grid.width, Number(keys[3])], [grid.depth, Number(keys[4])], [grid.y[1] - grid.y[0], Number(keys[5])],
    [grid.y[0], Number(keys[6])], [grid.y[1], Number(keys[7])],
    [grid.pitchX, Number(pitchX[1])], [grid.pitchZ, Number(pitchZ[1])]];
  return pairs.flatMap(([actual, expected], i) => Math.abs(actual - expected) > epsilon
    ? [`work-equipment: prose/table dimension ${i} differs`] : []);
}

/**
 * Certifies the generated plant table against its H2 formula. Conical pot and
 * soil share an inner-wall boundary; branch cylinders start tangent to the
 * stem; tapered leaf prisms start tangent to the branch caps. The five azimuths
 * and three vertical fan sectors are analytically disjoint away from those
 * prescribed contact boundaries.
 * @param {ReturnType<typeof parse>} parsed
 */
function plantProof(parsed) {
  const errors = [];
  const contacts = new Set();
  const nonOverlaps = new Set();
  const source = fs.readFileSync(path.join(root, "docs/models/004-decor-and-fixtures.md"), "utf8");
  let input;
  try { input = plantProducer.check(source); }
  catch (error) { return { errors: [`potted-plant: ${String(error)}`], contacts, nonOverlaps }; }
  const fan = input.leafFanDegrees * Math.PI / 180;
  const branchBase = input.stemRadius + input.branchRadius;
  const leafBase = branchBase + input.branchLength + input.branchRadius;
  const lateral = input.leafLength * Math.sin(fan);
  const maxBladeAngle = Math.atan2(lateral + input.leafWidth / 2, leafBase);
  if (!(2 * branchBase * Math.sin(Math.PI / 5) > 2 * input.branchRadius &&
    2 * maxBladeAngle < 2 * Math.PI / 5 &&
    lateral > input.leafWidth && input.leafThickness > 0))
    errors.push("potted-plant: branch azimuths or leaf fan prisms collide");
  /** @param {string} state @param {string} left @param {string} right */
  const pair = (state, left, right) => `${state}/${[left, right].sort((a, b) => a.localeCompare(b)).join("/")}`;
  let expectedCount = 0;
  for (const millimetres of input.heights) {
    const state = String(millimetres);
    const expected = plantProducer.partsFor(input, millimetres);
    const envelope = parsed.envelopes.get(state);
    const inventory = parsed.inventory.get(state);
    const actual = [...parsed.parts.values()].filter((part) => part.state === state);
    expectedCount += expected.parts.length;
    if (!envelope || !inventory || actual.length !== expected.parts.length ||
      inventory.join(",") !== expected.parts.map((part) => part.id).join(",")) {
      errors.push(`potted-plant/${state}: generated part population differs from formula`);
      continue;
    }
    for (const axis of /** @type {const} */ (["x", "y", "z"]))
      if (envelope[axis].some((value, i) => Math.abs(value - expected.envelope[axis][i]) > epsilon))
        errors.push(`potted-plant/${state}: ${axis} envelope differs from formula`);
    const actualById = new Map(actual.map((part) => [part.id, part]));
    for (const part of expected.parts) {
      const found = actualById.get(part.id);
      if (!found || found.shape !== part.shape || found.contact.join(",") !== part.contact ||
        /** @type {const} */ (["x", "y", "z"]).some((axis) => found[axis].some((value, i) => Math.abs(value - part[axis][i]) > epsilon)))
        errors.push(`potted-plant/${state}/${part.id}: bounds, shape or contact differs from formula`);
    }
    /** @param {string} left @param {string} right */
    const attach = (left, right) => { const key = pair(state, left, right); contacts.add(key); nonOverlaps.add(key); };
    attach("pot", "soil");
    for (let i = 0; i < 5; i++) {
      const angle = 2 * Math.PI * i / 5;
      const ex = Math.cos(angle), ez = Math.sin(angle);
      const stemSurface = input.stemRadius * expected.H;
      const branchRadius = input.branchRadius * expected.H;
      const branchCenter = [branchBase * expected.H * ex, branchBase * expected.H * ez];
      if (Math.abs(Math.hypot(...branchCenter) - branchRadius - stemSurface) > epsilon)
        errors.push(`potted-plant/${state}/branch-${i}: stem tangent distance differs`);
      else attach("stem", `branch-${i}`);
      const capCenter = [(branchBase + input.branchLength) * expected.H * ex,
        (branchBase + input.branchLength) * expected.H * ez];
      const apex = [leafBase * expected.H * ex, leafBase * expected.H * ez];
      for (let j = 0; j < 3; j++) {
        const leaf = actualById.get(`leaf-${3 * i + j}`);
        const distance = Math.hypot(apex[0] - capCenter[0], apex[1] - capCenter[1]);
        if (!leaf || Math.abs(distance - branchRadius) > epsilon ||
          apex[0] < leaf.x[0] - epsilon || apex[0] > leaf.x[1] + epsilon ||
          apex[1] < leaf.z[0] - epsilon || apex[1] > leaf.z[1] + epsilon ||
          Math.abs(leaf.y[0] - (input.branchStart + i * input.branchPitch) * expected.H) > epsilon)
          errors.push(`potted-plant/${state}/branch-${i}/leaf-${3 * i + j}: tangent point differs`);
        else attach(`branch-${i}`, `leaf-${3 * i + j}`);
      }
      for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++)
        nonOverlaps.add(pair(state, `leaf-${3 * i + a}`, `leaf-${3 * i + b}`));
    }
  }
  if (parsed.parts.size !== expectedCount || parsed.envelopes.size !== input.heights.length)
    errors.push("potted-plant: undeclared generated state or part");
  if (errors.length) { contacts.clear(); nonOverlaps.clear(); }
  return { errors, contacts, nonOverlaps };
}

/** @param {Part} part @param {CavityProfile} profile */
function cavityProfileErrors(part, profile) {
  const width = part.x[1] - part.x[0];
  const height = part.y[1] - part.y[0];
  const depth = part.z[1] - part.z[0];
  const diameter = Math.min(width, depth);
  const wall = diameter / profile.wallDivisor;
  const bottom = height / profile.bottomDivisor;
  const shoulder = height * profile.shoulderNumerator / profile.shoulderDenominator;
  const bodyInner = diameter / 2 - wall;
  const mouthOuter = profile.mouthRadius + wall;
  /** @type {string[]} */ const errors = [];
  if (part.shape !== "hollow") errors.push("cavity profile requires a hollow part");
  if (![width, height, depth, wall, bottom, shoulder, profile.mouthRadius, mouthOuter].every(Number.isFinite) ||
    !(width > 0 && height > 0 && depth > 0 && bottom > 0 && bottom < shoulder && shoulder < height))
    errors.push("cavity profile has invalid body or vertical intervals");
  if (!(wall > 0 && profile.mouthRadius > 0 && mouthOuter < diameter / 2 &&
    bodyInner > profile.mouthRadius))
    errors.push("cavity profile mouth or wall leaves no finite body cavity");
  if (profile.section === "round" && width > depth + epsilon)
    errors.push("round cavity body cannot reach declared X bounds");
  return errors;
}

/** @param {string} value */
function positiveFraction(value) {
  const match = /^(\d+)\/(\d+)$/.exec(value);
  if (!match || Number(match[2]) === 0) throw Error(`invalid positive fraction ${value}`);
  const result = Number(match[1]) / Number(match[2]);
  if (!(result > 0 && Number.isFinite(result))) throw Error(`invalid positive fraction ${value}`);
  return result;
}

/** @param {string} value @returns {[number,number]} */
function fractionInterval(value) {
  const match = /^(\d+\/\d+)\.\.(\d+\/\d+)$/.exec(value);
  if (!match) throw Error(`invalid fraction interval ${value}`);
  return [positiveFraction(match[1]), positiveFraction(match[2])];
}

/** @param {string[]} lines @param {string} anchor @param {ReturnType<typeof parse>} design */
function vesselAttachmentProof(lines, anchor, design) {
  const errors = [];
  let rows = 0, states = 0, proved = 0;
  const seen = new Set();
  if (lines.some((line) => line.includes("`@vessel-attachments`")) &&
    !lines.some((line) => line.startsWith("@vessel-attachments")))
    errors.push(`${anchor}: prose names vessel attachments but no row declares them`);
  for (const line of lines.filter((candidate) => candidate.startsWith("@vessel-attachments"))) {
    rows++;
    const match = /^@vessel-attachments\s+([^:]+):\s*(.+)$/.exec(line);
    if (!match) { errors.push(`${anchor}: malformed vessel attachment row`); continue; }
    const cells = match[2].split(",").map((cell) => cell.trim());
    if (cells.length !== 7) { errors.push(`${anchor}: vessel attachment needs seven fields`); continue; }
    let spoutY, channel, gripY, holeX, holeY, gripZ;
    try {
      spoutY = positiveFraction(cells[1]); channel = positiveFraction(cells[2]);
      gripY = fractionInterval(cells[3]); holeX = fractionInterval(cells[4]);
      holeY = fractionInterval(cells[5]); gripZ = positiveFraction(cells[6]);
    } catch (error) { errors.push(`${anchor}: ${String(error)}`); continue; }
    for (const state of match[1].split(",").map((value) => value.trim())) {
      states++;
      const key = `${state}/${cells[0]}`;
      if (seen.has(key)) { errors.push(`${anchor}/${key}: repeated vessel attachment`); continue; }
      seen.add(key);
      const part = design.parts.get(key), profile = design.cavityProfiles.get(key);
      if (!part || !profile || profile.section !== "round") {
        errors.push(`${anchor}/${key}: attachment needs a measured round cavity profile`); continue;
      }
      const W = part.x[1] - part.x[0], H = part.y[1] - part.y[0], D = part.z[1] - part.z[0];
      const R = Math.min(W, D) / 2, wall = Math.min(W, D) / profile.wallDivisor;
      const shoulder = profile.shoulderNumerator / profile.shoulderDenominator;
      const mouth = profile.mouthRadius, centerZ = part.z[0] + R;
      /** @param {number} y */
      const outerAt = (y) => R + (mouth + wall - R) * (y - shoulder) / (1 - shoulder);
      /** @param {number} y */
      const innerAt = (y) => R - wall + (mouth - (R - wall)) * (y - shoulder) / (1 - shoulder);
      const spoutInner = channel * mouth, spoutOuter = spoutInner + wall;
      const problem = [];
      if (!(W > 0 && H > 0 && D > 0 && wall > 0 && shoulder > 0 && shoulder < 1))
        problem.push("invalid body or shoulder");
      if (!(spoutY > shoulder && spoutY < 1 && spoutInner > 0 && spoutInner < mouth &&
        spoutInner < innerAt(spoutY) && spoutOuter < R &&
        spoutY * H - spoutOuter > 0 && spoutY * H + spoutOuter < H &&
        part.z[1] - (centerZ + R) > 0)) problem.push("spout leaves cavity or measured bounds");
      if (!(shoulder <= gripY[0] && gripY[0] < holeY[0] && holeY[0] < holeY[1] &&
        holeY[1] < gripY[1] && gripY[1] < 1 &&
        0 < holeX[0] && holeX[0] < holeX[1] && holeX[1] < 1 &&
        holeX[0] * R > outerAt(holeY[0]) &&
        R - (outerAt(gripY[0]) - wall / 2) > 0 &&
        gripZ > 0 && centerZ - gripZ * W > part.z[0] &&
        centerZ + gripZ * W < part.z[1] && holeX[0] * R > spoutOuter))
        problem.push("grip hole or finite root leaves measured bounds");
      if (problem.length) errors.push(`${anchor}/${key}: ${problem.join("; ")}`);
      else proved++;
    }
  }
  for (const [key, profile] of design.cavityProfiles) {
    const part = design.parts.get(key);
    if (profile.section === "round" && part &&
      part.z[1] - part.z[0] > part.x[1] - part.x[0] + epsilon && !seen.has(key))
      errors.push(`${anchor}/${key}: round cavity has extra depth but no vessel attachment`);
  }
  return { rows, states, proved, errors };
}

/** @param {string[]} lines @param {string} anchor @param {ReturnType<typeof parse>} design */
function vesselClosureProof(lines, anchor, design) {
  const errors = [];
  let rows = 0, states = 0, proved = 0;
  const seen = new Set();
  const declarations = lines.filter((candidate) => candidate.startsWith("@vessel-closure"));
  const named = lines.some((line) => line.includes("`@vessel-closure`"));
  if (named && !declarations.length)
    errors.push(`${anchor}: prose names vessel closure but no row declares it`);
  for (const line of declarations) {
    rows++;
    const match = /^@vessel-closure\s+([^:]+):\s*([^,]+),\s*(\d+\/\d+)$/.exec(line);
    if (!match) { errors.push(`${anchor}: malformed vessel closure row`); continue; }
    const capHeight = positiveFraction(match[3]);
    for (const state of match[1].split(",").map((value) => value.trim())) {
      states++;
      const key = `${state}/${match[2].trim()}`;
      if (seen.has(key)) { errors.push(`${anchor}/${key}: repeated vessel closure`); continue; }
      seen.add(key);
      const part = design.parts.get(key), profile = design.cavityProfiles.get(key);
      if (!part || !profile || part.shape !== "hollow") {
        errors.push(`${anchor}/${key}: closure needs a hollow part and cavity profile`); continue;
      }
      const W = part.x[1] - part.x[0], H = part.y[1] - part.y[0], D = part.z[1] - part.z[0];
      const wall = Math.min(W, D) / profile.wallDivisor;
      const shoulder = profile.shoulderNumerator / profile.shoulderDenominator;
      const capRadius = profile.mouthRadius + 2 * wall;
      if (!(W > 0 && H > 0 && D > 0 && wall > 0 && shoulder > 0 && shoulder < 1 &&
        profile.mouthRadius > 0 && capHeight > 0 && capHeight < 1 - shoulder &&
        capRadius > profile.mouthRadius + wall && capRadius < Math.min(W, D) / 2))
        errors.push(`${anchor}/${key}: cap cannot close the neck within measured bounds`);
      else proved++;
    }
  }
  for (const [key, profile] of design.cavityProfiles)
    if (named && profile.section === "ellipse" && !seen.has(key))
      errors.push(`${anchor}/${key}: ellipse cavity profile lacks a closure`);
  return { rows, states, proved, errors };
}

/** @param {Map<string,string[]>} allSections @param {(anchor:string, parsed:ReturnType<typeof parse>)=>void} [mutate] @param {string} [onlyState] */
function audit(allSections, mutate, onlyState) {
  const errors = [];
  const unprovedCurved = new Set();
  let examined = 0;
  let hollowParts = 0;
  let provedHollowParts = 0;
  let cavityProfileParts = 0;
  let provedCavityProfiles = 0;
  let vesselRows = 0;
  let vesselStates = 0;
  let provedVesselStates = 0;
  let closureRows = 0;
  let closureStates = 0;
  let provedClosureStates = 0;
  let measuredPrototypes = 0;
  for (const [anchor, lines] of allSections) {
    const parsed = parse(lines, anchor);
    mutate?.(anchor, parsed);
    const { envelopes, parts, inventory, compositions, supportBindings, pinFaces, emitterFaces, miterJoints, voids, pieces, shearsZ, radial, radialZ, bores, cavityProfiles, boresZ, boresX, ellipses, tangents, flatContacts, capContacts, cavityContacts, curveLayers, linearCurves, grids } = parsed;
    const vessel = vesselAttachmentProof(lines, anchor, parsed);
    vesselRows += vessel.rows;
    vesselStates += vessel.states;
    provedVesselStates += vessel.proved;
    errors.push(...vessel.errors);
    const closure = vesselClosureProof(lines, anchor, parsed);
    closureRows += closure.rows;
    closureStates += closure.states;
    provedClosureStates += closure.proved;
    errors.push(...closure.errors);
    for (const [key, profile] of cavityProfiles) {
      cavityProfileParts++;
      const part = parts.get(key);
      if (!part) { errors.push(`${anchor}/${key}: cavity profile has no part`); continue; }
      if (bores.has(key)) errors.push(`${anchor}/${key}: cavity profile duplicates a bore`);
      const findings = cavityProfileErrors(part, profile);
      if (!findings.length) provedCavityProfiles++;
      errors.push(...findings.map((finding) => `${anchor}/${key}: ${finding}`));
    }
    const provedMiterJoints = new Set();
    const provedTangents = new Set();
    const provedCurves = new Set();
    /** @type {Map<string,boolean>} */
    const provedLinear = new Map();
    const plant = anchor === "potted-plant" ? plantProof(parsed) : { errors: [], contacts: new Set(), nonOverlaps: new Set() };
    errors.push(...plant.errors);
    if (anchor === "cabinet-and-shelf") {
      try {
        const source = fs.readFileSync(path.join(root, "docs/models/002-storage-and-sleep.md"), "utf8");
        cabinetProducer.check(source);
      } catch (error) { errors.push(`cabinet-and-shelf: ${String(error)}`); }
    }
    if (!envelopes.size) { errors.push(`${anchor}: no @envelope rows`); continue; }
    if (anchor === "entry-bench" && (compositions.size !== 1 || !compositions.has("default")))
      errors.push("entry-bench: cabinet child composition absent");
    measuredPrototypes++;
    for (const [state, envelope] of envelopes) {
      if (onlyState && state !== onlyState) continue;
      const stateParts = [...parts.values()].filter((part) => part.state === state);
      if (!stateParts.length) errors.push(`${anchor}/${state}: no @part rows`);
      for (const part of stateParts) if (part.shape === "hollow") {
        hollowParts++;
        const key = `${state}/${part.id}`;
        if (voids.has(key) || bores.has(key) || cavityProfiles.has(key) || boresZ.has(key) || ellipses.has(key) || radial.has(key) || radialZ.has(key) || lines.some((line) => line.startsWith("@plant-spec:")))
          provedHollowParts++;
        else errors.push(`${anchor}/${key}: hollow part has no authored cavity`);
      }
      const composition = compositions.get(state);
      const supported = stateParts.filter((part) => part.contact.some((target) => /^support@[\d.]+$/.test(target)));
      const binding = supportBindings.get(state);
      if (supported.length && !binding && !composition)
        errors.push(`${anchor}/${state}: support@N has no child binding`);
      if (binding) {
        const childLines = allSections.get(binding.anchor);
        const child = childLines && parse(childLines, binding.anchor);
        const childPart = child?.parts.get(`${binding.state}/${binding.part}`);
        if (!childPart) errors.push(`${anchor}/${state}: support child part absent`);
        else for (const part of supported) {
          const declared = Number(part.contact.find((target) => /^support@[\d.]+$/.test(target))?.slice(8));
          const sharedX = Math.min(part.x[1], childPart.x[1] + binding.offset[0]) -
            Math.max(part.x[0], childPart.x[0] + binding.offset[0]);
          const sharedZ = Math.min(part.z[1], childPart.z[1] + binding.offset[2]) -
            Math.max(part.z[0], childPart.z[0] + binding.offset[2]);
          const childVoids = child?.voids.get(`${binding.state}/${binding.part}`) || [];
          const cavityFloor = childVoids.find((voidBox) =>
            Math.abs(voidBox.y[1] - childPart.y[1]) <= epsilon &&
            part.x[0] >= voidBox.x[0] + binding.offset[0] - epsilon &&
            part.x[1] <= voidBox.x[1] + binding.offset[0] + epsilon &&
            part.z[0] >= voidBox.z[0] + binding.offset[2] - epsilon &&
            part.z[1] <= voidBox.z[1] + binding.offset[2] + epsilon);
          const top = (cavityFloor?.y[0] ?? childPart.y[1]) + binding.offset[1];
          if (Math.abs(declared - top) > epsilon || Math.abs(part.y[0] - top) > epsilon ||
            sharedX <= epsilon || sharedZ <= epsilon)
            errors.push(`${anchor}/${state}/${part.id}: support face differs from ${binding.anchor}/${binding.state}/${binding.part}`);
        }
        if (child) for (const own of stateParts) {
          const ownBoxes = occupiedBoxes(own, voids, pieces);
          for (const referent of child.parts.values()) {
            if (referent.state !== binding.state) continue;
            const childBoxes = occupiedBoxes(referent, child.voids, child.pieces).map((box) => ({
              x: /** @type {[number,number]} */ ([box.x[0] + binding.offset[0], box.x[1] + binding.offset[0]]),
              y: /** @type {[number,number]} */ ([box.y[0] + binding.offset[1], box.y[1] + binding.offset[1]]),
              z: /** @type {[number,number]} */ ([box.z[0] + binding.offset[2], box.z[1] + binding.offset[2]])
            }));
            if (ownBoxes.some((box) => childBoxes.some((other) =>
              overlap(box, other).every((depth) => depth > epsilon))))
              errors.push(`${anchor}/${state}/${own.id}: penetrates support child ${binding.anchor}/${binding.state}/${referent.id}`);
          }
        }
      }
      if (composition) {
        const childLines = allSections.get(composition.anchor);
        const child = childLines && parse(childLines, composition.anchor);
        const childEnvelope = child?.envelopes.get(composition.state);
        const childParts = [...(child?.parts.values() || [])].filter((part) => part.state === composition.state);
        if (!childEnvelope || !childParts.length) errors.push(`${anchor}/${state}: composition child state absent`);
        else {
          const pieces = [...stateParts, ...childParts.map((part) => ({
            ...part,
            x: /** @type {[number,number]} */ (part.x.map((value) => value + composition.offset[0])),
            y: /** @type {[number,number]} */ (part.y.map((value) => value + composition.offset[1])),
            z: /** @type {[number,number]} */ (part.z.map((value) => value + composition.offset[2]))
          }))];
          for (const axis of /** @type {const} */ (["x", "y", "z"])) {
            const bounds = [Math.min(...pieces.map((part) => part[axis][0])),
              Math.max(...pieces.map((part) => part[axis][1]))];
            if (bounds.some((value, i) => Math.abs(value - envelope[axis][i]) > epsilon))
              errors.push(`${anchor}/${state}: composite ${axis} envelope differs from child and own parts`);
          }
          const attached = stateParts.some((own) => pieces.slice(stateParts.length).some((referent) =>
            Math.abs(own.y[0] - referent.y[1]) <= epsilon &&
            Math.min(own.x[1], referent.x[1]) - Math.max(own.x[0], referent.x[0]) > epsilon &&
            Math.min(own.z[1], referent.z[1]) - Math.max(own.z[0], referent.z[0]) > epsilon));
          if (!attached) errors.push(`${anchor}/${state}: composite child has no finite face contact`);
        }
      }
      const byId = new Map(stateParts.map((part) => [part.id, part]));
      const provedExternal = new Set();
      for (const [key, patch] of flatContacts) {
        if (!key.startsWith(`${state}/`)) continue;
        const guest = byId.get(patch.guest), host = byId.get(patch.host);
        const axis = patch.axis === "-Y" ? "y" : "z";
        const transverse = patch.axis === "-Y" ? "z" : "y";
        /** @param {[number,number]} interval @param {[number,number]} bounds */
        const inRange = (interval, bounds) => interval[0] >= bounds[0] - epsilon &&
          interval[1] <= bounds[1] + epsilon;
        let valid = !!guest && (guest.contact.includes(patch.host) ||
          !!host && host.contact.includes(patch.guest)) &&
          occupiedBoxes(guest, voids, pieces).some((box) =>
            Math.abs(box[axis][0] - patch.plane) <= epsilon &&
            inRange(patch.u, box.x) && inRange(patch.v, box[transverse])) &&
          patch.u[1] - patch.u[0] > epsilon && patch.v[1] - patch.v[0] > epsilon;
        if (patch.host === "wall") valid &&= patch.axis === "-Z" &&
          Math.abs(patch.plane - envelope.z[0]) <= epsilon;
        else if (patch.host === "ground" || patch.host === "support" || /^support@[\d.]+$/.test(patch.host)) {
          const height = patch.host.startsWith("support@") ? Number(patch.host.slice(8)) : 0;
          valid &&= patch.axis === "-Y" && Math.abs(patch.plane - height) <= epsilon;
        }
        else if (host) {
          valid &&= occupiedBoxes(host, voids, pieces).some((box) =>
            Math.abs(box[axis][1] - patch.plane) <= epsilon &&
            inRange(patch.u, box.x) && inRange(patch.v, box[transverse]));
          const shear = shearsZ.get(`${state}/${host.id}`);
          if (patch.axis === "-Y" && shear && Math.abs(shear.y[1] - patch.plane) <= epsilon)
            valid &&= inRange(patch.v, [shear.z[1] - shear.halfDepth,
              shear.z[1] + shear.halfDepth]);
          if (patch.axis === "-Y" && host.shape === "cylinder") {
            const radiusX = (host.x[1] - host.x[0]) / 2;
            const radiusZ = (host.z[1] - host.z[0]) / 2;
            const centerX = (host.x[0] + host.x[1]) / 2;
            const centerZ = (host.z[0] + host.z[1]) / 2;
            valid &&= Math.abs(radiusX - radiusZ) <= epsilon &&
              patch.u.every((x) => patch.v.every((z) =>
                Math.hypot(x - centerX, z - centerZ) < radiusX - epsilon));
          }
        } else valid = false;
        if (!valid) errors.push(`${anchor}/${key}: flat contact has no finite common patch`);
        else if (host) provedCurves.add(`${state}/${[patch.guest, patch.host].sort((a, b) => a.localeCompare(b)).join("/")}`);
        else provedExternal.add(`${patch.guest}/${patch.host}`);
      }
      for (const [key, cap] of capContacts) {
        if (!key.startsWith(`${state}/`)) continue;
        const first = byId.get(cap.first), second = byId.get(cap.second);
        const axis = /** @type {"x"|"y"|"z"} */ (cap.axis);
        const transverse = /** @type {const} */ (["x", "y", "z"]).filter((candidate) => candidate !== axis);
        const end = cap.side === "+" ? 1 : 0;
        const valid = !!first && !!second &&
          (first.contact.includes(cap.second) || second.contact.includes(cap.first)) &&
          Math.abs(first[axis][end] - second[axis][1 - end]) <= epsilon &&
          transverse.every((other) => Math.min(first[other][1], second[other][1]) -
            Math.max(first[other][0], second[other][0]) > epsilon) &&
          capContactArea(first, second, axis, first[axis][end], radial, radialZ, bores, boresZ, ellipses) > 1e-8;
        if (!valid) errors.push(`${anchor}/${key}: cap contact has no finite common face`);
        else provedCurves.add(key);
      }
      for (const [key, cavityContact] of cavityContacts) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(cavityContact.host), guest = byId.get(cavityContact.guest);
        const axis = /** @type {"x"|"y"|"z"} */ (cavityContact.axis);
        const transverse = /** @type {const} */ (["x", "y", "z"]).filter((candidate) => candidate !== axis);
        const valid = !!host && !!guest &&
          (host.contact.includes(guest.id) || guest.contact.includes(host.id)) &&
          (voids.get(`${state}/${host.id}`) || []).some((hole) =>
            [0, 1].some((end) =>
              Math.abs(guest[axis][end] - hole[axis][end]) <= epsilon &&
              hole[axis][end] > host[axis][0] + epsilon &&
              hole[axis][end] < host[axis][1] - epsilon &&
              transverse.every((other) =>
                guest[other][0] >= hole[other][0] - epsilon &&
                guest[other][1] <= hole[other][1] + epsilon &&
                Math.min(guest[other][1], hole[other][1]) -
                Math.max(guest[other][0], hole[other][0]) > epsilon)));
        if (!valid) errors.push(`${anchor}/${key}: cavity side has no finite contact face`);
        else provedCurves.add(key);
      }
      for (const [key, bore] of boresX) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(key.slice(state.length + 1));
        const cylinder = stateParts.filter((part) => part.contact.includes(host?.id || "") &&
          part.shape === "cylinder" && host?.contact.includes(part.id));
        const voidRegion = (voids.get(key) || []).some((hole) =>
          Math.abs(hole.x[0] - bore.x[0]) <= epsilon &&
          Math.abs(hole.x[1] - bore.x[1]) <= epsilon &&
          Math.abs(hole.y[0] - (bore.centerY - bore.radius)) <= epsilon &&
          Math.abs(hole.y[1] - (bore.centerY + bore.radius)) <= epsilon &&
          Math.abs(hole.z[0] - (bore.centerZ - bore.radius)) <= epsilon &&
          Math.abs(hole.z[1] - (bore.centerZ + bore.radius)) <= epsilon);
        if (!host || cylinder.length !== 1 || !voidRegion || bore.radius <= epsilon ||
          bore.x[0] < host.x[0] - epsilon || bore.x[1] > host.x[1] + epsilon ||
          Math.abs((cylinder[0].y[0] + cylinder[0].y[1]) / 2 - bore.centerY) > epsilon ||
          Math.abs((cylinder[0].z[0] + cylinder[0].z[1]) / 2 - bore.centerZ) > epsilon ||
          Math.abs((cylinder[0].y[1] - cylinder[0].y[0]) / 2 - bore.radius) > epsilon ||
          Math.abs((cylinder[0].z[1] - cylinder[0].z[0]) / 2 - bore.radius) > epsilon ||
          Math.min(cylinder[0].x[1], bore.x[1]) -
          Math.max(cylinder[0].x[0], bore.x[0]) <= epsilon)
          errors.push(`${anchor}/${key}: axial bore lacks a fitted cylinder contact`);
        else provedCurves.add(`${state}/${[host.id, cylinder[0].id].sort((a, b) => a.localeCompare(b)).join("/")}`);
      }
      if (anchor === "recessed-light" && !emitterFaces.has(state))
        errors.push(`${anchor}/${state}: emitter face declaration absent`);
      const luminousId = emitterFaces.get(state);
      if (luminousId) {
        const luminous = byId.get(luminousId);
        if (!luminous || visibleEmitterFraction(luminous, stateParts, radial, state) < 0.95)
          errors.push(`${anchor}/${state}: emissive face is occluded from the room`);
      }
      for (const part of stateParts) if (part.shape === "cylinder" && /^hinge-/.test(part.id) &&
        part.contact.some((target) => target === "closed-panel" || target === "bed-frame") &&
        !pinFaces.has(`${state}/${part.id}`))
        errors.push(`${anchor}/${state}/${part.id}: missing pin-face declaration`);
      for (const [key, targetId] of pinFaces) {
        if (!key.startsWith(`${state}/`)) continue;
        const pin = byId.get(key.slice(state.length + 1));
        const target = byId.get(targetId);
        if (!pin || !target || pin.shape !== "cylinder" || !pin.contact.includes(targetId) ||
          pinFaceArea(pin, target) <= 1e-8)
          errors.push(`${anchor}/${key}: pin end cap has no finite contact face with ${targetId}`);
        else provedCurves.add(`${state}/${[pin.id, targetId].sort((a, b) => a.localeCompare(b)).join("/")}`);
      }
      for (const [key, cavities] of voids) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(key.slice(state.length + 1));
        if (!host) { errors.push(`${anchor}/${key}: void host absent`); continue; }
        for (const cavity of cavities) {
          for (const axis of /** @type {const} */ (["x", "y", "z"]))
            if (cavity[axis][0] < host[axis][0] - epsilon || cavity[axis][1] > host[axis][1] + epsilon)
              errors.push(`${anchor}/${key}: void ${axis} exits host`);
        }
        if (!occupiedBoxes(host, voids, pieces).length) errors.push(`${anchor}/${key}: void removes entire host`);
      }
      for (const [key, regions] of pieces) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(key.slice(state.length + 1));
        if (!host) { errors.push(`${anchor}/${key}: piece host absent`); continue; }
        for (const axis of /** @type {const} */ (["x", "y", "z"])) {
          const min = Math.min(...regions.map((piece) => piece[axis][0]));
          const max = Math.max(...regions.map((piece) => piece[axis][1]));
          if (Math.abs(min - host[axis][0]) > epsilon || Math.abs(max - host[axis][1]) > epsilon)
            errors.push(`${anchor}/${key}: piece union ${axis} differs from part bounds`);
        }
        for (let i = 0; i < regions.length; i++) for (let j = i + 1; j < regions.length; j++) {
          if (overlap(regions[i], regions[j]).every((size) => size > epsilon))
            errors.push(`${anchor}/${key}: piece interiors overlap`);
        }
        const visited = new Set([0]);
        let changed = true;
        while (changed) {
          changed = false;
          for (let i = 0; i < regions.length; i++) if (!visited.has(i) &&
            [...visited].some((j) => surfaceContact(regions[i], regions[j]))) { visited.add(i); changed = true; }
        }
        if (visited.size !== regions.length) errors.push(`${anchor}/${key}: piece union disconnected`);
      }
      for (const [key, shear] of shearsZ) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(key.slice(state.length + 1));
        const regions = pieces.get(key) || [];
        const upper = regions.find((piece) =>
          Math.abs(piece.y[0] - shear.y[0]) <= epsilon && Math.abs(piece.y[1] - shear.y[1]) <= epsilon);
        if (!host || host.shape !== "curved" || !upper || !(shear.halfDepth > epsilon) ||
          Math.abs(upper.z[0] - (shear.z[0] - shear.halfDepth)) > epsilon ||
          Math.abs(upper.z[1] - (shear.z[1] + shear.halfDepth)) > epsilon ||
          !regions.some((piece) => Math.abs(piece.y[1] - shear.y[0]) <= epsilon &&
            Math.min(piece.x[1], upper?.x[1] || 0) - Math.max(piece.x[0], upper?.x[0] || 0) > epsilon &&
            Math.min(piece.z[1], shear.z[0] + shear.halfDepth) -
              Math.max(piece.z[0], shear.z[0] - shear.halfDepth) > epsilon))
          errors.push(`${anchor}/${key}: shear-z bounds or lower finite contact differ`);
      }
      for (const [key, radii] of radial) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(key.slice(state.length + 1));
        if (!host) { errors.push(`${anchor}/${key}: radial host absent`); continue; }
        if (Math.abs(host.x[0] - (radii.centerX - radii.outer)) > epsilon ||
          Math.abs(host.x[1] - (radii.centerX + radii.outer)) > epsilon ||
          Math.abs(host.z[0] - (radii.centerZ - radii.outer)) > epsilon ||
          Math.abs(host.z[1] - (radii.centerZ + radii.outer)) > epsilon)
          errors.push(`${anchor}/${key}: radial radius differs from AABB`);
      }
      for (const [key, radii] of radialZ) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(key.slice(state.length + 1));
        if (!host) { errors.push(`${anchor}/${key}: radial-z host absent`); continue; }
        if (Math.abs(host.x[0] - (radii.centerX - radii.outer)) > epsilon ||
          Math.abs(host.x[1] - (radii.centerX + radii.outer)) > epsilon ||
          Math.abs(host.y[0] - (radii.centerY - radii.outer)) > epsilon ||
          Math.abs(host.y[1] - (radii.centerY + radii.outer)) > epsilon)
          errors.push(`${anchor}/${key}: radial-z radius differs from AABB`);
      }
      for (const [key, bore] of bores) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(key.slice(state.length + 1));
        if (!host || host.shape !== "hollow" || bore.radius <= 0 ||
          bore.radius >= Math.min(host.x[1] - host.x[0], host.z[1] - host.z[0]) / 2 - epsilon ||
          bore.y[0] < host.y[0] - epsilon || bore.y[1] > host.y[1] + epsilon)
          errors.push(`${anchor}/${key}: bore is not a contained open cavity`);
      }
      for (const [key, bore] of boresZ) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(key.slice(state.length + 1));
        if (!host || host.shape !== "hollow" || bore.radius <= 0 ||
          bore.centerX - bore.radius <= host.x[0] + epsilon ||
          bore.centerX + bore.radius >= host.x[1] - epsilon ||
          bore.centerY - bore.radius <= host.y[0] + epsilon ||
          bore.centerY + bore.radius >= host.y[1] - epsilon ||
          bore.z[0] < host.z[0] - epsilon || bore.z[1] > host.z[1] + epsilon)
          errors.push(`${anchor}/${key}: bore-z is not a contained circular cavity`);
      }
      for (const [key, ellipse] of ellipses) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(key.slice(state.length + 1));
        if (!host || host.shape !== "hollow" || ellipse.innerX <= 0 || ellipse.innerZ <= 0 ||
          ellipse.innerX >= ellipse.outerX || ellipse.innerZ >= ellipse.outerZ ||
          Math.abs(host.x[0] - (ellipse.centerX - ellipse.outerX)) > epsilon ||
          Math.abs(host.x[1] - (ellipse.centerX + ellipse.outerX)) > epsilon ||
          Math.abs(host.z[0] - (ellipse.centerZ - ellipse.outerZ)) > epsilon ||
          Math.abs(host.z[1] - (ellipse.centerZ + ellipse.outerZ)) > epsilon)
          errors.push(`${anchor}/${key}: elliptic ring differs from part bounds`);
      }
      for (const [key, tangent] of tangents) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(tangent.host), guest = byId.get(tangent.guest);
        const zBack = Math.sqrt(tangent.radius ** 2 - tangent.halfWidth ** 2);
        if (!host || !guest || !(tangent.radius > tangent.halfWidth && tangent.halfWidth > 0) ||
          host.shape !== "hollow" || guest.shape !== "curved" ||
          Math.abs(host.x[0] + tangent.radius) > epsilon || Math.abs(host.x[1] - tangent.radius) > epsilon ||
          Math.abs(host.z[1] - tangent.radius) > epsilon ||
          Math.abs(guest.x[0] + tangent.halfWidth) > epsilon || Math.abs(guest.x[1] - tangent.halfWidth) > epsilon ||
          Math.abs(guest.z[0] - zBack) > epsilon || guest.y[0] < host.y[0] || guest.y[1] > host.y[1] ||
          !lines.join("\n").includes("z_back(x)=sqrt(R²−x²)"))
          errors.push(`${anchor}/${key}: cylindrical tangent proof invalid`);
        else provedTangents.add(key);
      }
      for (const [key, curve] of curveLayers) {
        if (!key.startsWith(`${state}/`)) continue;
        const shell = byId.get(curve.shell), cover = byId.get(curve.cover);
        const base = curve.c0, end = curve.c0 + curve.c1 + curve.c2;
        const monotone = curve.c1 < -epsilon && curve.c1 + 2 * curve.c2 < -epsilon;
        const segments = [...(pieces.get(`${state}/${curve.cover}`) || [])]
          .sort((a, b) => a.y[0] - b.y[0]);
        /** @param {number} y */
        const at = (y) => {
          if (!shell) return NaN;
          const t = (y - shell.y[0]) / (shell.y[1] - shell.y[0]);
          return curve.c0 + curve.c1 * t + curve.c2 * t * t;
        };
        /** @param {number} a @param {number} b */
        const matches = (a, b) => Math.abs(a - b) < 0.000001;
        const shapedPieces = shell && cover && segments.length === 2 &&
          segments.every((segment) => matches(segment.x[0], cover.x[0]) && matches(segment.x[1], cover.x[1])) &&
          matches(segments[0].y[0], shell.y[0]) && matches(segments[0].y[1], segments[1].y[0]) &&
          matches(segments[1].y[1], shell.y[1]) &&
          matches(segments[0].z[0], at(segments[0].y[1]) + curve.shellDepth + curve.seatGap) &&
          matches(segments[0].z[1], cover.z[1]) &&
          matches(segments[1].z[0], at(shell.y[1]) + curve.shellDepth) &&
          matches(segments[1].z[1], at(segments[1].y[0]) + curve.shellDepth + curve.coverDepth);
        if (!shell || !cover || !monotone || !(curve.shellDepth > 0 && curve.coverDepth > 0) ||
          !(curve.seatGap >= 0) || !shapedPieces ||
          shell.shape !== "curved" || cover.shape !== "curved" ||
          Math.abs(shell.z[0] - end) > epsilon || Math.abs(shell.z[1] - (base + curve.shellDepth)) > epsilon ||
          Math.abs(cover.z[0] - (end + curve.shellDepth)) > epsilon ||
          Math.abs(shell.y[1] - cover.y[1]) > epsilon ||
          !lines.join("\n").includes("z(y)=−0.10−0.17t−0.02×4t(1−t)"))
          errors.push(`${anchor}/${key}: curved layer polynomial or contact is inconsistent`);
        else provedCurves.add(key);
      }
      for (const [key, curve] of linearCurves) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(curve.host), guest = byId.get(curve.guest);
        /** @param {number} y */
        const at = (y) => curve.c0 + curve.c1 * (y - curve.originY) / curve.spanY;
        /** @param {number} value @param {number} expected */
        const approx = (value, expected) => Math.abs(value - expected) <= 0.00001;
        if (!host || !guest || host.shape !== "curved" || guest.shape !== "curved" ||
          !(curve.spanY > 0 && curve.hostDepth > 0 && curve.guestDepth > 0 && curve.gap >= 0 && curve.c1 < 0) ||
          host.y[0] < curve.originY - epsilon || host.y[1] > curve.originY + curve.spanY + epsilon ||
          guest.y[0] < curve.originY - epsilon || guest.y[1] > curve.originY + curve.spanY + epsilon ||
          Math.max(host.y[0], guest.y[0]) >= Math.min(host.y[1], guest.y[1]) ||
          host.x[0] > guest.x[0] + epsilon || host.x[1] < guest.x[1] - epsilon ||
          !approx(host.z[0], at(host.y[1])) || !approx(host.z[1], at(host.y[0]) + curve.hostDepth) ||
          !approx(guest.z[0], at(guest.y[1]) + curve.hostDepth + curve.gap) ||
          !approx(guest.z[1], at(guest.y[0]) + curve.hostDepth + curve.gap + curve.guestDepth))
          errors.push(`${anchor}/${key}: linear curved surfaces do not match part bounds`);
        else provedLinear.set(key, curve.gap <= epsilon);
      }
      const names = inventory.get(state);
      if (!names) errors.push(`${anchor}/${state}: no @inventory row`);
      else {
        for (const name of names) if (!byId.has(name)) errors.push(`${anchor}/${state}: inventoried part ${name} absent`);
        for (const part of stateParts) if (!names.includes(part.id)) errors.push(`${anchor}/${state}: part ${part.id} missing from inventory`);
        if (new Set(names).size !== names.length) errors.push(`${anchor}/${state}: duplicate inventory name`);
      }
      for (const part of stateParts) {
        examined++;
        for (const axis of /** @type {const} */ (["x", "y", "z"]))
          if (part[axis][0] < envelope[axis][0] - epsilon || part[axis][1] > envelope[axis][1] + epsilon)
            errors.push(`${anchor}/${state}/${part.id}: ${axis} exits declared envelope`);
        if (!part.contact.length) errors.push(`${anchor}/${state}/${part.id}: contact path absent`);
        for (const target of part.contact) {
          const adjacent = byId.get(target);
          if (adjacent) {
            if (!actualContact(part, adjacent, radial, radialZ, boresZ, voids, pieces, shearsZ, provedTangents, provedCurves, provedLinear, plant.contacts, unprovedCurved, anchor))
              errors.push(`${anchor}/${state}/${part.id}: no face contact with ${target}`);
          } else if (target === "ground" || target === "support" || /^support@[\d.]+$/.test(target)) {
            const height = target.startsWith("support@") ? Number(target.slice(8)) : 0;
            if (!occupiedBoxes(part, voids, pieces).some((box) => Math.abs(box.y[0] - height) <= epsilon &&
              box.x[1] - box.x[0] > epsilon && box.z[1] - box.z[0] > epsilon))
              errors.push(`${anchor}/${state}/${part.id}: misses ${target}`);
            if (part.shape === "curved" && !shearsZ.has(`${state}/${part.id}`) &&
              !provedExternal.has(`${part.id}/${target}`))
              errors.push(`${anchor}/${state}/${part.id}: curved ${target} lacks finite contact patch`);
          } else if (target === "wall") {
            if (!occupiedBoxes(part, voids, pieces).some((box) => Math.abs(box.z[0] - envelope.z[0]) <= epsilon))
              errors.push(`${anchor}/${state}/${part.id}: misses wall datum`);
            if (part.shape === "curved" && !provedExternal.has(`${part.id}/wall`))
              errors.push(`${anchor}/${state}/${part.id}: curved wall lacks finite contact patch`);
          } else if (target === "ceiling" || target === "suspension" || target === "underside") {
            if (!occupiedBoxes(part, voids, pieces).some((box) => Math.abs(box.y[1]) <= epsilon))
              errors.push(`${anchor}/${state}/${part.id}: misses ${target} datum`);
          } else errors.push(`${anchor}/${state}/${part.id}: contact target ${target} absent`);
        }
      }
      for (let i = 0; i < stateParts.length; i++) for (let j = i + 1; j < stateParts.length; j++) {
        const a = stateParts[i], b = stateParts[j], extent = overlap(a, b);
        if (actualOverlap(a, b, radial, radialZ, boresZ, voids, pieces, provedTangents, provedCurves, provedLinear, plant.nonOverlaps)) {
          if (a.shape === "box" && b.shape === "box")
            errors.push(`${anchor}/${state}: ${a.id} intersects ${b.id} (${extent.join(" x ")})`);
          else {
            const key = `${state}/${[a.id, b.id].sort((left, right) => left.localeCompare(right)).join("/")}`;
            const miter = miterJoints.has(key) && a.shape === "mitered-box" && b.shape === "mitered-box" &&
              Math.abs(extent[0] - 0.009) <= epsilon && Math.abs(extent[1] - 0.018) <= epsilon &&
              Math.abs(extent[2] - 0.009) <= epsilon &&
              (a.x[1] - a.x[0] > 0.20) !== (b.x[1] - b.x[0] > 0.20) &&
              (a.z[1] - a.z[0] > 0.20) !== (b.z[1] - b.z[0] > 0.20);
            if (miter) provedMiterJoints.add(key);
            else errors.push(`${anchor}/${state}: ${a.id} / ${b.id} needs shape intersection proof (${a.shape}/${b.shape})`);
          }
        }
      }
      const reached = new Set(stateParts.filter((part) => part.contact.includes("ground") || part.contact.some((target) => target === "support" || /^support@[\d.]+$/.test(target)) ||
        part.contact.includes("ceiling") || part.contact.includes("suspension") || part.contact.includes("underside") || (part.contact.includes("wall") && !byId.has("wall"))).map((part) => part.id));
      let changed = true;
      while (changed) {
        changed = false;
        for (const part of stateParts) if (!reached.has(part.id) && part.contact.some((target) => reached.has(target))) {
          reached.add(part.id); changed = true;
        }
      }
      for (const part of stateParts) if (!reached.has(part.id))
        errors.push(`${anchor}/${state}/${part.id}: disconnected from ground or wall`);
    }
    for (const part of parts.values()) if (!envelopes.has(part.state))
      errors.push(`${anchor}/${part.state}/${part.id}: undeclared state`);
    for (const key of voids.keys()) if (!parts.has(key)) errors.push(`${anchor}/${key}: void has no part`);
    for (const key of pieces.keys()) if (!parts.has(key)) errors.push(`${anchor}/${key}: piece has no part`);
    for (const key of radial.keys()) if (!parts.has(key)) errors.push(`${anchor}/${key}: radial declaration has no part`);
    for (const key of radialZ.keys()) if (!parts.has(key)) errors.push(`${anchor}/${key}: radial-z declaration has no part`);
    for (const key of bores.keys()) if (!parts.has(key)) errors.push(`${anchor}/${key}: bore has no part`);
    for (const key of boresZ.keys()) if (!parts.has(key)) errors.push(`${anchor}/${key}: bore-z has no part`);
    for (const key of ellipses.keys()) if (!parts.has(key)) errors.push(`${anchor}/${key}: ellipse has no part`);
    for (const key of tangents.keys()) if (!provedTangents.has(key)) errors.push(`${anchor}/${key}: tangent proof was not discharged`);
    for (const key of curveLayers.keys()) if (!provedCurves.has(key)) errors.push(`${anchor}/${key}: curved layer proof was not discharged`);
    for (const key of linearCurves.keys()) if (!provedLinear.has(key)) errors.push(`${anchor}/${key}: linear curve proof was not discharged`);
    for (const state of inventory.keys()) if (!envelopes.has(state))
      errors.push(`${anchor}/${state}: inventory for undeclared state`);
    for (const key of miterJoints) if (!provedMiterJoints.has(key))
      errors.push(`${anchor}/${key}: miter proof has no qualifying joint`);
    if (anchor === "folded-towels") errors.push(...towelFormula(lines, envelopes, parts));
    if (anchor === "entry-charger") errors.push(...chargerFormula(lines, envelopes, voids));
    if (anchor === "rugs") errors.push(...rugFormula(lines, envelopes, parts, voids, radial));
    errors.push(...simpleProseEnvelope(anchor, lines, envelopes));
    if (anchor === "dining-pendant") errors.push(...pendantFormula(lines, envelopes, radial));
    if (anchor === "books") errors.push(...bookFormula(lines, envelopes, parts));
    if (anchor === "tabletop-props") errors.push(...propFormula(lines, envelopes, bores, ellipses, tangents));
    if (anchor === "bathtub") errors.push(...tubFormula(lines, envelopes, parts, voids));
    if (anchor === "work-equipment") errors.push(...equipmentFormula(lines, envelopes, parts, grids));
  }
  return { prototypes: allSections.size, measuredPrototypes, parts: examined, hollowParts, provedHollowParts,
    cavityProfileParts, provedCavityProfiles, vesselRows, vesselStates, provedVesselStates,
    closureRows, closureStates, provedClosureStates,
    unprovedCurvedContacts: [...unprovedCurved], errors };
}

// Challenge the complete literal part population in memory. Crypto chooses
// the owner, state, and part after the fixture is assembled, so the author
// cannot choose favorable examples for the red result.
function randomFixture() {
  const baseline = sections();
  /** @type {Array<{owner:string,index:number,cells:string[]}>} */
  const candidates = [];
  for (const [owner, lines] of baseline) for (let index = 0; index < lines.length; index++) {
    const cells = lines[index].split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length === 8 && cells[0] === "@part") candidates.push({ owner, index, cells });
  }
  if (!candidates.length) throw Error("empty model part mutation population");
  /** @type {Array<{kind:string,owner:string,state:string,part:string,red:boolean,first:string|null}>} */
  const results = [];
  for (const kind of ["nudge", "lift", "delete", "overlap"]) {
    const eligible = kind === "overlap" ? candidates.filter((entry) =>
      candidates.some((peer) => peer.owner === entry.owner && peer.cells[1] === entry.cells[1] &&
        peer.cells[2] !== entry.cells[2])) : candidates;
    const picked = eligible[randomInt(eligible.length)];
    const original = baseline.get(picked.owner);
    if (!original) throw Error(`missing model owner ${picked.owner}`);
    const lines = [...original], cells = [...picked.cells];
    if (kind === "delete") lines.splice(picked.index, 1);
    else if (kind === "overlap") {
      const peers = eligible.filter((peer) => peer.owner === picked.owner &&
        peer.cells[1] === cells[1] && peer.cells[2] !== cells[2]);
      const peer = peers[randomInt(peers.length)];
      cells.splice(4, 3, ...peer.cells.slice(4, 7));
      lines[picked.index] = `| ${cells.join(" | ")} |`;
    } else {
      const column = kind === "lift" ? 5 : 4;
      const old = cells[column].replaceAll("−", "-").split("..").map(Number);
      const envelope = parse(lines, picked.owner).envelopes.get(cells[1]);
      if (!envelope) throw Error(`missing model envelope ${picked.owner}/${cells[1]}`);
      const span = kind === "lift" ? envelope.y : envelope.x;
      const delta = span[1] - old[0] + old[1] - old[0];
      cells[column] = `${old[0] + delta}..${old[1] + delta}`;
      lines[picked.index] = `| ${cells.join(" | ")} |`;
    }
    const changed = new Map(baseline);
    changed.set(picked.owner, lines);
    const result = audit(changed);
    const findings = [...result.errors, ...result.unprovedCurvedContacts];
    results.push({ kind, owner: picked.owner, state: cells[1], part: cells[2],
      red: findings.length > 0, first: findings[0] || null });
  }
  const cavityRows = [];
  for (const [owner, lines] of baseline) {
    const grouped = new Map();
    for (let index = 0; index < lines.length; index++) {
      const match = /^@(bore|bore-z|cavity-profile|void|ellipse|radial|radial-z)\s+([^:]+):\s*([^,]+)/.exec(lines[index]);
      if (!match) continue;
      const key = `${match[2].trim()}/${match[3].trim()}`;
      grouped.set(key, [...(grouped.get(key) || []), index]);
    }
    const parsed = parse(lines, owner);
    for (const [key, indices] of grouped) if (indices.length === 1 && parsed.parts.get(key)?.shape === "hollow")
      cavityRows.push({ owner, key, index: indices[0] });
  }
  if (!cavityRows.length) throw Error("empty hollow cavity mutation population");
  const cavity = cavityRows[randomInt(cavityRows.length)];
  const sourceLines = baseline.get(cavity.owner);
  if (!sourceLines) throw Error(`missing model section ${cavity.owner}`);
  const cavityLines = [...sourceLines];
  cavityLines.splice(cavity.index, 1);
  const cavityChanged = new Map(baseline);
  cavityChanged.set(cavity.owner, cavityLines);
  const cavityError = audit(cavityChanged).errors.find((error) => error.includes(`${cavity.owner}/${cavity.key}: hollow part has no authored cavity`));
  results.push({ kind: "cavity-delete", owner: cavity.owner, state: cavity.key.split("/")[0],
    part: cavity.key.split("/")[1], red: !!cavityError, first: cavityError || null });
  const profiles = [];
  for (const [owner, lines] of baseline) for (let index = 0; index < lines.length; index++) {
    const match = /^@cavity-profile\s+([^:]+):\s*([^,]+),/.exec(lines[index]);
    if (match) profiles.push({ owner, index, state: match[1].trim(), part: match[2].trim() });
  }
  if (!profiles.length) throw Error("empty cavity profile mutation population");
  const selectedProfile = profiles[randomInt(profiles.length)];
  const profileSource = baseline.get(selectedProfile.owner);
  if (!profileSource) throw Error(`missing model section ${selectedProfile.owner}`);
  const profileLines = [...profileSource];
  const profilePart = parse(profileLines, selectedProfile.owner).parts.get(`${selectedProfile.state}/${selectedProfile.part}`);
  if (!profilePart) throw Error(`missing cavity profile part ${selectedProfile.owner}/${selectedProfile.state}`);
  profileLines[selectedProfile.index] = profileLines[selectedProfile.index].replace(/[\d.]+$/,
    String(profilePart.x[1] - profilePart.x[0]));
  const profileChanged = new Map(baseline);
  profileChanged.set(selectedProfile.owner, profileLines);
  const profileError = audit(profileChanged).errors.find((error) =>
    error.includes(`${selectedProfile.owner}/${selectedProfile.state}/${selectedProfile.part}: cavity profile mouth`));
  results.push({ kind: "profile-mouth", owner: selectedProfile.owner,
    state: selectedProfile.state, part: selectedProfile.part, red: !!profileError, first: profileError || null });
  const ellipseProfiles = profiles.filter((entry) => {
    const lines = baseline.get(entry.owner);
    if (!lines || !/^@cavity-profile\s+[^:]+:\s*[^,]+,\s*ellipse,/.test(lines[entry.index])) return false;
    const part = parse(lines, entry.owner).parts.get(`${entry.state}/${entry.part}`);
    return part && part.x[1] - part.x[0] > part.z[1] - part.z[0] + epsilon;
  });
  if (!ellipseProfiles.length) throw Error("empty elliptical cavity profile population");
  const selectedEllipse = ellipseProfiles[randomInt(ellipseProfiles.length)];
  const ellipseSource = baseline.get(selectedEllipse.owner);
  if (!ellipseSource) throw Error(`missing model section ${selectedEllipse.owner}`);
  const ellipseLines = [...ellipseSource];
  ellipseLines[selectedEllipse.index] = ellipseLines[selectedEllipse.index].replace(", ellipse,", ", round,");
  const ellipseChanged = new Map(baseline);
  ellipseChanged.set(selectedEllipse.owner, ellipseLines);
  const ellipseError = audit(ellipseChanged).errors.find((error) =>
    error.includes(`${selectedEllipse.owner}/${selectedEllipse.state}/${selectedEllipse.part}: round cavity body`));
  results.push({ kind: "profile-section", owner: selectedEllipse.owner,
    state: selectedEllipse.state, part: selectedEllipse.part, red: !!ellipseError, first: ellipseError || null });
  const red = results.filter((result) => result.red).length;
  if (red !== results.length) throw Error(`random model mutation red ${red}/${results.length}`);
  return { population: candidates.length, cavityPopulation: cavityRows.length,
    profilePopulation: profiles.length, ellipseProfilePopulation: ellipseProfiles.length,
    mutations: results.length, red, results };
}

function randomVesselFixture() {
  const baseline = sections(), candidates = [];
  for (const [owner, lines] of baseline) for (let index = 0; index < lines.length; index++)
    if (lines[index].startsWith("@vessel-attachments")) candidates.push({ owner, index });
  if (!candidates.length) throw Error("empty vessel attachment mutation population");
  const picked = candidates[randomInt(candidates.length)];
  const results = [];
  for (const field of [1, 2, 3, 4, 5, 6]) {
    const lines = [...(baseline.get(picked.owner) || [])];
    const match = /^(@vessel-attachments\s+[^:]+:\s*)(.+)$/.exec(lines[picked.index]);
    if (!match) throw Error("selected vessel declaration vanished");
    const cells = match[2].split(",").map((cell) => cell.trim());
    cells[field] = field >= 3 && field <= 5 ? "2/1..3/1" : "2/1";
    lines[picked.index] = match[1] + cells.join(", ");
    const changed = new Map(baseline);
    changed.set(picked.owner, lines);
    const findings = audit(changed).errors;
    results.push({ field, red: findings.length > 0, first: findings[0] || null });
  }
  const original = baseline.get(picked.owner) || [];
  const removed = [...original];
  removed.splice(picked.index, 1);
  const without = new Map(baseline);
  without.set(picked.owner, removed);
  const missing = audit(without).errors;
  results.push({ field: "declaration removed", red: missing.some((error) =>
    error.includes("round cavity has extra depth")), first: missing[0] || null });
  const declaration = /^@vessel-attachments\s+([^:]+):\s*([^,]+)/.exec(original[picked.index]);
  if (!declaration) throw Error("selected vessel declaration vanished");
  const stateOptions = declaration[1].split(",").map((value) => value.trim());
  const state = stateOptions[randomInt(stateOptions.length)];
  const profileLines = [...original];
  const profileAt = profileLines.findIndex((line) =>
    line.startsWith(`@cavity-profile ${state}: ${declaration[2].trim()},`));
  const part = parse(profileLines, picked.owner).parts.get(`${state}/${declaration[2].trim()}`);
  if (profileAt < 0 || !part) throw Error("selected vessel profile vanished");
  profileLines[profileAt] = profileLines[profileAt].replace(/[\d.]+$/,
    String(part.x[1] - part.x[0]));
  const changed = new Map(baseline);
  changed.set(picked.owner, profileLines);
  const findings = audit(changed).errors;
  results.push({ field: "random profile mouth", state, red: findings.some((error) =>
    error.startsWith(`${picked.owner}/${state}/`)), first: findings[0] || null });
  const red = results.filter((result) => result.red).length;
  if (red !== results.length) throw Error(`vessel attachment mutations red ${red}/${results.length}`);
  return { population: candidates.length, statePopulation: stateOptions.length,
    mutations: results.length, red, results };
}

function randomClosureFixture() {
  const baseline = sections(), candidates = [];
  for (const [owner, lines] of baseline) for (let index = 0; index < lines.length; index++)
    if (lines[index].startsWith("@vessel-closure")) candidates.push({ owner, index });
  if (!candidates.length) throw Error("empty vessel closure mutation population");
  const picked = candidates[randomInt(candidates.length)];
  const source = baseline.get(picked.owner) || [];
  const results = [];
  const invalid = [...source];
  invalid[picked.index] = invalid[picked.index].replace(/\d+\/\d+$/, "2/1");
  if (invalid[picked.index] === source[picked.index]) throw Error("selected vessel closure declaration unchanged");
  const withInvalid = new Map(baseline); withInvalid.set(picked.owner, invalid);
  const invalidErrors = audit(withInvalid).errors;
  results.push({ kind: "cap height", red: invalidErrors.some((error) =>
    error.includes("cap cannot close the neck within measured bounds")), first: invalidErrors[0] || null });
  const removed = [...source]; removed.splice(picked.index, 1);
  const without = new Map(baseline); without.set(picked.owner, removed);
  const removedErrors = audit(without).errors;
  results.push({ kind: "closure deleted", red: removedErrors.some((error) =>
    error.startsWith(`${picked.owner}: prose names vessel closure`) ||
    error.startsWith(`${picked.owner}/`) && error.includes("lacks a closure")),
    first: removedErrors[0] || null });
  const declaration = /^@vessel-closure\s+([^:]+):\s*([^,]+),/.exec(source[picked.index]);
  if (!declaration) throw Error("selected vessel closure disappeared");
  const states = declaration[1].split(",").map((value) => value.trim());
  const state = states[randomInt(states.length)];
  const profileLines = [...source];
  const profileAt = profileLines.findIndex((line) =>
    line.startsWith(`@cavity-profile ${state}: ${declaration[2].trim()},`));
  const part = parse(profileLines, picked.owner).parts.get(`${state}/${declaration[2].trim()}`);
  if (profileAt < 0 || !part) throw Error("selected closure profile disappeared");
  profileLines[profileAt] = profileLines[profileAt].replace(/[\d.]+$/, String(part.x[1] - part.x[0]));
  const withWideMouth = new Map(baseline); withWideMouth.set(picked.owner, profileLines);
  const profileErrors = audit(withWideMouth).errors;
  results.push({ kind: "random mouth", state, red: profileErrors.some((error) =>
    error.startsWith(`${picked.owner}/${state}/`)), first: profileErrors[0] || null });
  const red = results.filter((result) => result.red).length;
  if (red !== results.length) throw Error(`vessel closure mutations red ${red}/${results.length}`);
  return { population: candidates.length, statePopulation: states.length,
    mutations: results.length, red, results };
}

if (require.main !== module) {
  module.exports = { audit, sections, parse };
} else if (process.argv.includes("--fixture")) {
  const original = sections().get("dining-table");
  if (!original) throw Error("dining-table H2 absent");
  /** @param {string[]} lines */
  const fixture = (lines) => audit(new Map([["dining-table", lines]]));
  const baseline = fixture(original);
  if (baseline.errors.length || baseline.parts !== 5) throw Error(`dining-table baseline failed: ${baseline.errors}`);
  const mutations = [
    ["out of bounds", "-0.90..0.90 | 0.696..0.74", "-0.90..1.10 | 0.696..0.74", "exits declared envelope"],
    ["lifted leg", "-0.8325..-0.7875 | 0..0.696", "-0.8325..-0.7875 | 0.05..0.696", "misses ground"],
    ["missing part", "| @part | default | leg-0 | box | -0.8325..-0.7875 | 0..0.696 | -0.3925..-0.3475 | ground,top |", "", "contact target leg-0 absent"],
    ["overlap", "| @part | default | leg-0 | box | -0.8325..-0.7875 | 0..0.696 | -0.3925..-0.3475 | ground,top |",
      "| @part | default | leg-0 | box | -0.8325..-0.7875 | 0..0.696 | 0.3475..0.3925 | ground,top |", "intersects leg-1"],
    ["unreferenced leg removed", "| @part | default | leg-3 | box | 0.7875..0.8325 | 0..0.696 | 0.3475..0.3925 | ground,top |", "", "inventoried part leg-3 absent"]
  ];
  const results = mutations.map(([label, before, after, expected]) => {
    const source = original.join("\n");
    if (!source.includes(before)) throw Error(`${label}: mutation source absent`);
    const measured = fixture(source.replace(before, after).split("\n"));
    if (!measured.errors.some((error) => error.includes(expected)))
      throw Error(`${label}: mutation did not reach ${expected}: ${measured.errors}`);
    return { label, caught: true };
  });
  const stool = sections().get("island-stool");
  if (!stool) throw Error("island-stool H2 absent");
  const stoolBaseline = audit(new Map([["island-stool", stool]]));
  if (stoolBaseline.errors.length) throw Error(`island-stool baseline failed: ${stoolBaseline.errors}`);
  const movedMiter = stool.join("\n").replace("-0.1265..-0.1085 | leg-0,leg-2", "-0.1265..-0.1075 | leg-0,leg-2");
  if (movedMiter === stool.join("\n")) throw Error("island-stool miter mutation source absent");
  const miterErrors = audit(new Map([["island-stool", movedMiter.split("\n")]])).errors;
  if (!miterErrors.some((error) => error.includes("needs shape intersection proof")))
    throw Error(`miter mutation was not caught: ${miterErrors}`);
  results.push({ label: "miter overlap changed", caught: true });
  const bed = sections().get("fixed-bed");
  if (!bed) throw Error("fixed-bed H2 absent");
  const bedBaseline = audit(new Map([["fixed-bed", bed]]));
  if (bedBaseline.errors.length || bedBaseline.parts !== 27)
    throw Error(`fixed-bed baseline failed: ${bedBaseline.errors}`);
  const bedSource = bed.join("\n");
  const removedDeck = bedSource.replace("| @part | 1000 | support-deck | box | -0.515..0.515 | 0.26..0.28 | -1.03..1.03 | frame-side-left,frame-side-right,mattress |", "");
  if (removedDeck === bedSource || !audit(new Map([["fixed-bed", removedDeck.split("\n")]])).errors.some((error) => error.includes("inventoried part support-deck absent")))
    throw Error("fixed-bed support deck removal did not fail");
  results.push({ label: "support deck removed", caught: true });
  const towel = sections().get("folded-towels");
  if (!towel) throw Error("folded-towels H2 absent");
  const towelSource = towel.join("\n");
  const changedFormula = towelSource.replace("h=(H−0.008)/3", "h=(H−0.010)/3");
  if (changedFormula === towelSource || !audit(new Map([["folded-towels", changedFormula.split("\n")]])).errors.some((error) => error.includes("differs from prose formula")))
    throw Error("folded towel prose formula mutation did not fail");
  results.push({ label: "towel prose formula changed", caught: true });
  const charger = sections().get("entry-charger");
  if (!charger) throw Error("entry-charger H2 absent");
  const chargerSource = charger.join("\n");
  if (audit(new Map([["entry-charger", charger]])).errors.length)
    throw Error("entry-charger baseline failed");
  const chargerMutations = [
    ["recess deleted", "@void default: body, -0.026..0.026, 0.013..0.015, -0.0375..0.0375", "", "needs shape intersection proof"],
    ["recess narrowed", "@void default: body, -0.026..0.026, 0.013..0.015, -0.0375..0.0375", "@void default: body, -0.020..0.020, 0.013..0.015, -0.0375..0.0375", "needs shape intersection proof"],
    ["cavity exits host", "@void default: body, -0.006..0.006, 0.0045..0.0105, 0.05..0.06", "@void default: body, -0.006..0.006, 0.0045..0.0105, 0.05..0.07", "void z exits host"],
    ["prose width changed", "폭 0.07, 깊이 0.12", "폭 0.08, 깊이 0.12", "prose/table interval"]
  ];
  for (const [label, before, after, expected] of chargerMutations) {
    if (!chargerSource.includes(before)) throw Error(`entry-charger ${label}: mutation source absent`);
    const changed = chargerSource.replace(before, after).split("\n");
    const errors = audit(new Map([["entry-charger", changed]])).errors;
    if (!errors.some((error) => error.includes(expected)))
      throw Error(`entry-charger ${label}: expected ${expected}, got ${errors}`);
    results.push({ label: `entry-charger ${label}`, caught: true });
  }
  const undersideSections = sections();
  const undersideCandidates = [...undersideSections].flatMap(([owner, lines]) =>
    lines.flatMap((line, index) => {
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
      return cells.length === 8 && cells[0] === "@part" && cells[7].split(",").includes("underside")
        ? [{ owner, index, cells }] : [];
    }));
  if (!undersideCandidates.length) throw Error("empty underside contact mutation population");
  const underside = undersideCandidates[randomInt(undersideCandidates.length)];
  const lowered = [...(undersideSections.get(underside.owner) || [])];
  const y = interval(underside.cells[5], "underside fixture y");
  const shifted = [...underside.cells];
  shifted[5] = `${y[0] - (y[1] - y[0])}..${y[0]}`;
  lowered[underside.index] = `| ${shifted.join(" | ")} |`;
  undersideSections.set(underside.owner, lowered);
  if (!audit(undersideSections).errors.some((error) => error.includes("misses underside datum")))
    throw Error(`${underside.owner}/${underside.cells[1]}/${underside.cells[2]}: underside contact mutation did not fail`);
  results.push({ label: "random underside contact detached", caught: true });
  const rugs = sections().get("rugs");
  if (!rugs) throw Error("rugs H2 absent");
  const rugsSource = rugs.join("\n");
  if (audit(new Map([["rugs", rugs]])).errors.length) throw Error("rugs baseline failed");
  const rugMutations = [
    ["rectangular cavity deleted", "@void living: bound-edge, -1.375..1.375, 0.013..0.016, -1.8..1.8", "", "needs shape intersection proof"],
    ["radial ring widened inward", "@radial round1200: bound-edge, 0.575, 0.6", "@radial round1200: bound-edge, 0.57, 0.6", "needs shape intersection proof"],
    ["round pile radius changed", "@radial round1200: pile, 0, 0.575", "@radial round1200: pile, 0, 0.57", "prose radial border width differs"],
    ["prose living width changed", "폭 2.80, 깊이 3.65", "폭 2.90, 깊이 3.65", "prose/table interval differs"]
  ];
  for (const [label, before, after, expected] of rugMutations) {
    if (!rugsSource.includes(before)) throw Error(`rugs ${label}: mutation source absent`);
    const errors = audit(new Map([["rugs", rugsSource.replace(before, after).split("\n")]])).errors;
    if (!errors.some((error) => error.includes(expected)))
      throw Error(`rugs ${label}: expected ${expected}, got ${errors}`);
    results.push({ label: `rugs ${label}`, caught: true });
  }
  for (const [anchor, before, after] of [
    ["dining-chair", "폭 0.48, 깊이 0.55", "폭 0.49, 깊이 0.55"],
    ["storage-basket", "폭 0.40, 깊이 0.65", "폭 0.41, 깊이 0.65"],
    ["wall-art", "폭 0.60, 높이 0.42", "폭 0.61, 높이 0.42"],
    ["living-display", "폭 1.43, 높이 0.80", "폭 1.44, 높이 0.80"]
  ]) {
    const source = sections().get(anchor)?.join("\n");
    if (!source || !source.includes(before)) throw Error(`${anchor}: prose mutation source absent`);
    const errors = audit(new Map([[anchor, source.replace(before, after).split("\n")]])).errors;
    if (!errors.some((error) => error.includes("prose/table x envelope differs")))
      throw Error(`${anchor}: prose mutation missed envelope mismatch: ${errors}`);
    results.push({ label: `${anchor} prose width changed`, caught: true });
  }
  const pendantSource = sections().get("dining-pendant")?.join("\n");
  if (!pendantSource || !pendantSource.includes("지름 0.045m")) throw Error("pendant mutation source absent");
  const pendantErrors = audit(new Map([["dining-pendant", pendantSource.replace("지름 0.045m", "지름 0.050m").split("\n")]])).errors;
  if (!pendantErrors.some((error) => error.includes("prose/table dimension")))
    throw Error(`pendant diameter mutation was not caught: ${pendantErrors}`);
  results.push({ label: "dining-pendant prose shade diameter changed", caught: true });
  const bookSource = sections().get("books")?.join("\n");
  if (!bookSource || !bookSource.includes("두께 0.004m")) throw Error("books mutation source absent");
  const bookErrors = audit(new Map([["books", bookSource.replace("두께 0.004m", "두께 0.005m").split("\n")]])).errors;
  if (!bookErrors.some((error) => error.includes("prose formula differs from table")))
    throw Error(`books cover-thickness mutation was not caught: ${bookErrors}`);
  results.push({ label: "books prose cover thickness changed", caught: true });
  const propsSource = sections().get("tabletop-props")?.join("\n");
  if (!propsSource) throw Error("tabletop-props fixture absent");
  for (const [label, before, after, expected] of [
    ["cup pad moved into body", "0.042074..0.0825 | body", "0.040000..0.0825 | body", "tangent proof invalid"],
    ["cup bore widened", "@bore cup: body, 0.0365", "@bore cup: body, 0.0430", "bore is not a contained open cavity"],
    ["tray inner radius enlarged", "@ellipse tray: rim, 0.174", "@ellipse tray: rim, 0.181", "elliptic ring differs"],
    ["bowl prose diameter changed", "외경 0.22, 높이", "외경 0.23, 높이", "prose/table envelope differs"]
  ]) {
    if (!propsSource.includes(before)) throw Error(`${label}: mutation source absent`);
    const errors = audit(new Map([["tabletop-props", propsSource.replace(before, after).split("\n")]])).errors;
    if (!errors.some((error) => error.includes(expected)))
      throw Error(`${label}: expected ${expected}, got ${errors}`);
    results.push({ label: `tabletop-props ${label}`, caught: true });
  }
  const tubSource = sections().get("bathtub")?.join("\n");
  if (!tubSource || !tubSource.includes("길이 1.53×폭 0.68m")) throw Error("bathtub prose mutation source absent");
  const tubErrors = audit(new Map([["bathtub", tubSource.replace("길이 1.53×폭 0.68m", "길이 1.50×폭 0.68m").split("\n")]])).errors;
  if (!tubErrors.some((error) => error.includes("prose/table dimension")))
    throw Error(`bathtub prose cavity mutation was not caught: ${tubErrors}`);
  results.push({ label: "bathtub prose cavity length changed", caught: true });
  const equipmentSource = sections().get("work-equipment")?.join("\n");
  if (!equipmentSource) throw Error("work-equipment fixture absent");
  for (const [label, before, after, expected] of [
    ["grid loses four keys", "@grid keyboard: keys, 12, 4", "@grid keyboard: keys, 11, 4", "inventoried part keys-44 absent"],
    ["grid pitch overlaps keys", "@grid keyboard: keys, 12, 4, 0.025", "@grid keyboard: keys, 12, 4, 0.010", "intersects keys-1"],
    ["prose pitch changed", "×0.025m, 행", "×0.026m, 행", "prose/table dimension"]
  ]) {
    if (!equipmentSource.includes(before)) throw Error(`${label}: mutation source absent`);
    const errors = audit(new Map([["work-equipment", equipmentSource.replace(before, after).split("\n")]])).errors;
    if (!errors.some((error) => error.includes(expected)))
      throw Error(`${label}: expected ${expected}, got ${errors}`);
    results.push({ label: `work-equipment ${label}`, caught: true });
  }
  const cabinetSource = fs.readFileSync(path.join(root, "docs/models/002-storage-and-sleep.md"), "utf8");
  for (const [label, before, after] of [
    ["cabinet prose island door clearance changed", "y=0.101..0.849", "y=0.101..0.850"],
    ["cabinet measured part name changed",
      "| @part | bench-base/1150x440x480/closed | back |",
      "| @part | bench-base/1150x440x480/closed | back-damaged |"]
  ]) {
    if (!cabinetSource.includes(before)) throw Error(`${label}: mutation source absent`);
    let caught = false;
    try { cabinetProducer.check(cabinetSource.replace(before, after)); }
    catch { caught = true; }
    if (!caught) throw Error(`${label}: cabinet prose/table divergence passed`);
    results.push({ label, caught });
  }
  const benchSource = sections().get("entry-bench")?.join("\n");
  const cabinetSection = sections().get("cabinet-and-shelf");
  const composeLine = "@compose default: cabinet-and-shelf, bench-base/1150x440x480/closed, 0, 0, 0";
  if (!benchSource?.includes(composeLine) || !cabinetSection) throw Error("entry-bench composition fixture absent");
  for (const [label, after, expected] of [
    ["child removed", "", "cabinet child composition absent"],
    ["child state changed", composeLine.replace("/closed", "/unknown"), "composition child state absent"],
    ["child lifted", composeLine.replace(", 0, 0, 0", ", 0, 0.01, 0"), "composite y envelope differs"]
  ]) {
    const errors = audit(new Map([
      ["entry-bench", benchSource.replace(composeLine, after).split("\n")],
      ["cabinet-and-shelf", cabinetSection]
    ])).errors;
    if (!errors.some((error) => error.includes(expected)))
      throw Error(`entry-bench ${label}: expected ${expected}, got ${errors}`);
    results.push({ label: `entry-bench ${label}`, caught: true });
  }
  /** @type {Array<[string,string,(parsed:ReturnType<typeof parse>)=>void,string]>} */
  const curvedMutations = [
    ["murphy-bed", "guest", (parsed) => { const part = parsed.parts.get("guest/bed-frame"); if (!part) throw Error("guest frame absent"); part.z[0] = 0.23; }, "pin end cap has no finite contact face"],
    ["recessed-light", "default", (parsed) => { const part = parsed.parts.get("default/diffuser"); if (!part) throw Error("diffuser absent"); part.y = [-0.015, -0.012]; }, "emissive face is occluded"],
    ["murphy-bed", "guest", (parsed) => { parsed.pinFaces.delete("guest/hinge-right"); }, "missing pin-face declaration"],
    ["toilet", "lid-open", (parsed) => { const ring = parsed.ellipses.get("lid-open/seat"); if (!ring) throw Error("seat ring absent"); ring.centerZ = 0.10; }, "elliptic ring differs"],
    ["cooking-appliances", "oven", (parsed) => { const binding = parsed.supportBindings.get("oven"); if (!binding) throw Error("oven support absent"); binding.state = "unknown"; }, "support child part absent"],
    ["kitchen-island", "default", (parsed) => { const binding = parsed.supportBindings.get("default"); if (!binding) throw Error("island support absent"); binding.offset[0] = -0.30; }, "penetrates support child"]
  ];
  for (const [anchor, state, mutate, expected] of curvedMutations) {
    const lines = sections().get(anchor);
    if (!lines) throw Error(`${anchor}: curved-contact fixture absent`);
    const cabinetLines = sections().get("cabinet-and-shelf");
    if ((anchor === "cooking-appliances" || anchor === "kitchen-island") && !cabinetLines) throw Error("cabinet fixture child absent");
    const sample = new Map([[anchor, lines]]);
    if ((anchor === "cooking-appliances" || anchor === "kitchen-island") && cabinetLines) sample.set("cabinet-and-shelf", cabinetLines);
    const errors = audit(sample, (owner, parsed) => { if (owner === anchor) mutate(parsed); }, state).errors;
    if (!errors.some((error) => error.includes(expected)))
      throw Error(`${anchor}/${state}: mutation did not reach ${expected}: ${errors}`);
    results.push({ label: `${anchor}/${state} ${expected}`, caught: true });
  }
  const laundryBoreLines = sections().get("laundry-appliances");
  if (!laundryBoreLines) throw Error("laundry circular bore fixture absent");
  const laundryBoreSource = laundryBoreLines.join("\n");
  const circularBore = "@bore-z washer: body, 0, 0.38, 0.19, 0.246..0.30";
  if (!laundryBoreSource.includes(circularBore)) throw Error("laundry circular bore declaration absent");
  for (const [label, replacement, expected] of [
    ["laundry circular bore narrowed", "@bore-z washer: body, 0, 0.38, 0.17, 0.246..0.30", "needs shape intersection proof"],
    ["laundry circular bore widened", "@bore-z washer: body, 0, 0.38, 0.21, 0.246..0.30", "no face contact"],
    ["laundry circular bore removed", "", "needs shape intersection proof"],
  ]) {
    const errors = audit(new Map([["laundry-appliances", laundryBoreSource.replace(circularBore, replacement).split("\n")]])).errors;
    if (!errors.some((error) => error.includes(expected)))
      throw Error(`${label}: expected ${expected}, got ${errors}`);
    results.push({ label, caught: true });
  }
  /** @type {Array<[string,string,string,(patch:FlatContact)=>void,string]>} */
  const flatMutations = [
    ["basin", "800", "800/tap-spout/tap-body", (patch) => { patch.u = [0.14, 0.17]; }, "no finite common patch"],
    ["kitchen-island", "default", "default/tap-spout/tap-body", (patch) => { patch.plane += 0.001; }, "no finite common patch"],
    ["shower", "default", "default/riser-bracket-1/wall", (patch) => { patch.v = [1.41, 1.47]; }, "no finite common patch"],
    ["portable-lamps", "bedside-globe", "bedside-globe/globe/stem-short", (patch) => { patch.u = [-0.009, 0.009]; }, "no finite common patch"],
  ];
  for (const [anchor, state, key, change, expected] of flatMutations) {
    const lines = sections().get(anchor);
    if (!lines) throw Error(`${anchor}: flat-contact fixture owner absent`);
    const errors = audit(new Map([[anchor, lines]]), (owner, parsed) => {
      if (owner !== anchor) return;
      const patch = parsed.flatContacts.get(key);
      if (!patch) throw Error(`${anchor}/${key}: flat-contact fixture absent`);
      change(patch);
    }, state).errors;
    if (!errors.some((error) => error.includes(expected)))
      throw Error(`${anchor}/${key}: expected ${expected}, got ${errors}`);
    results.push({ label: `${anchor}/${key} finite contact mutation`, caught: true });
  }
  {
    const anchor = "dining-chair", state = "default", lines = sections().get(anchor);
    if (!lines) throw Error(`${anchor}: shear fixture owner absent`);
    const errors = audit(new Map([[anchor, lines]]), (owner, parsed) => {
      if (owner !== anchor) return;
      const shear = parsed.shearsZ.get("default/leg-0");
      if (!shear) throw Error(`${anchor}: shear fixture declaration absent`);
      shear.z[1] += 0.01;
    }, state).errors;
    if (!errors.some((error) => error.includes("shear-z bounds")))
      throw Error(`${anchor}: shear mutation remained green: ${errors}`);
    results.push({ label: `${anchor} shear-z endpoint mutation`, caught: true });
  }
  const plantSource = fs.readFileSync(path.join(root, "docs/models/004-decor-and-fixtures.md"), "utf8");
  if (!plantSource.includes("0.18, 0.28, 0.60, 0.80, 1.10m")) throw Error("plant prose mutation source absent");
  let plantCaught = false;
  try { plantProducer.check(plantSource.replace("0.18, 0.28, 0.60, 0.80, 1.10m", "0.18, 0.28, 0.61, 0.80, 1.10m")); }
  catch { plantCaught = true; }
  if (!plantCaught) throw Error("plant prose/table divergence passed");
  results.push({ label: "potted plant prose height changed", caught: true });
  if (!plantSource.includes("흙 표면은 0.34H")) throw Error("plant soil prose mutation source absent");
  plantCaught = false;
  try { plantProducer.check(plantSource.replace("흙 표면은 0.34H", "흙 표면은 0.30H")); }
  catch { plantCaught = true; }
  if (!plantCaught) throw Error("plant soil prose/table divergence passed");
  results.push({ label: "potted plant prose soil height changed", caught: true });
  let measuredParts = 0;
  let mutationChecks = 0;
  const completeSections = sections();
  for (const [anchor, lines] of completeSections) {
    const { envelopes, parts } = parse(lines, anchor);
    if (!envelopes.size) continue;
    const fixtureSections = () => {
      const selected = new Map([[anchor, lines]]);
      const pending = [anchor];
      while (pending.length) {
        const current = pending.pop();
        if (!current) throw Error(`${anchor}: empty fixture dependency`);
        const source = selected.get(current);
        if (!source) throw Error(`${anchor}: missing fixture dependency ${current}`);
        const parsed = parse(source, current);
        for (const child of [...parsed.compositions.values(), ...parsed.supportBindings.values()]) {
          if (selected.has(child.anchor)) continue;
          const childLines = completeSections.get(child.anchor);
          if (!childLines) throw Error(`${anchor}: fixture child ${child.anchor} absent`);
          selected.set(child.anchor, childLines);
          pending.push(child.anchor);
        }
      }
      return selected;
    };
    const ownBaseline = audit(fixtureSections());
    if (ownBaseline.errors.length) throw Error(`${anchor}: fixture baseline failed: ${ownBaseline.errors}`);
    for (const part of parts.values()) {
      measuredParts++;
      /** @param {(entry:Part, parsed:ReturnType<typeof parse>)=>void} change @param {string} expected */
      const check = (change, expected) => {
        const found = audit(fixtureSections(), (owner, parsed) => {
          if (owner !== anchor) return;
          const entry = parsed.parts.get(`${part.state}/${part.id}`);
          if (!entry) throw Error(`${anchor}/${part.state}/${part.id}: mutation target absent`);
          change(entry, parsed);
        }, part.state).errors;
        if (!found.some((error) => error.includes(expected)))
          throw Error(`${anchor}/${part.state}/${part.id}: mutation missed ${expected}: ${found}`);
        mutationChecks++;
      };
      check((entry) => { entry.x = [100, 100.01]; }, "exits declared envelope");
      check((entry) => { entry.y = [100, 100.01]; }, "exits declared envelope");
      check((_entry, parsed) => { parsed.parts.delete(`${part.state}/${part.id}`); }, `inventoried part ${part.id} absent`);
      check((entry) => { entry.contact = []; }, "contact path absent");
    }
  }
  for (const axis of /** @type {const} */ (["x", "y", "z"])) {
    const transverse = /** @type {const} */ (["x", "y", "z"]).filter((candidate) => candidate !== axis);
    /** @type {Part} */
    const cylinder = { state: "test", id: `cylinder-${axis}`, shape: "cylinder",
      x: [-0.1, 0.1], y: [-0.1, 0.1], z: [-0.1, 0.1], contact: [] };
    cylinder[axis] = [0, 0.4];
    /** @type {Bounds} */
    const broad = { x: [-0.05, 0.05], y: [-0.05, 0.05], z: [-0.05, 0.05] };
    broad[axis] = [0.4, 0.5];
    /** @type {Bounds} */
    const tangent = { x: [-0.05, 0.05], y: [-0.05, 0.05], z: [-0.05, 0.05] };
    tangent[axis] = [0.4, 0.5];
    tangent[transverse[0]] = [0.1, 0.2];
    if (cylinderAxis(cylinder) !== axis || cylinderCapArea(cylinder, broad, axis) <= 1e-8 ||
      cylinderCapArea(cylinder, tangent, axis) > 1e-8)
      throw Error(`${axis}-axis cylinder cap accepted a tangent or rejected a finite patch`);
    results.push({ label: `${axis}-axis cap finite/tangent`, caught: true });
  }
  console.log(JSON.stringify({ baselineParts: baseline.parts, measuredParts, mutationChecks,
    mutations: results, unselected: randomFixture(), vesselAttachments: randomVesselFixture(),
    vesselClosures: randomClosureFixture() }, null, 2));
} else {
  const result = audit(sections());
  if (result.unprovedCurvedContacts.length) result.errors.push(
    `${result.unprovedCurvedContacts.length} curved contacts lack a measured finite contact face; ` +
    `first: ${result.unprovedCurvedContacts.slice(0, 5).join(", ")}`);
  // The coordinate and design audits run in the aggregate command and
  // separately inspect prose and complete H2 populations.
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
