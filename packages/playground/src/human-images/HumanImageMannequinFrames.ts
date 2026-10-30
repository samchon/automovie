import { createHash } from "node:crypto";

import type { IHumanMannequinSnapshot } from "../human-stickman/IHumanMannequinSnapshot";
import type { IHumanViewerCommitment } from "../human/IHumanViewerCommitment";
import type { HumanImageProcess } from "./HumanImageProcess";
import { HumanImageSourceIdentity } from "./HumanImageSourceIdentity";
import { commitHumanMannequinSnapshot } from "./commitHumanMannequinSnapshot";

/** One verified Mannequin PNG with the existing Human response envelope. */
type Frame = {
  png: Buffer;
  key: string;
  cacheHit: boolean;
  receipt: object;
  capturedUtc: string;
  pngSha256: string;
};

/** Verify and retain same-fresh Mannequin frames under the existing Session queue.
 *
 * @evidence contracts/common.md#principled-implementation Reobserves actual source/host around one existing worker command, recomputes geometry/construction/input commitments from its public snapshot, and validates actual PNG SHA and UTC.
 * @evidence contracts/common.md#clear-and-simple-design Owns Mannequin frame identity/cache only; the enclosing HumanImageSession owns admission, resident process and busy-close lifecycle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mode joins source/input identity; changed geometry across display-only frames, missing metadata or altered PNG rejects instead of serving a different current model.
 * @evidence contracts/common.md#meaningful-documentation Separates geometry/placement commitments from captured visibility, camera, lighting and static blockout limits.
 * @evidence contracts/performance.md#efficient-algorithms Source observation and actual low-polygon snapshot hashing are linear; a same-fresh hit performs no worker command or draw.
 * @evidence contracts/performance.md#reuse-equivalent-work One input/source key retains at most six FIFO frame-name slots from the admitted framing/view/pass population, each with its exact nonce and actual capture UTC; a new input clears those slots.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds one key's six display snapshots sharing verified invariant geometry arrays and at most 256 MiB PNG bytes; clear, mode replacement and Session.close release all references, without acquiring native resources.
 */
export class HumanImageMannequinFrames {
  /** Source observer's existing repository boundary. */
  private readonly root: string;
  /** The source/input/representation key currently retained by this frame owner. */
  private key: string | undefined;
  /** First observed worker implementation inventory; changes require server restart. */
  private host: string | undefined;
  /** Same-model digests that display-only camera/pass changes must preserve. */
  private commitment: IHumanViewerCommitment | undefined;
  /** First verified geometry arrays; equal model digests permit sharing their immutable values. */
  private geometry: IHumanMannequinSnapshot["geometry"] | undefined;
  /** At most six actual frame slots, replacing each previous nonce on a fresh draw. */
  private readonly frames: Map<string, { nonce: string | null; frame: Frame }> =
    new Map();

  /** The enclosing Session lends its repository boundary and controls this cache's lifetime. */
  public constructor(root: string) {
    this.root = root;
  }

  /** Drop display-mode state when an ordinary/native model replaces this page or the Session closes. */
  public clear(): void {
    this.frames.clear();
    this.key = undefined;
    this.commitment = undefined;
    this.geometry = undefined;
  }

  /** Produce or reuse one actual frame; caller already owns the Session admission slot.
   *
   * @evidence contracts/common.md#principled-implementation Source/host observations bracket actual worker PNG and geometry checks; model, construction and actual-input digests must remain equal across display-only frames.
   * @evidence contracts/common.md#clear-and-simple-design Retains only Mannequin frame data while the enclosing Session owns native execution and serial admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Changed source, model, input, GPU or PNG identity rejects and cannot be labeled as a new successful frame.
   * @evidence contracts/common.md#meaningful-documentation Raw snapshots preserve all actual buffers, world placement, shared material/texture tables, markers and visibility; model commitment excludes display visibility while input binds actual hint/root/pose/time state.
   * @evidence contracts/performance.md#efficient-algorithms Same-fresh hits skip the worker; misses hash one actual low-polygon snapshot and PNG.
   * @evidence contracts/performance.md#reuse-equivalent-work The existing key/frame/nonce policy reuses actual pixels and capture time rather than drawing an equivalent request again.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Six frame slots share one key and a 256 MiB PNG cap; replacement, source failure and Session teardown clear retained references.
   */
  public async frame(
    worker: HumanImageProcess,
    input: { value: Record<string, unknown>; sha256: string },
    name: string,
    nonce?: string,
  ): Promise<Frame> {
    const host: string = await HumanImageSourceIdentity.host(this.root);
    if (this.host !== undefined && this.host !== host)
      throw new Error("Mannequin host changed; restart this server");
    this.host = host;
    const source: string = await HumanImageSourceIdentity.source(this.root);
    const key: string = createHash("sha256")
      .update(source + input.sha256 + "|mannequin:polygon")
      .digest("hex");
    if (key !== this.key) {
      this.clear();
      this.key = key;
    }
    const cached: { nonce: string | null; frame: Frame } | undefined =
      this.frames.get(name);
    let result: Frame;
    if (cached !== undefined && (nonce === undefined || cached.nonce === nonce))
      result = { ...cached.frame, cacheHit: true };
    else {
      const reply: Record<string, unknown> = await worker.request({
        kind: "mannequin",
        source,
        key,
        inputSha256: input.sha256,
        value: input.value,
        name,
      });
      if (typeof reply.snapshotJson !== "string")
        throw new Error("Mannequin worker snapshot JSON is missing");
      const snapshot: IHumanMannequinSnapshot = JSON.parse(reply.snapshotJson);
      const commitment: IHumanViewerCommitment =
        reply.commitment as IHumanViewerCommitment;
      if (
        reply.key !== key ||
        reply.source !== source ||
        reply.inputSha256 !== input.sha256 ||
        !Buffer.isBuffer(reply.png) ||
        typeof reply.pngSha256 !== "string" ||
        createHash("sha256").update(reply.png).digest("hex") !==
          reply.pngSha256 ||
        typeof reply.capturedUtc !== "string" ||
        !Number.isFinite(Date.parse(reply.capturedUtc)) ||
        snapshot === null ||
        typeof snapshot !== "object"
      )
        throw new Error("Mannequin worker frame identity mismatch");
      if (
        snapshot.completion?.ready !== true ||
        snapshot.completion.error !== null ||
        snapshot.completion.closed !== false ||
        !Number.isSafeInteger(snapshot.completion.sequence) ||
        snapshot.completion.sequence <= 0 ||
        snapshot.controller?.playing !== false
      )
        throw new Error(
          "Mannequin worker did not bind a completed paused draw",
        );
      const actual: IHumanViewerCommitment =
        commitHumanMannequinSnapshot(snapshot);
      for (const field of [
        "modelSha256",
        "constructionSha256",
        "actualInputSha256",
      ] as const)
        if (
          actual[field] !== commitment[field] ||
          (this.commitment !== undefined &&
            this.commitment[field] !== actual[field])
        )
          throw new Error(
            "Mannequin model changed across display frames: " + field,
          );
      this.commitment = actual;
      if (this.geometry === undefined) this.geometry = snapshot.geometry;
      else
        snapshot.geometry = snapshot.geometry.map(
          (
            part: IHumanMannequinSnapshot["geometry"][number],
            index: number,
          ): typeof part => {
            const shared: typeof part = this.geometry![index];
            return {
              ...part,
              hierarchy: shared.hierarchy,
              matrixWorld: shared.matrixWorld,
              positions: shared.positions,
              normals: shared.normals,
              indices: shared.indices,
            };
          },
        );
      const { geometry, ...metadata }: IHumanMannequinSnapshot = snapshot;
      const receipt: object = {
        kind: "human-mannequin",
        key,
        sourceSha256: source,
        inputSha256: input.sha256,
        modelSha256: actual.modelSha256,
        constructionSha256: actual.constructionSha256,
        actualInputSha256: actual.actualInputSha256,
        meaning:
          "Actual rigid Mannequin buffers/world placement; construction is actual section geometry and posed rig; visibility is capture state; no anatomical or skin-binding approval",
        frame: name,
        publication: null,
        snapshot,
        capture: {
          nonce: nonce ?? null,
          capturedUtc: reply.capturedUtc,
          pngSha256: reply.pngSha256,
          controls: reply.controls,
          metadata: {
            ...metadata,
            visibility: geometry.map(
              (part: (typeof geometry)[number]): object => ({
                name: part.name,
                hierarchy: part.hierarchy,
                visible: part.visible,
                effectiveVisible: part.effectiveVisible,
              }),
            ),
            source,
            modelKey: key,
            frame: name,
            page: reply.page,
          },
        },
      };
      result = {
        png: reply.png,
        key,
        cacheHit: false,
        receipt,
        capturedUtc: reply.capturedUtc,
        pngSha256: reply.pngSha256,
      };
      const retained: number = [...this.frames.entries()].reduce(
        (sum: number, entry: [string, { frame: Frame }]): number =>
          sum + (entry[0] === name ? 0 : entry[1].frame.png.length),
        result.png.length,
      );
      if (retained > 268435456)
        throw new Error("Mannequin PNG cache exceeds its byte budget");
      if (!this.frames.has(name) && this.frames.size >= 6)
        this.frames.delete(this.frames.keys().next().value!);
      this.frames.set(name, { nonce: nonce ?? null, frame: result });
    }
    if (
      (await HumanImageSourceIdentity.source(this.root)) !== source ||
      (await HumanImageSourceIdentity.host(this.root)) !== host
    ) {
      this.clear();
      throw new Error("Mannequin source/host changed during capture");
    }
    return result;
  }
}
