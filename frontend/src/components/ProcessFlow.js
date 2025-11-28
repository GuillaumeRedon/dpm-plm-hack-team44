import React, { useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

const headerStyle = {
  background: 'linear-gradient(135deg, var(--strong-blue) 0%, var(--dark-grey) 100%)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 15px',
  fontWeight: '600'
};

function CustomNode({ data }) {
  const [showDetails, setShowDetails] = React.useState(false);
  const { label, poste, pieces, duration, time, date, delay, hasDelay, count, plannedPercentage } = data;
  
  // Style dynamique basé sur la présence de retard
  const nodeStyle = {
    background: hasDelay ? '#ffe3e3' : '#e7f5ff',
    border: hasDelay ? '2px solid #ff6b6b' : '2px solid #4dabf7',
    borderRadius: '8px',
    padding: '10px 12px',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    fontSize: '11px',
    lineHeight: '1.4',
    cursor: 'pointer',
    position: 'relative',
    minHeight: '60px'
  };

  const tooltipStyle = {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translate(-50%, -100%)',
    background: 'rgba(0, 0, 0, 0.9)',
    color: 'white',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    zIndex: 1000,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  };

  const plannedBarStyle = {
    position: 'absolute',
    top: '-8px',
    left: '0',
    height: '4px',
    width: `${plannedPercentage}%`,
    background: '#51cf66',
    borderRadius: '2px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  };

  // Affichage pour les labels de tâche (avec count)
  if (count) {
    return (
      <div style={nodeStyle}>
        <div style={{ fontWeight: 600, fontSize: '12px' }}>{label}</div>
        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
          {count}
        </div>
      </div>
    );
  }

  // Affichage pour les nœuds de tâche individuels - simple par défaut
  return (
    <div 
      style={nodeStyle}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      {plannedPercentage && <div style={plannedBarStyle} />}
      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
        {label}
      </div>
      <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>
        {duration}
      </div>
      
      {showDetails && (
        <div style={tooltipStyle}>
          <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>{label} - {poste}</div>
          <div>{pieces}</div>
          <div>{duration}</div>
          <div>{time}</div>
          <div>{date}</div>
          <div style={{ 
            marginTop: '4px', 
            fontWeight: 'bold',
            color: hasDelay ? '#ffa8a8' : '#8ce99a'
          }}>
            {delay}
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour l'axe temporel
function TimeAxisNode({ data }) {
  // Générer les marques d'heure de 6h à 20h (heures de travail typiques)
  const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6h à 20h
  
  return (
    <div style={{
      width: '13500px', // Largeur correspondant à 15 heures * 60 minutes * 15
      height: '80px',
      position: 'relative',
      pointerEvents: 'none'
    }}>
      {/* Ligne de base */}
      <div style={{
        position: 'absolute',
        bottom: '25px',
        left: 0,
        right: 0,
        height: '3px',
        background: '#16A085'
      }} />
      
      {/* Graduations */}
      {hours.map(hour => {
        const xPosition = (hour - 6) * 60 * 15; // Position avec facteur 15
        return (
          <div
            key={hour}
            style={{
              position: 'absolute',
              left: `${xPosition}px`,
              bottom: '25px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Trait vertical */}
            <div style={{
              width: '3px',
              height: '25px',
              background: '#2563EB',
              marginBottom: '5px'
            }} />
            {/* Label */}
            <span style={{
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#2563EB',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '4px 10px',
              borderRadius: '5px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              border: '2px solid #2563EB'
            }}>
              {`${hour}h00`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
  timeAxis: TimeAxisNode
};

function ProcessFlow({ flowData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  React.useEffect(() => {
    if (flowData) {
      const styledNodes = flowData.nodes.map(node => ({
        ...node,
        type: node.type === 'input' ? 'input' : 'custom',
        style: {
          ...(node.style || {}),
          ...(node.type === 'input' ? headerStyle : {})
        }
      }));
      
      // Ajouter le nœud d'axe temporel en haut
      const timeAxisNode = {
        id: 'time-axis',
        type: 'timeAxis',
        data: { label: 'Axe temporel' },
        position: { x: 6 * 60 * 15, y: -100 }, // Positionné à 6h avec facteur 15
        draggable: false,
        selectable: false,
        style: {
          background: 'transparent',
          border: 'none'
        }
      };
      
      setNodes([timeAxisNode, ...styledNodes]);
      setEdges(flowData.edges);
    }
  }, [flowData, setNodes, setEdges]);

  const onInit = useCallback((reactFlowInstance) => {
    reactFlowInstance.fitView();
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export default ProcessFlow;
