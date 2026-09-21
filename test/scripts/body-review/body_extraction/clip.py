"""The shared-edge neck clip: one affine stencil evaluated for every state.

The face basis keeps the MPFB skin at and above the plane Y = -0.145 m of the
face frame and creates one vertex per crossing edge at the affine parameter of
the neutral intersection. The body keeps the complement. Because both sides
compute the intersection on the same neutral edge, their ring vertices are the
same points, and because both evaluate every endpoint through the same fixed
weights, they stay the same points under any state that moves the ring.

The face clipped triangles, not quads: each subdivided quad was split along
the diagonal from its first loop corner (Blender's own loop triangulation), and
a diagonal that crosses the plane contributes a ring vertex of its own. That is
why the face ring has 200 vertices where only 104 quad edges cross, and it is
measured in the T2 research record (fan from loop 0 reproduces all 200 to
0.0 m; the other diagonal gives 180 and the shortest diagonal 204). The body
therefore triangulates the same way before clipping.

The stencil holds three things: the original vertices below the plane
(renumbered densely, ascending), the ring rows `(a, b, t)` with `a` the below
end of a crossing edge and `p = a + t (b - a)`, shared by every triangle that
uses the edge, and the triangles over the new numbering with their per-corner
UVs. A triangle wholly above is dropped, one wholly below is kept, and a
crossing triangle is clipped along its corner order into a triangle or a quad
that is then fanned.

`evaluate` turns any full-mesh sample (kept and dropped vertices alike) into
the clipped vertex positions, converted to the face frame: `x`, `z - offset`,
`-y`. Every endpoint, the neutral, and the mirror check go through this one
function, so the frame conversion has one owner.
"""
import numpy as np

CUT_Y = -0.145


class Stencil:
    def __init__(self, neutral, topology, offset):
        """Build the stencil from the neutral Blender-space positions and its loops.

        `offset` is the face-frame height offset (`y = z - offset`), solved by
        the entry script against the committed face basis.
        """
        self.offset = offset
        z_cut = CUT_Y + offset
        z = neutral[:, 2]
        below = z <= z_cut
        if np.any(np.abs(z - z_cut) < 1e-9):
            raise ValueError("A neutral vertex lies on the clip plane; the stencil would be ambiguous.")
        loop_start, loop_total = topology["loop_start"], topology["loop_total"]
        loop_vertex, loop_uv = topology["loop_vertex"], topology["loop_uv"]
        used = np.zeros(len(neutral), dtype=bool)
        ring_index = {}
        ring_rows = []
        polygons = []  # clipped corner lists: (kind, key, u, v); kind 0 = original vertex, 1 = ring
        for polygon in range(len(loop_start)):
            start, total = int(loop_start[polygon]), int(loop_total[polygon])
            loops = [(int(loop_vertex[start + k]), loop_uv[start + k]) for k in range(total)]
            # Blender's loop triangulation of a quad: the fan from its first corner.
            for k in range(1, total - 1):
                corners = [loops[0], loops[k], loops[k + 1]]
                flags = [below[vertex] for vertex, _ in corners]
                if not any(flags):
                    continue
                clipped = []
                for c in range(3):
                    vertex, uv = corners[c]
                    next_vertex, next_uv = corners[(c + 1) % 3]
                    if flags[c]:
                        used[vertex] = True
                        clipped.append((0, vertex, float(uv[0]), float(uv[1])))
                    if flags[c] != flags[(c + 1) % 3]:
                        a, b = (vertex, next_vertex) if flags[c] else (next_vertex, vertex)
                        if (a, b) not in ring_index:
                            ring_index[(a, b)] = len(ring_rows)
                            ring_rows.append((a, b, float((z_cut - z[a]) / (z[b] - z[a]))))
                        t = ring_rows[ring_index[(a, b)]][2]
                        # The corner UV is interpolated from the below end toward the above end.
                        below_uv, above_uv = (uv, next_uv) if flags[c] else (next_uv, uv)
                        u = float(below_uv[0] + t * (above_uv[0] - below_uv[0]))
                        v = float(below_uv[1] + t * (above_uv[1] - below_uv[1]))
                        clipped.append((1, ring_index[(a, b)], u, v))
                polygons.append(clipped)
        kept = np.nonzero(used)[0]
        if not np.array_equal(kept, np.nonzero(below)[0]):
            raise ValueError("A vertex below the plane belongs to no kept polygon; the mesh has a stray vertex.")
        self.kept = kept
        self.renumber = -np.ones(len(neutral), dtype=np.int64)
        self.renumber[kept] = np.arange(len(kept))
        self.ring_a = np.array([row[0] for row in ring_rows], dtype=np.int64)
        self.ring_b = np.array([row[1] for row in ring_rows], dtype=np.int64)
        self.ring_t = np.array([row[2] for row in ring_rows], dtype=np.float64)
        indices = []
        uvs = []
        base = len(kept)
        for corners in polygons:
            resolved = [((self.renumber[key] if kind == 0 else base + key), u, v) for kind, key, u, v in corners]
            for k in range(1, len(resolved) - 1):
                for corner in (resolved[0], resolved[k], resolved[k + 1]):
                    indices.append(int(corner[0]))
                    uvs.append((corner[1], corner[2]))
        self.indices = np.array(indices, dtype=np.int64)
        self.uvs = np.array(uvs, dtype=np.float64)

    @property
    def vertex_count(self):
        return len(self.kept) + len(self.ring_t)

    def evaluate(self, sample):
        """Clipped positions in the face frame for one full-mesh Blender sample."""
        below = sample[self.kept]
        ring = sample[self.ring_a] + self.ring_t[:, None] * (sample[self.ring_b] - sample[self.ring_a])
        blender = np.concatenate([below, ring], axis=0)
        face = np.empty_like(blender)
        face[:, 0] = blender[:, 0]
        face[:, 1] = blender[:, 2] - self.offset
        face[:, 2] = -blender[:, 1]
        return face

    def weights(self, base_weights):
        """Per-vertex bone weight rows for the clipped mesh.

        Original vertices keep Blender's interpolated rows; a ring vertex takes
        the affine blend of its edge ends, which is what the position is.
        """
        rows = [base_weights[int(vertex)] for vertex in self.kept]
        for a, b, t in zip(self.ring_a, self.ring_b, self.ring_t):
            merged = {}
            for bone, weight in base_weights[int(a)]:
                merged[bone] = merged.get(bone, 0.0) + (1.0 - t) * weight
            for bone, weight in base_weights[int(b)]:
                merged[bone] = merged.get(bone, 0.0) + t * weight
            rows.append(list(merged.items()))
        return rows


class Complement:
    """The body as the complement of the face basis's kept triangles.

    The shipped face basis no longer ends at the plane: `crop-face-to-neck`
    removed the invented bust below the collar and left the head open at a
    loop of 120 vertices that follows the neck's own slope (about -81 to -90
    mm). The plane clip therefore left a band of neck belonging to neither
    basis, and the editor showed the face floating over the shoulders. The
    body is now everything of the same triangulated source that the face does
    not keep, so the two meet along the face's own loop by vertex identity,
    with no ring stencil and no interpolated vertex: every body vertex is a
    source vertex and every boundary vertex is one the face also carries.

    `face_triangles` are the face's kept triangles as sorted triples of body
    vertex indices (the head correspondence maps them). Triangulation is the
    same fan from loop 0 the face used, so the triangle sets partition the
    source exactly and the boundary edges coincide.
    """

    def __init__(self, neutral, topology, offset, face_triangles):
        self.offset = offset
        loop_start, loop_total = topology["loop_start"], topology["loop_total"]
        loop_vertex, loop_uv = topology["loop_vertex"], topology["loop_uv"]
        used = np.zeros(len(neutral), dtype=bool)
        triangles = []
        dropped = 0
        for polygon in range(len(loop_start)):
            start, total = int(loop_start[polygon]), int(loop_total[polygon])
            loops = [(int(loop_vertex[start + k]), loop_uv[start + k]) for k in range(total)]
            for k in range(1, total - 1):
                corners = [loops[0], loops[k], loops[k + 1]]
                key = tuple(sorted(vertex for vertex, _ in corners))
                if key in face_triangles:
                    dropped += 1
                    continue
                for vertex, _ in corners:
                    used[vertex] = True
                triangles.append(corners)
        if dropped != len(face_triangles):
            raise ValueError("The face keeps %d triangles but %d of them were found in the source; the correspondence is not one to one." % (len(face_triangles), dropped))
        self.kept = np.nonzero(used)[0]
        self.dropped = dropped
        self.renumber = -np.ones(len(neutral), dtype=np.int64)
        self.renumber[self.kept] = np.arange(len(self.kept))
        self.ring_t = np.zeros(0, dtype=np.float64)
        indices = []
        uvs = []
        for corners in triangles:
            for vertex, uv in corners:
                indices.append(int(self.renumber[vertex]))
                uvs.append((float(uv[0]), float(uv[1])))
        self.indices = np.array(indices, dtype=np.int64)
        self.uvs = np.array(uvs, dtype=np.float64)

    @property
    def vertex_count(self):
        return len(self.kept)

    def evaluate(self, sample):
        """Kept positions in the face frame for one full-mesh Blender sample."""
        blender = sample[self.kept]
        face = np.empty_like(blender)
        face[:, 0] = blender[:, 0]
        face[:, 1] = blender[:, 2] - self.offset
        face[:, 2] = -blender[:, 1]
        return face

    def weights(self, base_weights):
        """Per-vertex bone weight rows for the kept vertices, Blender's own."""
        return [base_weights[int(vertex)] for vertex in self.kept]
