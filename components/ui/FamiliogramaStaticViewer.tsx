"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { toSvg } from 'html-to-image';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  BaseEdge,
  getStraightPath,
  getSmoothStepPath,
  EdgeLabelRenderer,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { calcularEdad, PARENTESCO } from '@/lib/constants';

// --- ZIGZAG PATH GENERATOR FOR CONFLICT ---
function getZigzagPath(sourceX: number, sourceY: number, targetX: number, targetY: number, amplitude = 5, spacing = 8) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return `M ${sourceX} ${sourceY}`;
  
  const ux = dx / len;
  const uy = dy / len;
  
  const px = -uy;
  const py = ux;
  
  const steps = Math.floor(len / spacing);
  let path = `M ${sourceX} ${sourceY}`;
  
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const bx = sourceX + t * dx;
    const by = sourceY + t * dy;
    const offset = amplitude * (i % 2 === 0 ? 1 : -1);
    const x = bx + offset * px;
    const y = by + offset * py;
    path += ` L ${x} ${y}`;
  }
  
  path += ` L ${targetX} ${targetY}`;
  return path;
}

// --- CUSTOM NODE STATIC ---
const GenogramNode = ({ data }: { data: any }) => {
  const type = data.tipo || 'NORMAL';
  const sexo = data.sexo?.toUpperCase() || 'INDEFINIDO';
  const isHombre = sexo === 'HOMBRE' || sexo === 'MASCULINO';
  const isMujer = sexo === 'MUJER' || sexo === 'FEMENINO';

  const isAbortoEsp = type === 'ABORTO_ESPONTANEO';
  const isAbortoInd = type === 'ABORTO_INDUCIDO';
  const isEmbarazo = type === 'EMBARAZO';
  const isAdopcion = data.adopcion;
  const isFallecido = data.fallecido;

  let baseShape: any = {
    width: 60,
    height: 60,
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    border: data.isJefe ? '4px double #1e3a8a' : '2px solid #64748b',
    color: '#0f172a',
    boxSizing: 'border-box',
    boxShadow: '0 2px 4px rgb(0 0 0 / 0.04)'
  };

  if (isHombre) {
    baseShape.borderRadius = '6px';
    baseShape.background = '#dbeafe'; 
    baseShape.borderColor = data.isJefe ? '#1e3a8a' : '#3b82f6';
  } else if (isMujer) {
    baseShape.borderRadius = '50%';
    baseShape.background = '#fce7f3'; 
    baseShape.borderColor = data.isJefe ? '#9d174d' : '#ec4899';
  } else {
    baseShape.transform = 'rotate(45deg)';
    baseShape.background = '#f1f5f9'; 
    baseShape.borderColor = '#64748b';
  }

  if (isEmbarazo) {
    baseShape = {
      width: 0,
      height: 0,
      borderLeft: '30px solid transparent',
      borderRight: '30px solid transparent',
      borderBottom: '52px solid #fca5a5',
      borderTop: 'none',
      background: 'transparent',
      position: 'relative',
    };
  }

  if (isAbortoEsp || isAbortoInd) {
    baseShape.width = 25;
    baseShape.height = 25;
    baseShape.borderRadius = '50%';
    baseShape.background = '#0f172a';
    baseShape.border = 'none';
  }

  const ageText = data.edad !== undefined && data.edad !== '' ? data.edad : '?';

  return (
    <div className="relative flex flex-col items-center justify-start pb-16">
      {isAdopcion && (
        <span className="absolute -left-5 top-2 text-4xl text-slate-400 font-bold select-none">(</span>
      )}

      <div style={baseShape}>
        <Handle type="target" position={Position.Top} id="parent-in" style={{ opacity: 0 }} />
        <Handle type="target" position={Position.Left} id="partner-in" style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Right} id="partner-out" style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Bottom} id="parent-out" style={{ opacity: 0 }} />

        {isFallecido && (
          <svg className="absolute inset-0 w-full h-full text-red-500/80 pointer-events-none" style={{ transform: (!isHombre && !isMujer && !isEmbarazo && !isAbortoEsp && !isAbortoInd) ? 'rotate(-45deg)' : 'none' }}>
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="2.5" />
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="2.5" />
          </svg>
        )}

        {data.embarazada && !isEmbarazo && (
          <div 
            className="absolute -top-2 -right-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-pink-500 drop-shadow-sm" 
            style={{ transform: (!isHombre && !isMujer) ? 'rotate(-45deg)' : 'none' }}
          />
        )}

        {isAbortoInd && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-black">X</div>
        )}

        {!isEmbarazo && !isAbortoEsp && !isAbortoInd && (
          <div style={{ transform: (!isHombre && !isMujer) ? 'rotate(-45deg)' : 'none', textAlign: 'center', opacity: isFallecido ? 0.4 : 1 }}>
            <span className="font-bold text-base text-slate-800">{ageText}</span>
          </div>
        )}
      </div>

      {isAdopcion && (
        <span className="absolute right-[-14px] top-2 text-4xl text-slate-400 font-bold select-none">)</span>
      )}

      <div className="absolute top-[65px] w-44 text-center text-[10px] font-bold text-slate-800 leading-tight" style={{ pointerEvents: 'none' }}>
         <span className="block uppercase text-slate-900 drop-shadow-sm">
           {(() => {
             const nombresStr = (data.nombres || '').trim();
             const apellidosStr = (data.apellidos || '').trim();
             const rawNombre = (data.nombre || '').trim();

             if (nombresStr) {
               const nParts = nombresStr.split(/\s+/);
               if (nParts.length >= 2) {
                 return `${nParts[0]} ${nParts[1]}`;
               }
               if (apellidosStr) {
                 const aParts = apellidosStr.split(/\s+/);
                 return `${nParts[0]} ${aParts[0]}`;
               }
               return nParts[0];
             }

             if (!rawNombre) return '';
             const parts = rawNombre.split(/\s+/);
             return parts.slice(0, 2).join(' ');
           })()}
         </span>
         {data.parentescoLabel && <span className="block text-blue-600 font-semibold text-[9px] mt-0.5">{data.parentescoLabel}</span>}
         {(isEmbarazo || isAbortoEsp || isAbortoInd) && <span className="block text-slate-500 mt-1 uppercase">{data.nombre}</span>}
      </div>
    </div>
  );
};

// --- CUSTOM RELATION T-JUNCTION NODE STATIC ---
const RelacionNode = () => {
  return (
    <div style={{ width: 1, height: 1, position: 'relative', background: 'transparent' }}>
      <Handle type="target" position={Position.Top} id="parent-in" style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="target" position={Position.Left} id="partner-in" style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Right} id="partner-out" style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Bottom} id="parent-out" style={{ opacity: 0, width: 1, height: 1 }} />
    </div>
  );
};

// --- CUSTOM EDGE STATIC ---
const GenogramEdge = ({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd,
  sourceHandleId, targetHandleId
}: any) => {
  const [straightPath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const [stepPath] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });

  const type = data?.relType || 'normal';
  const showEmotional = data?.showEmotional !== false;

  const isPartnerConnection = sourceHandleId?.includes('partner') || targetHandleId?.includes('partner');
  const pathToUse = (isPartnerConnection || type === 'conflicto') ? straightPath : stepPath;

  let strokeDasharray = '0';
  let stroke = '#475569';
  let strokeWidth = 2;
  let customPathElement = null;

  if (showEmotional) {
    switch (type) {
      case 'union_libre':
        strokeDasharray = '6 4';
        stroke = '#475569';
        break;
      case 'distante':
        strokeDasharray = '1 5';
        stroke = '#94a3b8';
        strokeWidth = 2.5;
        break;
      case 'muy_cercana':
        strokeWidth = 4.5;
        stroke = '#334155';
        break;
      case 'cercana':
        strokeWidth = 2;
        stroke = '#475569';
        break;
      case 'conflicto':
        customPathElement = (
          <path
            id={id}
            className="react-flow__edge-path"
            d={getZigzagPath(sourceX, sourceY, targetX, targetY, 6, 8)}
            strokeWidth={2.5}
            fill="none"
            stroke="#475569"
          />
        );
        break;
      case 'sin_contacto':
        stroke = '#64748b';
        strokeDasharray = '6 6';
        strokeWidth = 2;
        break;
      case 'separacion':
      case 'divorcio':
        stroke = '#475569';
        break;
    }
  } else {
    if (['muy_cercana', 'cercana', 'distante', 'conflicto', 'sin_contacto'].includes(type)) {
      stroke = '#cbd5e1';
      strokeWidth = 1.5;
    } else if (type === 'union_libre') {
      strokeDasharray = '6 6';
    }
  }

  if (customPathElement) return customPathElement;

  return (
    <>
      <BaseEdge id={id} path={pathToUse} style={{ strokeWidth, strokeDasharray, stroke, strokeLinecap: type === 'distante' && showEmotional ? 'round' : 'butt' }} markerEnd={markerEnd} />
      
      {type === 'consanguineo' && (
         <BaseEdge id={`${id}-2`} path={pathToUse} style={{ strokeWidth, stroke, transform: 'translateY(4px)' }}/>
      )}

      {showEmotional && (type === 'divorcio' || type === 'separacion') && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              fontWeight: 900,
              pointerEvents: 'none',
              color: '#475569',
              background: 'rgba(255,255,255,0.9)',
              padding: '1px 3px',
              borderRadius: '3px',
              border: '1px solid #cbd5e1'
            }}
          >
            {type === 'divorcio' ? '//' : '/'}
          </div>
        </EdgeLabelRenderer>
      )}

      {showEmotional && type === 'sin_contacto' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 14}px)`,
              fontSize: 11,
              fontWeight: 900,
              pointerEvents: 'none',
              color: '#64748b',
              background: '#f8fafc',
              padding: '1px 4px',
              borderRadius: '50%',
              border: '1.5px solid #cbd5e1'
            }}
          >
            ✕
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

function PrintHandler({ setPrintImage, containerId }: { setPrintImage: (url: string) => void, containerId: string }) {
  const { fitView } = useReactFlow();
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      fitView({ padding: 0.25, duration: 0 });
      
      const container = document.getElementById(containerId);
      const reactFlowElement = container?.querySelector('.react-flow') as HTMLElement;
      if (reactFlowElement) {
        toSvg(reactFlowElement, { 
          backgroundColor: '#ffffff',
          style: { width: '100%', height: '100%', transform: 'translate(0, 0)' }
        })
        .then((dataUrl) => {
          setPrintImage(dataUrl);
        })
        .catch(err => {
          console.error("No se pudo generar la imagen para impresión", err);
        });
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [fitView, setPrintImage, containerId]);

  return null;
}

export default function FamiliogramaStaticViewer({ jsonString, isPrintView = false }: { jsonString: string, isPrintView?: boolean }) {
  const [printImage, setPrintImage] = useState<string | null>(null);
  const containerId = useMemo(() => `familiograma-print-${Math.random().toString(36).substr(2, 9)}`, []);

  const { nodes, edges } = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonString);
      
      const checkedNodes = (parsed.nodes || []).map((node: any) => {
        if (node.type === 'relacion') return node;
        if (node.data) {
          if (node.data.fechaNacimiento) {
             node.data.edad = calcularEdad(node.data.fechaNacimiento);
          }
          let age = node.data.edad;
          if (typeof age === 'number' && age >= 100) {
            node.data.fallecido = true;
          }
          if (node.data.embarazada && node.data.fechaEmbarazo) {
            const dateEmb = new Date(node.data.fechaEmbarazo);
            const diffMs = Date.now() - dateEmb.getTime();
            const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4);
            if (diffMonths >= 9) {
              node.data.embarazada = false;
            }
          }
        }
        return node;
      });

      return { 
        nodes: checkedNodes, 
        edges: parsed.edges || [] 
      };
    } catch (e) {
      return { nodes: [], edges: [] };
    }
  }, [jsonString]);

  const memoNodeTypes = useMemo(() => ({ 
    integrante: GenogramNode,
    relacion: RelacionNode
  }), []);
  const memoEdgeTypes = useMemo(() => ({ genogramEdge: GenogramEdge, spouse: GenogramEdge }), []);

  if (!nodes || nodes.length === 0) {
      return <div className="p-4 border border-dashed text-gray-500 text-center rounded-xl my-4">No hay datos válidos en el lienzo.</div>;
  }

  return (
    <div id={containerId} className="familiograma-print-container relative w-full h-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden print:border-0 print:h-auto print:bg-white print:overflow-visible flex flex-col justify-center items-center" 
      style={{ 
        pageBreakInside: 'avoid',
        breakInside: 'avoid'
      }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .familiograma-print-container {
            height: auto !important;
            min-height: 200px !important;
            width: 100% !important;
            background: white !important;
            border: none !important;
            margin: 10px 0 !important;
          }
          .react-flow-wrapper {
             display: ${isPrintView ? 'none !important' : 'block !important'};
          }
          .print-image-wrapper {
             display: ${isPrintView ? 'block !important' : 'none !important'};
              width: 100%;
              text-align: center;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @media screen {
          .print-image-wrapper { display: none !important; }
        }
      `}} />

      <div className="react-flow-wrapper w-full h-full pointer-events-none">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={memoNodeTypes}
            edgeTypes={memoEdgeTypes}
            fitView
            fitViewOptions={{ padding: 0.25, includeHiddenNodes: true }}
            proOptions={{ hideAttribution: true }}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            multiSelectionKeyCode={null}
            selectionKeyCode={null}
            deleteKeyCode={null}
            minZoom={0.05}
            maxZoom={1.5}
          >
            {isPrintView && <PrintHandler setPrintImage={setPrintImage} containerId={containerId} />}
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {printImage && (
        <div className="print-image-wrapper">
           <img src={printImage} alt="Familiograma Impresión" style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}
