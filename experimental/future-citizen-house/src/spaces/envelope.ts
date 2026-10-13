import { Assembly } from "../house/assembly";
import { front } from "../house/envelope/front";
import { left } from "../house/envelope/left";
import { rear } from "../house/envelope/rear";
import { right } from "../house/envelope/right";
import { roof } from "../house/envelope/roof";

/** Complete exterior surfaces, cut profiles and measured repeating assemblies.
 * @evidence spaces/003-surface-ownership.md envelope calls the complete owners of the four elevations and the roof. Each owner makes the stable addresses of its own walls, openings, glazing, shading, exterior exposed finish faces, and corner pieces, and there is no substitute envelope for the viewer. Material binding is decided by materials.
 * @evidence principles/core/source-units.md#source-scope-preservation Consumes the planes, normals, clear spans, frame depths, and canopy outline of 003 as they are. The main house is a flat-roofed rectangle, and no gable, chimney, roof access, or new back door is added.
 * @evidence principles/core/source-units.md#source-substantive-completion façade generates the closed cut mesh of the public wall kernel, deep frames and glass, and repeated stone panels and shades. roof emits the actual slab, edge, supports, and PV cassettes, so it is not an implementation that leaves only labels or empty boundaries.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implemented the whole elevations and per-room openings of 003 in the same coordinates and kept the frame 0.04m outside the effective span, the storey lines, and the triangular corner division. There was no need to change the room graph or the roof form to make the closed walls, window frames, and opaque returns. Optical and structural performance certification is not included.
 * @evidence spaces/003-surface-ownership.md#whole-surface-owners The front/rear/left/right/roof modules each own their whole surface; the full facade boundary belongs to house and its face is placed at the exterior O. The structural inner walls, the interior horizontal finishes, and the plinth below the elevations stay with the storey modules, and the threshold plate below the entrance and the interior face of the exterior wall in front of the stair void stay with the front facade.
 * @evidence spaces/003-surface-ownership.md#front-face Cuts the entrance door, the lower and upper stair windows, the workroom window, and the upper bedroom window from the wall with cut centre z=-5.88, exterior face z=-6.00, and normal -Z. It keeps the -X opaque core and, choosing pairs at the standard window height, makes the spandrel cassettes between the two floors.
 * @evidence spaces/003-surface-ownership.md#rear-face Places the independent openings of common, primary, and bathroom on the rear wall with cut centre z=5.88, exterior face z=6.00, and normal +Z, without continuing the glass past the end of the upper core wall.
 * @evidence spaces/003-surface-ownership.md#left-face Implements, on the +X exterior wall with cut centre x=5.38 and exterior face x=5.50, the same z span for the workroom and child-one and a separate window for child-two. The opaque return with the front is closed by the triangular corner and the wall body.
 * @evidence spaces/003-surface-ownership.md#right-face On the -X exterior wall with cut centre x=-5.38 and exterior face x=-5.50, closes the front service area opaquely and places only the two rear windows of common and bath in the same z span.
 * @evidence spaces/003-surface-ownership.md#roof-face roof makes the main beams, segmented rails, open cassettes, supports, gutters, outlet, and overflow from the pitch of B/J/T/P and R, and right continues the pipe below y=6.10. It also emits top and soffit as native boundaries, and this export does not generate the maintenance planting a second time; it leaves it to the garden call of citizenHouseSpaceSource, which realizes site-access.
 * @evidence spaces/003-surface-ownership.md#glazing-interface Each window's jambs and mullions are four members, body, web, pressure plate, and cover, from the member centre, and the head and sill are four members of the same section per bay that run to and butt against the same member faces of the adjacent vertical members. The glass enters the seat by 0.006 and is carried by gaskets and setting blocks. The same owner makes the reveal inside the cut, the floor-band cassettes derived from the standard window height and the storey datum, the drip cut at the end of the elevation body, and the lower louvres of the front and left workroom and bedroom windows, and puts no louvre on the rear primary bedroom window.
 * @evidence spaces/003-surface-ownership.md#front-stair-glazing Divides x=-1.20..1.54, 0.04 inside both ends of the stair hole, into lower and upper storeys and places glass at floor+0.12/ceiling-0.10. It records the entry and upper-storey membership on each fill element.
 * @evidence spaces/003-surface-ownership.md#front-flex-glazing The ground opening at x=3.06..5.22 enters, frame included, inside the workroom clear face. By day the lower part is translucent and the upper clear, and the private and night states lower the shade of the same opening.
 * @evidence spaces/003-surface-ownership.md#front-bedroom-glazing Puts the centre x=3.04 of the west jamb of the lower workroom as the preferred division line in the x=1.80..5.22 span of child-one and applies the upper sill/head and privacy band separately.
 * @evidence spaces/003-surface-ownership.md#rear-common-glazing rear.ts applies glazingInset at both ends of roomEdge("common-room", "x", "min/max") to make the fixed curtainwall currently at x=-5.22..5.22. There is no additional door or route to the back garden.
 * @evidence spaces/003-surface-ownership.md#rear-bedroom-glazing Divides the x=-2.80..5.22 span of primary to match the upper floor and does not pierce the -X bathroom or the end of the shared wall.
 * @evidence spaces/003-surface-ownership.md#rear-bath-glazing Makes fixed translucent glass at x=-4.86..-3.42,y=4.20..5.65 and keeps the bathroom's room binding. It is not changed to the bedroom's electrochromic state.
 * @evidence spaces/003-surface-ownership.md#left-flex-glazing Cuts the ground side window at z=-5.40..-2.30 as an orthogonal opening separate from the front window and places louvres in front of the lower band. The glass is not extended to the front corner.
 * @evidence spaces/003-surface-ownership.md#left-bedroom-glazing Applies the same z span and bay rule as the workroom side window to the upper child-one and places louvres in front of the lower band. No panel crossing the floor band is made.
 * @evidence spaces/003-surface-ownership.md#left-child-two-glazing Implements the z=0.35..1.90,y=3.90..5.80 opening of child-two as an independent window and places louvres in front of the lower 1.25m band. It is not combined into one window with the adjacent bedroom.
 * @evidence spaces/003-surface-ownership.md#right-common-glazing Cuts only the side window of the ground common area at z=3.60..5.40 at the rear of the core. The rest of the core wall is an opaque panel body.
 * @evidence spaces/003-surface-ownership.md#right-bath-glazing Places fully translucent bath glass in the same z span on the upper floor and preserves the room and floor boundaries. The bath glazing is fixed translucent in all three privacy states.
 * @evidence spaces/003-surface-ownership.md#envelope-corners Divides each 0.24×0.24 corner into two convex triangle prisms along the inner–outer diagonal. One piece is owned by the front or rear and the other by the side, and each boundary references its own physical element.
 */
export function envelope(a: Assembly): void {
  front(a);
  rear(a);
  left(a);
  right(a);
  roof(a);
}
