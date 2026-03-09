import { ArcDiagram, type ArcDiagramData } from '@arach/arc'

// Full-width diagram showing context layer spanning all runtimes
// Context layer contains small nodes for what persists; runtimes below with handoff arrows
const diagram: ArcDiagramData = {
  layout: { width: 680, height: 230 },
  groups: [
    {
      label: 'CONTEXT LAYER',
      x: 15,
      y: 8,
      width: 650,
      height: 68,
      color: 'violet',
      labelAnchor: 'top',
      labelPlacement: 'overlap',
    },
  ],
  nodes: {
    // Context layer items (small, inside the group)
    conversation: { x: 100, y: 24, size: 'xs' },
    agentState:   { x: 270, y: 24, size: 'xs' },
    checkpoints:  { x: 440, y: 24, size: 'xs' },
    // Runtimes below
    local:        { x: 40,  y: 140, size: 'm' },
    container:    { x: 260, y: 140, size: 'm' },
    cloud:        { x: 480, y: 140, size: 'm' },
  },
  nodeData: {
    conversation: { icon: 'MessageSquare', name: 'Conversation',  color: 'violet' },
    agentState:   { icon: 'Activity',      name: 'Agent state',   color: 'violet' },
    checkpoints:  { icon: 'Database',      name: 'Checkpoints',   color: 'violet' },
    local:        { icon: 'Monitor',       name: 'Local',         subtitle: 'Mac',           color: 'zinc' },
    container:    { icon: 'Box',           name: 'Container',     subtitle: 'Apple VM',      color: 'emerald' },
    cloud:        { icon: 'Cloud',         name: 'Cloud',         subtitle: 'E2B / Daytona', color: 'blue' },
  },
  connectors: [
    { from: 'local',     to: 'container', fromAnchor: 'right', toAnchor: 'left', style: 'handoff' },
    { from: 'container', to: 'cloud',     fromAnchor: 'right', toAnchor: 'left', style: 'handoff' },
  ],
  connectorStyles: {
    handoff: { color: 'emerald', strokeWidth: 2 },
  },
}

export default function ContextLayerDiagramReact() {
  return (
    <div id="context-layer-diagram" style={{ margin: '12px -24px 24px' }}>
      <div className="arc-light-diagram">
        <ArcDiagram data={diagram} mode="light" interactive={false} />
      </div>
      <div className="arc-dark-diagram" style={{ display: 'none' }}>
        <ArcDiagram data={diagram} mode="dark" interactive={false} />
      </div>
    </div>
  )
}
