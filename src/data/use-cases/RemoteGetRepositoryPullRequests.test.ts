import { describe, it, expect, vi } from 'vitest'
import { RemoteGetRepositoryPullRequests } from './RemoteGetRepositoryPullRequests'
import { HttpStatusCode, HttpClientProtocol } from '../protocols/http/HttpClientProtocol'

describe('RemoteGetRepositoryPullRequests', () => {
  it('should return adapted pull requests on success', async () => {
    const httpClientMock: HttpClientProtocol = {
      request: vi.fn().mockResolvedValue({
        statusCode: HttpStatusCode.ok,
        body: [
          {
            id: 1,
            title: 'Add feature X',
            html_url: 'https://github.com/facebook/react/pull/1',
            user: { login: 'developer' },
            created_at: '2023-01-15T10:30:00Z',
          },
          {
            id: 2,
            title: 'Fix bug Y',
            html_url: 'https://github.com/facebook/react/pull/2',
            user: { login: 'another-dev' },
            created_at: '2023-01-20T14:45:00Z',
          },
        ],
      }),
    }

    const sut = new RemoteGetRepositoryPullRequests(
      'https://api.github.com/repos',
      httpClientMock
    )

    const result = await sut.get('facebook', 'react')

    expect(result).toEqual([
      {
        id: 1,
        title: 'Add feature X',
        linkTo: 'https://github.com/facebook/react/pull/1',
        createdBy: 'developer',
        createdAt: '1/15/2023',
      },
      {
        id: 2,
        title: 'Fix bug Y',
        linkTo: 'https://github.com/facebook/react/pull/2',
        createdBy: 'another-dev',
        createdAt: '1/20/2023',
      },
    ])
  })

  it('should call the correct endpoint', async () => {
    const httpClientMock: HttpClientProtocol = {
      request: vi.fn().mockResolvedValue({
        statusCode: HttpStatusCode.ok,
        body: [],
      }),
    }

    const sut = new RemoteGetRepositoryPullRequests(
      'https://api.github.com/repos',
      httpClientMock
    )

    await sut.get('facebook', 'react')

    expect(httpClientMock.request).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.github.com/repos/facebook/react/pulls',
    })
  })
})
