import React from 'react'

export default function Sidebar({ items = [], activeId, onSelect, title }) {
  return (
    <aside style={{width: 220, borderRight: '1px solid #eee', padding: 8}}>
      {
        title ? <h3 style={{marginTop:0, marginBottom:12, fontWeight:'normal', fontSize:'1.1em', borderBottom:'1px solid #ddd', paddingBottom:6}}>{title}</h3> : null
      }
      {items.map(it => (
        <button
          key={it.id}
          onClick={() => onSelect(it.id)}
          style={{
            display:'block', width:'100%', textAlign:'left', marginBottom:6,
            padding: '8px 10px', border: '1px solid #ddd',
            background: activeId === it.id ? '#eef2ff' : '#fff', borderRadius: 6
          }}
          title={it.label}
        >
          {it.label}
        </button>
      ))}
    </aside>
  );
}
