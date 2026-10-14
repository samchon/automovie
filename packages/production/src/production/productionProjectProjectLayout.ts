import { IAutoMovieProductionManifest } from "@automovie/interface";

/**
 * Fixed project ownership roots and tracked input addresses used by opening, compilation and publication.
 *
 * The project synthesizes its layout from this shared record instead of reading a per-project manifest; descriptive projectId comes from package metadata or the directory basename. Readonly annotations restrict TypeScript assignments without freezing the record or its nested arrays at runtime.
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
