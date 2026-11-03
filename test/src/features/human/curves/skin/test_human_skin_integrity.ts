import { HumanPeople } from "../../../internal/HumanPeople";
import { HumanSkinIntegrity } from "../../../internal/HumanSkinIntegrity";
import { HumanSkinIntegrityControl } from "../../../internal/HumanSkinIntegrityControl";
import { HumanSkinIntegrityPerson } from "../../../internal/HumanSkinIntegrityPerson";

/**
 * Every person's bind skin is one closed, consistently outward, two-manifold
 * surface that nowhere passes through itself.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and tests every pair of its triangles whose boxes meet, through a bounding volume hierarchy, for a crossing: an edge of one passing strictly through the other's interior; where edges meet edges exactly, the two triangles overlapping along their planes' common line; or two triangles in one plane overlapping. Pairs sharing an edge are skipped; pairs sharing a vertex are tested, so skin folded through a shared vertex is caught. It reads the whole mesh for edges used by more than two triangles, vertices where two sheets meet at a point, boundary loops other than the openings the body declares open, edges two neighbours wind the same way, patches whose normals face into the body by ray parity, triangles without area or too thin to keep their orientation in single precision, triangles repeated on the same vertices, positions no triangle uses, and non-finite or out-of-range data. Findings are grouped into connected patches and the test fails once with every patch by person, chain region and kind, with its triangle count, area and a point on it. It catches skin that passes through itself where two parts meet, a pushed-in or folded patch, holes, flipped or doubled triangles, fins and bowties. Any shape passes that is a closed, outward, non-crossing surface ending only at its declared open margins.
 * @evidence contracts/testing.md#independent-expectations What a closed skin is fixes every limit: two sheets of one skin do not pass through each other, every edge of a closed two-manifold has two triangles winding it oppositely, its outward normals see an even number of crossings to infinity, and it ends only where the body declares an open margin: an aperture without a closing pocket, whose boundary must wind once round the aperture's own axis within its margin's radius. Each margin is evaluated from the aperture's published harmonic series. Orientation predicates carry Shewchuk's floating-point error bounds, so contact within rounding is not a crossing, and an overlap along the planes' common line must exceed a billionth of the coordinates, far above double rounding and far below any modelled feature; a triangle is zero-area when its edge cross product lies within its rounding error, and a needle when its least altitude is within twice the displacement single-precision rounding gives a vertex, the precision a renderer draws in. No limit comes from the figure. The analytic controls below are each made red with exact counts: two crossing triangles give one pair, triangles whose edges pass exactly through each other's edges one pair, a fold through a shared vertex one pair, a flipped triangle three inconsistent edges and one inverted triangle, a doubled triangle one duplicate and three non-manifold edges, a fin one non-manifold edge and an open two-edge boundary, a removed triangle a three-edge hole, a pinched pair of octahedra one non-manifold vertex, a sliver one zero-area and an offset sliver one needle triangle, an extra position one unreferenced vertex; a cap pushed through a sphere, askew or along a mirror axis where every band edge meets a far edge exactly, gives one crossing patch whose pairs equal the exhaustive all-pairs count. On a copy of f1, each made defect adds exactly its own patch and leaves the twenty others unchanged: the 105 vertices within 30 mm of the belly pushed 400 mm back through the trunk add one trunk crossing of 284 triangles and 282 pairs, a flipped triangle three inconsistent edges and one inverted triangle, a doubled triangle a duplicate and three non-manifold edges, a fin one non-manifold edge and a two-edge open boundary. The four private reference bodies are not subjects here: their head parts hold mouth, eye and lash pieces that cross each other, lash cards that end as open boundaries, and contact at the axillae, so they read 41, 52, 42 and 38 crossing patches. Outside the head they show only small axilla contacts, two mirror-image patches on f2 (26 triangles each) and on m1 (5 each), and none on f1 or m2; the generated people's crossings at the ears, toes and left axilla are therefore not the observer's strictness. Oracle limits: a crossing within rounding of touching is missed, ray parity can misread a patch whose rays all leave through an opening, and an inside-out patch that is also crossed is reported as both.
 * @evidence contracts/testing.md#distinguishing-cases The controls hold the boundary cases: a clean subdivided sphere and octahedron, also far from the origin, pass; triangles touching at a point of a face, edges meeting at a single point, sharing a vertex or an edge without crossing, parallel a nanometre apart, or adjacent in one plane do not cross; a declared opening's margin passes and the same hole undeclared fails. All nine people at the bind, f1, f2, m1, m2 and the tall, short, wide, narrow and masculine people, so both ends of every length and breadth are read. `test_human_skin_integrity_posed` owns the same crossings under every pose, the pose test owns depth, stretch and folds under a pose, and the raw geometry tests own buffer finiteness against saved outputs.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_skin_integrity`, reading the cached people in process on the CPU with no renderer, browser or GPU; the controls are analytic meshes built by `HumanSkinIntegrityControl`.
 */
export function test_human_skin_integrity(): void {
  const failures: string[] = HumanSkinIntegrityControl.run();
  const findings: HumanSkinIntegrity.IFinding[] = [];

  // Every person is audited even when another fails, so one run lists everything.
  for (const name of HumanPeople.names()) {
    try {
      findings.push(...HumanSkinIntegrityPerson.bind(name));
    } catch (error) {
      failures.push(`${name} could not be audited: ${(error as Error).message}`);
    }
  }

  const lines: string[] = [...failures, ...HumanSkinIntegrity.sort(findings).map(HumanSkinIntegrity.format)];

  if (lines.length)
    throw new Error(
      `${findings.length} skin integrity findings and ${failures.length} control or audit failures:\n${lines.join("\n")}`,
    );
}
