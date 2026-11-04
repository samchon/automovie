import assert from "node:assert/strict";
import { AutoMovieHumanGrounding as Grounding, AutoMovieHumanRigControls as Controls, type AutoMovieHumanClinicalIk as Ik, type AutoMovieHumanSupportFrame as Frame, type IAutoMovieHumanPose } from "@automovie/human";
import { LabActor } from "../../../../src/motion-lab/LabActor";

/** One compact captured leg state; numbers are canonical degrees, not new authored targets. */
interface NativeCase { name: string; pelvis: number; left: readonly number[]; right: readonly number[]; root: Grounding.IRoot; rigid: boolean }

/**
 * Actual ONE012 native floor-branch failures converge against their original goals.
 *
 * @evidence contracts/testing.md#observable-behavior Rebuilds the current1800mm muscular production Human and all original foot/toe vertices through the existing actor, then calls public Grounding from four exact captured final leg states. Original declared Hallux tripods and scene roots remain fixed; no achieved final point becomes a target. Jab/slip stagnation and cross/weave budget failures must reach the unchanged .25mm support and1um floor contracts within16 updates.
 * @evidence contracts/testing.md#independent-cases Constants retain the compact leg/root/target fields of round012 native captures, rather than an archived alternate body or a serialized mesh. Each captured witness must belong exactly to current source geometry. An independent inspect call checks final public FK and all source vertices. The pure root unit separately proves the piecewise algebra at crossing and tied floor branches; this unit proves its actual nonlinear consumer domain.
 */
export function test_support_native_floor_branch_cases(): void {
  const actor: LabActor = new LabActor("native-floor", "a", 0, 0);
  try {
    const vertices: Frame.IPoint[] = [...actor.footPoints("left"), ...actor.footPoints("right")];
    const solve: Grounding.IPrepared = Grounding.prepare(actor.person.evaluate, vertices);
    const channels: Controls.DegreeChannel[] = (["left", "right"] as const).flatMap((side: "left" | "right"): Controls.DegreeChannel[] => ["hip.flexion", "hip.abduction", "hip.rotation", "knee.flexion", "knee.rotation", "ankle.dorsiflexion", "foot.subtalarInversion"].map((leaf: string): Controls.DegreeChannel => Controls.channel(`legs.${side}.${leaf}`) as Controls.DegreeChannel));
    for (const captured of cases()) {
      const pose: IAutoMovieHumanPose = structuredClone(actor.basePose);
      pose.pelvis = { rotation: captured.pelvis };
      pose.legs = { left: leg(captured.left), right: leg(captured.right) };
      const targets: Ik.ITarget[] = goals(captured);
      for (const target of targets) assert.ok(vertices.some((point: Frame.IPoint): boolean => point.bone === target.bone && point.localPoint.every((value: number, axis: number): boolean => value === target.localPoint![axis])), "Captured witness must remain actual original geometry");
      const request: Grounding.IRequest = { channels, targets, rootAxes: ["y"], iterations: 16, tolerance: .00025, floorTolerance: .000001 };
      const priorErrors: Readonly<Record<string, number>> = { "free-jab-a": .0003549499300661727, "free-cross-a": .0007562578876788974, "standalone-slip": .00032250463509351547, "standalone-weave": .0006070257036328227 };
      const priorError: number = priorErrors[captured.name]!;
      assert.ok(Math.abs(solve.inspect(pose, captured.root, request).error - priorError) < 1e-9, `${captured.name}: fixed current capture must reproduce before fitting`);
      const original: string = JSON.stringify({ pose, targets, root: captured.root });
      const result: Grounding.IResult = solve(pose, captured.root, request);
      const observed: Grounding.IResult = solve.inspect(result.pose, result.root, request);
      assert.equal(result.status, "admitted", `${captured.name}: ${result.reason}, residual ${result.error}`);
      assert.ok(result.iterations <= 16 && observed.supportError <= .00025 && observed.floorMinimum >= -.000001, captured.name);
      assert.ok(observed.output.clamped.every((clamp: { path: string }): boolean => !channels.includes(clamp.path as Controls.DegreeChannel)), captured.name);
      assert.equal(JSON.stringify({ pose, targets, root: captured.root }), original);
    }
  } finally { actor.dispose(); }
}

/** Exact hip3, knee2, ankle and two preserved foot coordinates from the current native capture. */
function leg(values: readonly number[]): NonNullable<IAutoMovieHumanPose["legs"]>["left"] {
  return { hip: { flexion: values[0]!, abduction: values[1]!, rotation: values[2]! }, knee: { flexion: values[3]!, rotation: values[4]! }, ankle: { dorsiflexion: values[5]! }, foot: { subtalarInversion: values[6]!, midfootSupination: values[7]!, hallux: {}, second: {}, third: {}, fourth: {}, fifth: {} } };
}

/** Only the captured root and clinical coordinates vary; no fitting result defines these constants. */
function cases(): NativeCase[] {
  return [
    { name: "free-jab-a", pelvis: -18, left: [31.72018107249583, -3.178219977581282, 38.06230961123779, 39.84274386060951, -.6594787935458962, -2.3766883158553616, -5, -.13285990587357369], right: [21.389251951380533, 8.629413162284882, 44.4697082427708, 49.919814469964756, .4413071254955211, 3.9165333580384, 2.974641726146852, 2.0816116856922675], root: { translation: [-1, -.02418174261710639, 0], rotation: [0, 0, 0, 1] }, rigid: false },
    { name: "free-cross-a", pelvis: -20, left: [29.533996628214386, 2.4028476958724907, 7.284080880411254, 38.72307859934514, -3.5978796850349357, 4.480886430203984, -5, -.13285990587357369], right: [13.722263537480515, 13.935117915093263, 4.030901244202708, 44.072508393813436, -8.578095582940163, 3.2831144142241513, 5, 2.0816116856922675], root: { translation: [1, -.038160599715784026, -.09834040092389969], rotation: [0, 1, 0, 6.123233995736766e-17] }, rigid: true },
    { name: "standalone-slip", pelvis: -20, left: [31.583450556287655, 5.246001053388188, 7.528513020555136, 44.008191543826584, -5.03970347774429, 7.090618397398225, -2.0620268318230517, -.13285990587357369], right: [16.158186978528313, 10.884921230819687, 4.322980318407492, 52.32310693969035, -7.713792372234878, 9.238147722485525, 5, 2.0816116856922675], root: { translation: [-.75, -.054106146293511195, .044809839139885135], rotation: [0, 0, 0, 1] }, rigid: true },
    { name: "standalone-weave", pelvis: -20, left: [33.39805121812605, 5.021137748148034, 6.520946826035513, 47.03288451762431, -3.450424067998064, 8.346540080298636, -2.796473350928437, -.13285990587357369], right: [17.06771426852109, 11.958024945045132, 3.1730101785225835, 53.880224718663385, -6.772786015645907, 9.646718489515694, 5, 2.0816116856922675], root: { translation: [-.75, -.06202585790121651, .05842774828564265], rotation: [0, 0, 0, 1] }, rigid: true },
  ];
}

/** Original declared WORLD goals, expressed about the captured fixed initial actor heading. */
function goals(captured: NativeCase): Ik.ITarget[] {
  const origin: number = captured.name === "free-jab-a" ? -1 : captured.name === "free-cross-a" ? 1 : -.75;
  const sign: number = captured.name === "free-cross-a" ? -1 : 1;
  return (["left", "right"] as const).flatMap((side: "left" | "right"): Ik.ITarget[] => {
    const mirror: number = side === "left" ? -1 : 1;
    const local: Controls.MetrePoint[] = [[.016003191471099854, -.01137081254273653, mirror * .0029750133398920298], [-.0016337049892172217, .012274966575205326, -mirror * .0053071570582687855], [.027922121807932854, .007945789955556393, -mirror * .0073178657330572605]];
    const world: Controls.MetrePoint[] = side === "left" ? [[.38786322790815747, 0, .1427407122755612], [.37492887500688143, .026605552919634103, .15071720287083004], [.40340286512757717, .019356657033099058, .1449711596866192]] : [[-.08613464556638784, 0, -.25813893045135783], [-.09237080689948773, .029992297773666982, -.2587302843503484], [-.07106917443513117, .0139158212825318, -.27229932909290744]];
    return world.slice(0, captured.rigid ? 3 : 1).map((position: Controls.MetrePoint, index: number): Ik.ITarget => ({ bone: Controls.joint(`${side}HalluxDistal`), localPoint: local[index]!, position: [origin + sign * position[0], position[1], sign * position[2]] }));
  });
}
