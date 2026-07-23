const fs = require('fs');
let content = fs.readFileSync('d:/sukabumi berliterasi/sukabumi berliterasi/apps/web/src/components/SupportSection.jsx', 'utf8');

const eventCode = `
  useEffect(() => {
    const handleLogout = () => {
      setCart({});
    };
    window.addEventListener('tokolitera_logout', handleLogout);
    return () => window.removeEventListener('tokolitera_logout', handleLogout);
  }, []);
`;

const insertPoint = `  // Parse shipping services from spreadsheet`;
content = content.replace(insertPoint, eventCode + '\n' + insertPoint);

fs.writeFileSync('d:/sukabumi berliterasi/sukabumi berliterasi/apps/web/src/components/SupportSection.jsx', content, 'utf8');
console.log('Event listener added.');
