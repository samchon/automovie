/** Reads placed native geometry, including part boxes for the open cassettes.
 * Empty expanded-opening intersections prove separation; an overlap is a
 * conservative alarm, not a fabricated triangle collision verdict. */
import { builtEnvironmentElementBounds, builtEnvironmentElementPartBounds, builtEnvironmentEnvelopeFaces, validateModel } from "@automovie/engine";
import { Assembly, v } from "./assembly";
import { uSign } from "./walls";
import { B, P, R } from "./envelope/roof";

export function auditCanopy(a: Assembly) {
  const e = a.environment;
  const selected = e.elements.filter(p => /^(canopy-|roof-|gutter-|overflow-|right-downpipe|right-inspection|catch-)/.test(p.id));
  const members = selected.map(p => ({ id: p.id, kind: p.kind, box: builtEnvironmentElementBounds(e, p.id)! }));
  const errors: string[] = [];
  const faces = builtEnvironmentEnvelopeFaces(e).filter(f => ["roof-face", "canopy-top", "canopy-soffit"].includes(f.boundary));
  for (const face of faces) if (face.boundary === "canopy-soffit" ? face.normal.y >= 0 : face.normal.y <= 0)
    errors.push(face.boundary + ": exposed face points into the building");
  for (const face of faces) for (const p of face.vertices) {
    const expected = face.boundary === "roof-face" ? R(p.x) : face.boundary === "canopy-top" ? P(p.z) : B(p.z);
    if (Math.abs(expected - p.y) > 1e-7) errors.push(face.boundary + ": observation plane does not follow rendered fall");
  }
  const models = new Set(selected.map(p => p.model));
  for (const model of e.models.filter(m => models.has(m.id))) {
    const verdict = validateModel({ model });
    if (!verdict.success) errors.push(model.id + ": " + JSON.stringify(verdict.violations));
  }
  const openings = a.wallRecords.filter(r => r.frame.spaces.length === 1 && r.frame.spaces[0] === "house").flatMap(({ frame: f, cuts }) => cuts.map(c => {
    const u0 = (f.a + f.b) / 2 + uSign(f) * (c.x - (f.b - f.a) / 2);
    const u1 = u0 + uSign(f) * c.width;
    const min = v(0, f.floor + c.y - 0.10, 0), max = v(0, f.floor + c.y + c.height + 0.10, 0);
    min[f.along] = Math.min(u0, u1) - 0.10; max[f.along] = Math.max(u0, u1) + 0.10;
    const normal = f.along === "x" ? "z" : "x";
    min[normal] = f.plane - f.depth / 2 - 0.15; max[normal] = f.plane + f.depth / 2 + 0.15;
    return { id: c.id, box: { min, max } };
  }));
  const overlap = (a: typeof members[number]["box"], b: typeof a) => (["x", "y", "z"] as const).every(axis => Math.min(a.max[axis], b.max[axis]) - Math.max(a.min[axis], b.min[axis]) > 1e-8);
  const supports = members.filter(p => /^(canopy-(support|girder|rail|endplate)|gutter-|right-downpipe|right-inspection)/.test(p.id));
  for (const opening of openings) for (const member of supports) if (overlap(opening.box, member.box)) errors.push(member.id + ": expanded opening " + opening.id);
  const rails = members.filter(p => p.id.startsWith("canopy-rail-"));
  const girders = members.filter(p => p.id.startsWith("canopy-girder-"));
  for (const rail of rails) for (const girder of girders) if (overlap(rail.box, girder.box)) errors.push(rail.id + ": girder overlap " + girder.id);
  const cassetteParts = e.elements.filter(p => p.kind === "pv-cassette").map(p => ({
    id: p.id, parts: builtEnvironmentElementPartBounds(e, p.id)!.map((box, i) => ({ id: e.models.find(m => m.id === p.model)!.parts[i].id, box })),
  }));
  const plantBounds = e.elements.filter(p => /^(tree-|hedge-|front-grass-)/.test(p.id)).map(p => ({ id: p.id, box: builtEnvironmentElementBounds(e, p.id)! }));
  const reserved = [
    { min: v(-7.8, -0.46, -7.3), max: v(-5.8, 8.20, 7.3) },
    { min: v(5.8, -0.46, -7.3), max: v(7.8, 8.20, 7.3) },
    { min: v(-4.3, -0.46, -8.5), max: v(-2.8, 8.20, -6.3) },
  ];
  for (const p of plantBounds) for (const [i, area] of reserved.entries()) if (overlap(p.box, area)) errors.push(p.id + ": maintenance reservation " + i);
  const grate = members.find(p => p.id === "gutter-grate")!;
  const deltas = [v(0, 0, 0), v(0, 0.10, 0), v(0.10, 0.10, 0), v(0.10, 0.10, 0.20), v(0.10, 0.613, 0.20)];
  const grateRoute = deltas.map(d => ({ min: v(grate.box.min.x + d.x, grate.box.min.y + d.y, grate.box.min.z + d.z), max: v(grate.box.max.x + d.x, grate.box.max.y + d.y, grate.box.max.z + d.z) }));
  const fixed = members.filter(p => /^(canopy-(rail|girder|endplate))/.test(p.id));
  for (let i = 1; i < grateRoute.length; i++) {
    const before = grateRoute[i - 1], after = grateRoute[i];
    const swept = { min: v(Math.min(before.min.x, after.min.x), Math.min(before.min.y, after.min.y), Math.min(before.min.z, after.min.z)), max: v(Math.max(before.max.x, after.max.x), Math.max(before.max.y, after.max.y), Math.max(before.max.z, after.max.z)) };
    for (const p of fixed) if (overlap(swept, p.box)) errors.push("grate sweep " + i + ": " + p.id);
  }
  return { errors, members, cassetteParts, expandedOpenings: openings, grateRoute, counts: { cassettes: cassetteParts.length, girders: girders.length, rails: rails.length, posts: members.filter(p => p.id.endsWith("-post")).length, fasteners: cassetteParts.reduce((n, c) => n + c.parts.filter(p => p.id.startsWith("bolt-")).length, 0) }, limits: { triangleCollisions: "unverified; disjoint AABBs establish separation only", rainCapacity: "unverified", structuralLoads: "unverified", equipmentAndHumanUse: "unverified", appearance: "independent GPU review required" } };
}
