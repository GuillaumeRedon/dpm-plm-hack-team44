import React, { useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeStyles = {
  input: {
    background: 'linear-gradient(135deg, var(--strong-blue) 0%, var(--dark-grey) 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 15px',
    fontWeight: '600'
  },
  default: {
    background: 'white',
    border: '2px solid  var(--strong-blue)',
    borderRadius: '8px',
    padding: '10px 15px'
  }
};

function CustomNode({ data }) {
  const [showDetails, setShowDetails] = React.useState(false);
  const { label, poste, pieces, duration, time, date, delay, hasDelay, count } = data;
  
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

const nodeTypes = {
  custom: CustomNode
};

function ProcessFlow({ flowData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  React.useEffect(() => {
    if (flowData) {
      const styledNodes = flowData.nodes.map(node => ({
        ...node,
        // Utiliser le type custom pour tous les nœuds sauf header et lane labels
        type: node.type === 'input' ? 'input' : 'custom',
        style: {
          ...(node.style || {}),
          ...(node.type === 'input' ? nodeStyles.input : {})
        }
      }));
      setNodes(styledNodes);
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
