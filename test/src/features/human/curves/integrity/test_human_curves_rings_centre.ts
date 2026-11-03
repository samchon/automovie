import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveCentreTrack } from "../../../internal/curves/HumanCurveCentreTrack";
import { HumanCurveRings } from "../../../internal/curves/HumanCurveRings";
import type { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanAnatomyShared } from "../../../internal/HumanAnatomyShared";
import { HumanPeople } from "../../../internal/HumanPeople";

type V3 = HumanAnatomy.V3;

/**
 * Pins that no composed chain carries an offset layer: the track of every
 * limb, digit, neck and trunk chain's section centres turns no sharper than
 * smooth skin does.
 *
 * Scenarios:
 * 1. A made straight track 2 mm a station reads no turn; a made arc of 50 mm radius reads under the bound.
 * 2. f1's `leg.left` centre track with one thigh centre moved 6 mm sideways reads past the bound and at least 3 mm above the unedited track there.
 * 3. Every person of `HumanPeople`: every chain read, and every one past the bound listed by person, chain, station and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and evaluates each delivered chain's section every 2 mm by its own evaluator (`HumanCurveRings`), taking each section's mean point at 192 even phases as its centre; the track of those centres, three stations at each end left out, is resampled at 1 mm and read for its sharpest sagitta over a 10 mm chord. It catches a layer offset from its neighbours at any girth (an offset ring, a kinked leg or forearm axis, a stepped neck), which the girth profile cannot see.
 * @evidence contracts/testing.md#independent-expectations The bound is the crease definition (`HumanAnatomyShared.CREASE`): a section's outline is its centre plus its radius, so a turn of the centre track tighter than about 7 mm of radius is carried by the outline on at least one side, and no limb, digit, neck or trunk meridian at the bind turns that sharply (Gray 1918: the limbs extended, the joints' turns broad). No construction constant enters. Proven green on a made straight track and a 50 mm arc (0.25 mm of sagitta against the 1.04 mm smooth turn), red on f1's own leg track with one centre moved 6 mm (a 6 mm tent). Oracle limits: the centre is the phase mean, not the area centroid, so a section whose phases bunch moves its centre slightly; the head chains below the vault and the ears are not read (the chin and the nose enter a horizontal section abruptly, the ears are open shells).
 * @evidence contracts/testing.md#distinguishing-cases Every chain of the core set's ten people that `HumanCurveCentreTrack.CHAINS` names. Girth steps and spacing belong to `test_human_curves_rings`, the girth profile shapes to `test_human_curves_profile_*`, the skin's meridian kinks to `test_human_curves_step_*` and `_dent_*`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_rings_centre`, generating the cached people in process on the CPU (body law only) with no renderer, browser or GPU; profiles are shared with the other chain readers.
 */
export function test_human_curves_rings_centre(): void {
  const failures: string[] = [];
  const track: (centre: V3[]) => HumanCurveRings.IProfile = (centre: V3[]): HumanCurveRings.IProfile => ({
    chain: "made",
    stations: centre.map((_: V3, i: number): number => 2 * i),
    girth: centre.map((): number => 0),
    centre,
  });

  // Made tracks: a straight line and a 50 mm arc, 2 mm a station.
  const straight: number = HumanCurveCentreTrack.turn(track(Array.from({ length: 60 }, (_: unknown, i: number): V3 => [0, 2 * i, 0]))).excess;
  if (!(straight <= 0)) failures.push(`made straight track read ${straight.toFixed(3)} mm, expected no turn`);
  const arc: number = HumanCurveCentreTrack.turn(track(Array.from({ length: 60 }, (_: unknown, i: number): V3 => [50 * Math.cos(i / 25), 50 * Math.sin(i / 25), 0]))).excess;
  if (!(arc < 0)) failures.push(`made 50 mm arc read ${arc.toFixed(3)} mm, expected under the 12.5 mm radius' turn`);

  // f1's own leg track with one centre moved 6 mm sideways: a tent whose 1 mm resampling keeps at least 5.5 mm of its peak.
  const leg: HumanCurveRings.IProfile = HumanCurveRings.profile("f1", "leg.left");
  const k: number = Math.floor((3 * leg.centre.length) / 4);
  const moved: V3[] = leg.centre.map((c: V3, i: number): V3 => (i === k ? [c[0], c[1], c[2] + 6] : c));
  const window: (centre: V3[]) => HumanCurveRings.IProfile = (centre: V3[]): HumanCurveRings.IProfile => ({ ...leg, centre: centre.slice(k - 12, k + 13), stations: leg.stations.slice(k - 12, k + 13) });
  const before: number = HumanCurveCentreTrack.turn(window(leg.centre)).excess;
  const after: number = HumanCurveCentreTrack.turn(window(moved)).excess;
  if (!(after > HumanAnatomyShared.CREASE && after >= before + 3))
    failures.push(`f1 leg.left with one centre moved 6 mm read ${after.toFixed(2)} mm against ${before.toFixed(2)} unedited, expected past the 1 mm bound and 3 mm above`);

  // Every person, every chain read.
  for (const name of HumanPeople.names()) {
    try {
      const chains: string[] = HumanPeople.person(name).body.chains.map((c: IAutoMovieHumanLoftChain): string => c.name);
      for (const r of HumanCurveCentreTrack.rows(name, chains, (chain: string): HumanCurveRings.IProfile => HumanCurveRings.profile(name, chain)))
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(2)} mm over ${r.high}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} CUR-4 findings:\n${failures.join("\n")}`);
}
