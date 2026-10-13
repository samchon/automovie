import { AutoMovieGeometryQuery, IAutoMovieCompiledShotSource, IAutoMovieGeometryResult, IAutoMovieVector3 } from "@automovie/interface";
import { composeFormationHeroTransform } from "./composeFormationHeroTransform";
import { intersectsPerspectiveFrustumSphere } from "./film/intersectsPerspectiveFrustumSphere";
import { projectToNdc } from "./film/projectToNdc";
import { resolveAutoMovieDeliveryCrop } from "./film/resolveAutoMovieDeliveryCrop";
import { resolveCameraAt } from "./film/resolveCameraAt";
import { formationSlotPosition } from "./formationSlotPosition";
import { placeFormationSlot } from "./placeFormationSlot";
import { sampleFormationMotion } from "./sampleFormationMotion";
import { sampleFormationSlotMotion } from "./sampleFormationSlotMotion";
import { selectFormationLod } from "./selectFormationLod";
import { transformFormationBounds } from "./transformFormationBounds";
import { transformFormationPoint } from "./transformFormationPoint";
import { IAutoMovieGeometryMeasurementInput } from "./IAutoMovieGeometryMeasurementInput";
import { createAutoMovieGeometryActorReader } from "./createAutoMovieGeometryActorReader";
import { readAutoMovieGeometryGround } from "./readAutoMovieGeometryGround";
import { placeTransformedPoint } from "./film/placeTransformedPoint";


/**
 * Measure one materialized formation at shot-local seconds: representative ground contacts, bounds, route clearance and analytic chunk/hero visibility and LOD; inconsistent participating shots throw.
 *
 * @evidence contracts/common.md#principled-implementation Requires matching counts/digests and nonempty chunks in every participating shot, samples unit/member motion, checks three unique representative slots per chunk, and uses camera frustum spheres expanded by measured model radius. Ground results are representative rather than exhaustive.
 * @evidence contracts/common.md#clear-and-simple-design The branch owns participation and summary aggregation while shared formation placement, LOD, terrain and camera helpers keep the same geometry as rendering consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No arbitrary missing runtime or camera is synthesized; route clearance is explicitly zero without routes. Radius includes the existing 0.01 minimum chunk-centre sphere plus runtime model expansion, and pixel projection clamps depth to 0.001 consistently with this analytic estimate.
 * @evidence contracts/common.md#meaningful-documentation States sampled-time, representative-ground and analytic visibility limits; output exposes counts, bounds, pixel ranges, LOD populations and compiled digest.
 * @evidence contracts/performance.md#efficient-algorithms Scans participating contracts/runtimes, routes, chunks and heroes; representative slots are at most three per chunk. AABB farthest-corner radius uses axis extrema, and range aggregation avoids argument spreading or extra distance/pixel arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work One sampled unit motion, resolved camera and per-chunk measurement serve all summary fields and LOD counts; no cross-call cache assumes compiled snapshots stay unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary slot sets and chunk measurements scale with chunk count and are released after return/throw; returned fields contain scalars and the existing digest, with no renderer handles.
 */
export function measureAutoMovieGeometryFormation(props: IAutoMovieGeometryMeasurementInput, request: Extract<AutoMovieGeometryQuery, { query: "formation" }>): IAutoMovieGeometryResult {
const reader: ReturnType<typeof createAutoMovieGeometryActorReader> = createAutoMovieGeometryActorReader(props.compiled);
const shots: ReadonlyMap<string, IAutoMovieCompiledShotSource> = props.compiled;

      const formation: ReturnType<typeof props.design.formations.get> = props.design.formations.get(request.formation);

      if (formation === undefined)
        throw new Error(
          `Formation "${request.formation}" does not exist. Inspect current formation ids.`,
        );

      const participatingShots: string[] = [...props.design.shots]
        .filter(([, contract]: [string, NonNullable<ReturnType<typeof props.design.shots.get>>]): boolean =>
          contract.participants.some(
            (participant: (typeof contract.participants)[number]): boolean =>
              participant.kind === "formation" &&
              participant.id === request.formation,
          ),
        )
        .map(([id]: [string, NonNullable<ReturnType<typeof props.design.shots.get>>]): string => id);

      const runtimes: IAutoMovieCompiledShotSource["formations"] = participatingShots.flatMap((id: string): IAutoMovieCompiledShotSource["formations"] => {
        const runtime: IAutoMovieCompiledShotSource["formations"][number] | undefined = shots
          .get(id)
          ?.formations.find((candidate: IAutoMovieCompiledShotSource["formations"][number]): boolean => candidate.id === formation.id);
        return runtime === undefined ? [] : [runtime];
      });

      const firstParticipatingShot: string | undefined = participatingShots[0];

      if (
        firstParticipatingShot === undefined ||
        runtimes.length !== participatingShots.length ||
        runtimes.some(
          (runtime: IAutoMovieCompiledShotSource["formations"][number]): boolean =>
            runtime.count !== formation.count ||
            runtime.digest !== runtimes[0]!.digest ||
            runtime.chunks.length === 0,
        )
      )
        throw new Error(
          `Formation "${request.formation}" is not fully materialized in every current participating shot. Recompile its source and builder-owned slots.`,
        );

      const runtime: IAutoMovieCompiledShotSource["formations"][number] = runtimes[0]!;

      if (
        request.shot !== undefined &&
        participatingShots.includes(request.shot) === false
      )
        throw new Error(
          `Shot "${request.shot}" does not participate in formation "${request.formation}". Select one of ${participatingShots.join(", ")}.`,
        );

      const selectedShot: string = request.shot ?? firstParticipatingShot;

      const compiled: IAutoMovieCompiledShotSource = shots.get(selectedShot)!;

      const sampledTime: number = request.time ?? 0;

      if (
        Number.isFinite(sampledTime) === false ||
        sampledTime < 0 ||
        sampledTime > compiled.shot.duration
      )
        throw new Error(
          `Formation sample time ${sampledTime} is outside current shot "${selectedShot}". Choose a finite time from 0 through ${compiled.shot.duration}.`,
        );

      const sampledMotion: ReturnType<typeof sampleFormationMotion> = sampleFormationMotion(
        compiled.formationMotions,
        formation.id,
        sampledTime,
      );

      const transformPoint: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 =>
        transformFormationPoint(
          point,
          runtime.anchor,
          sampledMotion,
          runtime.facingDeg,
        );

      const representative: number[] = [
        ...new Set(
          runtime.chunks.flatMap((chunk: (typeof runtime.chunks)[number]): number[] => [
            chunk.start,
            chunk.start + Math.floor((chunk.count - 1) / 2),
            chunk.start + chunk.count - 1,
          ]),
        ),
      ];

      // A member the shot has taken out of this unit is standing nowhere, so
      // reporting it as a unit standing over a void would be a lie about a
      // member nobody can see. A member displaced by its own cue is reported
      // where its cue really put it, which is the same reason.
      const groundViolations: number[] = representative.filter((slot: number): boolean => {
        const placed: ReturnType<typeof placeFormationSlot> = placeFormationSlot({
          position: formationSlotPosition(runtime, slot),
          facingDeg: runtime.facingDeg,
          anchor: runtime.anchor,
          baseFacingDeg: runtime.facingDeg,
          unit: sampledMotion,
          member: sampleFormationSlotMotion(
            compiled.formationSlotMotions,
            formation.id,
            slot,
            sampledTime,
          ),
        });
        if (placed.present === false) return false;
        const sample: ReturnType<typeof readAutoMovieGeometryGround> = readAutoMovieGeometryGround(props.design.world, placed.position);
        return (
          sample.walkable === false ||
          Math.abs(sample.height - placed.position.y) > 1e-6
        );
      });

      const bounds: ReturnType<typeof transformFormationBounds> = transformFormationBounds(
        runtime.bounds,
        runtime.anchor,
        sampledMotion,
        runtime.facingDeg,
      );

      const centroid: IAutoMovieVector3 = transformPoint(runtime.centroid);

      const width: number = bounds.max.x - bounds.min.x;

      const depth: number = bounds.max.z - bounds.min.z;

      // No world design is no route to clear, as it is no ground to stand on.
      const routes: NonNullable<IAutoMovieGeometryMeasurementInput["design"]["world"]>["routes"] = props.design.world?.routes ?? [];

      const routeClearance: number =
        routes.length === 0
          ? 0
          : routes.reduce((clearance: number, route: (typeof routes)[number]): number => Math.min(clearance, route.allowedFormationWidth - width), Number.POSITIVE_INFINITY);

      const camera: IAutoMovieCompiledShotSource["scene"]["cameras"][number] | undefined = compiled.scene.cameras.find(
        (candidate: IAutoMovieCompiledShotSource["scene"]["cameras"][number]): boolean => candidate.id === compiled.shot.camera,
      );

      if (camera === undefined)
        throw new Error(
          `Shot "${selectedShot}" has no current compiled camera "${compiled.shot.camera}".`,
        );

      const resolvedCamera: ReturnType<typeof resolveCameraAt> = resolveCameraAt(
        camera.transform,
        compiled.shot.cameraMotion,
        camera.id,
        request.time ?? 0,
      );

      const halfY: number = Math.tan((camera.fovY * Math.PI) / 360);

      const production: IAutoMovieGeometryMeasurementInput["design"]["production"] = props.design.production;

      if (production === null)
        throw new Error(
          "Formation measurement requires current production frame format. Restore production design and compile.",
        );

      const aspect: number =
        production.frameFormat.width / production.frameFormat.height;

      const crop: ReturnType<typeof resolveAutoMovieDeliveryCrop> = resolveAutoMovieDeliveryCrop(production.frameFormat.crop);

      const chunkMeasurements: { distance: number; projectedPixels: number; visible: boolean }[] = runtime.chunks.map((chunk: (typeof runtime.chunks)[number]): { distance: number; projectedPixels: number; visible: boolean } => {
        const center: IAutoMovieVector3 = transformPoint(chunk.centroid);
        const transformedBounds: ReturnType<typeof transformFormationBounds> = transformFormationBounds(
          chunk.bounds,
          runtime.anchor,
          sampledMotion,
          runtime.facingDeg,
        );
        const radius: number =
          Math.max(
            0.01,
            Math.hypot(
              Math.max(Math.abs(transformedBounds.min.x - center.x), Math.abs(transformedBounds.max.x - center.x)),
              Math.max(Math.abs(transformedBounds.min.y - center.y), Math.abs(transformedBounds.max.y - center.y)),
              Math.max(Math.abs(transformedBounds.min.z - center.z), Math.abs(transformedBounds.max.z - center.z)),
            ),
          ) + runtime.projectionRadius;
        const distance: number = Math.hypot(
          center.x - resolvedCamera.position.x,
          center.y - resolvedCamera.position.y,
          center.z - resolvedCamera.position.z,
        );
        const projection: ReturnType<typeof projectToNdc> = projectToNdc(
          resolvedCamera,
          center,
          halfY,
          aspect,
          crop,
        );
        const projectedPixels: number =
          (runtime.projectionRadius * production.frameFormat.height) /
          (halfY *
            Math.max(0.001, projection.depth) *
            (crop.bottom - crop.top));
        const visible: boolean = intersectsPerspectiveFrustumSphere({
          camera: resolvedCamera,
          center,
          radius,
          near: camera.near,
          far: camera.far,
          halfY,
          aspect,
          crop,
        });
        return {
          distance,
          projectedPixels,
          visible,
        };
      });

      const tierCounts: { hero: number; near: number; far: number } = { hero: 0, near: 0, far: 0 };
      let nearestDistance: number = Number.POSITIVE_INFINITY;
      let farthestDistance: number = Number.NEGATIVE_INFINITY;
      let minimumProjectedPixels: number = Number.POSITIVE_INFINITY;
      let maximumProjectedPixels: number = Number.NEGATIVE_INFINITY;
      let culled: number = 0;

      runtime.chunks.forEach((chunk: (typeof runtime.chunks)[number], index: number): void => {
        const measurement: (typeof chunkMeasurements)[number] = chunkMeasurements[index]!;
        nearestDistance = Math.min(nearestDistance, measurement.distance);
        farthestDistance = Math.max(farthestDistance, measurement.distance);
        minimumProjectedPixels = Math.min(minimumProjectedPixels, measurement.projectedPixels);
        maximumProjectedPixels = Math.max(maximumProjectedPixels, measurement.projectedPixels);
        if (measurement.visible === false) {
          culled += chunk.anonymousCount;
          return;
        }
        const lod: ReturnType<typeof selectFormationLod>["lod"] = selectFormationLod({
          lod: runtime.lod,
          distance: measurement.distance,
          projectedPixels: measurement.projectedPixels,
          previous: null,
        }).lod;
        tierCounts[lod.tier] += chunk.anonymousCount;
      });

      const heroVisible: number = runtime.heroes.filter((hero: (typeof runtime.heroes)[number]): boolean => {
        const node: IAutoMovieCompiledShotSource["scene"]["nodes"][number] | undefined = compiled.scene.nodes.find(
          (candidate: IAutoMovieCompiledShotSource["scene"]["nodes"][number]): boolean => candidate.id === hero.actor,
        );
        if (node === undefined) return false;
        const found: ReturnType<typeof reader.find> = reader.find(hero.actor,
compiled.shot.id);
        const source: ReturnType<typeof reader.spatial> = reader.spatial(compiled,
hero.actor,
sampledTime,
found.model.skeleton);
        const formed: ReturnType<typeof composeFormationHeroTransform> = composeFormationHeroTransform(
          hero.transform,
          source.nodeTransform,
          runtime.anchor,
          sampledMotion,
          runtime.facingDeg,
        );
        const point: IAutoMovieVector3 =
          source.poseRoot === null
            ? formed.translation
            : placeTransformedPoint(formed, source.poseRoot.translation);
        const projectionRadius: number =
          runtime.projectionRadius *
          Math.max(
            Math.abs(formed.scale.x),
            Math.abs(formed.scale.y),
            Math.abs(formed.scale.z),
          );
        return intersectsPerspectiveFrustumSphere({
          camera: resolvedCamera,
          center: point,
          radius: projectionRadius,
          near: camera.near,
          far: camera.far,
          halfY,
          aspect,
          crop,
        });
      }).length;

      return {
        kind: "measurement",
        values: {
          designCount: formation.count,
          materializedCount: runtime.count,
          anonymousCount: runtime.anonymousCount,
          heroCount: runtime.heroes.length,
          chunkCount: runtime.chunks.length,
          participatingShots: participatingShots.length,
          width,
          depth,
          centroidX: centroid.x,
          centroidY: centroid.y,
          centroidZ: centroid.z,
          facingDeg: formation.facingDeg,
          sampledTime,
          motionOffsetX: sampledMotion.translation.x,
          motionOffsetY: sampledMotion.translation.y,
          motionOffsetZ: sampledMotion.translation.z,
          motionFacingOffsetDeg: sampledMotion.facingOffsetDeg,
          lateralSpacingScale: sampledMotion.spacingScale.lateral,
          depthSpacingScale: sampledMotion.spacingScale.depth,
          routeClearance,
          representativeSlots: representative.length,
          groundViolations: groundViolations.length,
          nearestDistance,
          farthestDistance,
          minimumProjectedPixels,
          maximumProjectedPixels,
          heroVisible,
          nearVisible: tierCounts.near,
          farVisible: tierCounts.far,
          culled,
          compiledDigest: runtime.digest,
          state: "compiled",
        },
      };
}

