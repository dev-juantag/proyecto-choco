const https = require('https');
const fs = require('fs');

function toTitleCase(str) {
  return str.toLowerCase().split(' ').map(word => {
    if (["de", "del", "la", "las", "el", "los", "y"].includes(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

https.get('https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.min.json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const raw = JSON.parse(data);
      const depsMap = new Map();

      raw.forEach(d => {
        let depName = toTitleCase(d.departamento.trim());
        // Fix up specific department names that might be incorrectly capitalized
        if (depName.toLowerCase() === 'bogota d.c.') depName = 'Bogotá D.C.';
        if (depName.toLowerCase() === 'valle del cauca') depName = 'Valle del Cauca';
        if (depName.toLowerCase() === 'norte de santander') depName = 'Norte de Santander';
        if (depName.toLowerCase() === 'san andres') depName = 'San Andrés';

        const muns = d.ciudades.map(c => toTitleCase(c.trim()));
        
        if (!depsMap.has(depName)) {
          depsMap.set(depName, new Set(muns));
        } else {
          muns.forEach(m => depsMap.get(depName).add(m));
        }
      });

      const result = Array.from(depsMap.keys()).sort((a, b) => a.localeCompare(b)).map(dep => ({
        departamento: dep,
        municipios: Array.from(depsMap.get(dep)).sort((a, b) => a.localeCompare(b))
      }));

      const content = `export const COLOMBIA_DIVIPOLA = ${JSON.stringify(result, null, 2)};\n`;
      fs.writeFileSync('lib/colombia.ts', content);
      console.log('Colombia Divipola downloaded, deduplicated, and saved to lib/colombia.ts');
    } catch (e) {
      console.error("Error parsing JSON:", e);
    }
  });
});
