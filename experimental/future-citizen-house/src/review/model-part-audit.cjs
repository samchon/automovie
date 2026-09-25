// Measures authored model-part envelopes and contacts before modelSources exist.
// Each `@part` row is inside its prototype H2, beside the prose that owns it.
// Run from the production root: node src/review/model-part-audit.cjs
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const names = ["001-seating-and-work", "002-storage-and-sleep", "003-service-fixtures", "004-decor-and-fixtures"];
const epsilon = 0.000001;
/** @typedef {{state:string,id:string,shape:string,x:[number,number],y:[number,number],z:[number,number],contact:string[]}} Part */
/** @typedef {{x:[number,number],y:[number,number],z:[number,number]}} Bounds */

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
  /** @type {Set<string>} */
  const miterJoints = new Set();
  /** @type {Map<string, {x:[number,number],y:[number,number],z:[number,number]}[]>} */
  const voids = new Map();
  /** @type {Map<string,{inner:number,outer:number}>} */
  const radial = new Map();
  for (const line of lines) {
    const list = /^@inventory\s+([^:]+):\s*(.+)$/.exec(line);
    if (list) {
      const state = list[1].trim();
      if (inventory.has(state)) throw Error(`${anchor}: duplicate inventory ${state}`);
      inventory.set(state, list[2].split(",").map((value) => value.trim()));
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
    const ring = /^@radial\s+([^:]+):\s*([^,]+),\s*([\d.]+),\s*([\d.]+)$/.exec(line);
    if (ring) {
      const key = `${ring[1].trim()}/${ring[2].trim()}`;
      if (radial.has(key)) throw Error(`${anchor}/${key}: duplicate radial declaration`);
      const inner = Number(ring[3]), outer = Number(ring[4]);
      if (!(inner >= 0 && outer > inner)) throw Error(`${anchor}/${key}: invalid radial interval`);
      radial.set(key, { inner, outer });
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
  return { envelopes, parts, inventory, miterJoints, voids, radial };
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

/** @param {Part} part @param {Map<string, Bounds[]>} voids */
function occupiedBoxes(part, voids) {
  /** @type {Bounds[]} */
  let boxes = [part];
  for (const cavity of voids.get(`${part.state}/${part.id}`) || [])
    boxes = boxes.flatMap((box) => subtractBox(box, cavity));
  return boxes;
}

/** @param {Part} a @param {Part} b @param {Map<string,{inner:number,outer:number}>} radial @param {Map<string,Bounds[]>} voids */
function actualContact(a, b, radial, voids) {
  const ar = radial.get(`${a.state}/${a.id}`), br = radial.get(`${b.state}/${b.id}`);
  if (ar && br) {
    const vertical = Math.min(a.y[1], b.y[1]) - Math.max(a.y[0], b.y[0]);
    const radius = Math.min(ar.outer, br.outer) - Math.max(ar.inner, br.inner);
    return (Math.abs(vertical) <= epsilon && radius > epsilon) ||
      (vertical > epsilon && (Math.abs(ar.outer - br.inner) <= epsilon || Math.abs(br.outer - ar.inner) <= epsilon));
  }
  return occupiedBoxes(a, voids).some((aa) => occupiedBoxes(b, voids).some((bb) => surfaceContact(aa, bb)));
}

/** @param {Part} a @param {Part} b @param {Map<string,{inner:number,outer:number}>} radial @param {Map<string,Bounds[]>} voids */
function actualOverlap(a, b, radial, voids) {
  const ar = radial.get(`${a.state}/${a.id}`), br = radial.get(`${b.state}/${b.id}`);
  if (ar && br) return Math.min(a.y[1], b.y[1]) - Math.max(a.y[0], b.y[0]) > epsilon &&
    Math.min(ar.outer, br.outer) - Math.max(ar.inner, br.inner) > epsilon;
  return occupiedBoxes(a, voids).some((aa) => occupiedBoxes(b, voids).some((bb) => overlap(aa, bb).every((size) => size > epsilon)));
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

/** @param {Map<string,string[]>} allSections */
function audit(allSections) {
  const errors = [];
  let examined = 0;
  let measuredPrototypes = 0;
  for (const [anchor, lines] of allSections) {
    const { envelopes, parts, inventory, miterJoints, voids, radial } = parse(lines, anchor);
    const provedMiterJoints = new Set();
    if (!envelopes.size) { errors.push(`${anchor}: no @envelope rows`); continue; }
    measuredPrototypes++;
    for (const [state, envelope] of envelopes) {
      const stateParts = [...parts.values()].filter((part) => part.state === state);
      if (!stateParts.length) errors.push(`${anchor}/${state}: no @part rows`);
      const byId = new Map(stateParts.map((part) => [part.id, part]));
      for (const [key, cavities] of voids) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(key.slice(state.length + 1));
        if (!host) { errors.push(`${anchor}/${key}: void host absent`); continue; }
        for (const cavity of cavities) {
          for (const axis of /** @type {const} */ (["x", "y", "z"]))
            if (cavity[axis][0] < host[axis][0] - epsilon || cavity[axis][1] > host[axis][1] + epsilon)
              errors.push(`${anchor}/${key}: void ${axis} exits host`);
        }
        if (!occupiedBoxes(host, voids).length) errors.push(`${anchor}/${key}: void removes entire host`);
      }
      for (const [key, radii] of radial) {
        if (!key.startsWith(`${state}/`)) continue;
        const host = byId.get(key.slice(state.length + 1));
        if (!host) { errors.push(`${anchor}/${key}: radial host absent`); continue; }
        if (Math.abs(host.x[0] + radii.outer) > epsilon || Math.abs(host.x[1] - radii.outer) > epsilon ||
          Math.abs(host.z[0] + radii.outer) > epsilon || Math.abs(host.z[1] - radii.outer) > epsilon)
          errors.push(`${anchor}/${key}: radial radius differs from AABB`);
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
            if (!actualContact(part, adjacent, radial, voids))
              errors.push(`${anchor}/${state}/${part.id}: no face contact with ${target}`);
          } else if (target === "ground" || target === "support") {
            if (!occupiedBoxes(part, voids).some((box) => Math.abs(box.y[0]) <= epsilon))
              errors.push(`${anchor}/${state}/${part.id}: misses ${target}`);
          } else if (target === "wall") {
            if (!occupiedBoxes(part, voids).some((box) => Math.abs(box.z[0]) <= epsilon))
              errors.push(`${anchor}/${state}/${part.id}: misses wall datum`);
          } else if (target === "ceiling") {
            if (!occupiedBoxes(part, voids).some((box) => Math.abs(box.y[1]) <= epsilon))
              errors.push(`${anchor}/${state}/${part.id}: misses ceiling datum`);
          } else errors.push(`${anchor}/${state}/${part.id}: contact target ${target} absent`);
        }
      }
      for (let i = 0; i < stateParts.length; i++) for (let j = i + 1; j < stateParts.length; j++) {
        const a = stateParts[i], b = stateParts[j], extent = overlap(a, b);
        if (actualOverlap(a, b, radial, voids)) {
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
      const reached = new Set(stateParts.filter((part) => part.contact.includes("ground") || part.contact.includes("support") ||
        part.contact.includes("ceiling") || (part.contact.includes("wall") && !byId.has("wall"))).map((part) => part.id));
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
    for (const key of radial.keys()) if (!parts.has(key)) errors.push(`${anchor}/${key}: radial declaration has no part`);
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
  }
  return { prototypes: allSections.size, measuredPrototypes, parts: examined, errors };
}

if (process.argv.includes("--fixture")) {
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
  let measuredParts = 0;
  let mutationChecks = 0;
  for (const [anchor, lines] of sections()) {
    const { envelopes, parts } = parse(lines, anchor);
    if (!envelopes.size) continue;
    const ownBaseline = audit(new Map([[anchor, lines]]));
    if (ownBaseline.errors.length) throw Error(`${anchor}: fixture baseline failed: ${ownBaseline.errors}`);
    for (const part of parts.values()) {
      measuredParts++;
      const index = lines.findIndex((line) => line.startsWith(`| @part | ${part.state} | ${part.id} |`));
      if (index < 0) throw Error(`${anchor}/${part.state}/${part.id}: row absent`);
      const cells = lines[index].split("|").slice(1, -1).map((cell) => cell.trim());
      /** @param {string} mutated @param {string} expected */
      const check = (mutated, expected) => {
        const copy = lines.slice();
        copy[index] = mutated;
        const found = audit(new Map([[anchor, copy]])).errors;
        if (!found.some((error) => error.includes(expected)))
          throw Error(`${anchor}/${part.state}/${part.id}: mutation missed ${expected}: ${found}`);
        mutationChecks++;
      };
      const shifted = cells.slice(); shifted[4] = "100..100.01";
      check(`| ${shifted.join(" | ")} |`, "exits declared envelope");
      const lifted = cells.slice(); lifted[5] = "100..100.01";
      check(`| ${lifted.join(" | ")} |`, "exits declared envelope");
      check("", `inventoried part ${part.id} absent`);
      const isolated = cells.slice(); isolated[7] = "-";
      check(`| ${isolated.join(" | ")} |`, "contact path absent");
    }
  }
  console.log(JSON.stringify({ baselineParts: baseline.parts, measuredParts, mutationChecks, mutations: results }, null, 2));
} else {
  const result = audit(sections());
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
