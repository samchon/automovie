import { HumanDebugReferenceCut } from "../../../../../packages/human/debug/compare/HumanDebugReferenceCut";
import { HumanDebugReferenceModel } from "../../../../../packages/human/debug/compare/HumanDebugReferenceModel";
import type { IHumanDebugReferencePack } from "../../../../../packages/human/debug/contracts/IHumanDebugReferencePack";
import type { IHumanDebugDocument } from "../../../../../packages/human/debug/contracts/IHumanDebugDocument";
import { HumanReferenceSections } from "../../internal/HumanReferenceSections";

/**
 * Reference skin can cross an opening as an open section arc; displaying it
 * must preserve that arc without inventing a closing edge through the hole.
 *
 * Scenarios:
 * 1. A two-point open arc at each of two heights draws two walls, two open
 *    loft curves and two reference-cut segments, with no return edge.
 * 2. A closed triangle beside those arcs keeps its closed curve and three
 *    edges; an empty region still draws nothing.
 * 3. A clipped open arc retains two separate runs; singleton and empty
 *    support draw no geometry. When private f1 data is present, print only counts of head and foot sections
 *    whose valid open arcs the old closed-loop-only loader omitted.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual reference surface/curve producer and reference-cut segment producer, asserting the emitted walls, curve closure and segment counts. It catches both discarded open skin and a false closing wall.
 * @evidence contracts/testing.md#independent-expectations An open two-point arc has one segment, a closed three-point loop has three, and two independent section walls have four triangles. These combinatorial facts come from the supplied geometry rather than the implementation. Private counts are diagnostic only.
 * @evidence contracts/testing.md#distinguishing-cases Covers open, closed, mixed, cropped, singleton and empty support. Reference registration, private curve quality and generation of the compared person are outside this display test.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit under --include human_debug_reference_model; synthetic cases need no files, person, browser or GPU. Optional private f1 reading prints support counts and cannot substitute for the synthetic assertions.
 */
export function test_human_debug_reference_model(): void {
  const failures: string[] = [];
  const sections: { y: number; loops: number[][]; arcs: number[][] }[] = [0, 10].map((y: number): { y: number; loops: number[][]; arcs: number[][] } => ({ y, loops: [], arcs: [[-1, 0, 1, 0]] }));
  const pack: IHumanDebugReferencePack = { id: "made", stature: 20, step: 1, regions: [{ name: "head", sections }] };
  const clay: ReturnType<typeof HumanDebugReferenceModel.of> = HumanDebugReferenceModel.of(pack, "clay");
  if (clay.parts.length !== 1 || clay.parts[0]!.geometry.type !== "mesh" || clay.parts[0]!.geometry.mesh.indices?.length !== 12) failures.push("Two open section arcs must draw four wall triangles");
  const loft: ReturnType<typeof HumanDebugReferenceModel.of> = HumanDebugReferenceModel.of(pack, "loft");
  if (loft.curves.length !== 2 || loft.curves.some((curve: IHumanDebugDocument.ICurve): boolean => curve.closed || curve.points.length !== 2)) failures.push("An open section arc was discarded or closed");
  if (HumanDebugReferenceCut.regions(pack)[0]!.segments.length !== 12) failures.push("The reference cut discarded an open arc or added its return edge");
  for (const section of sections) section.loops.push([3, 0, 4, 0, 3, 1]);
  const mixed: ReturnType<typeof HumanDebugReferenceModel.of> = HumanDebugReferenceModel.of(pack, "loft");
  if (mixed.curves.length !== 4 || mixed.curves.filter((curve: IHumanDebugDocument.ICurve): boolean => curve.closed).length !== 2) failures.push("Mixed section support changed curve closure");
  if (HumanDebugReferenceCut.regions(pack)[0]!.segments.length !== 48) failures.push("Mixed section support changed its edge count");
  const empty: IHumanDebugReferencePack = { ...pack, regions: [{ name: "empty", sections: [] }] };
  if (HumanDebugReferenceModel.of(empty, "clay").parts.length !== 0 || HumanDebugReferenceModel.of(empty, "loft").curves.length !== 0) failures.push("An empty reference region drew geometry");

  const cropped: IHumanDebugReferencePack = { ...pack, regions: [{ name: "head", sections: [{ y: 0, loops: [], arcs: [[-2, 0, -1, 0, 0, 0, 1, 0, 2, 0]] }] }] };
  const runs: ReturnType<typeof HumanDebugReferenceModel.of> = HumanDebugReferenceModel.of(cropped, "loft", (_region: string, x: number): boolean => x !== 0);
  if (runs.curves.length !== 2 || runs.curves.some((curve: IHumanDebugDocument.ICurve): boolean => curve.closed || curve.points.length !== 2)) failures.push("Cropping an open arc joined its separate ends");
  const singleton: IHumanDebugReferencePack = { ...pack, regions: [{ name: "head", sections: [{ y: 0, loops: [], arcs: [[0, 0]] }] }] };
  if (HumanDebugReferenceModel.of(singleton, "clay").parts.length !== 0 || HumanDebugReferenceModel.of(singleton, "loft").curves.length !== 0) failures.push("A singleton reference arc drew geometry");

  if (HumanReferenceSections.available().includes("f1")) {
    for (const region of ["head", "foot_l", "foot_r"]) {
      const source: HumanReferenceSections.ISection[] = HumanReferenceSections.sections("f1", region);
      console.log("f1 reference " + region + " support " + JSON.stringify({ sections: source.length, openSections: source.filter((section: HumanReferenceSections.ISection): boolean => section.arcs.length !== 0).length, openOnlySections: source.filter((section: HumanReferenceSections.ISection): boolean => section.arcs.length !== 0 && section.loops.length === 0).length }));
    }
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
