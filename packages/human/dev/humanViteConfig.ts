import { resolve } from "node:path";
import { type UserConfig, defineConfig } from "vite";

import { createHumanCompilerPlugin } from "./createHumanCompilerPlugin";
import { createHumanTransformPlugin } from "./createHumanTransformPlugin";
import { HumanImageSourceIdentity } from "./src/human-images/HumanImageSourceIdentity";
import { createHumanImagePlugin } from "./src/human-images/createHumanImagePlugin";

process.env.AUTOMOVIE_HUMAN_IMAGE_REGISTRY ??= resolve(
  __dirname,
  "human-images.json",
);

/** Hash of the conservative source inventory a generation or capture reflects. */
const source: () => Promise<string> = (): Promise<string> =>
  HumanImageSourceIdentity.compiler(resolve(__dirname, "../../.."));

/** The advisory checker reports compile state; it never gates generation. */
const compiler: ReturnType<typeof createHumanCompilerPlugin> =
  createHumanCompilerPlugin(__dirname, source);

/** Unpublished Human inspection app; renderer and captures share one page. */
export const humanViteConfig: UserConfig = defineConfig({
  root: __dirname,
  optimizeDeps: { noDiscovery: true, include: ["three"] },
  plugins: [
    compiler.plugin,
    createHumanTransformPlugin(__dirname),
    createHumanImagePlugin(resolve(__dirname, "../../.."), source),
  ],
  server: {
    host: "127.0.0.1",
    port: 5196,
    strictPort: true,
    fs: { allow: [resolve(__dirname, "../../..")] },
    watch: { ignored: ["**/.tmp/**", "**/.shots/**", "**/.ttsc/**"] },
  },
  build: {
    target: "esnext",
    outDir: "dist",
    rollupOptions: {
      input: {
        human: resolve(__dirname, "human.html"),
        components: resolve(__dirname, "human-components.html"),
        mannequin: resolve(__dirname, "human-stickman.html"),
      },
    },
  },
});
