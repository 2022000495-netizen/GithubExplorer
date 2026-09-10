import { describe, it, expect, vi } from 'vitest';
import { RemoteGetRepositoryPullRequests } from './RemoteGetRepositoryPullRequests';
import { HttpClientProtocol, HttpStatusCode } from '../protocols/http/HttpClientProtocol';
import { InvalidRepositoryError } from '@/domain/errors/InvalidRepositoryError';
import { UnexpectedError } from '@/domain/errors/UnexpectedError';

describe('RemoteGetRepositoryPullRequests', () => {
  it('should return pull requests on success', async () => {
    const mockHttpClient: HttpClientProtocol = {
      request: vi.fn().mockResolvedValue({
        statusCode: HttpStatusCode.ok,
        body: [
          {
            id: 1,
            title: 'Add feature X',
            html_url: 'https://github.com/owner/repo/pull/1',
            user: { login: 'user1' },
            created_at: '2024-01-01T10:00:00Z',
          },
          {
            id: 2,
            title: 'Fix bug Y',
            html_url: 'https://github.com/owner/repo/pull/2',
            user: { login: 'user2' },
            created_at: '2024-01-02T10:00:00Z',
          },
        ],
      }),
    };

    const useCase = new RemoteGetRepositoryPullRequests('https://api.github.com', mockHttpClient);
    const result = await useCase.get('owner', 'repo');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 1,
      title: 'Add feature X',
      linkTo: 'https://github.com/owner/repo/pull/1',
      createdBy: 'user1',
      createdAt: '2024-01-01T10:00:00Z',
    });
    expect(result[1]).toEqual({
      id: 2,
      title: 'Fix bug Y',
      linkTo: 'https://github.com/owner/repo/pull/2',
      createdBy: 'user2',
      createdAt: '2024-01-02T10:00:00Z',
    });
  });

  it('should throw InvalidRepositoryError on 404', async () => {
    const mockHttpClient: HttpClientProtocol = {
      request: vi.fn().mockResolvedValue({
        statusCode: HttpStatusCode.notFound,
      }),
    };

    const useCase = new RemoteGetRepositoryPullRequests('https://api.github.com', mockHttpClient);

    await expect(useCase.get('owner', 'nonexistent')).rejects.toThrow(InvalidRepositoryError);
  });

  it('should throw UnexpectedError on server error', async () => {
    const mockHttpClient: HttpClientProtocol = {
      request: vi.fn().mockResolvedValue({
        statusCode: HttpStatusCode.serverError,
      }),
    };

    const useCase = new RemoteGetRepositoryPullRequests('https://api.github.com', mockHttpClient);

    await expect(useCase.get('owner', 'repo')).rejects.toThrow(UnexpectedError);
  });

  it('should call the correct endpoint', async () => {
    const mockHttpClient: HttpClientProtocol = {
      request: vi.fn().mockResolvedValue({
        statusCode: HttpStatusCode.ok,
        body: [],
      }),
    };

    const useCase = new RemoteGetRepositoryPullRequests('https://api.github.com/repos', mockHttpClient);
    await useCase.get('facebook', 'react');

    expect(mockHttpClient.request).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.github.com/repos/facebook/react/pulls',
    });
  });

  it('should return empty array when no pull requests', async () => {
    const mockHttpClient: HttpClientProtocol = {
      request: vi.fn().mockResolvedValue({
        statusCode: HttpStatusCode.ok,
        body: [],
      }),
    };

    const useCase = new RemoteGetRepositoryPullRequests('https://api.github.com', mockHttpClient);
    const result = await useCase.get('owner', 'repo');

    expect(result).toEqual([]);
  });
});
