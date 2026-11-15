// Bound upstream waiting time without caching authenticated responses.
export const privateFetch:typeof fetch=(input,init)=>fetch(input,{
  ...init,cache:'no-store',signal:init?.signal
    ?AbortSignal.any([init.signal,AbortSignal.timeout(20000)])
    :AbortSignal.timeout(20000)
});
