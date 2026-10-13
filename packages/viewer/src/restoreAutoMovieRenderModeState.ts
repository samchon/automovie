/**
 * Attempt independent pass-state restorations before reporting any failure.
 * A primary setup failure stays first, and nested restoration aggregates are
 * flattened so no failed owned resource disappears behind another error.
 */
export function restoreAutoMovieRenderModeState(operations:readonly (()=>void)[],primary:{error:unknown}):never;
export function restoreAutoMovieRenderModeState(operations:readonly (()=>void)[]):void;
export function restoreAutoMovieRenderModeState(operations:readonly (()=>void)[],primary?:{error:unknown}):void{
  const failures:unknown[]=primary===undefined?[]:[primary.error];
  for(const operation of operations){
    try{operation();}catch(error){
      if(error instanceof AggregateError && error.errors.length!==0)failures.push(...error.errors);
      else failures.push(error);
    }
  }
  if(failures.length===1)throw failures[0];
  if(failures.length>1)throw new AggregateError(failures,"Render-mode setup or restoration failed.");
}
