import type { IAutoMovieRenderBundleManifest, IAutoMovieRepaintGeneratorProvenance, IAutoMovieRepaintReceipt } from "@automovie/interface";
import { productionRepaintActiveReceiptPath, productionRepaintOutputPath, productionRepaintReceiptPath, productionRepaintRequestFingerprint, productionRepaintStructuralControls, productionSourceRenderFingerprint } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

/** Run the original source/control/request/address assertions and receipt-v3 static/JSON checks after generator/request variants. The original partial manifest is a metadata-composition input, not a verified source bundle, and no provider or media admission is performed. */
export function assertRepaintGeneratorSourceIdentities(
  outputRequest: Parameters<typeof productionRepaintOutputPath>[0],
  provenance: IAutoMovieRepaintGeneratorProvenance,
  originalPath: string,
  digest: (value: string) => string,
): void {
  const sourceManifest: IAutoMovieRenderBundleManifest = {
    frames: [
      {
        index: 0,
        path: "beauty-0.png",
        pass: "beauty",
        digest: digest("beauty-0"),
      },
      {
        index: 0,
        path: "depth-0.png",
        pass: "depth",
        digest: digest("depth-0"),
      },
      {
        index: 1,
        path: "depth-1.png",
        pass: "depth",
        digest: digest("depth-1"),
      },
      {
        index: 0,
        path: "mask-0.png",
        pass: "mask",
        digest: digest("mask-0"),
      },
    ],
    semanticMasks: [
      {
        frame: 0,
        pass: "mask",
        coverage: { unresolved: [], unaddressed: 0 },
      },
    ],
  } as unknown as IAutoMovieRenderBundleManifest;
  const sourceFrames: Array<{ path: string; digest: string }> = sourceManifest.frames.map(({ path, digest }: IAutoMovieRenderBundleManifest["frames"][number]): { path: string; digest: string } => ({
    path,
    digest,
  }));
  const sourceFingerprint: string = productionSourceRenderFingerprint({
    manifest: sourceManifest,
    frames: sourceFrames,
  });
  const requestFingerprint: string = productionRepaintRequestFingerprint({
    ...outputRequest,
    compileFingerprint: digest("compile"),
  });
  const receiptPath: string = productionRepaintReceiptPath(originalPath);
  const activePath: string = productionRepaintActiveReceiptPath("opening");
  TestValidator.equals(
    "source, structural, request, receipt, and active identities are deterministic",
    {
      sourceStable:
        productionSourceRenderFingerprint({
          manifest: sourceManifest,
          frames: sourceFrames,
        }) === sourceFingerprint,
      sourceChanges:
        productionSourceRenderFingerprint({
          manifest: sourceManifest,
          frames: [
            ...sourceFrames.slice(0, -1),
            { ...sourceFrames.at(-1)!, digest: digest("mask-revised") },
          ],
        }) !== sourceFingerprint,
      controls: productionRepaintStructuralControls(sourceManifest),
      incompleteControls: productionRepaintStructuralControls({
        ...sourceManifest,
        semanticMasks: sourceManifest.semanticMasks.map((semantic: IAutoMovieRenderBundleManifest["semanticMasks"][number]): IAutoMovieRenderBundleManifest["semanticMasks"][number] => ({
          ...semantic,
          coverage: { unresolved: ["node:missing"], unaddressed: 0 },
        })),
      }),
      requestStable:
        productionRepaintRequestFingerprint({
          ...outputRequest,
          compileFingerprint: digest("compile"),
        }) === requestFingerprint,
      requestChanges:
        productionRepaintRequestFingerprint({
          ...outputRequest,
          compileFingerprint: digest("compile-revised"),
        }) !== requestFingerprint,
      receiptStable: productionRepaintReceiptPath(originalPath) === receiptPath,
      receiptChanges:
        productionRepaintReceiptPath(`${originalPath}.other`) !== receiptPath,
      activeStable:
        productionRepaintActiveReceiptPath("opening") === activePath,
      activeChanges:
        productionRepaintActiveReceiptPath("closing") !== activePath,
    },
    {
      sourceStable: true,
      sourceChanges: true,
      controls: [
        {
          pass: "depth",
          frameDigests: [digest("depth-0"), digest("depth-1")],
        },
        { pass: "mask", frameDigests: [digest("mask-0")] },
      ],
      incompleteControls: [
        {
          pass: "depth",
          frameDigests: [digest("depth-0"), digest("depth-1")],
        },
      ],
      requestStable: true,
      requestChanges: true,
      receiptStable: true,
      receiptChanges: true,
      activeStable: true,
      activeChanges: true,
    },
  );

  const receipt: IAutoMovieRepaintReceipt = {
    version: 3,
    productionId: "identity-test",
    shot: "opening",
    compileFingerprint: digest("compile"),
    sourceRenderFingerprint: digest("source"),
    attemptId: "attempt-1",
    sourceBundle: "renders/opening/source",
    controls: [{ pass: "depth", frameDigests: [digest("depth")] }],
    references: [
      {
        role: "style",
        path: "assets/style.png",
        digest: digest("style"),
      },
    ],
    adapterIdentity: outputRequest.adapterIdentity,
    generatorProvenance: provenance,
    structuralAuthority: "deterministic-source-only",
    parameters: outputRequest.parameters,
    output: {
      path: originalPath,
      digest: digest("output"),
      bytes: 1,
      probe: {
        kind: "video",
        container: "mp4",
        codec: "h264",
        width: 16,
        height: 16,
        runtimeSeconds: 1,
        frameCount: 24,
        fps: 24,
        frameRate: { numerator: 24, denominator: 1 },
        brands: { major: "isom", compatible: ["isom"] },
        coded: { width: 16, height: 16 },
        trackDisplay: { width16_16: 1_048_576, height16_16: 1_048_576 },
        trackMatrix: [65_536, 0, 0, 0, 65_536, 0, 0, 0, 1_073_741_824],
        pixelAspect: { kind: "implicit-square" },
        presentation: {
          movieTimescale: 24,
          mediaTimescale: 24,
          movieDuration: 24,
          mediaDuration: 24,
          edits: [],
        },
        samples: {
          count: 24,
          duration: 1,
          timescale: 24,
          firstDts: 0,
          lastDts: 23,
          firstCts: 0,
          lastCts: 23,
        },
        color: {
          container: {
            kind: "nclx",
            primaries: 1,
            transfer: 13,
            matrix: 1,
            fullRange: true,
          },
          resolved: { kind: "srgb", source: "container" },
        },
      },
    },
  };
  const { generatorProvenance: omittedProvenance, ...withoutProvenance }: IAutoMovieRepaintReceipt =
    receipt;
  const { structuralAuthority: omittedAuthority, ...withoutAuthority }: IAutoMovieRepaintReceipt =
    receipt;
  void omittedProvenance;
  void omittedAuthority;
  // @ts-expect-error Receipt v3 requires reviewed generator provenance.
  const missingProvenance: IAutoMovieRepaintReceipt = withoutProvenance;
  // @ts-expect-error Receipt v3 requires the derived-output authority boundary.
  const missingAuthority: IAutoMovieRepaintReceipt = withoutAuthority;
  const staleVersion: IAutoMovieRepaintReceipt = {
    ...receipt,
    // @ts-expect-error Adding generator adoption changed the public schema.
    version: 2,
  };
  void missingProvenance;
  void missingAuthority;
  void staleVersion;
  TestValidator.equals(
    "repaint receipt v3 preserves adoption and authority through JSON",
    JSON.parse(JSON.stringify(receipt)) as IAutoMovieRepaintReceipt,
    receipt,
  );
}
