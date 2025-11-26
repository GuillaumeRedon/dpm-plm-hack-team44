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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 15px',
    fontWeight: '600'
  },
  default: {
    background: 'white',
    border: '2px solid #667eea',
    borderRadius: '8px',
    padding: '10px 15px'
  }
};

function CustomNode({ data }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 600, fontSize: '12px' }}>{data.label}</div>
      {data.count && (
        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
          Count: {data.count} | Avg: {data.avgDuration}
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
        style: node.type === 'input' ? nodeStyles.input : nodeStyles.default
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
