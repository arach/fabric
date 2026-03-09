import { ArcDiagram, type ArcDiagramData } from '@arach/arc'

const diagram: ArcDiagramData = {
  id: 'fabric',
  layout: { width: 740, height: 262 },
  groups: [
    {
      label: 'FABRIC',
      x: 205,
      y: 10,
      width: 510,
      height: 220,
      color: 'emerald',
      labelAnchor: 'bottom',
      labelPlacement: 'overlap',
    },
  ],
  nodes: {
    code:    { x: 18,  y: 80,  size: 'm' },
    local:   { x: 235, y: 80,  size: 'm' },
    daytona: { x: 555, y: 22,  size: 's' },
    e2b:     { x: 555, y: 72,  size: 's' },
    exe:     { x: 555, y: 122, size: 's' },
    byop:    { x: 555, y: 172, size: 's' },
  },
  nodeData: {
    code: {
      icon: 'Code',
      name: 'Your project',
      subtitle: '.fabric config',
      color: 'zinc',
    },
    local: {
      icon: 'Monitor',
      name: 'Local container',
      subtitle: 'macOS VM',
      color: 'emerald',
    },
    daytona: {
      icon: 'Cloud',
      name: 'Daytona',
      color: 'emerald',
    },
    e2b: {
      icon: 'Zap',
      name: 'E2B',
      color: 'amber',
    },
    exe: {
      icon: 'Server',
      name: 'exe.dev',
      color: 'blue',
    },
    byop: {
      icon: 'Box',
      name: 'Other',
      color: 'zinc',
      dashed: true,
    },
  },
  connectors: [
    { from: 'code',  to: 'local', fromAnchor: 'right', toAnchor: 'left', style: 'run' },
    { from: 'local', to: 'e2b',   fromAnchor: 'right', toAnchor: 'left', style: 'snapshot', curve: 'natural' },
  ],
  connectorStyles: {
    run:      { color: 'emerald', strokeWidth: 1.5 },
    snapshot: { color: 'zinc', strokeWidth: 1.5, dashed: true },
  },
}

export default function OverviewDiagramReact() {
  return (
    <div id="overview-arc-diagram" style={{ margin: '12px -24px 36px' }}>
      {/* Render both modes, toggle visibility with CSS based on data-theme */}
      <div className="arc-light-diagram">
        <ArcDiagram data={diagram} mode="light" interactive={false} />
      </div>
      <div className="arc-dark-diagram" style={{ display: 'none' }}>
        <ArcDiagram data={diagram} mode="dark" interactive={false} />
      </div>
    </div>
  )
}
