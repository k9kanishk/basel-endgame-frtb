# basel-endgame-frtb

Next.js demo app for Basel III Endgame — FRTB-SA (SBM) with audit trail, CSV Greeks override, and hot-spot desks.

## Quickstart

```bash
pnpm i
pnpm dev
```

Then open http://localhost:3000.

### CSV Greeks override
Upload a CSV with columns: `instrument_id,risk_class,bucket,type,value` where `type` is one of `dv01,vega,curvature`. Values will override the approximated greeks for matching instrument IDs.

## Notes
- Minimal UI components are provided in `components/ui/stubs.tsx` (no shadcn setup required).
- Risk classes supported: Rates (term buckets), FX (single bucket), Equity (Large/Small).
- Output floor applied at 72.5% of pre-Endgame by default (configurable per risk class).
