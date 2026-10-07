"""Read a source replacement port from its inherited native region and loop.

The selection is an authored frame convention. Native polygon incidence
supplies its actual oriented cycle through the shared boundary reader; it
does not certify a clinical ear attachment or acquire a personal boundary.
Blender preparation and guide export share this selection owner.
"""

from native_patch_boundary import native_patch_boundary


def read_ear_port(name, native_region, base_loop, polygons):
    selected = set(native_region) | set(base_loop)
    faces = [index for index, face in enumerate(polygons) if all(v in selected for v in face)]
    cycle = native_patch_boundary(name, faces, polygons)
    return {"name": name, "orderedNativeBoundary": cycle,
            "nativePolygonOrdinals": faces,
            "orientation": "selected native source-face winding; shared host traverses opposite direction",
            "qualification": "inherited frame-read ear attachment; root-loop uncertainty unchanged"}
