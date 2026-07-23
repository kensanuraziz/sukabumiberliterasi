
const content = require('fs').readFileSync('d:/sukabumi berliterasi/sukabumi berliterasi/apps/web/src/components/SupportSection.jsx', 'utf8');
const idx = content.indexOf('{/* Auth Modal */}');
console.log(content.substring(idx - 50, idx + 50));
