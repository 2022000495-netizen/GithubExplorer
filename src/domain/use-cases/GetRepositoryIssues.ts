import { RepositoryIssue } from '../models/RepositoryIssue'

export const REPOSITORY_ISSUES_PER_PAGE = 30

export interface GetRepositoryIssues {
  get(owner: string, repositoryName: string, page?: number): Promise<RepositoryIssue[]>
}
