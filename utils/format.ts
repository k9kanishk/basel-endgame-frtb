export const fmt$ = (x: number) => x>=1000000?`$${(x/1000000).toFixed(2)}m`: x>=1000?`$${(x/1000).toFixed(1)}k`:`$${x.toFixed(0)}`;
export const fmtPct = (x: number) => `${x.toFixed(1)}%`;
