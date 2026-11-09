import { createAutoMovieRandom, deriveAutoMovieSeed, type IAutoMovieRandom, type IAutoMovieSchedule } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { TrainingCourt } from "../../entities/sets/training-court/TrainingCourt";
import { FallLaw } from "../../laws/physics/FallLaw";
import { StageAction } from "../../laws/staging/StageAction";
import { ShieldTrack } from "../duelling/ShieldTrack";
import type { SpellTrack } from "../duelling/SpellTrack";
import type { StagePerformance } from "../staging/StagePerformance";

/**
 * The cap's failure over the film: it starts at the first jinx impact within
 * 0.35 m of the cracked fillet, or at the cap's `fail` intent when that is
 * pinned with `start` or `contact` (whichever comes first) or when no jinx
 * strikes the fillet; an unpinned `fail` only sets the tipping time; two chips
 * drop at once; the cap tips 10° about its rear bearing edge for the tipping
 * time while grit runs; it releases and falls freely, rotating forward,
 * lands flat in front of the upright and stays; three fragments leave the
 * landing at 2–4 m/s within 40° of the direction away from the upright
 * (seeded by the film seed; within a quarter of that cone about the bearing
 * of a shield within 2.5 m that stands when they arrive, kept inside the
 * cone) and stop within 2.5 m or on a shield standing as they reach it;
 * dust rises and thins. The clearance audit names anyone inside the danger
 * region when the cap reaches head height.
 *
 * ```ts
 * const cap = MasonryTrack.resolve(court, schedule, spells, shields, "look-at-me-duel");
 * cap.block(31.0); // { position, angle }
 * ```
 *
 * @evidence docs/research/physics/falling-masonry.md#stages Struck, tipping 0.8–1.5 s, release, fall 0.74 s, flat landing, settling.
 * @evidence docs/research/physics/falling-masonry.md#fragments Three fragments, 2–4 m/s, within 40°, at most 2.5 m; dust under 0.8 m.
 * @evidence docs/research/physics/falling-masonry.md#clearance Clear when outside the danger region at head height.
 * @evidence docs/research/physics/falling-masonry.md#outcomes A shield stops fragments, never the cap.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Seeded from the film seed and stable ids; no seed changes the outcome class.
 * @evidence contracts/development/common.md#meaningful-documentation States the stages and the audit.
 */
export class MasonryTrack {
  /** Failure start, or Infinity when the cap never fails. */
  public readonly struck: number;

  /** Seconds of tipping. */
  public readonly tipping: number;

  /** Second the cap leaves its ledge. */
  public readonly release: number;

  /** Second it lands. */
  public readonly landing: number;

  /** Fragment flights. */
  public readonly fragments: { from: IAutoMovieVector3; to: IAutoMovieVector3; start: number; end: number }[];

  /** Clearance findings; empty when clear. */
  public readonly findings: string[] = [];

  private readonly court: TrainingCourt;

  private constructor(court: TrainingCourt, struck: number, tipping: number, fragments: MasonryTrack["fragments"]) {
    this.court = court;
    this.struck = struck;
    this.tipping = tipping;
    this.release = struck + tipping;
    this.landing = this.release + FallLaw.fallTime(court.cap.bottom);
    this.fragments = fragments;
  }

  /**
   * Resolve the cap's failure.
   *
   * @param court The court.
   * @param schedule The schedule.
   * @param spells The spells.
   * @param seed The film seed.
   * @param cap The cap prop's id.
   * @returns The track.
   */
  public static resolve(court: TrainingCourt, schedule: IAutoMovieSchedule, spells: SpellTrack.ITrack, seed: string, cap: string = "cap"): MasonryTrack {
    const fillet: IAutoMovieVector3 = court.places.crackedFillet!.point;
    const fail = schedule.entries.find((e) => e.subject === cap && e.intent.capability === "fail");
    const failAction = fail ? (StageAction.read(fail.intent) as Extract<StageAction.Action, { kind: "fail" }>) : undefined;
    const hit = spells.impacts.find((i) => i.spell === "jinx" && Math.hypot(i.point.x - fillet.x, i.point.y - fillet.y, i.point.z - fillet.z) < 0.35);
    // A ail pinned to a second starts the failure then (or at an earlier impact); an unpinned one only sets the tipping and waits for the jinx.
    const pinned: boolean = failAction !== undefined && (failAction.start !== undefined || failAction.contact !== undefined);
    const struck: number = Math.min(fail && (pinned || !hit) ? fail.end : Infinity, hit ? hit.at : Infinity);
    const tipping: number = Math.max(0.8, Math.min(1.5, failAction?.tipping ?? FallLaw.TIPPING));
    const landingAt: number = struck + tipping + FallLaw.fallTime(court.cap.bottom);
    const shields: ShieldTrack.IShield[] = ShieldTrack.resolve(schedule);
    const random: IAutoMovieRandom = createAutoMovieRandom(deriveAutoMovieSeed(seed, "falling-masonry", cap));
    const land: IAutoMovieVector3 = MasonryTrack.rest(court);
    const fragments: MasonryTrack["fragments"] = [];
    // A shield within the fragments' reach of the landing that stands when they get there draws them: formed by the
    // slowest fragment's arrival and not gone before the fastest's. They leave toward it, kept inside the cone away from the upright.
    const away = (s: ShieldTrack.IShield): number => Math.hypot(s.centre.x - land.x, s.centre.z - land.z);
    const standing: ShieldTrack.IShield | undefined = shields
      .filter((s) => away(s) <= FallLaw.FRAGMENTS.reach && s.full <= landingAt + away(s) / FallLaw.FRAGMENTS.minSpeed && s.gone >= landingAt + away(s) / FallLaw.FRAGMENTS.maxSpeed)
      .sort((a, b) => Math.hypot(a.centre.x - land.x, a.centre.z - land.z) - Math.hypot(b.centre.x - land.x, b.centre.z - land.z))[0];
    const aim: number | undefined =
      standing === undefined ? undefined : Math.max(-FallLaw.FRAGMENTS.cone, Math.min(FallLaw.FRAGMENTS.cone, Math.atan2(standing.centre.x - land.x, standing.centre.z - land.z)));
    for (let k = 0; k < FallLaw.FRAGMENTS.count; k++) {
      // Away from the upright is south (+Z): heading 0, spread within the cone, or a quarter of it about the standing shield's bearing.
      const spread: number = random.float(3 * k) * 2 - 1;
      const heading: number =
        aim === undefined ? spread * FallLaw.FRAGMENTS.cone : Math.max(-FallLaw.FRAGMENTS.cone, Math.min(FallLaw.FRAGMENTS.cone, aim + spread * FallLaw.FRAGMENTS.cone * 0.25));
      const speed: number = FallLaw.FRAGMENTS.minSpeed + random.float(3 * k + 1) * (FallLaw.FRAGMENTS.maxSpeed - FallLaw.FRAGMENTS.minSpeed);
      const drawn: number = 1.2 + random.float(3 * k + 2) * (FallLaw.FRAGMENTS.reach - 1.2);
      // Toward a standing shield each fragment carries far enough to meet it, never past the 2.5 m bound.
      const reach: number =
        standing === undefined ? drawn : Math.max(drawn, Math.min(FallLaw.FRAGMENTS.reach, Math.hypot(standing.centre.x - land.x, standing.centre.z - land.z) + 0.3));
      const from: IAutoMovieVector3 = { x: land.x + Math.sin(heading) * 0.5, y: 0.2, z: land.z + Math.cos(heading) * 0.5 };
      let to: IAutoMovieVector3 = { x: from.x + Math.sin(heading) * reach, y: 0.04, z: from.z + Math.cos(heading) * reach };
      for (const s of shields) {
        // The shield stops a fragment that reaches it while it stands.
        const p: IAutoMovieVector3 | undefined = ShieldTrack.blocks(s, landingAt + Math.hypot(s.centre.x - from.x, s.centre.z - from.z) / speed, from, to);
        if (p) to = { x: p.x, y: 0.04, z: p.z };
      }
      const distance: number = Math.hypot(to.x - from.x, to.z - from.z);
      fragments.push({ from, to, start: landingAt, end: landingAt + distance / speed });
    }
    return new MasonryTrack(court, struck, tipping, fragments);
  }

  /** Where the cap rests after landing: flat in front of the upright, over the space under its front. */
  public static rest(court: TrainingCourt): IAutoMovieVector3 {
    return { x: (court.cap.minX + court.cap.maxX) / 2, y: 0.125, z: court.cap.maxZ - 0.35 };
  }

  /**
   * The block's centre and its forward rotation about the east axis at a second.
   *
   * @param seconds Film seconds.
   * @returns World centre and rotation in radians (positive lowers the south edge).
   */
  public block(seconds: number): { position: IAutoMovieVector3; angle: number } {
    const c = this.court.cap;
    const centre: IAutoMovieVector3 = { x: (c.minX + c.maxX) / 2, y: (c.bottom + c.top) / 2, z: (c.minZ + c.maxZ) / 2 };
    if (seconds < this.struck) return { position: centre, angle: 0 };
    // Rotation about the rear bottom edge (z = minZ, y = bottom).
    const about = (angle: number): IAutoMovieVector3 => {
      const dy: number = centre.y - c.bottom;
      const dz: number = centre.z - c.minZ;
      return { x: centre.x, y: c.bottom + dy * Math.cos(angle) - dz * Math.sin(angle), z: c.minZ + dy * Math.sin(angle) + dz * Math.cos(angle) };
    };
    if (seconds < this.release) {
      const angle: number = FallLaw.TIP_ANGLE * Math.min(1, (seconds - this.struck) / this.tipping);
      return { position: about(angle), angle };
    }
    if (seconds < this.landing) {
      const u: number = (seconds - this.release) / (this.landing - this.release);
      const start: IAutoMovieVector3 = about(FallLaw.TIP_ANGLE);
      const end: IAutoMovieVector3 = MasonryTrack.rest(this.court);
      const angle: number = FallLaw.TIP_ANGLE + (FallLaw.FALL_ANGLE - FallLaw.TIP_ANGLE) * u;
      return {
        position: { x: start.x, y: Math.max(end.y, start.y - FallLaw.fallen(seconds - this.release)), z: start.z + (end.z - start.z) * u },
        angle,
      };
    }
    // Landed flat: the block settles from its fall rotation onto its broad face within 0.1 s.
    const settle: number = Math.min(1, (seconds - this.landing) / 0.1);
    return { position: MasonryTrack.rest(this.court), angle: FallLaw.FALL_ANGLE * (1 - settle) };
  }

  /**
   * Name everyone inside the danger region when the cap reaches head height (1.7 m).
   *
   * @param performance The students' performance.
   * @param students Student ids.
   * @returns Findings; empty when clear.
   */
  public audit(performance: StagePerformance, students: string[]): string[] {
    if (!Number.isFinite(this.struck)) return [];
    const headHeight: number = this.release + FallLaw.fallTime(this.court.cap.bottom - 1.7);
    return students.flatMap((id) => {
      const p: IAutoMovieVector3 | undefined = performance.position(id, headHeight);
      return p && this.court.inDanger(p, 0.25) ? [`${id} is inside the danger region at ${headHeight.toFixed(3)} s`] : [];
    });
  }
}
