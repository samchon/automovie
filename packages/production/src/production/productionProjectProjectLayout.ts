import { IAutoMovieProductionManifest } from "@automovie/interface";

/**
 * The project ownership layout, which is the harness's own fixed shape rather
 * than a per-project declaration.
 *
 * This was a tracked `automovie/manifest.json` that every project carried a
 * copy of, and the copy could only ever restate what this constant already
 * says: the class synthesized exactly these values whenever the file was
 * missing. A per-project file that no project may vary is a second source of
 * one truth, so the constant is the only source now and `projectId` is derived
 * from the project directory.
 */
export const productionProjectProjectLayout: { readonly formatVersion: 2; readonly sourceRoots: ["src"]; readonly contentRoots: ["viewer", "scripts", "public", "assets"]; readonly contentFiles: ["vite.config.ts", "package.json", "package-lock.json"]; readonly generatedRoot: "generated"; readonly renderRoot: "renders"; readonly assetManifest: "automovie/assets.json"; readonly derivedArtifactManifest: "automovie/derived-artifacts.json"; } = {
    formatVersion: 2,
    sourceRoots: ["src"],
    contentRoots: ["viewer", "scripts", "public", "assets"],
    contentFiles: ["vite.config.ts", "package.json", "package-lock.json"],
    generatedRoot: "generated",
    renderRoot: "renders",
    assetManifest: "automovie/assets.json",
    derivedArtifactManifest: "automovie/derived-artifacts.json",
} as const satisfies Omit<IAutoMovieProductionManifest, "projectId">;
