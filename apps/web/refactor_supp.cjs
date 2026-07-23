const fs = require('fs');
let content = fs.readFileSync('d:/sukabumi berliterasi/sukabumi berliterasi/apps/web/src/components/SupportSection.jsx', 'utf8');

// 1. Add props to SupportSection
const oldProps = /export default function SupportSection\(\{\s*products,\s*loading,\s*shippingServices\s*\}\) \{/;
const newProps = `export default function SupportSection({ 
  products, 
  loading, 
  shippingServices,
  isHidden,
  currentUser,
  setCurrentUser,
  showAuthModal,
  setShowAuthModal,
  authMode,
  setAuthMode,
  showProfileModal,
  setShowProfileModal,
  profileTab,
  setProfileTab
}) {`;
content = content.replace(oldProps, newProps);

// 2. Remove local state declarations
content = content.replace(/  const \[currentUser, setCurrentUser\] = useState\([\s\S]*?\}\);\n/, '');
content = content.replace(/  const \[showAuthModal, setShowAuthModal\] = useState\(false\);\n/, '');
content = content.replace(/  const \[authMode, setAuthMode\] = useState\('login'\);\n/, '');
content = content.replace(/  const \[showProfileModal, setShowProfileModal\] = useState\(false\);\n/, '');
content = content.replace(/  const \[profileTab, setProfileTab\] = useState\('info'\);\n/, '');

// 3. Remove "User Authentication Status Panel"
const authPanelRegex = /\{\/\* User Authentication Status Panel \*\/\}[\s\S]*?\{\/\* Main Grid Layout \*\/\}/;
content = content.replace(authPanelRegex, '{/* Main Grid Layout */}');

// 4. Wrap the main content in a div that respects isHidden
// Main content starts at `<div className="flex gap-2">` after the title area (or we can just wrap the whole container except modals)
// Let's wrap the entire SupportSection `return` EXCEPT for the Modals at the bottom.
// Wait, the component returns `<div className="w-full relative pb-10">`
// Let's find the main wrapper: `<div className="w-full relative pb-10">`
// We'll change it to `<div className={\`w-full relative pb-10 \${isHidden ? 'hidden' : 'block'}\`}>`
// This will hide the main container, BUT wait, Modals are inside this container!
// Modals usually have `fixed` position, so if the parent is `hidden`, `fixed` children are ALSO hidden.
// To fix this, we need to wrap ONLY the non-modal content in the hidden div.
// Let's find where the modals start: `{/* MODALS */}` or `{showAuthModal && (`

const mainContentStart = /      <div className="w-full max-w-7xl mx-auto flex flex-col gap-4">/;
const newMainContentStart = `      <div className={\`w-full max-w-7xl mx-auto flex flex-col gap-4 \${isHidden ? 'hidden' : ''}\`}>`;
content = content.replace(mainContentStart, newMainContentStart);

// Let's check where that div closes.
// It's just before `      {/* Auth Modal */}` or `      {/* Profile Modal */}`.
// Let's look for `      {/* Profile & Settings Modal */}`
// Oh, actually, if I just replace `mainContentStart`, that div wraps the whole layout?
// Let's print out the structure to be sure.
fs.writeFileSync('d:/sukabumi berliterasi/sukabumi berliterasi/apps/web/refactor_support_temp.cjs', `
const content = require('fs').readFileSync('d:/sukabumi berliterasi/sukabumi berliterasi/apps/web/src/components/SupportSection.jsx', 'utf8');
const idx = content.indexOf('{/* Auth Modal */}');
console.log(content.substring(idx - 50, idx + 50));
`);
fs.writeFileSync('d:/sukabumi berliterasi/sukabumi berliterasi/apps/web/src/components/SupportSection.jsx', content, 'utf8');
console.log('Partial SupportSection modified');
