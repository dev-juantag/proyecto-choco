export function generateFamiliogramaAutoLayout(integrantes: any[]): string {
  if (!integrantes || integrantes.length === 0) return "[]";

  const nodes: any[] = [];
  const edges: any[] = [];

  // 1. Encontrar al Jefe de Hogar como nodo central
  const jefe = integrantes.find(i => String(i.parentesco) === '1') || integrantes[0];
  const jefeId = jefe.id || jefe.numDoc || `member-jefe`;

  // Agrupaciones por parentesco
  const spouses = integrantes.filter(i => String(i.parentesco) === '2');
  const children = integrantes.filter(i => String(i.parentesco) === '3');
  const parents = integrantes.filter(i => String(i.parentesco) === '4' || String(i.parentesco) === '14');
  const grandchildren = integrantes.filter(i => String(i.parentesco) === '5');
  const siblings = integrantes.filter(i => String(i.parentesco) === '6');
  const inlaws = integrantes.filter(i => String(i.parentesco) === '10'); // Suegros
  const uncles = integrantes.filter(i => String(i.parentesco) === '11');
  const cousins = integrantes.filter(i => String(i.parentesco) === '12');
  const grandparents = integrantes.filter(i => String(i.parentesco) === '13');
  const yernoNuera = integrantes.filter(i => String(i.parentesco) === '7' || String(i.parentesco) === '15');
  const otherFamily = integrantes.filter(i => String(i.parentesco) === '8');
  const nonFamily = integrantes.filter(i => String(i.parentesco) === '9');

  // Coordenadas base
  const centerX = 350;
  const centerY = 250;

  const getLabel = (sex: string) => {
    const s = String(sex).toUpperCase();
    if (s === 'HOMBRE' || s === 'MASCULINO') return 'HOMBRE';
    if (s === 'MUJER' || s === 'FEMENINO') return 'MUJER';
    return 'LGTBIQ+';
  };

  const getEdad = (int: any) => {
    if (int.fechaNacimiento) {
      const birth = new Date(int.fechaNacimiento);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 ? age : 0;
    }
    return '';
  };

  // 2. Colocar Jefe de Hogar
  nodes.push({
    id: jefeId,
    type: 'integrante',
    data: {
      nombre: `${jefe.nombres || ''} ${jefe.apellidos || ''}`.trim(),
      nombres: jefe.nombres || null,
      apellidos: jefe.apellidos || null,
      sexo: getLabel(jefe.sexo),
      parentesco: jefe.parentesco || "1",
      parentescoLabel: "Jefe de hogar",
      edad: getEdad(jefe),
      fechaNacimiento: jefe.fechaNacimiento || null,
      fallecido: jefe.estadoVital === 'FALLECIDO',
      isJefe: true,
      tipo: 'NORMAL'
    },
    position: { x: centerX, y: centerY }
  });

  // 3. Colocar Cónyuges (a la derecha)
  let spouseNodeId: string | null = null;
  spouses.forEach((sp, idx) => {
    const spId = sp.id || sp.numDoc || `member-spouse-${idx}`;
    spouseNodeId = spId;
    const x = centerX + 200 + (idx * 150);
    nodes.push({
      id: spId,
      type: 'integrante',
      data: {
        nombre: `${sp.nombres || ''} ${sp.apellidos || ''}`.trim(),
        nombres: sp.nombres || null,
        apellidos: sp.apellidos || null,
        sexo: getLabel(sp.sexo),
        parentesco: "2",
        parentescoLabel: "Cónyuge o compañero",
        edad: getEdad(sp),
        fechaNacimiento: sp.fechaNacimiento || null,
        fallecido: sp.estadoVital === 'FALLECIDO',
        tipo: 'NORMAL'
      },
      position: { x, y: centerY }
    });

    // Conectar con Jefe
    edges.push({
      id: `edge-${jefeId}-${spId}`,
      source: jefeId,
      target: spId,
      sourceHandle: 'partner-out',
      targetHandle: 'partner-in',
      type: 'genogramEdge',
      data: { relType: sp.tipoPareja === 'MATRIMONIO' ? 'matrimonio' : 'union_libre' }
    });
  });

  // Crear nodo de relación Jefe-Cónyuge si existe cónyuge
  let relationJefeSpouseId: string | null = null;
  if (spouseNodeId) {
    relationJefeSpouseId = `rel::${jefeId}::${spouseNodeId}`;
    nodes.push({
      id: relationJefeSpouseId,
      type: 'relacion',
      position: { x: (centerX + (centerX + 200)) / 2 + 30, y: centerY + 30 },
      data: {}
    });
  }

  // 4. Padres (arriba de Jefe)
  let parent1Id: string | null = null;
  let parent2Id: string | null = null;
  parents.forEach((p, idx) => {
    const pId = p.id || p.numDoc || `member-parent-${idx}`;
    if (idx === 0) parent1Id = pId;
    if (idx === 1) parent2Id = pId;
    const x = centerX - 80 + (idx * 160);
    const y = centerY - 150;
    nodes.push({
      id: pId,
      type: 'integrante',
      data: {
        nombre: `${p.nombres || ''} ${p.apellidos || ''}`.trim(),
        sexo: getLabel(p.sexo),
        parentesco: "4",
        parentescoLabel: "Padre / Madre",
        edad: getEdad(p),
        fechaNacimiento: p.fechaNacimiento || null,
        fallecido: p.estadoVital === 'FALLECIDO',
        tipo: 'NORMAL'
      },
      position: { x, y }
    });
  });

  // Crear nodo de relación entre padres si existen ambos
  let relationParentsId: string | null = null;
  if (parent1Id && parent2Id) {
    relationParentsId = `rel::${parent1Id}::${parent2Id}`;
    nodes.push({
      id: relationParentsId,
      type: 'relacion',
      position: { x: (centerX - 80 + centerX + 80) / 2 + 30, y: centerY - 150 + 30 },
      data: {}
    });

    // Conectar padres entre sí
    edges.push({
      id: `edge-${parent1Id}-${parent2Id}`,
      source: parent1Id,
      target: parent2Id,
      sourceHandle: 'partner-out',
      targetHandle: 'partner-in',
      type: 'genogramEdge',
      data: { relType: 'matrimonio' }
    });

    // Conectar relación de padres a Jefe
    edges.push({
      id: `edge-${relationParentsId}-${jefeId}`,
      source: relationParentsId,
      target: jefeId,
      sourceHandle: 'parent-out',
      targetHandle: 'parent-in',
      type: 'genogramEdge',
      data: { relType: 'descendente' }
    });
  } else if (parent1Id) {
    // Si solo hay un padre, conectar directamente a Jefe
    edges.push({
      id: `edge-${parent1Id}-${jefeId}`,
      source: parent1Id,
      target: jefeId,
      sourceHandle: 'parent-out',
      targetHandle: 'parent-in',
      type: 'genogramEdge',
      data: { relType: 'descendente' }
    });
  }

  // 5. Hermanos (mismo nivel del Jefe, a la izquierda)
  siblings.forEach((sib, idx) => {
    const sibId = sib.id || sib.numDoc || `member-sibling-${idx}`;
    const x = centerX - 180 - (idx * 150);
    nodes.push({
      id: sibId,
      type: 'integrante',
      data: {
        nombre: `${sib.nombres || ''} ${sib.apellidos || ''}`.trim(),
        sexo: getLabel(sib.sexo),
        parentesco: "6",
        parentescoLabel: "Hermano(a)",
        edad: getEdad(sib),
        fechaNacimiento: sib.fechaNacimiento || null,
        fallecido: sib.estadoVital === 'FALLECIDO',
        tipo: 'NORMAL'
      },
      position: { x, y: centerY }
    });

    // Conectar al nodo de relación de los padres si existe, sino al Jefe
    const parentSource = relationParentsId || parent1Id || jefeId;
    edges.push({
      id: `edge-${parentSource}-${sibId}`,
      source: parentSource,
      target: sibId,
      sourceHandle: 'parent-out',
      targetHandle: 'parent-in',
      type: 'genogramEdge',
      data: { relType: 'descendente' }
    });
  });

  // 6. Hijos (debajo del Jefe y Cónyuge, ordenados por edad/fechaNacimiento de mayor a menor)
  const sortedChildren = [...children].sort((a, b) => {
    const ageA = getEdad(a) || 0;
    const ageB = getEdad(b) || 0;
    return Number(ageB) - Number(ageA);
  });

  const childrenY = centerY + 150;
  const numChildren = sortedChildren.length;
  sortedChildren.forEach((ch, idx) => {
    const chId = ch.id || ch.numDoc || `member-child-${idx}`;
    const x = centerX - ((numChildren - 1) * 120) / 2 + (idx * 160);
    nodes.push({
      id: chId,
      type: 'integrante',
      data: {
        nombre: `${ch.nombres || ''} ${ch.apellidos || ''}`.trim(),
        sexo: getLabel(ch.sexo),
        parentesco: "3",
        parentescoLabel: "Hijo(a)",
        edad: getEdad(ch),
        fechaNacimiento: ch.fechaNacimiento || null,
        fallecido: ch.estadoVital === 'FALLECIDO',
        tipo: 'NORMAL',
        adopcion: ch.tipoHijo === 'ADOPTIVO'
      },
      position: { x, y: childrenY }
    });

    // Conectar al nodo de relación Jefe-Cónyuge si existe, sino al Jefe directamente
    const parentSource = relationJefeSpouseId || jefeId;
    edges.push({
      id: `edge-${parentSource}-${chId}`,
      source: parentSource,
      target: chId,
      sourceHandle: 'parent-out',
      targetHandle: 'parent-in',
      type: 'genogramEdge',
      data: { relType: ch.tipoHijo === 'ADOPTIVO' ? 'distante' : 'descendente' }
    });
  });

  // 7. Nietos (debajo de los hijos)
  grandchildren.forEach((gc, idx) => {
    const gcId = gc.id || gc.numDoc || `member-grandchild-${idx}`;
    const x = centerX - ((grandchildren.length - 1) * 120) / 2 + (idx * 160);
    const y = childrenY + 150;
    nodes.push({
      id: gcId,
      type: 'integrante',
      data: {
        nombre: `${gc.nombres || ''} ${gc.apellidos || ''}`.trim(),
        sexo: getLabel(gc.sexo),
        parentesco: "5",
        parentescoLabel: "Nieto(a)",
        edad: getEdad(gc),
        fechaNacimiento: gc.fechaNacimiento || null,
        fallecido: gc.estadoVital === 'FALLECIDO',
        tipo: 'NORMAL'
      },
      position: { x, y }
    });

    let parentId = children[0] ? (children[0].id || children[0].numDoc) : jefeId;
    if (gc.padreId || gc.madreId) {
      const foundParent = children.find(c => c.id === gc.padreId || c.id === gc.madreId);
      if (foundParent) parentId = foundParent.id || foundParent.numDoc;
    }
    edges.push({
      id: `edge-${parentId}-${gcId}`,
      source: parentId,
      target: gcId,
      sourceHandle: 'parent-out',
      targetHandle: 'parent-in',
      type: 'genogramEdge',
      data: { relType: 'descendente' }
    });
  });

  // 8. Abuelos (encima de padres)
  grandparents.forEach((gp, idx) => {
    const gpId = gp.id || gp.numDoc || `member-grandparent-${idx}`;
    const x = centerX - 120 + (idx * 240);
    const y = centerY - 270;
    nodes.push({
      id: gpId,
      type: 'integrante',
      data: {
        nombre: `${gp.nombres || ''} ${gp.apellidos || ''}`.trim(),
        sexo: getLabel(gp.sexo),
        parentesco: "13",
        parentescoLabel: "Abuelo(a)",
        edad: getEdad(gp),
        fechaNacimiento: gp.fechaNacimiento || null,
        fallecido: gp.estadoVital === 'FALLECIDO',
        tipo: 'NORMAL'
      },
      position: { x, y }
    });

    const targetParent = parents[idx] || parents[0];
    if (targetParent) {
      const tpId = targetParent.id || targetParent.numDoc;
      edges.push({
        id: `edge-${gpId}-${tpId}`,
        source: gpId,
        target: tpId,
        sourceHandle: 'parent-out',
        targetHandle: 'parent-in',
        type: 'genogramEdge',
        data: { relType: 'descendente' }
      });
    }
  });

  // 9. Suegros (encima de Cónyuge)
  inlaws.forEach((il, idx) => {
    const ilId = il.id || il.numDoc || `member-inlaw-${idx}`;
    const spouseNode = spouses[0];
    const x = spouseNode ? (spouseNode.position?.x || centerX + 200) - 50 + (idx * 100) : centerX + 200;
    const y = centerY - 150;
    nodes.push({
      id: ilId,
      type: 'integrante',
      data: {
        nombre: `${il.nombres || ''} ${il.apellidos || ''}`.trim(),
        sexo: getLabel(il.sexo),
        parentesco: "10",
        parentescoLabel: "Suegro(a)",
        edad: getEdad(il),
        fechaNacimiento: il.fechaNacimiento || null,
        fallecido: il.estadoVital === 'FALLECIDO',
        tipo: 'NORMAL'
      },
      position: { x, y }
    });

    if (spouseNode) {
      const spId = spouseNode.id || spouseNode.numDoc;
      edges.push({
        id: `edge-${ilId}-${spId}`,
        source: ilId,
        target: spId,
        sourceHandle: 'parent-out',
        targetHandle: 'parent-in',
        type: 'genogramEdge',
        data: { relType: 'descendente' }
      });
    }
  });

  // 10. Tíos (arriba de Jefe, lateral)
  uncles.forEach((un, idx) => {
    const unId = un.id || un.numDoc || `member-uncle-${idx}`;
    const x = centerX - 320 - (idx * 150);
    const y = centerY - 150;
    nodes.push({
      id: unId,
      type: 'integrante',
      data: {
        nombre: `${un.nombres || ''} ${un.apellidos || ''}`.trim(),
        sexo: getLabel(un.sexo),
        parentesco: "11",
        parentescoLabel: "Tío(a)",
        edad: getEdad(un),
        fechaNacimiento: un.fechaNacimiento || null,
        fallecido: un.estadoVital === 'FALLECIDO',
        tipo: 'NORMAL'
      },
      position: { x, y }
    });
  });

  // 11. Primos (debajo de tíos)
  cousins.forEach((co, idx) => {
    const coId = co.id || co.numDoc || `member-cousin-${idx}`;
    const x = centerX - 320 - (idx * 150);
    const y = centerY;
    nodes.push({
      id: coId,
      type: 'integrante',
      data: {
        nombre: `${co.nombres || ''} ${co.apellidos || ''}`.trim(),
        sexo: getLabel(co.sexo),
        parentesco: "12",
        parentescoLabel: "Primo(a)",
        edad: getEdad(co),
        fechaNacimiento: co.fechaNacimiento || null,
        fallecido: co.estadoVital === 'FALLECIDO',
        tipo: 'NORMAL'
      },
      position: { x, y }
    });

    const uncleId = uncles[0] ? (uncles[0].id || uncles[0].numDoc) : null;
    if (uncleId) {
      edges.push({
        id: `edge-${uncleId}-${coId}`,
        source: uncleId,
        target: coId,
        sourceHandle: 'parent-out',
        targetHandle: 'parent-in',
        type: 'genogramEdge',
        data: { relType: 'descendente' }
      });
    }
  });

  // 12. Yerno / Nuera (al lado de hijos)
  yernoNuera.forEach((yn, idx) => {
    const ynId = yn.id || yn.numDoc || `member-yn-${idx}`;
    const childNode = sortedChildren[idx] || sortedChildren[0];
    const x = childNode ? childNode.position.x + 80 : centerX;
    nodes.push({
      id: ynId,
      type: 'integrante',
      data: {
        nombre: `${yn.nombres || ''} ${yn.apellidos || ''}`.trim(),
        sexo: getLabel(yn.sexo),
        parentesco: "7",
        parentescoLabel: "Yerno/Nuera",
        edad: getEdad(yn),
        fechaNacimiento: yn.fechaNacimiento || null,
        fallecido: yn.estadoVital === 'FALLECIDO',
        tipo: 'NORMAL'
      },
      position: { x, y: childrenY }
    });

    if (childNode) {
      const chId = childNode.id || childNode.numDoc;
      edges.push({
        id: `edge-${chId}-${ynId}`,
        source: chId,
        target: ynId,
        sourceHandle: 'partner-out',
        targetHandle: 'partner-in',
        type: 'genogramEdge',
        data: { relType: 'union_libre' }
      });
    }
  });

  // 13. Otro familiar (lateral independiente, con línea simple a Jefe)
  otherFamily.forEach((of, idx) => {
    const ofId = of.id || of.numDoc || `member-other-${idx}`;
    const x = centerX + 380 + (idx * 150);
    const y = centerY + 100;
    nodes.push({
      id: ofId,
      type: 'integrante',
      data: {
        nombre: `${of.nombres || ''} ${of.apellidos || ''}`.trim(),
        sexo: getLabel(of.sexo),
        parentesco: "8",
        parentescoLabel: "Otro familiar",
        edad: getEdad(of),
        fechaNacimiento: of.fechaNacimiento || null,
        fallecido: of.estadoVital === 'FALLECIDO',
        tipo: 'NORMAL'
      },
      position: { x, y }
    });

    edges.push({
      id: `edge-${jefeId}-${ofId}`,
      source: jefeId,
      target: ofId,
      type: 'genogramEdge',
      data: { relType: 'cercana' }
    });
  });

  // 14. No familiar (separado lateralmente, línea punteada a Jefe)
  nonFamily.forEach((nf, idx) => {
    const nfId = nf.id || nf.numDoc || `member-nonfam-${idx}`;
    const x = centerX - 380 - (idx * 150);
    const y = centerY + 100;
    nodes.push({
      id: nfId,
      type: 'integrante',
      data: {
        nombre: `${nf.nombres || ''} ${nf.apellidos || ''}`.trim(),
        sexo: getLabel(nf.sexo),
        parentesco: "9",
        parentescoLabel: "No familiar",
        edad: getEdad(nf),
        fechaNacimiento: nf.fechaNacimiento || null,
        fallecido: nf.estadoVital === 'FALLECIDO',
        tipo: 'NORMAL'
      },
      position: { x, y }
    });

    edges.push({
      id: `edge-${jefeId}-${nfId}`,
      source: jefeId,
      target: nfId,
      type: 'genogramEdge',
      data: { relType: 'distante' }
    });
  });

  return JSON.stringify({ nodes, edges });
}
