/**
 * Contract an exact zero-area source cell without inventing a surface normal.
 *
 * Exact coincident positions identify the source's seam aliases. A candidate
 * edge must have two incident faces, both exactly zero area, and its vertex
 * links must intersect in exactly their two opposite vertices. This is the
 * manifold edge-contraction link condition. Every alias of the removed
 * endpoint takes the retained endpoint's existing acquired coordinate; no
 * average, normal displacement or tolerance supplies a new coordinate.
 *
 * Only those two zero-area faces disappear. All retained faces preserve their
 * source order and must retain nonzero area and orientation. Source vertex
 * ordinals remain present, including unused seam aliases. Referenced normals
 * are area-weighted from the repaired faces; unused directions remain the
 * acquired source directions because no surface uses them. The receipt keeps
 * every changed coordinate and the complete source-face lineage.
 */
export function repairCranialZeroCells(mesh) {
  const positions = [...mesh.positions];
  let faces = Array.from({ length: mesh.indices.length / 3 }, (_, face) => ({
    source: face, vertices: mesh.indices.slice(face * 3, face * 3 + 3),
  }));
  const point = (vertex) => positions.slice(vertex * 3, vertex * 3 + 3);
  const crossOf = (coordinates, vertices) => {
    const [a, b, c] = vertices.map((vertex) => coordinates.slice(vertex * 3, vertex * 3 + 3));
    const u = b.map((value, axis) => value - a[axis]);
    const v = c.map((value, axis) => value - a[axis]);
    return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  };
  const zero = (face) => Math.hypot(...crossOf(positions, face.vertices)) === 0;
  const originalZeroFaces = faces.filter(zero).map((face) => face.source);
  if (originalZeroFaces.length === 0) return { mesh, receipt: null };
  const topology = (coordinates, triangles) => {
    const keys = Array.from({ length: coordinates.length / 3 }, (_, vertex) => JSON.stringify(coordinates.slice(vertex * 3, vertex * 3 + 3)));
    const edges = new Map();
    const vertices = new Set();
    for (const face of triangles) {
      const corners = face.vertices.map((vertex) => keys[vertex]);
      for (const corner of corners) vertices.add(corner);
      for (let at = 0; at < 3; at++) {
        const a = corners[at], b = corners[(at + 1) % 3];
        const key = JSON.stringify([a, b].sort());
        const directions = edges.get(key) ?? [];
        directions.push(a < b ? 1 : -1);
        edges.set(key, directions);
      }
    }
    return { vertices: vertices.size, edges: edges.size, faces: triangles.length,
      boundaryEdges: [...edges.values()].filter((directions) => directions.length === 1).length,
      nonManifoldEdges: [...edges.values()].filter((directions) => directions.length !== 2).length,
      windingEdges: [...edges.values()].filter((directions) => directions.length === 2 && directions[0] + directions[1] !== 0).length,
      eulerCharacteristic: vertices.size - edges.size + triangles.length };
  };
  const beforeTopology = topology(mesh.positions, faces);
  if (beforeTopology.boundaryEdges !== 0 || beforeTopology.nonManifoldEdges !== 0 || beforeTopology.windingEdges !== 0)
    throw new Error("Source zero-cell repair requires an exact-seam closed oriented manifold.");
  const contractions = [];
  const moved = [];
  while (faces.some(zero)) {
    const representatives = new Map();
    const aliases = Array.from({ length: positions.length / 3 }, (_, vertex) => {
      const key = JSON.stringify(point(vertex));
      if (!representatives.has(key)) representatives.set(key, vertex);
      return representatives.get(key);
    });
    const selected = faces.find(zero);
    const corners = selected.vertices.map((vertex) => aliases[vertex]);
    const candidates = [0, 1, 2].map((at) => {
      const a = corners[at], b = corners[(at + 1) % 3];
      return { a: Math.min(a, b), b: Math.max(a, b), length: Math.hypot(...point(a).map((value, axis) => value - point(b)[axis])) };
    }).filter((edge) => edge.a !== edge.b).sort((a, b) => a.length - b.length || a.a - b.a || a.b - b.b);
    let chosen;
    for (const edge of candidates) {
      const neighbours = (vertex) => new Set(faces.filter((face) => face.vertices.some((corner) => aliases[corner] === vertex))
        .flatMap((face) => face.vertices.map((corner) => aliases[corner])).filter((corner) => corner !== vertex));
      const incident = faces.filter((face) => {
        const vertices = face.vertices.map((vertex) => aliases[vertex]);
        return vertices.includes(edge.a) && vertices.includes(edge.b);
      });
      const left = neighbours(edge.a), right = neighbours(edge.b);
      const link = [...left].filter((vertex) => right.has(vertex)).sort((a, b) => a - b);
      const opposite = [...new Set(incident.flatMap((face) => face.vertices.map((vertex) => aliases[vertex]))
        .filter((vertex) => vertex !== edge.a && vertex !== edge.b))].sort((a, b) => a - b);
      if (incident.length === 2 && incident.every(zero) && opposite.length === 2 && JSON.stringify(link) === JSON.stringify(opposite)) {
        chosen = { ...edge, incident, link, opposite };
        break;
      }
    }
    if (chosen === undefined) throw new Error("Zero-area source cell has no two-face manifold contraction: " + selected.source);
    const retained = point(chosen.a), removed = point(chosen.b);
    for (let vertex = 0; vertex < aliases.length; vertex++) {
      if (aliases[vertex] !== chosen.b) continue;
      moved.push({ vertex, before: point(vertex), after: retained, distanceMetres: chosen.length });
      for (let axis = 0; axis < 3; axis++) positions[vertex * 3 + axis] = retained[axis];
    }
    const removedFaces = new Set(chosen.incident.map((face) => face.source));
    contractions.push({ retainedVertex: chosen.a, removedVertex: chosen.b, retainedCoordinate: retained,
      removedCoordinate: removed, removedSourceFaces: [...removedFaces], link: chosen.link, opposite: chosen.opposite });
    faces = faces.filter((face) => !removedFaces.has(face.source));
  }
  let changedFaceCount = 0;
  for (const face of faces) {
    const before = crossOf(mesh.positions, face.vertices), after = crossOf(positions, face.vertices);
    const beforeLength = Math.hypot(...before), afterLength = Math.hypot(...after);
    const agreement = before.reduce((sum, value, axis) => sum + value / beforeLength * after[axis] / afterLength, 0);
    if (!(beforeLength > 0) || !(afterLength > 0) || !(agreement > 0))
      throw new Error("Source contraction changed retained face orientation: " + face.source);
    if (face.vertices.some((vertex) => moved.some((entry) => entry.vertex === vertex))) changedFaceCount++;
  }
  const indices = faces.flatMap((face) => face.vertices);
  const afterTopology = topology(positions, faces);
  if (afterTopology.boundaryEdges !== 0 || afterTopology.nonManifoldEdges !== 0 || afterTopology.windingEdges !== 0 ||
      afterTopology.eulerCharacteristic !== beforeTopology.eulerCharacteristic)
    throw new Error("Source contraction changed closed topology or Euler characteristic.");
  const normals = new Array(positions.length).fill(0);
  const used = new Set(indices);
  for (const face of faces) {
    const area = crossOf(positions, face.vertices);
    for (const vertex of face.vertices) for (let axis = 0; axis < 3; axis++) normals[vertex * 3 + axis] += area[axis];
  }
  for (let vertex = 0; vertex < positions.length / 3; vertex++) {
    if (!used.has(vertex)) {
      for (let axis = 0; axis < 3; axis++) normals[vertex * 3 + axis] = mesh.normals[vertex * 3 + axis];
      continue;
    }
    const length = Math.hypot(...normals.slice(vertex * 3, vertex * 3 + 3));
    if (!(length > 0)) throw new Error("Repaired source vertex has no incident normal: " + vertex);
    for (let axis = 0; axis < 3; axis++) normals[vertex * 3 + axis] /= length;
  }
  return { mesh: { positions, indices, normals }, receipt: {
    originalVertices: mesh.positions.length / 3, vertices: positions.length / 3,
    originalTriangles: mesh.indices.length / 3, triangles: indices.length / 3,
    originalZeroFaces, contractions, movedVertices: moved, changedRetainedFaces: changedFaceCount,
    beforeTopology, afterTopology,
    retainedSourceFaces: faces.map((face) => face.source),
    maximumCoordinateChangeMetres: Math.max(0, ...moved.map((entry) => entry.distanceMetres)),
    normalProtocol: "Area-weighted repaired faces on original vertex ordinals; acquired directions retained only for unused vertices",
  } };
}
