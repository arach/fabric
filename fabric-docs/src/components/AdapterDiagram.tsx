import { ArcDiagram, type ArcDiagramData } from '@arach/arc'

// Layout: 3 bottom nodes (160px wide) with 20px gaps, 20px padding
// Row width: 160*3 + 20*2 = 520, + 40px padding = 560
const diagram: ArcDiagramData = {
  layout: { width: 560, height: 200 },
  nodes: {
    core:    { x: 200, y: 12,  size: 'm' },
    local:   { x: 20,  y: 112, size: 'm' },
    daytona: { x: 200, y: 112, size: 'm' },
    e2b:     { x: 380, y: 112, size: 'm' },
  },
  nodeData: {
    core: {
      icon: 'Box',
      name: 'fabric-ai-core',
      subtitle: 'Sandbox interface',
      color: 'emerald',
    },
    local: {
      icon: 'Monitor',
      name: 'Local container',
      subtitle: 'container CLI',
      color: 'zinc',
    },
    daytona: {
      icon: 'Cloud',
      name: 'Daytona',
      subtitle: '@daytona SDK',
      color: 'emerald',
    },
    e2b: {
      icon: 'Zap',
      name: 'E2B',
      subtitle: '@e2b/sdk',
      color: 'amber',
    },
  },
  connectors: [
    { from: 'core', to: 'local',   fromAnchor: 'bottomLeft',  toAnchor: 'top', style: 'impl', curve: 'natural' },
    { from: 'core', to: 'daytona', fromAnchor: 'bottom',      toAnchor: 'top', style: 'impl' },
    { from: 'core', to: 'e2b',     fromAnchor: 'bottomRight', toAnchor: 'top', style: 'impl', curve: 'natural' },
  ],
  connectorStyles: {
    impl: { color: 'zinc', strokeWidth: 1.5, dashed: true },
  },
}

export default function AdapterDiagramReact() {
  return (
    <div id="adapter-arc-diagram" style={{ margin: '12px -24px 24px', display: 'flex', justifyContent: 'center' }}>
      <div className="arc-light-diagram">
        <ArcDiagram data={diagram} mode="light" interactive={false} />
      </div>
      <div className="arc-dark-diagram" style={{ display: 'none' }}>
        <ArcDiagram data={diagram} mode="dark" interactive={false} />
      </div>
    </div>
  )
}
