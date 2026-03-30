/**
 * Shared in-memory file system store for all persona-files routes.
 * In production, replace with a database.
 */

const fileSystemsStore = new Map();

/**
 * Generate character-specific default folder structure based on their role/archetype.
 */
const generateDefaultFolders = (personaId, meta = {}) => {
  const { name, title, archetype, systemPrompt } = meta;
  const prompt = (systemPrompt || "").toLowerCase();
  const titleLower = (title || "").toLowerCase();
  const nameLower = (name || "").toLowerCase();

  // Base folders every character gets
  const root = {
    Documents: { type: "folder", children: {} },
    Notes: { type: "folder", children: {} },
    Archives: { type: "folder", children: {} },
  };

  // Detect character themes from their system prompt / title and add relevant folders
  const themes = [];

  // Investigation / journalism / law
  if (/investig|corrupt|law|legal|justice|senate|congress|legislat|audit|evidence|journalist|detective|police|crime|forensic/.test(prompt + titleLower)) {
    themes.push("investigation");
    root["Investigations"] = {
      type: "folder",
      children: {
        "Active-Cases": { type: "folder", children: {} },
        "Closed-Cases": { type: "folder", children: {} },
        Evidence: { type: "folder", children: {} },
      },
    };
  }

  // Politics / governance
  if (/senat|congress|politic|legislat|govern|law|reform|bill|project|decree/.test(prompt + titleLower)) {
    themes.push("politics");
    root["Legislation"] = {
      type: "folder",
      children: {
        Drafts: { type: "folder", children: {} },
        Proposals: { type: "folder", children: {} },
        "Session-Notes": { type: "folder", children: {} },
      },
    };
  }

  // Code / tech / engineering
  if (/code|program|develop|engineer|software|hack|tech|comput|algorithm|data|system|cyber|ai|machine learn/.test(prompt + titleLower)) {
    themes.push("tech");
    root["Code"] = {
      type: "folder",
      children: {
        Projects: { type: "folder", children: {} },
        Snippets: { type: "folder", children: {} },
        Research: { type: "folder", children: {} },
      },
    };
  }

  // Creative / arts / music / writing
  if (/art|music|paint|sculpt|writ|poet|novel|compos|creat|design|film|direct|actor|theater|theatre|dance/.test(prompt + titleLower)) {
    themes.push("creative");
    root["Creative-Works"] = {
      type: "folder",
      children: {
        Drafts: { type: "folder", children: {} },
        "Finished-Pieces": { type: "folder", children: {} },
        Inspiration: { type: "folder", children: {} },
      },
    };
  }

  // Science / research / academic
  if (/scien|research|academ|profess|doctor|phd|laborat|experiment|theory|physic|chemist|biolog|math|philosoph/.test(prompt + titleLower)) {
    themes.push("science");
    root["Research"] = {
      type: "folder",
      children: {
        Papers: { type: "folder", children: {} },
        "Lab-Notes": { type: "folder", children: {} },
        Data: { type: "folder", children: {} },
      },
    };
  }

  // Military / strategy / combat
  if (/militar|strateg|combat|war|army|navy|soldier|general|command|battle|weapon|defense|security|intel/.test(prompt + titleLower)) {
    themes.push("military");
    root["Operations"] = {
      type: "folder",
      children: {
        "Mission-Briefs": { type: "folder", children: {} },
        Intelligence: { type: "folder", children: {} },
        "After-Action": { type: "folder", children: {} },
      },
    };
  }

  // Business / finance / commerce
  if (/business|financ|econom|trade|market|invest|bank|company|startup|entrepreneur|commerce|profit|revenue/.test(prompt + titleLower)) {
    themes.push("business");
    root["Business"] = {
      type: "folder",
      children: {
        Reports: { type: "folder", children: {} },
        Contacts: { type: "folder", children: {} },
        Plans: { type: "folder", children: {} },
      },
    };
  }

  // Mystical / occult / spiritual
  if (/magic|mystic|occult|spirit|ritual|prophecy|oracle|witch|wizard|sorcerer|alchemy|tarot|divine|sacred/.test(prompt + titleLower)) {
    themes.push("mystical");
    root["Grimoire"] = {
      type: "folder",
      children: {
        Rituals: { type: "folder", children: {} },
        Prophecies: { type: "folder", children: {} },
        "Arcane-Knowledge": { type: "folder", children: {} },
      },
    };
  }

  // If no themes matched, give a generic but useful structure
  if (themes.length === 0) {
    root["Projects"] = { type: "folder", children: {} };
    root["Collections"] = { type: "folder", children: {} };
  }

  // Always add a welcome file
  const welcomeName = name || "this character";
  root["Documents"]["readme.txt"] = {
    type: "file",
    content: `=== MyComputer — ${welcomeName} ===\n\nThis is ${welcomeName}'s personal computer.\nFolders have been set up based on their role and expertise.\n\n${welcomeName} can create, read, update, and delete files and folders here.\nThink of this as their personal knowledge base, inventory, and workspace.\n\nThemes detected: ${themes.length > 0 ? themes.join(", ") : "general"}\n`,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  };

  return root;
};

/**
 * Initialize or get file system for a persona.
 * @param {string} personaId
 * @param {object} meta - Optional character metadata for scaffolding { name, title, archetype, systemPrompt }
 */
export const getOrCreateFileSystem = (personaId, meta = {}) => {
  if (!fileSystemsStore.has(personaId)) {
    const root = generateDefaultFolders(personaId, meta);
    fileSystemsStore.set(personaId, { root });
  }
  return fileSystemsStore.get(personaId);
};

/**
 * Navigate to a folder within the file tree.
 */
export const navigateToFolder = (root, folderPath) => {
  if (folderPath === "/") return root;
  const parts = folderPath.split("/").filter(Boolean);
  let current = root;
  for (const part of parts) {
    if (!current[part] || current[part].type !== "folder") {
      return null;
    }
    current = current[part].children;
  }
  return current;
};

/**
 * Parse a path into parent path + name.
 */
export const getParentAndName = (path) => {
  const parts = path.split("/").filter(Boolean);
  const name = parts.pop();
  return { parentPath: "/" + parts.join("/"), name };
};

/**
 * Create a file or folder.
 */
export const createFileOrFolder = (root, path, name, type, content = "") => {
  const folder = navigateToFolder(root, path);
  if (!folder) return { error: "Parent folder not found" };
  if (folder[name]) return { error: "Item already exists" };

  if (type === "folder") {
    folder[name] = { type: "folder", children: {} };
  } else {
    folder[name] = {
      type: "file",
      content: content || "",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    };
  }
  return { success: true, item: folder[name] };
};

/**
 * Read file content.
 */
export const readFile = (root, path) => {
  const { parentPath, name } = getParentAndName(path);
  const parentFolder = navigateToFolder(root, parentPath);
  if (!parentFolder || !parentFolder[name]) return { error: "File not found" };
  if (parentFolder[name].type !== "file") return { error: "Not a file" };
  return { success: true, content: parentFolder[name].content };
};

/**
 * Update file content.
 */
export const updateFile = (root, path, content) => {
  const { parentPath, name } = getParentAndName(path);
  const parentFolder = navigateToFolder(root, parentPath);
  if (!parentFolder || !parentFolder[name]) return { error: "File not found" };
  if (parentFolder[name].type !== "file") return { error: "Not a file" };
  parentFolder[name].content = content;
  parentFolder[name].modified = new Date().toISOString();
  return { success: true };
};

/**
 * Delete file or folder.
 */
export const deleteFileOrFolder = (root, path) => {
  const { parentPath, name } = getParentAndName(path);
  const parentFolder = navigateToFolder(root, parentPath);
  if (!parentFolder || !parentFolder[name]) return { error: "Item not found" };
  delete parentFolder[name];
  return { success: true };
};

/**
 * List the full file tree recursively (for AI context).
 */
export const getFileTree = (root, prefix = "/") => {
  const lines = [];
  const getIcon = (name) => {
    const ext = (name || "").split(".").pop()?.toLowerCase();
    if (ext === "svg") return "🖼️";
    if (["js","jsx","ts","tsx","py","cs","java","cpp","go","rs"].includes(ext)) return "⚡";
    if (["html","css"].includes(ext)) return "🌐";
    if (["json","xml","yaml","yml"].includes(ext)) return "📋";
    return "📄";
  };
  for (const [name, item] of Object.entries(root)) {
    const fullPath = prefix === "/" ? `/${name}` : `${prefix}/${name}`;
    if (item.type === "folder") {
      lines.push(`📁 ${fullPath}/`);
      lines.push(...getFileTree(item.children, fullPath));
    } else {
      const size = item.content ? item.content.length : 0;
      lines.push(`${getIcon(name)} ${fullPath} (${size} chars)`);
    }
  }
  return lines;
};

export default fileSystemsStore;
