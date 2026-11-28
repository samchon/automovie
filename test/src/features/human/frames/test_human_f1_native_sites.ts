import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanCourseRuns as Runs,
  AutoMovieHumanF1NativeCalibration as Calibration,
  AutoMovieHumanF1NativeSites as Sites,
  AutoMovieHumanF1RootRails as Rails,
} from "@automovie/human";
import type { IAutoMovieViewAxis } from "@automovie/interface";

/**
 * f1's native measurement sites stand where their definitions put them, and the calibration reads them from that one owner.
 *
 * Scenarios:
 * 1. Every site lies inside its declared run with tau in [0, 1] (a provisional site's tau is its run share), and the knee, calf, elbow,
 *    wrist and head sites are carried by the femur, tibia, humerus, forearm and head.
 * 2. A site defined as the course station nearest a datum is a local minimum of the course's distance to that datum: 0.05 mm either side
 *    is no nearer.
 * 3. Carrying f1's sites through f1's own runs returns every station bit for bit, and every course's station map is the shared identity.
 * 4. The calibration's exported site tables (`WALL`, `ARM`, `LEG`) and root caliper offsets (`RAIL`) are exactly the site owner's stations
 *    and the rails' single landing owner; the failure lists every site with its signed difference.
 * 5. The sites keep their anatomical order along each course (hip, omphalion, under bust, bust, neck, head; mid upper arm, elbow, forearm;
 *    wrist, metacarpals; thigh, knee, calf, ankle, ball of foot), the order the directional profiles' increasing anchors rest on.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the production site owner and calibration exports on f1's stored families and datums.
 * @evidence contracts/development/testing.md#independent-expectations The nearest-datum property is checked by direct distances on the course, the run share by its definition, and the export equality by identity with the owner.
 * @evidence contracts/development/common.md#meaningful-documentation Each site has a valid run address. Nearest-datum stations, same-source mappings, calibration export identity and anatomical order are tested separately.
 */
export function test_human_f1_native_sites(): void {
  const failures: string[] = [];
  const sites: Sites.ISites = Sites.REFERENCE;
  const groups: [string, Record<string, Sites.ISite>][] = [
    ["wall", sites.wall],
    ["arm", sites.arm],
    ["leg", sites.leg],
    ["extremities", sites.extremities],
  ];

  // 1. Runs and tau.
  for (const [group, record] of groups)
    for (const [name, site] of Object.entries(record)) {
      const ends: number[] = sites.runs[site.family];
      const [a, b] = [ends[site.run.index]!, ends[site.run.index + 1]!];
      if (!(site.station >= a && site.station <= b && site.run.tau >= 0 && site.run.tau <= 1))
        failures.push(`${group}.${name} ${site.station} lies outside its run ${site.run.from}-${site.run.to} [${a}, ${b}]`);
      if (Math.abs((site.station - a) / (b - a) - site.run.tau) > 1e-12) failures.push(`${group}.${name} tau is not its run share`);
    }

  // The carrying segments named by anatomy: the knee ends the femur, the wrist ends the forearm, the head site lies on the head.
  for (const [what, site, segment] of [
    ["leg.knee", sites.leg.knee, "femur"],
    ["leg.calf", sites.leg.calf, "tibia"],
    ["arm.elbow", sites.arm.elbow, "humerus"],
    ["arm.wrist", sites.arm.wrist, "forearm"],
    ["wall.head", sites.wall.head, "head"],
  ] as const)
    if (site.segment !== segment) failures.push(`${what} is carried by ${site.segment}, not ${segment}`);

  // 2. Nearest-datum sites are local minima of the distance to their datum.
  const axes: Record<string, IAutoMovieViewAxis.IAxis> = {
    arm: H.axis(Sites.F1.body.arm),
    hand: H.axis(Sites.F1.body.hand),
    leg: H.axis(Sites.F1.body.leg),
  };
  const mid = (a: string, b: string): number[] => {
    const [p, q] = [Sites.F1.point(a), Sites.F1.point(b)];
    return [0, 1, 2].map((k: number): number => (p[k]! + q[k]!) / 2);
  };
  const datums: [Sites.ISite, number[], string][] = [
    [sites.arm.upperArm, mid("upperarm", "lowerarm"), "arm.upperArm"],
    [sites.arm.elbow, Sites.F1.point("lowerarm"), "arm.elbow"],
    [sites.arm.wrist, mid("styloidRadial", "styloidUlnar"), "arm.wrist"],
    [sites.leg.knee, Sites.F1.point("calf"), "leg.knee"],
    [sites.extremities.hand, mid("index1", "pinky1"), "extremities.hand"],
    [sites.extremities.foot, Sites.F1.point("footBall"), "extremities.foot"],
  ];
  for (const [site, datum, name] of datums) {
    const axis: IAutoMovieViewAxis.IAxis = axes[site.family]!;
    const d = (s: number): number => {
      const o: readonly number[] = axis.at(s).origin;
      return Math.hypot(o[0]! - datum[0]!, o[1]! - datum[1]!, o[2]! - datum[2]!);
    };
    if (d(site.station - 0.05) < d(site.station) - 1e-9 || d(site.station + 0.05) < d(site.station) - 1e-9)
      failures.push(`${name} ${site.station} is not the course station nearest its datum`);
  }

  // 3. The identity carry.
  const carried: Sites.ISites = Sites.resolve(Sites.F1);
  for (const [group, record] of groups)
    for (const [name, site] of Object.entries(record)) {
      const other: Sites.ISite = (carried[group as "wall"] as Record<string, Sites.ISite>)[name]!;
      if (!Object.is(other.station, site.station)) failures.push(`${group}.${name} changed under f1's own runs`);
    }
  if (Runs.map(sites.runs.leg, carried.runs.leg) !== Runs.identity) failures.push("f1's leg runs did not carry by the identity");
  for (const [course, map] of Object.entries(Sites.maps(sites, Sites.F1)))
    if (map !== Runs.identity) failures.push(`f1's ${course} station map is not the shared identity`);

  // 4. The calibration reads the owner's sites.
  const report: string[] = [];
  const compare = (what: string, got: number, site: Sites.ISite): void => {
    report.push(`${what}: owner ${site.station} (${site.basis}, ${site.run.from}-${site.run.to} tau ${site.run.tau.toFixed(4)}) export ${got} difference ${(site.station - got).toFixed(3)} mm`);
    if (!Object.is(got, site.station)) failures.push(`${what}: the calibration exports ${got}, the owner's site is ${site.station}`);
  };
  const wall: Record<string, keyof Sites.ISites["wall"]> = { hipSkin: "hip", omphalionWall: "omphalion", underbustWall: "underbust", bustWall: "bust", neckSkin: "neck", headSkin: "head" };
  for (const [name, station] of Calibration.WALL) compare("WALL." + name, station, sites.wall[wall[name]!]!);
  for (const [name, station] of Calibration.ARM) compare("ARM." + name, station, sites.arm[name]);
  for (const [name, station] of Calibration.LEG) compare("LEG." + name, station, sites.leg[name as "knee"]);
  compare("extremities.hand", Calibration.EXTREMITIES.hand, sites.extremities.hand);
  compare("extremities.foot", Calibration.EXTREMITIES.foot, sites.extremities.foot);
  for (const name of ["arm", "leg", "breast", "nose"] as const)
    if (!Object.is(Calibration.RAIL[name], Rails.landing[name])) failures.push(`RAIL.${name} ${Calibration.RAIL[name]} is not the rails' landing ${Rails.landing[name]}`);

  // 5. Anatomical order along each course, which the directional profiles' increasing anchors rest on.
  const ordered = (what: string, stations: [string, number][]): void => {
    for (let k: number = 1; k < stations.length; ++k)
      if (!(stations[k]![1] > stations[k - 1]![1]))
        failures.push(`${what}: ${stations[k]![0]} ${stations[k]![1]} does not lie past ${stations[k - 1]![0]} ${stations[k - 1]![1]}`);
  };
  ordered("trunk", (["hip", "omphalion", "underbust", "bust", "neck", "head"] as const).map((name): [string, number] => [name, sites.wall[name].station]));
  ordered("arm", (["upperArm", "elbow", "forearm"] as const).map((name): [string, number] => [name, sites.arm[name].station]));
  ordered("hand", [["wrist", sites.arm.wrist.station], ["hand", sites.extremities.hand.station]]);
  ordered("leg", [...(["thigh", "knee", "calf", "ankle"] as const).map((name): [string, number] => [name, sites.leg[name].station]), ["foot", sites.extremities.foot.station]]);
  if (failures.length !== 0) throw new Error([...failures, "", ...report].join("\n"));
}
