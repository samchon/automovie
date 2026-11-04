import { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanReference } from "../../../internal/reference/bodies/HumanReference";
import { HumanReferenceSurface } from "../../../internal/reference/surface/HumanReferenceSurface";
import { HumanReferenceSurfaceProofs } from "../../../internal/reference/surface/HumanReferenceSurfaceProofs";

/**
 * Every generated reference person's skin stays within the human surface's own
 * spread of its private reference body everywhere, with nothing missing and
 * nothing extra.
 *
 * Part of the reference comparison layer, the gross-defect check described in
 * `packages/human/docs/testing/reference-layer.md`: it flags only skin that
 * leaves the range real bodies take at a site.
 *
 * Scenarios:
 * 1. On the first present reference, the reference against itself reads no patch and 0 mm.
 * 2. The reference moved 1 and 4 mm along its normals reads medians of 1 and 4 mm.
 * 3. A bump outward on the left leg and a dent inward on the right leg, each 10 mm beyond the limit at its site, read as one patch of that direction and size.
 * 4. A 25 mm hole in the belly reads as missing skin there and nowhere else; a 20 mm cube before the belly, beyond its limit, reads as one detached part of 2400 mm².
 * 5. The real generated skin moved 2 mm along its own normals moves the median reading by 2 mm.
 * 6. Each of f1, f2, m1 and m2 is compared and every patch beyond the spread is listed.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates f1, f2, m1 and m2 at their public inputs and reads each bind skin against its private reference body both ways, by `HumanReferenceSurface.compare`: every reference skin vertex's signed distance along its outward normal to the generated outer skin (outside positive), falling back to the recorded nearest distance where the line meets no counterpart facing within 60 degrees, and every generated outer-skin vertex's nearest distance to the reference. Vertices beyond their limit join over mesh edges into patches of one direction, and the test fails with every patch: person, region named from its chain and joints (such as "left forearm (arm.left)"), direction (generated outside, inside, missing, extra geometry or a detached part), the way it faces, area, largest and mean deviation, the limit there, the limit range, centroid and the largest deviation's coordinate; the per-region RMS, p95, maximum and signed mean follow for information. It catches a region too full or too thin by more than people differ there, a bump or dent, a misplaced segment, a missing part or hole, a spike and a floating part. Any shape within the spread passes, however unlike the reference, since matching it is not the aim.
 * @evidence contracts/testing.md#independent-expectations The limit at each reference vertex is 2.576 standard deviations (the two-sided 99 % normal quantile) of how far the other reference bodies' surfaces stand along this person's normal there, once each is scaled to this person's stature and each of its segments is moved onto this person's by Horn's 1987 least-squares rigid motion, and never under the region's floor from published human variation (`HumanReferenceSurface.FLOORS`): 2.576 times the standard deviation of the region's nearest measured dimension, of the sex with the larger one, as one surface point's offset (half a breadth's deviation, a girth's over 2 pi, an ear's whole protrusion). These come from ANSUR II (hand and foot breadths, the limb, neck, shoulder, chest, waist and buttock girths), Weinberg 2016 (facial, mandibular and cranial widths) and Cho 2025 (ear protrusion). The floors matter where the source population is degenerate: it barely varies its hands, fingers, toes and feet and carries four fitted heads. No limit is under ISO 20685-1:2018 Table 4's 2 mm. The test flags only skin outside the range real bodies take there; a universal construction may differ from the reference well inside it. The bodies are the 66 others sharing the vertex order, without c0 (f1's body) or the held-out e3 and e6; a head-only vertex reads the four fitted heads, since the newer people carry one unfitted preset head. Nothing in a limit reads generated positions. The proofs (`HumanReferenceSurfaceProofs`) run in this test on made copies of the first present reference, whose right answer is known exactly: itself reads nothing; known offsets read their size; a defect sized from the limit at its own site plus 10 mm reads that size and direction as one patch; a hole reads missing skin at its place; a cube reads as one detached part of its own area; and a known offset of the real generated skin moves the reading by its size. Oracle limits: the population spans the parameter domain's ends, so the trunk, which the fat and sex corners move most, reads limits near 70 mm and a deviation there must be gross indeed; the head's spread stands on four heads; no finger, thumb or toe breadth spread is in the sources, so the digits take their hand's or foot's breadth, which is wider than a digit's own spread; published spreads are of adults unscaled by stature, wider than among people of one stature; regions and segments come from the generated person's chain labels (nearest generated vertex) and joints, so a grossly misplaced generated part also moves the names beneath it; vertices of the reference that no ray leaves (the closed mouth's cavity, the sockets behind the eyelids) and its pieces apart from the body's skin (eyeballs, teeth) are not skin and go unread; a detached part nearer the body than its region's limit is not listed; the generated surface keeps changing under its construction work, so the listed patches are the state of the day.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men at different statures and builds. The proofs cover a correct body (the reference itself), known uniform displacements, outside, inside, missing and detached defects at their own sites' limits, and a known displacement of the real generated skin. Without private references the test prints that the comparison did not run and returns, since the data cannot ship; with references but fewer than 20 population bodies, or without the four fitted heads, it throws instead of passing on no basis. Inputs measured at their sites belong to the `test_human_anatomy_*` tests, the raw comparator's arithmetic to `test_human_raw_reference_oracle`, posed skin to the pose tests; this test owns only the generated surface's gross departures from its reference.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_reference_surface`, reading the ignored `test/.shots` references and generating the four people in process on the CPU, with no renderer, browser or GPU.
 */
export function test_human_reference_surface(): void {
  const ids: string[] = HumanReference.available();

  if (ids.length === 0) {
    console.log(
      "test_human_reference_surface: no private reference body in test/.shots; the reference surface comparison did not run",
    );
    return;
  }

  // The reader must be right before its readings blame a person.
  const first: HumanAnatomy.ISkin = HumanAnatomy.bind(ids[0]!);
  const proofs: string[] = HumanReferenceSurfaceProofs.prove(ids[0]!, first);

  if (proofs.length !== 0) throw new Error(`${proofs.length} surface comparison proofs failed:\n${proofs.join("\n")}`);

  const patches: HumanReferenceSurface.IPatch[] = [];
  const regions: string[] = [];

  for (const id of ids) {
    const report: HumanReferenceSurface.IReport = HumanReferenceSurface.compare({
      person: id,
      generated: id === ids[0] ? first : HumanAnatomy.bind(id),
      reference: HumanReference.mesh(id),
      labels: HumanReference.skin(id),
      limit: HumanReferenceSurface.limits(id).limit,
    });

    patches.push(...report.patches);
    for (const region of report.regions) regions.push(HumanReferenceSurface.summarize(id, region));
  }

  if (patches.length !== 0)
    throw new Error(
      `${patches.length} patches of generated skin lie beyond the human spread of their reference:\n` +
        patches.map(HumanReferenceSurface.describe).join("\n") +
        `\n\nDeviation by region, for information:\n${regions.join("\n")}`,
    );
}
