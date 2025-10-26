'use client'
import { useMemo, useState } from 'react'

import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Info, Target, X } from 'lucide-react'
import Papa from 'papaparse'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Select, Option, Table, Thead, Tbody, Tr, Th, Td, Badge, Alert, AlertDescription, Dialog, DialogHeader, DialogTitle } from '../components/ui/stubs'
import { fmt$, fmtPct } from '../utils/format'
import { RATES_SA, FX_SA, EQ_SA, mapAssetClassToRisk } from '../lib/basel_params'
import { computeSBM, K_to_RWA, applyOutputFloor, approxRatesGreeks, approxFXGreeks, approxEqGreeks } from '../lib/frtb'

// === INTERFACES ===
interface Instrument {
  id: string
  name: string
  notional: number
  maturity: number
  tradeType: string
  assetClass: string
  delta: number
  vega: number
  curvature: number
  desk: string
}

interface AuditTrail {
  riskClass: string
  bucketId: string
  S_delta: number[]
  S_vega: number[]
  S_curv: number[]
  K_delta: number
  K_vega: number
  K_curv: number
  K_total: number
}

interface RWACalculation {
  instrumentId: string
  preEndgameRWA: number
  postEndgameRWA: number
  deltaRWA: number
  percentageChange: number
  desk: string
  audit: AuditTrail
}

interface DeskSummary {
  desk: string
  preEndgameTotal: number
  postEndgameTotal: number
  deltaTotal: number
  percentageChange: number
}

// CSV override: instrument_id,risk_class,bucket,type,value
// Example types: dv01, vega, curvature
 type CSVRow = { instrument_id: string; risk_class?: string; bucket?: string; type: string; value: string };
 type GreekOverride = { dv01?: number; vega?: number; curvature?: number; riskClass?: string; bucket?: string };

const ASSET_CLASSES = ['General Interest Rate Risk','FX Risk','Equity Risk - Large Cap','Equity Risk - Small Cap']
const TRADE_TYPES = ['Swap', 'Option', 'Future', 'Forward', 'Bond']
const DESKS = ['Rates', 'Credit', 'Equities', 'Commodities', 'FX']

export default function BaselEndgameRiskAnalysis(){
  const [portfolio, setPortfolio] = useState<Instrument[]>([])
  const [rwaCalculations, setRwaCalculations] = useState<RWACalculation[]>([])
  const [deskSummaries, setDeskSummaries] = useState<DeskSummary[]>([])
  const [hotSpotDesks, setHotSpotDesks] = useState<DeskSummary[]>([])
  const [viewMode, setViewMode] = useState<'input'|'analysis'|'hotspots'>('input')
  const [auditOpen, setAuditOpen] = useState(false)
  const [selected, setSelected] = useState<RWACalculation | null>(null)
  const [csvOverrides, setCsvOverrides] = useState<Record<string, GreekOverride>>({})

  const [newInstrument, setNewInstrument] = useState({
    name: '', notional: 1000000, maturity: 5, tradeType: 'Swap', assetClass: 'General Interest Rate Risk', desk: 'Rates'
  })

  function displaySensitivities(notional:number, maturity:number, assetClass:string){
    if(assetClass.includes('FX')) return approxFXGreeks(notional)
    if(assetClass.includes('Equity')) return approxEqGreeks(notional)
    return approxRatesGreeks(notional, maturity)
  }

  function calculateRWA_SBM(instr: Instrument){
    const mapping = mapAssetClassToRisk(instr.assetClass, instr.maturity)
    const cfg = mapping.cfg
    const bucketIdx = mapping.bucketIndex

    // CSV override if provided
    const ov = csvOverrides[instr.id]
    const greeks = ov? { dv01: ov.dv01 ?? instr.delta, vega: ov.vega ?? instr.vega, curvature: ov.curvature ?? instr.curvature } : { dv01: instr.delta, vega: instr.vega, curvature: instr.curvature }

    const pre = computeSBM(cfg, bucketIdx, greeks, false)
    const post = computeSBM(cfg, bucketIdx, greeks, true)

    const preRWA = K_to_RWA(pre.K_total)
    const postRWA_raw = K_to_RWA(post.K_total)
    const postRWA = applyOutputFloor(preRWA, postRWA_raw, cfg)

    const bucketId = cfg.buckets[bucketIdx].id

    const audit: AuditTrail = {
      riskClass: cfg.name, bucketId, S_delta: pre.S_delta, S_vega: pre.S_vega, S_curv: pre.S_curv, K_delta: pre.K_delta, K_vega: pre.K_vega, K_curv: pre.K_curv, K_total: pre.K_total
    }

    return { preRWA, postRWA, audit }
  }

  const addInstrument = ()=>{
    const s = displaySensitivities(newInstrument.notional, newInstrument.maturity, newInstrument.assetClass)
    const instrument: Instrument = { id: Date.now().toString(), ...newInstrument, delta: s.dv01, vega: s.vega, curvature: s.curvature }
    setPortfolio(prev=>[...prev, instrument])
  }

  const runAnalysis = ()=>{
    const calcs: RWACalculation[] = portfolio.map(instr=>{
      const { preRWA, postRWA, audit } = calculateRWA_SBM(instr)
      const delta = postRWA - preRWA
      return { instrumentId: instr.id, preEndgameRWA: preRWA, postEndgameRWA: postRWA, deltaRWA: delta, percentageChange: preRWA===0?0:(delta/preRWA)*100, desk: instr.desk, audit }
    })
    setRwaCalculations(calcs)

    const deskMap = new Map<string, DeskSummary>()
    calcs.forEach(c=>{
      const e = deskMap.get(c.desk) || { desk: c.desk, preEndgameTotal: 0, postEndgameTotal: 0, deltaTotal: 0, percentageChange: 0 }
      e.preEndgameTotal += c.preEndgameRWA
      e.postEndgameTotal += c.postEndgameRWA
      e.deltaTotal += c.deltaRWA
      deskMap.set(c.desk, e)
    })
    const summaries = Array.from(deskMap.values()).map(s=> ({ ...s, percentageChange: s.preEndgameTotal===0?0:(s.deltaTotal/s.preEndgameTotal)*100 }))
    setDeskSummaries(summaries)
    const sorted = [...summaries].sort((a,b)=> b.percentageChange - a.percentageChange)
    setHotSpotDesks(sorted.slice(0,5))
    setViewMode('analysis')
  }

  const totals = useMemo(()=>{
    const pre = deskSummaries.reduce((a,b)=>a+b.preEndgameTotal,0)
    const post= deskSummaries.reduce((a,b)=>a+b.postEndgameTotal,0)
    const d = post-pre
    return { pre, post, d, pct: pre===0?0:(d/pre)*100 }
  },[deskSummaries])

  function openAudit(calc: RWACalculation){ setSelected(calc); setAuditOpen(true) }

  function onCSVFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if(!f) return;
    Papa.parse<CSVRow>(f, { header: true, skipEmptyLines: true, complete: res => {
      const map: Record<string, GreekOverride> = {}
      for(const row of res.data){
        const id = row.instrument_id?.trim(); if(!id) continue;
        const t = (row.type||'').toLowerCase();
        const val = Number(row.value);
        map[id] = map[id] || {}
        if(!Number.isNaN(val)){
          if(t==='dv01') map[id].dv01 = val;
          if(t==='vega') map[id].vega = val;
          if(t==='curvature' || t==='curv') map[id].curvature = val;
        }
        if(row.risk_class) map[id].riskClass = row.risk_class
        if(row.bucket) map[id].bucket = row.bucket
      }
      setCsvOverrides(map)
    }})
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Basel III Endgame Risk Analysis (FRTB-SA)
            </CardTitle>
            <p className="text-gray-600">FRTB-SA SBM engine with multi-risk-class, audit trail, CSV Greek overrides</p>
          </CardHeader>
        </Card>

        <div className="flex gap-2 mb-6">
          <Button variant={viewMode==='input'?'default':'outline'} onClick={()=>setViewMode('input')}>Portfolio Input</Button>
          <Button variant={viewMode==='analysis'?'default':'outline'} onClick={()=>setViewMode('analysis')} disabled={portfolio.length===0}>Risk Analysis</Button>
          <Button variant={viewMode==='hotspots'?'default':'outline'} onClick={()=>setViewMode('hotspots')} disabled={deskSummaries.length===0}>Hot-Spot Desks</Button>
        </div>

        {viewMode==='input' && (
          <div className="grid gap-6">
            <Card>
              <CardHeader><CardTitle>Add New Instrument</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Instrument Name</Label>
                    <Input value={newInstrument.name} onChange={e=>setNewInstrument({...newInstrument, name: e.target.value})} placeholder="e.g., USD 5Y Swap"/>
                  </div>
                  <div>
                    <Label>Notional ($)</Label>
                    <Input type="number" value={newInstrument.notional} onChange={e=>setNewInstrument({...newInstrument, notional: Number(e.target.value)})}/>
                  </div>
                  <div>
                    <Label>Maturity (Years)</Label>
                    <Input type="number" value={newInstrument.maturity} onChange={e=>setNewInstrument({...newInstrument, maturity: Number(e.target.value)})}/>
                  </div>
                  <div>
                    <Label>Trade Type</Label>
                    <Select value={newInstrument.tradeType} onChange={v=>setNewInstrument({...newInstrument, tradeType: v})}>
                      {TRADE_TYPES.map(t=> <Option key={t} value={t}>{t}</Option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Asset Class</Label>
                    <Select value={newInstrument.assetClass} onChange={v=>setNewInstrument({...newInstrument, assetClass: v})}>
                      {ASSET_CLASSES.map(c=> <Option key={c} value={c}>{c}</Option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Trading Desk</Label>
                    <Select value={newInstrument.desk} onChange={v=>setNewInstrument({...newInstrument, desk: v})}>
                      {DESKS.map(d=> <Option key={d} value={d}>{d}</Option>)}
                    </Select>
                  </div>
                </div>
                <Button onClick={addInstrument} className="mt-4">Add Instrument</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>CSV Greeks Override</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">Upload CSV with columns: <code>instrument_id,risk_class,bucket,type,value</code>. Types are one of dv01, vega, curvature.</p>
                <Input type="file" accept=".csv" onChange={onCSVFile}/>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Current Portfolio ({portfolio.length} instruments)</CardTitle></CardHeader>
              <CardContent>
                {portfolio.length===0? (<p className="text-gray-500">No instruments added yet</p>): (
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Name</Th><Th>Notional</Th><Th>Trade</Th><Th>Asset Class</Th><Th>Desk</Th><Th>Delta</Th><Th>Vega</Th><Th>Curvature</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {portfolio.map(p=> (
                        <Tr key={p.id}>
                          <Td>{p.name}</Td>
                          <Td>{fmt$(p.notional)}</Td>
                          <Td>{p.tradeType}</Td>
                          <Td>{p.assetClass}</Td>
                          <Td>{p.desk}</Td>
                          <Td>{p.delta.toFixed(2)}</Td>
                          <Td>{p.vega.toFixed(2)}</Td>
                          <Td>{p.curvature.toFixed(2)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
                {portfolio.length>0 && (<Button onClick={runAnalysis} className="mt-4">Run Risk Analysis</Button>)}
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode==='analysis' && (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardHeader><CardTitle className="text-lg">Total Pre-Endgame RWA ($)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{fmt$(totals.pre)}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-lg">Total Post-Endgame RWA ($)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{fmt$(totals.post)}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-lg">Overall Change (%)</CardTitle></CardHeader><CardContent><p className={'text-2xl font-bold flex items-center gap-2 '+(totals.pct>0?'text-red-600':'text-green-600')}>{totals.pct>0? <TrendingUp/>:<TrendingDown/>}{fmtPct(totals.pct)}</p></CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Desk-Level Analysis ($)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <Thead><Tr><Th>Desk</Th><Th>Pre-Endgame RWA</Th><Th>Post-Endgame RWA</Th><Th>Change ($)</Th><Th>Change (%)</Th></Tr></Thead>
                  <Tbody>
                    {deskSummaries.map(s=> (
                      <Tr key={s.desk}>
                        <Td>{s.desk}</Td>
                        <Td>{fmt$(s.preEndgameTotal)}</Td>
                        <Td>{fmt$(s.postEndgameTotal)}</Td>
                        <Td>{fmt$(s.deltaTotal)}</Td>
                        <Td><Badge variant={s.percentageChange>50?'destructive':'default'}>{fmtPct(s.percentageChange)}</Badge></Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Instrument-Level RWA Calculations ($)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <Thead><Tr><Th>Instrument ID</Th><Th>Desk</Th><Th>Pre-Endgame</Th><Th>Post-Endgame</Th><Th>Change ($)</Th><Th>Change (%)</Th><Th>Audit</Th></Tr></Thead>
                  <Tbody>
                    {rwaCalculations.map(c=> (
                      <Tr key={c.instrumentId}>
                        <Td>{c.instrumentId}</Td>
                        <Td>{c.desk}</Td>
                        <Td>{fmt$(c.preEndgameRWA)}</Td>
                        <Td>{fmt$(c.postEndgameRWA)}</Td>
                        <Td>{fmt$(c.deltaRWA)}</Td>
                        <Td><Badge variant={c.percentageChange>50?'destructive':'default'}>{fmtPct(c.percentageChange)}</Badge></Td>
                        <Td><Button variant="outline" size="sm" onClick={()=>openAudit(c)}><Info className="w-4 h-4 mr-1"/>Details</Button></Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode==='hotspots' && (
          <div className="grid gap-6">
            <Alert><AlertDescription>
              <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>These desks show the largest percentage increases in required capital under Basel III Endgame</div>
            </AlertDescription></Alert>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5"/>Top 5 Hot-Spot Desks ($)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <Thead><Tr><Th>Rank</Th><Th>Desk</Th><Th>Pre-Endgame</Th><Th>Post-Endgame</Th><Th>Capital Increase</Th><Th>Priority</Th></Tr></Thead>
                  <Tbody>
                    {hotSpotDesks.map((d,idx)=> (
                      <Tr key={d.desk}>
                        <Td><Badge variant={idx===0?'destructive': idx<3?'default':'secondary'}>#{idx+1}</Badge></Td>
                        <Td className="font-semibold">{d.desk}</Td>
                        <Td>{fmt$(d.preEndgameTotal)}</Td>
                        <Td>{fmt$(d.postEndgameTotal)}</Td>
                        <Td><span className="text-red-600 font-semibold">+{fmt$(d.deltaTotal)} ({fmtPct(d.percentageChange)})</span></Td>
                        <Td>{idx===0? <Badge variant="destructive">Critical</Badge>: idx<3? <Badge>High</Badge>: <Badge variant="secondary">Medium</Badge>}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
          {selected && (
            <>
              <DialogHeader><DialogTitle>Audit Details</DialogTitle></DialogHeader>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Instrument:</span> {selected.instrumentId}</div>
                <div><span className="font-medium">Risk Class:</span> {selected.audit.riskClass}</div>
                <div><span className="font-medium">Bucket:</span> {selected.audit.bucketId}</div>
                <div><span className="font-medium">Pre-Endgame RWA:</span> {fmt$(selected.preEndgameRWA)}</div>
                <div><span className="font-medium">Post-Endgame RWA:</span> {fmt$(selected.postEndgameRWA)}</div>
                <div className="mt-2 font-medium">Component K Values:</div>
                <ul className="list-disc list-inside">
                  <li>Delta K: {selected.audit.K_delta.toFixed(2)}</li>
                  <li>Vega K: {selected.audit.K_vega.toFixed(2)}</li>
                  <li>Curvature K: {selected.audit.K_curv.toFixed(2)}</li>
                  <li>Total K: {selected.audit.K_total.toFixed(2)}</li>
                </ul>
              </div>
              <div className="mt-4"><Button onClick={()=>setAuditOpen(false)}>Close</Button></div>
            </>
          )}
        </Dialog>
      </div>
    </div>
  )
}
