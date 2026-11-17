import {
  type IAutoMovieCapturePlan,
  type IAutoMovieDrawScene,
  type IAutoMovieInspectionHandle,
  type IAutoMovieViewerSubjectBounds,
  applyAutoMovieInspection,
  formatAutoMovieInspectionCameraView,
  parseAutoMovieInspectionView,
  resolveAutoMovieInspectionView,
  describeAutoMovieDrawScene,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  planAutoMovieDrawCall,
} from "@automovie/render";
import { readAutoMovieRevision } from "automovie";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { ArchetypeRoundPlan as Round } from "./ArchetypeRoundPlan";
import { materializeArchetypeRoundGroups } from "./materializeArchetypeRoundGroups";
import { subjects } from "./subjects";

/**
 * Materialize the current 26-purpose, at-most-536-cell archetype inspection round.
 *
 * Run from packages/archetypes only after the source batch is committed and
 * clean: `pnpm exec ttsx --no-plugins --noCheck src/executable/planArchetypeRound.ts
 * <round-name>`. It reads the ignored refinement-visual-plan.json and writes
 * manifest.json plus resolved-plan.json under the task-owned acceptance-plan
 * directory. Pass that manifest to captureArchetypeRound; this tool draws nothing.
 *
 * @param round A fresh simple evidence-folder name; existing ledgers are preserved.
 * @returns After all purpose groups and fixed cameras are resolved or their failures recorded.
 * @throws {Error} For dirty/drifting source, invalid plan/round, unavailable subjects, times, marks or selections, native planning failure or a purpose/round budget overflow. A refused ledger never issues an executable partial manifest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States cwd, command, clean source gate, current plan scope, exact driver manifest, explicit times/fixed cameras, ignored output ownership, failure ledger and absence of drawing.
 * @evidence contracts/development/implementation.md#principled-implementation Actual subjects prepare the catalog models, clocks, events and marks used by capture. The pinned previous ledger supplies verbatim cameras for its unchanged 496 purpose cells; only the new van aperture section fits actual current bounds. Native plans and complete drawing inputs admit every all-string job and four exact restart pairs before drawing.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure ArchetypeRoundPlan owns admission, request text and exact native restart matching; materializeArchetypeRoundGroups expands 26 purposes and separates existing restart anchors. This coordinator owns actual scene lifetime, explicit previous cameras, actual van half-space selection, complete ledgers and manifest issuance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Explicit fixture/group recipes are inspection content, not product runtime policy. Actual cruise/leftForeOn/catch/release events determine moving times; missing data and mark/selection failures remain failures instead of neutral substitutions. Dense continuity keeps the plan's selected overlays and matched anchor triplets without a blind cross product.
 * @evidence contracts/development/implementation.md#efficient-algorithms For S finite subjects, C<=536 cells and P actual primitive vertices per sampled scene, preparation retains O(SP) scene data and camera fitting costs O(CP). Each subject is created once; per-camera time/pass inputs are deduplicated. No unmeasured performance claim is made.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Prepared scenes/descriptions serve all groups of their subject. Original camera text is reused verbatim by subject/member/view; only newly declared van aperture views are fitted over all matching times/passes. Reframing cannot hide changed geometry outside the old view, which remains visually unverified. Duplicate non-restart cells reuse their first job's evidence.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One invocation owns at most one scene per finite selected subject and disposes every successfully prepared scene in finally. Inspection handles restore after every sampled bound. Files remain in the caller's task-owned round directory; no host, renderer, GPU, watcher or background process is created.
 */
export async function planArchetypeRound(round: string): Promise<void> {
  const root: string = process.cwd();
  if (
    !/[\\/]packages[\\/]archetypes$/iu.test(root) ||
    !/^[a-z0-9][a-z0-9._-]*$/iu.test(round)
  )
    throw new Error(
      "Plan from packages/archetypes with a simple fresh round name",
    );
  const revision: string = readAutoMovieRevision(root);
  if (!/^[a-f0-9]{40}$/u.test(revision))
    throw new Error("Commit a clean archetypes source batch before planning");
  const output: string = path.resolve(
    root,
    "../../.git/archetypes-acceptance-plan-20261117",
    round,
  );
  const planFile: string = path.resolve(
    root,
    "../../.git/archetypes-campaign-20261117/refinement-visual-plan.json",
  );
  const plan: Record<string, unknown> = Round.admit(
    JSON.parse(await fs.readFile(planFile, "utf8")),
  );
  const groups: Record<string, unknown>[] = Round.list(plan.cellGroups).map(
    Round.object,
  );
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(
    path.join(output, "planning-started.json"),
    JSON.stringify({ revision, planFile }),
    { flag: "wx" },
  );
  const prepared: Map<string, Round.IPrepared> = new Map();
  const unavailable: Map<string, Error> = new Map();
  const drafts: Round.IDraft[] = [];
  const failures: Round.IFailure[] = [];
  const reused: { group: string; cell: string }[] = [];
  const comparisons: { repeatGroup: string; originalCell: string }[] = [];
  const jobs: Round.IJob[] = [];
  const cells: { job: string; group: string; plan: IAutoMovieCapturePlan }[] =
    [];
  const cameras: Map<string, string> = new Map();
  const observations: Round.IObservation[] = [];
  const replay: object[] = [];
  const reuse: Record<string, unknown> = Round.object(plan.cameraReuse);
  const previous: Record<string, unknown> = Round.object(
    JSON.parse(
      await fs.readFile(path.resolve(root, Round.text(reuse.resolvedPlan)), "utf8"),
    ),
  );
  if (previous.revision !== reuse.revision || previous.actualCells !== 496)
    throw new Error(
      "Camera reuse requires the explicitly pinned 496-cell baseline",
    );
  const previousCameras: Record<string, unknown> = Round.object(previous.cameras);
  let source: ReturnType<typeof subjects> = {};
  try {
    try {
      source = subjects(null);
    } catch (error) {
      failures.push({ group: "catalog", cause: Round.describe(error) });
    }
    const expanded: Awaited<ReturnType<typeof materializeArchetypeRoundGroups>> =
      await materializeArchetypeRoundGroups({ plan, groups, get, failures });
    drafts.push(...expanded.drafts);
    reused.push(...expanded.reused);
    comparisons.push(...expanded.comparisons);
    if (
      Round.identity(
        drafts.filter(
          (draft: Round.IDraft): boolean => draft.group !== "van-side-passage",
        ),
      ) !== Round.identity(Round.list(previous.drafts))
    )
      failures.push({
        group: "baseline",
        cause: "The original 496 purpose cells changed",
      });

    // Preserve original framing; only the new van section fits a camera.
    const fits: Map<string, Round.IDraft[]> = new Map();
    for (const draft of drafts) {
      const key: string = Round.cameraKey(draft);
      const items: Round.IDraft[] = fits.get(key) ?? [];
      items.push(draft);
      fits.set(key, items);
    }
    for (const [key, items] of fits) {
      try {
        cameras.set(key, await camera(items));
      } catch (error) {
        failures.push({ group: items[0]!.group, cause: Round.describe(error) });
      }
    }
    for (const draft of drafts) {
      try {
        const fixed: string | undefined = cameras.get(Round.cameraKey(draft));
        if (fixed === undefined)
          throw new Error(
            `No admitted fixed camera for ${draft.subject}/${draft.view}`,
          );
        const request: Record<string, string> = Round.request(
          plan,
          draft,
          fixed,
          (await get(draft.subject)).metadata,
        );
        const native: IAutoMovieCapturePlan = planAutoMovieCapture({
          request: parseAutoMovieCapturePlanRequest(
            new URLSearchParams(request),
          ),
          subject: (await get(draft.subject)).metadata,
          cuts: [],
        });
        const id: string = `j${String(jobs.length + 1).padStart(3, "0")}-${draft.group}`;
        jobs.push({ id, request });
        cells.push({ job: id, group: draft.group, plan: native });
      } catch (error) {
        failures.push({ group: draft.group, cause: Round.describe(error) });
      }
    }
    try {
      replay.push(...Round.replay(cells));
    } catch (error) {
      failures.push({ group: "restart-admission", cause: Round.describe(error) });
    }
    if (readAutoMovieRevision(root) !== revision)
      failures.push({
        group: "source",
        cause: "Source changed during portable preparation",
      });
  } catch (error) {
    failures.push({ group: "preparation", cause: Round.describe(error) });
  } finally {
    for (const item of prepared.values()) {
      try {
        item.scene.dispose();
      } catch (error) {
        failures.push({
          group: "disposal",
          cause: Round.describe(error),
        });
      }
    }
  }
  const count: number = cells.reduce(
    (sum: number, item: (typeof cells)[number]): number =>
      sum + item.plan.cells.length,
    0,
  );
  if (count > 536)
    failures.push({
      group: "round",
      cause: `${count} native cells exceed 536`,
    });
  await fs.writeFile(
    path.join(output, "resolved-plan.json"),
    JSON.stringify(
      {
        revision,
        sourcePlan: { file: planFile, snapshot: plan },
        status:
          failures.length === 0 ? "resolved-not-drawn" : "refused-not-drawn",
        maximumCells: 536,
        actualCells: count,
        failures,
        reused,
        comparisons,
        replay,
        cameraReuse: reuse,
        drawingConditions: {
          sourceRevision: revision,
          backend: "software; actual capture record must agree for every pair",
          labelScale: 1,
          layoutPolicy: "Native raster shortest edge; one cell per sheet",
          limits:
            "Changed geometry may exceed the reused frame; no automatic refit or visibility verdict is made",
        },
        drafts,
        observations,
        cameras: Object.fromEntries(cameras),
        subjects: [...prepared].map(
          ([name, item]: [string, Round.IPrepared]): object => ({
            name,
            metadata: item.metadata,
          }),
        ),
        jobs: cells.map((item: (typeof cells)[number]): object => ({
          id: item.job,
          group: item.group,
          times: item.plan.times,
          windows: item.plan.windows,
          cells: item.plan.cells,
          layout: item.plan.layout,
          drawCalls: item.plan.cells.map(
            (cell: IAutoMovieCapturePlan["cells"][number]): object =>
              planAutoMovieDrawCall(cell, item.plan),
          ),
        })),
      },
      null,
      2,
    ),
    { flag: "wx" },
  );
  if (failures.length !== 0)
    throw new Error(
      `Round planning refused ${failures.length} findings; read ${output}/resolved-plan.json`,
    );
  await fs.writeFile(
    path.join(output, "manifest.json"),
    JSON.stringify(
      { revision, out: path.join(output, "captures"), jobs },
      null,
      2,
    ),
    { flag: "wx" },
  );
  console.log(
    JSON.stringify({
      manifest: path.join(output, "manifest.json"),
      revision,
      jobs: jobs.length,
      cells: count,
    }),
  );

  /** Actual portable subject preparation is cached once, including unavailable subjects. */
  async function get(name: string): Promise<Round.IPrepared> {
    const known: Round.IPrepared | undefined = prepared.get(name);
    if (known !== undefined) return known;
    const failed: Error | undefined = unavailable.get(name);
    if (failed !== undefined) throw failed;
    try {
      const offered: ReturnType<typeof subjects>[string] | undefined =
        source[name];
      if (offered === undefined)
        throw new Error(`Actual catalog supplies no subject ${name}`);
      const scene: IAutoMovieDrawScene = await offered.create();
      try {
        const item: Round.IPrepared = {
          scene,
          metadata: describeAutoMovieDrawScene(name, scene),
        };
        prepared.set(name, item);
        return item;
      } catch (error) {
        try {
          scene.dispose();
        } catch (release) {
          throw new AggregateError(
            [error, release],
            "Subject description and disposal failed",
          );
        }
        throw error;
      }
    } catch (error) {
      const cause: Error = new Error(Round.describe(error));
      unavailable.set(name, cause);
      throw cause;
    }
  }

  /** Admit actual selections, preserve original framing and fit only the new van section. */
  async function camera(items: Round.IDraft[]): Promise<string> {
    const first: Round.IDraft = items[0]!;
    const item: Round.IPrepared = await get(first.subject);
    const view: ReturnType<typeof parseAutoMovieInspectionView> =
      parseAutoMovieInspectionView(first.view);
    if (view.type !== "named" || view.follow)
      throw new Error(
        "Purpose views must be fixed once from native named directions",
      );
    const fixed: unknown = previousCameras[Round.cameraKey(first)];
    if (fixed === undefined && first.group !== "van-side-passage")
      throw new Error(
        `The pinned baseline has no camera for ${Round.cameraKey(first)}`,
      );
    if (
      fixed !== undefined &&
      parseAutoMovieInspectionView(Round.text(fixed)).type !== "fixed"
    )
      throw new Error("The baseline camera is not explicit native camera text");
    const prior: Record<string, unknown> | undefined = Round.list(previous.subjects)
      .map(Round.object)
      .find((subject: Record<string, unknown>): boolean =>
        subject.name === first.subject,
      );
    if (
      prior === undefined ||
      Round.object(prior.metadata).width !== item.metadata.width ||
      Round.object(prior.metadata).height !== item.metadata.height
    )
      throw new Error("Reusing a camera requires the original actual subject raster");
    if (first.group === "van-side-passage") {
      item.scene.scene.updateMatrixWorld(true);
      const member: ReturnType<typeof item.scene.scene.getObjectByName> =
        item.scene.scene.getObjectByName("set")?.getObjectByName(first.member);
      const driver: ReturnType<typeof item.scene.scene.getObjectByName> =
        member?.getObjectByName("side-driver");
      if (member === undefined || driver === undefined)
        throw new Error(
          "Van section requires the actual member and opposite side-driver wall",
        );
      const middle: number = member.matrixWorld.elements[12]!;
      if (
        !Number.isFinite(middle) ||
        !Number.isFinite(driver.matrixWorld.elements[12]) ||
        driver.matrixWorld.elements[12] === middle
      )
        throw new Error("The actual opposite van wall does not define a half-space");
      const sign: string = driver.matrixWorld.elements[12]! > middle ? "" : "-";
      for (const draft of items)
        draft.inspection = { section: `${sign}x:${middle}` };
    }
    let bounds: IAutoMovieViewerSubjectBounds | null = null;
    const sampled: Set<string> = new Set();
    for (const draft of items)
      for (const seconds of draft.seconds) {
        const sample: string = JSON.stringify([draft.pass, seconds]);
        if (sampled.has(sample)) continue;
        sampled.add(sample);
        await item.scene.seek(seconds);
        const request: ReturnType<typeof parseAutoMovieCapturePlanRequest> =
          parseAutoMovieCapturePlanRequest(
            new URLSearchParams(
              Round.request(plan, draft, draft.view, item.metadata),
            ),
          );
        const contactFocus: boolean =
          view.focus?.type === "pattern" &&
          view.focus.pattern.includes("/affordance/");
        const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
          scene: item.scene.scene,
          request: request.inspection,
          ...(item.scene.marks === undefined
            ? {}
            : { marks: item.scene.marks(seconds) }),
        });
        try {
          observations.push({
            subject: draft.subject,
            member: draft.member,
            view: draft.view,
            seconds,
            pass: draft.pass,
            selected: [...handle.selected],
            legend: [...handle.legend],
          });

          // Surface/overlay partners supply the actual shared framing bounds.
          // Marks-alone is still admitted above; a contact-only focus is located
          // by its real overlay mark rather than fabricated geometry in clay.
          if (
            request.inspection.surface &&
            (!contactFocus || request.inspection.marks.length !== 0)
          ) {
            const current: IAutoMovieViewerSubjectBounds | null = handle.bounds(
              view.focus,
            );
            if (current === null)
              throw new Error(
                `${first.subject}/${first.view} has no actual selected bounds`,
              );
            if (bounds === null)
              bounds = { min: { ...current.min }, max: { ...current.max } };
            else
              for (const axis of ["x", "y", "z"] as const) {
                bounds.min[axis] = Math.min(
                  bounds.min[axis],
                  current.min[axis],
                );
                bounds.max[axis] = Math.max(
                  bounds.max[axis],
                  current.max[axis],
                );
              }
          }
        } finally {
          handle.restore();
        }
      }
    if (fixed !== undefined) return Round.text(fixed);
    return formatAutoMovieInspectionCameraView(
      resolveAutoMovieInspectionView({
        view,
        text: first.view,
        bounds,
        camera: item.scene.camera,
        ...(item.scene.views === undefined ? {} : { views: item.scene.views }),
        seconds: first.seconds[0]!,
        width: item.scene.width,
        height: item.scene.height,
      }).record,
    );
  }
}

planArchetypeRound(process.argv[2] ?? "").catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});

