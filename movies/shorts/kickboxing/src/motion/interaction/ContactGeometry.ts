import { buildAutoMovieMeshQueryHierarchy, collectAutoMovieSpatialQueryCandidates, createAutoMovieMeshCrossingQuery, createAutoMovieMeshRayCaster, type IAutoMovieMeshQueryHierarchy, type IAutoMovieSpatialQueryEntry } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import type { MotionAction } from "../core/MotionAction";
import type { ContactTrace } from "./ContactTrace";

/**
 * Solve-local Engine queries over the actual participating drawing surfaces.
 *
 * @evidence contracts/common.md#implementation-and-ownership Fixed triangle addressing is validated once and compared linearly at each capture. Referenced vertices supply path witnesses and exact world-coordinate bounds. A crossing query is skipped only when a strict coordinate separation proves the two complete current triangle hulls disjoint; translated vertex rays still inspect their independent paths. Remaining pairs retain the public Engine strict predicates and fixed-topology refits.
 * @evidence contracts/common.md#authoring-interface Frames are detached immutable world-metre captures. Query state lasts for one resolve operation, retains only current receiver snapshots plus weak frame preparation, and is released with its session. Rotation/deformation is finitely sampled, never inferred as translated swept proof.
 */
export namespace ContactGeometry {
  /**
   * One attributed triangle/path witness within a sampled interval.
   *
   * @evidence contracts/common.md#implementation-and-ownership Coordinates and original receiver triangle come from the actual Engine crossing/ray result. The translated-vertex branch uses its point-path relative velocity; the sampled-crossing branch uses mean attack-point displacement minus receiver-first-vertex displacement, a response/orientation proxy under rotation or deformation.
   * @evidence contracts/common.md#authoring-interface Fraction belongs to the inspected interval; role distinguishes a permitted strike from a clearance violation. Exact equal fractions retain clearance authority before stable identity ordering, independent of participant enumeration. The owning receipt retains the time bracket and finite-query limitations; no epsilon groups distinct times.
   */
  export interface Witness {
    /** Actual attacking mesh identity. */
    attack: string;
    /** Explicit attack or incidental-clearance policy. */
    role: "strike" | "clearance";
    /** Actual receiver mesh identity. */
    receiver: string;
    /** Receiver triangle ordinal. */
    triangle: number;
    /** Receiver contact relationship. */
    relation: ContactTrace.Receiver["relation"];
    /** World-metre observed intersection. */
    point: MotionAction.Vec3;
    /** World unit normal opposing relative approach. */
    normal: MotionAction.Vec3;
    /** World velocity proxy in metres per second; sampled crossings use mean attack minus receiver-first-vertex motion, while translated rays use their point path. */
    velocity: MotionAction.Vec3;
    /** Fraction through the inspected interval. */
    fraction: number;
    /** Local seconds of this sampled or interpolated witness, distinct from the clear stopping time. */
    time: number;
    /** Actual query method, without a continuous-articulation claim. */
    method: NonNullable<ContactTrace.Receipt["method"]>;
  }
  /**
   * The bounded lifetime of one contact solve's prepared geometry.
   *
   * @evidence contracts/common.md#implementation-and-ownership One session owns fixed addressing and the current receiver query state, avoiding process-global identity caches and historical pose retention.
   * @evidence contracts/common.md#authoring-interface The caller drops the session after its resolve. Every capture must keep identities and topology fixed; coordinates may change freely and are admitted by the public Engine API.
   */
  export interface Session {
    /**
     * Inspect every named pair and return the earliest observed witness.
     *
     * @evidence contracts/common.md#implementation-and-ownership Uses current receiver refits for strict crossings and referenced actual attack-vertex rays only for exactly translated receivers; no relation bypasses a pair. Earlier exact fractions win, an exact co-first clearance wins over a strike, and equal-policy ties use original identities rather than enumeration order.
     * @evidence contracts/common.md#authoring-interface Seconds is the common local interval duration. Initial/unlocalized crossing failures remain explicit; returned normals/points inherit the receipt's finite sampling limits.
     */
    intercept(before: ContactTrace.Frame, after: ContactTrace.Frame, seconds: number): Witness | null;
  }
  /** Fixed original addressing and referenced drawing vertices for one mesh. */
  interface Layout { count: number; indices: number[] | null; referenced: number[]; }
  /** Once-prepared immutable capture, weakly retained by the solve. */
  interface Prepared { attacks: Map<string, ContactTrace.Attack>; receivers: Map<string, ContactTrace.Receiver>; points: Map<string, MotionAction.Vec3[]>; centres: Map<string, MotionAction.Vec3>; attackBounds: Map<string, Bounds>; receiverBounds: Map<string, Bounds>; hierarchy: IAutoMovieMeshQueryHierarchy<ReceiverBox>; }
  /** Current resident crossing snapshot and independently reusable translated ray snapshot. */
  interface Resident { mesh: IAutoMovieMesh; crossing: ReturnType<typeof createAutoMovieMeshCrossingQuery> | null; rayMesh: IAutoMovieMesh | null; ray: ReturnType<typeof createAutoMovieMeshRayCaster> | null; }
  /** Coordinate extrema of every actual referenced drawing vertex; no padding or shrink. */
  interface Bounds { low: MotionAction.Vec3; high: MotionAction.Vec3; }
  /** Actual whole-surface receiver box consumed by Engine's existing inclusive candidate walker. */
  interface ReceiverBox extends IAutoMovieSpatialQueryEntry { id: string; }
  /** Per-interval receiver motion and its solve-local immutable query snapshots. */
  interface ReceiverInterval { receiver: ContactTrace.Receiver; shift: MotionAction.Vec3; translated: boolean; resident: Resident; baseShift: MotionAction.Vec3; }
  /** Initial participant names and policies without retaining their initial geometry. */
  interface Population { attacks: Map<string, "strike" | "clearance">; receivers: Map<string, ContactTrace.Receiver["relation"]>; }
  /** Original pair whose endpoint crossing supplies no point or onset time. */
  interface Unlocalized { attack: string; receiver: string; role: Witness["role"]; time: number; }

  /**
   * Create one solve-local query owner with no browser or native-host lifetime.
   *
   * @evidence contracts/common.md#implementation-and-ownership Preparation maps, exact referenced-vertex bounds and copied indices cost linear space. A strictly disjoint world box proves no current triangle crossing, without skipping any vertex path query. Only surviving pairs lazily build/refit public Engine queries; unchanged coordinates reuse them. An unlocalized endpoint retains its original pair and cannot establish onset ordering. An earlier located witness requires actual host capture and reinspection, plus strict separation of every unresolved pair's swept endpoint boxes through that time. Those boxes enclose linearly sampled vertex paths; overlapping boxes remain unproved and refuse, independently of enumeration or role. This does not certify unsampled articulated paths.
   * @evidence contracts/common.md#authoring-interface The borrowed receipt is filled only during this session. Optional capture must return the same detached actual population at requested local seconds and enforce the caller's existing budget; without it ambiguous overlap refuses. Additional captures and pair queries remain counted. No completed query result is reused across changed coordinates. Weak frame keys do not retain discarded poses, while one receiver query/ray base and fixed layouts remain until the session is dropped.
   */
  export function create(receipt: ContactTrace.Receipt, capture?: (time: number) => ContactTrace.Frame): Session {
    const layouts: Map<string, Layout> = new Map();
    const residents: Map<string, Resident> = new Map();
    const frames: WeakMap<ContactTrace.Frame, Prepared> = new WeakMap();
    let first: Population | null = null;

    /** Prepare each owned capture once without retaining historical frame objects. */
    const prepare: (frame: ContactTrace.Frame) => Prepared = (frame: ContactTrace.Frame): Prepared => {
      const existing: Prepared | undefined = frames.get(frame);
      if (existing) return existing;
      const start: number = performance.now();
      const receiverBoxes: ReceiverBox[] = [];
      const result: Prepared = { attacks: new Map(), receivers: new Map(), points: new Map(), centres: new Map(), attackBounds: new Map(), receiverBounds: new Map(), hierarchy: buildAutoMovieMeshQueryHierarchy(receiverBoxes) };
      for (const attack of frame.attacks) {
        const layout: Layout = admitLayout(`attack:${attack.id}`, attack.mesh, layouts);
        const points: MotionAction.Vec3[] = layout.referenced.map((index: number): MotionAction.Vec3 => tuple(attack.mesh.positions, index * 3)).concat(attack.points ?? []);
        if (result.attacks.has(attack.id)) throw new Error("Attack identities must be unique.");
        result.attacks.set(attack.id, attack);
        result.points.set(attack.id, points);
        result.centres.set(attack.id, mean(points));
        result.attackBounds.set(attack.id, bounds(attack.mesh, layout));
      }
      for (const receiver of frame.receivers) {
        const layout: Layout = admitLayout(`receiver:${receiver.id}`, receiver.mesh, layouts);
        if (result.receivers.has(receiver.id)) throw new Error("Receiver identities must be unique.");
        result.receivers.set(receiver.id, receiver);
        const receiverBounds: Bounds = bounds(receiver.mesh, layout);
        result.receiverBounds.set(receiver.id, receiverBounds);
        receiverBoxes.push({ ...spatial(receiverBounds, receiverBoxes.length), id: receiver.id });
      }
      result.hierarchy = buildAutoMovieMeshQueryHierarchy(receiverBoxes);
      if (first) {
        if (result.attacks.size !== first.attacks.size || result.receivers.size !== first.receivers.size) throw new Error("Contact participant population changed during delivery.");
        for (const [id, attack] of result.attacks) if (first.attacks.get(id) !== (attack.role ?? "strike")) throw new Error("Attack identities and roles must remain fixed.");
        for (const [id, receiver] of result.receivers) if (first.receivers.get(id) !== receiver.relation) throw new Error("Receiver identities and relations must remain fixed.");
      } else {
        first = { attacks: new Map(frame.attacks.map((entry: ContactTrace.Attack): [string, "strike" | "clearance"] => [entry.id, entry.role ?? "strike"])), receivers: new Map(frame.receivers.map((entry: ContactTrace.Receiver): [string, ContactTrace.Receiver["relation"]] => [entry.id, entry.relation])) };
        receipt.participants = { attacks: frame.attacks.map((entry: ContactTrace.Attack): { id: string; role: "strike" | "clearance" } => ({ id: entry.id, role: entry.role ?? "strike" })), receivers: frame.receivers.map((entry: ContactTrace.Receiver): { id: string; relation: ContactTrace.Receiver["relation"] } => ({ id: entry.id, relation: entry.relation })) };
      }
      frames.set(frame, result);
      receipt.profile.queryPreparationMs += performance.now() - start;
      return result;
    };

    /** Recheck an ambiguous interval once at its located witness, preserving the same query owner. */
    const inspect: (before: ContactTrace.Frame, after: ContactTrace.Frame, seconds: number, resolveUnknown: boolean) => Witness | null = (before: ContactTrace.Frame, after: ContactTrace.Frame, seconds: number, resolveUnknown: boolean): Witness | null => {
      const previous: Prepared = prepare(before);
      const current: Prepared = prepare(after);
      const receiverData: Map<string, ReceiverInterval> = new Map();
      const preparationStart: number = performance.now();
      for (const [id, receiver] of current.receivers) {
        const prior: ContactTrace.Receiver = previous.receivers.get(id)!;
        const movement: { shift: MotionAction.Vec3; residual: number } = translation(prior.mesh, receiver.mesh);
        receipt.receiverNontranslationMetres = Math.max(receipt.receiverNontranslationMetres, movement.residual);
        const translated: boolean = pureTranslation(prior.mesh, receiver.mesh, movement.shift);
        let resident: Resident | undefined = residents.get(id);
        if (!resident) {
          resident = { mesh: receiver.mesh, crossing: null, rayMesh: null, ray: null };
          residents.set(id, resident);
        }
        let baseShift: MotionAction.Vec3 = [0, 0, 0];
        if (seconds > 0 && translated) {
          if (resident.rayMesh) baseShift = translation(resident.rayMesh, prior.mesh).shift;
          if (!resident.rayMesh || !pureTranslation(resident.rayMesh, prior.mesh, baseShift)) {
            resident.rayMesh = prior.mesh;
            resident.ray = createAutoMovieMeshRayCaster(prior.mesh);
            baseShift = [0, 0, 0];
            receipt.work.rayBuilds++;
          }
        }
        receiverData.set(id, { receiver, shift: movement.shift, translated, resident, baseShift });
      }
      receipt.profile.queryPreparationMs += performance.now() - preparationStart;
      let best: Witness | null = null;
      const unlocalizedPairs: Unlocalized[] = [];
      for (const [id, attack] of current.attacks) {
        const role: Witness["role"] = attack.role ?? "strike";
        const oldPoints: MotionAction.Vec3[] = previous.points.get(id)!;
        const newPoints: MotionAction.Vec3[] = current.points.get(id)!;
        if (oldPoints.length !== newPoints.length) throw new Error("Actual effector point population changed during delivery.");

        // The metre grid orders candidates only; Engine's inclusive overlap
        // rule decides membership before its existing narrow-phase tolerances.
        const candidateStart: number = performance.now();
        const currentCandidates: Set<string> = new Set(collectAutoMovieSpatialQueryCandidates(current.hierarchy, spatial(current.attackBounds.get(id)!, 0), 1, "overlap").map((entry: ReceiverBox): string => entry.id));
        receipt.profile.queryPreparationMs += performance.now() - candidateStart;
        for (const data of receiverData.values()) {
          const { receiver, shift, translated, resident, baseShift }: ReceiverInterval = data;
          const velocity: MotionAction.Vec3 = seconds > 0 ? scale(subtract(subtract(current.centres.get(id)!, previous.centres.get(id)!), shift), 1 / seconds) : [0, 0, 0];
          let located: boolean = false;
          let crossed: boolean = false;
          if (!currentCandidates.has(receiver.id)) receipt.work.separatedPairs++;
          else {
            const queryStart: number = performance.now();
            if (!resident.crossing) {
              resident.crossing = createAutoMovieMeshCrossingQuery(receiver.mesh);
              resident.mesh = receiver.mesh;
              receipt.work.crossingBuilds++;
            } else if (!coordinatesEqual(resident.mesh, receiver.mesh)) {
              resident.crossing = resident.crossing.withPositions(receiver.mesh.positions);
              resident.mesh = receiver.mesh;
              receipt.work.crossingRefits++;
            }
            receipt.profile.queryPreparationMs += performance.now() - queryStart;
            const crossingStart: number = performance.now();
            receipt.work.crossings++;
            crossed = resident.crossing.crosses(attack.mesh, {
              acceptTransversePoint: (point: readonly number[], _triangle: number, other: number): boolean => {
                located = true;
                if (preferred(1, role, id, receiver.id, other, best)) best = { attack: id, role, receiver: receiver.id, triangle: other, relation: receiver.relation, point: tuple(point), normal: orientedNormal(receiver.mesh, other, velocity), velocity, fraction: 1, time: after.sample.elapsed, method: "sampled-crossing" };
                return true;
              },
            });
            receipt.profile.crossingMs += performance.now() - crossingStart;
          }
          if (crossed && !located) { receipt.unlocalizedCrossings++; unlocalizedPairs.push({ attack: id, receiver: receiver.id, role, time: after.sample.elapsed }); }
          if (seconds <= 0 || !translated) continue;
          const rayStart: number = performance.now();
          for (let index: number = 0; index < newPoints.length; index++) {
            const path: MotionAction.Vec3 = subtract(subtract(newPoints[index]!, shift), oldPoints[index]!);
            const distance: number = length(path);
            if (distance === 0) continue;
            receipt.work.rays++;
            const hit: ReturnType<NonNullable<Resident["ray"]>["nearestHit"]> = resident.ray!.nearestHit(subtract(oldPoints[index]!, baseShift), path, distance);
            if (!hit) continue;
            const fraction: number = hit.distance / distance;
            if (!preferred(fraction, role, id, receiver.id, hit.triangle, best)) continue;
            const pointVelocity: MotionAction.Vec3 = scale(path, 1 / seconds);
            best = { attack: id, role, receiver: receiver.id, triangle: hit.triangle, relation: receiver.relation, point: add(add(oldPoints[index]!, scale(path, fraction)), scale(shift, fraction)), normal: orientedNormal(resident.rayMesh!, hit.triangle, pointVelocity), velocity: pointVelocity, fraction, time: before.sample.elapsed + fraction * seconds, method: "translated-vertex-path" };
          }
          receipt.profile.raysMs += performance.now() - rayStart;
        }
      }
      if (unlocalizedPairs.length) {

        // An endpoint overlap may have started before another pair's ray hit.
        // Actual geometry at that hit supplies tighter endpoints, but a clear
        // endpoint alone cannot exclude an earlier transient overlap. Require
        // disjoint swept boxes under the existing linear-vertex premise.
        if (best && best.time < after.sample.elapsed && capture && resolveUnknown) {
          const earlier: ContactTrace.Frame = capture(best.time);
          const earlierWitness: Witness | null = inspect(before, earlier, best.time - before.sample.elapsed, false);
          const limited: Prepared = prepare(earlier);
          if (unlocalizedPairs.every((pair: Unlocalized): boolean => sweptSeparated(previous.attackBounds.get(pair.attack)!, limited.attackBounds.get(pair.attack)!, previous.receiverBounds.get(pair.receiver)!, limited.receiverBounds.get(pair.receiver)!))) return earlierWitness ?? best;
        }
        throw new Error(`Coplanar overlap has no attributed contact point: ${unlocalizedPairs.map((pair: Unlocalized): string => `${pair.attack}->${pair.receiver} (${pair.role}) at local ${pair.time}s`).sort().join("; ")}; inspected interval [${before.sample.elapsed}, ${after.sample.elapsed}]. Inspect this configuration instead of treating it as a miss or a permitted strike.`);
      }
      return best;
    };
    return { intercept: (before: ContactTrace.Frame, after: ContactTrace.Frame, seconds: number): Witness | null => inspect(before, after, seconds, true) };
  }

  /** Exact co-first clearance cannot be hidden by a permitted strike; remaining ties use stable original identities. */
  function preferred(fraction: number, role: Witness["role"], attack: string, receiver: string, triangle: number, best: Witness | null): boolean {
    if (best === null || fraction < best.fraction) return true;
    if (fraction > best.fraction) return false;
    if (role !== best.role) return role === "clearance";
    if (attack !== best.attack) return attack < best.attack;
    if (receiver !== best.receiver) return receiver < best.receiver;
    return triangle < best.triangle;
  }

  /** Copy addressing once; later comparisons are linear and never serialize topology. */
  function admitLayout(id: string, mesh: IAutoMovieMesh, layouts: Map<string, Layout>): Layout {
    if (mesh.positions.length === 0 || mesh.positions.length % 3 !== 0) throw new Error("Contact mesh needs finite nonempty XYZ vertices.");
    for (let index: number = 0; index < mesh.positions.length; index++) if (!Number.isFinite(mesh.positions[index])) throw new Error("Contact mesh needs finite nonempty XYZ vertices.");
    if (mesh.indices ? mesh.indices.length % 3 !== 0 : mesh.positions.length % 9 !== 0) throw new Error("Contact mesh needs complete triangle addressing.");
    const previous: Layout | undefined = layouts.get(id);
    if (previous) {
      if (mesh.positions.length !== previous.count || (mesh.indices === null) !== (previous.indices === null) || mesh.indices?.length !== previous.indices?.length || (mesh.indices && !mesh.indices.every((value: number, index: number): boolean => value === previous.indices![index]))) throw new Error("Contact drawing topology changed during delivery.");
      return previous;
    }
    const referenced: number[] = mesh.indices ? Array.from(new Set(mesh.indices)) : Array.from({ length: mesh.positions.length / 3 }, (_value: unknown, index: number): number => index);
    if (!referenced.length || referenced.some((index: number): boolean => !Number.isSafeInteger(index) || index < 0 || index * 3 >= mesh.positions.length)) throw new Error("Contact referenced vertex index is invalid.");
    const result: Layout = { count: mesh.positions.length, indices: mesh.indices?.slice() ?? null, referenced };
    layouts.set(id, result);
    return result;
  }
  /** Affine triangle coordinates remain within their referenced vertices' exact extrema. */
  function bounds(mesh: IAutoMovieMesh, layout: Layout): Bounds {
    const low: MotionAction.Vec3 = [Infinity, Infinity, Infinity];
    const high: MotionAction.Vec3 = [-Infinity, -Infinity, -Infinity];
    for (const index of layout.referenced) for (let axis: number = 0; axis < 3; axis++) { low[axis] = Math.min(low[axis]!, mesh.positions[index * 3 + axis]!); high[axis] = Math.max(high[axis]!, mesh.positions[index * 3 + axis]!); }
    return { low, high };
  }
  /** Endpoint hulls enclose every triangle of linearly interpolated referenced vertices; strict axis separation proves no preceding crossing. */
  function sweptSeparated(attackBefore: Bounds, attackAfter: Bounds, receiverBefore: Bounds, receiverAfter: Bounds): boolean {
    for (let axis: number = 0; axis < 3; axis++) if (Math.max(attackBefore.high[axis]!, attackAfter.high[axis]!) < Math.min(receiverBefore.low[axis]!, receiverAfter.low[axis]!) || Math.max(receiverBefore.high[axis]!, receiverAfter.high[axis]!) < Math.min(attackBefore.low[axis]!, attackAfter.low[axis]!)) return true;
    return false;
  }
  /** Engine's exact inclusive-overlap contract uses actual extrema and half-sum partition centres. */
  function spatial(box: Bounds, ordinal: number): IAutoMovieSpatialQueryEntry { return { ordinal, low: box.low, high: box.high, centre: box.low.map((value: number, axis: number): number => value / 2 + box.high[axis]! / 2) }; }
  /** Detect translation and maximum nontranslation in one linear scan of actual coordinates. */
  function translation(before: IAutoMovieMesh, after: IAutoMovieMesh): { shift: MotionAction.Vec3; residual: number } {
    const shift: MotionAction.Vec3 = subtract(tuple(after.positions), tuple(before.positions));
    let residual: number = 0;
    for (let index: number = 0; index < before.positions.length; index += 3) residual = Math.max(residual, length(subtract(subtract(tuple(after.positions, index), tuple(before.positions, index)), shift)));
    return { shift, residual };
  }
  /** Exact coordinate equivalence, without a tolerance that might conceal rotation. */
  function pureTranslation(before: IAutoMovieMesh, after: IAutoMovieMesh, shift: MotionAction.Vec3): boolean { return before.positions.every((value: number, index: number): boolean => value + shift[index % 3]! === after.positions[index]); }
  /** Current-coordinate equality permits reuse of an unchanged crossing snapshot. */
  function coordinatesEqual(before: IAutoMovieMesh, after: IAutoMovieMesh): boolean { return before.positions.every((value: number, index: number): boolean => value === after.positions[index]); }
  /** Source face normal, reversed only to oppose the measured approach. */
  function orientedNormal(mesh: IAutoMovieMesh, triangle: number, velocity: MotionAction.Vec3): MotionAction.Vec3 {
    const vertex: (corner: number) => MotionAction.Vec3 = (corner: number): MotionAction.Vec3 => tuple(mesh.positions, (mesh.indices?.[triangle * 3 + corner] ?? triangle * 3 + corner) * 3);
    const a: MotionAction.Vec3 = subtract(vertex(1), vertex(0));
    const b: MotionAction.Vec3 = subtract(vertex(2), vertex(0));
    const normal: MotionAction.Vec3 = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const size: number = length(normal);
    if (!(size > 0)) throw new Error("Contact face is degenerate.");
    return scale(normal, (dot(normal, velocity) > 0 ? -1 : 1) / size);
  }
  /** Mean actual referenced points, used only to orient the sampled crossing response. */
  function mean(points: MotionAction.Vec3[]): MotionAction.Vec3 { const sum: MotionAction.Vec3 = [0, 0, 0]; for (const point of points) for (let index: number = 0; index < 3; index++) sum[index]! += point[index]!; return scale(sum, 1 / points.length); }
  /** Read exactly three coordinates with constant copying cost. */
  function tuple(value: readonly number[], offset: number = 0): MotionAction.Vec3 { return [value[offset]!, value[offset + 1]!, value[offset + 2]!]; }
  /** World-vector difference. */
  function subtract(a: MotionAction.Vec3, b: MotionAction.Vec3): MotionAction.Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  /** World-vector sum. */
  function add(a: MotionAction.Vec3, b: MotionAction.Vec3): MotionAction.Vec3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  /** Owned scaled vector. */
  function scale(a: MotionAction.Vec3, amount: number): MotionAction.Vec3 { return [a[0] * amount, a[1] * amount, a[2] * amount]; }
  /** Euclidean magnitude. */
  function length(a: MotionAction.Vec3): number { return Math.hypot(...a); }
  /** World-vector inner product. */
  function dot(a: MotionAction.Vec3, b: MotionAction.Vec3): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
}
