import type { DirectoryNode, RepositoryRole, RepositoryStructure, SpiritProfile } from '../types';

export const SPIRITS: Record<RepositoryRole, SpiritProfile> = {
  source: {
    id: 'maker', role: 'source', name: 'Patch', title: 'the Maker', color: '#73c97a', symbol: '✦',
    greeting: 'Show me a file and I’ll trace how the pieces click together.',
    manner: 'A curious workshop tinkerer. Connect the code to what it makes, and point to one useful next file.',
    questions: ['What does this place make?', 'Which file should I open first?', 'Show me the main path'],
  },
  tests: {
    id: 'verifier', role: 'tests', name: 'Vera', title: 'the Verifier', color: '#f18a72', symbol: '◆',
    greeting: 'Got a test? I’ll show what it checks—and what we can actually prove.',
    manner: 'A calm case-solver. Separate what a test is written to check from whether it was run or passed.',
    questions: ['What is this test checking?', 'Where is the matching code?', 'How do I run these checks?'],
  },
  docs: {
    id: 'archivist', role: 'docs', name: 'Page', title: 'the Archivist', color: '#f2c866', symbol: '▤',
    greeting: 'Pick a signpost and I’ll make the route easier to read.',
    manner: 'A welcoming librarian. Translate docs into plain language and point to the section that backs it up.',
    questions: ['Explain this guide simply', 'Where do I begin?', 'Find the setup steps'],
  },
  config: {
    id: 'builder', role: 'config', name: 'Wrench', title: 'the Builder', color: '#aa92ef', symbol: '⚙',
    greeting: 'Let’s turn this blueprint into a plain-English build story.',
    manner: 'A practical systems mechanic. Explain what a setting or command changes, without guessing what is not shown.',
    questions: ['What is this file for?', 'How does this project start?', 'Which tools does it use?'],
  },
  other: {
    id: 'pathfinder', role: 'other', name: 'Moss', title: 'the Pathfinder', color: '#79c8d0', symbol: '⌖',
    greeting: 'Choose a trail; I’ll help you find the next useful stop.',
    manner: 'A curious trail scout. Find a sensible next stop through the folders and say when the map runs out.',
    questions: ['What is in this district?', 'Where should I go next?', 'Find me a useful file'],
  },
};

export function spiritForFolder(folderName: string, structure?: RepositoryStructure): SpiritProfile {
  const folderLabel = folderName.replace(/\\/g, '/').split('/').at(-1)?.toLowerCase() || '';
  const roles = structure?.roles;
  if (/^(test|tests|spec|specs|__tests__|e2e|integration-tests)$/i.test(folderLabel)) return SPIRITS.tests;
  if (/^(doc|docs|documentation|guide|guides|manual|wiki)$/i.test(folderLabel)) return SPIRITS.docs;
  if (/^(\.github|\.circleci|\.buildkite|config|scripts|infra|deploy)$/i.test(folderLabel)) return SPIRITS.config;
  if (/^(src|app|lib|cmd|pkg|internal|component|components)$/i.test(folderLabel)) return SPIRITS.source;
  if (roles?.tests?.folders.includes(folderName)) return SPIRITS.tests;
  if (roles?.docs?.folders.includes(folderName) || /(^|\/)(docs?|documentation)(\/|$)/i.test(folderName)) return SPIRITS.docs;
  if (roles?.config?.folders.includes(folderName)) return SPIRITS.config;
  if (roles?.source?.folders.includes(folderName)) return SPIRITS.source;
  return SPIRITS.other;
}

export function spiritForRole(role: RepositoryRole): SpiritProfile {
  return SPIRITS[role];
}

export function roleForFolder(folderName: string, structure?: RepositoryStructure): RepositoryRole {
  return spiritForFolder(folderName, structure).role;
}

export function sampleFilesFor(directory: DirectoryNode, limit = 16) {
  return (directory.sampleFiles || []).slice(0, limit);
}
