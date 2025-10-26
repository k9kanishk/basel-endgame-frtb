import * as React from 'react'

export const Card = ({children, className}:{children:React.ReactNode,className?:string})=> (
  <div className={'rounded-xl border bg-white '+(className||'')}>{children}</div>
)
export const CardHeader = ({children}:{children:React.ReactNode})=> (<div className="border-b p-4">{children}</div>)
export const CardTitle = ({children}:{children:React.ReactNode})=> (<h2 className="text-xl font-semibold">{children}</h2>)
export const CardContent = ({children}:{children:React.ReactNode})=> (<div className="p-4">{children}</div>)

export const Button = ({children,onClick,variant='default',size='md',className}:{children:React.ReactNode,onClick?:any,variant?:'default'|'outline'|'ghost',size?:'sm'|'md',className?:string})=>{
  const base = 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium';
  const v = variant==='outline'?'border bg-white':variant==='ghost'?'':'bg-black text-white';
  const s = size==='sm'?'px-2 py-1 text-xs':'';
  return <button onClick={onClick} className={[base,v,s,className].join(' ')}>{children}</button>
}

export const Input = (props:React.InputHTMLAttributes<HTMLInputElement>)=> (<input {...props} className="w-full rounded-md border px-3 py-2 text-sm"/>)
export const Label = ({children}:{children:React.ReactNode})=> (<label className="text-sm text-gray-700">{children}</label>)
export const Select = ({children,value,onChange}:{children:React.ReactNode,value?:string,onChange?:(v:string)=>void})=> (<select value={value} onChange={e=>onChange?.(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">{children}</select>)
export const Option = ({children,value}:{children:React.ReactNode,value:string})=> (<option value={value}>{children}</option>)

export const Table = ({children}:{children:React.ReactNode})=> (<table className="w-full text-sm">{children}</table>)
export const Thead = ({children}:{children:React.ReactNode})=> (<thead className="text-left text-gray-600">{children}</thead>)
export const Tbody = ({children}:{children:React.ReactNode})=> (<tbody>{children}</tbody>)
export const Tr = ({children}:{children:React.ReactNode})=> (<tr className="border-t">{children}</tr>)
export const Th = ({children}:{children:React.ReactNode})=> (<th className="p-2">{children}</th>)
export const Td = ({children}:{children:React.ReactNode})=> (<td className="p-2">{children}</td>)

export const Badge = ({children,variant='default'}:{children:React.ReactNode,variant?:'default'|'destructive'|'secondary'})=>{
  const c = variant==='destructive'?'bg-red-100 text-red-700':variant==='secondary'?'bg-gray-100 text-gray-700':'bg-gray-900 text-white';
  return <span className={'inline-flex items-center rounded-full px-2 py-0.5 text-xs '+c}>{children}</span>
}

export const Alert = ({children}:{children:React.ReactNode})=> (<div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-3 text-sm">{children}</div>)
export const AlertDescription = ({children}:{children:React.ReactNode})=> (<div>{children}</div>)

export const Dialog: React.FC<{open:boolean,onOpenChange:(b:boolean)=>void,children:React.ReactNode}> = ({open,onOpenChange,children})=> open? (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={()=>onOpenChange(false)}>
    <div className="max-w-lg w-full rounded-xl bg-white p-4" onClick={e=>e.stopPropagation()}>{children}</div>
  </div>
): null
export const DialogHeader = ({children}:{children:React.ReactNode})=> (<div className="mb-2">{children}</div>)
export const DialogTitle = ({children}:{children:React.ReactNode})=> (<h3 className="text-lg font-semibold">{children}</h3>)
