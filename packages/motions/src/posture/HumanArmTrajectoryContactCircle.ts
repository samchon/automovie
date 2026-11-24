import { HUMANOID_REST_FRAME, Quaternion, Vector3, hingedArmSwivel, toRigAngle } from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieAxisFrame,
  IAutoMovieHingedArmSwivel,
  IAutoMovieHingedChainGeometry,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { placeHumanArmGeometry } from "./placeHumanArmGeometry";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryDistal } from "./HumanArmTrajectoryDistal";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";
import { HumanArmTrajectoryTravel } from "./HumanArmTrajectoryTravel";

/**
 * Step a hand contact along a world-space site. Keeping the distal angles
 * fixed turns its offset into part of the elbow-to-contact link. The hinge
 * equation gives both flexion roots and each root's shoulder swivel circle.
 * Search outwards from the preceding shoulder orientation on both arcs and
 * read the actual rig and clearance at each candidate. Two additional circles
 * retain the incoming or authored hand attitude through native distal twist.
 * A candidate's contact is on its site within the region's disc and the
 * model's tolerance, the trajectory admission's own test.
 *
 * @param c Original action geometry and physical bounds.
 * @param a Arm index in course order.
 * @param k The contact frame on the original action clock.
 * @param reference Source coordinates in the native arm chart.
 * @param from The adjacent frame on a continuation, omitted for terminal components.
 * @returns The nearest admitted continuation or representatives of the disconnected sampled components.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed distal angles, moving contact, analytic branches and shared clearance owner.
 * @evidence contracts/development/implementation.md#principled-implementation Removes the measured hinge rotation from the elbow-to-contact vector, then uses the native two-link hinge and swivel equations. The peak quaternion dot locates the nearest shoulder on each circle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the hinge roots once, visit their nearest swivels first and return a pose only after checking its projected FK.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unrepresented projected pose or a hard collision rejects the candidate, and callers verify the whole trajectory before adoption.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most the native angular grid on each hinge root of each contact circle at a failed hold waypoint; a continuing branch normally needs only its nearest candidate. A candidate's refusing tests run cheapest first (contact, probe steps, then pairs and sweep), and its pairs leave unread every pair whose bounding sphere shows it short of a refusal.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A root's harmonic and angular center serve both directions. Each proposed pose is placed once to measure its contact and collision pairs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All geometry belongs to the current waypoint, and only the chosen coordinates escape.
 */
export function HumanArmTrajectoryContactCircle(
  c: M.IContext,
  a: number,
  k: number,
  reference: readonly number[],
  from?: number,
): number[][] {
  const site: M.ISite | undefined = c.sites[a]![k];
  if (site === undefined || site.on !== undefined) return [];
  const setup: IAutoMovieMotionHumanArmGeometry.ISetup = c.setups[a]!;
  const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
  const prior: IAutoMovieMotionHumanArmGeometry.IPlaced | undefined = from === undefined ? undefined : G.placed(setup, c.frames[a]![from]!, reference);
  const interval: number = from === undefined ? k : Math.min(from, k);
  const before: ReturnType<typeof G.chain> = G.chain(setup, frame, reference);
  const contact: IAutoMovieVector3 = P.pad(before, site.contact);
  const hinge: IAutoMovieVector3 = setup.basis(setup.bones.lower, "contact swivel").flexion;
  const flexion: IAutoMovieAxisFrame | undefined = HUMANOID_REST_FRAME[setup.bones.lower]?.flexion;
  const above: IAutoMovieQuaternion = Quaternion.multiply(before.upper, setup.rest.lower.rotation);
  const local: IAutoMovieVector3 = Quaternion.rotateVector(Quaternion.inverse(above), Vector3.subtract(contact, before.elbow));
  const link: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle(hinge, -toRigAngle(reference[3]!, flexion)!),
    local,
  );
  const geometry: Omit<Parameters<typeof hingedArmSwivel.prepare>[0], "endOffset"> = {
    upper: { worldPosition: before.shoulder, worldRotation: Quaternion.multiply(frame.parent.rotation, setup.rest.upper.rotation) },
    midOffset: setup.rest.lower.translation,
    midRest: setup.rest.lower.rotation,
    hinge,
  };
  const bound: IAutoMovieAngleRange | null | undefined = setup.constraint.lower?.flexion;
  const low: number | null = toRigAngle(bound?.min ?? null, flexion);
  const high: number | null = toRigAngle(bound?.max ?? null, flexion);
  const rad: number = Math.PI / 180;
  const range: IAutoMovieHingedChainGeometry["range"] = low === null || high === null ? undefined
    : { min: Math.min(low, high) * rad, max: Math.max(low, high) * rad };
  const wanted: IAutoMovieQuaternion = G.shoulder(setup, reference);
  // The contact is on its site within the region's disc and the model's own
  // tolerance, metres: what the trajectory's admission accepts (a site
  // missed only past `M.TOLERANCE` beyond its disc), so a zero disc is not
  // asked to hold to the rounding of the fit.
  const reach: number = site.disc + M.TOLERANCE / 1000;
  const branches: IBranch[] = [];
  const add = (offset: IAutoMovieVector3, point: IAutoMovieVector3, hand?: IAutoMovieQuaternion): void => {
    const target: IAutoMovieHingedArmSwivel.IPreparedTarget = hingedArmSwivel.prepare({ ...geometry, endOffset: offset }).target(point, range);
    for (const stop of target.branches() ?? []) {
      if (stop.shortfall > reach) continue;
      const turn: IAutoMovieHingedArmSwivel.IHarmonic | undefined = target.harmonic?.(stop.theta);
      if (turn === undefined) continue;
      branches.push({
        angle: (stop.theta / rad) * (flexion?.sign ?? 1) + (flexion?.neutral ?? 0),
        center: 2 * Math.atan2(dot(wanted, turn.sine), dot(wanted, turn.cosine)) / rad,
        pose: turn.pose(),
        hand,
      });
    }
  };
  add(link, site.point);
  for (const hand of site.rotation === undefined ? [before.hand] : [before.hand, site.rotation])
    add(setup.rest.hand.translation, Vector3.subtract(site.point, Quaternion.rotateVector(hand, site.contact)), hand);
  // The pairs' cut (`HumanArmTrajectoryPairs.deepest`) that leaves unread
  // only pairs whose bounding spheres show them shallower than a refusal,
  // the skin and the tolerance: the candidate's verdict reads no other.
  const refuses: number = -(T.SKIN + M.TOLERANCE);
  const exceedsClearance = (depth: number): boolean =>
    depth - T.SKIN > M.TOLERANCE;
  const check = (branch: IBranch, swivel: number): number[] | undefined => {
    const arm: IAutoMovieMotionHumanArmClearance.IArm = G.arm(setup, reference, branch.pose(swivel).upper);
    const q: number[] = M.ranged(c, a, G.encode(setup, { ...arm, lower: [branch.angle, arm.lower[1], arm.lower[2]] }));
    if (branch.hand !== undefined)
      HumanArmTrajectoryDistal(setup, G.chain(setup, frame, q).upper, branch.hand, q);
    const chain: ReturnType<typeof G.chain> = G.chain(setup, frame, q);
    const palm: IAutoMovieVector3 = P.pad(chain, site.contact);
    if (Vector3.distance(palm, site.point) > reach) return undefined;
    const placed: IAutoMovieMotionHumanArmGeometry.IPlaced = placeHumanArmGeometry(setup, frame, chain, true);

    // Every test below can only refuse the candidate, so the cheapest go
    // first: the probes' steps, three distances, before the pairs and the
    // sweep, which read the body's shapes.
    const start: IAutoMovieMotionHumanArmGeometry.IPlaced | undefined =
      prior === undefined ? undefined : from! < k ? prior : placed;
    const end: IAutoMovieMotionHumanArmGeometry.IPlaced | undefined =
      prior === undefined ? undefined : from! < k ? placed : prior;
    if (start !== undefined && end !== undefined) {
      const limit: number = M.stepLimit(c, interval) + M.TOLERANCE;
      for (const probe of T.SPEED) {
        const delta: IAutoMovieVector3 = HumanArmTrajectoryTravel.step(
          c.frames[a]![interval]!, c.frames[a]![interval + 1]!,
          start.probes[probe]![0], end.probes[probe]![0],
        );
        if (1000 * Vector3.length(delta) > limit) return undefined;
      }
    }

    // One exact forbidden penetration is sufficient to reject the swivel.
    for (const pair of P.deepest(
      c,
      a,
      k,
      placed,
      refuses,
      exceedsClearance,
    ).values())
      if (exceedsClearance(pair.short)) return undefined;
    for (const pair of P.embedded(
      c,
      a,
      k,
      placed,
      refuses,
      exceedsClearance,
    ).values())
      if (exceedsClearance(pair.short)) return undefined;
    if (start !== undefined && end !== undefined)
      for (const sweep of HumanArmTrajectorySweep.of(c, a, interval, start, end))
        if (1000 * (sweep.lower - sweep.clear) > M.TOLERANCE) return undefined;
    return q;
  };
  if (from === undefined) {
    // A terminal site's circular runs can be disconnected. A midpoint of
    // each sampled run leaves the largest angular interval to its ends,
    // and each retained center still undergoes actual FK and sweep checks.
    const out: number[][] = [];
    for (const branch of branches) {
      const samples: (number[] | undefined)[] = [];
      for (let turn: number = 0; turn < 360; turn += hingedArmSwivel.STEP)
        samples.push(check(branch, branch.center + turn));
      const gap: number = samples.indexOf(undefined);
      if (gap < 0) {
        out.push(samples[0]!);
        continue;
      }
      let run: number = 0;
      for (let j: number = 1; j <= samples.length; ++j) {
        const i: number = (gap + j) % samples.length;
        if (samples[i] !== undefined) {
          ++run;
          continue;
        }
        if (run > 0)
          out.push(samples[(i - 1 - Math.floor((run - 1) / 2) + samples.length) % samples.length]!);
        run = 0;
      }
    }
    return out;
  }
  for (let offset: number = 0; offset <= 180; offset += hingedArmSwivel.STEP) {
    for (const branch of branches) {
      const positive: number[] | undefined = check(branch, branch.center + offset);
      if (positive !== undefined) return [positive];
      if (offset === 0 || offset === 180) continue;
      const negative: number[] | undefined = check(branch, branch.center - offset);
      if (negative !== undefined) return [negative];
    }
  }
  return [];
}

/** A reachable flexion root and its nearest shoulder swivel in degrees. */
interface IBranch {
  /** Clinical elbow flexion, degrees. */
  angle: number;
  /** Swivel nearest the incoming shoulder, degrees. */
  center: number;
  /** Native shoulder pose at a swivel, degrees. */
  pose: IAutoMovieHingedArmSwivel.IPoseResult;
  /** World hand attitude for a wrist-targeted circle. */
  hand?: IAutoMovieQuaternion;
}

/** Inner product of quaternion coefficients in the native swivel harmonic. */
function dot(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
  return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}
