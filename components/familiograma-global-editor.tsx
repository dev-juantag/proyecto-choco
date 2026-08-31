"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { calcularEdad, PARENTESCO } from '@/lib/constants';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  BaseEdge,
  getStraightPath,
  getSmoothStepPath,
  EdgeLabelRenderer,
  MarkerType,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Save, Edit, RefreshCw, Eye, EyeOff, Maximize, Trash2, Heart, ShieldAlert, Sparkles, Smile, Baby } from 'lucide-react';
import { toast } from 'sonner';

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

// --- HELPER TO EXTRACT PARENT IDS FROM RELATION ID (supports both formats) ---
function getParentIdsFromRelNode(relId: string, allNodes: Node[]) {
  if (relId.includes('::')) {
    const parts = relId.split('::');
    if (parts.length === 3 && parts[0] === 'rel') {
      return [parts[1], parts[2]];
    }
  }
  if (relId.startsWith('rel-')) {
    const withoutPrefix = relId.substring(4); // Remove 'rel-'
    for (const n1 of allNodes) {
      if (n1.type !== 'relacion' && withoutPrefix.startsWith(n1.id + '-')) {
        const rest = withoutPrefix.substring(n1.id.length + 1);
        const n2 = allNodes.find(x => x.id === rest);
        if (n2) {
          return [n1.id, n2.id];
        }
      }
    }
  }
  return null;
}

// --- CUSTOM NODE ---
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

  // Estilos y formas pastel con sombras premium
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
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 10px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)'
  };

  // Asignar colores pastel y formas
  if (isHombre) {
    baseShape.borderRadius = '8px';
    baseShape.background = '#dbeafe'; // Azul pastel
    baseShape.borderColor = data.isJefe ? '#1e3a8a' : '#3b82f6';
  } else if (isMujer) {
    baseShape.borderRadius = '50%';
    baseShape.background = '#fce7f3'; // Rosado pastel
    baseShape.borderColor = data.isJefe ? '#9d174d' : '#ec4899';
  } else {
    // LGTBIQ+ / Indefinido - Diamante
    baseShape.transform = 'rotate(45deg)';
    baseShape.background = '#f1f5f9'; // Gris claro
    baseShape.borderColor = '#64748b';
  }

  // Si es un nodo de tipo Embarazo (triángulo independiente)
  if (isEmbarazo) {
    baseShape = {
      width: 0,
      height: 0,
      borderLeft: '30px solid transparent',
      borderRight: '30px solid transparent',
      borderBottom: '52px solid #fca5a5', // Rojo/Rosa pastel
      borderTop: 'none',
      background: 'transparent',
      position: 'relative',
      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.08))'
    };
  }

  if (isAbortoEsp || isAbortoInd) {
    baseShape.width = 24;
    baseShape.height = 24;
    baseShape.borderRadius = '50%';
    baseShape.background = '#0f172a';
    baseShape.border = 'none';
    baseShape.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  }

  const ageText = data.edad !== undefined && data.edad !== '' ? data.edad : '?';

  return (
    <div className="relative flex flex-col items-center justify-start pb-16 group cursor-pointer">
      {/* Indicador visual de Adopción (Paréntesis) */}
      {isAdopcion && (
        <span className="absolute -left-5 top-2 text-4xl text-slate-400 font-bold select-none transition-transform group-hover:scale-110">(</span>
      )}

      <div style={baseShape} className="group-hover:scale-105 group-hover:shadow-md">
        {/* React Flow Handles con estilos premium */}
        <Handle type="target" position={Position.Top} id="parent-in" style={{ background: '#475569', zIndex: 10, width: 8, height: 8, border: '1.5px solid #ffffff' }} />
        <Handle type="target" position={Position.Left} id="partner-in" style={{ background: '#db2777', zIndex: 10, width: 8, height: 8, border: '1.5px solid #ffffff' }} />
        <Handle type="source" position={Position.Right} id="partner-out" style={{ background: '#db2777', zIndex: 10, width: 8, height: 8, border: '1.5px solid #ffffff' }} />
        <Handle type="source" position={Position.Bottom} id="parent-out" style={{ background: '#475569', zIndex: 10, width: 8, height: 8, border: '1.5px solid #ffffff' }} />

        {/* Cruz diagonal para Fallecidos */}
        {isFallecido && (
          <svg className="absolute inset-0 w-full h-full text-red-500/80 pointer-events-none" style={{ transform: (!isHombre && !isMujer && !isEmbarazo && !isAbortoEsp && !isAbortoInd) ? 'rotate(-45deg)' : 'none' }}>
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="2.5" />
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="2.5" />
          </svg>
        )}

        {/* Símbolo de Embarazo en el nodo (Triángulo rosa arriba a la derecha) */}
        {data.embarazada && !isEmbarazo && (
          <div 
            className="absolute -top-2.5 -right-2.5 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[15px] border-b-pink-500 drop-shadow-md animate-pulse" 
            title="Embarazo Activo"
            style={{ transform: (!isHombre && !isMujer) ? 'rotate(-45deg)' : 'none' }}
          />
        )}

        {isAbortoInd && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-black">X</div>
        )}

        {/* Texto de Edad */}
        {!isEmbarazo && !isAbortoEsp && !isAbortoInd && (
          <div style={{ transform: (!isHombre && !isMujer) ? 'rotate(-45deg)' : 'none', textAlign: 'center', opacity: isFallecido ? 0.4 : 1 }}>
            <span className="font-bold text-base text-slate-800 tracking-tight">{ageText}</span>
          </div>
        )}
      </div>

      {isAdopcion && (
        <span className="absolute right-[-14px] top-2 text-4xl text-slate-400 font-bold select-none transition-transform group-hover:scale-110">)</span>
      )}

      {/* Nombre y parentesco con tarjeta frosted premium */}
      <div className="absolute top-[66px] w-36 px-2 py-1.5 bg-white/90 backdrop-blur-[4px] border border-slate-200/50 rounded-lg shadow-sm text-center transition-all group-hover:shadow-md group-hover:border-slate-300/80" style={{ pointerEvents: 'none' }}>
         <span className="block uppercase text-slate-800 text-[10px] font-bold truncate tracking-wide leading-tight">{data.nombre}</span>
         {data.parentescoLabel && <span className="block text-blue-600 font-bold text-[8.5px] mt-0.5 tracking-wider truncate uppercase">{data.parentescoLabel}</span>}
         {(isEmbarazo || isAbortoEsp || isAbortoInd) && <span className="block text-slate-500 mt-1 uppercase text-[8px] truncate">{data.nombre}</span>}
      </div>
    </div>
  );
};

// --- CUSTOM RELATION T-JUNCTION NODE ---
const RelacionNode = () => {
  return (
    <div style={{ 
      width: 8, 
      height: 8, 
      borderRadius: '50%', 
      background: '#db2777', 
      border: '1.5px solid #ffffff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      position: 'relative',
      cursor: 'crosshair',
      transform: 'translate(-4px, -4px)'
    }}>
      <Handle type="target" position={Position.Top} id="parent-in" style={{ opacity: 0, width: 4, height: 4 }} />
      <Handle type="target" position={Position.Left} id="partner-in" style={{ opacity: 0, width: 4, height: 4 }} />
      <Handle type="source" position={Position.Right} id="partner-out" style={{ opacity: 0, width: 4, height: 4 }} />
      <Handle type="source" position={Position.Bottom} id="parent-out" style={{ background: '#475569', width: 6, height: 6, bottom: -3 }} />
    </div>
  );
};

// --- CUSTOM EDGE ---
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
      strokeDasharray = '6 4';
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
              fontSize: 14,
              fontWeight: 900,
              pointerEvents: 'none',
              color: '#475569',
              background: 'rgba(255,255,255,0.85)',
              padding: '1px 4px',
              borderRadius: '4px',
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
              fontSize: 12,
              fontWeight: 900,
              pointerEvents: 'none',
              color: '#64748b',
              background: '#f8fafc',
              padding: '1px 4.5px',
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

// --- EDITOR INTERNO CON PROVIDER ---
function EditorCanvas({ fichaId, onClose, ficha, mutate }: { fichaId: string, onClose: () => void, ficha: any, mutate: any }) {
  const memoNodeTypes = useMemo(() => ({ 
    integrante: GenogramNode,
    relacion: RelacionNode
  }), []);
  const memoEdgeTypes = useMemo(() => ({ genogramEdge: GenogramEdge, spouse: GenogramEdge }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRelType, setSelectedRelType] = useState('matrimonio');
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [showEmotionalRelations, setShowEmotionalRelations] = useState(true);

  const { fitView } = useReactFlow();

  const getLabel = (arr: any[], id: any) => arr.find((x:any) => String(x.id) === String(id))?.label || id || 'N/A';

  useEffect(() => {
    if (!ficha || initialized) return;

    let loadedNodes: Node[] = [];
    let loadedEdges: Edge[] = [];
    let hasLoadedPositions = false;

    if (ficha.familiogramaCodigo) {
      if (ficha.familiogramaCodigo.startsWith('{')) {
        try {
          const parsed = JSON.parse(ficha.familiogramaCodigo);
          if (parsed.nodes && parsed.edges) {
            loadedNodes = parsed.nodes;
            loadedEdges = parsed.edges;
            hasLoadedPositions = true;
          }
        } catch (e) {
          console.error("No es JSON válido, regenerando...");
        }
      }
    }

    const pacientes = ficha.pacientes || [];

    const checkDynamicRules = (pacData: any) => {
      let isFallecido = pacData.estadoVital === 'FALLECIDO' || pacData.fallecido;
      let age = pacData.fechaNacimiento ? calcularEdad(pacData.fechaNacimiento) : (pacData.edad || '');
      
      if (typeof age === 'number' && age >= 100) {
        isFallecido = true;
      }

      let embarazada = pacData.embarazada || false;
      if (embarazada && pacData.fechaEmbarazo) {
        const dateEmb = new Date(pacData.fechaEmbarazo);
        const diffMs = Date.now() - dateEmb.getTime();
        const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4);
        if (diffMonths >= 9) {
          embarazada = false;
        }
      }

      return { age, isFallecido, embarazada };
    };

    if (hasLoadedPositions) {
       loadedNodes = loadedNodes.map((node: Node) => {
         if (node.type === 'relacion') {
           const parents = getParentIdsFromRelNode(node.id, loadedNodes);
           if (parents) {
             const [id1, id2] = parents;
             const p1 = loadedNodes.find(x => x.id === id1);
             const p2 = loadedNodes.find(x => x.id === id2);
             if (p1 && p2) {
               return {
                 ...node,
                 draggable: false,
                 position: {
                   x: (p1.position.x + p2.position.x) / 2 + 30,
                   y: (p1.position.y + p2.position.y) / 2 + 30
                 }
               };
             }
           }
           return { ...node, draggable: false };
         }
         const pac = pacientes.find((p: any) => p.id === node.id);
         const normalized = checkDynamicRules(pac ? { ...pac, ...node.data } : node.data);
         
         return {
           ...node,
           deletable: node.id.startsWith('manual-') || node.id.startsWith('temp-'), 
           data: {
             ...node.data,
             nombre: pac ? pac.nombres : node.data.nombre,
             edad: normalized.age,
             fechaNacimiento: pac ? pac.fechaNacimiento : node.data.fechaNacimiento,
             sexo: pac ? pac.sexo : node.data.sexo,
             fallecido: normalized.isFallecido,
             embarazada: normalized.embarazada,
             parentescoLabel: pac ? getLabel(PARENTESCO, pac.parentesco) : node.data.parentescoLabel,
             showEmotional: showEmotionalRelations
           }
         }
       });

       loadedEdges = loadedEdges.map(e => ({
         ...e,
         data: { ...e.data, showEmotional: showEmotionalRelations }
       }));
    } else {
       const { generateFamiliogramaAutoLayout } = require('@/lib/familiograma');
       const generated = JSON.parse(generateFamiliogramaAutoLayout(pacientes));
       if (generated.nodes) {
         loadedNodes = generated.nodes.map((n: any) => {
           if (n.type === 'relacion') return { ...n, draggable: false };
           const normalized = checkDynamicRules(n.data);
           return {
             ...n,
             deletable: false,
             data: {
               ...n.data,
               fallecido: normalized.isFallecido,
               embarazada: normalized.embarazada,
               showEmotional: showEmotionalRelations
             }
           };
         });
         loadedEdges = (generated.edges || []).map((e: any) => ({
           ...e,
           data: { ...e.data, showEmotional: showEmotionalRelations }
         }));
       }
    }

    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setInitialized(true);
  }, [ficha, initialized, setNodes, setEdges, showEmotionalRelations]);

  const handleToggleEmotional = () => {
    const nextVal = !showEmotionalRelations;
    setShowEmotionalRelations(nextVal);
    setEdges(eds => eds.map(e => ({
      ...e,
      data: { ...e.data, showEmotional: nextVal }
    })));
  };

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const isPartner = params.sourceHandle === 'partner-out' || params.targetHandle === 'partner-in';
      let rType = selectedRelType;
      if (!isPartner && ['matrimonio', 'union_libre', 'divorcio', 'separacion', 'consanguineo'].includes(selectedRelType)) {
        rType = 'descendente';
      }
      
      const newEdge: Edge = {
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'genogramEdge',
        data: { relType: rType, showEmotional: showEmotionalRelations },
        markerEnd: rType === 'dominante' ? { type: MarkerType.ArrowClosed, color: '#444' } as any : undefined
      };
      
      setEdges((eds) => addEdge(newEdge, eds));

      // Si es un vínculo de pareja (lateral), crear el nodo de relación en el punto medio
      if (isPartner) {
        setNodes((nds) => {
          const parent1 = nds.find(n => n.id === params.source);
          const parent2 = nds.find(n => n.id === params.target);
          if (parent1 && parent2) {
            const relId = `rel::${parent1.id}::${parent2.id}`;
            // Evitar duplicados
            if (nds.some(n => n.id === relId)) return nds;

            const relNode: Node = {
              id: relId,
              type: 'relacion',
              draggable: false,
              position: {
                x: (parent1.position.x + parent2.position.x) / 2 + 30,
                y: (parent1.position.y + parent2.position.y) / 2 + 30
              },
              data: {}
            };
            return [...nds, relNode];
          }
          return nds;
        });
      }
    },
    [setEdges, setNodes, selectedRelType, showEmotionalRelations],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const jsonState = JSON.stringify({ nodes, edges });
      const token = localStorage.getItem("gestion-poblacional-token") || "";
      
      const res = await fetch(`/api/identificaciones/${fichaId}/familiograma`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ familiogramaData: jsonState })
      });
      
      if (!res.ok) throw new Error('Error al guardar');
      toast.success('Familiograma clínico guardado correctamente.');
      
      mutate(
        (key: any) => typeof key === 'string' && key.includes('/api/identificaciones'),
        undefined,
        { revalidate: true }
      );
      onClose();
    } catch(err) {
      toast.error('Ocurrió un error al guardar el familiograma. Verifica tu sesión.');
    } finally {
      setSaving(false);
    }
  };

  const relayout = () => { setInitialized(false); };

  const handleCenterView = () => {
    fitView({ padding: 0.2, duration: 800 });
  };

  const addElement = (tipo: string, sexo: string, defaultName: string) => {
    let positionX = 350;
    let positionY = 200;
    
    if (nodes.length > 0) {
       const referenceNode = nodes.find(n => n.data?.isJefe) || nodes[0];
       positionX = referenceNode.position.x + (Math.random() * 100 - 50); 
       positionY = referenceNode.position.y - 120;
    }

    const newNode = {
      id: `manual-${Date.now()}`,
      type: 'integrante',
      deletable: true,
      data: {
        nombre: defaultName,
        tipo,
        sexo,
        edad: '',
        embarazada: false,
        adopcion: false,
        fallecido: false,
      },
      position: { x: positionX, y: positionY }
    };
    setNodes(nds => [...nds, newNode]);
    setTimeout(() => setEditingNode(newNode), 100);
  };

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'relacion') return;
    setEditingNode(node);
  }, []);

  const onNodeDrag = useCallback((event: any, node: Node) => {
    setNodes((nds) => {
      return nds.map((n) => {
        if (n.type === 'relacion') {
          const parents = getParentIdsFromRelNode(n.id, nds);
          if (parents) {
            const [id1, id2] = parents;
            if (id1 === node.id || id2 === node.id) {
              const parent1 = nds.find(p => p.id === id1);
              const parent2 = nds.find(p => p.id === id2);
              if (parent1 && parent2) {
                const p1Pos = parent1.id === node.id ? node.position : parent1.position;
                const p2Pos = parent2.id === node.id ? node.position : parent2.position;
                return {
                  ...n,
                  position: {
                    x: (p1Pos.x + p2Pos.x) / 2 + 30,
                    y: (p1Pos.y + p2Pos.y) / 2 + 30
                  }
                };
              }
            }
          }
        }
        return n;
      });
    });
  }, [setNodes]);

  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    setNodes((nds) => {
      let updatedNds = [...nds];
      edgesToDelete.forEach((edge) => {
        const relId = `rel::${edge.source}::${edge.target}`;
        const relIdAlt = `rel::${edge.target}::${edge.source}`;
        const relIdOld = `rel-${edge.source}-${edge.target}`;
        const relIdOldAlt = `rel-${edge.target}-${edge.source}`;
        updatedNds = updatedNds.filter(n => 
          n.id !== relId && 
          n.id !== relIdAlt && 
          n.id !== relIdOld && 
          n.id !== relIdOldAlt
        );
      });
      return updatedNds;
    });
  }, [setNodes]);

  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    setNodes((nds) => {
      const deletedIds = nodesToDelete.map(n => n.id);
      return nds.filter((n) => {
        if (n.type === 'relacion') {
          const parents = getParentIdsFromRelNode(n.id, nds);
          if (parents) {
            const [id1, id2] = parents;
            if (deletedIds.includes(id1) || deletedIds.includes(id2)) {
              return false;
            }
          }
        }
        return true;
      });
    });
  }, [setNodes]);

  const isValidConnection = useCallback((connection: any) => {
    const sourceHandle = connection.sourceHandle || '';
    const targetHandle = connection.targetHandle || '';
    
    const isSourcePartner = sourceHandle.includes('partner');
    const isTargetPartner = targetHandle.includes('partner');
    
    const isSourceParent = sourceHandle.includes('parent');
    const isTargetParent = targetHandle.includes('parent');
    
    // Regla: partner con partner (rosa con rosa), parent con parent (gris con gris)
    if (isSourcePartner && isTargetPartner) return true;
    if (isSourceParent && isTargetParent) return true;
    
    return false;
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
      {/* Estilos CSS globales inyectados para micro-animaciones */}
      <style dangerouslySetInnerHTML={{__html: `
        .react-flow__handle {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .react-flow__handle:hover {
          transform: scale(1.5) !important;
          box-shadow: 0 0 10px #db2777 !important;
        }
        .react-flow__edge-path {
          transition: stroke-width 0.2s, stroke 0.2s, filter 0.2s !important;
        }
        .react-flow__edge:hover .react-flow__edge-path {
          stroke-width: 4px !important;
          filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.5));
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />

      {/* Header Premium de Alta Estética Blanco */}
      <div className="h-16 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between px-6 bg-white text-slate-800 shadow-sm z-20">
        <div>
           <h2 className="text-sm md:text-base font-bold flex items-center gap-2 tracking-wide uppercase text-slate-800">
             <Edit className="w-5 h-5 text-blue-600 animate-pulse"/> Familiograma Clínico
             <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200 font-semibold font-mono">Ficha ID: {ficha.id.slice(0,8)}</span>
           </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">
          <button 
            onClick={handleToggleEmotional} 
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg transition-all ${showEmotionalRelations ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
            title="Activar para ver relaciones conflictivas, distantes, etc."
          >
            {showEmotionalRelations ? <Eye className="w-3.5 h-3.5"/> : <EyeOff className="w-3.5 h-3.5"/>}
            {showEmotionalRelations ? 'Relaciones Visibles' : 'Relaciones Ocultas'}
          </button>

          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-300">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-1">Vínculo:</span>
            <select 
              value={selectedRelType} 
              onChange={e => setSelectedRelType(e.target.value)}
              className="text-xs bg-white border-0 outline-none rounded-md px-1.5 py-1 focus:ring-0 font-bold text-slate-700 cursor-pointer"
              title="Vínculo al trazar líneas laterales"
            >
              <option value="matrimonio">Matrimonio ───</option>
              <option value="union_libre">Unión Libre - - -</option>
              <option value="consanguineo">Mat. Consanguíneo ══</option>
              <option value="separacion">Separación ─/─</option>
              <option value="divorcio">Divorcio ─//─</option>
              <option value="cercana">Cercana ━━</option>
              <option value="muy_cercana">Muy Cercana ──</option>
              <option value="distante">Distante ···</option>
              <option value="conflicto">Conflictiva ^^^</option>
              <option value="sin_contacto">Sin Contacto ─ X ─</option>
            </select>
          </div>

          <button onClick={handleCenterView} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-650 transition-all">
            <Maximize className="w-3.5 h-3.5"/> Ajustar Vista
          </button>
          <button onClick={relayout} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-650 transition-all">
            <RefreshCw className="w-3.5 h-3.5"/> Re-organizar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 shadow-md shadow-blue-500/20 active:scale-95">
            <Save className="w-4 h-4"/> {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full transition ml-2">
            <X className="w-5 h-5"/>
          </button>
        </div>
      </div>

      {/* Lienzo y panel lateral Blanco */}
      <div className="flex-1 w-full relative bg-[#fafafa] overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeDrag={onNodeDrag}
          onEdgesDelete={onEdgesDelete}
          onNodesDelete={onNodesDelete}
          nodeTypes={memoNodeTypes}
          edgeTypes={memoEdgeTypes}
          isValidConnection={isValidConnection}
          fitView
          minZoom={0.2}
          maxZoom={2}
          attributionPosition="bottom-right"
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls className="bg-white border-slate-200 text-slate-700 [&>button]:border-slate-200 [&>button]:bg-white [&>button]:text-slate-700 [&>button:hover]:bg-slate-50" />
          <MiniMap 
            zoomable 
            pannable 
            className="bg-white border border-slate-200 rounded-lg shadow-md"
            nodeColor={(n: any) => n.data?.sexo === 'MUJER' ? '#fbcfe8' : n.data?.sexo === 'HOMBRE' ? '#bfdbfe' : '#e2e8f0'} 
            maskColor="rgba(248, 250, 252, 0.7)"
          />
        </ReactFlow>

        {/* Panel lateral "Figuras Auxiliares" Blanco */}
        <div className="absolute top-4 left-4 w-60 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl text-xs z-10 text-slate-800">
            <div className="flex items-center gap-1.5 font-bold border-b border-slate-100 pb-2.5 mb-3 text-slate-700 uppercase tracking-wider text-[10px]">
              <Sparkles className="w-4 h-4 text-amber-500"/>
              <span>Figuras Auxiliares</span>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => addElement('NORMAL', 'HOMBRE', 'Nuevo Integrante')} className="flex items-center justify-between hover:bg-blue-50 hover:border-blue-300 p-2.5 rounded-xl border border-slate-200 text-left font-bold text-slate-700 transition-all active:scale-[0.98] group">
                 <div className="flex items-center gap-2">
                   <div className="w-3.5 h-3.5 bg-[#dbeafe] border border-blue-400 rounded-[3px]" />
                   <span>Hombre / Masculino</span>
                 </div>
                 <Smile className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button onClick={() => addElement('NORMAL', 'MUJER', 'Nueva Integrante')} className="flex items-center justify-between hover:bg-pink-50 hover:border-pink-300 p-2.5 rounded-xl border border-slate-200 text-left font-bold text-slate-700 transition-all active:scale-[0.98] group">
                 <div className="flex items-center gap-2">
                   <div className="w-3.5 h-3.5 bg-[#fce7f3] border border-pink-400 rounded-full" />
                   <span>Mujer / Femenino</span>
                 </div>
                 <Smile className="w-3.5 h-3.5 text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button onClick={() => addElement('NORMAL', 'LGTBIQ+', 'Integrante LGTBIQ+')} className="flex items-center justify-between hover:bg-slate-50 hover:border-slate-350 p-2.5 rounded-xl border border-slate-200 text-left font-bold text-slate-700 transition-all active:scale-[0.98] group">
                 <div className="flex items-center gap-2">
                   <div className="w-3.5 h-3.5 bg-slate-100 border border-slate-400 rotate-45" />
                   <span className="pl-1">LGTBIQ+ / Indefinido</span>
                 </div>
                 <Smile className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <div className="h-[1px] bg-slate-100 my-2" />
              
              <button onClick={() => addElement('EMBARAZO', 'MUJER', 'Embarazo')} className="flex items-center justify-between hover:bg-rose-50 hover:border-rose-300 p-2.5 rounded-xl border border-slate-200 text-left font-bold text-slate-700 transition-all active:scale-[0.98] group">
                 <div className="flex items-center gap-2">
                   <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[11px] border-b-rose-400" />
                   <span>Embarazo Activo</span>
                 </div>
                 <Baby className="w-3.5 h-3.5 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button onClick={() => addElement('ABORTO_ESPONTANEO', 'MUJER', 'A. Espontáneo')} className="flex items-center justify-between hover:bg-slate-50 hover:border-slate-300 p-2.5 rounded-xl border border-slate-200 text-left font-bold text-slate-500 transition-all active:scale-[0.98] group">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-slate-950 border border-slate-650 rounded-full" />
                   <span>Aborto Espontáneo</span>
                 </div>
                 <ShieldAlert className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button onClick={() => addElement('ABORTO_INDUCIDO', 'MUJER', 'A. Inducido')} className="flex items-center justify-between hover:bg-slate-50 hover:border-slate-300 p-2.5 rounded-xl border border-slate-200 text-left font-bold text-slate-500 transition-all active:scale-[0.98] group">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 border border-slate-500 flex items-center justify-center text-[7px] font-black rounded-full" >X</div>
                   <span>Aborto Inducido</span>
                 </div>
                 <ShieldAlert className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
            
            <p className="mt-4 pt-3 border-t border-slate-100 text-[9px] text-slate-400 leading-normal font-medium">
              💡 <span className="font-semibold text-slate-600">Tips:</span><br/>
              - Haz doble clic sobre una figura para editar.<br/>
              - Conecta de punto a punto para crear relaciones.
            </p>
        </div>
      </div>

      {/* Modal de edición con Toggle Switches Premium */}
      {editingNode && (
        <div className="absolute inset-0 z-[70] bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 border border-slate-100">
            <h3 className="font-bold text-lg mb-5 text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-500"/> Editar Integrante
              </span>
              {editingNode.deletable && (
                <button 
                  onClick={() => {
                    setNodes(nds => nds.filter(n => n.id !== editingNode.id));
                    setEdges(eds => eds.filter(e => e.source !== editingNode.id && e.target !== editingNode.id));
                    setEditingNode(null);
                    toast.success("Figura auxiliar eliminada.");
                  }} 
                  className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition"
                  title="Eliminar figura"
                >
                  <Trash2 className="w-5 h-5"/>
                </button>
              )}
            </h3>
            
            {(() => {
              const isEditable = editingNode.id.startsWith('manual-') || editingNode.id.startsWith('temp-');
              return (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Nombre o Etiqueta</label>
                    <input 
                      type="text" 
                      id="edit-nombre" 
                      defaultValue={editingNode.data.nombre as string} 
                      disabled={!isEditable}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed" 
                      placeholder="Escriba aquí..." 
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Edad (Años)</label>
                    <input 
                      type="text" 
                      id="edit-edad" 
                      defaultValue={(editingNode.data.edad === undefined || editingNode.data.edad === null ? '' : editingNode.data.edad) as string} 
                      disabled={!isEditable}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed" 
                      placeholder="Ej: 45 o 3 meses" 
                    />
                    
                    {!isEditable && (
                      <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 p-2.5 rounded-xl mt-3 font-semibold leading-relaxed">
                        ℹ️ Los datos demográficos de este integrante provienen de la ficha de identificación y no se pueden modificar desde este editor.
                      </p>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Premium Switches Layout */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100/80 mb-6">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-bold text-slate-600">¿Está Fallecido(a)?</span>
                <div className="relative">
                  <input type="checkbox" id="edit-fallecido" defaultChecked={editingNode.data.fallecido as boolean} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-bold text-slate-600">¿Está Embarazada?</span>
                <div className="relative">
                  <input type="checkbox" id="edit-embarazada" defaultChecked={editingNode.data.embarazada as boolean} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-bold text-slate-600">¿Es Hijo(a) Adoptivo?</span>
                <div className="relative">
                  <input type="checkbox" id="edit-adopcion" defaultChecked={editingNode.data.adopcion as boolean} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button onClick={() => setEditingNode(null)} className="px-4 py-2 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 transition-all">Cancelar</button>
              <button 
                onClick={() => {
                  const newName = (document.getElementById('edit-nombre') as HTMLInputElement).value;
                  const newEdadStr = (document.getElementById('edit-edad') as HTMLInputElement).value;
                  const isFallecidoCheck = (document.getElementById('edit-fallecido') as HTMLInputElement).checked;
                  const isEmbarazadaCheck = (document.getElementById('edit-embarazada') as HTMLInputElement).checked;
                  const isAdopcionCheck = (document.getElementById('edit-adopcion') as HTMLInputElement).checked;

                  let finalFallecido = isFallecidoCheck;
                  let ageVal = parseInt(newEdadStr);
                  if (!isNaN(ageVal) && ageVal >= 100) {
                    finalFallecido = true; 
                  }

                  let fechaEmb = editingNode.data.fechaEmbarazo;
                  if (isEmbarazadaCheck && !editingNode.data.embarazada) {
                    fechaEmb = new Date().toISOString(); 
                  }

                  setNodes(nds => nds.map(n => n.id === editingNode.id ? { 
                    ...n, 
                    data: { 
                      ...n.data, 
                      nombre: newName, 
                      edad: newEdadStr, 
                      fallecido: finalFallecido,
                      embarazada: isEmbarazadaCheck,
                      fechaEmbarazo: fechaEmb,
                      adopcion: isAdopcionCheck
                    } 
                  } : n));
                  setEditingNode(null);
                }}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition-all active:scale-95"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FamiliogramaGlobalEditor({ fichaId, onClose }: { fichaId: string, onClose: () => void }) {
  const { data: ficha, error } = useSWR(`/api/identificaciones/${fichaId}`, fetcher);
  const { mutate } = useSWRConfig();

  if (error) return <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center text-white font-bold">Error al cargar ficha familiar.</div>;
  if (!ficha) return <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center text-white font-bold">Cargando lienzo avanzado...</div>;

  return (
    <ReactFlowProvider>
      <EditorCanvas fichaId={fichaId} onClose={onClose} ficha={ficha} mutate={mutate} />
    </ReactFlowProvider>
  );
}
