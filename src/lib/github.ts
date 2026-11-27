import type { ChatMessage, RepositoryData, SpiritId } from '../types';
import type { DirectoryNode } from '../types';

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body as { error?: string }).error || 'That path could not be read.');
  return body as T;
}

export async function inspectRepository(url: string, signal?: AbortSignal) {
  const response = await fetch(`/api/repo?url=${encodeURIComponent(url)}`, { signal });
  return readJson<RepositoryData>(response);
}

export async function askSpirit(
  repository: RepositoryData,
  selectedFolder: string,
  spirit: SpiritId,
  conversation: ChatMessage[],
) {
  const folder = directoriesFor(repository).find((directory) => directory.name === selectedFolder);
  const rootFolder = Boolean(folder?.isRepositoryRoot);
  const files = folder?.sampleFiles || repository.files.filter((file) => rootFolder
    ? !file.path.includes('/')
    : file.path.startsWith(`${selectedFolder}/`));
  const question = [...conversation].reverse().find((message) => message.role === 'user')?.content || '';
  const response = await fetch('/api/tour', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repository: repository.repository,
      selectedFolder,
      rootFolder,
      spirit,
      question,
      conversation: conversation.slice(-6),
      files: files.slice(0, 18),
      languages: repository.languages,
      structure: { directories: repository.structure.directories.map(({ name }) => ({ name })) },
      readme: repository.readme.slice(0, 5000),
    }),
  });
  return readJson<{
    headline: string;
    answer: string;
    points: string[];
    nextStep: string;
    evidence: string[];
  }>(response);
}

export function directoriesFor(repository: RepositoryData): DirectoryNode[] {
  if (repository.structure.directories.length) return repository.structure.directories;
  const rootFiles = repository.files.filter((file) => !file.path.includes('/')).slice(0, 16);
  return [{ name: 'root', isRepositoryRoot: true, fileCount: repository.rootFileCount ?? rootFiles.length, children: [], sampleFiles: rootFiles }];
}

export function githubFileUrl(repositoryUrl: string, branch: string, path = '', kind: 'blob' | 'tree' = 'blob') {
  const repositoryPath = repositoryUrl.replace(/^https:\/\/github\.com\//i, '').replace(/\/$/, '');
  const safePath = path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  return `https://github.com/${repositoryPath}/${kind}/${encodeURIComponent(branch || 'main')}${safePath ? `/${safePath}` : ''}`;
}

export function formatCount(value: number) {
  return new Intl.NumberFormat('en', { notation: value > 999 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
}

export function timeAgo(value: string) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'unknown';
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function fileKind(path: string) {
  const name = path.split('/').at(-1) || path;
  const extension = name.includes('.') ? name.split('.').at(-1)?.toLowerCase() : '';
  if (['md', 'mdx', 'rst', 'txt'].includes(extension || '') || /^readme/i.test(name)) return 'note';
  if (['yml', 'yaml', 'toml', 'json', 'xml', 'ini'].includes(extension || '')) return 'plan';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'mp4', 'webm', 'mp3', 'wav'].includes(extension || '')) return 'media';
  if (['test', 'spec'].some((part) => name.toLowerCase().includes(part))) return 'test';
  return 'code';
}
