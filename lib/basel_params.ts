export type Bucket = {
  id: string;
  minY?: number;
  maxY?: number | null;
  rw_delta: number;
  rw_vega: number;
  rw_curv: number;
};

export type RiskClass = "Rates" | "FX" | "Equity";

export type RiskClassConfig = {
  name: RiskClass;
  buckets: Bucket[];
  rho_intra: number[][];
  rho_vega: number[][];
  rho_curv: number[][];
  post_multipliers: { delta: number; vega: number; curv: number };
  apply_output_floor: boolean;
  output_floor_pct: number;
};

export const RATES_SA: RiskClassConfig = {
  name: "Rates",
  buckets: [
    { id: "≤6M",   minY: 0,   maxY: 0.5, rw_delta: 0.007, rw_vega: 0.20, rw_curv: 0.06 },
    { id: "6M–1Y", minY: 0.5, maxY: 1,   rw_delta: 0.007, rw_vega: 0.20, rw_curv: 0.06 },
    { id: "1–3Y",  minY: 1,   maxY: 3,   rw_delta: 0.005, rw_vega: 0.18, rw_curv: 0.05 },
    { id: "3–5Y",  minY: 3,   maxY: 5,   rw_delta: 0.005, rw_vega: 0.18, rw_curv: 0.05 },
    { id: "5–10Y", minY: 5,   maxY: 10,  rw_delta: 0.005, rw_vega: 0.18, rw_curv: 0.05 },
    { id: "10Y+",  minY: 10,  maxY: null,rw_delta: 0.005, rw_vega: 0.18, rw_curv: 0.05 },
  ],
  rho_intra: [
    [1.00,0.99,0.70,0.50,0.30,0.20],
    [0.99,1.00,0.85,0.60,0.40,0.25],
    [0.70,0.85,1.00,0.85,0.60,0.40],
    [0.50,0.60,0.85,1.00,0.85,0.60],
    [0.30,0.40,0.60,0.85,1.00,0.80],
    [0.20,0.25,0.40,0.60,0.80,1.00],
  ],
  rho_vega: [
    [1.00,0.95,0.70,0.50,0.35,0.25],
    [0.95,1.00,0.80,0.60,0.40,0.30],
    [0.70,0.80,1.00,0.80,0.60,0.40],
    [0.50,0.60,0.80,1.00,0.80,0.60],
    [0.35,0.40,0.60,0.80,1.00,0.80],
    [0.25,0.30,0.40,0.60,0.80,1.00],
  ],
  rho_curv: [
    [1.00,0.95,0.70,0.50,0.35,0.25],
    [0.95,1.00,0.80,0.60,0.40,0.30],
    [0.70,0.80,1.00,0.80,0.60,0.40],
    [0.50,0.60,0.80,1.00,0.80,0.60],
    [0.35,0.40,0.60,0.80,1.00,0.80],
    [0.25,0.30,0.40,0.60,0.80,1.00],
  ],
  post_multipliers: { delta: 1.25, vega: 1.30, curv: 1.25 },
  apply_output_floor: true,
  output_floor_pct: 0.725,
};

export const FX_SA: RiskClassConfig = {
  name: "FX",
  buckets: [{ id: "All FX", rw_delta: 0.045, rw_vega: 0.32, rw_curv: 0.10 }],
  rho_intra: [[1]],
  rho_vega:  [[1]],
  rho_curv:  [[1]],
  post_multipliers: { delta: 1.20, vega: 1.25, curv: 1.20 },
  apply_output_floor: true,
  output_floor_pct: 0.725,
};

export const EQ_SA: RiskClassConfig = {
  name: "Equity",
  buckets: [
    { id: "LargeCap", rw_delta: 0.035, rw_vega: 0.32, rw_curv: 0.10 },
    { id: "SmallCap", rw_delta: 0.055, rw_vega: 0.55, rw_curv: 0.15 },
  ],
  rho_intra: [[1.0,0.8],[0.8,1.0]],
  rho_vega:  [[1.0,0.8],[0.8,1.0]],
  rho_curv:  [[1.0,0.8],[0.8,1.0]],
  post_multipliers: { delta: 1.25, vega: 1.30, curv: 1.25 },
  apply_output_floor: true,
  output_floor_pct: 0.725,
};

export function mapAssetClassToRisk(assetClass: string, maturityY: number): { cfg: RiskClassConfig; bucketIndex: number } {
  if (assetClass.includes('FX')) return { cfg: FX_SA, bucketIndex: 0 };
  if (assetClass.includes('Equity')) {
    return { cfg: EQ_SA, bucketIndex: assetClass.includes('Small') ? 1 : 0 };
  }
  const cfg = RATES_SA;
  const idx = cfg.buckets.findIndex(b => (b.minY ?? 0) <= maturityY && (b.maxY == null || maturityY < b.maxY));
  return { cfg, bucketIndex: Math.max(0, idx) };
}
