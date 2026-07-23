const fs = require('fs');
let content = fs.readFileSync('d:/sukabumi berliterasi/sukabumi berliterasi/apps/web/src/components/SupportSection.jsx', 'utf8');

// 1. Change the opening `return (` to `return (<>` and the section
content = content.replace(
  /  return \(\n\s*<section className=\"space-y-6 relative pb-10\">\n/,
  `  return (
    <>
      <section className={\`space-y-6 relative pb-10 \${isHidden ? 'hidden' : ''}\`}>\n`
);

// 2. Find the start of the Modals
const modalStartIdx = content.indexOf('{/* User Authentication Modal (Login / Register) */}');
if (modalStartIdx !== -1) {
  // Before this line, there must be a `</section>` because we want to close the section here.
  // Actually, currently the `</section>` is at the very end of the file, just before the closing tag of the component.
  // Let's close the `<section>` right before the User Auth Modal, and remove the `</section>` at the end of the file.
  
  const beforeModals = content.substring(0, modalStartIdx);
  const afterModals = content.substring(modalStartIdx);
  
  // We need to inject `</section>\n\n` before the modals.
  content = beforeModals + '      </section>\n\n      ' + afterModals;
  
  // Now we need to change the final closing tags from `</section>\n    );\n  }` to `</>\n    );\n  }`
  // Let's find the last `</section>`
  const lastSectionIdx = content.lastIndexOf('</section>');
  if (lastSectionIdx !== -1) {
    content = content.substring(0, lastSectionIdx) + '</>' + content.substring(lastSectionIdx + '</section>'.length);
  }
} else {
  console.log('Error: Could not find User Auth Modal');
}

fs.writeFileSync('d:/sukabumi berliterasi/sukabumi berliterasi/apps/web/src/components/SupportSection.jsx', content, 'utf8');
console.log('Modals restructured successfully.');
