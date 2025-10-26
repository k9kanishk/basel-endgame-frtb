import { RiskClassConfig } from './basel_params'
 
export type SBMCharges = {
  S_delta: number[];
  S_vega: number[];
  S_curv: number[];
  K_delta: number;
  K_vega: number;
  K_curv: number;
  K_total: number;
}

export function quadForm(S: number[], weights: number[], rho: number[][]): number {
  const n = S.length;
  let q = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const wij = weights[i] * rho[i][j] * weights[j];
      q += S[i] * wij * S[j];
    }
  }
  return Math.sqrt(Math.max(q, 0));
}

export function computeSBM(
  cfg: RiskClassConfig,
  bucketIndex: number,
  greeks: { dv01: number; vega: number; curvature: number },
  usePost = false
): SBMCharges {
  const n = cfg.buckets.length;
  const S_delta = Array(n).fill(0);
  const S_vega = Array(n).fill(0);
  const S_curv = Array(n).fill(0);

  S_delta[bucketIndex] = greeks.dv01;
  S_vega[bucketIndex]  = greeks.vega;
  S_curv[bucketIndex]  = greeks.curvature;

  const w_delta = cfg.buckets.map(b => b.rw_delta * (usePost ? cfg.post_multipliers.delta : 1));
  const w_vega  = cfg.buckets.map(b => b.rw_vega  * (usePost ? cfg.post_multipliers.vega  : 1));
  const w_curv  = cfg.buckets.map(b => b.rw_curv  * (usePost ? cfg.post_multipliers.curv  : 1));

  const K_delta = quadForm(S_delta, w_delta, cfg.rho_intra);
  const K_vega  = quadForm(S_vega,  w_vega,  cfg.rho_vega);
  const K_curv  = quadForm(S_curv,  w_curv,  cfg.rho_curv);
  const K_total = Math.sqrt(K_delta**2 + K_vega**2 + K_curv**2);
  return { S_delta, S_vega, S_curv, K_delta, K_vega, K_curv, K_total };
}

export const K_to_RWA = (K:number)=> 12.5 * K;
export const applyOutputFloor = (preRWA:number, postRWA:number, cfg: RiskClassConfig)=> cfg.apply_output_floor? Math.max(postRWA, cfg.output_floor_pct * preRWA) : postRWA;

export function approxRatesGreeks(notional: number, maturityY: number){
  const dv01 = (notional * 1e-4) * Math.min(maturityY, 30) / 100;
  const vega = notional * 1e-6 * Math.sqrt(Math.max(maturityY, 0.25));
  const curvature = dv01 * 0.4;
  return { dv01, vega, curvature };
}

export function approxFXGreeks(notional: number){
  const dv01 = notional * 1e-6;
  const vega = notional * 1e-6;
  const curvature = dv01 * 0.3;
  return { dv01, vega, curvature };
}

export function approxEqGreeks(notional: number){
  const dv01 = notional * 0.0003;
  const vega = notional * 0.0002;
  const curvature = dv01 * 0.5;
  return { dv01, vega, curvature };
}
