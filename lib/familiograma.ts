export function generateFamiliogramaAutoLayout(integrantes: any[]): string {
  if (!integrantes || integrantes.length === 0) return "[]";

  const nodes: any[] = [];
  const edges: any[] = [];

  integrantes.forEach((int, index) => {
    const isJefe = String(int.parentesco) === '1';
    const isSpouse = String(int.parentesco) === '2';
    
    let defaultY = 150;
    if (isJefe || isSpouse) {
      defaultY = 150;
    } else {
      defaultY = 300; // children
    }

    const defaultX = 100 + index * 120;

    nodes.push({
      id: int.numDoc || `member-${index}`,
      data: {
        label: `${int.primerNombre || ''} ${int.primerApellido || ''}`.trim(),
        sexo: int.sexo || "HOMBRE",
        parentesco: int.parentesco || "1",
        age: 30 // dummy age fallback
      },
      position: { x: defaultX, y: defaultY }
    });

    if (isSpouse) {
      // Connect to Jefe (usually first member)
      const jefe = integrantes.find(i => String(i.parentesco) === '1');
      if (jefe) {
        edges.push({
          id: `edge-${jefe.numDoc}-${int.numDoc}`,
          source: jefe.numDoc,
          target: int.numDoc,
          type: 'spouse'
        });
      }
    }
  });

  return JSON.stringify({ nodes, edges });
}
