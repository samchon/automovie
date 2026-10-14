// Host adapter for the textured manor. It decodes the seven albedo textures
// once, derives the shared prototype inventory in the page, and hands both to
// the visual scene. The formal asset string stays in each material binding;
// only its URL is resolved here, so the module runs from any bundler root.
import { TextureLoader } from "three";
import { AutoMovieTextureCache } from "@automovie/viewer";
import { manorTextureBindings } from "../materials/manor";
import { createManorScene } from "../models/manor";
import { deriveManorInstanceInventory } from "./manor-inventory";
import { createManorInstanceConsumer } from "./manor-viewer";

interface TexturedManorOptions {
  report?: ((phase: string) => void) | ((phase: string) => Promise<void>);
  shadows?: boolean;
}

const urls: Record<string, string> = {
 'assets/textures/manor/oak-albedo-v1.png':new URL('../../public/assets/textures/manor/oak-albedo-v1.png',import.meta.url).href,
 'assets/textures/manor/limestone-albedo-v1.png':new URL('../../public/assets/textures/manor/limestone-albedo-v1.png',import.meta.url).href,
 'assets/textures/manor/lime-plaster-albedo-v1.png':new URL('../../public/assets/textures/manor/lime-plaster-albedo-v1.png',import.meta.url).href,
 'assets/textures/manor/terracotta-albedo-v1.png':new URL('../../public/assets/textures/manor/terracotta-albedo-v1.png',import.meta.url).href,
 'assets/textures/manor/linen-albedo-v1.png':new URL('../../public/assets/textures/manor/linen-albedo-v1.png',import.meta.url).href,
 'assets/textures/manor/apple-bark-albedo-v1.png':new URL('../../public/assets/textures/manor/apple-bark-albedo-v1.png',import.meta.url).href,
 'assets/textures/manor/garden-soil-albedo-v1.png':new URL('../../public/assets/textures/manor/garden-soil-albedo-v1.png',import.meta.url).href,
};

// `report` names each phase before it starts and may return a promise so a host
// can paint the message; the geometry work between two reports is synchronous.
/**
 * Loads the seven authored albedo assets, derives the shared instance inventory, and builds the visual manor while reporting each phase. The returned texture disposer releases this adapter's cache. Construction rollback preserves its original cause, or reports that cause followed by a cache-cleanup failure in AggregateError.errors; cache disposal owns once-only attempts and its retained failure receipt.
 *
 * @param {{report?: (phase: string) => void | Promise<void>, shadows?: boolean}} [options]
 */
export async function createTexturedManorScene({report=(): undefined =>undefined,...options}: TexturedManorOptions = {}): Promise<import("../models/IMedievalManorScene").IMedievalManorScene & { followLighting: () => void; instanceConsumer: ReturnType<typeof createManorInstanceConsumer>; instanceState: ReturnType<ReturnType<typeof createManorInstanceConsumer>["stats"]>; textureState: { ready: boolean; decoded: number; assets: string[] }; disposeTextures: () => Promise<void> }> {
 await report('Decoding textures');
 const loader: TextureLoader=new TextureLoader(),cache: AutoMovieTextureCache=new AutoMovieTextureCache((asset: string): Promise<import("three").Texture<HTMLImageElement, import("three").TextureEventMap>> =>{
  const url: string=urls[asset];if(!url)throw new Error('Unresolved manor texture: '+asset);return loader.loadAsync(url);
 });
 try{
  await cache.prime(manorTextureBindings());
  await report('Deriving shared prototypes');
  const inventory: ReturnType<typeof deriveManorInstanceInventory>=deriveManorInstanceInventory(createManorScene({geometryOnly:true}).entries);
  const consumer: ReturnType<typeof createManorInstanceConsumer>=createManorInstanceConsumer(inventory,cache.resolve);
  await report('Building the manor');
  // This adapter owns a visual scene, never the geometry-only measurement branch.
  const manor: import("../models/IMedievalManorScene").IMedievalManorScene=createManorScene({...options,geometryOnly:false,resolveTexture:cache.resolve,instanceConsumer:consumer});
  if(manor.scene===undefined)throw new Error('Textured manor preview requires the visual scene capability; geometry-only output cannot be displayed.');
  // `update` keeps the preview contract: lighting follow plus instance
  // resolution. Both halves stay reachable for a host that draws the sets its
  // own way and only needs the light to follow the eye.
  const followLighting: () => void=manor.update;manor.update=(): void =>{followLighting();consumer.update(manor.camera);};
  return {...manor,followLighting,instanceConsumer:consumer,instanceState:consumer.stats(),textureState:{ready:true,decoded:cache.size,assets:Object.keys(urls)},disposeTextures:(): Promise<void> =>cache.dispose()};
 }catch(error){
  try{await cache.dispose();}
  catch(cleanupError){throw new AggregateError([error,cleanupError],'Manor construction and texture cleanup failed.');}
  throw error;
 }
}
